# Configuración de Google Play Billing - MaLoveApp

Guía paso a paso para configurar pagos en Android con Google Play Billing Library.

---

## 📋 PASO 1: Crear Cuenta Google Play Developer

### **Requisitos:**
- Cuenta Google (Gmail)
- $25 USD (pago único, no renovable)
- Verificación de identidad

### **Proceso:**

1. Ve a https://play.google.com/console/signup
2. Inicia sesión con tu cuenta Google
3. Acepta términos del **Developer Distribution Agreement**
4. **Pago único:** $25 USD (tarjeta de crédito)
5. **Verificación de identidad:**
   - Nombre completo
   - Dirección
   - Teléfono
   - Puede requerir ID gubernamental
6. **Espera aprobación:** Normalmente 24-48 horas

**Costo único:** $25 USD (vs $99/año de Apple)

---

## 📱 PASO 2: Crear App en Google Play Console

### **2.1. Crear App**

1. Ve a https://play.google.com/console
2. Click en **"Create app"**
3. Completa información:
   ```
   App name: MaLoveApp
   Default language: Spanish (Spain)
   App or game: App
   Free or paid: Free (las compras in-app son adicionales)
   ```
4. Acepta declaraciones:
   - ✅ Developer Program Policies
   - ✅ US export laws
5. Click **"Create app"**

### **2.2. Configurar Package Name**

**IMPORTANTE:** El package name NO se puede cambiar después.

```
Package name: com.maloveapp
```

Este debe coincidir exactamente con tu archivo `build.gradle`:

```gradle
android {
    defaultConfig {
        applicationId "com.maloveapp"
    }
}
```

---

## 🔐 PASO 3: Configurar Service Account (API Access)

Google Play requiere un Service Account para que tu backend verifique compras.

### **3.1. Crear Service Account**

1. En Google Play Console: **Setup** > **API access**
2. Si es la primera vez, click **"Link Google Cloud project"**
   - Se creará automáticamente un proyecto en Google Cloud
3. Click **"Create new service account"**
4. Se abrirá Google Cloud Console

### **3.2. En Google Cloud Console**

1. Click **"+ CREATE SERVICE ACCOUNT"**
2. Completa:
   ```
   Service account name: maloveapp-billing
   Service account ID: maloveapp-billing (auto-generado)
   Description: Service account for MaLoveApp billing verification
   ```
3. Click **"CREATE AND CONTINUE"**

4. **Grant access (Rol):**
   - Select role: **Finance** > **"Finance Administrator"**
   - O alternativamente: **Custom** > Select only needed permissions
5. Click **"CONTINUE"**

6. **Grant users access:** Skip (opcional)
7. Click **"DONE"**

### **3.3. Generar Clave JSON**

1. En la lista de Service Accounts, encuentra `maloveapp-billing`
2. Click en los **3 puntos** (⋮) > **"Manage keys"**
3. **Add Key** > **"Create new key"**
4. **Key type:** JSON
5. Click **"CREATE"**
6. **Se descargará un archivo JSON** → Guárdalo de forma segura

**Archivo descargado:** `maloveapp-xxxxx.json`

```json
{
  "type": "service_account",
  "project_id": "maloveapp-xxxxx",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nXXX\n-----END PRIVATE KEY-----\n",
  "client_email": "maloveapp-billing@maloveapp-xxxxx.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

### **3.4. Volver a Google Play Console**

1. Vuelve a **Google Play Console** > **Setup** > **API access**
2. Deberías ver tu service account listado
3. Click en el service account
4. **Grant access** > Selecciona permisos:
   - ✅ **Financial data** (View financial data, orders, and cancellation survey responses)
   - ✅ **Order management** (Manage orders and subscriptions)
5. Click **"Invite user"**
6. **Acepta la invitación** (se envía email al service account)

### **3.5. Configurar Variables de Entorno**

Extrae del archivo JSON descargado:

```bash
# Añadir a backend/.env:

GOOGLE_SERVICE_ACCOUNT_EMAIL=maloveapp-billing@maloveapp-xxxxx.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\nXXX\n-----END PRIVATE KEY-----\n"
GOOGLE_PACKAGE_NAME=com.maloveapp
```

⚠️ **IMPORTANTE:** El `private_key` debe incluir los `\n` literalmente en el string.

---

## 💰 PASO 4: Crear Productos In-App (10 productos)

### **Navegación:**
Google Play Console > Your App > **Monetization** > **Products**

---

### **4.1. PAREJAS (2 productos de pago único)**

#### **Producto 1: Wedding Pass**

1. Click **"In-app products"** > **"Create product"**
2. **Product ID:** `wedding_pass`
   - ⚠️ Solo minúsculas, números y guiones bajos
   - NO se puede cambiar después
3. **Name:** Wedding Pass
4. **Description:**
   ```
   Activa tu boda con funcionalidades completas: invitados ilimitados, 
   plantillas premium, contacto directo con proveedores y más. 
   Pago único válido hasta 30 días después de tu boda.
   ```
5. **Status:** Active
6. **Set price:**
   - **Default price:** 65 EUR
   - Google convertirá automáticamente a otras monedas
7. Click **"Save"**

---

#### **Producto 2: Wedding Pass Plus**

1. **Product ID:** `wedding_pass_plus`
2. **Name:** Wedding Pass Plus
3. **Description:**
   ```
   Todo lo de Wedding Pass más: eliminación total de marca MaLoveApp, 
   biblioteca completa de diseños premium, editor web avanzado, 
   galería de recuerdos y 1 ayudante con acceso completo.
   ```
4. **Price:** 110.50 EUR
5. Click **"Save"**

---

### **4.2. PLANNERS (4 productos de suscripción)**

> Cada pack tiene DOS "base plans": Mensual (con trial) y Anual (descuento 15%)

#### **Producto 3: Planner Pack 5**

1. Click **"Subscriptions"** > **"Create subscription"**
2. **Subscription ID:** `planner_pack5`
3. **Name:** Pack 5 Bodas
4. **Description:**
   ```
   Gestiona hasta 5 bodas simultáneamente con todas las herramientas 
   profesionales. Incluye 1 mes de prueba GRATIS en plan mensual.
   Ahorra 15% pagando anualmente.
   ```

**Base Plan 1: Mensual con Trial**

5. Click **"Add base plan"**
6. **Base plan ID:** `monthly`
7. **Billing period:** 1 Month
8. **Price:**
   - **Price:** 54.17 EUR
   - Google convertirá a otras monedas
9. **Free trial:**
   - ✅ Enable free trial
   - **Duration:** 1 Month (30 días)
   - **Eligibility:** New customers only
10. **Grace period:** 3 days (opcional, si falla pago)
11. Click **"Save"**

**Base Plan 2: Anual (15% descuento)**

12. Click **"Add base plan"** de nuevo
13. **Base plan ID:** `annual`
14. **Billing period:** 1 Year
15. **Price:** 552.50 EUR
16. **Free trial:** None (solo en mensual)
17. Click **"Save"**

18. **Activate subscription:** Click "Activate"

---

#### **Producto 4: Planner Pack 15**

Repetir proceso:

- **Subscription ID:** `planner_pack15`
- **Base plan monthly:** 146.25 EUR + trial 30 días
- **Base plan annual:** 1491.75 EUR

---

#### **Producto 5: Teams 40**

- **Subscription ID:** `teams40`
- **Base plan monthly:** 346.67 EUR + trial 30 días
- **Base plan annual:** 3536 EUR

---

#### **Producto 6: Teams Unlimited**

- **Subscription ID:** `teams_unlimited`
- **Base plan monthly:** 541.67 EUR + trial 30 días
- **Base plan annual:** 5525 EUR

---

## 📊 RESUMEN DE PRODUCTOS CREADOS

| # | Nombre | Product ID | Tipo | Precio |
|---|--------|-----------|------|--------|
| 1 | Wedding Pass | `wedding_pass` | In-app | 65 EUR |
| 2 | Wedding Pass Plus | `wedding_pass_plus` | In-app | 110.50 EUR |
| 3 | Pack 5 (Mensual) | `planner_pack5:monthly` | Subscription | 54.17 EUR/mes + trial |
| 4 | Pack 5 (Anual) | `planner_pack5:annual` | Subscription | 552.50 EUR/año |
| 5 | Pack 15 (Mensual) | `planner_pack15:monthly` | Subscription | 146.25 EUR/mes + trial |
| 6 | Pack 15 (Anual) | `planner_pack15:annual` | Subscription | 1491.75 EUR/año |
| 7 | Teams 40 (Mensual) | `teams40:monthly` | Subscription | 346.67 EUR/mes + trial |
| 8 | Teams 40 (Anual) | `teams40:annual` | Subscription | 3536 EUR/año |
| 9 | Teams Unlimited (Mensual) | `teams_unlimited:monthly` | Subscription | 541.67 EUR/mes + trial |
| 10 | Teams Unlimited (Anual) | `teams_unlimited:annual` | Subscription | 5525 EUR/año |

**Total: 6 productos (2 in-app + 4 subscriptions con 2 base plans cada uno)**

---

## 🔔 PASO 5: Configurar Real-time Developer Notifications

### **5.1. Crear Cloud Pub/Sub Topic**

1. Ve a **Google Play Console** > **Monetization** > **Subscriptions**
2. Scroll hasta **"Real-time developer notifications"**
3. Click **"Send notifications to topic"**
4. **Create a new topic:**
   - Se abrirá Google Cloud Console
5. En Google Cloud Console:
   - **Topic ID:** `maloveapp-rtdn`
   - Click **"CREATE"**
6. Vuelve a Google Play Console
7. Select topic: `maloveapp-rtdn`
8. Click **"Save changes"**

### **5.2. Configurar Pub/Sub Subscription (para recibir en tu backend)**

1. Ve a **Google Cloud Console** > **Pub/Sub** > **Subscriptions**
2. Click **"CREATE SUBSCRIPTION"**
3. **Subscription ID:** `maloveapp-rtdn-sub`
4. **Select a Cloud Pub/Sub topic:** `maloveapp-rtdn`
5. **Delivery type:** **Push**
6. **Endpoint URL:** 
   ```
   https://tu-dominio.com/api/google/webhook
   ```
7. Click **"CREATE"**

⚠️ Tu backend debe estar desplegado y accesible públicamente.

---

## 🧪 PASO 6: Testing con License Tester

### **6.1. Crear License Testers**

1. Google Play Console > **Setup** > **License testing**
2. **License testers:**
   - Añade cuentas Google de prueba (emails)
   - Ejemplo: `test.maloveapp@gmail.com`
3. **License response:** Test (permite compras sin cargo real)
4. Click **"Save changes"**

**IMPORTANTE:** Estas cuentas deben existir como cuentas Google reales.

### **6.2. Internal Testing Track**

Para probar in-app purchases necesitas subir una APK a testing:

1. **Build** > **Testing** > **Internal testing**
2. **Create new release**
3. Upload APK/AAB (Android App Bundle recomendado)
4. **Add testers:**
   - Email list: Añade tus cuentas de prueba
5. **Save** y **Review release**
6. **Start rollout to Internal testing**

### **6.3. Probar en Dispositivo**

En dispositivo Android con cuenta de prueba:

1. Accede al link de Internal Testing (enviado por email)
2. Click "Download" / "Become a tester"
3. Instala la app desde Play Store
4. Inicia sesión con cuenta de test
5. Intenta comprar un producto
6. **Resultado:** Compra procesada sin cargo real

---

## 💻 PASO 7: Código Android

Ver archivos separados:
- `android/BillingManager.kt` - Gestor de Google Play Billing
- `android/PricingActivity.kt` - UI de planes

El código completo está en los archivos siguientes.

---

## ✅ PASO 8: Checklist de Verificación

### **Google Play Console:**
- [ ] Cuenta Google Play Developer creada ($25 pagados)
- [ ] App "MaLoveApp" creada
- [ ] Package name: `com.maloveapp`
- [ ] Service Account creado y configurado
- [ ] Archivo JSON descargado y guardado
- [ ] 2 productos in-app creados (Wedding Pass, Plus)
- [ ] 4 productos subscription creados (Pack 5, 15, Teams 40, Unlimited)
- [ ] Cada subscription tiene 2 base plans (monthly + annual)
- [ ] Trial de 30 días configurado en base plans mensuales
- [ ] Real-time Developer Notifications configurado
- [ ] License testers añadidos
- [ ] Internal testing track creado

### **Backend:**
- [ ] Variables en `.env`:
  ```bash
  GOOGLE_SERVICE_ACCOUNT_EMAIL=...@...iam.gserviceaccount.com
  GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\n...\n"
  GOOGLE_PACKAGE_NAME=com.maloveapp
  ```
- [ ] Backend desplegado y accesible públicamente
- [ ] Endpoint `/api/google/webhook` respondiendo
- [ ] Endpoint `/api/google/verify` funcionando

### **App Android:**
- [ ] Proyecto Android Studio creado
- [ ] Google Play Billing Library añadida
- [ ] Package name: `com.maloveapp`
- [ ] Código de compra implementado
- [ ] Testing en Internal track funcionando

---

## 🚀 PASO 9: Probar el Flujo Completo

### **Test 1: Compra de Wedding Pass**

1. Abre la app en dispositivo de prueba
2. Cuenta de test logueada en Play Store
3. Navega a "Planes"
4. Click en "Wedding Pass - 65 EUR"
5. Confirma compra (sin cargo real en test)
6. **Debería:**
   - Mostrar confirmación de compra
   - Llamar a `/api/google/verify`
   - Backend crear suscripción en Firestore
   - Usuario ver contenido desbloqueado

### **Test 2: Suscripción con Trial**

1. Click en "Pack 5 - Mensual"
2. Confirma suscripción
3. **Debería:**
   - Mostrar "Prueba gratuita de 1 mes"
   - No cobrar inmediatamente
   - Trial activo por 30 días
   - Backend recibir notificación `SUBSCRIPTION_PURCHASED`

### **Test 3: Real-time Notifications**

Monitorea los logs de tu backend:

```bash
tail -f logs/backend.log | grep "Google"
```

Deberías ver:
```
🤖 Google Webhook recibido: SUBSCRIPTION_PURCHASED
✅ Suscripción Google creada: sub_xxx
```

---

## 📱 PASO 10: Publicar App (Cuando esté lista)

### **10.1. Preparar Release**

1. **Build signed APK/AAB:**
   ```bash
   # En Android Studio
   Build > Generate Signed Bundle / APK
   # Seleccionar: Android App Bundle (AAB)
   # Create new keystore o usar existente
   ```

2. **Upload to Production:**
   - Google Play Console > **Production**
   - **Create new release**
   - Upload AAB
   - Complete release notes

### **10.2. Store Listing**

1. **Main store listing:**
   - App name: MaLoveApp
   - Short description (80 chars)
   - Full description (4000 chars)
   - Screenshots (mínimo 2):
     - Phone: 1080x1920 o 1440x2560
     - Tablet (opcional)
   - Feature graphic: 1024x500
   - App icon: 512x512

2. **Content rating:**
   - Complete questionnaire
   - Usually "Everyone" for wedding apps

3. **App category:**
   - Category: Lifestyle / Events
   - Tags: weddings, planning, events

4. **Privacy Policy:**
   - URL required
   - Ejemplo: `https://maloveapp.com/privacy`

### **10.3. Submit for Review**

1. Complete all required sections (indicated with red !)
2. Click **"Review release"**
3. **Submit for review**
4. **Esperar aprobación:** 1-7 días normalmente

---

## ⚠️ NOTAS IMPORTANTES

### **Diferencias vs Apple:**

| Aspecto | Apple | Google |
|---------|-------|--------|
| **Costo cuenta** | $99/año | $25 único |
| **Review tiempo** | 3-7 días | 1-7 días |
| **Comisión** | 30% → 15% | 30% → 15% |
| **Trial periods** | Fácil | Fácil |
| **Testing** | Sandbox | License testers |

### **Comisión:**
- **30%** el primer año de cada suscriptor
- **15%** a partir del segundo año (igual que Apple)
- **15%** si ganas <$1M/año

### **Pagos:**
Google paga mensualmente (30-60 días después de la venta)

### **Product IDs:**
- Solo minúsculas, números y `_`
- NO se pueden cambiar después de crear
- Base plan IDs se añaden con `:` → `planner_pack5:monthly`

---

## 📚 Recursos

- **Google Play Console:** https://play.google.com/console
- **Billing Library Docs:** https://developer.android.com/google/play/billing
- **Play Billing Samples:** https://github.com/android/play-billing-samples
- **Cloud Pub/Sub:** https://cloud.google.com/pubsub/docs
- **Testing Guide:** https://developer.android.com/google/play/billing/test

---

**Última actualización:** 23 de octubre de 2025  
**Siguiente paso:** Crear app Android con Play Billing Library
