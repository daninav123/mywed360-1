# Resumen de Integración de Pagos Multi-Plataforma - MaLoveApp

Documento maestro que consolida toda la implementación de pagos en Web, iOS y Android.

---

## 📊 VISIÓN GENERAL

**Sistema de pagos híbrido** que soporta compras desde:
- 🌐 **Web** → Stripe
- 🍎 **iOS** → Apple In-App Purchases  
- 🤖 **Android** → Google Play Billing

**Estado actual:** ✅ Backend y código completos | ⏳ Configuración de stores pendiente

---

## 💰 PRECIOS POR PLATAFORMA

### **Diferencia de Precios (+30% en stores)**

Los precios en App Store y Google Play son 30% más altos para compensar la comisión.

| Producto | Web (Stripe) | iOS/Android (Stores) | Diferencia |
|----------|--------------|---------------------|------------|
| **Wedding Pass** | 50 EUR | 65 EUR | +15 EUR |
| **Wedding Pass Plus** | 85 EUR | 110.50 EUR | +25.50 EUR |
| **Pack 5 Mensual** | 41.67 EUR/mes | 54.17 EUR/mes | +12.50 EUR/mes |
| **Pack 5 Anual** | 425 EUR | 552.50 EUR | +127.50 EUR |
| **Pack 15 Mensual** | 112.50 EUR/mes | 146.25 EUR/mes | +33.75 EUR/mes |
| **Pack 15 Anual** | 1,147.50 EUR | 1,491.75 EUR | +344.25 EUR |
| **Teams 40 Mensual** | 266.67 EUR/mes | 346.67 EUR/mes | +80 EUR/mes |
| **Teams 40 Anual** | 2,720 EUR | 3,536 EUR | +816 EUR |
| **Teams Unlimited Mensual** | 416.67 EUR/mes | 541.67 EUR/mes | +125 EUR/mes |
| **Teams Unlimited Anual** | 4,250 EUR | 5,525 EUR | +1,275 EUR |

**Ejemplo de impacto:**
- Usuario paga Pack 5 Mensual en Web: Ganas 40.95 EUR (comisión Stripe 1.7%)
- Usuario paga Pack 5 Mensual en iOS: Ganas 37.92 EUR (comisión Apple 30%)
- **Diferencia:** 3.03 EUR menos por suscripción en stores

---

## 🏗️ ARQUITECTURA

```
┌─────────────────────────────────────────────────────────┐
│                     USUARIOS                             │
├──────────────┬─────────────────┬───────────────────────┤
│   Web App    │   iOS App       │   Android App         │
│   (Stripe)   │   (Apple IAP)   │   (Google Play)       │
└──────┬───────┴────────┬────────┴───────────┬───────────┘
       │                │                    │
       ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│           BACKEND UNIFICADO (Node.js/Express)           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Endpoints:                                              │
│  • POST /api/stripe/webhook     ◄── Stripe              │
│  • POST /api/apple/webhook      ◄── Apple               │
│  • POST /api/apple/verify                                │
│  • POST /api/google/webhook     ◄── Google              │
│  • POST /api/google/verify                               │
│                                                          │
│  Services:                                               │
│  • subscriptionService.js    (CORE - unifica todo)      │
│  • applePaymentService.js    (verificar receipts)       │
│  • googlePaymentService.js   (verificar con Play API)   │
│  • stripeService.js          (ya existía)               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │   Firestore    │
                  │                │
                  │  users/{uid}/  │
                  │  subscriptions │
                  │  /{id}         │
                  │                │
                  │  platform      │
                  │  productId     │
                  │  status        │
                  │  expiresAt     │
                  └────────────────┘
```

---

## 📁 ARCHIVOS IMPLEMENTADOS

### **Backend (Node.js/Express)**

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `backend/routes/apple-payments.js` | 245 | Webhooks y verify de Apple |
| `backend/routes/google-payments.js` | 290 | Webhooks y verify de Google |
| `backend/services/applePaymentService.js` | 180 | Verificación de receipts iOS |
| `backend/services/googlePaymentService.js` | 200 | Verificación con Google Play API |
| `backend/services/subscriptionService.js` | 280 | **CORE** - Unifica 3 plataformas |
| `backend/routes/stripe.js` | - | Ya existía |
| `backend/routes/stripe-webhook.js` | - | Ya existía |
| **Total Backend** | **~1,195** | **5 archivos nuevos** |

### **iOS (Swift + StoreKit 2)**

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `ios/StoreKitManager.swift` | 350 | Gestor completo de StoreKit 2 |
| `ios/PricingView.swift` | 280 | UI de planes con SwiftUI |
| `ios/README.md` | 300 | Guía técnica iOS |
| **Total iOS** | **930** | **3 archivos** |

### **Android (Kotlin + Play Billing)**

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `android/BillingManager.kt` | 450 | Gestor Google Play Billing 6.0 |
| `android/PricingActivity.kt` | 400 | UI con Jetpack Compose |
| `android/README.md` | 350 | Guía técnica Android |
| **Total Android** | **1,200** | **3 archivos** |

### **Documentación**

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `docs/STRIPE-SETUP.md` | 376 | Configuración Stripe web |
| `docs/APPLE-IAP-SETUP.md` | 400 | Configuración Apple paso a paso |
| `docs/GOOGLE-PLAY-SETUP.md` | 500 | Configuración Google paso a paso |
| `docs/PAYMENT-ARCHITECTURE.md` | 533 | Arquitectura general |
| `backend/SETUP-MULTI-PLATFORM-PAYMENTS.md` | 380 | Setup backend |
| **Total Docs** | **2,189** | **5 documentos** |

### **Scripts**

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `scripts/createStripeProducts.js` | 264 | Crear productos Stripe automáticamente |
| `scripts/deleteStripeProducts.js` | 58 | Eliminar productos Stripe |
| `scripts/archivePostWeddingExtension.js` | 58 | Archivar producto eliminado |
| **Total Scripts** | **380** | **3 scripts** |

---

## 📊 RESUMEN TOTAL

| Categoría | Archivos | Líneas de Código |
|-----------|----------|------------------|
| **Backend** | 5 | ~1,195 |
| **iOS** | 3 | 930 |
| **Android** | 3 | 1,200 |
| **Documentación** | 5 | 2,189 |
| **Scripts** | 3 | 380 |
| **TOTAL** | **19** | **~5,894** |

---

## ✅ CHECKLIST DE CONFIGURACIÓN

### **🌐 WEB (Stripe)** - ✅ Completo

- [x] Backend implementado
- [x] Stripe configurado en `.env`
- [x] 10 productos creados en Stripe
- [x] Webhooks configurados
- [x] Script de creación automática
- [x] Precios: Web estándar

**Siguiente paso:** Configurar frontend de compra

---

### **🍎 iOS (Apple)** - ⏳ Pendiente Configuración

**Backend:**
- [x] Rutas implementadas
- [x] Servicios implementados
- [ ] Variables en `.env`:
  ```bash
  APPLE_SHARED_SECRET=...
  APPLE_BUNDLE_ID=com.maloveapp
  ```

**App Store Connect:**
- [ ] Cuenta Apple Developer creada ($99/año)
- [ ] App "MaLoveApp" creada
- [ ] Bundle ID: `com.maloveapp`
- [ ] 10 productos creados:
  - [ ] 2 one-time (Wedding Pass, Plus)
  - [ ] 4 subscriptions con 2 precios cada uno
- [ ] Server-to-Server Notifications configurado
- [ ] Sandbox tester creado

**App iOS:**
- [x] Código completo (StoreKitManager + PricingView)
- [ ] Proyecto Xcode creado
- [ ] Capability "In-App Purchase" añadida
- [ ] Testing en Sandbox
- [ ] Build & Upload a App Store

**Tiempo estimado:** 2-3 semanas

---

### **🤖 ANDROID (Google Play)** - ⏳ Pendiente Configuración

**Backend:**
- [x] Rutas implementadas
- [x] Servicios implementados
- [ ] Variables en `.env`:
  ```bash
  GOOGLE_SERVICE_ACCOUNT_EMAIL=...@...iam.gserviceaccount.com
  GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\n...\n"
  GOOGLE_PACKAGE_NAME=com.maloveapp
  ```

**Google Play Console:**
- [ ] Cuenta Google Play Developer creada ($25 único)
- [ ] App "MaLoveApp" creada
- [ ] Package name: `com.maloveapp`
- [ ] Service Account configurado
- [ ] JSON key descargado
- [ ] 10 productos creados:
  - [ ] 2 in-app (Wedding Pass, Plus)
  - [ ] 4 subscriptions con 2 base plans cada uno
- [ ] Real-time Developer Notifications configurado
- [ ] License testers añadidos

**App Android:**
- [x] Código completo (BillingManager + PricingActivity)
- [ ] Proyecto Android Studio creado
- [ ] Billing Library añadida
- [ ] Testing en Internal track
- [ ] Build & Upload a Play Store

**Tiempo estimado:** 2-3 semanas

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### **Fase 1: Web (Ahora - 1 semana)** ✅ Casi completo

1. ✅ Backend Stripe configurado
2. ✅ Productos creados
3. ⏳ Integrar checkout en frontend
4. ⏳ Testing de compras
5. ⏳ Publicar en producción

---

### **Fase 2: iOS (Semanas 2-5)**

**Semana 2: Setup**
- [ ] Crear cuenta Apple Developer
- [ ] Crear app en App Store Connect
- [ ] Crear 10 productos
- [ ] Configurar webhooks

**Semana 3-4: Desarrollo**
- [ ] Crear proyecto Xcode
- [ ] Integrar StoreKitManager
- [ ] Implementar PricingView
- [ ] Testing en Sandbox

**Semana 5: Publicación**
- [ ] Screenshots y metadata
- [ ] Submit for Review
- [ ] Esperar aprobación (3-7 días)

---

### **Fase 3: Android (Semanas 6-9)**

**Semana 6: Setup**
- [ ] Crear cuenta Google Play Developer
- [ ] Configurar Service Account
- [ ] Crear 10 productos
- [ ] Configurar Pub/Sub

**Semana 7-8: Desarrollo**
- [ ] Crear proyecto Android Studio
- [ ] Integrar BillingManager
- [ ] Implementar PricingActivity
- [ ] Testing en Internal track

**Semana 9: Publicación**
- [ ] Store listing completo
- [ ] Submit for Review
- [ ] Esperar aprobación (1-7 días)

---

### **Fase 4: Monitoreo y Optimización (Semana 10+)**

- [ ] Monitorear conversiones por plataforma
- [ ] Analizar qué plataforma genera más ingresos
- [ ] A/B testing de precios
- [ ] Optimizar descripciones de productos
- [ ] Implementar promociones/descuentos

---

## 💵 PROYECCIÓN DE INGRESOS

### **Escenario Conservador**

**Asumiendo:**
- 100 suscripciones Pack 5 Mensual
- 30% en Web, 40% iOS, 30% Android

| Plataforma | Suscripciones | Precio | Ingreso Bruto | Comisión | Ingreso Neto |
|------------|--------------|--------|---------------|----------|--------------|
| **Web** | 30 | 41.67 EUR | 1,250 EUR | 21 EUR (1.7%) | 1,229 EUR |
| **iOS** | 40 | 54.17 EUR | 2,167 EUR | 650 EUR (30%) | 1,517 EUR |
| **Android** | 30 | 54.17 EUR | 1,625 EUR | 487 EUR (30%) | 1,138 EUR |
| **TOTAL** | **100** | - | **5,042 EUR** | **1,158 EUR** | **3,884 EUR** |

**Comisión promedio:** 23% (vs 30% si solo usaras stores)

**Ahorro mensual:** ~354 EUR vs solo stores

---

## 📚 GUÍAS DE REFERENCIA RÁPIDA

### **Para Configurar Apple:**
1. Lee `docs/APPLE-IAP-SETUP.md`
2. Sigue paso a paso (10 pasos)
3. Copia variables al `.env`
4. Lee `ios/README.md` para desarrollo

### **Para Configurar Google:**
1. Lee `docs/GOOGLE-PLAY-SETUP.md`
2. Sigue paso a paso (10 pasos)
3. Copia variables al `.env`
4. Lee `android/README.md` para desarrollo

### **Para Entender Arquitectura:**
1. Lee `docs/PAYMENT-ARCHITECTURE.md`
2. Lee `backend/SETUP-MULTI-PLATFORM-PAYMENTS.md`
3. Revisa código en `backend/services/subscriptionService.js`

---

## 🔗 ENLACES ÚTILES

### **Consolas de Desarrollo:**
- **Stripe:** https://dashboard.stripe.com
- **App Store Connect:** https://appstoreconnect.apple.com
- **Google Play Console:** https://play.google.com/console

### **Documentación Oficial:**
- **Stripe API:** https://stripe.com/docs/api
- **StoreKit 2:** https://developer.apple.com/documentation/storekit
- **Play Billing:** https://developer.android.com/google/play/billing

### **Códigos de Prueba:**
- **Stripe Test Cards:** https://stripe.com/docs/testing
- **Apple Sandbox:** https://developer.apple.com/documentation/storekit/testing
- **Google Test Accounts:** License testers en Play Console

---

## 💡 DECISIONES CLAVE DE DISEÑO

### **¿Por qué Precios +30% en Stores?**

**Opción A:** Mismo precio en todas partes
- ❌ Pierdes 12-13 EUR por suscripción en stores
- ❌ No competitivo a largo plazo

**Opción B:** Precio +30% en stores ✅ (Implementado)
- ✅ Compensas comisión de stores
- ✅ Incentivas compra en web
- ✅ Cumples restricciones de Apple (no mencionas precio web en app)

### **¿Por qué Backend Unificado?**

**Alternativa:** Lógica separada por plataforma
- ❌ Código duplicado
- ❌ Difícil mantener sincronizado
- ❌ Más bugs potenciales

**Solución:** Un servicio (`subscriptionService.js`) ✅
- ✅ Una fuente de verdad
- ✅ Firestore sincronizado
- ✅ Fácil de mantener
- ✅ Usuario ve mismas suscripciones en web/iOS/Android

---

## 🎯 KPIs A MONITOREAR

### **Conversión por Plataforma:**
- % usuarios que compran en Web vs iOS vs Android
- Valor promedio por plataforma
- Tasa de cancelación por plataforma

### **Ingresos:**
- MRR (Monthly Recurring Revenue) total
- MRR por plataforma
- Trial → Paid conversion rate
- Churn rate

### **Técnico:**
- Tasa de éxito de webhooks
- Tiempo de respuesta de `/verify` endpoints
- Errores en verificación de receipts

---

## ⚠️ ADVERTENCIAS IMPORTANTES

### **Restricciones de Apple:**
❌ **PROHIBIDO en la app iOS:**
- Mencionar "Compra más barato en nuestra web"
- Mostrar precios de Stripe
- Linkear directamente a checkout web

✅ **PERMITIDO:**
- Tener precios diferentes (sin mencionarlo en app)
- Link genérico a tu sitio web
- En emails fuera de la app mencionar precios web

### **Comisiones Variables:**
- **Año 1:** 30% (Apple/Google)
- **Año 2+:** 15% si usuario mantiene suscripción
- **Small Business (<$1M/año):** 15% desde inicio (si calificas)

### **Tiempos de Pago:**
- **Stripe:** 2-7 días
- **Apple:** 30-60 días
- **Google:** 30-60 días

---

## 📞 SOPORTE

### **Problemas Técnicos:**
- **Backend:** Revisar `backend/SETUP-MULTI-PLATFORM-PAYMENTS.md`
- **iOS:** Revisar `ios/README.md`
- **Android:** Revisar `android/README.md`

### **Problemas de Configuración:**
- **Stripe:** `docs/STRIPE-SETUP.md`
- **Apple:** `docs/APPLE-IAP-SETUP.md`
- **Google:** `docs/GOOGLE-PLAY-SETUP.md`

---

**Última actualización:** 23 de octubre de 2025  
**Versión:** 1.0  
**Estado:** Backend completo ✅ | Apps pendientes ⏳  
**Próximos pasos:** Configurar App Store Connect y Google Play Console
