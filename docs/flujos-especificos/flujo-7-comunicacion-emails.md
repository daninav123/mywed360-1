# 7. Comunicaciones y Email (estado 2025-10-13)

> Implementado:
> - **Bandeja unificada:** `components/email/UnifiedInbox/InboxContainer.jsx`, `components/email/UnifiedInbox/EmailDetail.jsx`, `components/email/UnifiedInbox/EmailList.jsx`, `components/email/EmailComposer.jsx`, `components/email/SmartEmailComposer.jsx`, `components/email/EmailComments.jsx`, `components/email/EmailFeedbackCollector.jsx`, `components/email/CalendarIntegration.jsx`, `components/ProviderSearchModal.jsx`, `components/email/CustomFolders.jsx`, `components/email/ManageFoldersModal.jsx`.
> - **Configuración y plantillas:** `pages/EmailSetup.jsx`, `components/email/EmailSettings.jsx`, `pages/EmailTemplates.jsx`, `pages/user/EmailStatistics.jsx`, `components/email/MailgunTester.jsx`, `components/email/EmptyTrashModal.jsx`, `components/email/UnifiedInbox/InboxNavigation.jsx`.
> - **Servicios y utilidades:** `services/emailService.js`, `services/emailAutomationService.js`, `services/EmailRecommendationService.js`, `services/emailTemplatesService.js`, `services/tagService.js`, `services/folderService.js`, `utils/EmailCache.js`.
> - **Hooks:** `hooks/useEmailMonitoring.js`, `hooks/useEmailUsername.jsx`.
> El buzón legacy (`pages/Buzon_fixed_complete.jsx`) sigue en el repositorio pero ya no está ruteado.
>
> Pendiente/alertas principales: cableado de busqueda/ordenacion secundario en `UnifiedInbox/EmailList.jsx`, onboarding con validaciones DKIM/SPF, persistencia server-side de auto-respuestas y migracion definitiva del buzon legacy + actualizacion de pruebas E2E/VTU a la nueva UI.
>
> Actualizacion 2025-10-14: la bandeja unificada ejecuta `processIncomingEmails` para etiquetado IA/auto-respuestas y arranca el scheduler de programados (`startEmailScheduler`). Los contadores `unread` de carpetas personalizadas se recalculan y sincronizan en cada refresco.
>
> Configuracion de respuestas automaticas ahora se sincroniza via `/api/email-automation/config` (Firestore), evitando depender de localStorage.

## 1. Objetivo y alcance
- Centralizar recepción y envío de emails vinculados a la boda, con soporte para alias `@mywed360`, plantillas e IA de apoyo.
- Permitir colaboración interna (comentarios, etiquetado, notas) y disparar acciones en otros módulos (tareas, agenda, proveedores).
- Ofrecer analítica básica (volumen, aperturas, respuestas) y monitoreo del rendimiento del flujo.
- Alinear copy, plantillas y automatizaciones con `weddingProfile` y `weddingInsights`, generando mensajes que reflejen el estilo principal y los contrastes aprobados (sin caer en no-go items).

## 2. Entradas y rutas
- **Entrada principal:** menú usuario (avatar) → “Buzón de emails” (`/email`, `UnifiedInbox/InboxContainer.jsx`). `EmailNotification` y `EmailNotificationBadge` apuntan al mismo destino.
- **Rutas auxiliares:** `/email/compose` y `/email/compose/:action/:id` (editor clásico y respuestas), `/email/setup` (alias `@mywed360`), `/email/settings` y `/email/configuracion`, `/email/plantillas`, `/email/stats` y `/email/estadisticas`, `/email/test` (diagnóstico Mailgun), `/email-admin` (dashboard admin).
- Navegación contextual: `GlobalSearch` enlaza a `/email#mailId`; `ProviderSearchModal` desde la bandeja permite componer correos IA a proveedores (Flujo 5).

## 3. Paso a paso UX
### 3.1 Onboarding y configuracion
- `pages/EmailSetup.jsx` + `hooks/useEmailUsername.jsx` guian un wizard de cuatro pasos:
  1. **Reserva de alias:** valida formato (`^[a-z0-9._-]{3,30}$`), lista de reservados y disponibilidad en Firestore (`emailUsernames/{alias}`).
  2. **Chequeo DNS:** checklist DKIM/SPF/DMARC con botones `Marcar verificado`. Al no existir validacion automatica se registra `dnsPending=true` en `emailSetupAudit` y se agenda recordatorio.
  3. **Correo de prueba:** opcion de enviar mensaje de verificacion; respuesta (`success|error`) y mensaje se guardan en `emailSetupAudit`.
  4. **Preferencias iniciales:** idioma, tono (formal/informal), horario de atencion y categorias que activan auto-respuestas (`rsvp`, `providers`, `general`).
- `components/email/EmailSetupForm.jsx` consulta `checkUsernameAvailability` en tiempo real, ofrece alias sugeridos ante conflictos y registra intentos fallidos con timestamp.
- `components/email/EmailSettings.jsx` permite:
  - Ver/cambiar alias (`emailService.createEmailAlias`), registrando errores en `emailSettingsLog`.
  - Configurar auto-respuestas (`enabled`, `subject`, `body`, `delayMinutes`, `cooldownHours`, `excludedSenders[]`).
  - Supervisar y editar la cola de envios programados (`getScheduledEmails`) con estados `pending`, `sending`, `sent`, `failed`, incluyendo reintentos y cancelacion.
  - Administrar etiquetas (`tagService`) y carpetas personalizadas (`folderService`), con sincronizacion opcional a Firestore (`users/{uid}/emailFolders`) cuando el backend este activo.
  - Ajustar preferencias IA (idioma, tono, objetivos). Plantillas con flag `requiresReview` bloquean el boton `Insertar` hasta confirmacion del planner.
- `components/email/MailgunTester.jsx` actua como diagnostico avanzado: ejecuta `POST /api/test/mailgun`, muestra resultado y marca `mailgunVerified=true` en `emailSetupAudit` cuando es satisfactorio.
### 3.2 Operativa diaria
- `UnifiedInbox/InboxContainer.jsx` (UI actual por defecto):
  - Navegación lateral: botones `Bandeja de entrada`, `Enviados` y `Papelera` con contadores (`inboxCounts`, `sentCounts`, `trashCounts`). `CustomFolders.jsx` consume `folderService` para carpetas personalizadas (crear/renombrar/eliminar) y expone accesos a `ManageFoldersModal.jsx`. Cuando la carpeta activa es `trash`, se habilita el botón “Vaciar papelera” que abre `EmptyTrashModal.jsx`.
  - `refreshEmails` soporta carpetas del sistema (`inbox`, `sent`, `trash`) y personalizadas (`custom:{id}`) combinando `EmailService.getMails` con `folderService.getEmailsInFolder`. `refreshCounts` actualiza métricas (incluidas IA) y sincroniza la lista de carpetas personalizadas.
  - Encabezado de página: búsqueda global (`searchTerm`), filtros leído/no leído (`filterStatus`), accesos directos a “Nuevo email”/“Redactar con IA”, refresco manual y gatillo de análisis IA (solo desarrollo).
  - Eliminación: en carpetas activas se usa `EmailService.moveMail(id, 'trash')`; en `trash` se invoca `EmailService.deleteMail`. Las operaciones limpian asignaciones locales de carpetas personalizadas (`removeEmailFromFolder`) y refrescan conteos globales.
  - `EmptyTrashModal.jsx` delega en el nuevo `EmailService.emptyTrash`, vaciando la carpeta y actualizando la UI tras confirmar.
- `UnifiedInbox/EmailList.jsx`:
  - Gestiona selección múltiple y “Eliminar” respetando la carpeta actual (mueve a papelera o elimina permanente en `trash`). Añade `data-testid` (`email-list-item`, `empty-folder-message`) para soportar Cypress.
  - Búsqueda: `searchTerm` dispara `debouncedSearchEmails` filtrando asunto, remitente y etiquetas en el estado global (`emailStore`). Se sincroniza con la query `?q=` para enlaces compartidos.
  - Orden secundario: `sortMode` (`recent`, `oldest`, `bySender`) se almacena en estado global y localStorage (`maloveapp_email_sort`). Falta cablear el menú de UI (TODO histórico) → ahora se definió que debe leer/escribir este estado.
  - TODO pendiente: mover la lógica de orden/búsqueda al backend (`GET /api/mail?search=&sort=`) cuando esté disponible.
- - `UnifiedInbox/EmailDetail.jsx`:
  - Acciones según carpeta: en `trash` aparecen `Restaurar` y `Eliminar permanentemente`; fuera de `trash` se muestran `Mover a carpeta`, `Marcar importante` y `Agregar comentario`.
  - Panel lateral con pestañas:
    - **Comentarios internos** (`EmailComments.jsx`): lista cronológica y formulario; persiste `{ commentId, authorId, body, mentions[], createdAt }` en `emailComments/{emailId}` con reglas de lectura solo interna.
    - **Feedback IA** (`EmailFeedbackCollector.jsx`): registra `score` (-1,0,1) y notas, emitiendo `email_feedback_submitted` para calibrar recomendaciones.
    - **Agenda** (`CalendarIntegration.jsx`): muestra eventos vinculados (`emailEvents` con `startAt`, `endAt`, `attendees[]`, `serviceLineId?`) y permite crear nuevas entradas.
  - El panel derecho resume adjuntos, etiquetas activas y auto-respuestas aplicadas.
- `components/email/EmptyTrashModal.jsx` ya existe con `data-testid` consumibles por Cypress, pero la UI aún no lo utiliza.
- Composición:
  - `components/email/EmailComposer.jsx` (clásico): valida destinatarios/asunto/cuerpo, limita adjuntos a 10 MB y permite programar envíos (ver limitaciones en automatización). Cuando programa, delega en `emailAutomationService.scheduleEmailSend`.
  - `components/email/SmartEmailComposer.jsx`: se alimenta de plantillas (`EmailService.getEmailTemplates` → API o `services/emailTemplates.js`) y recomendaciones de `EmailRecommendationService`. Ajusta tono/copy con `weddingProfile` (ej. estilo, idioma, vibe keywords) y ofrece bloques especiales etiquetados `Core` o `Contraste (zona)`. Soporta programación y rastrea recomendaciones aplicadas; integra con `ProviderSearchModal`.
  - Tanto el modo clásico como el IA refrescan la bandeja y contadores tras enviar; los envíos programados permanecen en cola hasta que exista un job que ejecute `processScheduledEmails` (3.3).

### 3.3 Automatizaciones y análisis
- `services/emailAutomationService.js` gestiona:
  - Configuración de clasificación y auto-respuestas (se migrará a `users/{uid}/emailAutomation` en Firestore). Cada regla guarda `{ category, enabled, subject, body, delayMinutes, cooldownHours, excludedSenders[] }`.
  - Procesamiento de entradas (`processIncomingEmails`): arma payload con preview, etiquetas y `weddingContext`. Si `callClassificationAPI` responde `{ classification, autoReply, confidence }`, aplica acciones; de lo contrario usa heurísticas locales y marca `classificationConfidence="low"`.
  - Cola de envíos programados (`scheduleEmailSend`, `getScheduledEmails`, `processScheduledEmails`): registra `{ emailId, sendAt, state, attempts }`. El job backend `emailSchedulerWorker` ejecutará `processScheduledEmails` cada minuto, registrará eventos en `emailScheduledAudit` y expondrá `/api/email/scheduled/status`; tras 3 fallos se marca `failed` y se notifica.
  - Webhooks pendientes: `markEmailDelivered`, `markEmailBounced` (alimentarán métricas y alertas).
- `services/EmailRecommendationService.js` + `AIEmailTrackingService` llevan métricas locales para sugerencias IA dentro del Smart Composer.
  - Inputs clave: `weddingProfile.vibeKeywords`, `specialInterests`, `noGoItems`, estado del flujo 2C (`recommendation_conflict`). Las recomendaciones se etiquetan con `contextTag` (`core`, `contraste`) para rastrear adopción.
- `components/email/EmailStats.jsx` + `pages/user/EmailStatistics.jsx` muestran métricas (Chart.js) usando `services/emailMetricsService.js` (Firestore `emailMetrics/{userId}`) con fallback a cálculos locales via `services/statsService.js`.

### 3.4 Gestión de carpetas y papelera
- **Estado actual:**
  - La barra lateral expone `inbox`, `sent` y `trash` con contadores, integra `CustomFolders.jsx` para carpetas personalizadas (creación, renombrado, eliminación) y habilita `ManageFoldersModal.jsx` / `EmptyTrashModal.jsx` desde el propio contenedor.
  - `EmailService.moveMail` (alias de `setFolder`) se usa para mover correos; `EmailService.deleteMail` queda reservado para `trash` y vaciados masivos. `removeEmailFromFolder` limpia mapeos locales cuando se desplaza un correo fuera de una carpeta personalizada.
  - Restaurar desde la papelera devuelve el correo a `inbox` por defecto; todavía no se conserva la carpeta original ni se rehidratan etiquetas personalizadas.
  - Los contadores de carpetas personalizadas dependen de `folderService` en localStorage; no existe sincronización de `unread` ni métricas agregadas en backend.
- **Pendientes (diseño acordado):**
  - Drag & drop de carpetas personalizadas: el objetivo es usar `FolderSelectionModal` + `folderService.reorderFolders()` para reflejar orden en `users/{uid}/emailFolders.order`.
  - ✅ Contadores `unread` en backend: IMPLEMENTADO - Cloud Function `onMailUpdated` en `functions/index.js:23-97` actualiza `emailFolderStats` automáticamente en cada cambio de carpeta o estado read.
  - ✅ Retención automática: job `emailTrashRetention` YA IMPLEMENTADO en `backend/jobs/emailTrashRetention.js` - purga correos con `deletedAt` > 30 días y registra en `emailRetentionAudit`. Solo falta configurar cron diario.
  - UI de mover entre carpetas personalizadas desde lista/detalle (menú contextual + atajos teclado).

## 4. Persistencia y datos
- Correos: `services/emailService.js` prioriza backend (`/api/mail/*`). Sin backend, cae a Firestore (`users/{uid}/mails` y colección global `mails`) o memoria/localStorage (`memoryStore.mails`). El campo `folder` se actualiza con `EmailService.setFolder` (cuando se integre) y se usa para determinar `inbox`/`sent`/`trash`/personalizadas. No existe colección `weddings/{id}/emails`.
- Alias: `hooks/useEmailUsername.jsx` escribe en `emailUsernames/{alias}` y `users/{uid}` (`emailUsername`, `myWed360Email`).
- Configuración auto-respuesta / clasificación / cola: claves en `localStorage` (`mywed360.email.automation.*`, `mywed360.email.automation.schedule`…).
- Contexto de personalización: `emailContext` se persistirá en `weddings/{id}/emailContext` con `{ language, tone, vibeKeywords[], specialInterests[], noGoItems[], contrastNotes[] }`. Se actualizará cuando cambien `weddingInsights` y expondrá versión para cache (`version`).
- Etiquetas y carpetas personalizadas: `tagService.js` (`maloveapp_email_tags_*`) y `folderService.js` (`maloveapp_email_folders_{uid}` + `maloveapp_email_folder_mapping_{uid}`) almacenan en `localStorage` con espejo opcional a Firestore; la UI principal todavía no consume dichos datos.
- Plantillas: API `/api/email-templates` (via `services/emailTemplatesService.js`); fallback a catálogo estático `services/emailTemplates.js`. No existe sincronización automática con Firestore.
- Métricas agregadas: Firestore `emailMetrics/{userId}` (+ subcolección `daily`). El cálculo local guarda copia en `localStorage` (`maloveapp_email_stats_{userId}`).
- Tracking de proveedores/campañas AI: `services/EmailTrackingService.js` y `AIEmailTrackingService.js` usan `localStorage` (claves `maloveapp_email_tracking`, `aiEmailActivities`, etc.). No hay persistencia servidor.
- Caché local: `utils/EmailCache.js` guarda correos por carpeta (`folder_inbox`, `folder_sent`, `folder_trash`, etc.) con límites configurables y debe invalidarse al mover o eliminar correos.

### 4.1 Modelo de correo (backend)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | string | Identificador unico. |
| threadId | string | Agrupa mensajes de un mismo hilo. |
| from, to[], cc[], bcc[] | string/string[] | Direcciones de origen/destino. |
| subject, bodyHtml, bodyText | string | Contenido renderizable o plano. |
| attachments[] | { name, size, mimeType, url, storagePath } | Adjuntos vinculados en Storage. |
| folder | string | inbox, sent, 	rash, custom:{id}. |
| labels[] | string | Etiquetas internas (ej. provider, 
svp). |
| status | { read: bool, flagged: bool, important: bool } | Estados visibles en UI. |
| autoReply | { applied: bool, templateId?, delayMinutes? } | Resultado de auto-respuestas. |
| scheduled | { sendAt?, state?, attempts? } | Solo presente en envios programados. |
| weddingId | string | Contexto de boda para integraciones cruzadas. |
| analytics | { opens: number, clicks: number, bounces: number, complaints: number, lastEventAt: timestamp } | Datos alimentados por webhooks Mailgun para métricas y alertas. |
| createdAt, updatedAt | timestamp | Auditoria.

### 4.2 Colecciones colaborativas
- emailComments/{emailId}/{commentId}: { authorId, body, mentions[], createdAt, type? }. Solo roles internos pueden leer/escribir.
- emailFeedback/{emailId}/{feedbackId}: { userId, score (-1|0|1), note, createdAt, source }.
- emailDrafts/{draftId} (backend planeado): guarda borradores IA/automatizaciones con state=draft.
- emailAutomationState/{uid}.classifications: mapa limitado (≤200) con `{ tags[], folder, confidence, reason, source, updatedAt }`, actualizado vía `/api/email-automation/classification`.

### 4.3 Carpetas y etiquetas
- users/{uid}/emailFolders/{folderId}: { name, color, unreadCount, system }.
- users/{uid}/emailTags/{tagId}: { name, color, automationRule? }.
- users/{uid}/emailFolderAssignments/{emailId}: preserva carpeta original para restauraciones.
- olderService y 	agService mantienen espejo local (maloveapp_email_*) mientras se consolida backend.

### 4.4 Eventos derivados
- `emailEvents/{eventId}`: `{ emailId, weddingId, title, startAt, endAt, location, attendees[], status, taskId? }` (creados desde CalendarIntegration.jsx).
- `emailPortalSync` (planeado) almacenara preferencia de notificaciones cruzadas.
- `emailDeliverability/{messageId}`: eventos Mailgun (`events[]`, `counts.*`, `lastStatus`, `lastRecipient`, `lastEventAt`) alimentados por los webhooks de entregabilidad.
## 5. Reglas de negocio vigentes y pendientes
- **Implementadas:** 
  - Validación de alias (regex + lista reservada) y verificación de unicidad Firestore.
  - Adjuntos limitados a 10 MB (por archivo) en `EmailComposer.jsx`.
  - Envíos programados deben estar al menos 1 min en el futuro y actualmente no soportan adjuntos (`scheduleEmailSend`).
  - Auto-respuestas ignoran remitentes excluidos y respetan intervalo mínimo configurado.
- **Pendientes / no implementado todavía:**
  - Límite de envíos masivos diario/por usuario.
  - Retención automática de correos críticos (password reset, invitaciones).
  - Validaciones DKIM/SPF/DMARC durante el onboarding (mencionadas en documentación anterior).
  - Gestión de permisos por rol más allá del alias (hoy se confía en UI).
  - Integración con WhatsApp/push o journeys multicanal.
  - Restaurar a la carpeta de origen y conservar historial al mover correos a `trash`.
  - Automatizar retención y métricas de papelera (jobs backend/cron).

### Reglas adicionales y permisos
- Roles:
  - Owner/Planner: leer/escribir todo, programar envíos, eliminar permanente, gestionar auto-respuestas.
  - Assistant: leer bandeja, responder, agregar comentarios, mover a carpeta/papelera; sin borrar permanente ni editar auto-respuestas.
  - Invitados externos: sin acceso al módulo.
- Envíos programados avanzan `pending -> sending -> sent`; tras 3 fallos (`attempts`) pasan a `failed` y generan `email_scheduled_failed`.
- Auto-respuestas respetan `cooldownHours`; si se intenta reenviar antes registran `autoReplySuppressed=true`.
- Comentarios (`emailComments`) solo aceptan autores con permisos; cada inserción emite `email_comment_added` y se guarda en `emailAuditLog`.
- Agenda vinculada a Flujo 14: al crear evento se guarda `taskId?` y al cancelar correo se ofrece marcar evento `cancelled`.
- Eliminación permanente requiere owner/planner; assistants solo mueven a `trash`. Restaurar usa `emailFolderAssignments` para recuperar carpeta original.
- Etiquetas automatizadas (ej. `provider`, `contractSigned`) no admiten edición manual, preservando integraciones con Flujos 5 y 6.

## 6. Estados especiales y manejo de errores
- Onboarding: si no hay sesión → redirección a `/login` con `returnUrl`; errores muestran banners en `EmailSetup.jsx`.
- Bandeja: `UnifiedInbox/InboxContainer.jsx` muestra spinner inicial, mensaje de error con botón “Reintentar” y fallback a mensajes simulados en tests (`defaultMailsTest`). No existe toggle para “buzón legacy” pese a lo documentado anteriormente.
- Composición: muestra toasts (éxito/error) y bloquea botón durante envío; validaciones evitan duplicados. Los envíos programados se guardan pero no se ejecutan.
- IA insights: si backend falla, heurística local produce un mínimo de acciones; se loguea en consola.
- Notificaciones: `EmailNotification.jsx` y `EmailNotificationBadge.jsx` degradan silenciosamente si `getMails` falla; la notificación overlay actual intercepta el click y lanza un `alert` placeholder (debe ajustarse).
- Papelera: accesible desde la barra lateral; el vaciado exige confirmación (`EmptyTrashModal`) y la restauración vuelve a la carpeta original registrada en `emailFolderAssignments`. El job backend `emailTrashRetention` (pendiente) purgará elementos tras 30 días e incluirá métricas de limpieza.

## 7. Integración con otros flujos
- **Flujo 3/9 (Invitaciones & RSVP):** `pages/Invitaciones.jsx` usa `EmailService.sendMail` para enviar invitaciones. Cada correo incluye `metadata = { guestId, weddingId, token }`; las auto-respuestas registran `rsvp_auto_reply_sent` y actualizan `guests/{guestId}.communicationLog`. Accesos limitados a owner/planner.
- **Flujo 5 (Proveedores IA):** `ProviderSearchModal.jsx` busca proveedores (`/api/ai-suppliers` o OpenAI directo) y pre-carga el Smart Composer; `EmailTrackingService` etiqueta correos enviados a proveedores.
- **Flujo 6 (Presupuesto/tareas):** `EmailInsights.jsx` dispara eventos (`window.dispatchEvent('maloveapp-tasks')`) y botones de acceso rápido a `/tasks` y `/protocolo/timing`.
- **Flujo 12 (Notificaciones):** `EmailSettings` sincroniza categorías con `notificationPreferences` (`email.dailyDigest`, `email.immediateAlerts`). Cambios generan `notification_preferences_updated` y el backend ajusta campañas multicanal.
- **Flujo 16 (IA Orquestador):** `automationEngine` puede crear borradores (`state=draft`) y sugerir respuestas. Eventos `automation_email_draft_created`, `automation_email_sent`, `automation_email_failed` alimentan auditoría. Si el orquestador cae, el inbox recurre a recomendaciones locales (`source=localFallback`).
- **Flujo 2C (Personalización continua):** `EmailRecommendationService` escucha `weddingInsights` para adaptar copy y dispara eventos `email_contrast_message_sent` y `email_contrast_message_rejected` que alimentan el mapa de preferencias.
- **Otros:** `GlobalSearch.jsx` enlaza correos; `EmailNotification` informa de nuevos mensajes; `EmailInsights` ofrece enlaces a `Contracts` y `Finance` (cuando los insights incluyen contratos/presupuestos).

### Intercambios de datos clave
- **Flujo 3/9 -> Email:** `rsvpService.sendInvitation` adjunta `{ guestId, weddingId, token }`; las auto-respuestas consumen ese token y registran `rsvp_auto_reply_sent`.
- **Flujo 5 -> Email:** `ProviderSearchModal` añade etiquetas `['provider', supplierId]` y `metadata.serviceLineId` para enlazar con proveedores y presupuesto.
- **Flujo 6 -> Email:** `EmailInsights` produce `paymentSuggestion` (`{ transactionId, supplierId, dueDate, amount }`) que puede transformarse en tarea o transacción.
- **Flujo 12 -> Email:** `notificationPreferences` determina si se genera resumen diario (`dailyDigest`) o solo alertas inmediatas.
- **Flujo 16 -> Email:** workflows IA crean borradores (`state='draft'`) vía `/api/automation/email`; se almacenan en `emailDrafts` hasta aprobación.
- **Finanzas/Contratos -> Email:** al detectar contrato firmado se añade etiqueta `contractSigned` y se adjunta el PDF en la respuesta.
- **Mailgun webhooks:** esperan `{ event, message-id, recipient, timestamp }`; los registros alimentan métricas y alertas de entregabilidad.

### Fallbacks
- Si la API backend está offline se usa Firestore/localStorage y se marca `deliveryChannel='local'` para reconciliación posterior.
- Cuando falla la clasificación IA (`callClassificationAPI`), `processIncomingEmails` aplica heurística local y añade `classificationConfidence='low'`.
## 8. Métricas y monitorización
- Instrumentacion via `hooks/useEmailMonitoring.js` y `PerformanceMonitor` captura `email_operation`, `template_cache_hit/miss`, `email_feedback_submitted`, `email_comment_added`.
- KPIs clave:
  - `deliverySuccess = emailsEnviados - emailsFallidos` (mailgun webhook `delivered` menos `failed`).
  - `openRate = aperturas / emailsEnviados` por carpeta y etiqueta.
  - `replyTimeMedian` (p50 del tiempo entre correo entrante y respuesta).
  - `autoReplyCoverage = autoRepliesEnviadas / correosElegibles`.
  - `iaAdoption = recomendacionesAceptadas / recomendacionesEmitidas`.
  - `cleanupRate = correosPapelera / volumenTotal` (indicador de higiene operativa).
- Alertas sugeridas:
  - `openRate < 0.2` → revisar contenido/SPF.
  - `replyTimeMedian > 24h` → crear tarea de seguimiento.
  - `deliverySuccess` cayendo >10% semana contra semana → levantar incidente.
- `EmailStats.jsx` consume `emailMetrics` y, sin datos, recurre a `getMails` + cache local; evitar bloqueos aplicando paginación y memoización.
- Métricas de entregabilidad: los webhooks de Mailgun (`delivered`, `failed`, `opened`, `clicked`, `complained`) se almacenan en `emailDeliverability/{messageId}` con TTL 90 días y se exportarán a BigQuery/Grafana. Alertas: rebotes >5% diarios → incidente, `complained` >0.5% → pausar campañas.

## 9. Pruebas y cobertura
- **Unitarias / integración (Vitest):**
  - `src/test/e2e/EmailWorkflows.test.jsx` y `src/test/e2e/AdvancedEmailWorkflows.test.jsx` ejercitan el flujo clásico (`EmailInbox`, `EmailDetail`, `EmailSettings`, `FolderSelectionModal`). Aún apuntan a la bandeja anterior y data-testids antiguos (`folder-sent`), por lo que deben actualizarse a `UnifiedInbox`.
  - `src/test/components/email/*` cubren `EmailInbox`, `EmailDetail`, `FolderSelectionModal`, etc.
  - `src/test/accessibility/EmailInbox.a11y.test.jsx` verifica accesibilidad de la bandeja legacy.
- **Cypress:** `cypress/e2e/email/*.cy.js` validan envío, lectura, gestión y notificaciones, pero confían en data-testids de la UI previa (`folder-sent`, etc.). La nueva bandeja debe exponer atributos equivalentes o actualizar las pruebas.
- **Gaps:** no hay pruebas específicas para `UnifiedInbox/InboxContainer`, `EmailFeedbackCollector`, `CalendarIntegration` ni para la cola de envíos programados/auto-respuestas. Se requiere crear nuevos escenarios E2E (programar envío, aplicar etiquetas, comentarios, flujo IA) e incorporar cobertura para papelera (mover, restaurar, vaciar).


## Cobertura E2E implementada
- `cypress/e2e/email/send-email.cy.js y cypress/e2e/email/read-email.cy.js`: comprueban envío, recepción y lectura de correos desde la bandeja unificada.
- `cypress/e2e/email/folders-management.cy.js y cypress/e2e/email/tags-filters.cy.js`: verifican organización por carpetas, etiquetas y filtros avanzados.
- `cypress/e2e/email/smart-composer.cy.js, cypress/e2e/email/ai-provider-email.cy.js y cypress/e2e/compose_quick_replies.cy.js`: prueban generación asistida por IA y respuestas rápidas.
- `cypress/e2e/email_inbox_smoke.cy.js`: smoke integral de la bandeja y sincronización en tiempo real.
- `cypress/e2e/email/read-email-attachments.cy.js`: asegura descarga y previsualización de adjuntos.
- `cypress/e2e/email/read-email-list.cy.js`: verifica paginación y ordenación del listado principal.
- `cypress/e2e/email/read-email-open.cy.js`: comprueba estados de lectura y métricas asociadas.
- `cypress/e2e/email/read-email-unread-status.cy.js`: valida cambios de estado leído/no leído en lista y detalle.
- `cypress/e2e/email/send-email-attachment.cy.js`: cubre adjuntos en envíos salientes y almacenamiento temporal.
- `cypress/e2e/email/send-email-validation.cy.js`: revisa validaciones de formulario (destinatarios, asunto, cuerpo) antes de enviar.

## 10. Checklist de despliegue
- **Variables de entorno front/back:**
  - `VITE_BACKEND_BASE_URL` (si hay API Gateway), `VITE_ENABLE_EMAIL_ANALYZE` (`1` para permitir `/api/email-insights/analyze`), `VITE_ENABLE_DIRECT_OPENAI`, `VITE_OPENAI_API_KEY`, `VITE_OPENAI_PROJECT_ID` para funciones IA.
  - `VITE_MAILGUN_DOMAIN` y `VITE_FIREBASE_FUNCTIONS_URL` (`mailgunService` / `MailgunTester`).
  - `VITE_ENABLE_AI_SUPPLIERS` para búsqueda IA de proveedores.
- **Firestore/Cloud Functions:**
  - Colecciones: `emailUsernames`, `users`, `emailMetrics` (+ subcolección `daily`), `users/{uid}/mails` (si se usa fallback), `mails` (global).
  - Reglas de seguridad que permitan leer/escribir `emailUsernames`, `emailMetrics`, `users/{uid}/mails` y evitar filtraciones cross-user.
  - Función (cron) o job que invoque `processScheduledEmails(sendMail)` periódicamente en el backend para habilitar programaciones.
  - Webhooks Mailgun (inbound/outbound) si se habilita backend.
- **Frontend:** exponer data-testids alineados con Cypress, asegurar que `UnifiedInbox` reemplaza completamente al legacy y limpiar scripts/estilos duplicados antes de release.

## 11. Roadmap / pendientes

### 🔍 ESTADO REAL VERIFICADO (2025-10-24)

**✅ IMPLEMENTADO Y FUNCIONAL:**
1. **emailSchedulerCron** - `backend/jobs/emailSchedulerCron.js` ✅
   - Código completo con `runEmailSchedulerJob()`
   - Exporta función ejecutable manualmente o vía cron
   - Integrado con `processScheduledEmailQueue`
   - ⚠️ FALTA: Configurar en Cloud Scheduler/Render Cron para ejecución automática

2. **emailTrashRetention** - `backend/jobs/emailTrashRetention.js` ✅
   - Job de limpieza automática implementado
   - Elimina emails con más de 30 días en papelera
   - Auditoría en colección `emailRetentionAudit`
   - ⚠️ FALTA: Configurar cron diario (0 2 * * *)

3. **onMailUpdated Cloud Function** - `functions/index.js:23-97` ✅
   - Actualiza contadores de carpetas automáticamente
   - Maneja cambios en folder y estado read
   - Colección `emailFolderStats` con totalCount y unreadCount
   - Función auxiliar `updateFolderCount()` completa

4. **Webhooks Mailgun** - `backend/routes/mailgun-webhook.js` ✅
   - Endpoint `/webhooks/deliverability` funcional
   - Verificación de firma Mailgun implementada
   - Registro de eventos básicos

**❌ NO IMPLEMENTADO:**
1. **callClassificationAPI** - ❌ NO EXISTE
   - No hay archivo `backend/services/emailClassificationService.js`
   - No hay integración con OpenAI para clasificación
   - La documentación marcaba esto como "✅ 2025-10-20" INCORRECTAMENTE
   - Impacto: Clasificación solo usa heurísticas locales básicas

**🟡 PARCIALMENTE IMPLEMENTADO:**
1. **Auto-respuestas sincronización**
   - Backend endpoints: `GET/PUT /api/email-automation/config` ✅
   - Persistencia en Firestore ✅
   - Frontend aún usa localStorage como primario 🟡

### Roadmap Actualizado:

1. **Automatización y backend (Owner: Backend Squad)**
   - ⏳ PENDIENTE: callClassificationAPI con OpenAI (estimado: 8-12h)
   - ✅ CÓDIGO LISTO: emailSchedulerCron (solo falta configurar cron externo)
   - ✅ CÓDIGO LISTO: emailTrashRetention (solo falta configurar cron diario)
   - ✅ IMPLEMENTADO: onMailUpdated Cloud Function
   - 🟡 MEJORAR: Webhooks Mailgun (completar procesamiento de deliverability)
2. **UX / funcionalidad (Owner: Frontend Squad, ETA Q1 2026)**
   - Drag & drop y reorder de carpetas personalizadas con sincronización emailFolderStats.
   - Papelera avanzada: restaurar carpeta original, métricas de retención y vaciado masivo.
   - Búsqueda/orden integrados en estado global y backend (GET /api/mail).
   - Toggle de buzón legacy solo soporte y plan de retirada.
   - Onboarding completo con validación DKIM/SPF y correo de prueba automatizado.
3. **Analítica y monitoreo (Owner: Data/Analytics, ETA Q1 2026)**
   - Dashboard Grafana/BigQuery con KPIs (deliverySuccess, openRate, 
eplyTimeMedian, utoReplyCoverage, iaAdoption, cleanupRate).
   - Alertas automáticas: rebotes >5% diario, complained >0.5%, SLA respuesta >24h.
4. **Integraciones cruzadas (Owner: Orquestador/IA, ETA Q2 2026)**
   - Consolidar workflows IA (Flujo 16) con etiquetado y borradores state=draft.
   - Journeys multicanal (email + push + WhatsApp) y timeline conversacional.
   - Sincronizar preferencias de notificaciones (Flujo 12) con auto-respuestas.
5. **Testing y QA (Owner: QA Guild, continuo)**
   - Actualizar suites Cypress/Vitest para Inbox, comentarios, agenda, feedback y programados.
   - Automatizar pruebas de alias/onboarding y fallback Mailgun.
   - Añadir cobertura para emailTrashRetention, webhooks de rebote y métricas.

Mantener esta lista viva antes de iniciar nuevas implementaciones en Flujo 7.







