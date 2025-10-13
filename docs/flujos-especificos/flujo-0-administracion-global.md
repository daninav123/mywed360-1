# 0. Administración Global (estado 2025-10-08)

> Implementado: documentación funcional cerrada; implementación técnica pendiente.
> Alcance: rol `admin` único con acceso exclusivo a métricas y configuración global del proyecto. El login se realiza en `/admin/login`; cualquier intento desde `/login` con credenciales admin redirige automáticamente al dashboard global.

## 1. Objetivo y alcance
- Supervisar toda la actividad de Lovenda (usuarios, bodas, finanzas, IA, comunicaciones) desde una consola centralizada.
- Ejecutar tareas de auditoría, soporte y configuración global (feature flags, plantillas, integraciones).
- Monitorizar la salud de servicios internos y externos, reaccionando a alertas críticas.
- Emitir comunicaciones masivas controladas y mantener trazabilidad completa de acciones administrativas.

## 2. Trigger y rutas
- `/admin/login` (`AdminLogin.jsx`)
  - Campos:
    - `email`: placeholder `admin@lovenda.com`, validación dominio (`VITE_ADMIN_ALLOWED_DOMAINS`), mensajes "Introduce un email válido" / "Dominio no autorizado".
    - `password`: placeholder `Contraseña`, mínimo 10 caracteres, botón mostrar/ocultar, mensaje "La contraseña debe tener al menos 10 caracteres".
  - Controles: checkbox "Recordar sesión" (solo si MFA completado), botón primario `Acceder` (disabled hasta inputs válidos), enlace `¿Problemas para entrar?` que abre modal con email/teléfono de soporte.
  - Errores: credenciales incorrectas ? banner rojo "Email o contraseña no válidos"; usuario sin rol admin ? banner "Tu cuenta no dispone de acceso administrador" + registro en `adminAuditLogs` (`action: ADMIN_ACCESS_DENIED`).
  - Seguridad: máximo 5 intentos fallidos por hora ? bloqueo temporal 15 minutos + email automático al soporte.
- `/admin/dashboard` (`AdminDashboard.jsx`).
- Subrutas protegidas (siempre dentro de `AdminLayout` + `RequireAdmin`): `/admin/metrics`, `/admin/portfolio`, `/admin/users`, `/admin/integrations`, `/admin/settings`, `/admin/alerts`, `/admin/broadcast`, `/admin/audit`, `/admin/reports`, `/admin/support`.
- `AdminLayout` incluye header con breadcrumbs (`Administración / Métricas`), botón `Cerrar sesión`, indicador "Última actualización HH:MM:SS" (refresco cada 60?s) y botón `Ayuda`; sidebar con secciones "Panel", "Operaciones", "Analítica", "Infraestructura", "Configuración"; footer con versión `vX.Y.Z` y enlace a políticas de seguridad.

## 3. Paso a paso UX
1. **AdminLogin.jsx**
   - Flujo: submit ? spinner ? `useAuth().loginAdmin` ? si MFA habilitado, diálogo OTP (6 dígitos, válido 60?s). Error OTP ? banner "Código inválido" y decremento del contador. Tras éxito: redirección a `/admin/dashboard` y escritura de `lastAdminLogin` en `adminAuditLogs`.
2. **AdminDashboard.jsx**
   - Fila 1 (KPIs principales, 4 tarjetas 25?% ancho):
     - `Usuarios activos (7 días)` (valor entero, variación vs semana anterior, icono `Users`, badge verde #16A34A si =0, rojo #DC2626 si <0).
     - `Bodas creadas (30 días)` (total, comparativa %, icono `Heart`, tooltip "Incluye bodas en estado active").
     - `Conversión signup?boda` (porcentaje, sparkline últimos 8 días, tooltip explicativo).
     - `Ingresos estimados (30 días)` (moneda ES, subtexto "Incluye pagos confirmados").
   - Fila 2 (salud servicios: Firebase, Mailgun, WhatsApp, OpenAI): estado (Operativo/Degradado/Caído), latencia media, incidentes 30?d, botón `Ver detalles` ? `/admin/integrations#{service}`.
   - Fila 3 (alertas y tareas): lista `Alertas críticas` (máx 5, severidad, módulo, mensaje, timestamp relativo, botones `Ver`, `Marcar resuelta` con modal para comentario) y checklist `Tareas admin` (items drag&drop guardados en `adminTasks` con acciones Añadir/Completar/Eliminar).
   - Header adicional: botón `Generar informe PDF` (snapshot), toggle `Modo mantenimiento` (confirmación doble y comentario obligatorio).
   - Mobile (<768?px): tarjetas apiladas, alertas en acordeón, botón flotante para tareas.
3. **Módulos secundarios**
   - `AdminMetrics.jsx`: gráficos 7/30/90 días, date picker personalizado, funnel (Visitantes ? Registrados ? Bodas activas), tarjeta "Coste IA" (proveedor, prompts, coste ), botones `Exportar CSV/JSON` y `Abrir en BigQuery`.
   - `AdminPortfolio.jsx`: tabla paginada (50 filas) con columnas Pareja, Owner, Fecha evento, Estado, Invitados confirmados, Contratos firmados, Último cambio; filtros por estado y fechas; búsqueda owner/email; acciones `Ver detalle` (modal con tabs), `Destacar`, `Generar PDF`.
   - `AdminUsers.jsx`: tabla con Email, Rol, Estado, Último acceso, Bodas activas, Fecha alta; filtros rápidos; drawer con Perfil, Actividad, Auditoría; acciones `Suspender` (motivo obligatorio), `Reactivar`, `Reset contraseña`, `Forzar verificación`.
   - `AdminIntegrations.jsx`: tarjetas por servicio con estado, consumo actual, límite, botón `Reintentar conexión`; tabla incidentes (Fecha inicio, Duración, Impacto, Acciones, Resuelto por, exportable CSV).
   - `AdminSettings.jsx`: secciones Feature Flags (toggle + descripción + owner), Claves/Secretos (nombre, última rotación, botón `Rotar` con wizard), Plantillas globales (editor Markdown + vista previa + historial), Parámetros de sistema (limites, mantenimiento programado).
   - `AdminAlerts.jsx`: timeline con filtros severidad/módulo/fecha, acciones `Ver detalle` y `Marcar resuelta` (campo acciones tomadas), severidad codificada: Crítica (rojo), Alta (ámbar), Media (azul).
   - `AdminBroadcast.jsx`: tabs Email/Push, campos asunto/contenido/segmentación/programación, botones `Enviar prueba`, `Enviar` (confirmación doble), histórico con estado, tasas de apertura/click.
   - `AdminAudit.jsx`: tabla filtrable por acción, recurso, actor, fechas; columnas Fecha, Actor, Acción, Recurso, Payload (JSON expandible); exportadores CSV/JSON.
   - `AdminReports.jsx`: reportes programados (Diario/Semanal/Mensual) con campos tipo, destinatarios, formato, estado; botón `Generar informe` (wizard con plantilla y destinatarios).
   - `AdminSupport.jsx`: panel de tickets (API soporte), KPIs SLA, tabla tickets abiertos/pending/resueltos; gráfico NPS mensual, comentarios recientes.
4. **Acciones globales**: botones permanentes `Crear bandera`, `Exportar métricas`, `Modo mantenimiento`; panel lateral `Tareas admin` persistente; modal de broadcast accesible mediante botón flotante.

## 4. Persistencia y datos
### 4.1 Esquema de almacenamiento
| Recurso | Tipo | Campos clave | Uso/Notas |
|---------|------|--------------|-----------|
| `adminMetrics/{date}` | Firestore (doc diario) | `activeUsers7d`, `newWeddings30d`, `conversionRate`, `estimatedRevenue`, `servicesHealth[]`, `funnel`, `aiCosts`, `communications`, `supportMetrics` | Fuente única de KPIs del dashboard. La clave `date` es `YYYY-MM-DD`. |
| `adminMetricsSummary/{quarter}` | Firestore (doc trimestral) | `growthRate`, `targets`, `notes`, `owner` | Consolida objetivos estratégicos para reportes ejecutivos. |
| `adminTasks/{taskId}` | Firestore | `title`, `description`, `priority`, `dueDate`, `completed`, `createdAt`, `updatedAt`, `owner` | Persistencia del checklist operativo. |
| `adminAlerts/{id}` | Firestore | `severity`, `source`, `message`, `status`, `createdAt`, `resolvedAt`, `actionTaken`, `linkedResources[]` | Se alimenta desde workers y servicios externos. |
| `adminBroadcasts/{id}` | Firestore | `type`, `segment`, `subject`, `content`, `scheduledAt`, `status`, `stats.opens`, `stats.clicks`, `stats.failures`, `attachments[]` | Historial completo de comunicaciones masivas. |
| `adminAuditLogs/{id}` | Firestore (colección particionada por mes) | `actorId`, `action`, `resourceType`, `resourceId`, `payload`, `createdAt`, `ip`, `userAgent`, `outcome` | Base de auditoría obligatoria; TTL 395 días salvo retención legal. |
| `featureFlags/{flagId}` | Firestore | `name`, `description`, `domain`, `environment`, `enabled`, `lastModifiedBy`, `lastModifiedAt`, `rolloutStrategy`, `auditRef` | Control centralizado de banderas y cambios. |
| `globalConfigs/{configId}` | Firestore | `value`, `description`, `owner`, `lastModifiedAt`, `lastModifiedBy`, `status` | Parámetros sistémicos (límites, ventanas de mantenimiento). |
| `adminReportsQueue/{id}` | Firestore (cola) | `reportType`, `status`, `requestedAt`, `requestedBy`, `payload`, `expiresAt` | Orquesta generación/exportación de informes. |
| `adminSnapshots/{id}` | Cloud Storage (`gs://lovenda-admin-snapshots`) | Archivo PDF/CSV, `metadata` (fecha, hash, tipo, generador) | Resultado de exportes manuales/automáticos. |
| `admin_reports.daily_metrics` | BigQuery | `date`, `metric`, `value`, `source`, `ingestedAt` | Alimenta dashboards externos y comparativas históricas. |
| `admin_reports.incident_log` | BigQuery | `id`, `service`, `severity`, `startedAt`, `duration`, `impact`, `resolvedBy` | Registro analítico de incidencias. |
| `admin_reports.ai_costs` | BigQuery | `date`, `provider`, `tokens`, `cost`, `module`, `traceId` | Coste IA consolidado. |

### 4.2 Retención, seeds y replicación
- `adminAuditLogs` y `adminAlerts` rotan mensualmente (colecciones `YYYY-MM`); un job semanal purga entries `status === 'resolved'` con más de 180 días, salvo que `keepForCompliance === true`.
- Seeds iniciales (`scripts/seedAdminData.ts`): crea usuario admin, tasks de onboarding, métricas dummy (últimos 30 días) y toggle `maintenanceWindow` en falso.
- Replicación BigQuery: `calculateAdminMetrics` genera documento diario y exporta a `admin_reports.daily_metrics`; `syncExternalKPIs` guarda snapshots de servicios externos y dispara `BigQueryLoadJob`.
- Backups automáticos: `gcloud firestore export` diario (retención 14 días) + `Storage Transfer` semanal hacia bucket frío.

### 4.3 Endpoints, workers y cron jobs
| Método | Ruta / Job | Responsable | Entrada/Salida | Observaciones |
|--------|------------|-------------|----------------|---------------|
| `POST` | `/api/admin/login` | `adminAuthController` | Credenciales (`email`, `password`, `otp?`) → JWT admin + refresh | Requiere `X-Admin-Client` y verificación MFA si flag `requireMfa` activo. |
| `POST` | `/api/admin/login/mfa` | `adminAuthController` | `otp`, `challengeId` → token definitivo | Expira en 60 segundos. |
| `POST` | `/api/admin/logout` | `adminAuthController` | Refresh token → 204 | Revoca sesión y registra `ADMIN_LOGOUT`. |
| `GET`  | `/api/admin/dashboard` | `adminDashboardController` | Query params `range`, `includeHealth` → métricas consolidada | Cache 60s (Redis opcional). |
| `GET`  | `/api/admin/alerts` | `adminAlertsController` | Filtros `status`, `severity`, `since` → lista paginada | Incluye cursor `nextPageToken`. |
| `PATCH`| `/api/admin/alerts/:id` | `adminAlertsController` | `status`, `actionTaken` → alerta actualizada | Registra auditoría. |
| `POST` | `/api/admin/tasks` | `adminTasksController` | `title`, `priority`, `dueDate`, `owner` → task | Valida duplicados por título. |
| `PATCH`| `/api/admin/tasks/:id` | `adminTasksController` | `completed`, `notes` → task | Emite evento `ADMIN_TASK_UPDATED`. |
| `POST` | `/api/admin/broadcasts` | `adminBroadcastController` | `type`, `segment`, `subject`, `content`, `scheduledAt?` → broadcast registrado | Exige `dryRunId` previo. |
| `POST` | `/api/admin/broadcasts/:id/send` | `adminBroadcastController` | `id` → job en cola | Usa Cloud Tasks con retroff 30s. |
| `GET`  | `/api/admin/users` | `adminUsersController` | Filtros `role`, `status`, `search` → tabla | Protegido por `requireScope('admin:users:read')`. |
| `PATCH`| `/api/admin/users/:id` | `adminUsersController` | `action` (`suspend`, `reactivate`, `forceVerify`) → confirmación | Solicita motivo obligatorio. |
| `POST` | `/api/admin/reports` | `adminReportsController` | `reportType`, `format`, `range`, `recipients[]` → `adminReportsQueue` | Devuelve `trackingId`. |
| `GET`  | `/api/admin/settings` | `adminSettingsController` | — → flags, configs, credenciales mask | Cache 5 min. |
| `PATCH`| `/api/admin/settings/flags/:id` | `adminSettingsController` | `enabled`, `rolloutStrategy`, `comment` → flag | Auditoría + email confirmación. |
| `PATCH`| `/api/admin/settings/secrets/:id/rotate` | `adminSettingsController` | `comment`, `notifySecurity` → job de rotación | Requiere doble confirmación. |
| `Cloud Function` | `calculateAdminMetrics` (cron 1h) | Backend | — → doc Firestore + export BQ | Se ejecuta bajo servicio `admin-metrics-runner`. |
| `Cloud Function` | `syncExternalKPIs` (cron 5 min) | Backend | — → actualiza `servicesHealth` y alerta si degradado | Usa integraciones Firebase, Mailgun, WhatsApp, OpenAI. |
| `Cloud Function` | `generatePdfReport` (Cloud Tasks) | Backend | `reportType`, `payload` → PDF en Storage | Retrys exponenciales, timeout 2 min. |
| `Cloud Function` | `adminBroadcastHandler` (Cloud Tasks) | Backend | Broadcast programado → envíos Mailgun/FCM/WhatsApp | Segmentación cruzada con CRM. |
| `Cloud Function` | `logAdminAction` (callable) | Backend | `action`, `resource`, `payload` → `adminAuditLogs` | Usada por front y backend. |
| `Cloud Function` | `notifyServiceOutage` (Pub/Sub) | Backend | Evento `service.status` → alerta crítica | Integra con Slack/Email soporte. |

- Servicios auxiliares: `adminMetricsService`, `adminAlertsService`, `adminBroadcastService`, `adminSettingsService`, `adminReportsService` (frontend) consumen los endpoints anteriores mediante `adminApiClient` con `Authorization: Bearer <adminJWT>`.

## 5. Reglas de negocio
### 5.1 Acceso y sesiones
- Solo `role === 'admin'` y `claims.admin === true` pueden acceder a `/admin/**`. El middleware `RequireAdmin` comprueba ambos valores y revoca el token al primer fallo.
- Login admin detectado en `/login` redirige a `/admin/dashboard` tras refrescar claims; usuarios no admin reciben mensaje y auditoría `ADMIN_ACCESS_DENIED`.
- Sesión admin expira a los 60 minutos de inactividad (`maxAge` 3600s) y fuerza reautenticación MFA si han pasado más de 12 horas desde el último desafío.
- Cada inicio de sesión exitoso anota `lastAdminLogin` en Firestore y envía notificación opcional por email a seguridad.

### 5.2 Operación diaria
- Todas las acciones que modifican recursos (usuarios, bodas, flags, alertas, tasks, broadcast) registran evento en `adminAuditLogs` con `outcome` (`SUCCESS`, `ABORTED`, `FAILED`).
- Acciones sensibles (`suspender usuario`, `activar mantenimiento`, `rotar secreto`) requieren confirmación doble y campo `motivo` mínimo 10 caracteres.
- Broadcasts:
  - Límite de 3 envíos programados pendientes; rebasar el límite muestra error `MAX_PENDING_BROADCASTS`.
  - Requiere ejecutar `Enviar prueba` (genera `dryRunId`) antes de habilitar el botón principal.
  - Segmentos predefinidos: `all-users`, `planners`, `owners`, `vendors`, `beta-testers`, `custom-query` (requiere JSON validado).
- `MODE_MAINTENANCE`:
  - Al activarse escribe `globalConfigs/maintenanceWindow` (`active: true`, `comment`, `activatedBy`, `startedAt`).
  - Dispara evento `maintenanceModeChanged` → banner global y bloqueo creación/edición recursos críticos salvo admin.
  - Se solicita comentario al desactivarlo para historial.
- `AdminTasks` arrastra a `adminAuditLogs` (`action: ADMIN_TASK_UPDATE`) cuando el estado cambia. Se evita edición simultánea mediante `updatedAt` + `If-Match` (`etag` Firestore).
- Rotación de secretos obliga a registrar comentario, marca `lastRotationAt`, dispara workflow externo (ej. Secret Manager) y bloquea cambios mientras `status === 'rotating'`.

### 5.3 Límites y rate limits
- `POST /api/admin/login` bloquea IP tras 5 intentos fallidos en 15 minutos (`ADMIN_LOGIN_RATE_LIMIT`). Desbloqueo manual desde `AdminAlerts`.
- `PATCH /api/admin/alerts/:id` restringido a 10 operaciones por minuto por usuario para evitar spam desde automatizaciones.
- `calculateAdminMetrics` ignora ejecuciones si ya existe doc para la hora en curso (`idempotencyKey = date-hour`).
- `adminBroadcastHandler` reintenta máximo 5 veces; errores definitivos generan alerta severidad Alta.

## 6. Estados especiales y errores
- Acceso denegado → redirección a `/admin/forbidden` con CTA "Contactar soporte" y log `ADMIN_FORBIDDEN_REDIRECT`.
- Sesión expirada → modal "Tu sesión ha expirado" + auditoría `ADMIN_SESSION_EXPIRED`; tras cerrar el modal se ejecuta `logout()` automático.
- Servicios degradados o caídos → tarjetas rojas en dashboard, disparo de alerta crítica, email a soporte (`support@lovenda.com`) y mensaje Slack (webhook `#ops-alerts`).
- Conflictos al editar flags/configs → banner "Otro cambio detectado" con opción recargar; se usa `lastModifiedAt` para control de concurrencia optimista.
- Broadcast fallido → alerta severidad Alta, entrada histórica con `failureReason` y recomendación de reintento; envía email al owner del broadcast.
- Rotación de secreto con error → alerta crítica + rollback automático al valor anterior.
- Intentos fallidos repetidos → bloqueo IP (Cloud Armor), notificación soporte, cuando se desbloquea se genera entrada `ADMIN_RATE_LIMIT_RESET`.
- Al activar `Modo mantenimiento`, el dashboard muestra banner amarillo persistente con responsable y hora; si el modo persiste >4 h se genera alerta Severidad Media recordando revisar.
- Cuando un reporte supera el SLA (>=15 min) se dispara alerta Media y se marca `status: delayed` en `adminReportsQueue`.

## 7. Integración con otros flujos
| Flujo | Aporte hacia Administración | Dependencias desde Administración |
|-------|-----------------------------|------------------------------------|
| 1. Registro/Autenticación | KPI `conversionRate`, auditoría accesos, métricas signup → `adminMetrics`. | Reutiliza `loginAdmin`, `RequireAdmin`, MFA compartida. |
| 2/2B. Creación de boda | Eventos funnel onboarding → métricas y alertas de conversión. | Notifica mantenimiento para bloquear wizards si `MODE_MAINTENANCE`. |
| 3-4. Invitados / Contenido | Niveles RSVP, uso de contenidos → alimentación de KPIs y broadcast segmentado. | Administración puede pausar envíos masivos (broadcast). |
| 5a/5b. Proveedores / Timeline | Estado pipeline proveedores, tareas críticas vencidas. | Admin envía alertas globales a planners/proveedores y ajusta thresholds. |
| 6. Presupuesto | Ingresos estimados, desviaciones presupuestarias → `aiCosts`, `estimatedRevenue`. | Flags de alertas financieras configuradas por admin. |
| 7. Emails | Estadísticas de envío, fallos, IA Smart Composer. | Admin gestiona dominios, plantillas y listas de supresión. |
| 9. RSVP | Confirmaciones, abandono → alertas de baja asistencia. | Modo mantenimiento impide recordatorios globales si hay incidencia. |
| 10. Multi-boda | Dashboard multi-account → ratio uso por planner. | Admin puede transferir ownership y ver vistos cruzados. |
| 11.x Protocolo | Alimenta métricas `eventsPrepared`, `timelineReadiness`. | Admin puede publicar guías globales y documentos legales actualizados. |
| 12. Notificaciones | Preferencias y ratio entrega push/SMS. | Administración gestiona providers y reglas globales. |
| 14. Checklist avanzado | Estado de tareas conjuntas. | Admin define plantillas maestras y thresholds de alerta. |
| 15. Contratos | Conteo contratos firmados, expiración. | Gestión de plantillas contractuales y firmas digitales globales. |
| 16-18. Automatizaciones IA / Gamificación / Docs legales | Futuras métricas de IA y cumplimiento. | Admin aprueba acciones automáticas y reglas IA. |
| 20. Email Inbox global | Salud bandeja, colas pendientes. | Admin fuerza reprocesos o pone modo solo lectura ante incidentes. |
| 21. Sitio público | Trafico y conversiones. | Admin publica avisos y modo mantenimiento landing. |
| 23. Métricas proyecto | Consolidación de analytics. | Administración define objetivos y comparte reportes ejecutivos. |

- `useAuth` expone `loginAdmin`, `hasAdminPrivileges`, `redirectIfAdmin` para reutilizar en apps satélite (p.e. backoffice financiero).
- `adminEventBridge` (pub/sub) recibe eventos críticos de otros módulos (`SEATING_EXPORT_FAILED`, `PAYMENT_GATEWAY_DOWN`) y los transforma en alertas dashboard.

## 8. Métricas y monitorización
- **KPIs primarios** (fila 1 dashboard): `activeUsers7d`, `newWeddings30d`, `signupToWeddingConversion`, `estimatedRevenue30d`. Se recalculan cada hora y se comparan con objetivo configurado (`target`) para pintar el badge.
- **KPIs secundarios**: `invitationSends`, `rsvpConfirmations`, `tasksOverdue`, `contractsSigned`, `budgetVariance`, `openSupportTickets`, `broadcastDeliveryRate`, `aiPromptUsage`. Visualización en tarjetas laterales y en `AdminMetrics` (gráficos 7/30/90 días).
- **Salud de servicios**: métricas `status`, `latency`, `incidentsLast30d`, `errorRate`, `quotaUsage`. Se actualizan cada 5 min desde `syncExternalKPIs` y alimentan semáforos.
- **IA**: `tokensUsed`, `cost`, `successRate`, `automationOverrides`. Se cruzan con `ai_costs` (BigQuery) para dashboards financieros.
- **Alerting**: umbrales configurables (`globalConfigs/serviceThresholds`). Ejemplo: latencia Mailgun > 2s → alerta Media; error rate >5% → alerta Crítica.
- **Observabilidad**: logs estructurados en Cloud Logging (`traceId`, `adminId`, `requestId`), métricas custom en Cloud Monitoring (`lovenda-admin/*`), alertas push/Slack conectadas via `notifyServiceOutage`.
- **Analítica externa**: export diario a BigQuery + Looker Studio, y endpoints `/api/admin/export` (futuro) para CFO.
- **Privacidad**: métricas agregadas, sin PII directa; se aplica pseudonimización (`weddingIdHash`) y se limita acceso a dataset mediante IAM (`role/bigquery.dataViewer` exclusivo para admins).

## 9. Plan de pruebas
**E2E (Cypress)**  
Cobren login, navegación y operaciones críticas. Cada spec arranca con seed `adminSeed.ts` (reset colecciones dedicadas).
- `admin-login-happy` — login + dashboard visible + widgets cargados.
- `admin-mfa-required` — desafío OTP y expiración challenge.
- `admin-login-non-admin` — usuario planner recibe bloqueo y auditoría.
- `admin-dashboard-kpis` — comparación valores vs fixture `adminMetrics`.
- `admin-dashboard-service-health` — semáforos cambian ante mock degradado.
- `admin-alerts-acknowledge` — marcar alerta resuelta + registro auditoría.
- `admin-users-suspend` — suspensión/reactivación + validación motivo.
- `admin-portfolio-filter` — filtros multi-boda y export CSV.
- `admin-settings-flag-toggle` — toggle + rollback por cambio concurrente.
- `admin-settings-secret-rotate` — wizard completo y estados intermedios.
- `admin-broadcast-schedule` — dry-run, programación futura y verificación cola.
- `admin-audit-export` — descarga CSV y hash verificado.
- `admin-mode-maintenance` — activar/desactivar + impacto en front público.
- `admin-reports-delayed` — alerta cuando SLA superado.
- `admin-logout` — termina sesión y limpia storage.

**Unitarias / integración**
- Hooks: `useAuth.loginAdmin`, `useAdminMetrics`, `useAdminAlerts`, `RequireAdmin` (mocks de router y contexto).
- Servicios front: `adminApiClient`, `adminMetricsService`, `adminTasksService`, `adminBroadcastService` (mocks axios/fetch).
- Cloud Functions: `calculateAdminMetrics`, `adminBroadcastHandler`, `logAdminAction`, `generatePdfReport` (tests con `firebase-functions-test` y `nock` para integraciones).
- Validadores: `validateBroadcastSegment`, `validateMaintenanceComment`, `validateFlagRollout`.
- Reducers/estado: `adminDashboardSlice`, `alertsSlice`, `tasksSlice` (si se usa Zustand/Redux).

**Smoke manual**
- Accesibilidad (labels, orden tabulación, contraste, lectores).
- Responsividad desktop/tablet/mobile (down to 320px).
- Modo offline/degradado (semáforos en rojo, mensajes fallback).
- Comprobación soporte multi-idioma (ES/EN).
- Revisión rota de enlaces help/support dentro del dashboard.
- Pruebas seguridad (rate limit, CSRF, XSS en editores).
- Verificación auditoría tras cada acción crítica.

## 10. Checklist de despliegue
- Crear usuario admin único (`role: admin`, `claims.admin: true`) y habilitar MFA (si disponible) o restringir IP mediante Cloud Armor.
- Variables entorno necesarias: `VITE_ADMIN_ALLOWED_DOMAINS`, `ADMIN_METRICS_REFRESH_MS`, `ADMIN_SUPPORT_EMAIL`, `ADMIN_SUPPORT_PHONE`, `ADMIN_BROADCAST_DRYRUN_LIMIT`, `ADMIN_SESSION_TTL`, `ADMIN_SLACK_WEBHOOK`.
- Desplegar funciones cron `calculateAdminMetrics` (cada hora) y `syncExternalKPIs` (cada 5 min) antes de activar rutas protegidas.
- Crear índices Firestore (`adminMetrics` por `date` desc; `adminAlerts` por `status`+`createdAt`; `adminAuditLogs` por `resourceType`+`createdAt`; `adminBroadcasts` por `status`+`scheduledAt`; `featureFlags` por `domain`+`environment`).
- Configurar bucket `gs://lovenda-admin-snapshots` con retención 90 días y acceso restringido al servicio `admin-reporter`.
- Verificar API keys y scopes de integraciones (Mailgun, Twilio/WhatsApp, OpenAI, pasarela pagos, Zendesk/Intercom) y documentar responsables.
- Actualizar reglas Firestore (`allow read/write: if request.auth.token.admin == true`) y asegurar colecciones particionadas por mes.
- Documentar plan de rotación de claves, runbook de incidentes admin y procedimiento de escalado (N1 soporte, N2 SRE, N3 Dirección).
- Configurar notificaciones Slack/email en `notifyServiceOutage` antes de pasar a producción.

## Cobertura E2E implementada
- `cypress/e2e/admin/admin-flow.cy.js`: smoke end-to-end del login administrador, navegación principal del dashboard y validación de accesos restringidos.

## 11. Roadmap / pendientes
- MFA obligatorio (TOTP) para admin.
- Impersonación segura (solo lectura) con trail completo.
- SSO corporativo (SAML/OAuth Enterprise).
- Alertas push/Slack en tiempo real.
- Dashboard dedicado Estado integraciones.
- Reportes automáticos semanales al comité directivo.
- KPI NPS automatizado (encuestas periódicas planners).

## 12. Backlog técnico
**Frontend**
- Implementar `AdminLogin`, `AdminDashboard`, `AdminLayout`, `AdminMetrics`, `AdminPortfolio`, `AdminUsers`, `AdminIntegrations`, `AdminSettings`, `AdminAlerts`, `AdminBroadcast`, `AdminAudit`, `AdminReports`, `AdminSupport`.
- Crear componentes `KpiCard`, `ServiceHealthCard`, `AlertItem`, `AdminTable`, `AdminDrawer`, `BroadcastForm`.
- Integrar Recharts/Chart.js, react-hook-form, dayjs.
- Añadir `RequireAdmin` y actualizar router principal.

**Backend/Infra**
- Cloud Functions: `calculateAdminMetrics`, `generatePdfReport`, `adminBroadcastHandler`, `logAdminAction`.
- Jobs (cron) para sincronizar métricas y servicios externos.
- Endpoints `/api/admin/*` con middleware de verificación JWT/rol.
- Persistencia de sesiones admin en Firestore:
  1. Generar la credencial de servicio en Firebase Console → Cuentas de servicio.
  2. Exponerla al backend (`FIREBASE_SERVICE_ACCOUNT_JSON` con el JSON o `GOOGLE_APPLICATION_CREDENTIALS=/ruta/clave.json`).
  3. Reiniciar el servidor para que `adminSessions` use Firestore; sin credencial se cae a almacenamiento en memoria y se registra un aviso.
  4. Configurar TTL en la colección `adminSessions` (campo `expiresAt`) para purgar sesiones caducadas de forma automática.
- Pipelines BigQuery (export Firestore?BQ) y Data Studio templates.

**Seguridad**
- Enforce HTTPS, HSTS, CSP restrictivo en `/admin`.
  - Detectar accesos sospechosos (IP nueva, ubicación) y alertar.
- Rotación periódica de secretos vía Secret Manager.

**QA**
- Suite Cypress específica (smoke + regresión) y datos seed `adminSeed.ts`.
- Automatizar `npm run test:admin` (vitest + subset e2e).

## 13. Hoja de ruta
**Fase 0 - Preparación (Semana 0)**
- Bloquear alcance con producto y seguridad, incluyendo dependencias externas (BigQuery, Secret Manager).
- Crear usuario admin inicial y reglas Firestore provisionales para colecciones admin.
- Alinear convenciones de UI y definir design tokens específicos `/admin`.

**Fase 1 - Acceso blindado (Sprints 1-2)**
- ✅ Entregar `AdminLogin`, `RequireAdmin` y `AdminLayout` end-to-end con MFA opcional y bloqueo tras 5 intentos.
- ✅ Desplegar middleware `/api/admin/login`, `/api/admin/login/mfa`, `/api/admin/logout` y pipeline de auditoría básica.
- Implementar detección de accesos sospechosos (IP, geo, user-agent) con alertas de soporte.
- QA: smoke `admin-login-*`, pruebas de seguridad rate limit, verificador accesibilidad.

**Fase 2 - Dashboard vivo (Sprints 3-4)**
- Publicar `AdminDashboard` completo con `KpiCard`, `ServiceHealthCard`, alertas y tareas reales.
- Activar `calculateAdminMetrics`, cron de sincronización y endpoints `/api/admin/dashboard/*`.
- Integrar notificaciones de bloqueo/alerta en `adminAuditLogs` y checklist `adminTasks`.
- QA: `admin-dashboard-*`, verificador responsive, seed `adminSeed.ts`.

**Fase 3 - Operación crítica (Sprints 5-6)**
- Implementar `AdminUsers`, `AdminPortfolio`, `AdminAlerts` con `AdminTable` + `AdminDrawer`.
- Exponer APIs de gestión (usuarios, bodas, alertas) con trail y permisos granulares.
- Automatizar flujos de suspensión/reactivación y destacar bodas con auditoría.
- QA: suites Cypress `admin-users-*`, `admin-portfolio-*`, `admin-alerts-*`; pruebas integración servicios.

**Fase 4 - Configuración y comunicación (Sprints 7-8)**
- Entregar `AdminSettings`, `AdminIntegrations`, `AdminBroadcast` y funciones `generatePdfReport`, `adminBroadcastHandler`.
- Añadir `AdminReports` con exportes CSV/JSON y plantillas Data Studio; programar informes periódicos.
- Integrar `AdminSupport` con sistema de tickets y SLA; preparar soporte SSO/impersonación.
- QA: `admin-broadcast-*`, `admin-settings-*`, pruebas de rendimiento PDF y reintentos integraciones.

**Fase 5 - Optimizar y escalar (Sprints 9+)**
- Activar MFA obligatorio (TOTP), SSO corporativo y modo impersonación lectura.
- Implementar alertas push/Slack, dashboard dedicado de integraciones, KPI NPS automatizado.
- Reforzar seguridad (rotación secretos, CSP/HSTS estricto, monitoreo 24/7) y observabilidad (telemetría, alertas Slack).
- Ampliar automatización QA (`npm run test:admin`, regresión E2E completa) y playbooks de incidentes.
