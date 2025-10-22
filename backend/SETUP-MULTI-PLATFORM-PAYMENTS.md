# Configuración de Pagos Multi-Plataforma

Backend unificado que soporta pagos desde **Web (Stripe)**, **iOS (Apple)** y **Android (Google)**.

---

## 📂 Archivos Implementados

### **Rutas:**
- `routes/apple-payments.js` - Webhooks y verificación de Apple
- `routes/google-payments.js` - Webhooks y verificación de Google
- `routes/stripe.js` - Ya existente (Stripe web)
- `routes/stripe-webhook.js` - Ya existente

### **Servicios:**
- `services/applePaymentService.js` - Verificación de recibos Apple
- `services/googlePaymentService.js` - Verificación con Google Play API
- `services/subscriptionService.js` - Lógica unificada de suscripciones

### **Registro:**
- `index.js` - Rutas registradas en líneas 596-598

---

## 🔧 Variables de Entorno Necesarias

Añade a `backend/.env`:

```bash
# ========================================
# PAGOS MULTI-PLATAFORMA
# ========================================

# Stripe (Web) - Ya configurado
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Apple In-App Purchases (iOS)
APPLE_SHARED_SECRET=abc123...
APPLE_BUNDLE_ID=com.maloveapp

# Google Play Billing (Android)
GOOGLE_SERVICE_ACCOUNT_EMAIL=maloveapp@...iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\nXXX\n-----END PRIVATE KEY-----\n"
GOOGLE_PACKAGE_NAME=com.maloveapp
```

---

## 📱 Endpoints Disponibles

### **Apple (iOS)**

#### `POST /api/apple/webhook`
- **Auth:** No (Apple envía firma JWT)
- **Propósito:** Recibir notificaciones de Apple
- **Eventos:** SUBSCRIBED, DID_RENEW, EXPIRED, REFUND, etc.

#### `POST /api/apple/verify`
- **Auth:** Sí (requireAuth)
- **Body:**
  ```json
  {
    "receiptData": "base64...",
    "userId": "user123"
  }
  ```
- **Respuesta:**
  ```json
  {
    "success": true,
    "subscription": {
      "id": "sub_xxx",
      "productId": "com.maloveapp.plannerpack5.monthly",
      "status": "active",
      "expiresAt": "2025-11-01T00:00:00Z"
    }
  }
  ```

---

### **Google (Android)**

#### `POST /api/google/webhook`
- **Auth:** No (Google envía via Pub/Sub)
- **Propósito:** Recibir notificaciones de Google
- **Eventos:** SUBSCRIPTION_PURCHASED, SUBSCRIPTION_RENEWED, etc.

#### `POST /api/google/verify`
- **Auth:** Sí (requireAuth)
- **Body:**
  ```json
  {
    "purchaseToken": "xxx",
    "productId": "planner_pack5_monthly",
    "userId": "user123",
    "type": "subscription"
  }
  ```
- **Respuesta:**
  ```json
  {
    "success": true,
    "subscription": {
      "id": "sub_xxx",
      "productId": "planner_pack5_monthly",
      "status": "active",
      "expiresAt": "2025-11-01T00:00:00Z"
    }
  }
  ```

---

## 🗄️ Estructura en Firestore

```
users/{uid}/subscriptions/{subscriptionId}
{
  platform: 'stripe' | 'apple' | 'google',
  productId: 'planner_pack5_monthly',
  status: 'active' | 'cancelled' | 'expired' | 'past_due',
  currentPeriodEnd: Timestamp,
  
  // Stripe
  stripeSubscriptionId: 'sub_xxx',
  stripeCustomerId: 'cus_xxx',
  
  // Apple
  transactionId: '1000000xxx',
  originalTransactionId: '1000000xxx',
  
  // Google
  purchaseToken: 'xxx',
  orderId: 'GPA.xxx',
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## ⚙️ Configuración por Plataforma

### **1. Apple (iOS)**

#### **App Store Connect:**

1. Ve a https://appstoreconnect.apple.com
2. My Apps > Tu app > App Information
3. Copia el **App-Specific Shared Secret** → `APPLE_SHARED_SECRET`
4. General > App Information > Bundle ID → `APPLE_BUNDLE_ID`

#### **Productos:**

Crear en App Store Connect > Features > In-App Purchases:

```
com.maloveapp.weddingpass (65 EUR)
com.maloveapp.weddingpassplus (110.50 EUR)
com.maloveapp.plannerpack5.monthly (54.17 EUR/mes + trial 30d)
com.maloveapp.plannerpack5.annual (552.50 EUR)
... (resto de productos)
```

#### **Server-to-Server Notifications:**

1. App Store Connect > App > General > App Information
2. Production Server URL: `https://tuapi.com/api/apple/webhook`
3. Sandbox Server URL: `https://tuapi.com/api/apple/webhook`
4. Seleccionar: Version 2

---

### **2. Google (Android)**

#### **Google Play Console:**

1. Ve a https://play.google.com/console
2. Setup > API access
3. Click "Create new service account"
4. Sigue el enlace a Google Cloud Console
5. Crea service account con rol "Finance"
6. Genera clave JSON

#### **Extraer credenciales del JSON:**

```json
{
  "client_email": "maloveapp@...iam.gserviceaccount.com",  ← GOOGLE_SERVICE_ACCOUNT_EMAIL
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n"     ← GOOGLE_SERVICE_ACCOUNT_KEY
}
```

#### **Productos:**

Crear en Google Play Console > Monetization:

```
wedding_pass (65 EUR)
wedding_pass_plus (110.50 EUR)
planner_pack5_monthly (54.17 EUR/mes + trial 30d)
planner_pack5_annual (552.50 EUR)
... (resto de productos)
```

#### **Real-time Developer Notifications:**

1. Google Play Console > Monetization > Subscriptions
2. Setup > Cloud Pub/Sub topic
3. Create topic: `maloveapp-rtdn`
4. Añadir webhook endpoint: `https://tuapi.com/api/google/webhook`

---

## 🧪 Testing

### **Test de Apple (Sandbox):**

```bash
curl -X POST https://tuapi.com/api/apple/verify \
  -H "Authorization: Bearer {user_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "receiptData": "base64_receipt_from_ios_app",
    "userId": "test_user_123"
  }'
```

### **Test de Google (Sandbox):**

```bash
curl -X POST https://tuapi.com/api/google/verify \
  -H "Authorization: Bearer {user_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "purchaseToken": "test_purchase_token",
    "productId": "planner_pack5_monthly",
    "userId": "test_user_123",
    "type": "subscription"
  }'
```

---

## 🔄 Flujo de Compra

### **iOS:**

```
1. Usuario hace compra en app (StoreKit)
2. App recibe transactionId
3. App envía receiptData a /api/apple/verify
4. Backend verifica con Apple
5. Backend crea suscripción en Firestore
6. App confirma compra a usuario
7. Apple envía webhooks a /api/apple/webhook (renovaciones, etc.)
```

### **Android:**

```
1. Usuario hace compra en app (Play Billing)
2. App recibe purchaseToken
3. App envía token a /api/google/verify
4. Backend verifica con Google Play API
5. Backend crea suscripción en Firestore
6. App acknowledge la compra
7. Google envía webhooks a /api/google/webhook (renovaciones, etc.)
```

### **Web:**

```
1. Usuario hace clic en "Suscribirse"
2. Frontend crea sesión de Stripe
3. Usuario completa pago en Stripe Checkout
4. Stripe envía webhook a /api/stripe/webhook
5. Backend crea suscripción en Firestore
6. Usuario redirigido a success page
```

---

## 📊 Precios por Plataforma

| Producto | Web (Stripe) | iOS/Android (Stores) |
|----------|--------------|---------------------|
| Wedding Pass | 50 EUR | 65 EUR (+30%) |
| Wedding Pass Plus | 85 EUR | 110.50 EUR (+30%) |
| Pack 5 Mensual | 41.67 EUR/mes | 54.17 EUR/mes (+30%) |
| Pack 5 Anual | 425 EUR | 552.50 EUR (+30%) |

**Razón del +30%:** Compensar la comisión de Apple/Google (30% del precio).

---

## 🔐 Seguridad

### **Verificación de Webhooks:**

**Apple:**
- Firma JWT en campo `signedPayload`
- TODO: Implementar verificación con claves públicas de Apple

**Google:**
- Mensajes via Google Cloud Pub/Sub
- Verificación con Google Play API después de recibir

**Stripe:**
- Firma HMAC en header `Stripe-Signature`
- Ya implementado en `stripe-webhook.js`

---

## 📈 Monitoreo

### **Obtener estadísticas:**

```javascript
import { getSubscriptionStats } from './services/subscriptionService.js';

const stats = await getSubscriptionStats();
// {
//   total: 150,
//   byPlatform: { stripe: 100, apple: 30, google: 20 },
//   byStatus: { active: 120, cancelled: 15, expired: 15 }
// }
```

### **Expirar suscripciones viejas:**

```javascript
import { expireOldSubscriptions } from './services/subscriptionService.js';

// Ejecutar periódicamente (Cloud Function cada hora)
const result = await expireOldSubscriptions();
// { expired: 5 }
```

---

## ⚠️ TODOs Pendientes

- [ ] Implementar verificación real de firma JWT de Apple
- [ ] Añadir tests unitarios para servicios
- [ ] Configurar Cloud Function para expirar suscripciones
- [ ] Implementar retry logic en webhooks fallidos
- [ ] Añadir logging detallado con Winston
- [ ] Configurar Sentry para errores en producción
- [ ] Documentar proceso de migración Stripe → Apple/Google

---

## 📚 Recursos

- **Documentación completa:** `docs/PAYMENT-ARCHITECTURE.md`
- **Configuración Stripe:** `docs/STRIPE-SETUP.md`
- **Apple StoreKit:** https://developer.apple.com/documentation/storekit
- **Google Play Billing:** https://developer.android.com/google/play/billing

---

**Última actualización:** 23 de octubre de 2025  
**Estado:** Backend unificado implementado ✅  
**Pendiente:** Apps nativas iOS/Android
