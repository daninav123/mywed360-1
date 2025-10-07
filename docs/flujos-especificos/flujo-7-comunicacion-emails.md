# 7. Comunicaciones y Email (estado 2025-10-07)

> Implementado: `UnifiedEmail.jsx`, `EmailInbox.jsx`, `EmailView.jsx`, `EmailComposer.jsx`, `SmartEmailComposer.jsx`, `EmailSetup.jsx`, `EmailSettings.jsx`, `EmailTemplates.jsx`, `EmailStats.jsx`, `EmailFilters.jsx`, `CustomFolders.jsx`, `EmailTagsManager.jsx`, `EmailComments.jsx`, `EmailFeedbackCollector.jsx`, `CalendarIntegration.jsx`, `MailgunTester.jsx`, servicios `emailAutomationService.js`, `emailTemplatesService.js`, `EmailRecommendationService`, hooks `useEmailMonitoring`.
> Pendiente: journeys multicanal, respuesta automática inteligente, integración nativa con WhatsApp/Push y consolidación de buzón legacy.

## 1. Objetivo y alcance
- Centralizar envíos y recepción de emails para bodas con plantillas, IA y estadísticas.
- Configurar remitentes, dominios y monitorear entregabilidad.
- Unificar experiencia legacy (`Buzon_fixed_complete`) con bandeja moderna.

## 2. Trigger y rutas
- Menú de usuario (avatar superior derecho) → “Buzón de Emails” (`/email`, `EmailInbox.jsx`).
- Desde el mismo menú se accede a configuración (`/email/setup`), plantillas (`/email/plantillas`) y estadísticas (`/email/estadisticas`).
- Notificaciones in-app y widgets de proveedores/invitados enlazan a `/email/:mailId` para abrir un hilo concreto.

## 3. Paso a paso UX
1. Onboarding correo
   - Wizard `EmailSetupForm`/`EmailSetup.jsx` valida remitente, dominios, DKIM/SPF y envía pruebas.
   - `MailgunTester` ayuda a diagnosticar credenciales.
   - `EmailSettings.jsx` define preferencias por tipo (invitaciones, RSVP, recordatorios).
2. Operativa diaria
   - `EmailInbox` ofrece carpetas personalizadas, filtros avanzados, búsqueda semántica, badges y lectura rápida.
   - `EmailComposer` y `SmartEmailComposer` redactan correos; este último integra recomendaciones IA y plantillas dinámicas.
   - `EmailTagsManager`, `CustomFolders`, `EmailComments` organizan y colaboran sobre hilos.
3. Automatizaciones y análisis
   - `CalendarIntegration` programa envíos, `emailAutomationService` dispara workflows.
   - `EmailFeedbackCollector` registra retroalimentación post-envío.
   - `EmailStats`/`EmailStatistics` exponen métricas (envíos, aperturas, rebotes, respuestas) con segmentación.

## 4. Persistencia y datos
- Firestore `weddings/{id}/emails` almacena cabeceras, cuerpo, adjuntos, etiquetas, tracking.
- `weddings/{id}/emailSettings` y `emailTemplates` guardan configuración y plantillas.
- Logs de eventos en backend (`emailEvents`) para aperturas/rebotes, consultados via API.
- Preferencias globales por usuario en `users/{uid}/emailPreferences`.

## 5. Reglas de negocio
- Envíos masivos requieren remitente verificado, límite diario configurable.
- Email crítico (reset, invitaciones) permanece 30 días mínimo.
- Adjuntos =5MB y formatos permitidos (PDF, JPG, PNG, DOCX).
- Roles: owner/planner gestiona settings y plantillas; assistants pueden enviar con plantillas aprobadas.

## 6. Estados especiales y errores
- Sin setup ? banner con CTA "Configura tu correo".
- Error de envío ? toast + reintento automático (`temporary_failure`).
- Buzón legacy activo ? toggle para migración.
- Sin conexión ? vista lectura + cola local (envío diferido).

## 7. Integración con otros flujos
- Flujo 3/9 usan emails para invitaciones y recordatorios RSVP.
- Flujo 5 integra comunicaciones con proveedores (tracking).
- Flujo 12 respeta preferencias de notificación al enviar.
- Flujo 20 reutiliza bandeja/analytics; Flujo 21 enlaza sitio público.
- Flujo 17 otorga puntos por hitos de comunicación.

## 8. Métricas y monitorización
- Eventos: `email_sent`, `email_delivered`, `email_bounced`, `email_opened`, `email_reply_recorded`.
- KPIs: tasa de apertura/click, tiempo de respuesta promedio, ratio de rebote.<br>
- Monitoreo: dashboards (Grafana/BigQuery) con latencia por proveedor y ejecución de automatizaciones.

## 9. Pruebas recomendadas
- Unitarias: filtros, parser de cabeceras, servicio de recomendaciones, guardado de plantillas.
- Integración: configurar cuenta ? enviar campaña ? registrar métricas ? visualizar en stats.
- E2E: onboarding, envío masivo, respuesta simulada, control de etiquetas y feedback.

## 10. Checklist de despliegue
- Variables `MAILGUN_*`/SMTP, dominios (DKIM, SPF, DMARC) y `VITE_ENABLE_DIRECT_OPENAI` si aplica IA.
- Reglas Firestore para `emails`, `emailSettings`, `emailTemplates`.
- Webhooks Mailgun configurados (inbound/outbound).
- Plan de migración desde buzón legacy con backup.

## 11. Roadmap / pendientes
- Journeys multicanal (email + WhatsApp + push).
- Respuestas automáticas IA con aprendizaje supervisado.
- Analítica avanzada con cohorts y comparativas.
- Biblioteca compartida de plantillas y traducciones.
- Integración directa con CRM o marketing externo.
