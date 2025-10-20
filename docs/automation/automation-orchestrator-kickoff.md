# Kickoff Automatizaciones IA - AutomationOrchestrator

**Fecha objetivo**: 20/10/2025  
**Duración estimada**: 60 minutos  
**Modo**: Reunión síncrona (videollamada) con acta compartida en este documento.

## Participantes propuestos
- **Frontend**: Lead frontend, responsable de `NotificationPreferences`, centro de notificaciones y UI de reglas.
- **Backend**: Tech lead backend, responsable de colas (`automationLogs`, `automationRules`) y workers.
- **Infra/DevOps**: Persona encargada de credenciales Mailgun/Twilio/FCM y despliegues escalonados.
- **Producto**: PM de experiencia IA para priorizar escenarios y métricas de éxito.
- **QA**: Responsable de suites E2E y escenarios de regresión multi-canal.

## Objetivos de la sesión
1. Alinear alcance del MVP del `AutomationOrchestrator` multicanal (email/chat/WhatsApp/SMS).
2. Definir dependencias técnicas y de credenciales para cada canal.
3. Asignar responsables por componente (backend, frontend, QA, documentación).
4. Establecer entregables inmediatos y fecha de revisión del plan.

## Agenda sugerida (60')
1. **5'** – Contexto y drivers de negocio (PM).
2. **15'** – Arquitectura propuesta del orquestador y colas (Backend).
3. **15'** – Requisitos de UI/UX: Automation Rules UI + nuevo centro de notificaciones (Frontend).
4. **10'** – Seguridad, permisos y gestión de credenciales (Infra).
5. **10'** – Plan de QA y telemetría (QA + Backend/Frontend).
6. **5'** – Próximos pasos, owners y checkpoints.

## Prework requerido
- Revisar la documentación vigente (`docs/flujos-especificos/flujo-16-asistente-virtual-ia.md`, `docs/flujos-especificos/flujo-12-notificaciones-configuracion.md`, `docs/TODO.md` secciones “Asistente virtual e IA” y “Notificaciones”).
- Inventariar credenciales actuales (Mailgun, Twilio, FCM, WhatsApp Business) y su estado.
- Identificar endpoints y servicios existentes que se verían afectados.

## Entregables post-reunión
- Acta con decisiones, responsables y fechas.
- Tickets creados/actualizados en backlog (epics e historias por iteración).
- Actualización de `docs/ROADMAP.md` y `docs/TODO.md` con hitos y métricas acordadas.
- Lista de riesgos + plan de mitigación inicial.

## Checklist de seguimiento
- [ ] Reunión calendarizada y enviada a participantes.
- [ ] Responsable asignado para acta y actualización de documentación.
- [ ] Tickets creados en herramienta de gestión (link pendiente).
- [ ] Próximo checkpoint definido (ej. revisión semanal).

## Arquitectura acordada (MVP 2025-Q4)

### Componentes
- **AutomationOrchestrator (backend/automation/orchestrator.ts)**  
  Servicio central (Node) desplegado junto al backend Express. Consume eventos de negocio, aplica reglas y despacha acciones asíncronas. Corre cada 60 s vía cron y recibe webhooks push (Mailgun, WhatsApp, asistentes).
- **Reglas configurables (`automationRules`)**  
  Colección Firestore `automationRules/{ruleId}` con esquema `{ channel, trigger, filters, conditions, actions, enabled, priority, owner, updatedAt }`. Cada regla referencia plantillas (`automationTemplates`) y límites (`rateLimit`).
- **Colas y logs (`automationQueue`, `automationLogs`)**  
  - `automationQueue/{id}`: items pendientes `{ source, payload, ruleIds, runAt, retries, status }`.  
  - `automationLogs/{id}`: historial de ejecuciones `{ channel, ruleId, action, outcome, responseMeta, durationMs }`.
- **Connectores de canal**  
  Adaptadores independientes (`MailgunConnector`, `TwilioConnector`, `InAppConnector`, `WebhookConnector`) expuestos desde `backend/services/automation/channels/*.js`.
- **Context providers**  
  Fetchers reusables para obtener estado agregado antes de ejecutar reglas (`GuestContextProvider`, `FinanceContextProvider`, `TimelineContextProvider`). Los resultados se cachean temporalmente en `automationStateCache/{weddingId}` (TTL 15 min).
- **Orchestrator UI (flujo 12/16)**  
  Panel en `src/pages/admin/AutomationRules.jsx` para CRUD de reglas, vista timeline y replay de eventos. Consume endpoints `/api/automation/rules`, `/api/automation/logs`, `/api/automation/test`.

### Flujo de eventos
1. **Ingesta**: un evento llega por webhook (Mailgun/Twilio) o se publica desde la app (`NotificationService.enqueue`, `useFinance` alerts). Se normaliza en `automationQueue` junto a metadatos (boda, canal, payload).
2. **Selección de reglas**: el orquestador carga reglas habilitadas que coinciden con `trigger.type`, evalúa filtros (wedding, roles, etiquetas) y ordena por `priority`.
3. **Resolución de contexto**: se agregan datos necesarios (perfil boda, invitados, finanzas, tareas) mediante providers. Se cachea la respuesta.
4. **Evaluación de condiciones**: se ejecutan funciones puras (por ahora DSL JSON → JS). Si todas se cumplen, se construyen acciones (enviar correo, programar recordatorio, crear tarea, invocar webhook externo).
5. **Despacho**: cada acción se encola a un conector. Los conectores aplican rate limiting y reintentos (`retries`, `backoffMs`). Resultado persistente en `automationLogs`.
6. **Feedback loop**: los logs generan métricas (`automation_executed_total`, `automation_failed_total`, `automation_latency_ms`) expuestas en Prometheus y visibles en panel admin.

### Contratos API (resumen)
- `POST /api/automation/rules`  
  Crea/actualiza reglas. Requiere rol admin + MFA. Valida DSL antes de persistir.
- `POST /api/automation/test`  
  Ejecuta una regla en modo sandbox: prepara contexto, muestra acciones sin persistir (útil para QA).
- `POST /api/automation/ingest`  
  Endpoint interno (cron/colas) que permite inyectar eventos manuales o desde jobs.
- `GET /api/automation/logs`  
  Soporta filtros por boda, estado, rango de fechas y canal. Permite export CSV para auditoría.

### Migraciones y datos iniciales
- Crear reglas base (ej. `rsvp_reminder_pending`, `finance_over_budget`, `moments_upload_flagged`).
- Sembrar catálogos (`automationTemplates`) con plantillas de email/SMS y contenido IA.
- Migrar legacy `notificationRules` → `automationRules` manteniendo historial (`migrateNotificationRules.js` pendiente).

### Fases de implementación
1. **Infraestructura**: colecciones Firestore, conectores stub, métricas básicas.
2. **Panel admin**: listado de reglas, creación y test sandbox.
3. **Canales prioritarios**: email (Mailgun), in-app, WhatsApp; definir SLA y límites.
4. **Reglas MVP**:  
   - Invitados sin RSVP → recordatorio (Mailgun).  
   - Movimiento financiero > umbral → alerta (email + in-app).  
   - Momento especial sin responsable → tarea automática (in-app).
5. **Observabilidad**: dashboards Grafana (`automation-latency.json`) y alertas (`AutomationHighFailureRate`, `AutomationBacklogGrowing`).
6. **Iteración IA**: conectar con `AutomationAdvisor` (flujo 16) para que el asistente proponga nuevas reglas y revise ejecuciones fallidas.

Documenta cualquier nuevo componente relacionado en `docs/flujos-especificos/flujo-16-asistente-virtual-ia.md` y actualiza esta sección tras cada milestone.
