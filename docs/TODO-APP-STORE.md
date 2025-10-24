# 📱 TODO: Integración App Store (CUANDO SUBA LA APP A iOS)

## ✅ Código ya implementado

El código backend está **100% listo y funcional**. Solo necesita configuración cuando subas la app.

**Archivos implementados:**
- ✅ `backend/routes/app-store-webhook.js` (webhook completo)
- ✅ `backend/index.js` (ruta montada en `/api/app-store`)
- ✅ `docs/APP_STORE_INTEGRATION.md` (guía completa)

---

## 📝 Checklist para cuando subas la app iOS

### **1. En App Store Connect** (15 minutos)

- [ ] Ir a [App Store Connect](https://appstoreconnect.apple.com)
- [ ] Seleccionar tu app → **Features** → **In-App Purchases**
- [ ] Crear productos (Auto-Renewable Subscriptions):
  - [ ] `com.mywed360.premium.monthly` - €9.99/mes
  - [ ] `com.mywed360.premium.yearly` - €99.99/año
  - [ ] `com.mywed360.premium_plus.monthly` - €19.99/mes
  - [ ] `com.mywed360.premium_plus.yearly` - €199.99/año

- [ ] Crear **Subscription Group** (ej: "Premium Plans")
- [ ] Asignar todos los productos al grupo

### **2. Obtener Shared Secret** (2 minutos)

- [ ] App Store Connect → Tu app → **General** → **App Information**
- [ ] Scroll down → **App-Specific Shared Secret**
- [ ] Click **Generate** (si no existe)
- [ ] **Copiar el secret** (lo necesitas para .env)

### **3. Configurar Webhook** (5 minutos)

- [ ] En App Store Connect → App Information
- [ ] Scroll down → **App Store Server Notifications**
- [ ] Click **Add Server URL**
- [ ] URL Production: `https://tudominio.com/api/app-store/webhook`
- [ ] URL Sandbox: `https://tudominio.com/api/app-store/webhook`
- [ ] **Seleccionar Version 2** ⚠️ (importante)
- [ ] Save

### **4. Configurar Backend** (3 minutos)

- [ ] Añadir a `.env`:
  ```env
  APP_STORE_SHARED_SECRET=tu_shared_secret_aqui
  APP_STORE_BUNDLE_ID=com.maloveapp.app
  ```
- [ ] Reiniciar backend
- [ ] Verificar logs: `[backend] App Store webhook routes mounted`

### **5. Testing Sandbox** (10 minutos)

- [ ] Crear usuario sandbox en App Store Connect
- [ ] En app iOS, configurar:
  ```swift
  #if DEBUG
  StoreKit.Configuration.current = .sandbox
  #endif
  ```
- [ ] Hacer compra de prueba
- [ ] Verificar logs del backend:
  ```
  [app-store] Procesando notificación type=SUBSCRIBED
  [app-store] Suscripción actualizada
  ```
- [ ] Verificar en Firestore → collection `subscriptions`
- [ ] Verificar en Admin Dashboard → MRR/ARR

### **6. Test Manual Webhook** (5 minutos)

- [ ] En App Store Connect → Server Notifications
- [ ] Click **Send Test Notification**
- [ ] Verificar que llega al backend
- [ ] Verificar respuesta 200 OK

### **7. Producción** (cuando publiques)

- [ ] Cambiar `NODE_ENV=production` en .env
- [ ] Desplegar backend con HTTPS
- [ ] Verificar URL del webhook es accesible desde internet
- [ ] Hacer compra real de prueba
- [ ] Verificar que aparece en admin dashboard

---

## 📖 Documentación

**Guía completa:** `docs/APP_STORE_INTEGRATION.md`

Incluye:
- Paso a paso detallado
- Troubleshooting completo
- Ejemplos de testing
- Estructura de datos
- Códigos de error

---

## ⚠️ Notas Importantes

1. **No hacer nada hasta subir la app a App Store**
   - El código backend ya está listo
   - Solo necesita configuración cuando tengas productos in-app

2. **Sandbox vs Production**
   - Usa sandbox para testing
   - Las suscripciones sandbox renuevan cada 5 minutos
   - Production renueva según el plan (mensual/anual)

3. **URLs deben ser HTTPS**
   - Apple requiere HTTPS para webhooks en producción
   - Solo acepta HTTP para testing local/sandbox

4. **Shared Secret es sensible**
   - Nunca lo subas a Git
   - Solo en .env (que está en .gitignore)

---

## 🎯 Tiempo Estimado Total

**45 minutos** cuando subas la app (todos los pasos).

---

## ✅ Resultado Esperado

Una vez configurado:

```
Usuario iOS → Compra en App Store
  ↓
Apple → Webhook a tu backend
  ↓
Backend → Guarda en Firestore
  ↓
Admin → Ve la suscripción automáticamente
  ↓
MRR/ARR se actualiza solo
```

---

**Estado:** ⏸️ PENDIENTE (hacer cuando suba la app iOS)  
**Código:** ✅ LISTO Y FUNCIONAL  
**Tiempo requerido:** 45 min de configuración
