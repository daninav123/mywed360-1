# Checklist Configuración Apple In-App Purchases - MaLoveApp

Guía paso a paso para configurar Apple In-App Purchases. Marca cada paso cuando lo completes.

---

## 📱 PASO 1: Crear Cuenta Apple Developer

**Costo:** $99 USD/año

**Requisitos previos:**
- [ ] Tienes un Apple ID (cuenta de iCloud/iTunes)
- [ ] Tienes una tarjeta de crédito válida
- [ ] Tienes identificación oficial (puede ser requerida)

**Proceso:**

### 1.1 Enrollar en Apple Developer Program

- [ ] Ve a: https://developer.apple.com/programs/enroll/
- [ ] Click en **"Start Your Enrollment"**
- [ ] Inicia sesión con tu Apple ID
- [ ] Selecciona **"Individual"** (a menos que seas empresa)
- [ ] Completa información personal:
  - [ ] Nombre completo
  - [ ] Dirección
  - [ ] Teléfono
- [ ] Acepta términos y condiciones
- [ ] **Pago:** $99 USD
- [ ] Espera aprobación (normalmente 24-48 horas)

**Email de confirmación:**
- [ ] Recibiste email de "Apple Developer Program" con confirmación

**¿Problemas?**
- Si no recibes confirmación en 48h, contacta: https://developer.apple.com/contact/

---

## 🏗️ PASO 2: Crear App en App Store Connect

### 2.1 Acceder a App Store Connect

- [ ] Ve a: https://appstoreconnect.apple.com
- [ ] Inicia sesión con tu Apple ID (el mismo de Developer)
- [ ] Verifica que estás en la cuenta correcta

### 2.2 Crear Nueva App

- [ ] Click en **"My Apps"**
- [ ] Click en botón **"+"** (esquina superior izquierda)
- [ ] Selecciona **"New App"**

**Información básica:**
- [ ] **Platforms:** iOS ✓
- [ ] **Name:** MaLoveApp
- [ ] **Primary Language:** Spanish (Spain) o Spanish (Mexico)
- [ ] **Bundle ID:** 
  - [ ] Click "Create New Bundle ID"
  - [ ] **Bundle ID:** `com.maloveapp`
  - [ ] **Description:** MaLoveApp Wedding Planner
- [ ] **SKU:** MALOVEAPP001
- [ ] **User Access:** Full Access

- [ ] Click **"Create"**

**Resultado esperado:**
- [ ] Ahora ves la página de tu app "MaLoveApp"

---

## 🔐 PASO 3: Obtener App-Specific Shared Secret

Este secret es CRÍTICO para verificar receipts de iOS.

### 3.1 Navegar a App Information

- [ ] En tu app "MaLoveApp" > **General** > **App Information**
- [ ] Scroll hasta encontrar **"App-Specific Shared Secret"**

### 3.2 Generar Secret

- [ ] Click en **"Generate"** (si no existe uno)
- [ ] **COPIA EL SECRET INMEDIATAMENTE**
- [ ] Guárdalo en un lugar seguro (lo necesitaremos para el `.env`)

**Secret copiado:**
```
APPLE_SHARED_SECRET=_________________________________
```

⚠️ **IMPORTANTE:** Si pierdes este secret, tendrás que generar uno nuevo y actualizar tu backend.

---

## 💰 PASO 4: Crear Productos In-App

Total a crear: **10 productos** (2 one-time + 4 subs x 2 precios)

### 4.1 Navegar a In-App Purchases

- [ ] En tu app "MaLoveApp"
- [ ] **Features** > **In-App Purchases**
- [ ] Verás una lista vacía

---

### 📦 PRODUCTOS PARA PAREJAS (One-Time)

#### Producto 1: Wedding Pass

- [ ] Click **"+"** > **"Non-Consumable"**

**Datos del producto:**
- [ ] **Reference Name:** Wedding Pass
- [ ] **Product ID:** `com.maloveapp.weddingpass`
- [ ] Click **"Create"**

**Pricing:**
- [ ] Click **"Add Pricing"**
- [ ] **Price:** 65 EUR (o equivalente en USD ~$70)
- [ ] **Availability:** Todos los países
- [ ] Click **"Next"** > **"Create"**

**Metadata (Localizations):**
- [ ] Click **"+"** para añadir localización
- [ ] **Language:** Spanish (Spain)
- [ ] **Display Name:** Wedding Pass
- [ ] **Description:**
  ```
  Activa tu boda con funcionalidades completas: invitados ilimitados, 
  plantillas premium, contacto directo con proveedores y más. 
  Pago único válido hasta 30 días después de tu boda.
  ```
- [ ] Click **"Save"**

**Review Information:**
- [ ] Screenshot (opcional ahora, necesario antes de publicar)
- [ ] Click **"Save"**

**Estado final:**
- [ ] Producto visible en lista con estado "Ready to Submit"

---

#### Producto 2: Wedding Pass Plus

Repetir proceso anterior:

- [ ] Click **"+"** > **"Non-Consumable"**
- [ ] **Reference Name:** Wedding Pass Plus
- [ ] **Product ID:** `com.maloveapp.weddingpassplus`
- [ ] **Price:** 110.50 EUR (~$118 USD)
- [ ] **Display Name:** Wedding Pass Plus
- [ ] **Description:**
  ```
  Todo lo de Wedding Pass más: eliminación total de marca MaLoveApp, 
  biblioteca completa de diseños premium, editor web avanzado, 
  galería de recuerdos y 1 ayudante con acceso completo.
  ```
- [ ] Click **"Save"**

---

### 🔄 PRODUCTOS PARA PLANNERS (Subscriptions)

**IMPORTANTE:** Cada pack tiene 2 "prices" (base plans): Mensual + Anual

#### Producto 3: Planner Pack 5

- [ ] Click **"+"** > **"Auto-Renewable Subscription"**
- [ ] **Reference Name:** Planner Pack 5
- [ ] **Product ID:** `com.maloveapp.plannerpack5`
- [ ] Click **"Create"**

**Subscription Group:**
- [ ] Si es el primer subscription:
  - [ ] Click **"Create Subscription Group"**
  - [ ] **Group Name:** Planner Packs
  - [ ] **Group Reference Name:** planner_packs
- [ ] Si ya existe: Seleccionar "Planner Packs"

**Base Plan 1: Mensual con Trial**

- [ ] En "Subscription Prices", click **"+"**
- [ ] **Duration:** 1 month
- [ ] **Price:** 54.17 EUR (~$58 USD)
- [ ] **Free Trial:**
  - [ ] Toggle **ON**
  - [ ] **Duration:** 1 month
  - [ ] **Eligibility:** New Subscribers Only
- [ ] Click **"Next"** > **"Create"**

**Base Plan 2: Anual (15% descuento)**

- [ ] Click **"+"** para añadir otro precio
- [ ] **Duration:** 1 year
- [ ] **Price:** 552.50 EUR (~$590 USD)
- [ ] **Free Trial:** None
- [ ] Click **"Next"** > **"Create"**

**Metadata:**
- [ ] **Display Name:** Pack 5 Bodas
- [ ] **Description:**
  ```
  Gestiona hasta 5 bodas simultáneamente con todas las herramientas 
  profesionales. Incluye 1 mes de prueba GRATIS en plan mensual.
  Ahorra 15% pagando anualmente.
  ```
- [ ] Click **"Save"**

**Activar subscription:**
- [ ] Click **"Activate"** (botón en la parte superior)

---

#### Producto 4: Planner Pack 15

Repetir proceso de subscription:

- [ ] **Product ID:** `com.maloveapp.plannerpack15`
- [ ] **Group:** Planner Packs (mismo grupo)
- [ ] **Mensual:** 146.25 EUR + trial 30 días
- [ ] **Anual:** 1491.75 EUR
- [ ] **Display Name:** Pack 15 Bodas
- [ ] **Activate**

---

#### Producto 5: Teams 40

- [ ] **Product ID:** `com.maloveapp.teams40`
- [ ] **Group:** Planner Packs
- [ ] **Mensual:** 346.67 EUR + trial 30 días
- [ ] **Anual:** 3536 EUR
- [ ] **Display Name:** Teams 40
- [ ] **Activate**

---

#### Producto 6: Teams Unlimited

- [ ] **Product ID:** `com.maloveapp.teamsunlimited`
- [ ] **Group:** Planner Packs
- [ ] **Mensual:** 541.67 EUR + trial 30 días
- [ ] **Anual:** 5525 EUR
- [ ] **Display Name:** Teams Ilimitado
- [ ] **Activate**

---

## 📊 RESUMEN DE PRODUCTOS CREADOS

Verifica que tienes exactamente estos productos:

**Parejas (Non-Consumable):**
- [ ] Wedding Pass - 65 EUR
- [ ] Wedding Pass Plus - 110.50 EUR

**Planners (Auto-Renewable Subscriptions):**
- [ ] Planner Pack 5 - 2 precios (54.17 EUR/mes + 552.50 EUR/año)
- [ ] Planner Pack 15 - 2 precios (146.25 EUR/mes + 1491.75 EUR/año)
- [ ] Teams 40 - 2 precios (346.67 EUR/mes + 3536 EUR/año)
- [ ] Teams Unlimited - 2 precios (541.67 EUR/mes + 5525 EUR/año)

**Total:** 6 productos, 10 precios

---

## 🔔 PASO 5: Configurar Server-to-Server Notifications

Permite que Apple notifique a tu backend sobre cambios en suscripciones.

### 5.1 Navegar a App Information

- [ ] En tu app "MaLoveApp" > **General** > **App Information**
- [ ] Scroll hasta **"App Store Server Notifications"**

### 5.2 Configurar URLs

- [ ] Click **"+"** para añadir notification URL

**Production Server URL:**
```
https://tu-dominio.com/api/apple/webhook
```
- [ ] Pega la URL de producción

**Sandbox Server URL:**
```
https://tu-dominio-test.com/api/apple/webhook
```
- [ ] Pega la URL de test (puede ser la misma)

- [ ] **Version:** Selecciona **"Version 2"**
- [ ] Click **"Save"**

⚠️ **NOTA:** Necesitas tener tu backend desplegado y accesible para esto. Si aún no lo tienes, puedes configurar esto más tarde.

---

## 🧪 PASO 6: Crear Sandbox Tester

Para probar compras sin cargo real.

### 6.1 Navegar a Sandbox Testers

- [ ] En App Store Connect, click en tu nombre (esquina superior derecha)
- [ ] **Users and Access**
- [ ] Tab **"Sandbox"** > **"Testers"**

### 6.2 Crear Tester

- [ ] Click **"+"**

**Información del tester:**
- [ ] **First Name:** Test
- [ ] **Last Name:** MaLoveApp
- [ ] **Email:** test.maloveapp@icloud.com (debe ser único, no puede existir como Apple ID real)
- [ ] **Password:** TestPass123!
- [ ] **Country:** Spain
- [ ] **App Store Territory:** Spain

- [ ] Click **"Invite"**

**Email creado para testing:**
```
SANDBOX_TESTER_EMAIL=test.maloveapp@icloud.com
SANDBOX_TESTER_PASSWORD=TestPass123!
```

⚠️ **IMPORTANTE:** NO uses este email en iCloud, solo en sandbox testing.

---

## ⚙️ PASO 7: Variables de Entorno

Ahora que tienes todo configurado, actualiza tu `.env`:

```bash
# Apple In-App Purchases
APPLE_SHARED_SECRET=abc123def456...  # Del paso 3
APPLE_BUNDLE_ID=com.maloveapp
```

- [ ] Copiado `APPLE_SHARED_SECRET` al archivo `backend/.env`
- [ ] Añadido `APPLE_BUNDLE_ID=com.maloveapp`

---

## ✅ VERIFICACIÓN FINAL

Antes de continuar, verifica:

**App Store Connect:**
- [ ] Cuenta Apple Developer activa ($99 pagados)
- [ ] App "MaLoveApp" creada
- [ ] Bundle ID: `com.maloveapp`
- [ ] App-Specific Shared Secret copiado
- [ ] 6 productos creados (2 one-time + 4 subscriptions)
- [ ] Todos los productos tienen status "Ready to Submit" o "Approved"
- [ ] Server-to-Server Notifications configurado (o pendiente de deploy)
- [ ] Sandbox tester creado

**Backend:**
- [ ] Variables `APPLE_SHARED_SECRET` y `APPLE_BUNDLE_ID` en `.env`

---

## 🚀 SIGUIENTE PASO

Una vez completado todo:

**Opción A: Crear app iOS con Xcode** (Punto 3)
- Crear proyecto Xcode
- Integrar código Swift (StoreKitManager + PricingView)
- Testing en Sandbox

**Opción B: Continuar con Google Play** (Punto 3)
- Configurar Google Play Console
- Crear productos Android

---

## 📞 SOPORTE

**Si tienes problemas:**

- **Enrollment rechazado:** https://developer.apple.com/contact/
- **Productos no aparecen:** Espera 15-30 min después de crear
- **Sandbox tester no funciona:** Asegúrate de NO estar logueado en iCloud con ese email
- **Shared Secret perdido:** Genera uno nuevo (tendrás que actualizar backend)

---

**Última actualización:** 23 de octubre de 2025  
**Tiempo estimado:** 2-3 horas para completar todos los pasos  
**Estado:** ⏳ Pendiente de configuración
