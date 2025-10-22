# Licencias por Boda

> Modelo vigente (octubre 2025): cada boda se habilita con un pago único y queda activa hasta 30 días después de la fecha del evento. No existen renovaciones anuales automáticas. Todas las referencias en código y documentos deben alinearse con esta versión.

## 🎯 Principios generales
- Una licencia = una boda activa (`weddingId`).
- Vigencia estándar: `valid_until = weddingDate + 30 días`.
- Tras la fecha de vigencia la boda pasa a modo lectura (sin edición) y muestra upsell para extensión.
- Existe un complemento de “Extensión post-boda” que añade 90 días extra de acceso editable.
- Los planners operan con paquetes de licencias que pueden pagarse en mensualidades (12 cuotas) o en un único pago anual (15 % de descuento), siempre con un mes de prueba gratuita.

---

## 💑 Planes para parejas (pago único por evento)

### Free
- **Precio:** 0 €
- **Incluye:** 1 boda, hasta 80 invitados, seating plan básico, gestión de finanzas, directorio de proveedores, publicidad visible.
- **Uso ideal:** bodas íntimas o usuarios explorando la plataforma.

### Wedding Pass
- **Precio:** 50 € por boda
- **Incluye:** todo lo de Free + invitados ilimitados, contacto directo con proveedores, protocolo completo, 50 diseños web, soporte prioritario, acceso a plantillas premium.
- **Uso ideal:** bodas medianas/grandes que necesitan herramientas completas sin recurrencia anual.

### Wedding Pass Plus
- **Precio:** 85 € por boda
- **Incluye:** todo lo de Wedding Pass + eliminación total de marca en invitaciones/PDF/pantallas, biblioteca completa de diseños, editor web premium, galería de recuerdos y 1 ayudante con acceso completo a esa boda.
- **Uso ideal:** bodas premium o eventos donde la imagen y la colaboración externa son clave.

### Extensión post-boda (complemento)
- **Precio:** 15 € por boda
- **Función:** añade 90 días extra de acceso editable tras `valid_until`. Se adquiere sólo cuando la boda está en modo lectura.

---

## 👩‍💼 Paquetes para Wedding Planners

> Todos los paquetes incluyen un mes de prueba gratuita (no consume cupo) y permiten elegir entre pago mensual (12 cuotas) o pago único anual con un 15 % de descuento. La modalidad mensual funciona como suscripción Stripe con `trial_period_days = 30`.

### Planner Pack 5
- **Precio total:** 500 € (12 cuotas: 41,67 €) · Pago anual: 425 €.
- **Incluye:** hasta 5 bodas activas simultáneas, herramientas profesionales, priorización en directorio, soporte prioritario.

### Planner Pack 15
- **Precio total:** 1.350 € (12 cuotas: 112,50 €) · Pago anual: 1.147,50 €.
- **Incluye:** hasta 15 bodas activas simultáneas, analytics por cliente, priorización extendida, soporte prioritario.

### Teams 40
- **Precio total:** 3.200 € (12 cuotas: 266,67 €) · Pago anual: 2.720 €.
- **Incluye:** 40 bodas activas por año natural, 1 perfil principal + 3 perfiles adicionales con acceso limitado, dashboard consolidado de equipo, colaboración avanzada.

### Teams Ilimitado
- **Precio total:** 5.000 € (12 cuotas: 416,67 €) · Pago anual: 4.250 €.
- **Incluye:** bodas y perfiles ilimitados, white-label completo, dominio propio, soporte dedicado 24/7, formación y onboarding personalizado, acceso API configurado.

**Notas operativas:**
- Cada compra de pack genera licencias disponibles (`quotaTotal`) y las bodas asignadas consumen del cupo (`quotaUsed`).
- El planner puede reasignar una licencia antes de fijar la fecha de boda; tras la asignación la licencia queda ligada al nuevo `weddingId`.
- Las licencias en trial muestran `status = "trial"` hasta `trialEndsAt`; pasado ese punto cambian automáticamente a `active`.

---

## 📊 Comparativa rápida

| Funcionalidad | Free | Wedding Pass | Wedding Pass Plus | Planner Pack 5 | Planner Pack 15 | Teams 40 | Teams Ilimitado |
|---------------|------|--------------|-------------------|----------------|-----------------|----------|-----------------|
| **Precio** | 0 € | 50 €/boda | 85 €/boda | 41,67 €/mes (425 € anual) | 112,50 €/mes (1.147,50 € anual) | 266,67 €/mes (2.720 € anual) | 416,67 €/mes (4.250 € anual) |
| **Bodas activas** | 1 | 1 | 1 | 5 | 15 | 40/año natural | ∞ |
| **Invitados** | 80 | ∞ | ∞ | ∞ | ∞ | ∞ | ∞ |
| **Sin marca** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Ayudantes incluidos** | 0 | 0 | 1 | 2 colaboradores/cliente | 2 colaboradores/cliente | 3 cuentas | ∞ |
| **Contacto proveedores** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Protocolo completo** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Diseños web** | 5 | 50 | 50 + biblioteca completa | ∞ | ∞ | ∞ | ∞ |
| **Prioridad directorio** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **White-label total** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Soporte** | Básico | Prioritario | Prioritario | Prioritario | Prioritario | Dedicado | 24/7 |

---

## 🗓️ Gestión de vigencia y alertas
- `weddingLicenses`: colección con `status (active|trial|read_only|expired)`, `valid_until`, `stripeSessionId`, `stripeCustomerId`, `stripeSubscriptionId`.
- `plannerPacks`: guarda `quotaTotal`, `quotaUsed`, `trialEndsAt`, `currentPeriodEnd`, `status`.
- Los webhooks que deben procesarse:
  - `checkout.session.completed` → activa licencias de boda y crea registros de packs con estado `trial`.
  - `invoice.payment_succeeded` / `invoice.payment_failed` → actualiza `status` y periodos de packs.
  - `customer.subscription.updated/deleted` → sincroniza cambios (cancelaciones, fin de trial).
- Al expirar `valid_until`, el worker (`backend/workers/licenseMaintenance.js`) marca la boda `read_only`, envía alertas (30/7/1 días) y registra notificaciones en `notificationsQueue`.

---

## ✅ Checklist técnico
- Configurar precios Stripe (modo test y live) con IDs reutilizables en `.env`:
  - `STRIPE_PRICE_WEDDING_PASS`
  - `STRIPE_PRICE_WEDDING_PASS_PLUS`
  - `STRIPE_PRICE_PLANNER_PACK5_MONTHLY` / `_ANNUAL`
  - `STRIPE_PRICE_PLANNER_PACK15_MONTHLY` / `_ANNUAL`
  - `STRIPE_PRICE_TEAMS40_MONTHLY` / `_ANNUAL`
  - `STRIPE_PRICE_TEAMS_UNLIMITED_MONTHLY` / `_ANNUAL`
- Actualizar `backend/config/stripe-products.js` y `docs/STRIPE-SETUP.md` usando los mismos nombres.
- Endpoints clave:
  - `POST /api/payments/wedding-pass` (`mode: payment`)
  - `POST /api/payments/planner-pack` (`mode: subscription` con trial o `mode: payment` para anual).
- Guardar en Firestore (ver `backend/services/licenseService.js`):
  - `weddingLicenses/{weddingId}`
  - `plannerPacks/{subscriptionId}`
- Middleware de protección (`backend/middleware/licenseGuard.js`) para validar licencias antes de permitir ediciones o consumo de cupo.
- Worker (`startLicenseMaintenanceWorker`) revisa expiraciones y alerta de renovaciones.

---

## 🧭 Mensajería y marketing
- `/precios` muestra estos planes con importes en euros y CTA alineadas con el backend.
- Landing y onboarding deben referirse a “Wedding Pass / Wedding Pass Plus” y “Planner Pack 5/15, Teams 40, Teams Ilimitado”.
- El portal público, documentación de ventas y materiales de soporte deben evitar términos “Plan anual” o “Plan Plus” del modelo anterior.

---

## 🔁 Migraciones y compatibilidad
- Bodas antiguas con suscripción anual: convertir a `weddingLicense` con `planKey = 'legacy_annual'` si se necesita histórico. Restringir nuevas compras a los planes actuales.
- Planners en modelo anterior (`planner_1`, `planner_2`, etc.) deben migrarse manualmente a packs; preservar datos en notas/backoffice.
- Asegurar que métricas y dashboards usen los campos nuevos (`planKey`, `packKey`, `status`) para evitar mezclar modelos.

---

## 📚 Referencias cruzadas
- `backend/routes/payments.js`, `backend/routes/payments-webhook.js`
- `backend/services/licenseService.js`
- `backend/middleware/licenseGuard.js`
- `backend/workers/licenseMaintenance.js`
- `docs/STRIPE-SETUP.md`
- `src/pages/marketing/Pricing.jsx`
- `docs/flujos-especificos/flujo-25-suscripciones.md`

Mantén este documento como fuente de verdad funcional para pricing. Cualquier modificación en producto o marketing debe reflejarse aquí y propagarse a código, onboarding y comunicación pública.
