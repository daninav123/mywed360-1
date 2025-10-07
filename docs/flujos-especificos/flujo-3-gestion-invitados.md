# 3. Gestión de Invitados (estado 2025-10-07)

> Implementado: `Invitados.jsx`, `RSVPDashboard.jsx`, `AcceptInvitation.jsx`, `GuestEventBridge.jsx`, componentes en `src/components/guests/` (GuestList, GuestFilters, GuestForm, GuestBulkGrid, ContactsImporter, GroupManager, GuestEventBridge), modales de WhatsApp (`WhatsAppModal`, `WhatsAppSender`, `SaveTheDateModal`, `InviteTemplateModal`), servicios (`useGuests`, `MessageTemplateService`, `whatsappService`, `WhatsAppBatchService`, `SyncService`), esquemas `guestSchema/guestUpdateSchema` y helpers de contexto (`useWedding`, `useActiveWeddingInfo`).
> Pendiente: cerrar el canal email (`inviteViaEmail`), dashboards avanzados y check-in día del evento, sincronización bidireccional automática con Seating Plan.
> Dependencias clave: Firestore (colecciones `weddings/{id}/guests`, `weddings/{id}/rsvp`, `weddings/{id}/rsvpLogs`), SyncService (estado online/offline), whatsappService (API REST), extensión de automatización WhatsApp, localStorage (`mywed360Guests`).

## 1. Objetivo y alcance
- Centralizar la captura, segmentación y seguimiento de invitados de una boda, incluyendo RSVP, acompañantes, asignación de mesas, grupos y comunicaciones.
- Usuarios previstos: Owner, Planner y Assistants con permisos sobre la boda activa.
- El flujo cubre tanto la operación diaria (altas/ediciones, filtros, comunicaciones) como utilidades complementarias (resumen RSVP, impresión rápida, exportaciones y plantillas de mensaje).

## 2. Trigger y rutas
- Menú inferior → `Más` → bloque **Invitados** → enlace “Gestión de invitados” (`/invitados`, render `Invitados.jsx`).
- Resumen RSVP desde `Más` → **Invitados** → “Resumen RSVP” (abre `/invitados/rsvp`, render `RSVPDashboard.jsx`).
- Invitaciones de colaboradores: enlaces recibidos apuntan a `/accept-invitation/:code` (`AcceptInvitation.jsx`).
- Eventos externos (`window.dispatchEvent('mywed360-guests', ...)`) se capturan mediante `GuestEventBridge` (inyectado en `MainLayout`).

## 3. Paso a paso UX
1. **Invitados.jsx**
   - **Cabecera y contexto**: muestra el título y una descripción breve; en modo desarrollo se incluyen utilidades de depuración (IDs, conteos, login manual) para verificar el estado de los datos.
   - **Fallback y depuración**: si `weddings` está vacío aparece un mensaje guiando al usuario a crear/seleccionar boda. En modo `import.meta.env.DEV` se renderiza un bloque debug con métricas internas (IDs, conteos, estado de auth) y un botón de login manual para Firebase (útil en local).
   - **Filtros y métricas rápidas**: `GuestFilters`
     - Busca por nombre/email/teléfono/notas, filtra por estado (`pending/confirmed/declined`), mesa y grupo (combina `group` y `companionGroupId`).
     - Muestra contador total y habilita selección múltiple (`selectedIds`).
     - Acciones principales:
       * Alta manual (abre `GuestForm`).
       * Alta masiva (`GuestBulkGrid`) con deduplicación.
       * Importación desde contactos (`ContactsImporter`).
       * Exportación CSV (`useGuests().exportToCSV`).
       * **Invitaciones masivas (API)**: llama a `bulkInviteWhatsAppApi`, que construye un lote y lo envía vía `/api/whatsapp/send-batch` devolviendo `ok/fail` agregados.
       * “Enviar SAVE THE DATE” → `SaveTheDateModal` con mensaje precargado.
       * “Resumen RSVP” → abre modal de métricas.
       * “Editar mensaje (API)” → `InviteTemplateModal`, edita la plantilla base guardada en localStorage.
       * Selección múltiple (lado derecho):
         ? “Enviar seleccionados (API)” → `inviteSelectedWhatsAppApi`, usa `/api/whatsapp/send-batch` con dedupe por teléfono y respuesta de resultado.
         ? “Programar seleccionados” → `handleScheduleSelected`, genera enlaces RSVP y llama a `whatsappService.schedule` con metadatos.
         ? “Difusión (extensión)” → `inviteSelectedWhatsAppBroadcastViaExtension`; ofrece fallback individual.
         ? Botón oculto “Asignar / Grupos” para abrir `GroupManager` (se activa cuando se exponga en UI).
   - **Lista de invitados (`GuestList`)**:
     * Tarjetas de métricas: total, confirmados, pendientes, asistentes estimados (`stats.totalAttendees`).
     * Tabla desktop con selección por fila, avatar placeholder, email, teléfono, mesa, acompañantes y badge de restricciones.
     * Toggle de estado RSVP: ciclo `pending ? confirmed ? declined`, persiste con `updateGuest`.
     * Acciones por fila: WhatsApp (`WhatsAppModal`), Email (`inviteViaEmail`, pendiente), editar (`GuestForm`), eliminar (`removeGuest`).
     * Vista móvil con tarjetas, checkbox lateral y toggle idem.
   - **Modal de formulario (`GuestForm`)**: campos completos (datos básicos, dirección detallada, grupo, acompañantes, mesa, notas, restricciones). Valida coherencia, guarda con `addGuest`/`updateGuest` y autosave cada 30 s.
   - **Alta masiva (`GuestBulkGrid`)**: grid editable con pegado desde Excel/Sheets, validación por celda y deduplicación.
   - **Importaci?n de contactos (`ContactsImporter`)**: soporta Contact Picker API y CSV; permite importar todo el lote directamente o seleccionar contactos puntuales para asignarlos a una mesa espec?fica antes de confirmar. El asistente mapea columnas, marca el origen y deduplica frente a la lista actual antes de llamar a `addGuest`.
   - **Mensajería WhatsApp y recordatorios**:
     * `WhatsAppModal`: pestañas m?vil personal / número de la app; esta última envía con `inviteViaWhatsAppApi` y permite trigger masivo a pendientes.
     * `handleSendSelectedMobile`: envío one-click v?a extensión (`inviteSelectedWhatsAppViaExtension`) con fallback a deeplinks (`inviteSelectedWhatsAppDeeplink`).
     * `handleSendSelectedBroadcast`: intenta difusión por extensión, ofrece fallback individual.
     * `handleScheduleSelected`: genera mensajes personalizados (enlace RSVP por invitado si aplica) y programa lotes (`whatsappService.schedule`).
     * `WhatsAppSender`: modal para crear lotes manuales (`WhatsAppBatchService.sendBatch`, POST `/api/whatsapp/batch`).
     * `SaveTheDateModal`: selecciona invitados con tel?fono, permite mensaje global o por invitado, comprueba proveedor y env?a v?a `whatsappService.sendText` (`type: save_the_date`).
     * `InviteTemplateModal`: edita la plantilla base para env?os API, soporta `{guestName}` y guarda en localStorage.
   - **Resumen RSVP**: modal con totales (total/confirmados/pendientes/rechazados) y tabla de confirmados con bot?n de impresi?n / PDF.
   - **Gestor de grupos (`GroupManager`)**: asigna, renombra y fusiona grupos propagando a companions (`companionGroupId`).
   - **Compatibilidad y eventos**: sincroniza `localStorage.mywed360Guests`, emite `mywed360-guests-updated`, escucha eventos externos mediante `GuestEventBridge` y permite `sampleGuests` cuando `VITE_ALLOW_SAMPLE_GUESTS === 'true'`.

2. **RSVPDashboard.jsx**
   - Escucha `weddings/{id}/rsvp/stats` y `weddings/{id}/guests` (pendientes).
   - Acciones `/api/rsvp/reminders` (`dryRun` o env?o real), copia enlaces RSVP y dispara `evaluateTrigger` para notificaciones.

3. **AcceptInvitation.jsx**
   - Ruta p?blica con `:code`, requiere usuario autenticado. Llama `acceptInvitation` y redirige a `/bodas/{id}` en ?xito.

## 4. Persistencia y datos
- Firestore `weddings/{id}/guests/{guestId}`: `{ id, name, email, phone, address*, addressStreet*, addressCity*, status, response, companion, companionType, companions (legacy), companionGroupId, table, group, tags[], dietaryRestrictions, notes, rsvpToken, clientId, createdAt, updatedAt }`.
- `weddings/{id}/rsvp/stats`, `weddings/{id}/rsvpLogs` (historial recordatorios).
- LocalStorage: `mywed360Guests`, `mywed360_active_wedding`, `whatsapp_invite_template`.
- SyncService: `syncState`, guardado h?brido y cola `pendingSyncQueue`.
- Normalizaci?n: limpieza de tel?fonos, dedupe en importaciones, normalizaci?n de status v?a `guestSchema`/`guestUpdateSchema`.

## 5. Reglas de negocio y validaciones
- Email ?nico por boda (dedupe email/tel?fono).
- Tel?fonos normalizados a E.164 (`toE164` con `VITE_DEFAULT_COUNTRY_CODE`).
- Estados RSVP en `confirmed/declined/pending`.
- Acompa?antes 0-20 y coherencia con `companionType`.
- Grupos propagan cambios a `companionGroupId`.
- Mesas replicadas en companions al editar.
- Env?os API deduplican tel?fonos.
- Importaciones marcan origen y resaltan errores.

## 6. Estados especiales y errores
- Indicador offline, alertas en fallos de red.
- Sin bodas ? mensaje orientativo o `sampleGuests`.
- `GuestEventBridge` ignora eventos sin coincidencia.
- Importaciones y alta masiva informan a?adidos/omitidos.
- Mensajer?a: fallback sin extensi?n, bloqueo si proveedor no configurado, alertas en programaci?n.
- Recordatorios RSVP alertan si `/api/rsvp/reminders` falla.
- AcceptInvitation muestra error si el c?digo no es v?lido.

## 7. Integraciones con otros flujos
- Plan de asientos, Timeline/Tareas, Presupuesto, Comunicaciones, Perfil/Dashboard y Automations consumen datos/ eventos de invitados.

## 8. Comunicaci?n y mensajer?a
- Endpoints: `/api/whatsapp/send`, `/api/whatsapp/send-batch`, `/api/whatsapp/batch`, `/api/whatsapp/schedule`, `/api/whatsapp/provider-status`, `/api/whatsapp/metrics`, `/api/whatsapp/health`.
- `/api/whatsapp/send-batch` procesa items `{to,message,guestId,metadata}`, devuelve `ok/fail` y registra errores.
- Extensi?n y deeplinks cubren fallback; `WhatsAppBatchService` genera lotes manuales.
- Plantillas (`MessageTemplateService`) sustituyen `{guestName}` y persisten.

## 9. M?tricas y monitorizaci?n
- `RSVPDashboard` muestra m?tricas y restricciones.
- `WhatsAppModal` consulta m?tricas (`deliveryRate`, `readRate`).
- `/send-batch` responde con agregados para UI.
- SyncService expone `lastSyncTime` y puede disparar toasts.

## 10. Pruebas recomendadas
- Unitarias: `useGuests`, esquemas, servicios de plantilla y sync, GroupManager, BulkGrid, ContactsImporter.
- Integraci?n: alta/edici?n/eliminaci?n con acompa?antes, cambio RSVP, importaci?n CSV, programaci?n, edici?n plantilla, eventos `GuestEventBridge`.
- E2E: alta masiva + seating, SaveTheDate, recordatorios RSVP, aceptaci?n de invitaci?n.

## 11. Checklist de despliegue
- Configurar proveedor WhatsApp y variables (`VITE_BACKEND_BASE_URL`, `VITE_DEFAULT_COUNTRY_CODE`).
- Reglas Firestore para CRUD de invitados (campos extendidos).
- Endpoints habilitados (`/api/whatsapp/send`, `/send-batch`, `/batch`, `/schedule`, `/api/rsvp/reminders`, `/api/guests/{id}/rsvp-link`).
- Revisar permisos SyncService y avisos de extensi?n.

## 12. Roadmap / pendientes
- Implementar canal email (`inviteViaEmail`) y decidir estrategia para `bulkInviteWhatsApp` (modo extensi?n).
- Dashboard avanzado de RSVP / m?tricas de env?o.
- Check-in en evento en tiempo real.
- Sincronizaci?n autom?tica Seating Plan.
- Alertas proactivas (vencimientos RSVP, etc.) en UI.
