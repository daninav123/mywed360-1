# 7. Comunicaciones y Email (estado 2025-10-08)

> Implementado: `components/email/UnifiedInbox/InboxContainer.jsx`, `components/email/UnifiedInbox/EmailDetail.jsx`, `components/email/UnifiedInbox/EmailList.jsx`, `components/email/EmailComposer.jsx`, `components/email/SmartEmailComposer.jsx`, `pages/EmailSetup.jsx`, `components/email/EmailSettings.jsx`, `pages/EmailTemplates.jsx`, `pages/user/EmailStatistics.jsx`, `components/email/EmailComments.jsx`, `components/email/EmailFeedbackCollector.jsx`, `components/email/CalendarIntegration.jsx`, `components/email/MailgunTester.jsx`, servicios `services/emailService.js`, `services/emailAutomationService.js`, `services/EmailRecommendationService.js`, `services/emailTemplatesService.js`, `services/tagService.js`, `services/folderService.js`, hooks `hooks/useEmailMonitoring.js`, `hooks/useEmailUsername.jsx`. El buzón legacy (`pages/Buzon_fixed_complete.jsx`) sigue en el repositorio pero ya no está ruteado.
>
> Pendiente/alertas principales: cableado de búsqueda/ordenación en `UnifiedInbox/EmailList.jsx`, integración de carpetas/etiquetas personalizadas en la nueva bandeja, implementación real del `callClassificationAPI` y del procesador de envíos programados (`processScheduledEmails`), onboarding con validaciones DKIM/SPF reales, persistencia en backend de la configuración de auto-respuestas, y migración definitiva del buzón legacy + actualización de pruebas E2E/VTU a la nueva UI.

## 1. Objetivo y alcance
- Centralizar recepción y envío de emails vinculados a la boda, con soporte para alias `@mywed360`, plantillas e IA de apoyo.
- Permitir colaboración interna (comentarios, etiquetado, notas) y disparar acciones en otros módulos (tareas, agenda, proveedores).
- Ofrecer analítica básica (volumen, aperturas, respuestas) y monitoreo del rendimiento del flujo.

## 2. Entradas y rutas
- **Entrada principal:** menú usuario (avatar) → “Buzón de emails” (`/email`, `UnifiedInbox/InboxContainer.jsx`). `EmailNotification` y `EmailNotificationBadge` apuntan al mismo destino.
- **Rutas auxiliares:** `/email/compose` y `/email/compose/:action/:id` (editor clásico y respuestas), `/email/setup` (alias `@mywed360`), `/email/settings` y `/email/configuracion`, `/email/plantillas`, `/email/stats` y `/email/estadisticas`, `/email/test` (diagnóstico Mailgun), `/email-admin` (dashboard admin).
- Navegación contextual: `GlobalSearch` enlaza a `/email#mailId`; `ProviderSearchModal` desde la bandeja permite componer correos IA a proveedores (Flujo 5).

## 3. Paso a paso UX
### 3.1 Onboarding y configuración
- `pages/EmailSetup.jsx` + `hooks/useEmailUsername.jsx` reservan alias en Firestore (`emailUsernames` + doc del usuario). Validaciones actuales: regex, nombres reservados y verificación de existencia; **no** se validan DKIM/SPF ni se envían pruebas automáticamente.
- `components/email/EmailSetupForm.jsx` muestra disponibilidad “en vivo”, pero usa una lista estática simulada; debe alinearse con `checkUsernameAvailability` para evitar falsos positivos.
- `components/email/EmailSettings.jsx` permite:
  - Ver/cambiar alias (`services/emailService.js#createEmailAlias`, best-effort backend).
  - Configurar auto-respuestas por categoría (almacenadas en `localStorage` bajo `mywed360.email.automation.*`; falta persistencia en backend).
  - Revisar/gestionar la cola de envíos programados (`getScheduledEmails`), aunque no existe job que procese la cola (ver sección de pendientes).
  - Gestionar etiquetas (`components/email/TagsManager.jsx` + `services/tagService.js`) y listar envíos programados.
- `components/email/MailgunTester.jsx` expone pruebas manuales (envío, validación de email, disponibilidad de alias) vía Cloud Functions (`services/mailgunService.js`); sigue desacoplado del wizard principal.

### 3.2 Operativa diaria
- `UnifiedInbox/InboxContainer.jsx` (UI actual por defecto):
  - Carpeta activa: sólo `inbox` y `sent`. No hay UI para carpetas personalizadas ni papelera (las APIs existen en `services/folderService.js` pero aún no se integran).
  - Controles: buscar (`searchTerm` en cabecera), filtrar por leído/no leído, abrir compositor básico o IA, refrescar, lanzar análisis IA (dev only) y abrir búsqueda de proveedores.
  - `UnifiedInbox/EmailList.jsx` soporta selección múltiple, eliminación y badges IA por correo. **Pendiente:** se renderiza un buscador secundario que invoca `onSearch`/`onSortChange` sin estar cableados desde `InboxContainer`, provocando errores si se usa; decidir si se elimina o se conecta al estado del padre.
  - `UnifiedInbox/EmailDetail.jsx` muestra contenido, adjuntos (descarga pendiente), botones de responder/reenviar/reenviar calendario y alimenta:
    - `components/EmailInsights.jsx` (extrae tareas, reuniones, presupuestos, contratos via `/api/email-insights` o heurística local).
    - `components/email/EmailComments.jsx` (comentarios internos por correo, persistidos en `localStorage` por usuario).
    - `components/email/EmailTagsManager.jsx` (etiquetado best-effort con API/`tagService`).
    - `components/email/CalendarIntegration.jsx` (detección heurística de fechas/ubicaciones y creación de eventos vía `/api/email/calendar-event` o fallback `CalendarService.createEvent`).
    - `components/email/EmailFeedbackCollector.jsx` (encuesta rápida; guarda en `performanceMonitor` y POST opcional a `/api/email-feedback`).
- Composición:
  - `components/email/EmailComposer.jsx` (clásico): valida destinatarios/asunto/cuerpo, limita adjuntos a 10 MB y permite programar envíos (ver limitaciones en automatización).
  - `components/email/SmartEmailComposer.jsx`: se alimenta de plantillas (`EmailService.getEmailTemplates` → API o `services/emailTemplates.js`) y recomendaciones de `EmailRecommendationService`. Soporta programación y rastrea recomendaciones aplicadas; integra con `ProviderSearchModal`.

### 3.3 Automatizaciones y análisis
- `services/emailAutomationService.js` gestiona:
  - Configuración de clasificación + auto-respuestas (persistidas localmente).
  - Procesamiento de entradas (`processIncomingEmails`) con heurística local; **el método `callClassificationAPI` no está implementado**, por lo que la clasificación IA real y el autop responde quedan inoperativos salvo por heurísticas.
  - Cola de envíos programados (`scheduleEmailSend`, `getScheduledEmails`, `processScheduledEmails`). **Falta disparador**: ningún punto del código invoca `processScheduledEmails`, de modo que los correos programados no se envían.
- `services/EmailRecommendationService.js` + `AIEmailTrackingService` llevan métricas locales para sugerencias IA dentro del Smart Composer.
- `components/email/EmailStats.jsx` + `pages/user/EmailStatistics.jsx` muestran métricas (Chart.js) usando `services/emailMetricsService.js` (Firestore `emailMetrics/{userId}`) con fallback a cálculos locales via `services/statsService.js`.

## 4. Persistencia y datos
- Correos: `services/emailService.js` prioriza backend (`/api/mail/*`). Sin backend, cae a Firestore (`users/{uid}/mails` y colección global `mails`) o memoria/localStorage (`memoryStore.mails`). No existe colección `weddings/{id}/emails`.
- Alias: `hooks/useEmailUsername.jsx` escribe en `emailUsernames/{alias}` y `users/{uid}` (`emailUsername`, `myWed360Email`).
- Configuración auto-respuesta / clasificación / cola: claves en `localStorage` (`mywed360.email.automation.*`, `mywed360.email.automation.schedule`…).
- Etiquetas y carpetas personalizadas: `tagService.js` y `folderService.js` almacenan en `localStorage` (mirroring opcional a Firestore); la UI principal todavía no las consume.
- Plantillas: API `/api/email-templates` (via `services/emailTemplatesService.js`); fallback a catálogo estático `services/emailTemplates.js`. No existe sincronización automática con Firestore.
- Métricas agregadas: Firestore `emailMetrics/{userId}` (+ subcolección `daily`). El cálculo local guarda copia en `localStorage` (`mywed360_email_stats_{userId}`).
- Tracking de proveedores/campañas AI: `services/EmailTrackingService.js` y `AIEmailTrackingService.js` usan `localStorage` (claves `mywed360_email_tracking`, `aiEmailActivities`, etc.). No hay persistencia servidor.

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

## 6. Estados especiales y manejo de errores
- Onboarding: si no hay sesión → redirección a `/login` con `returnUrl`; errores muestran banners en `EmailSetup.jsx`.
- Bandeja: `UnifiedInbox/InboxContainer.jsx` muestra spinner inicial, mensaje de error con botón “Reintentar” y fallback a mensajes simulados en tests (`defaultMailsTest`). No existe toggle para “buzón legacy” pese a lo documentado anteriormente.
- Composición: muestra toasts (éxito/error) y bloquea botón durante envío; validaciones evitan duplicados. Los envíos programados se guardan pero no se ejecutan.
- IA insights: si backend falla, heurística local produce un mínimo de acciones; se loguea en consola.
- Notificaciones: `EmailNotification.jsx` y `EmailNotificationBadge.jsx` degradan silenciosamente si `getMails` falla; la notificación overlay actual intercepta el click y lanza un `alert` placeholder (debe ajustarse).

## 7. Integración con otros flujos
- **Flujo 3/9 (Invitaciones & RSVP):** `pages/Invitaciones.jsx` usa `EmailService` para mandar invitaciones generadas; `rsvpService` genera links. La auto-respuesta “RSVP” de `EmailSettings` sirve de comunicación cruzada.
- **Flujo 5 (Proveedores IA):** `ProviderSearchModal.jsx` busca proveedores (`/api/ai-suppliers` o OpenAI directo) y pre-carga el Smart Composer; `EmailTrackingService` etiqueta correos enviados a proveedores.
- **Flujo 6 (Presupuesto/tareas):** `EmailInsights.jsx` dispara eventos (`window.dispatchEvent('mywed360-tasks')`) y botones de acceso rápido a `/tasks` y `/protocolo/timing`.
- **Flujo 12 (Notificaciones):** `EmailSettings` muestra auto-respuestas por categoría, pero aún no se sincroniza con preferencias globales del módulo de notificaciones (`notificationPreferencesService`).
- **Flujo 16 (IA Orquestador):** Recomendaciones y tracking IA se alimentan de `AIEmailTrackingService`; falta consolidar con workflows globales.
- **Otros:** `GlobalSearch.jsx` enlaza correos; `EmailNotification` informa de nuevos mensajes; `EmailInsights` ofrece enlaces a `Contracts` y `Finance` (cuando los insights incluyen contratos/presupuestos).

## 8. Métricas y monitorización
- Instrumentación local via `hooks/useEmailMonitoring.js` → `services/PerformanceMonitor.js` (`email_operation`, `template_cache_*`, `email_feedback_submitted`). Necesita consolidarse con dashboards reales (Grafana/BigQuery mencionados previamente no existen).
- `EmailStats.jsx` ofrece gráficos de actividad, aperturas/clicks, distribución por etiquetas/carpeta y contactos frecuentes. Cuando no hay datos en Firestore, calcula con `getMails`. Se recomienda cachear y evitar bloqueos UI.
- Faltan métricas de entregabilidad reales (rebotes, spam) y correlación con journeys multicanal.

## 9. Pruebas y cobertura
- **Unitarias / integración (Vitest):**
  - `src/test/e2e/EmailWorkflows.test.jsx` y `src/test/e2e/AdvancedEmailWorkflows.test.jsx` ejercitan el flujo clásico (`EmailInbox`, `EmailDetail`, `EmailSettings`, `FolderSelectionModal`). Aún apuntan a la bandeja anterior y data-testids antiguos (`folder-sent`), por lo que deben actualizarse a `UnifiedInbox`.
  - `src/test/components/email/*` cubren `EmailInbox`, `EmailDetail`, `FolderSelectionModal`, etc.
  - `src/test/accessibility/EmailInbox.a11y.test.jsx` verifica accesibilidad de la bandeja legacy.
- **Cypress:** `cypress/e2e/email/*.cy.js` validan envío, lectura, gestión y notificaciones, pero confían en data-testids de la UI previa (`folder-sent`, etc.). La nueva bandeja debe exponer atributos equivalentes o actualizar las pruebas.
- **Gaps:** no hay pruebas específicas para `UnifiedInbox/InboxContainer`, `EmailFeedbackCollector`, `CalendarIntegration` ni para la cola de envíos programados/auto-respuestas. Se requiere crear nuevos escenarios E2E (programar envío, aplicar etiquetas, comentarios, flujo IA).


## Cobertura E2E implementada
- `cypress/e2e/email/send-email.cy.js y cypress/e2e/email/read-email.cy.js`: comprueban envío, recepción y lectura de correos desde la bandeja unificada.
- `cypress/e2e/email/folders-management.cy.js y cypress/e2e/email/tags-filters.cy.js`: verifican organización por carpetas, etiquetas y filtros avanzados.
- `cypress/e2e/email/smart-composer.cy.js, cypress/e2e/email/ai-provider-email.cy.js y cypress/e2e/compose_quick_replies.cy.js`: prueban generación asistida por IA y respuestas rápidas.
- `cypress/e2e/email_inbox_smoke.cy.js`: smoke integral de la bandeja y sincronización en tiempo real.

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
1. **Automatización y backend**
   - Implementar `callClassificationAPI` (o sustituirlo) y gestionar gracefully la ausencia del endpoint.
   - Mover la cola de envíos programados a backend + job recurrente; exponer estado/errores al usuario.
   - Persistir auto-respuestas y clasificación en Firestore/REST (no sólo localStorage).
2. **UX / funcionalidad**
   - Integrar carpetas y etiquetas personalizadas en la nueva bandeja (sidebar, filtros, drag & drop).
   - Resolver buscador/sort duplicado en `UnifiedInbox/EmailList.jsx` y alinear data-testids con Cypress.
   - Añadir toggle o ruta para acceder al buzón legacy sólo en modo soporte, o removerlo tras migración.
   - Completar experiencia de onboarding: validación DKIM/SPF, envío de correo de prueba, integración con `MailgunTester`.
3. **Analítica y monitoreo**
   - Registrar eventos de entrega/aperturas reales (Mailgun webhooks) y mostrar alertas en `EmailInsights`/`EmailStats`.
   - Integrar métricas con dashboards oficiales (Grafana/BigQuery) y alertas para rebotes.
4. **Integraciones cruzadas**
   - Sincronizar preferencias con módulo de notificaciones (Flujo 12) y con workflows IA globales (Flujo 16).
   - Implementar journeys multicanal (email + push + WhatsApp) y timeline conversacional centralizado.
5. **Testing**
   - Actualizar suites Cypress/Vitest al nuevo inbox, añadir cobertura para comentarios, calendar, feedback y envíos programados.
   - Automatizar pruebas de alias / onboarding (`EmailSetup`) y Mailgun fallback.

Mantener esta lista viva antes de iniciar nuevas implementaciones en Flujo 7.
