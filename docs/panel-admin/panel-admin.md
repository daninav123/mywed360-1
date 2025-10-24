# Panel Admin – Estado actual (2025-10-15)

Este documento describe el panel de administración que ya está implementado en el proyecto, módulo por módulo, incluyendo fuentes de datos, acciones disponibles y limitaciones detectadas. Todas las rutas se sirven bajo el layout seguro (`AdminLayout.jsx`) y están protegidas por las reglas de autenticación admin (`RequireAdmin`).

## 1. Acceso y marco común

### 1.1 Autenticación (`src/pages/admin/AdminLogin.jsx`)
- Formulario con email y contraseña (placeholders `admin@maloveapp.com` / vacío). Bloquea envíos si hay intentos en curso.
- MFA opcional: si `useAuth.loginAdmin` devuelve un `pendingAdminSession`, se muestra un segundo paso con contador de caducidad (6 dígitos, 60 s por defecto).
- Gestión de bloqueo temporal (`lockedUntil`): muestra cuenta atrás y evita nuevos intentos hasta que expire.
- Botón de ayuda abre modal con email/teléfono de soporte (`VITE_ADMIN_SUPPORT_EMAIL`, `VITE_ADMIN_SUPPORT_PHONE`).
- Al autenticarse redirige a la última ruta solicitada o `/admin/dashboard`.

### 1.2 Layout y navegación (`src/pages/admin/AdminLayout.jsx`, `src/config/adminNavigation.js`)
- Sidebar (solo en desktop) con secciones: Panel, Operaciones, Analítica, Infraestructura, Configuración.
- Header con breadcrumbs construidos desde la ruta, indicador "Última actualización HH:MM:SS" (se refresca cada 60 s) y datos del administrador logueado.
- Botón `Ayuda` reutiliza email/teléfono de soporte; muestra CTA para contactar por email o teléfono.
- Botón `Cerrar sesión` invoca `useAuth.logout` y redirige al login admin.
- Registro de visitas: cada cambio de ruta válida (`ADMIN_ALLOWED_PATHS`) genera `recordAdminAudit('ADMIN_ROUTE_VISIT')` con actor/path.
- Footer con versión (`VITE_ADMIN_VERSION`, fallback `v1.0.0`) y enlace a políticas de seguridad (`VITE_SECURITY_POLICY_URL`).

## 2. Módulos actuales

### 2.1 Dashboard (`/admin/dashboard`, `src/pages/admin/AdminDashboard.jsx`)
- **KPIs** (array `kpis` del endpoint): cada tarjeta muestra valor y tendencia (`trend` positivo/negativo con flecha y color). Identificadores habituales: `active-weddings`, `revenue-30d`, `downloads-30d`, `open-alerts`. El backend calcula estos valores en tiempo real contando bodas activas, sumando la facturación real de los últimos 30 días desde `payments`, agrupando descargas recientes (`appDownloads`, `appDownloadEvents`, `mobileDownloads`, `analyticsAppDownloads`) y contabilizando alertas sin resolver (`adminAlerts`).
- **Salud de servicios**: grid con estado, latencia e incidentes por servicio (`services`). Usa mapeo `operational / degraded / down` → etiquetas y colores.
- **Alertas**: lista lateral con módulo, severidad y timestamp. Al seleccionar una alerta se muestra el detalle. Acciones:
  - `Marcar resuelta` abre modal para añadir notas y llama a `resolveAdminAlert(id, notes)`.
- **Tareas nuevas de usuarios**: tarjeta que agrupa las tareas creadas manualmente por los propietarios/planners en sus bodas durante los últimos 14 días (`overview.newTasks`). Para identificar tareas equivalentes aunque tengan descripciones distintas, el backend normaliza cada título (minusculiza, elimina diacríticos y stopwords comunes como "buscar", "contratar", "organizar") y agrupa por clave canónica. Para cada grupo se muestran:
  - el título canónico,
  - `totalOccurrences` (veces que los usuarios la han añadido),
  - `totalWeddings` (número de bodas distintas),
  - ejemplos de títulos originales (`sampleTitles`) y la fecha más reciente (`lastCreatedAt`).
  - Ideal para detectar tendencias como "Toro mecánico" o "Fotomatón 360" aunque los usuarios nombren la tarea de forma diferente.
- **Fallback**: si Firestore no devuelve datos, el backend (`admin-dashboard.js`) envía colecciones demo (KPIs, servicios, alertas, tareas administrativas) y `newTasks` vacío para evitar UI vacía.

### 2.2 Métricas (`/admin/metrics`, `src/pages/admin/AdminMetrics.jsx`)
- Obtiene `series`, `funnel`, `appDownloads`, `iaCosts`, `communications`, `supportMetrics` con `getMetricsData()`.
- Gráficos con Recharts:
  - Línea: nuevos usuarios vs bodas creadas.
  - Barras: costes IA por proveedor.
  - Tarjetas funnel: visitantes → registrados → bodas activas.
  - Área apilada: descargas de la app por plataforma (Android/iOS) y conversión a registro (`appDownloads.platformBreakdown` + `conversionRate`).
  - Listado comunicaciones últimos 7 días (por canal) y panel de soporte (`supportMetrics` si existe) con tickets abiertos, SLA incumplidos, tiempo medio y NPS.
- Maneja estados `loading` y error con mensajes amigables.

- **Resumen numérico implementado**: tarjetas para usuarios totales, activos (7 días) y bodas totales/activas, con filtros interactivos; se añaden descargas acumuladas de la app (30 días) y split por plataforma cuando se habilita el toggle `Mostrar desglose`.
  - Filtro de usuarios por rol (`owner`, `wedding planner`, `assistant`) para ver el volumen del segmento seleccionado.
  - Filtro de bodas por presencia de planner asignado (con planner / sin planner), mostrando el conteo asociado.
- **Adquisición y retención**: nuevas tarjetas con conversión owners→planner, bodas por planner, share de bodas con/ sin planner, porcentaje de bodas activas y velocidad de activación (tiempo descarga → registro → primera acción clave) usando `userStats`, `weddingStats` y `activationMetrics`.
  - Métrica adicional: descargas app → cuentas creadas (ratio `appDownloads.conversions`) con filtro por origen (`organic`, `ads`, `qr`) y objetivo semanal configurado en `adminTargets`.
  - Calidad de adquisición: coste por adquisición efectiva (`acquisitionQuality.cpaEffective`) y desinstalaciones 7/30 días (`acquisitionQuality.uninstalls`) segmentadas por campaña para detectar fugas tempranas.

- **Paneles sugeridos adicionales (detalle)**:
  - **Adquisición y funnel**:
    - Conversión owners→planner = planners activos / owners activos en el periodo. Fuente: colección users (rol) + adminAuditLogs (eventos ROLE_UPGRADE). Visual: barra semanal con filtro por canal de captación (utm/source). Alerta si cae >20 % vs media 4 semanas.
    - Invitaciones a planners aceptadas = planners enlazados / invitaciones emitidas. Fuente: weddings (plannerIds) + invitaciones. Visual: donut por estado (accept/reject/pending).
    - Tiempo medio hasta primera boda creada tras registro. Fuente: timestamps users.createdAt y weddings.createdAt. Visual: boxplot por cohorte mensual.
    - Descargas app por plataforma/origen y ratio de activación (descarga → registro → boda creada). Fuente: `appDownloadEvents` + `adminMetrics.series`. Visual: funnel stacked con selector por semana.
    - Velocidad de activación: mediana y percentiles p75/p90 del tiempo descarga → registro → onboarding completo (`activationMetrics.timeToActivation`). Visual: gráfico de violín por cohorte semanal con umbral objetivo.
  - **Calidad de adquisición**:
    - Coste por adquisición efectiva y coste por activación (`acquisitionQuality.cpaEffective`, `acquisitionQuality.cpaActivation`). Fuente: marketing spend (BigQuery `marketing_spend.daily`) + `appDownloadEvents`. Visual: tarjetas KPI con delta vs objetivo.
    - Retención D1/D7/D30 por campaña/plataforma. Fuente: `acquisitionQuality.retention`. Visual: matriz heatmap con resaltado de bajo desempeño.
    - Tasa de desinstalación temprana (<= 7 días) y ratio de usuarios que completan onboarding tras reinstalar. Fuente: `mobileAnalytics.uninstalls`. Visual: línea 30d + alertas cuando supera umbral.
  - **Engagement y uso de funcionalidades**:
    - Usuarios activos por cohorte y rol (owner/planner/assistant). Fuente: adminMetrics.series + eventos de actividad. Visual: heatmap semanal.
    - Adopción de funcionalidades (checklist, presupuesto, automatizaciones, inbox). Métrica: % bodas que usan cada feature. Fuente: colecciones específicas (tasks, budgets, automations). Visual: barras comparativas + tendencia.
    - Sesiones semanales por planner vs número de bodas gestionadas. Fuente: analytics internas (session logs). Visual: scatter plot con burbuja por bodas.
    - Engagement de funcionalidades móviles: frecuencia de uso y stickiness (DAU/MAU) para checklist, timeline y chat (`featureEngagement.mobileFeatures`). Visual: gráfico radar + tabla top/bajo uso.
  - **Retención y riesgo**:
    - Churn de planners/owners (downgrade o baja) con motivo. Fuente: pagos/subscripciones + adminAuditLogs. Visual: línea mensual + tabla motivos.
    - Bodas en riesgo: sin actividad > X días, tareas críticas vencidas o confirmación invitados < umbral. Fuente: weddings + tasks + guest confirmations. Visual: listado filtrable con score y CTA para notificar.
    - Cohortes de reactivación (usuarios que vuelven tras >30 días inactivos). Fuente: login logs. Visual: tabla cohortes vs % reactivados.
  - **Finanzas y suscripciones**:
    - MRR/ARR por plan y país. Fuente: Stripe/PayPal + colecciones billing. Visual: stacked area y tabla detalle.
    - Upgrades/downgrades netos (delta de suscripciones). Fuente: subscriptions history. Alerta si downgrades superan upgrades 3 semanas seguidas.
    - Ingresos estimados por planner (bodas facturadas bajo su gestión). Fuente: weddings.billing + planners. Visual: ranking con barra y variación.
    - Coste IA por usuario/boda (tokens consumidos * tarifa). Fuente: logs IA (OpenAI). Visual: línea 30d + top consumidores.
  - **Soporte y calidad**:
    - SLA real vs objetivo por severidad. Fuente: adminSupportSummary + tickets. Visual: gauge y tabla.
    - Backlog por severidad y antigüedad. Visual: gráfico stacked + alerta cuando tickets críticos > N horas.
    - Tickets por planner/owner con clasificación por motivo (tagging). Fuente: soporte. Visual: tabla sortable + heatmap motivos.
  - **Automatizaciones y campañas**:
    - Rendimiento de emails/WhatsApp automáticos: envíos, aperturas, clics, respuestas. Fuente: emailMetrics, whatsappMetrics. Visual: barras apiladas + tasa conversión.
    - Conversiones atribuibles a broadcast (ingresos, alta en features). Fuente: adminBroadcasts + analytics. Visual: funnel por campaña.
    - Jobs programados con fallos/reintentos consecutivos. Fuente: adminTasks/automation logs. Alerta cuando reintentos > 3.
  - **Contenido e IA**:
    - Uso de plantillas (email, IA, documentos): número de ejecuciones, equipos que las consumen. Fuente: adminTemplates usage logs. Visual: ranking + sparkline.
    - Feedback/NPS por plantilla (botón de valoración). Fuente: feedback collection. Visual: tabla con promedio y distribución.
    - Prompts bloqueados o con riesgo (PII/toxicidad). Fuente: filtros IA. Visual: serie temporal + listado para revisión.
  - **Infraestructura y salud técnica**:
    - Percentiles (p50/p95/p99) de latencia backend por endpoint. Fuente: APM (Datadog/New Relic). Visual: línea comparando releases.
    - Error rate por servicio externo (Mailgun, WhatsApp, Stripe, OpenAI). Visual: gráfico multi-serie + alertas umbral.
    - Estado de despliegues/tests: último pipeline, suites pasadas/fallidas, feature flags habilitados por entorno. Visual: panel resumen con enlaces.
    - Alertas técnicas unificadas: consolida `AdminHealth.jsx` (métricas vía `VITE_METRICS_ENDPOINT`), errores móviles (Crashlytics/Sentry) y logs de frontend (`adminMetrics.errorSeries`). Visual: feed cronológico con severidad, enlace a run/pipeline y CTA para crear ticket; notifica cuando alguna métrica supera umbrales definidos en `adminThresholds`.


### 2.3 Portfolio (`/admin/portfolio`, `src/pages/admin/AdminPortfolio.jsx`)
- Tabla con columnas: Pareja, Owner, Fecha evento, Estado, Confirmados, Contratos.
- Filtros remotos: estado (`status=draft|active|archived`), rango de fechas (`fromDate`, `toDate`) y orden (`order=asc|desc`). El botón "Aplicar" vuelve a consultar al backend usando esos parámetros y trae todas las bodas que cumplen los criterios.
- Modal "Ver detalle" con resumen básico y CTA "Exportar PDF" (placeholder, sin implementación).
- Fuente en backend: `/api/admin/dashboard/portfolio` consulta `weddings` ordenando por `eventDate` y devolviendo metadatos (`meta.status`, `meta.fromDate`, etc.). El frontend usa `getPortfolioData` para obtener `{ items, meta }`.

### 2.4 Usuarios (`/admin/users`, `src/pages/admin/AdminUsers.jsx`)
- **Tab "Listado"**: tabla `Email`, `Rol`, `Estado`, `Último acceso`, `Bodas activas`, `Alta`. Botón "Suspender" abre modal que exige motivo; `Confirmar` solo actualiza el estado en memoria (`status = 'disabled'`), no hay petición al backend todavía.
- **Tab "Roles reales"**: tarjetas Owner / Wedding planner / Assistant con totales, reales y excluidos (por estado, flags, email). Datos desde `getUsersRoleSummary()`:
  - Muestra fuente (`summary.source`: `firestore`, `fallback`, `empty`).
  - Si hubo error (`result.error`) se avisa (p.ej. "Firestore no está disponible…").
  - Botón "Actualizar" fuerza un nuevo fetch.
- `getUsersData()` recupera hasta 100 usuarios (`/api/admin/dashboard/users`).

### 2.5 Broadcast (`/admin/broadcast`, `src/pages/admin/AdminBroadcast.jsx`)
- Tabs "Email" y "Push" (idénticos visualmente; el tipo se envía como `type` al crear broadcast).
- Formulario: asunto, contenido, segmento (Todos / Solo planners / Solo owners / custom), programación opcional (fecha/hora).
- Acciones:
  - `Confirmar envío` → `createBroadcast({ type, subject, content, segment, scheduledAt? })`. Tras éxito limpia el formulario y antepone el ítem devuelto a `history`.
- Histórico (tabla con asunto, segmento, programado, estado) via `getBroadcastData()`.


### 2.6 Comerciales (`/admin/commerce`, `src/pages/admin/AdminDiscounts.jsx`)
- Resumen numérico con total de enlaces, usos acumulados y facturación agregada.
- Métricas agregadas de comisiones: tarjeta destacando `comisión total generada`, `media por enlace` y `enlaces sin reglas` para detectar huecos en la configuración comercial (los tres valores llegan en la respuesta de `GET /api/admin/dashboard/discounts` bajo `summary.commission`).
- Filtros interactivos por estado (activo/agotado/caducado) y buscador por código, URL o responsable.
- Tabla con columnas Código, URL (copiable), Asignado a (nombre + tipo), Estado, Usos, Facturación, Creado, Último uso.
- Datos desde `GET /api/admin/dashboard/discounts` (`discountLinks` en Firestore); si no hay datos se muestran ejemplos demo.

### 2.7 Reportes (`/admin/reports`, `src/pages/admin/AdminReports.jsx`)
- Tabla de reportes programados (nombre, cadencia, destinatarios, formato, estado) proveniente de `getReportsData()`.
- Botón "Generar informe" (placeholder, sin handler).
- Formulario "Generar informe on-demand": selección de plantilla (global/portfolio/ia/email) y destinatarios. Botón "Enviar" aún no llama a ninguna API (pendiente implementar).


### 2.7bis Comerciales (pendiente)
- Panel dedicado a descuentos/comerciales:
  - Listado de enlaces de descuento (código, URL firmada, fecha de creación, estado, vigencia).
  - Columna “Asignado a” (planner, influencer o partner responsable).
  - Métricas por enlace: facturación generada, número de usos, conversiones y LTV asociado.
  - Filtros por estado (activo/agotado/caducado) y tipo de campaña.

### 2.8 Plantillas de tareas (`/admin/task-templates`, `src/pages/admin/AdminTaskTemplates.jsx`)
- Vista dedicada a gestionar el seed de tareas padre/subtareas aplicado a cada boda nueva.
- `GET /api/admin/dashboard/task-templates?status=` carga listado de versiones (publicadas y borradores) con metadatos (`id`, `version`, `status`, `updatedBy`, `updatedAt`, `notes`, `totalBlocks`).
- Editor principal: árbol drag & drop (`TemplateTaskTree`) con edición inline de campos soportados (título, descripción, categoría, etiquetas, responsable sugerido, lead time relativo, dependencias, checklist interna). Permite añadir subtareas ilimitadas por nodo.
- Panel lateral de acciones:
  - **Guardar como borrador** → `saveTaskTemplateDraft(payload)` (`POST /api/admin/dashboard/task-templates`), validando contra `taskTemplateSchema`.
  - **Publicar versión** → `publishTaskTemplate(versionId)` (`POST /api/admin/dashboard/task-templates/:id/publish`), marca la versión como `published` y archiva la anterior.
  - **Vista previa** → `previewTaskTemplate(versionId, sampleWedding)` (`POST /api/admin/dashboard/task-templates/:id/preview`) para inspeccionar el resultado aplicado a una boda ficticia (devuelve JSON y permite descargarlo).
- Historial de cambios con diff entre versión seleccionada y la vigente (usa `TemplateDiffModal`); incluye filtro por autor y notas de release.
- Importar/Exportar: botones para cargar JSON externo (con validación y reporte de errores) y descargar la versión seleccionada. Se rechazan uploads que rompen el esquema o añaden ciclos de dependencias.
- Auditoría: panel inferior lista últimos `adminAuditLogs` con `action` `ADMIN_TASK_TEMPLATE_SAVE` / `ADMIN_TASK_TEMPLATE_PUBLISH`.
- Tras publicar o importar, se invalidan caches (`invalidateWeddingTemplates`) y se lanza aviso a los equipos relevantes mediante broadcast interno.
  - Acciones previstas: copiar enlace, revocar, reemitir, exportar CSV.

### 2.7 Integraciones (`/admin/integrations`, `src/pages/admin/AdminIntegrations.jsx`)
- Tarjetas por servicio (`services`): estado, latencia, incidentes 30d y botón "Reintentar conexión".
- Modal de confirmación `Reintentar` que llama a `retryIntegration(id)` y actualiza el servicio en memoria si hay respuesta.
- Tabla de incidentes (`incidents`) con servicio, inicio, duración, impacto, acción tomada, resuelto por.
- Fuentes: `getIntegrationsData()` (`/api/admin/dashboard/integrations`).

### 2.8 Alertas (`/admin/alerts`, `src/pages/admin/AdminAlerts.jsx`)
- Lista lateral con módulo, severidad (Crítica/Alta/Media) y timestamp.
- Panel derecho con detalle de la alerta seleccionada.
- Botón "Marcar resuelta" en lista o detalle → abre modal para añadir nota y ejecuta `resolveAdminAlert(id, notes)`.

### 2.9 Configuración global (`/admin/settings`, `src/pages/admin/AdminSettings.jsx`)
- **Feature flags**: listado con nombre/descrición, botón que abre modal de confirmación y, al aceptar, llama a `updateFeatureFlag(id, !enabled)`.
- **Rotación de secretos**: muestra nombre y última rotación. Botón "Rotar" abre modal guiado (3 pasos simulados) y finaliza invocando `rotateSecret(id)`.
- **Plantillas globales**: selector de plantilla + editor simple + vista previa texto y botón "Guardar cambios" (`saveTemplate(id, content)`).

### 2.10 Soporte (`/admin/support`, `src/pages/admin/AdminSupport.jsx`)
- KPIs: tickets abiertos, pendientes, resueltos, SLA medio.
- Tarjeta NPS (placeholder: muestra valor o `—`).
- Lista de tickets a la izquierda y detalle a la derecha (solicitante, estado, última actualización, bloque para conversación).
- Datos via `getSupportData()` (`summary` + `tickets`).

## 3. Servicios y endpoints consumidos (`backend/routes/admin-dashboard.js`)

| Endpoint | Uso en frontend | Notas principales |
|----------|-----------------|-------------------|
| `GET /api/admin/dashboard/overview` | Dashboard (KPIs, servicios, alertas, tendencias) | Lee Firestore (`adminMetrics`, `adminServiceStatus`, `adminAlerts`). Si no hay datos genera defaults. Incluye agregador `newTasks` con las tareas creadas manualmente por usuarios en las últimas dos semanas.
| `GET /api/admin/dashboard/metrics` | Página Métricas | Intenta `adminMetrics` (retorna `series`, `funnel`, `appDownloads`, `activationMetrics`, `acquisitionQuality`, `featureEngagement`, `iaCosts`, `communications`, `supportMetrics`). Fallback `computeRealtimeMetrics`; si todo falla envía arrays vacíos.
| `GET /api/admin/dashboard/task-templates` | Plantillas tareas | Lista versiones (`draft/published`) incluyendo bloques, subtareas y metadatos. Soporta `status`, `version`, `limit`.
| `POST /api/admin/dashboard/task-templates` | Plantillas tareas | Guarda un borrador validado contra `taskTemplateSchema`. Audita `ADMIN_TASK_TEMPLATE_SAVE`.
| `POST /api/admin/dashboard/task-templates/:id/publish` | Plantillas tareas | Marca versión como publicada y archiva las previas; audita `ADMIN_TASK_TEMPLATE_PUBLISH`.
| `POST /api/admin/dashboard/task-templates/:id/preview` | Plantillas tareas | Genera previsualización expandida sin persistir (se usa en modal “Vista previa”).
| `GET /api/admin/dashboard/portfolio?limit=&status=&fromDate=&toDate=&order=` | Portfolio | Consulta `weddings` aplicando filtros por estado y rango de fechas (`eventDate`); devuelve las bodas ordenadas (por defecto `eventDate desc`) junto con metadatos (`meta.status`, `meta.fromDate`, etc.).
| `GET /api/admin/dashboard/users?limit=` | Usuarios listado | Lee colección `users`. Fallback: un owner demo.
| `GET /api/admin/dashboard/users/role-summary` | Usuarios → Roles reales | Recorre `users` (select parcial). Si falla Firestore, devuelve buckets vacíos con `source: 'fallback'` y `error` explicando el motivo.
| `POST /api/admin/dashboard/tasks` / `PATCH /api/admin/dashboard/tasks/:id` | Dashboard tareas | Crea/actualiza docs en `adminTasks` y registra auditoría (`ADMIN_TASK_CREATE` / `ADMIN_TASK_UPDATE`).
| `POST /api/admin/dashboard/alerts/:id/resolve` | Alertas | Marca alerta resuelta (set `resolved`, `resolvedAt`, `resolvedBy`).
| `GET /api/admin/dashboard/integrations` + `POST /api/admin/dashboard/integrations/:id/retry` | Integraciones | Lee `adminServiceStatus` y `adminIncidents`. `retry` actualiza servicio y audita `ADMIN_INTEGRATION_RETRY`.
| `GET /api/admin/dashboard/settings` | Configuración | Devuelve `featureFlags`, `adminSecrets`, `adminTemplates`.
| `PATCH /api/admin/dashboard/settings/flags/:id` | Toggle feature flag | Actualiza doc y audita `ADMIN_FLAG_UPDATE`.
| `POST /api/admin/dashboard/settings/secrets/:id/rotate` | Rotar secreto | Marca `lastRotatedAt` y `rotatedBy`.
| `PUT /api/admin/dashboard/settings/templates/:id` | Guardar plantilla | Actualiza contenido + `updatedAt`.
| `GET /api/admin/dashboard/broadcasts` / `POST /api/admin/dashboard/broadcasts` | Broadcast | Lista envíos (`adminBroadcasts`), crea nuevo (estado `Pendiente`) y audita `ADMIN_BROADCAST_CREATE`.
| `GET /api/admin/dashboard/discounts` | Comerciales | Devuelve enlaces de descuento con métricas agregadas (total enlaces, usos, facturación) y resumen de comisiones (total, media por enlace y enlaces sin reglas configuradas). |
| `GET /api/admin/dashboard/reports` | Reportes | Lee `adminReports` (si vacío seed demo).
| `GET /api/admin/dashboard/audit` | Auditoría | Devuelve registros de `adminAuditLogs` (ordenados por `createdAt`).
| `GET /api/admin/dashboard/support` | Soporte | Resume `adminSupportSummary` + tickets (`adminTickets`).

Otros endpoints admin (fuera de `admin-dashboard.js`):
- `POST /api/admin/auth/login`, `POST /api/admin/auth/login/mfa`, `POST /api/admin/auth/logout` (`backend/routes/admin-auth.js`).
- `POST /api/admin/audit` para registrar eventos arbitrarios (`backend/routes/admin-audit.js`).

## 4. Servicios front (`src/services/adminDataService.js`)
- Funciones de lectura `getDashboardData`, `getMetricsData`, `getPortfolioData`, `getUsersData`, `getUsersRoleSummary`, `getIntegrationsData`, `getSettingsData`, `getAlertsData`, `getBroadcastData`, `getAuditLogs`, `getReportsData`, `getSupportData`, `getTaskTemplates`.
- `getMetricsData` mapea los campos `appDownloads.*`, `activationMetrics.*`, `acquisitionQuality.*` y `featureEngagement.*` a tarjetas y gráficos (`AppDownloadsCard`, `ActivationSpeedKPI`, `AcquisitionQualityBoard`, `FeatureEngagementRadar`).
- `getTaskTemplates`, `saveTaskTemplateDraft`, `publishTaskTemplate`, `previewTaskTemplate` gestionan el editor de plantillas; cachean la última carga y exponen `invalidateWeddingTemplates()` para forzar refresh tras publicar.
- Mutaciones centralizadas: `createAdminTask`, `updateAdminTask`, `resolveAdminAlert`, `updateFeatureFlag`, `rotateSecret`, `saveTemplate`, `createBroadcast`, `retryIntegration`, `saveTaskTemplateDraft`, `publishTaskTemplate`.
- Uso de `getAdminFetchOptions({ auth: false })`: la sesión admin se gestiona en `adminSession.js` (token guardado en storage); si hay token añade cabeceras personalizadas.
- Manejo de errores: loggea con `errorLogger` y retorna defaults vacíos para que la UI no falle.

## 5. Limitaciones y observaciones actuales
- Varios botones son placeholders sin API (e.g., "Generar informe", export CSV/JSON en auditoría, conversación soporte, botón "Ver detalle" en alertas, `Exportar PDF` en Portfolio, tab Push comparte mismo formulario que Email).
- Suspensión de usuarios sólo cambia el estado en memoria; no hay llamada real al backend (ni auditoría `USER_SUSPEND`).
- Módulo soporte muestra valores fijos (`NPS actual: placeholder`).
- Muchos datasets dependen de seeds demo (si Firestore no tiene datos reales, el backend genera elementos ficticios para mantener la UI funcional).
- El componente `AdminHealth.jsx` existe (métricas de errores vía `VITE_METRICS_ENDPOINT`) pero no está enroutado actualmente; se prevé incorporarlo en la vista “Alertas técnicas” para centralizar incidentes backend/mobile.
- Las credenciales de servicio (`FIREBASE_SERVICE_ACCOUNT_JSON` o `GOOGLE_APPLICATION_CREDENTIALS`) son necesarias para que los contadores reales funcionen; sin ellas la mayoría de vistas muestran datos de demostración.
- El seed local `src/data/tasks/masterTimelineTemplate.json` se mantiene como fallback para entornos sin backend; la creación de bodas en producción debe usar siempre la versión publicada en `adminTaskTemplates`.

## 6. Cobertura QA existente
- Cypress: `cypress/e2e/admin/admin-flow.cy.js` recorre login y flujos básicos (dashboard, filtros, verificación de roles).
- No hay suites dedicadas a cada módulo aún; muchos controles dependen de datos de ejemplo.

---
Para ampliar o priorizar mejoras, revisar la hoja de ruta y pendientes originales (`docs/flujos-especificos/flujo-0-administracion-global.md` apunta al dossier) y contrastar con los gaps listados en el punto 5.


