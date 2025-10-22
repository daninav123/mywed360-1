# MaLoveApp iOS - StoreKit 2 Integration

Proyecto iOS con integración completa de Apple In-App Purchases usando StoreKit 2.

---

## 📱 Requisitos

- **Xcode:** 15.0 o superior
- **iOS Deployment Target:** 15.0 o superior
- **Swift:** 5.9
- **Mac:** macOS Sonoma o superior
- **Apple Developer Account:** $99/año

---

## 🚀 Setup del Proyecto

### **1. Crear Proyecto en Xcode**

```bash
# Abrir Xcode
# File > New > Project
# iOS > App
# 
# Product Name: MaLoveApp
# Team: Tu equipo de desarrollo
# Organization Identifier: com.maloveapp
# Bundle Identifier: com.maloveapp
# Interface: SwiftUI
# Language: Swift
```

### **2. Configurar Capabilities**

1. En Xcode, selecciona el target **MaLoveApp**
2. Tab **"Signing & Capabilities"**
3. Click **"+ Capability"**
4. Añadir:
   - ✅ **In-App Purchase**
   - ✅ **Push Notifications** (opcional, para notificaciones)

### **3. Añadir Archivos al Proyecto**

Arrastra los siguientes archivos a tu proyecto Xcode:

```
MaLoveApp/
├── App/
│   └── MaLoveAppApp.swift          # Entry point
├── Models/
│   └── StoreKitManager.swift       # 🆕 Gestor de StoreKit
├── Views/
│   ├── ContentView.swift
│   └── PricingView.swift           # 🆕 Vista de planes
└── Resources/
    └── Assets.xcassets
```

### **4. Configurar Info.plist**

No se requieren cambios especiales para StoreKit 2, pero asegúrate de tener:

```xml
<key>NSUserTrackingUsageDescription</key>
<string>Usamos esto para mostrarte ofertas personalizadas</string>
```

---

## 📝 Implementación

### **Paso 1: Entry Point (MaLoveAppApp.swift)**

```swift
import SwiftUI

@main
struct MaLoveAppApp: App {
    @StateObject private var storeManager = StoreKitManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(storeManager)
        }
    }
}
```

### **Paso 2: Vista Principal (ContentView.swift)**

```swift
import SwiftUI

struct ContentView: View {
    @EnvironmentObject var storeManager: StoreKitManager
    
    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Label("Inicio", systemImage: "house")
                }
            
            PricingView()
                .tabItem {
                    Label("Planes", systemImage: "star.fill")
                }
            
            ProfileView()
                .tabItem {
                    Label("Perfil", systemImage: "person")
                }
        }
    }
}
```

### **Paso 3: Usar StoreKitManager**

```swift
// En cualquier vista
@EnvironmentObject var storeManager: StoreKitManager

// Verificar si un producto está comprado
if storeManager.isPurchased(product) {
    // Mostrar contenido premium
    PremiumContent()
} else {
    // Mostrar botón de compra
    Button("Comprar \(product.displayPrice)") {
        Task {
            try await storeManager.purchase(product)
        }
    }
}

// Verificar suscripciones activas
if !storeManager.activeSubscriptions.isEmpty {
    Text("Tienes una suscripción activa")
}
```

---

## 🧪 Testing en Sandbox

### **1. Configurar Sandbox Tester**

Ya configurado en App Store Connect (ver `docs/APPLE-IAP-SETUP.md`).

### **2. Configurar Dispositivo**

En iPhone/iPad de prueba:

1. **Settings** > **App Store**
2. Sección **SANDBOX ACCOUNT**
3. Sign in: `test.maloveapp@icloud.com`

⚠️ **NUNCA** usar sandbox tester en iCloud, solo en App Store!

### **3. Ejecutar App**

```bash
# En Xcode
# 1. Seleccionar dispositivo (simulador o físico)
# 2. Product > Run (⌘R)
# 3. Navegar a "Planes"
# 4. Intentar comprar un producto
# 5. Confirmar con password del sandbox tester
```

### **4. Verificar Logs**

En Xcode Console (⌘⇧Y) verás:

```
✅ Productos cargados: 6
🛒 Iniciando compra: Wedding Pass
✅ Compra exitosa: Wedding Pass
✅ Backend notificado exitosamente
```

---

## 🔍 Debugging

### **Ver Transacciones Activas**

```swift
// En cualquier vista
Button("Ver Transacciones") {
    Task {
        for await result in Transaction.currentEntitlements {
            let transaction = try? result.payloadValue
            print("Transacción: \(transaction?.productID ?? "unknown")")
        }
    }
}
```

### **Logs Útiles**

```swift
// StoreKitManager.swift ya incluye logs extensivos:
print("✅ Productos cargados: \(products.count)")
print("🛒 Iniciando compra: \(product.displayName)")
print("📊 Suscripciones activas: \(activeSubscriptions.count)")
```

### **Errores Comunes**

| Error | Solución |
|-------|----------|
| "Cannot connect to iTunes Store" | Verifica sandbox tester configurado |
| "Products not found" | Verifica Product IDs en App Store Connect |
| "Purchase failed" | Revisa logs, puede ser sandbox tester inválido |
| "Receipt verification failed" | Backend no accesible o APPLE_SHARED_SECRET incorrecto |

---

## 🏗️ Estructura del Código

### **StoreKitManager.swift**

```
📦 StoreKitManager
├── @Published products: [Product]          # Productos cargados
├── @Published purchasedProductIDs: Set     # IDs comprados
├── @Published activeSubscriptions          # Suscripciones activas
│
├── func loadProducts()                     # Cargar desde App Store
├── func purchase(_ product)                # Comprar producto
├── func restorePurchases()                 # Restaurar compras
├── func updatePurchasedProducts()          # Actualizar estado
├── func listenForTransactions()            # Listener en tiempo real
└── func notifyBackend(transaction)         # Notificar a backend
```

### **PricingView.swift**

```
📱 PricingView
├── Header con título
├── Sección "Para Parejas"
│   └── ProductCard (one-time purchases)
├── Sección "Para Wedding Planners"
│   └── SubscriptionCard (suscripciones)
└── Botón "Restaurar Compras"
```

---

## 🔐 Seguridad

### **Verificación de Recibos**

El `StoreKitManager` automáticamente:

1. ✅ Verifica firma de Apple con `checkVerified()`
2. ✅ Envía receipt al backend para segunda verificación
3. ✅ Backend valida con Apple servers
4. ✅ Backend guarda en Firestore

### **No Almacenar Datos Sensibles**

❌ **NO guardes:**
- Receipt data en local
- Transaction IDs en plain text
- Product IDs en código hardcoded (usar enum)

✅ **SÍ guarda:**
- Solo estados (comprado/no comprado)
- Usar Keychain para tokens sensibles

---

## 📊 Monitoreo

### **Ver Estado de Suscripciones**

```swift
Button("Ver Suscripciones") {
    Task {
        for product in storeManager.products where product.type == .autoRenewable {
            if let status = await product.subscription?.status.first {
                print("Producto: \(product.displayName)")
                print("Estado: \(status.state)")
                print("Renueva: \(status.renewalInfo.willAutoRenew)")
            }
        }
    }
}
```

### **Exportar Logs**

```swift
// Implementar en StoreKitManager si necesitas logs detallados
func exportPurchaseHistory() async -> [String] {
    var history: [String] = []
    
    for await result in Transaction.all {
        if case .verified(let transaction) = result {
            history.append("\(transaction.productID) - \(transaction.purchaseDate)")
        }
    }
    
    return history
}
```

---

## 🚢 Publicación

### **Antes de Enviar a Review**

- [ ] Todos los productos creados en App Store Connect
- [ ] Screenshots listos (1284x2778 para iPhone 13 Pro Max)
- [ ] App Icon añadido (1024x1024)
- [ ] Privacy Policy URL configurada
- [ ] Server-to-Server Notifications configurado
- [ ] Backend en producción y funcionando
- [ ] Tested en dispositivo físico
- [ ] Tested con sandbox tester

### **Archive & Upload**

```bash
# En Xcode:
# 1. Product > Archive
# 2. Esperar que compile
# 3. Window > Organizer
# 4. Seleccionar archive
# 5. "Distribute App"
# 6. "App Store Connect"
# 7. "Upload"
# 8. Completar en App Store Connect
# 9. Submit for Review
```

### **Tiempos de Review**

- **Primera submission:** 3-7 días
- **Actualizaciones:** 1-3 días
- **Rechazos comunes:** Falta de metadata, screenshots incorrectos

---

## 📚 Recursos

- **StoreKit 2 Docs:** https://developer.apple.com/documentation/storekit
- **WWDC Videos:** https://developer.apple.com/videos/storekit
- **Human Interface Guidelines:** https://developer.apple.com/design/human-interface-guidelines/in-app-purchase
- **App Store Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/

---

## 🐛 Solución de Problemas

### **"Products array is empty"**

```swift
// Verificar que Product IDs coinciden exactamente
// App Store Connect: com.maloveapp.weddingpass
// Código: case weddingPass = "com.maloveapp.weddingpass"
```

### **"Purchase button does nothing"**

```swift
// Verificar sandbox tester
// Settings > App Store > Sandbox Account
```

### **"Backend not receiving transaction"**

```swift
// Verificar URL del backend
private let backendURL = "https://api.maloveapp.com"

// Verificar que backend esté accesible
curl https://api.maloveapp.com/api/apple/verify
```

---

**Última actualización:** 23 de octubre de 2025  
**Versión:** 1.0  
**Autor:** MaLoveApp Development Team
