# 23. Metricas del Proyecto (estado 2025-10-14)

> Vision consolidada de la observabilidad del producto. Integra la instrumentacion definida en los flujos 6, 7, 8, 9, 14, 15, 16, 17, 19, 20, 21, 22, 24, 26, 30 y 31, ademas de la capa comun `performanceMonitor`. Esta version reemplaza el enfoque limitado a email y formaliza el plan para dashboards y pipelines compartidos.

## Estado resumido
- ✅ Implementado hoy
  - `performanceMonitor` captura eventos/errores/contadores y publica lotes opcionales al endpoint configurado.
  - Dashboards embebidos (`components/metrics/MetricsDashboard.jsx`, `components/admin/MetricsDashboard.jsx`) consumen la cache en memoria y permiten exploración manual en entornos QA/admin.
  - Flujos críticos (finanzas, emails, gamificación, dashboard planner/home) ya envían eventos alineados con esta especificación.
- ⚠️ Pendiente
  - Persistencia central (`/api/project-metrics` + `metricAggregatorWorker`) y pipeline de ingestión a producir/almacenar históricos.
  - Gobernanza de permisos/roles para exponer `/analytics/project` y paneles consolidados a planners/owners.
  - Completar documentación operativa (runbooks, respuestas ante fallos, anexos de seguridad) antes del despliegue productivo.
- ⛓️ Bloqueos
  - Falta acordar retención, borrado selectivo y política legal (privacy/GDPR) para datos agregados multiusuario.
  - Dependencias en flujos que aún no exponen métricas normalizadas (ej. automatizaciones IA extendidas, marketplace).

## 1. Objetivo y alcance
- Centralizar la captura de eventos, contadores y KPIs clave de todos los modulos que ya declararon metrica en su doc funcional.
- Exponer superficies internas (QA, soporte, producto) que permitan diagnosticar salud de emails, presupuesto, RSVP, diseno IA, gamificacion y paneles dashboard.
- Preparar la salida controlada de `/analytics/project` una vez que exista backend persistente y workers (`metricAggregatorWorker`, `insightsBackfillTask`) estabilizados.

## 2. Componentes y rutas disponibles
- `components/metrics/MetricsDashboard.jsx`: tablero embebible (admin/planner) que lee `performanceMonitor.metrics` y muestra series, contadores y errores en tiempo real. Actualmente cargado manualmente bajo feature flag.
- `components/admin/MetricsDashboard.jsx`: version extendida para soporte interno con filtros por modulo y export manual (CSV local). Depende de las mismas fuentes in-memory.
- Superficies especificas ya productivas:
  - `components/finance/FinanceCharts.jsx` y `FinanceOverview.jsx` (flujo 6) para KPIs financieros.
  - `pages/user/EmailStatistics.jsx` y `components/email/EmailStats.jsx` (flujo 7) para volumen y entregabilidad.
- `PlannerDashboard.jsx` y `HomeUser.jsx` (flujos 22 y 30) reutilizan contadores consolidados para tarjetas resumidas.
- La ruta `/analytics/project` permanece oculta; se publicara cuando exista almacenamiento persistente y permisos afinados.

## 3. Arquitectura de datos actual
### 3.1 Captura en cliente
- `services/PerformanceMonitor.js` centraliza eventos y errores. Almacena en memoria (`metrics.events|errors|timings|counters`) y opcionalmente publica a `VITE_METRICS_ENDPOINT` via `apiClient.post` cada 60 s o cuando se supera `batchSize = 20`.
- Hooks y servicios (por ejemplo `useEmailMonitoring`, `useUnifiedInboxMetrics`, `PlannerDashboard`) ya emiten eventos normalizados (`logEvent`, `logError`, `recordTiming`, `incrementCounter`) alineados con las definiciones de cada flujo.
- En tests `performanceMonitor` se deshabilita automaticamente para evitar timers residuales.

### 3.2 Colecciones y datasets declarados
- Email: `emailMetrics/{userId}` + subcoleccion `daily` con respaldo en `localStorage` para modo offline (`docs/flujos-especificos/flujo-7-comunicacion-emails.md`).
- Finanzas: `finance/main`, `finance/transactions`, datasets `aiBudgetAdvisorSessions` (Storage) y meta en `adminMetrics/{date}.aiBudgetAdvisorMeta` (`docs/flujos-especificos/flujo-6-presupuesto.md`).
- RSVP: `weddings/{id}/guests`, `rsvpTokens`, logs de entrega (`docs/flujos-especificos/flujo-9-rsvp-confirmaciones.md`).
- Gamificacion: `gamification`, `achievements`, `gamificationEvents` (backend) (`docs/flujos-especificos/flujo-17-gamificacion-progreso.md`).
- Diseno web IA: `analytics/websiteEvents`, `weddings/{id}/generatedPages`, `ai/websites/runs` (`docs/flujos-especificos/flujo-8-diseno-web-personalizacion.md`).
- Sitio publico: `weddings/{id}/publicSite`, `publicSites/{slug}`, logging CDN pendiente (`docs/flujos-especificos/flujo-21-sitio-publico.md`).
- Buzon unificado: `weddings/{id}/emails/*`, `emailEvents` backend (`docs/flujos-especificos/flujo-20-email-inbox.md`).
- Diseno de invitaciones: `weddings/{id}/designs`, `designActivity`, `designTemplates` (`docs/flujos-especificos/flujo-19-diseno-invitaciones.md`).
- Checklist y automatizaciones: `tasks`, `templates`, `automationRuns` (`docs/flujos-especificos/flujo-14-checklist-avanzado.md`).
- Contratos: `contracts`, `contractEvents`, `signingSessions` (`docs/flujos-especificos/flujo-15-contratos-documentos.md`).
- Inspiracion: `inspirationWall`, `favorites`, `searchTerms` (`docs/flujos-especificos/flujo-24-galeria-inspiracion.md`).
- Blog: `weddingNews`, `blogCache`, `newsStats` (`docs/flujos-especificos/flujo-26-blog.md`).
- Estilo global: `branding/main`, `preferences.style`, eventos `event_creation_*` via `performanceMonitor` (`docs/flujos-especificos/flujo-31-estilo-global.md`).

## 4. Fuentes por flujo instrumentadas
| Flujo | Eventos declarados | Persistencia / referencia |
|-------|--------------------|---------------------------|
| 6. Presupuesto | `budget_configured`, `budget_category_updated`, `transaction_logged`, `budget_over_threshold`, `payment_suggestion_used`, `bank_import_triggered`, `advisor_chat_opened`, `advisor_chat_message_sent`, `advisor_chat_response_received`, `advisor_adjustment_applied`, `advisor_adjustment_discarded`, `advisor_feedback_submitted` | `finance/main`, `finance/transactions`, datasets `aiBudgetAdvisorSessions` y `adminMetrics` (`docs/flujos-especificos/flujo-6-presupuesto.md`) |
| 7. Comunicacion y Email | `email_sent`, `email_failed`, `email_opened`, `email_bounced`, `template_cache_*`, interacciones via `useEmailMonitoring` | `emailMetrics/{userId}`, `emailEvents`, `localStorage` (`docs/flujos-especificos/flujo-7-comunicacion-emails.md`, `docs/flujos-especificos/flujo-20-email-inbox.md`) |
| 8. Diseno web IA | `website_generated`, `website_logistics_saved`, `website_publish_started|published|failed` (pendiente `website_regenerated`, `website_theme_changed`) | `analytics/websiteEvents`, `weddingInfo.*`, `ai/websites/runs` (`docs/flujos-especificos/flujo-8-diseno-web-personalizacion.md`) |
| 9. RSVP | `rsvp_invitation_sent`, `rsvp_completed`, `rsvp_declined`, `rsvp_reminder_sent` | Logs de entrega, `weddings/{id}/guests`, `rsvpTokens` (`docs/flujos-especificos/flujo-9-rsvp-confirmaciones.md`) |
| 14. Checklist avanzado | `task_created`, `task_completed`, `task_overdue`, `template_applied`, `automation_triggered` | `tasks`, `templates`, `automationRuns` (`docs/flujos-especificos/flujo-14-checklist-avanzado.md`) |
| 15. Contratos y documentos | `document_created`, `document_uploaded`, `document_signed`, `document_overdue` | `contracts`, `signingSessions`, alertas SLA (`docs/flujos-especificos/flujo-15-contratos-documentos.md`) |
| 16. Asistente IA | `chat_opened`, `chat_message_sent`, `chat_mark_important` (local) | Persistencia futura `assistantMetrics`; hoy solo cache local (`docs/flujos-especificos/flujo-16-asistente-virtual-ia.md`) |
| 17. Gamificacion | `gamification_points_awarded`, `achievement_unlocked`, `challenge_completed` | `gamification`, `achievements`, `gamificationEvents` backend (`docs/flujos-especificos/flujo-17-gamificacion-progreso.md`) |
| 19. Diseno invitaciones | `design_created`, `design_exported`, `design_shared`, `design_template_used` | `weddings/{id}/designs`, `designActivity` (`docs/flujos-especificos/flujo-19-diseno-invitaciones.md`) |
| 20. Buzon unificado | `unified_inbox_load`, `unified_inbox_search`, `email_operation`, `email_template_render` | `weddings/{id}/emails`, `emailMetrics`, `performanceMonitor` (`docs/flujos-especificos/flujo-20-email-inbox.md`) |
| 21. Sitio publico | `public_site_published`, `public_site_unpublished`, `public_site_visit`, `public_site_rsvp` | `publicSites`, `analytics/websiteEvents`, logs CDN pendientes (`docs/flujos-especificos/flujo-21-sitio-publico.md`) |
| 22. Dashboard y navegacion | `dashboard_widget_clicked`, `dashboard_widget_hidden`, `profile_updated`, `more_menu_opened` | `plannerPreferences`, `performanceMonitor` (`docs/flujos-especificos/flujo-22-dashboard-navegacion.md`) |
| 24. Galeria de inspiracion | `inspiration_gallery_view`, `inspiration_wall_loaded`, `inspiration_tag_selected`, `inspiration_search_performed`, `inspiration_item_faved`, `inspiration_item_viewed`, `inspiration_lightbox_open` | `inspirationWall`, `favorites`, `searchTerms` (`docs/flujos-especificos/flujo-24-galeria-inspiracion.md`) |
| 26. Blog | `home_blog_loaded`, `home_blog_card_clicked`, `home_blog_visual_mode_toggle` | `weddingNews`, `newsStats` (`docs/flujos-especificos/flujo-26-blog.md`) |
| 30. Home / landing interna | `home_quick_action_opened`, `home_inspiration_click`, `home_blog_card_opened`, `home_progress_viewed` (pendiente activar) | Contadores combinados desde `useFinance`, caches `localStorage`, `performanceMonitor` (`docs/flujos-especificos/flujo-30-pagina-inicio.md`) |
| 31. Estilo global | `event_creation_view`, `event_creation_step1_completed`, `event_creation_submit`, `event_creation_succeeded`, `event_creation_failed` (con `style`) | `branding/main`, `preferences.style`, `performanceMonitor` (`docs/flujos-especificos/flujo-31-estilo-global.md`) |

## 5. KPIs y tableros consumidos hoy
- Finanzas: diferencia real vs presupuesto, alertas por umbral y proyeccion beta + geometrica (`FinanceOverview`, `FinanceCharts`).
- Comunicaciones: entregabilidad, rebotes y tiempos de respuesta (`EmailStats`, `EmailInsights`). Las vistas usan `emailMetrics` o recalculan desde `services/statsService.js` si falta backend.
- RSVP: tasa de respuesta, recordatorios pendientes, conversion por canal (widgets en `PlannerDashboard`, seeds descritos en el flujo 9).
- Diseno IA / sitio publico: conversion generacion → publicacion y fallos por template (`analytics/websiteEvents`).
- Gamificacion: consumo interno via `GET /api/gamification/stats`, sin UI publica.
- Inspiracion/Blog/Home: contadores mostrados en `PlannerDashboard.jsx` y `HomeUser.jsx`; requieren activar eventos pendientes del flujo 30 para completar trazabilidad.

## 6. Integracion con otros flujos
- Flujos 3 y 4 alimentan RSVP y checklist con datos de invitados; sus contadores deben sincronizarse para dashboards (ver `docs/flujos-especificos/flujo-4-invitados-operativa.md`).
- Flujo 6 comparte `budgetProgress` con gamificacion (flujo 17) y con tarjetas de Home (flujo 30). Mantener normalizados los porcentajes antes de exportarlos.
- Flujo 7 provee `paymentSuggestions` y `EmailInsights` a finanzas y timeline (flujos 6 y 5b).
- Flujos 8 y 21 comparten `analytics/websiteEvents` para medir visitas y conversiones QR.
- Flujo 22 requiere agregados de 3, 4, 6, 9, 14 y 17 para poblar widgets; asegurar que `metricAggregatorWorker` exponga API consistente.

## 7. Estados especiales y errores
- `MetricsDashboard` muestra "Sin datos" cuando `performanceMonitor.metrics.events.length === 0` o la API devuelve vacio.
- Si `performanceMonitor.flushMetrics()` falla (endpoint no configurado o error HTTP) se registra `logError('metrics_flush_failed', ...)` sin romper la UI; documentar la incidencia en soporte.
- Las superficies especificas (finanzas, email) cuentan con fallback local; reportar discrepancias antes de habilitar el dashboard global.

## 8. Observabilidad y alertas
- Configurar `VITE_METRICS_ENDPOINT` apuntando al colector backend cuando se despliegue `/api/project-metrics`. Mientras tanto el dashboard opera en memoria.
- Definir reglas de alerta para backlog o ausencia de datos por modulo (por ejemplo >15 min sin `email_sent`, picos de `email_bounced`, `budget_over_threshold` en mas del 20% de bodas activas).
- Backend propuesto: Firestore + BigQuery export (jobs `metricAggregatorWorker`, `insightsBackfillTask`) para consolidar eventos y generar vistas agregadas por boda y modulo.

## 9. Cobertura E2E implementada
- `cypress/e2e/performance/email-performance.cy.js`: smoke de captura y visualizacion de metricas de comunicacion.
- `cypress/e2e/finance/finance-analytics.cy.js`: valida panel financiero y agregados que alimentaran el dashboard global.
- `cypress/e2e/gamification/gamification-history.cy.js`: confirma ausencia de panel visible y consistencia de endpoints antes de exponer contadores.
- `cypress/e2e/budget_flow.cy.js` y `cypress/e2e/finance/finance-flow-full.cy.js`: ejercitan eventos `budget_*` y alertas usadas por el dashboard.

## 10. Checklist de despliegue
- Backend: exponer `/api/project-metrics` (GET agregados, POST ingest) protegido por roles (owner, planner, admin, soporte) y habilitar `metricAggregatorWorker` en cron. Ver plan detallado en `docs/panel-admin/metricAggregatorWorker-plan.md`.
- Configurar `VITE_METRICS_ENDPOINT` y variables adicionales (`VITE_ENABLE_EMAIL_ANALYZE`, `VITE_ENABLE_FINANCE_ALERTS`, `MAILGUN_*`, `VITE_BANK_API_*`) para garantizar fuentes completas.
- Verificar reglas de seguridad para colecciones citadas (emailMetrics, finance, gamification, analytics/websiteEvents, publicSites, tasks, contracts, inspirationWall, blogCache).
- Asegurar que `performanceMonitor.setUserContext` se invoca desde `useAuth` y `WeddingContext` antes de habilitar reportes multiusuario.
- Documentar en runbook la respuesta a fallos de ingest (reintentos, colas pendientes, mute de alertas).

## 11. Roadmap
- Finalizar `metricAggregatorWorker` e `insightsBackfillTask` leyendo de `performanceMonitor` y fuentes Firestore para poblar `projectMetrics` (BigQuery/Firestore) y exponer grafica historica.
- Construir `/analytics/project` con secciones Comunicacion, Finanzas, RSVP, Engagement IA, Inspiracion/Contenido; habilitar filtros por boda, rango y rol.
- Instrumentar eventos pendientes en flujos 16, 30 y 31 (cambios de paleta, quick actions, comandos IA) para cerrar gaps de datos.
- Consolidar alertas multi modulo (sobrepresupuesto, rebotes altos, RSVP sin respuesta, diseno sin publicar) y enviarlas via flujo 12 (notificaciones).
- Preparar exportaciones CSV/JSON desde `MetricsDashboard` usando datos persistidos en lugar de `performanceMonitor` in-memory.
