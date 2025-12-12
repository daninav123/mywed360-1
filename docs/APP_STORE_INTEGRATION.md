# <N Integraci�n con App Store para Suscripciones iOS

## =� �ndice

1. [Descripci�n General](#descripci�n-general)
2. [Configuraci�n en App Store Connect](#configuraci�n-en-app-store-connect)
3. [Variables de Entorno](#variables-de-entorno)
4. [Endpoints Implementados](#endpoints-implementados)
5. [Flujo de Trabajo](#flujo-de-trabajo)
6. [Colecciones de Firestore](#colecciones-de-firestore)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## =� Descripci�n General

La integraci�n con App Store permite que el **panel de administraci�n vea autom�ticamente las suscripciones** compradas en la app de iOS.

###  Lo que est� implementado:

-  Webhook para recibir notificaciones de Apple
-  Validaci�n de receipts con servidores de Apple
-  Almacenamiento de suscripciones en Firestore
-  C�lculo autom�tico de MRR/ARR en el admin
-  Soporte para v2 de App Store Server Notifications
-  Idempotencia (evita duplicados)
-  Logging y auditor�a de eventos

---

## � Configuraci�n en App Store Connect

### **Paso 1: Crear Productos In-App**

1. Ve a [App Store Connect](https://appstoreconnect.apple.com)
2. Selecciona tu app � **Features** � **In-App Purchases**
3. Click en **+** para crear nuevos productos

**Productos recomendados:**

| Product ID | Tipo | Precio | Duraci�n |
|------------|------|--------|----------|
| `com.MaLove.App.premium.monthly` | Auto-Renewable Subscription | �9.99 | 1 mes |
| `com.MaLove.App.premium.yearly` | Auto-Renewable Subscription | �99.99 | 1 a�o |
| `com.MaLove.App.premium_plus.monthly` | Auto-Renewable Subscription | �19.99 | 1 mes |
| `com.MaLove.App.premium_plus.yearly` | Auto-Renewable Subscription | �199.99 | 1 a�o |

### **Paso 2: Obtener Shared Secret**

1. En App Store Connect � Tu app � **General** � **App Information**
2. Scroll down hasta **App-Specific Shared Secret**
3. Click en **Generate** si no existe
4. Copia el secret (lo necesitar�s para `.env`)

### **Paso 3: Configurar Server Notifications**

1. En App Store Connect � Tu app � **General** � **App Information**
2. Scroll down hasta **App Store Server Notifications**
3. Click en **Add Server URL**

**Production URL:**
```
https://tudominio.com/api/app-store/webhook
```

**Sandbox URL (testing):**
```
https://tudominio.com/api/app-store/webhook
```

4. Select **Version 2**  (importante)
5. Click en **Save**

### **Paso 4: Configurar Subscription Groups**

1. En **Features** � **Subscriptions**
2. Create a **Subscription Group** (ej: "Premium Plans")
3. Asigna todos tus productos al grupo
4. Configura los niveles (Basic � Premium � Premium Plus)

---

## = Variables de Entorno

A�ade a tu archivo `.env` del backend:

```env
# App Store Configuration
APP_STORE_SHARED_SECRET=tu_shared_secret_aqu�

# Opcional: Configuraci�n adicional
APP_STORE_BUNDLE_ID=com.maloveapp.app
NODE_ENV=production
```

� **IMPORTANTE:** Nunca subas el `.env` a Git. A��delo a `.gitignore`.

---

## =� Endpoints Implementados

### **1. POST `/api/app-store/webhook`**

**Prop�sito:** Recibe notificaciones autom�ticas de Apple

**Headers:**
```
Content-Type: application/json
```

**Body (ejemplo de Apple):**
```json
{
  "notificationType": "SUBSCRIBED",
  "notificationUUID": "12345-67890-abcde",
  "data": {
    "appAccountToken": "user_firebase_uid",
    "signedTransactionInfo": "eyJhbGc..."
  }
}
```

**Tipos de notificaciones soportadas:**
-  `SUBSCRIBED` - Nueva suscripci�n
-  `DID_RENEW` - Renovaci�n exitosa
-  `EXPIRED` - Suscripci�n expir�
-  `DID_FAIL_TO_RENEW` - Fallo en renovaci�n
-  `REFUND` - Reembolso procesado
-  `REVOKE` - Suscripci�n revocada
-  `DID_CHANGE_RENEWAL_STATUS` - Usuario cambi� renovaci�n autom�tica

---

### **2. POST `/api/app-store/verify-receipt`**

**Prop�sito:** Permite al cliente iOS validar un receipt manualmente

**Body:**
```json
{
  "receiptData": "base64_encoded_receipt",
  "userId": "firebase_user_id"
}
```

**Response:**
```json
{
  "valid": true,
  "subscription": {
    "productId": "com.MaLove.App.premium.monthly",
    "expiresDate": "2025-11-22T19:45:00.000Z"
  }
}
```

**Uso desde iOS:**
```swift
let receiptURL = Bundle.main.appStoreReceiptURL
let receiptData = try Data(contentsOf: receiptURL)
let base64Receipt = receiptData.base64EncodedString()

// POST a /api/app-store/verify-receipt
```

---

### **3. GET `/api/app-store/subscription/:userId`**

**Prop�sito:** Obtiene la suscripci�n activa de un usuario

**Response:**
```json
{
  "subscription": {
    "id": "original_transaction_id",
    "platform": "ios",
    "status": "active",
    "plan": "premium",
    "productId": "com.MaLove.App.premium.monthly",
    "purchaseDate": "2025-10-22T19:00:00.000Z",
    "expiresDate": "2025-11-22T19:00:00.000Z",
    "monthlyAmount": 9.99,
    "currency": "EUR"
  }
}
```

---

## =� Colecciones de Firestore

### **Collection: `subscriptions`**

```javascript
{
  // IDs de Apple
  transactionId: "1234567890",
  originalTransactionId: "0987654321", // Document ID
  productId: "com.MaLove.App.premium.monthly",
  
  // Estado
  status: "active" | "expired" | "past_due" | "refunded" | "canceled",
  platform: "ios",
  plan: "premium" | "premium_plus",
  interval: "month" | "year",
  
  // Usuario
  userId: "firebase_user_id", // Si disponible
  
  // Fechas
  purchaseDate: Timestamp,
  expiresDate: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  
  // Financiero
  amount: 9.99, // Precio del producto
  monthlyAmount: 9.99, // Normalizado a mensual
  currency: "EUR",
  
  // Metadata
  bundleId: "com.maloveapp.app",
  environment: "Production" | "Sandbox",
  lastNotificationType: "SUBSCRIBED",
  lastNotificationAt: Timestamp
}
```

### **Collection: `appStoreEvents`**

Auditor�a de todos los eventos recibidos:

```javascript
{
  notificationType: "SUBSCRIBED",
  data: { /* raw data from Apple */ },
  receivedAt: Timestamp
}
```

### **Actualizaci�n en `users/{uid}`**

Cuando se detecta una suscripci�n, tambi�n se actualiza:

```javascript
{
  subscription: "premium",
  subscriptionStatus: "active",
  subscriptionPlatform: "ios",
  subscriptionUpdatedAt: Timestamp
}
```

---

## = Flujo de Trabajo

### **Flujo Completo:**

```
1. Usuario compra en App Store
   �
2. Apple valida el pago
   �
3. Apple env�a webhook a tu backend
   POST /api/app-store/webhook
   �
4. Backend valida la firma (opcional)
   �
5. Backend parsea la transacci�n
   �
6. Backend guarda en Firestore:
   - Collection 'subscriptions'
   - Collection 'appStoreEvents'
   - Update 'users/{uid}'
   �
7. Admin ve la suscripci�n en dashboard
   �
8. Se calcula MRR/ARR autom�ticamente
```

### **Renovaciones Autom�ticas:**

```
Apple renueva la suscripci�n
   �
Webhook DID_RENEW
   �
Backend actualiza expiresDate
   �
Admin ve la renovaci�n
```

---

## >� Testing

### **Sandbox Environment**

1. **Crear usuarios de prueba:**
   - App Store Connect � Users and Access � Sandbox Testers
   - Crea un usuario de prueba con email �nico

2. **Configurar en iOS:**
   ```swift
   // En tu app iOS
   #if DEBUG
   StoreKit.Configuration.current = .sandbox
   #endif
   ```

3. **Probar compra:**
   - Usa el usuario sandbox en tu dispositivo
   - Realiza una compra de prueba
   - Las suscripciones sandbox renuevan cada 5 minutos

### **Test de Webhook**

App Store Connect puede enviar notificaciones de prueba:

1. Ve a tu app � App Information
2. Scroll a Server Notifications
3. Click en **Send Test Notification**
4. Verifica en tus logs:

```bash
# Logs del backend
[app-store] Procesando notificaci�n type=TEST
[app-store] Test notification recibida
```

### **Test Manual con cURL**

```bash
curl -X POST https://tubackend.com/api/app-store/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "notificationType": "TEST",
    "notificationUUID": "test-12345",
    "data": {}
  }'
```

---

## =' Troubleshooting

### **Problema: Webhook no recibe notificaciones**

 **Soluciones:**
1. Verifica que la URL sea accesible desde internet (no localhost)
2. Verifica que sea HTTPS en producci�n
3. Revisa que la URL termine en `/webhook`
4. Comprueba logs del backend: `grep "app-store" logs/*.log`

### **Problema: Receipt inv�lido**

 **Soluciones:**
1. Verifica que `APP_STORE_SHARED_SECRET` est� en `.env`
2. Usa sandbox URL para testing
3. Verifica que el receipt no est� expirado
4. Log del error:
```javascript
logger.error('[app-store] Error verificando receipt', { 
  status: result.status 
});
```

### **Problema: Usuario no identificado**

El webhook puede no incluir el `userId`. Soluciones:

 **Opci�n 1: App Account Token**
En tu app iOS, al crear la transacci�n:
```swift
let transaction = Transaction()
transaction.appAccountToken = UUID(uuidString: firebaseUID)
```

 **Opci�n 2: Verificaci�n manual**
El usuario valida el receipt despu�s de comprar:
```javascript
POST /api/app-store/verify-receipt
{
  "receiptData": "...",
  "userId": "firebase_uid"
}
```

 **Opci�n 3: Linking posterior**
Admin puede asociar manualmente en el dashboard.

### **Problema: Suscripciones duplicadas**

El sistema usa **idempotencia** con `notificationUUID`:

```javascript
// Evita procesar la misma notificaci�n dos veces
await seenOrMark(`appstore:${notificationUUID}`, 24 * 60 * 60);
```

Si a�n hay duplicados, verifica:
1. Que `originalTransactionId` se use como Document ID
2. Que `merge: true` est� en las escrituras de Firestore

---

## =� Ver en el Admin Dashboard

Una vez configurado, el admin ver� autom�ticamente:

### **1. KPI "Facturaci�n 30 d�as"**
Incluye pagos de iOS

### **2. M�tricas Econ�micas**
```
MRR: �X,XXX
ARR: �XX,XXX
Suscripciones activas: XX
```

### **3. Desglose por Plataforma**
```javascript
{
  ios: { users: 45, revenue: 449.55 },
  web: { users: 23, revenue: 229.77 }
}
```

---

## <� Mapeo de Productos

Configura tus product IDs en `app-store-webhook.js`:

```javascript
const PRODUCT_ID_TO_PLAN = {
  'com.MaLove.App.premium.monthly': { 
    plan: 'premium', 
    interval: 'month', 
    amount: 9.99 
  },
  'com.MaLove.App.premium.yearly': { 
    plan: 'premium', 
    interval: 'year', 
    amount: 99.99 
  },
  // ... a�ade tus productos aqu�
};
```

---

## =� Referencias

- [App Store Server Notifications v2](https://developer.apple.com/documentation/appstoreservernotifications)
- [Validating Receipts](https://developer.apple.com/documentation/appstorereceipts/verifyreceipt)
- [StoreKit 2](https://developer.apple.com/documentation/storekit)
- [Subscription Best Practices](https://developer.apple.com/app-store/subscriptions/)

---

##  Checklist de Implementaci�n

- [ ] Crear productos in-app en App Store Connect
- [ ] Obtener App Store Shared Secret
- [ ] A�adir `APP_STORE_SHARED_SECRET` a `.env`
- [ ] Configurar Server Notification URL (v2)
- [ ] Desplegar backend con HTTPS
- [ ] Crear usuario sandbox para testing
- [ ] Probar compra de prueba en sandbox
- [ ] Verificar que llegue webhook al backend
- [ ] Verificar que se guarde en Firestore
- [ ] Verificar que admin vea la suscripci�n
- [ ] Probar renovaci�n autom�tica
- [ ] Probar refund
- [ ] Documentar product IDs en el c�digo
- [ ] Configurar monitoreo de webhooks en producci�n

---

**�La integraci�n est� completa y lista para usar!** <�

Para cualquier duda, revisa los logs:
```bash
grep "app-store" backend/logs/*.log
```
