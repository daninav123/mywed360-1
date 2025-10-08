# 3. Gesti�n de Invitados (estado 2025-10-07)

> Implementado: `Invitados.jsx`, `RSVPDashboard.jsx`, `AcceptInvitation.jsx`, `GuestEventBridge.jsx`, componentes en `src/components/guests/` (GuestList, GuestFilters, GuestForm, GuestBulkGrid, ContactsImporter, GuestEventBridge), modales de WhatsApp (`WhatsAppModal`, `WhatsAppSender`, `SaveTheDateModal`, `InviteTemplateModal`), servicios (`useGuests`, `MessageTemplateService`, `whatsappService`, `WhatsAppBatchService`, `SyncService`), esquemas `guestSchema/guestUpdateSchema` y helpers de contexto (`useWedding`, `useActiveWeddingInfo`).
> Pendiente: cerrar el canal email (`inviteViaEmail`), dashboards avanzados y check-in d�a del evento, sincronizaci�n bidireccional autom�tica con Seating Plan.
> Dependencias clave: Firestore (colecciones `weddings/{id}/guests`, `weddings/{id}/rsvp`, `weddings/{id}/rsvpLogs`), SyncService (estado online/offline), whatsappService (API REST), extensi�n de automatizaci�n WhatsApp, localStorage (`mywed360Guests`).

## 1. Objetivo y alcance
- Centralizar la captura, segmentacion y seguimiento de invitados de una boda, incluyendo RSVP, acompanantes, asignacion de mesas (como agrupador principal) y comunicaciones.
- Usuarios previstos: Owner, Planner y Assistants con permisos sobre la boda activa.
- El flujo cubre tanto la operaci�n diaria (altas/ediciones, filtros, comunicaciones) como utilidades complementarias (resumen RSVP, impresi�n r�pida, exportaciones y plantillas de mensaje).

## 2. Trigger y rutas
- Men� inferior ? `M�s` ? bloque **Invitados** ? enlace �Gesti�n de invitados� (`/invitados`, render `Invitados.jsx`).
- Resumen RSVP desde `M�s` ? **Invitados** ? �Resumen RSVP� (abre `/invitados/rsvp`, render `RSVPDashboard.jsx`).
- Invitaciones de colaboradores: enlaces recibidos apuntan a `/accept-invitation/:code` (`AcceptInvitation.jsx`).
- Eventos externos (`window.dispatchEvent('mywed360-guests', ...)`) se capturan mediante `GuestEventBridge` (inyectado en `MainLayout`).

## 3. Paso a paso UX
1. **Invitados.jsx**
   - **Cabecera y contexto**: muestra el t�tulo y una descripci�n breve; en modo desarrollo se incluyen utilidades de depuraci�n (IDs, conteos, login manual) para verificar el estado de los datos.
   - **Fallback y depuraci�n**: si `weddings` est� vac�o aparece un mensaje guiando al usuario a crear/seleccionar boda. En modo `import.meta.env.DEV` se renderiza un bloque debug con m�tricas internas (IDs, conteos, estado de auth) y un bot�n de login manual para Firebase (�til en local).
   - **Filtros y metricas rapidas**: `GuestFilters`
     - Busca por nombre/email/telefono/notas, filtra por estado (`pending/confirmed/declined`) y mesa (la mesa actua como agrupador unico; los antiguos grupos quedan ocultos).
     - Muestra contador total y habilita selecci�n m�ltiple (`selectedIds`).
     - Acciones principales:
       * Alta manual (abre `GuestForm`).
       * Alta masiva (`GuestBulkGrid`) con deduplicaci�n.
       * Importaci�n desde contactos (`ContactsImporter`).
       * **Invitaciones masivas (API)**: acceso directo a los modulos de Save The Date e Invitacion formal segun la necesidad.
       * �Enviar SAVE THE DATE� ? `SaveTheDateModal` con mensaje precargado.
       * �Resumen RSVP� ? abre modal de m�tricas.
       * �Editar mensaje (API)� ? `InviteTemplateModal`, edita la plantilla base guardada en localStorage.
       * Selecci�n m�ltiple (lado derecho):
         ? �Enviar seleccionados (API)� ? `inviteSelectedWhatsAppApi`, usa `/api/whatsapp/send-batch` con dedupe por tel�fono y respuesta de resultado.
         ? �Programar seleccionados� ? `handleScheduleSelected`, genera enlaces RSVP y llama a `whatsappService.schedule` con metadatos.
         ? �Difusi�n (extensi�n)� ? `inviteSelectedWhatsAppBroadcastViaExtension`; ofrece fallback individual.
         ? Acceso avanzado �Reasignar mesa� para mover en bloque a los invitados seleccionados y sincronizar acompanantes.
   - **Lista de invitados (`GuestList`)**:
     * Tarjetas de m�tricas: total, confirmados, pendientes, asistentes estimados (`stats.totalAttendees`).
     * Tabla desktop con selecci�n por fila, avatar placeholder, email, tel�fono, mesa, acompa�antes y badge de restricciones.
     * Toggle de estado RSVP: ciclo `pending ? confirmed ? declined`, persiste con `updateGuest`.
     * Acciones por fila: WhatsApp (`WhatsAppModal`), Email (`inviteViaEmail`, pendiente), editar (`GuestForm`), eliminar (`removeGuest`).
     * Vista m�vil con tarjetas, checkbox lateral y toggle idem.
   - **Modal de formulario (`GuestForm`)**: campos completos (datos basicos, direccion detallada, acompanantes, mesa, notas, restricciones). Valida coherencia, guarda con `addGuest`/`updateGuest` y autosave cada 30 s; el campo `group` queda oculto y sincroniza su valor con la mesa para mantener retrocompatibilidad.
   - **Alta masiva (`GuestBulkGrid`)**: grid editable con pegado desde Excel/Sheets, validaci�n por celda y deduplicaci�n.
   - **Importaci?n de contactos (`ContactsImporter`)**: soporta Contact Picker API y CSV; permite importar todo el lote directamente o seleccionar contactos puntuales para asignarlos a una mesa espec?fica antes de confirmar. El asistente mapea columnas, marca el origen y deduplica frente a la lista actual antes de llamar a `addGuest`.
   - **Mensajer�a WhatsApp y recordatorios**:
     * `WhatsAppModal`: pesta�as m?vil personal / n�mero de la app; esta �ltima env�a con `inviteViaWhatsAppApi` y permite trigger masivo a pendientes.
     * `handleSendSelectedMobile`: env�o one-click v?a extensi�n (`inviteSelectedWhatsAppViaExtension`) con fallback a deeplinks (`inviteSelectedWhatsAppDeeplink`).
     * `handleSendSelectedBroadcast`: intenta difusi�n por extensi�n, ofrece fallback individual.
     * `handleScheduleSelected`: genera mensajes personalizados (enlace RSVP por invitado si aplica) y programa lotes (`whatsappService.schedule`).
     * `WhatsAppSender`: modal para crear lotes manuales (`WhatsAppBatchService.sendBatch`, POST `/api/whatsapp/batch`).
     * `SaveTheDateModal`: selecciona invitados con tel?fono, permite mensaje global o por invitado, comprueba proveedor y env?a v?a `whatsappService.sendText` (`type: save_the_date`).
     * `InviteTemplateModal`: edita la plantilla base para env?os API, soporta `{guestName}` y guarda en localStorage.
   - **Resumen RSVP**: modal con totales (total/confirmados/pendientes/rechazados) y tabla de confirmados con boton de impresion / PDF.
   - **Reasignacion de mesas**: accion avanzada desde la lista que permite mover en bloque a invitados seleccionados a otra mesa, propagando la mesa a acompanantes y actualizando sincronizaciones externas.
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
- Email �nico por boda (dedupe email/tel?fono).
- Tel�fonos normalizados a E.164 (`toE164` con `VITE_DEFAULT_COUNTRY_CODE`).
- Estados RSVP en `confirmed/declined/pending`.
- Acompa?antes 0-20 y coherencia con `companionType`.
- Grupos propagan cambios a `companionGroupId`.
- Mesas replicadas en companions al editar.
- Envios API deduplican tel?fonos.
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
- Plan de asientos, Timeline/Tareas, Presupuesto, Comunicaciones, Perfil/Dashboard y Automations (vía [Flujo 24](./flujo-24-orquestador-automatizaciones.md)) consumen datos/eventos de invitados.

## 8. Comunicaci?n y mensajer?a
- Endpoints: `/api/whatsapp/send`, `/api/whatsapp/send-batch`, `/api/whatsapp/batch`, `/api/whatsapp/schedule`, `/api/whatsapp/provider-status`, `/api/whatsapp/metrics`, `/api/whatsapp/health`.
- `/api/whatsapp/send-batch` procesa items `{to,message,guestId,metadata}`, devuelve `ok/fail` y registra errores.
- Extensi�n y deeplinks cubren fallback; `WhatsAppBatchService` genera lotes manuales.
- Plantillas (`MessageTemplateService`) sustituyen `{guestName}` y persisten.

## 9. M�tricas y monitorizaci�n
- `RSVPDashboard` muestra m?tricas y restricciones.
- `WhatsAppModal` consulta m?tricas (`deliveryRate`, `readRate`).
- `/send-batch` responde con agregados para UI.
- SyncService expone `lastSyncTime` y puede disparar toasts.

## 10. Pruebas recomendadas
- Unitarias: `useGuests`, esquemas, servicios de plantilla y sync, GroupManager, BulkGrid, ContactsImporter.
- Integraci�n: alta/edici?n/eliminaci?n con acompa?antes, cambio RSVP, importaci?n CSV, programaci?n, edici?n plantilla, eventos `GuestEventBridge`.
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
