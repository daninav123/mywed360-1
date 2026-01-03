# Arquitectura de Pagos Multi-Plataforma - MaLoveApp

> Sistema híbrido que soporta pagos desde WEB (Stripe) y apps nativas (Apple/Google)

---

## 🎯 Requisitos del Sistema

### **Canales de Pago:**

1. **Web (navegador)** → Stripe
2. **App iOS (App Store)** → Apple In-App Purchases
3. **App Android (Google Play)** → Google Play Billing

### **Comportamiento:**
- Usuario puede suscribirse desde cualquier canal
- La suscripción se sincroniza en todos los dispositivos
- Un solo backend gestiona todas las plataformas

---

## 📱 CANAL 1: Apps Nativas (iOS + Android)

### **iOS - Apple In-App Purchases**

#### **Configuración requerida:**

1. **Apple Developer Account**
   - Costo: $99 USD/año
   - URL: https://developer.apple.com/programs/

2. **App Store Connect**
   - Crear productos de suscripción
   - Configurar grupos de suscripción
   - Configurar precios por país

3. **StoreKit 2 (SDK de Apple)**
   - Integración en app Swift/SwiftUI
   - Manejo de transacciones
   - Verificación de recibos

4. **Productos a crear:**

> **IMPORTANTE:** Precios en stores son 30% más altos que web para compensar comisión de Apple/Google

```swift
// Wedding Pass - Pago único
Product ID: com.maloveapp.weddingpass
Type: Non-consumable
Price: 65 EUR (web: 50 EUR + 30%)

// Wedding Pass Plus - Pago único
Product ID: com.maloveapp.weddingpassplus
Type: Non-consumable
Price: 110.50 EUR (web: 85 EUR + 30%)

// Planner Pack 5 - Mensual
Product ID: com.maloveapp.plannerpack5.monthly
Type: Auto-renewable subscription
Price: 54.17 EUR/mes (web: 41.67 EUR + 30%)
Free Trial: 30 días

// Planner Pack 5 - Anual
Product ID: com.maloveapp.plannerpack5.annual
Type: Auto-renewable subscription
Price: 552.50 EUR/año (web: 425 EUR + 30%)

// Planner Pack 15 - Mensual
Product ID: com.maloveapp.plannerpack15.monthly
Type: Auto-renewable subscription
Price: 146.25 EUR/mes (web: 112.50 EUR + 30%)
Free Trial: 30 días

// Planner Pack 15 - Anual
Product ID: com.maloveapp.plannerpack15.annual
Type: Auto-renewable subscription
Price: 1491.75 EUR/año (web: 1147.50 EUR + 30%)

// Teams 40 - Mensual
Product ID: com.maloveapp.teams40.monthly
Type: Auto-renewable subscription
Price: 346.67 EUR/mes (web: 266.67 EUR + 30%)
Free Trial: 30 días

// Teams 40 - Anual
Product ID: com.maloveapp.teams40.annual
Type: Auto-renewable subscription
Price: 3536 EUR/año (web: 2720 EUR + 30%)

// Teams Unlimited - Mensual
Product ID: com.maloveapp.teamsunlimited.monthly
Type: Auto-renewable subscription
Price: 541.67 EUR/mes (web: 416.67 EUR + 30%)
Free Trial: 30 días

// Teams Unlimited - Anual
Product ID: com.maloveapp.teamsunlimited.annual
Type: Auto-renewable subscription
Price: 5525 EUR/año (web: 4250 EUR + 30%)
```

#### **Código de integración (Swift):**

```swift
import StoreKit

// 1. Cargar productos
@MainActor
func loadProducts() async throws -> [Product] {
    let productIds = [
        "com.maloveapp.weddingpass",
        "com.maloveapp.plannerpack5.monthly",
        // ... más IDs
    ]
    
    return try await Product.products(for: productIds)
}

// 2. Comprar producto (con Apple Pay = doble click)
func purchase(_ product: Product) async throws -> Transaction? {
    let result = try await product.purchase()
    
    switch result {
    case .success(let verification):
        let transaction = try checkVerified(verification)
        await transaction.finish()
        
        // Enviar a backend
        await notifyBackend(transaction)
        
        return transaction
        
    case .userCancelled, .pending:
        return nil
        
    @unknown default:
        return nil
    }
}

// 3. Notificar al backend
func notifyBackend(_ transaction: Transaction) async {
    let receipt = transaction.jsonRepresentation
    
    let response = try? await URLSession.shared.upload(
        for: URLRequest(url: URL(string: "https://api.maloveapp.com/api/apple/verify")!),
        from: receipt.data(using: .utf8)!
    )
}
```

#### **Webhook de Apple (Server Notifications V2):**

Apple enviará notificaciones a tu backend:

```
Endpoint: https://api.maloveapp.com/api/apple/webhook
Eventos:
- SUBSCRIBED (nueva suscripción)
- DID_RENEW (renovación)
- DID_FAIL_TO_RENEW (fallo de pago)
- DID_CHANGE_RENEWAL_STATUS (cancelación)
```

---

### **Android - Google Play Billing**

#### **Configuración requerida:**

1. **Google Play Console**
   - Cuenta de desarrollador: $25 USD (pago único)
   - URL: https://play.google.com/console

2. **Productos a crear:**

```
// Wedding Pass - Pago único
Product ID: wedding_pass
Type: In-app product (one-time)
Price: 50 EUR

// Planner Pack 5 - Mensual
Product ID: planner_pack5_monthly
Type: Subscription
Base plan: Monthly (41.67 EUR)
Free trial: 30 days

// Planner Pack 5 - Anual
Product ID: planner_pack5_annual
Type: Subscription
Base plan: Annual (425 EUR)
```

#### **Código de integración (Kotlin):**

```kotlin
import com.android.billingclient.api.*

class BillingManager(private val context: Context) {
    
    private lateinit var billingClient: BillingClient
    
    fun initialize() {
        billingClient = BillingClient.newBuilder(context)
            .setListener(purchasesUpdatedListener)
            .enablePendingPurchases()
            .build()
            
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    queryProducts()
                }
            }
            
            override fun onBillingServiceDisconnected() {
                // Reintentar conexión
            }
        })
    }
    
    fun queryProducts() {
        val productList = listOf(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId("wedding_pass")
                .setProductType(BillingClient.ProductType.INAPP)
                .build(),
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId("planner_pack5_monthly")
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        )
        
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(productList)
            .build()
            
        billingClient.queryProductDetailsAsync(params) { billingResult, productDetailsList ->
            // Mostrar productos
        }
    }
    
    fun purchase(activity: Activity, productDetails: ProductDetails) {
        val flowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(
                listOf(
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(productDetails)
                        .build()
                )
            )
            .build()
            
        billingClient.launchBillingFlow(activity, flowParams)
    }
    
    private val purchasesUpdatedListener = PurchasesUpdatedListener { billingResult, purchases ->
        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (purchase in purchases) {
                handlePurchase(purchase)
            }
        }
    }
    
    private fun handlePurchase(purchase: Purchase) {
        // Verificar en backend
        verifyPurchaseWithBackend(purchase.purchaseToken)
        
        // Acknowledgear compra
        if (!purchase.isAcknowledged) {
            val params = AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(purchase.purchaseToken)
                .build()
                
            billingClient.acknowledgePurchase(params) { billingResult ->
                // Compra completada
            }
        }
    }
}
```

#### **Webhook de Google (Real-time Developer Notifications):**

```
Endpoint: https://api.maloveapp.com/api/google/webhook
Eventos:
- SUBSCRIPTION_PURCHASED
- SUBSCRIPTION_RENEWED
- SUBSCRIPTION_CANCELED
- SUBSCRIPTION_EXPIRED
```

---

## 🌐 CANAL 2: Web (Stripe)

**Ya configurado** ✅

Ver: `docs/STRIPE-SETUP.md`

---

## 🔄 Backend Unificado

### **Arquitectura:**

```
┌─────────────────────────────────────────────────┐
│              USUARIOS                            │
├──────────┬───────────────┬──────────────────────┤
│   Web    │   iOS App     │   Android App        │
│ (Stripe) │ (Apple IAP)   │ (Google Play)        │
└────┬─────┴───────┬───────┴──────────┬───────────┘
     │             │                  │
     ▼             ▼                  ▼
┌─────────────────────────────────────────────────┐
│           BACKEND (Node.js/Express)             │
├─────────────────────────────────────────────────┤
│                                                  │
│  /api/stripe/webhook  ◄── Stripe                │
│  /api/apple/webhook   ◄── Apple                 │
│  /api/google/webhook  ◄── Google                │
│                                                  │
│  Lógica de unificación:                         │
│  - Verificar recibos                            │
│  - Crear/actualizar suscripción en Firestore   │
│  - Sincronizar estado entre plataformas        │
└─────────────────────────────────────────────────┘
                    │
                    ▼
           ┌────────────────┐
           │   Firestore    │
           │                │
           │  users/{uid}/  │
           │  - subscriptions│
           │  - platform     │
           │  - status       │
           └────────────────┘
```

### **Endpoints necesarios:**

```javascript
// backend/routes/payments.js

// 1. Webhook de Stripe (ya existe)
router.post('/stripe/webhook', async (req, res) => {
  // Validar firma
  // Procesar evento
  // Actualizar Firestore
});

// 2. Webhook de Apple (NUEVO)
router.post('/apple/webhook', async (req, res) => {
  const notification = req.body;
  
  // Verificar firma JWT
  const verified = await verifyAppleNotification(notification);
  
  if (verified) {
    await processAppleSubscription(notification);
  }
  
  res.sendStatus(200);
});

// 3. Webhook de Google (NUEVO)
router.post('/google/webhook', async (req, res) => {
  const message = req.body.message;
  const data = JSON.parse(Buffer.from(message.data, 'base64').toString());
  
  await processGoogleSubscription(data);
  res.sendStatus(200);
});

// 4. Verificar recibo de Apple (NUEVO)
router.post('/apple/verify', async (req, res) => {
  const { receiptData, transactionId } = req.body;
  
  // Verificar con Apple
  const verification = await verifyWithApple(receiptData);
  
  if (verification.valid) {
    await createSubscriptionInFirestore({
      userId: req.user.uid,
      platform: 'apple',
      transactionId,
      productId: verification.productId,
      expiresAt: verification.expiresDate
    });
  }
  
  res.json({ success: true });
});

// 5. Verificar compra de Google (NUEVO)
router.post('/google/verify', async (req, res) => {
  const { purchaseToken, productId } = req.body;
  
  // Verificar con Google API
  const verification = await verifyWithGoogle(purchaseToken, productId);
  
  if (verification.valid) {
    await createSubscriptionInFirestore({
      userId: req.user.uid,
      platform: 'google',
      purchaseToken,
      productId,
      expiresAt: verification.expiryTimeMillis
    });
  }
  
  res.json({ success: true });
});
```

### **Estructura en Firestore:**

```javascript
// users/{uid}/subscriptions/{subscriptionId}
{
  platform: 'stripe' | 'apple' | 'google',
  productId: 'planner_pack5_monthly',
  status: 'active' | 'expired' | 'cancelled',
  currentPeriodEnd: Timestamp,
  
  // Específico de cada plataforma
  stripeSubscriptionId: 'sub_xxx', // Si es Stripe
  appleTransactionId: '1000000xxx', // Si es Apple
  googlePurchaseToken: 'xxx', // Si es Google
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 💰 Comparativa de Comisiones

| Plataforma | Comisión | Notas |
|------------|----------|-------|
| **Stripe (Web)** | 1.4% + 0.25€ | Sin comisión adicional |
| **Apple IAP** | 30% (primer año)<br>15% (a partir año 2) | Apple se queda con el 30% |
| **Google Play** | 30% (primer año)<br>15% (a partir año 2) | Google se queda con el 30% |

### **Ejemplo de ingresos:**

**Planner Pack 5 Mensual (41,67€):**

| Plataforma | Precio Usuario | Tu ingreso | Comisión |
|------------|----------------|------------|----------|
| Web (Stripe) | 41,67€ | ~40,95€ | 0,72€ |
| Apple IAP | 41,67€ | 29,17€ | 12,50€ |
| Google Play | 41,67€ | 29,17€ | 12,50€ |

**Diferencia:** Ganas **~11,78€ más** por suscripción si el usuario paga desde la web.

---

## 📋 Checklist de Implementación

### **Configuración de cuentas:**
- [ ] Apple Developer Account creada ($99/año)
- [ ] Google Play Console creada ($25 pago único)
- [ ] Productos creados en App Store Connect
- [ ] Productos creados en Google Play Console
- [ ] Webhooks configurados en ambas plataformas

### **Desarrollo backend:**
- [ ] Endpoint `/api/apple/webhook` implementado
- [ ] Endpoint `/api/google/webhook` implementado
- [ ] Endpoint `/api/apple/verify` implementado
- [ ] Endpoint `/api/google/verify` implementado
- [ ] Lógica de unificación de suscripciones
- [ ] Sincronización con Firestore

### **Desarrollo apps nativas:**
- [ ] App iOS desarrollada en Swift/SwiftUI
- [ ] StoreKit 2 integrado
- [ ] App Android desarrollada en Kotlin
- [ ] Google Play Billing integrado
- [ ] Flujo de compra con Apple Pay (doble click)
- [ ] Flujo de compra con Google Pay

### **Testing:**
- [ ] Sandbox de Apple configurado
- [ ] Test de compras en iOS
- [ ] Sandbox de Google configurado
- [ ] Test de compras en Android
- [ ] Verificación de webhooks
- [ ] Sincronización entre plataformas

### **Producción:**
- [ ] Apps aprobadas en stores
- [ ] Webhooks en producción
- [ ] Monitoreo de transacciones
- [ ] Sistema de soporte

---

## ⚠️ IMPORTANTE: Restricciones de Apple

**Apple NO permite mencionar precios más baratos en la web:**

❌ **Prohibido en la app:**
- "Compra más barato en nuestra web"
- Mostrar precios de Stripe
- Links directos a checkout web

✅ **Permitido:**
- Tener precios diferentes (pero sin mencionarlo en la app)
- Link genérico a tu web (sin mencionar pagos)

**Solución:**
- En la app: Solo mostrar compra con IAP
- En la web: Mostrar compra con Stripe
- Email marketing: Puedes mencionar que web es más barato

---

## 🚀 Orden de Implementación Recomendado

### **Fase 1: Web (1-2 semanas)** ✅
- Stripe ya configurado
- Checkout funcional

### **Fase 2: Backend unificado (2-3 semanas)**
- Endpoints de Apple/Google
- Lógica de sincronización
- Testing

### **Fase 3: App iOS (4-6 semanas)**
- Desarrollo app
- Integración StoreKit
- Review de Apple

### **Fase 4: App Android (4-6 semanas)**
- Desarrollo app
- Integración Google Play Billing
- Review de Google

**Total estimado: 3-4 meses** para tener las 3 plataformas operativas.

---

## 📚 Recursos

### **Apple:**
- [StoreKit 2 Documentation](https://developer.apple.com/documentation/storekit)
- [App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications)
- [In-App Purchase Programming Guide](https://developer.apple.com/in-app-purchase/)

### **Google:**
- [Google Play Billing Library](https://developer.android.com/google/play/billing)
- [Real-time Developer Notifications](https://developer.android.com/google/play/billing/rtdn-reference)
- [Subscriptions Guide](https://developer.android.com/google/play/billing/subscriptions)

### **Stripe:**
- Ver `docs/STRIPE-SETUP.md`

---

**Última actualización:** 23 de octubre de 2025
