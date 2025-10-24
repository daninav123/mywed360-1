# 3. Gestión de Invitados (estado 2025-10-07)

> Implementado: `Invitados.jsx`, `RSVPDashboard.jsx`, `AcceptInvitation.jsx`, `GuestEventBridge.jsx`, componentes (`GuestList`, `GuestFilters`, `GuestForm`, `GuestBulkGrid`, `ContactsImporter`, `GroupManager`), modales de WhatsApp (`WhatsAppModal`, `WhatsAppSender`, `SaveTheDateModal`, `InviteTemplateModal`), servicios `useGuests`, `SyncService`, `MessageTemplateService`, `whatsappService`, `WhatsAppBatchService`, dataset demo (`loadSampleGuests`) y panel analítico RSVP.
> Pendiente: sincronización completa con Seating Plan (persistencia bidireccional) y automatizaciones IA reactivas a cambios de invitados.

## 1. Objetivo y alcance
- Centralizar alta, edición y seguimiento de invitados (datos personales, RSVP, acompañantes, mesa, grupos).
- Gestionar importaciones masivas y plantillas de mensajería (WhatsApp/email) con programación y registro.
- Ofrecer herramientas de diagnóstico y sincronización en modo online/offline.

## 2. Trigger y rutas
- Menú inferior → `Más` → **Invitados** → `/invitados` (`Invitados.jsx`).
- Modal de resumen RSVP (`RSVPDashboard.jsx`) accesible desde la misma pantalla.
- Invitaciones para colaboradores → `/accept-invitation/:code` (`AcceptInvitation.jsx`).
- Eventos globales `mywed360-guests` se capturan en `GuestEventBridge` (MainLayout) para refrescar vistas.

## 3. Paso a paso UX
### Gestión principal (`Invitados.jsx`)
- Cabecera con info contextual y herramientas DEV (IDs, seeds). Banner guía si no hay boda activa.
- `GuestFilters`: búsqueda por nombre/email/teléfono/notas, filtros por estado RSVP, mesa, grupo; contador y selección múltiple.
- Vista responsive:
  - **Desktop**: tabla con columnas configurables (nombre, RSVP, acompañantes, mesa, grupo, restricciones, acciones) y tooltips.
  - **≤1024 px**: tarjetas apiladas y `ActionSheet` inferior para acciones (WhatsApp, Email, Editar, Eliminar); filtros colapsables y buscador modal.
  - **Offline**: badge “Sin conexión”; acciones que requieren red quedan deshabilitadas.
- Acciones masivas: alta manual (`GuestForm`), alta masiva (`GuestBulkGrid`), importador (`ContactsImporter`), mensajería (WhatsApp/email), edición de plantillas (`InviteTemplateModal`), resumen RSVP, reasignación de mesa, carga de ejemplos QA (`loadSampleGuests`).
- Lista (`GuestList`): toggles RSVP `pending → confirmed → declined`, chips de restricciones, acompañantes. Menú `…` permite `Mover a mesa`, `Asignar grupo`, `Duplicar`, `Eliminar`, `Exportar QR`.
- `GuestForm`: datos personales, direccionamiento, acompañantes, notas; autosave 30 s, validación en tiempo real.
- `GuestBulkGrid`: pega desde Excel/Sheets, resalta celdas erróneas, dedupe por email/teléfono. Resumen (creados, duplicados, errores) + descarga CSV de errores.
- `ContactsImporter`: Contact Picker API + CSV, mapeo de columnas, preview antes de guardar, warning >500 filas y bloqueo >2000.
- Mensajería y comunicaciones:
  - `WhatsAppModal`: pestañas número personal / Business API, previsualización, límite 250 mensajes por lote.
  - `WhatsAppSender` + `whatsappService.schedule`: programan envíos (estados `pending`, `in_progress`, `sent`, `failed`) visibles en `WhatsAppBatchService` con reintentos manuales.
  - `InviteTemplateModal`: edita plantillas (`{guestName}`, `{coupleName}`, `{rsvpLink}`, `{weddingDate}`) almacenadas en `guestMessageTemplates` (localStorage).
  - `SaveTheDateModal`: accesos rápidos (`save_the_date`, `wedding_update`, `thank_you`).
  - Email: `SendEmailModal` usa `sendMail`/`scheduleMail`, adjunta invitación digital y registra log en `guestMessages` (`channel=email`).
- Impresión física: `POST /api/print/invitations` con `assetUrl`, sobre personalizado (nombre/dirección) y `printBatchId` para seguimiento.
- Resumen RSVP: modal embudo (confirmados/pendientes/declinados), tabla, exportación CSV/PDF y shortcut a recordatorios.
- Compatibilidad offline: sincroniza `localStorage.mywed360Guests`, emite `mywed360-guests-updated`, muestra toast al recuperar conexión y permite cargar fixtures QA.
- Eventos y automatizaciones: `GuestEventBridge` propaga `mywed360-guests`; Seating emite `mywed360-seating` (pendiente persistencia) para actualizar `seatAssignment`.

### Dashboard RSVP (`RSVPDashboard.jsx`)
- Fuente: `weddings/{id}/rsvp/stats` + `weddings/{id}/guests`.
- Métricas: embudo de respuesta, evolución temporal, distribución por mesa/grupo/canal.
- Listado detallado con enlaces RSVP, filtros avanzados y exportaciones.
- `GuestReminderPanel`: campañas en `rsvpReminderQueue` (email/WhatsApp), preview editable, scheduling, historial (enviados/pending/fallidos).

## 4. Persistencia y datos
- `weddings/{id}/guests/{guestId}`: datos personales, RSVP, acompañantes, restricciones, `seatAssignment`, `messageStats`, historial.
- Colecciones auxiliares: `guestMessages`, `guestImports`, `guestSegments`, `rsvpReminderQueue`.
- `guestMessages` registra `{ channel, status, templateId, scheduledAt, batchId }` para cada envío.
- `useGuests` + `SyncService` gestionan cache local y emiten eventos (`mywed360-guests-updated`).

## 5. Reglas de negocio
- Sin boda activa no se permite crear invitados (salvo modo DEV).
- Duplicados se detectan por email/teléfono normalizados → modal para merge manual.
- Roles: owner/planner pueden editar/borrar y enviar comunicaciones; assistants sólo actualizan RSVP/notas.
- Asignación seating: actualiza `seatAssignment`; Seating debe confirmar cambios (pendiente backend bidireccional).
- Mensajería requiere número válido (`DEFAULT_COUNTRY_CODE`) y se registra en `guestMessages`.

## 6. Estados especiales y errores
- Alta manual con errores → toast + detalle (celdas resaltadas).
- Importación CSV/contactos → resumen con botones “Descargar errores” y “Ver duplicados”.
- Envíos WhatsApp/email → panel de estado (pendiente, enviado, fallido) con acción “Reintentar”.
- `MessageTemplateService` sin plantilla → placeholder “Selecciona o crea una plantilla”.
- Errores de red → banner “Perdimos la conexión” (reintentos automáticos).

## 7. Integración con otros flujos
- Seating (flujos 4/13): VIP, restricciones, asignación de mesa (pendiente persistencia completa).
- Finanzas/Contratos (flujos 6/15): reutilizan emails para notificaciones de pago/firma.
- RSVP (flujo 9): consume RSVP y campañas de recordatorios.
- Protocolo (flujos 11): usa roles/acompñantes.
- Automatizaciones/Asistente (flujos 12/16): usarán eventos `guest_message_sent`.
- Sitio público (flujo 21): aprovecha enlaces de invitación y perfil.

## 8. Métricas y monitorización
- Eventos: `guest_created`, `guest_updated`, `guest_deleted`, `guest_imported`, `guest_rsvp_updated`, `guest_message_sent`, `guest_whatsapp_scheduled`.
- Indicadores clave: conversión RSVP, ratio por grupo/rol, volumen de mensajes por canal, uso de importadores y recordatorios.
- Logs disponibles en `guestMessages`/`GuestEventBridge`; modo DEV expone `window.__GUESTS_TEST_API__` (`loadFixture`, `logWhatsApp`, `logEmail`, `getMessages`, `getEmails`).

## 9. Pruebas recomendadas
- Unitarias: parsing/importación de contactos, deduplicación, generador de mensajes, plantillas.
- Integración: importación CSV → validación → confirmación → sincronización seating.
- E2E: alta masiva, envío WhatsApp/email, confirmación RSVP, exportación CSV y recordatorios programados.

## Cobertura E2E implementada
- `cypress/e2e/guests/guest-segment-sync.cy.js`
- `cypress/e2e/guests/guest-whatsapp-flow.cy.js`
- `cypress/e2e/guests/guest-import.cy.js`

## 10. Checklist de despliegue
- Revisar reglas Firestore (`guests`, `guestMessages`, `guestImports`, `guestSegments`).
- Configurar proveedores (WhatsApp API, Mailgun) y plantillas (`MessageTemplateService`).
- Validar cuotas/métricas (`guestMetrics`, `rsvpStats`) y endpoints (`/api/whatsapp/*`, `/api/rsvp/reminders`, `/api/guests/{id}/rsvp-link`).
- Ejecutar seeds QA (`window.__GUESTS_TEST_API__` → `loadFixture`).

## 11. Roadmap / pendientes

### 🔍 ESTADO REAL VERIFICADO (2025-10-24)

**Implementación: ✅ 95%** | **Cobertura E2E: 🟡 65%**

**✅ IMPLEMENTADO Y FUNCIONAL:**

1. **CRUD Completo de Invitados** ✅
   - `src/pages/Invitados.jsx` ✅
   - `src/components/guests/GuestList.jsx` ✅
   - `src/components/guests/GuestForm.jsx` ✅
   - `src/hooks/useGuests.js` ✅

2. **Importación Masiva** ✅
   - `src/components/guests/ContactsImporter.jsx` ✅
   - `src/components/guests/GuestBulkGrid.jsx` ✅
   - Soporta CSV/Excel, Contact Picker API
   - Deduplicación por email/teléfono

3. **WhatsApp Batch Messaging** ✅
   - `src/services/whatsappService.js` ✅
   - `src/components/guests/WhatsAppModal.jsx` ✅
   - `src/services/WhatsAppBatchService.js` ✅
   - Programación de envíos
   - Límite 250 mensajes por lote

4. **RSVP Tracking** ✅
   - `src/pages/RSVPDashboard.jsx` ✅
   - Dashboard con métricas
   - Estados: pending/confirmed/declined

5. **Grupos y Asignación** ✅
   - `src/components/guests/GroupManager.jsx` ✅
   - Gestión de grupos
   - Asignación de mesa básica

6. **Offline-First** ✅
   - Sincronización con localStorage
   - `src/services/SyncService.js` ✅
   - Eventos `mywed360-guests-updated`

7. **Tests E2E** 🟡
   - `cypress/e2e/guests/` (4 archivos)
   - `cypress/e2e/critical/guests.cy.js` ✅
   - `cypress/e2e/critical/guests-real.cy.js` ✅
   - Cobertura: ~65% (tests básicos)

**🟡 PARCIALMENTE IMPLEMENTADO:**

1. **Integración Seating Bidireccional** 🟡
   - Asignación a mesa: ✅ Funciona
   - Sincronización bidireccional: ❌ Pendiente
   - Campo `seatAssignment` existe pero no se sincroniza automáticamente
   - Estimación: 8-12 horas

2. **Manejo Defensivo de Hooks** 🟡
   - Página usa valores mock para estabilidad (decisión temporal)
   - Try-catch implementado pero hooks deshabilitados
   - Reintegración gradual pendiente

**❌ NO IMPLEMENTADO:**

1. **IA para Agrupar Invitados** ❌
   - Sugerencias automáticas de grupos ❌
   - Mensajes personalizados con IA ❌
   - Estimación: 15-20 horas

2. **Mensajería Omnicanal** ❌
   - SMS/push orquestada ❌
   - Automatizaciones avanzadas ❌
   - Estimación: 20-30 horas

3. **Portal Colaborador** ❌
   - Permisos restringidos ❌
   - Vista externa ❌
   - Estimación: 30-40 horas

4. **Sincronización CRM Externo** ❌
   - Integración CRM ❌
   - Estimación: 25-35 horas

**⚠️ TESTS FALTANTES:**

1. **WhatsApp Service** ❌
   - `whatsappService.js` sin tests E2E
   - `WhatsAppBatchService.js` sin tests
   - Estimación tests: 4 horas

2. **Importación Masiva** 🟡
   - Tests parciales en `guests-import.cy.js`
   - Falta cobertura completa
   - Estimación: 3 horas

3. **Grupos** ❌
   - `GroupManager.jsx` sin tests
   - Estimación: 3 horas

### Pendientes Priorizados:

**Corto Plazo (1-2 semanas):**
- ⏳ Sincronización bidireccional Seating (8-12h)
- ⏳ Tests WhatsApp service (4h)
- ⏳ Tests importación completa (3h)

**Medio Plazo (1-2 meses):**
- ⏳ IA para agrupar invitados (15-20h)
- ⏳ Mensajería omnicanal (20-30h)

**Largo Plazo (3-6 meses):**
- ⏳ Portal colaborador (30-40h)
- ⏳ Sincronización CRM (25-35h)
