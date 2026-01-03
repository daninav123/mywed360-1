# Configuración de Apple In-App Purchases - MaLoveApp

Guía paso a paso para configurar pagos en iOS con Apple StoreKit 2.

---

## 📋 PASO 1: Crear Cuenta Apple Developer

### **Requisitos:**
- Mac con macOS (necesario para desarrollo iOS)
- Apple ID personal

### **Proceso:**

1. Ve a https://developer.apple.com/programs/enroll/
2. Click en **"Start Your Enrollment"**
3. Inicia sesión con tu Apple ID
4. Selecciona **"Individual"** (99 USD/año)
5. Completa información personal
6. Acepta términos y condiciones
7. Pago: 99 USD/año (tarjeta de crédito o Apple Pay)
8. **Espera aprobación** (24-48 horas normalmente)

**Costo anual:** $99 USD

---

## 📱 PASO 2: Configurar App en App Store Connect

### **2.1. Crear App**

1. Ve a https://appstoreconnect.apple.com
2. Click en **"My Apps"** > **"+"** > **"New App"**
3. Completa información:
   ```
   Platforms: iOS
   Name: MaLoveApp
   Primary Language: Spanish
   Bundle ID: com.maloveapp (crear nuevo)
   SKU: MALOVEAPP001
   User Access: Full Access
   ```
4. Click **"Create"**

### **2.2. Configurar App Information**

1. En tu app > **General** > **App Information**
2. Bundle ID: `com.maloveapp`
3. Copia el **App-Specific Shared Secret**:
   - Scroll hasta "App-Specific Shared Secret"
   - Click "Generate" si no existe
   - **COPIA EL SECRET** → Lo necesitas para el `.env`

```bash
# Añadir a backend/.env:
APPLE_SHARED_SECRET=abc123def456...
APPLE_BUNDLE_ID=com.maloveapp
```

---

## 💰 PASO 3: Crear Productos In-App (10 productos)

### **Navegación:**
App Store Connect > My Apps > MaLoveApp > **Features** > **In-App Purchases**

---

### **3.1. PAREJAS (2 productos de pago único)**

#### **Producto 1: Wedding Pass**

1. Click **"+"** > **"Non-Consumable"**
2. **Reference Name:** `Wedding Pass`
3. **Product ID:** `com.maloveapp.weddingpass`
4. Click **"Create"**

**Pricing:**
1. En la sección "Subscription Pricing"
2. Click **"+"** para añadir precio
3. **Price:** `65 EUR` (equivalente a ~$70 USD)
4. **Availability:** Todos los países
5. Click **"Next"** > **"Create"**

**Metadata:**
- **Display Name (Spanish):** Wedding Pass
- **Description (Spanish):** 
  ```
  Activa tu boda con funcionalidades completas: invitados ilimitados, 
  plantillas premium, contacto directo con proveedores y más. 
  Pago único válido hasta 30 días después de tu boda.
  ```

**App Store Promotion (opcional):**
- **Promotional Image:** 1024x1024 px
- Puedes omitir por ahora

**Review Information:**
- **Screenshot:** Captura de la app mostrando el producto
- Por ahora puedes usar una placeholder

Click **"Save"**

---

#### **Producto 2: Wedding Pass Plus**

1. Click **"+"** > **"Non-Consumable"**
2. **Reference Name:** `Wedding Pass Plus`
3. **Product ID:** `com.maloveapp.weddingpassplus`
4. **Price:** `110.50 EUR` (~$118 USD)
5. **Display Name (Spanish):** Wedding Pass Plus
6. **Description (Spanish):**
   ```
   Todo lo de Wedding Pass más: eliminación total de marca MaLoveApp, 
   biblioteca completa de diseños premium, editor web avanzado, 
   galería de recuerdos y 1 ayudante con acceso completo.
   ```
7. Click **"Save"**

---

### **3.2. PLANNERS (8 productos de suscripción)**

> Cada pack tiene DOS precios: Mensual (con trial) y Anual (descuento 15%)

#### **Producto 3: Planner Pack 5**

1. Click **"+"** > **"Auto-Renewable Subscription"**
2. **Reference Name:** `Planner Pack 5`
3. **Product ID:** `com.maloveapp.plannerpack5`
4. Click **"Create"**

**Subscription Group:**
- Si es el primero: Click "Create Subscription Group"
  - **Group Name:** `Planner Packs`
  - **Group Reference Name:** `planner_packs`
- Si ya existe: Seleccionar "Planner Packs"

**Crear precio MENSUAL:**
1. En "Subscription Prices"
2. Click **"+"** 
3. **Duration:** `1 month`
4. **Price:** `54.17 EUR` (~$58 USD)
5. **Free Trial:** 
   - Click **"Add Free Trial"**
   - Duration: `1 month` (30 días)
   - Eligibility: `New Subscribers Only`
6. **Introductory Offer:** None (el trial ya es la oferta)
7. Click **"Next"** > **"Create"**

**Crear precio ANUAL:**
1. Click **"+"** para añadir otro precio
2. **Duration:** `1 year`
3. **Price:** `552.50 EUR` (~$590 USD)
4. **Free Trial:** None (solo en mensual)
5. Click **"Next"** > **"Create"**

**Metadata:**
- **Display Name (Spanish):** Pack 5 Bodas
- **Description (Spanish):**
   ```
   Gestiona hasta 5 bodas simultáneamente con todas las herramientas 
   profesionales. Incluye 1 mes de prueba GRATIS en plan mensual.
   Ahorra 15% pagando anualmente.
   ```

**Subscription Duration Display:**
- Para mensual: "1 mes" con "Prueba gratuita de 1 mes"
- Para anual: "1 año"

Click **"Save"**

---

#### **Producto 4: Planner Pack 15**

Repetir el proceso anterior:

- **Product ID:** `com.maloveapp.plannerpack15`
- **Subscription Group:** `Planner Packs` (mismo grupo)
- **Precio Mensual:** `146.25 EUR` + trial 30 días
- **Precio Anual:** `1491.75 EUR`
- **Display Name:** Pack 15 Bodas
- **Description:** Gestiona hasta 15 bodas simultáneamente...

---

#### **Producto 5: Teams 40**

- **Product ID:** `com.maloveapp.teams40`
- **Subscription Group:** `Planner Packs`
- **Precio Mensual:** `346.67 EUR` + trial 30 días
- **Precio Anual:** `3536 EUR`
- **Display Name:** Teams 40
- **Description:** Para equipos grandes: 40 bodas activas por año...

---

#### **Producto 6: Teams Unlimited**

- **Product ID:** `com.maloveapp.teamsunlimited`
- **Subscription Group:** `Planner Packs`
- **Precio Mensual:** `541.67 EUR` + trial 30 días
- **Precio Anual:** `5525 EUR`
- **Display Name:** Teams Ilimitado
- **Description:** Sin límites: bodas ilimitadas, perfiles ilimitados, white-label completo...

---

## 📊 RESUMEN DE PRODUCTOS CREADOS

| # | Nombre | Product ID | Tipo | Precio |
|---|--------|-----------|------|--------|
| 1 | Wedding Pass | `com.maloveapp.weddingpass` | One-time | 65 EUR |
| 2 | Wedding Pass Plus | `com.maloveapp.weddingpassplus` | One-time | 110.50 EUR |
| 3 | Pack 5 (Mensual) | `com.maloveapp.plannerpack5` | Subscription | 54.17 EUR/mes + trial |
| 4 | Pack 5 (Anual) | `com.maloveapp.plannerpack5` | Subscription | 552.50 EUR/año |
| 5 | Pack 15 (Mensual) | `com.maloveapp.plannerpack15` | Subscription | 146.25 EUR/mes + trial |
| 6 | Pack 15 (Anual) | `com.maloveapp.plannerpack15` | Subscription | 1491.75 EUR/año |
| 7 | Teams 40 (Mensual) | `com.maloveapp.teams40` | Subscription | 346.67 EUR/mes + trial |
| 8 | Teams 40 (Anual) | `com.maloveapp.teams40` | Subscription | 3536 EUR/año |
| 9 | Teams Unlimited (Mensual) | `com.maloveapp.teamsunlimited` | Subscription | 541.67 EUR/mes + trial |
| 10 | Teams Unlimited (Anual) | `com.maloveapp.teamsunlimited` | Subscription | 5525 EUR/año |

**Total: 6 productos (2 one-time + 4 subscriptions con 2 precios cada uno)**

---

## 🔔 PASO 4: Configurar Server-to-Server Notifications

Esto permite que Apple notifique a tu backend cuando hay renovaciones, cancelaciones, etc.

### **4.1. Configurar URL del Webhook**

1. En App Store Connect > My Apps > MaLoveApp
2. **General** > **App Information**
3. Scroll hasta **"App Store Server Notifications"**
4. Click **"+"** para añadir URL

**Production Server URL:**
```
https://tu-dominio.com/api/apple/webhook
```

**Sandbox Server URL:**
```
https://tu-dominio-test.com/api/apple/webhook
```

> ⚠️ Necesitas tener tu backend desplegado y accesible públicamente

5. **Version:** Selecciona **"Version 2"**
6. Click **"Save"**

---

## 🧪 PASO 5: Testing en Sandbox

### **5.1. Crear Sandbox Tester**

1. App Store Connect > **Users and Access**
2. **Sandbox** > **Testers**
3. Click **"+"** 
4. Completa:
   ```
   First Name: Test
   Last Name: User
   Email: test.maloveapp@icloud.com (debe ser único)
   Password: TestPass123!
   Country: Spain
   ```
5. Click **"Invite"**

**IMPORTANTE:** Este email NO debe existir como Apple ID real.

### **5.2. Configurar dispositivo iOS para testing**

En tu iPhone/iPad:

1. **Settings** > **App Store**
2. En la sección **SANDBOX ACCOUNT**
3. Sign in con el sandbox tester (`test.maloveapp@icloud.com`)

**NO inicies sesión con el sandbox tester en iCloud, solo en Sandbox!**

---

## 💻 PASO 6: Código de la App iOS

Ver archivo separado: `ios/MaLoveApp/StoreKitManager.swift`

El código completo de la app iOS con StoreKit 2 está en el siguiente archivo.

---

## 🔐 PASO 7: Variables de Entorno

Añade a `backend/.env`:

```bash
# Apple In-App Purchases
APPLE_SHARED_SECRET=1a2b3c4d5e6f7g8h9i0j  # Del paso 2.2
APPLE_BUNDLE_ID=com.maloveapp
```

---

## ✅ PASO 8: Checklist de Verificación

### **App Store Connect:**
- [ ] Cuenta Apple Developer creada ($99 pagados)
- [ ] App "MaLoveApp" creada
- [ ] Bundle ID configurado: `com.maloveapp`
- [ ] App-Specific Shared Secret copiado
- [ ] 2 productos one-time creados (Wedding Pass, Plus)
- [ ] 4 productos subscription creados (Pack 5, 15, Teams 40, Unlimited)
- [ ] Cada subscription tiene 2 precios (mensual + anual)
- [ ] Trial de 30 días configurado en precios mensuales
- [ ] Server-to-Server Notifications configurado
- [ ] Sandbox tester creado

### **Backend:**
- [ ] Variables `APPLE_SHARED_SECRET` y `APPLE_BUNDLE_ID` en `.env`
- [ ] Backend desplegado y accesible públicamente
- [ ] Endpoint `/api/apple/webhook` respondiendo
- [ ] Endpoint `/api/apple/verify` funcionando

### **App iOS:**
- [ ] Proyecto Xcode creado
- [ ] StoreKit 2 integrado
- [ ] Capability "In-App Purchase" añadida
- [ ] Código de compra implementado
- [ ] Testing en Sandbox funcionando

---

## 🚀 PASO 9: Probar el Flujo Completo

### **Test 1: Compra de Wedding Pass**

1. Abre la app en simulador/dispositivo
2. Asegúrate de estar logueado con sandbox tester
3. Navega a "Planes"
4. Click en "Wedding Pass - 65 EUR"
5. Confirma con Face ID / Touch ID (o password en simulador)
6. **Debería:**
   - Mostrar confirmación de compra
   - Llamar a `/api/apple/verify`
   - Backend crear suscripción en Firestore
   - Usuario ver contenido desbloqueado

### **Test 2: Suscripción con Trial**

1. Click en "Pack 5 - Mensual"
2. Confirma compra
3. **Debería:**
   - Mostrar "Prueba gratuita de 1 mes"
   - No cobrar inmediatamente
   - Trial activo por 30 días
   - Backend recibir webhook `SUBSCRIBED`

### **Test 3: Webhooks**

Monitorea los logs de tu backend:

```bash
tail -f logs/backend.log | grep "Apple"
```

Deberías ver:
```
📱 Apple Webhook recibido: SUBSCRIBED
✅ Suscripción Apple creada: sub_xxx
```

---

## 📱 PASO 10: Publicar App (Cuando esté lista)

1. **Build** para producción en Xcode
2. **Archive** > **Distribute App**
3. **Submit to App Store**
4. **Completar App Store listing:**
   - Screenshots
   - Descripción
   - Keywords
   - Privacy Policy
5. **Submit for Review**
6. **Esperar aprobación** (1-7 días normalmente)

---

## ⚠️ NOTAS IMPORTANTES

### **Restricciones de Apple:**

❌ **NO puedes:**
- Mencionar precios más baratos en web
- Linkear directamente a checkout web
- Decir "compra en nuestra web"

✅ **SÍ puedes:**
- Tener precios diferentes (sin mencionarlo)
- Link genérico a tu web
- En emails mencionar precios web

### **Comisión:**
- **30%** el primer año de cada suscriptor
- **15%** a partir del segundo año (si mantienen suscripción)

### **Pagos:**
Apple paga mensualmente (45-60 días después de la venta)

---

## 📚 Recursos

- **Apple Developer:** https://developer.apple.com
- **App Store Connect:** https://appstoreconnect.apple.com
- **StoreKit 2 Docs:** https://developer.apple.com/documentation/storekit
- **Server Notifications:** https://developer.apple.com/documentation/appstoreservernotifications
- **Sandbox Testing:** https://developer.apple.com/documentation/storekit/testing

---

**Última actualización:** 23 de octubre de 2025  
**Siguiente paso:** Crear app iOS con StoreKit 2
