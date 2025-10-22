//
//  PricingView.swift
//  MaLoveApp
//
//  Vista de planes y precios con compra In-App
//

import SwiftUI
import StoreKit

struct PricingView: View {
    @StateObject private var storeManager = StoreKitManager()
    @State private var selectedProduct: Product?
    @State private var isPurchasing = false
    @State private var showingSuccess = false
    @State private var showingError = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    headerSection
                    
                    // Productos para Parejas
                    if !coupleProducts.isEmpty {
                        VStack(alignment: .leading, spacing: 16) {
                            sectionTitle("Para Parejas")
                            
                            ForEach(coupleProducts, id: \.id) { product in
                                ProductCard(
                                    product: product,
                                    isPurchased: storeManager.isPurchased(product),
                                    action: { handlePurchase(product) }
                                )
                            }
                        }
                    }
                    
                    // Productos para Planners
                    if !plannerProducts.isEmpty {
                        VStack(alignment: .leading, spacing: 16) {
                            sectionTitle("Para Wedding Planners")
                            
                            ForEach(plannerProducts, id: \.id) { product in
                                SubscriptionCard(
                                    product: product,
                                    storeManager: storeManager,
                                    action: { handlePurchase(product) }
                                )
                            }
                        }
                    }
                    
                    // Botón Restaurar Compras
                    Button(action: restorePurchases) {
                        Text("Restaurar Compras")
                            .foregroundColor(.blue)
                            .padding()
                    }
                }
                .padding()
            }
            .navigationTitle("Planes")
            .overlay {
                if storeManager.isLoading || isPurchasing {
                    ProgressView()
                        .scaleEffect(1.5)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black.opacity(0.3))
                }
            }
            .alert("¡Compra Exitosa!", isPresented: $showingSuccess) {
                Button("OK", role: .cancel) {}
            } message: {
                Text("Tu compra se ha procesado correctamente")
            }
            .alert("Error", isPresented: $showingError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(storeManager.errorMessage ?? "Ocurrió un error")
            }
        }
    }
    
    // MARK: - Computed Properties
    
    private var coupleProducts: [Product] {
        storeManager.products.filter { product in
            product.id.contains("weddingpass")
        }.sorted { $0.price < $1.price }
    }
    
    private var plannerProducts: [Product] {
        storeManager.products.filter { product in
            product.id.contains("planner") || product.id.contains("teams")
        }.sorted { $0.price < $1.price }
    }
    
    // MARK: - View Components
    
    private var headerSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "sparkles")
                .font(.system(size: 50))
                .foregroundColor(.purple)
            
            Text("Elige tu plan perfecto")
                .font(.title.bold())
            
            Text("Activa funcionalidades premium con un solo toque")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical)
    }
    
    private func sectionTitle(_ title: String) -> some View {
        Text(title)
            .font(.title2.bold())
            .padding(.top)
    }
    
    // MARK: - Actions
    
    private func handlePurchase(_ product: Product) {
        selectedProduct = product
        
        Task {
            isPurchasing = true
            defer { isPurchasing = false }
            
            do {
                let transaction = try await storeManager.purchase(product)
                
                if transaction != nil {
                    showingSuccess = true
                }
            } catch {
                storeManager.errorMessage = error.localizedDescription
                showingError = true
            }
        }
    }
    
    private func restorePurchases() {
        Task {
            await storeManager.restorePurchases()
        }
    }
}

// MARK: - Product Card (One-time purchases)

struct ProductCard: View {
    let product: Product
    let isPurchased: Bool
    let action: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(product.displayName)
                        .font(.headline)
                    
                    Text(product.description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
                
                Spacer()
                
                if isPurchased {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.title2)
                        .foregroundColor(.green)
                }
            }
            
            HStack {
                Text(product.displayPrice)
                    .font(.title2.bold())
                
                Spacer()
                
                Button(action: action) {
                    Text(isPurchased ? "Activado" : "Comprar")
                        .font(.subheadline.bold())
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(isPurchased ? Color.gray : Color.blue)
                        .cornerRadius(10)
                }
                .frame(width: 120)
                .disabled(isPurchased)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Subscription Card

struct SubscriptionCard: View {
    let product: Product
    @ObservedObject var storeManager: StoreKitManager
    let action: () -> Void
    
    @State private var isInTrial = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(product.displayName)
                        .font(.headline)
                    
                    if isInTrial {
                        Text("🎉 Prueba GRATIS por 30 días")
                            .font(.caption.bold())
                            .foregroundColor(.green)
                    }
                    
                    Text(product.description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(3)
                }
                
                Spacer()
            }
            
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(product.displayPrice)
                        .font(.title2.bold())
                    
                    if let period = subscriptionPeriod {
                        Text(period)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                Button(action: action) {
                    Text(isActive ? "Activo" : "Suscribirse")
                        .font(.subheadline.bold())
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(isActive ? Color.gray : Color.purple)
                        .cornerRadius(10)
                }
                .frame(width: 120)
                .disabled(isActive)
            }
        }
        .padding()
        .background(
            LinearGradient(
                colors: [Color.purple.opacity(0.1), Color.blue.opacity(0.1)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
        .task {
            isInTrial = await storeManager.isInTrialPeriod(for: product)
        }
    }
    
    private var isActive: Bool {
        storeManager.activeSubscriptions.contains { $0.id == product.id }
    }
    
    private var subscriptionPeriod: String? {
        guard let subscription = product.subscription else { return nil }
        
        switch subscription.subscriptionPeriod.unit {
        case .day:
            return "por día"
        case .week:
            return "por semana"
        case .month:
            return subscription.subscriptionPeriod.value == 1 ? "por mes" : "cada \(subscription.subscriptionPeriod.value) meses"
        case .year:
            return "por año"
        @unknown default:
            return nil
        }
    }
}

// MARK: - Preview

struct PricingView_Previews: PreviewProvider {
    static var previews: some View {
        PricingView()
    }
}
