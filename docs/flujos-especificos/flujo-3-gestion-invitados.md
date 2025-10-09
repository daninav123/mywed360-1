# 3. Gestión de Invitados (estado 2025-10-07)

> Implementado: `Invitados.jsx`, `RSVPDashboard.jsx`, `AcceptInvitation.jsx`, `GuestEventBridge.jsx`, componentes de invitados (`GuestList`, `GuestFilters`, `GuestForm`, `GuestBulkGrid`, `ContactsImporter`, `GroupManager`), modales de WhatsApp (`WhatsAppModal`, `WhatsAppSender`, `SaveTheDateModal`, `InviteTemplateModal`), servicios `useGuests`, `SyncService`, `MessageTemplateService`, `whatsappService`, `WhatsAppBatchService`.  
> Pendiente: dashboard analítico de RSVP, check-in en día del evento y sincronización automática con Seating Plan.

## 1. Objetivo y alcance
- Centralizar el alta, edición y seguimiento de invitados (datos personales, RSVP, acompañantes, asignación de mesa).
- Gestionar importaciones masivas, plantillas de mensajería y recordatorios.
- Ofrecer herramientas de diagnóstico y sincronización (online/offline).

## 2. Trigger y rutas
- Menú inferior → `Más` → bloque **Invitados** → “Gestión de invitados” (`/invitados`, render `Invitados.jsx`).
- Resumen RSVP disponible como modal dentro de la propia pantalla de invitados (render `RSVPDashboard.jsx`).
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
   - Lista (`GuestList`): tabla escritorio y tarjetas móviles, toggles RSVP `pending → confirmed → declined`, acciones por fila (WhatsApp, email -pendiente-, editar, eliminar), indicadores de restricciones y acompañantes.
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
   - Compatibilidad/offline: sincroniza `localStorage.mywed360Guests`, emite `mywed360-guests-updated`, muestra indicador de conexión y permite cargar muestras (`sampleGuests`).

2. **Dashboard RSVP (`RSVPDashboard.jsx`)**
   - Escucha `weddings/{id}/rsvp/stats` y `weddings/{id}/guests`.
   - Acciones: copiar enlaces RSVP, enviar recordatorios (`/api/rsvp/reminders`, `dryRun`), evaluar reglas (`evaluateTrigger`) para notificaciones.

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
- Estados RSVP válidos: `pending`, `confirmed`, `declined`.
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
- Dashboard avanzado (métricas, embudos RSVP, historial de comunicaciones).
- Check-in en el día del evento (lectura QR, actualización en tiempo real).
- Sincronización automática con Seating Plan y con el asistente IA (respuesta/acciones). 
