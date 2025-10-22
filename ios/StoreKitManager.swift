//
//  StoreKitManager.swift
//  MaLoveApp
//
//  Gestión de compras In-App con StoreKit 2
//  Soporta productos one-time y suscripciones con trial
//

import StoreKit
import SwiftUI

/// Product IDs definidos en App Store Connect
enum ProductID: String, CaseIterable {
    // Parejas (one-time)
    case weddingPass = "com.maloveapp.weddingpass"
    case weddingPassPlus = "com.maloveapp.weddingpassplus"
    
    // Planners (subscriptions)
    case plannerPack5 = "com.maloveapp.plannerpack5"
    case plannerPack15 = "com.maloveapp.plannerpack15"
    case teams40 = "com.maloveapp.teams40"
    case teamsUnlimited = "com.maloveapp.teamsunlimited"
    
    var displayName: String {
        switch self {
        case .weddingPass: return "Wedding Pass"
        case .weddingPassPlus: return "Wedding Pass Plus"
        case .plannerPack5: return "Pack 5 Bodas"
        case .plannerPack15: return "Pack 15 Bodas"
        case .teams40: return "Teams 40"
        case .teamsUnlimited: return "Teams Ilimitado"
        }
    }
}

/// Gestiona todas las operaciones de StoreKit
@MainActor
class StoreKitManager: ObservableObject {
    
    /// Productos disponibles cargados desde App Store
    @Published var products: [Product] = []
    
    /// IDs de transacciones de productos comprados
    @Published var purchasedProductIDs: Set<String> = []
    
    /// Suscripciones activas
    @Published var activeSubscriptions: [Product] = []
    
    /// Estado de carga
    @Published var isLoading = false
    
    /// Errores
    @Published var errorMessage: String?
    
    /// Task para escuchar actualizaciones de transacciones
    private var updateListenerTask: Task<Void, Error>?
    
    /// API Backend URL
    private let backendURL = "https://api.maloveapp.com"
    
    /// User ID del usuario actual
    private var userID: String {
        // TODO: Obtener del AuthManager
        return UserDefaults.standard.string(forKey: "userID") ?? ""
    }
    
    init() {
        // Iniciar listener de actualizaciones
        updateListenerTask = listenForTransactions()
        
        Task {
            await loadProducts()
            await updatePurchasedProducts()
        }
    }
    
    deinit {
        updateListenerTask?.cancel()
    }
    
    // MARK: - Cargar Productos
    
    /// Carga productos desde App Store
    func loadProducts() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let productIDs = ProductID.allCases.map { $0.rawValue }
            products = try await Product.products(for: productIDs)
            
            print("✅ Productos cargados: \(products.count)")
            products.forEach { product in
                print("  - \(product.displayName): \(product.displayPrice)")
            }
            
        } catch {
            errorMessage = "Error cargando productos: \(error.localizedDescription)"
            print("❌ Error cargando productos: \(error)")
        }
    }
    
    // MARK: - Comprar Producto
    
    /// Compra un producto (one-time o suscripción)
    func purchase(_ product: Product) async throws -> Transaction? {
        print("🛒 Iniciando compra: \(product.displayName)")
        
        let result = try await product.purchase()
        
        switch result {
        case .success(let verification):
            // Verificar la transacción
            let transaction = try checkVerified(verification)
            
            // Notificar al backend
            await notifyBackend(transaction: transaction)
            
            // Actualizar estado local
            await updatePurchasedProducts()
            
            // Finalizar transacción
            await transaction.finish()
            
            print("✅ Compra exitosa: \(product.displayName)")
            return transaction
            
        case .userCancelled:
            print("⏸️ Compra cancelada por usuario")
            return nil
            
        case .pending:
            print("⏳ Compra pendiente de aprobación")
            return nil
            
        @unknown default:
            print("❓ Resultado desconocido")
            return nil
        }
    }
    
    // MARK: - Restaurar Compras
    
    /// Restaura compras anteriores
    func restorePurchases() async {
        isLoading = true
        defer { isLoading = false }
        
        print("🔄 Restaurando compras...")
        
        do {
            try await AppStore.sync()
            await updatePurchasedProducts()
            print("✅ Compras restauradas")
        } catch {
            errorMessage = "Error restaurando compras: \(error.localizedDescription)"
            print("❌ Error restaurando compras: \(error)")
        }
    }
    
    // MARK: - Actualizar Estado de Compras
    
    /// Actualiza el estado de productos comprados
    func updatePurchasedProducts() async {
        var purchasedIDs: Set<String> = []
        var activeSubscriptionProducts: [Product] = []
        
        // Iterar sobre todas las transacciones actuales
        for await result in Transaction.currentEntitlements {
            do {
                let transaction = try checkVerified(result)
                
                // Si es una suscripción activa
                if let product = products.first(where: { $0.id == transaction.productID }),
                   product.type == .autoRenewable {
                    activeSubscriptionProducts.append(product)
                }
                
                purchasedIDs.insert(transaction.productID)
                
            } catch {
                print("❌ Error verificando transacción: \(error)")
            }
        }
        
        purchasedProductIDs = purchasedIDs
        activeSubscriptions = activeSubscriptionProducts
        
        print("📊 Productos comprados: \(purchasedIDs.count)")
        print("📊 Suscripciones activas: \(activeSubscriptions.count)")
    }
    
    // MARK: - Listener de Transacciones
    
    /// Escucha actualizaciones de transacciones en tiempo real
    func listenForTransactions() -> Task<Void, Error> {
        return Task.detached {
            for await result in Transaction.updates {
                do {
                    let transaction = try self.checkVerified(result)
                    
                    // Notificar al backend
                    await self.notifyBackend(transaction: transaction)
                    
                    // Actualizar estado
                    await self.updatePurchasedProducts()
                    
                    // Finalizar transacción
                    await transaction.finish()
                    
                    print("🔔 Transacción actualizada: \(transaction.productID)")
                    
                } catch {
                    print("❌ Error procesando actualización: \(error)")
                }
            }
        }
    }
    
    // MARK: - Verificación
    
    /// Verifica que una transacción sea legítima
    func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreError.failedVerification
        case .verified(let safe):
            return safe
        }
    }
    
    // MARK: - Backend Communication
    
    /// Notifica al backend sobre una transacción
    func notifyBackend(transaction: Transaction) async {
        guard !userID.isEmpty else {
            print("⚠️ User ID no disponible")
            return
        }
        
        // Obtener receipt data
        guard let receiptData = await getReceiptData() else {
            print("❌ No se pudo obtener receipt data")
            return
        }
        
        let payload: [String: Any] = [
            "receiptData": receiptData,
            "userId": userID,
            "transactionId": String(transaction.id),
            "productId": transaction.productID
        ]
        
        guard let url = URL(string: "\(backendURL)/api/apple/verify") else {
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // TODO: Añadir token de autenticación
        // request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                if httpResponse.statusCode == 200 {
                    print("✅ Backend notificado exitosamente")
                    
                    if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                        print("   Respuesta: \(json)")
                    }
                } else {
                    print("⚠️ Backend respondió con código: \(httpResponse.statusCode)")
                }
            }
            
        } catch {
            print("❌ Error notificando al backend: \(error)")
        }
    }
    
    /// Obtiene el receipt data del dispositivo
    func getReceiptData() async -> String? {
        guard let receiptURL = Bundle.main.appStoreReceiptURL,
              let receiptData = try? Data(contentsOf: receiptURL) else {
            return nil
        }
        
        return receiptData.base64EncodedString()
    }
    
    // MARK: - Helpers
    
    /// Verifica si un producto está comprado
    func isPurchased(_ product: Product) -> Bool {
        return purchasedProductIDs.contains(product.id)
    }
    
    /// Obtiene información de suscripción
    func subscriptionStatus(for product: Product) async -> Product.SubscriptionInfo.Status? {
        guard product.type == .autoRenewable else { return nil }
        
        let statuses = try? await product.subscription?.status
        return statuses?.first
    }
    
    /// Verifica si está en período de prueba
    func isInTrialPeriod(for product: Product) async -> Bool {
        guard let status = await subscriptionStatus(for: product) else {
            return false
        }
        
        switch status.state {
        case .subscribed:
            return status.transaction.offerType == .introductory
        default:
            return false
        }
    }
}

// MARK: - Errores

enum StoreError: Error {
    case failedVerification
    case productNotFound
    case purchaseFailed
    case restoreFailed
}

extension StoreError: LocalizedError {
    var errorDescription: String? {
        switch self {
        case .failedVerification:
            return "La verificación de la compra falló"
        case .productNotFound:
            return "Producto no encontrado"
        case .purchaseFailed:
            return "La compra falló"
        case .restoreFailed:
            return "No se pudieron restaurar las compras"
        }
    }
}
