# 3. Gestión de Invitados (estado 2025-10-07)

> Implementado: `Invitados.jsx`, `RSVPDashboard.jsx`, `AcceptInvitation.jsx`, `GuestEventBridge.jsx`, componentes de invitados (`GuestList`, `GuestFilters`, `GuestForm`, `GuestBulkGrid`, `ContactsImporter`, `GroupManager`), modales de WhatsApp (`WhatsAppModal`, `WhatsAppSender`, `SaveTheDateModal`, `InviteTemplateModal`), servicios `useGuests`, `SyncService`, `MessageTemplateService`, `whatsappService`, `WhatsAppBatchService`, dataset demo (`loadSampleGuests`), modal de check-in con QR/códigos manuales y panel analítico de RSVP.  
> Pendiente: sincronización completa con Seating Plan (persistencia bidireccional en backend) y automatizaciones IA reactivas a cambios de invitados.

## 1. Objetivo y alcance
- Centralizar el alta, edición y seguimiento de invitados (datos personales, RSVP, acompañantes, asignación de mesa).
- Gestionar importaciones masivas, plantillas de mensajería y recordatorios.
- Ofrecer herramientas de diagnóstico y sincronización (online/offline).

## 2. Trigger y rutas
- Menú inferior → `Más` → bloque **Invitados** → “Gestión de invitados” (`/invitados`, render `Invitados.jsx`).
- Resumen RSVP disponible como modal dentro de la propia pantalla de invitados (render `RSVPDashboard.jsx`, descrito en detalle en el Flujo 9).
- Invitaciones de colaboradores: enlaces enviados apuntan a `/accept-invitation/:code` (`AcceptInvitation.jsx`).
- Eventos externos (`window.dispatchEvent('mywed360-guests', ...)`) se capturan con `GuestEventBridge` en `MainLayout`.

## 3. Paso a paso UX
1. **Invitados (`Invitados.jsx`)**
   - Cabecera con título, descripción y herramientas de depuración en modo DEV (IDs, conteos, login manual).
   - Banner cuando no hay boda seleccionada (guía para crear/seleccionar boda o cargar datos de prueba).
   - `GuestFilters`: búsqueda por nombre/email/teléfono/notas, filtros por estado RSVP, mesa y grupo; contador y selección múltiple.
   - Acciones masivas:
     * Alta manual (`GuestForm`), alta masiva (`GuestBulkGrid`), importación (`ContactsImporter`).
     * Save the Date (`SaveTheDateModal`), resumen RSVP, edición de plantillas API (`InviteTemplateModal`).
     * Envío/Programación vía WhatsApp (`inviteSelectedWhatsAppApi`, `handleScheduleSelected`), difusión por extensión, reasignación de mesa para seleccionados.
     * Botón “Cargar ejemplos” (solo QA/dev): invoca `loadSampleGuests`, alimenta la vista con `cypress/fixtures/guests-demo.json` o fixtures personalizadas a través de `window.__GUESTS_TEST_API__`.
     * Botón “Alta masiva” abre `GuestBulkGrid` para pegar desde hojas de cálculo con deduplicación automática y `notify` para feedback.
   - Lista (`GuestList`): tabla escritorio y tarjetas móviles, toggles RSVP `pending → confirmed → declined`, acciones por fila (WhatsApp, email -pendiente-, editar, eliminar), indicadores de restricciones y acompañantes. Los cambios de estado invocan `updateGuest` y traducen a `accepted`/`rejected` al sincronizar con backend.
   - Formulario modal (`GuestForm`): datos personales, dirección, mesa, acompañantes, notas; validaciones y autosave cada 30s.
   - Alta masiva (`GuestBulkGrid`): pegado desde Excel/Sheets, validaciones por celda, deduplicación.
   - Importador (`ContactsImporter`): Contact Picker API + CSV, asignación previa de mesa, dedupe antes de crear.
   - Mensajería WhatsApp:
     * `WhatsAppModal`: pestañas móvil personal/empresa, envío puntual o masivo vía `/api/whatsapp/send` y `/send-batch`.
     * `WhatsAppSender`: creación de lotes manuales (`WhatsAppBatchService.sendBatch`).
     * `handleScheduleSelected`: programa envíos (`whatsappService.schedule`) con enlaces RSVP por invitado.
     * `SaveTheDateModal`: mensajes tipo “save_the_date” (reutiliza `whatsappService.sendText`).
     * `InviteTemplateModal`: edita plantillas `{guestName}` y persiste en localStorage.
   - Impresión física: desde la misma pantalla se generan pedidos (`/api/print/invitations`) reutilizando una invitación única (`assetUrl`) y personalizando el sobre por invitado (nombre y dirección) con un identificador de lote (`printBatchId`).
   - Correo electrónico: la acción “Email” por invitado usa `sendMail` (plantillas `{guestName}`, `{coupleName}`), adjunta la invitación digital y registra el canal `email`.
  - Resumen RSVP: modal con totales (confirmados/pendientes/rechazados), tabla y acción de impresión/exportación.
  - Check-in Día B: botón en la toolbar abre modal dedicado (`handleConfirmCheckIn`/`markGuestCheckIn`), acepta códigos manuales o escaneados por `BarcodeDetector`, registra histórico y permite revertir la asistencia.
   - Compatibilidad/offline: sincroniza `localStorage.mywed360Guests`, emite `mywed360-guests-updated`, muestra indicador de conexión y permite cargar muestras (`sampleGuests`/fixture QA).

2. **Dashboard RSVP (`RSVPDashboard.jsx`)**
   - Escucha `weddings/{id}/rsvp/stats` y `weddings/{id}/guests`.
   - Métricas: embudo de respuesta (confirmados/pendientes/rechazados), evolución de los últimos 7 días, desglose por canal (`responsesByChannel`) y registro de recordatorios (`rsvpLogs`).
   - Acciones: copiar enlaces RSVP, enviar recordatorios (`/api/rsvp/reminders`, `dryRun`), evaluar reglas (`evaluateTrigger`) para notificaciones. Las acciones de gestión profunda (marcar confirmaciones, análisis completo) se documentan y coordinan con el Flujo 9.

3. **Invitaciones a colaboradores (`AcceptInvitation.jsx`)**
   - Ruta pública con `:code`; tras autenticarse el invitado, llama `acceptInvitation`, actualiza roles y redirige a `/bodas/{id}`.

## 4. Persistencia y datos
- Firestore `weddings/{id}/guests/{guestId}`: campos completos (`name`, `email`, `phone`, `status`, `companions`, `table`, `group`, `dietaryRestrictions`, `rsvpToken`, timestamps, etc.).
- `weddings/{id}/rsvp/stats`, `weddings/{id}/rsvpLogs` (histórico de recordatorios).
- LocalStorage: `mywed360Guests`, `mywed360_active_wedding`, `whatsapp_invite_template`.
- `SyncService`: estado `syncState`, cola `pendingSyncQueue`, timestamps de última sincronización.

## 5. Reglas de negocio
- Email/teléfono únicos por boda (deduplicación en alta masiva/importador).
- Teléfonos normalizados a E.164 (`VITE_DEFAULT_COUNTRY_CODE`).
- Estados RSVP válidos en la interfaz: `pending`, `confirmed`, `declined`; al persistir hacia backend se traducen a `pending`, `accepted`, `rejected` para mantener compatibilidad con la API (`/api/rsvp/*`).
- Acompañantes: validación 0-20 y sincronización con tipo/grupo.
- Cuando se reasigna mesa, se actualiza acompañantes y `companionGroupId`.
- Envíos API eliminan duplicados de teléfono y registran errores por invitado.

## 6. Estados especiales y errores
- Indicadores de modo offline, toasts en fallos de guardado o sincronización.
- `GuestEventBridge` ignora eventos sin coincidencia y refresca lista al recibir actualizaciones externas.
- Importaciones/alta masiva reportan filas válidas/erróneas; permiten revisar antes de confirmar.
- Mensajería: fallback sin extensión, bloqueo si proveedor no está configurado, alerts en programaciones fallidas.
- Recordatorios RSVP informan resultado (`dryRun` o envío real).
- `AcceptInvitation` muestra mensajes claros cuando el código es inválido o ya usado.

## 7. Integración con otros flujos
- Flujo 4 (plan de asientos/gestión de contenido) consume invitados confirmados.
- Flujo 5 y 15 generan tareas/contratos asociados a invitados.
- Flujo 6 (finanzas) se apoya en recuentos para estimaciones.
- Flujo 9 (RSVP) sintetiza métricas y recordatorios.
- Flujo 14 (checklist) crea tareas automáticas tras importaciones o eventos RSVP.
- Flujo 16 (asistente) puede sugerir acciones basadas en este módulo.

## 8. Métricas y monitorización
- `RSVPDashboard` muestra totales y evolución (confirmados, pendientes, rechazados, restricciones).
- `WhatsAppModal` consulta métricas de entrega (`deliveryRate`, `readRate`) cuando el backend las expone.
- `SyncService` registra `lastSyncTime` y dispara toasts en sincronizaciones forzadas.
- Roadmap: dashboard consolidado de métricas (hoy sólo parcial).

## 9. Pruebas recomendadas
- Unitarias: `useGuests`, esquemas `guestSchema`/`guestUpdateSchema`, `MessageTemplateService`, `WhatsAppBatchService`, `SyncService`.
- Integración: alta/edición/eliminación, cambio RSVP, importación CSV/contactos, envío/programación WhatsApp, resumen RSVP, eventos `GuestEventBridge`.
- E2E: alta masiva + seating, Save the Date, recordatorios RSVP, aceptación de invitación.

## Cobertura E2E implementada
- `cypress/e2e/guests/guests_flow.cy.js`: cubre alta manual y masiva de invitados, consulta del resumen RSVP y filtros principales de la vista de invitados.

## 10. Checklist de despliegue
- Configurar proveedor WhatsApp y variables (`VITE_BACKEND_BASE_URL`, `VITE_DEFAULT_COUNTRY_CODE`, credenciales).
- Reglas Firestore actualizadas (CRUD de `guests` y `rsvp`).
- Endpoints habilitados: `/api/whatsapp/send`, `/send-batch`, `/batch`, `/schedule`, `/api/whatsapp/provider-status`, `/api/rsvp/reminders`, `/api/guests/{id}/rsvp-link`.
- Revisar traducciones/mensajes de toasts y compatibilidad con modo offline.

## 11. Roadmap / pendientes
- Sincronización completa con Seating Plan (lectura/escritura Firestore y resolución de conflictos entre dispositivos).
- Automatizaciones IA sobre invitados (sugerencias proactivas, mensajes y tareas derivadas de cambios RSVP/check-in).
- Exportaciones y reporting día B (listado de check-in, etiquetas personalizadas y QR individuales). 

## 12. Plan de QA incremental (2025-10-12)
### Estado actual verificado
- Specs E2E (`cypress/e2e/guests/guests_flow.cy.js`, `guests_crud.cy.js`, `guests_messaging.cy.js`) corren en modo stub usando `window.__GUESTS_TEST_API__` y cubren dataset demo, CRUD, bulk update, mensajería y pedidos de impresión.
- `loadSampleGuests` expone fixtures (`cypress/fixtures/guests-demo.json`) y los helpers de check-in (`markGuestCheckIn/Out`) mantienen histórico y sincronización con Seating/IA por eventos.
- Dashboard RSVP muestra embudo, timeline, breakdown por canal y bitácora de recordatorios sin depender de Firestore real en pruebas.

### Experiencia mínima a construir
- Extender `guests_import_rsvp` con escenarios edge (campos ausentes, códigos duplicados) y verificación de métricas RSVP tras importaciones.
- Cubrir casos de error de check-in (códigos inválidos, duplicados) con fixtures dedicadas.
- Instrumentar pruebas offline (simular `navigator.onLine=false`) para validar colas de sincronización.

### Criterios de prueba E2E propuestos
1. `guests_flow`: carga dataset demo, filtra por RSVP, ejecuta check-in y revisa resumen RSVP.
2. `guests_crud`: altas manuales, edición, filtros, cambios de estado y acciones masivas.
3. `guests_messaging`: edición de plantillas, envíos Save the Date / API y generación de pedidos de impresión.
4. `guests_import_rsvp`: importar CSV, validar deduplicación y métricas del resumen RSVP.

### Dependencias técnicas
- Fixtures: `cypress/fixtures/guests-demo.json`, `cypress/fixtures/guests-import.csv` y helpers para seeds QA.
- Test API: `window.__GUESTS_TEST_API__` con `loadFixture`, `logWhatsApp`, `logEmail`, `logEvent`, `getMessages/getEmails`.
- Stubs de API (`cy.intercept`) para `/api/whatsapp/*`, `/api/print/invitations`, `/api/rsvp/reminders`, `/api/guests/*/rsvp-link`.
