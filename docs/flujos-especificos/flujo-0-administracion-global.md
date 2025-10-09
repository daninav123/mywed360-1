# 0. AdministraciÃ³n Global (estado 2025-10-08)

> Implementado: *pendiente de definiciÃ³n tÃ©cnica*.
> Alcance: rol `admin` Ãºnico con acceso exclusivo a mÃ©tricas y configuraciÃ³n global del proyecto. El login se realiza en `/admin/login`; cualquier intento desde `/login` con credenciales admin redirige automÃ¡ticamente al dashboard global.

## 1. Objetivo y alcance
- Supervisar toda la actividad de Lovenda (usuarios, bodas, finanzas, IA, comunicaciones) desde una consola centralizada.
- Ejecutar tareas de auditorÃ­a, soporte y configuraciÃ³n global (feature flags, plantillas, integraciones).
- Monitorizar la salud de servicios internos y externos, reaccionando a alertas crÃ­ticas.
- Emitir comunicaciones masivas controladas y mantener trazabilidad completa de acciones administrativas.

## 2. Trigger y rutas
- `/admin/login` (`AdminLogin.jsx`)
  - Campos:
    - `email`: placeholder `admin@lovenda.com`, validaciÃ³n dominio (`VITE_ADMIN_ALLOWED_DOMAINS`), mensajes "Introduce un email vÃ¡lido" / "Dominio no autorizado".
    - `password`: placeholder `ContraseÃ±a`, mÃ­nimo 10 caracteres, botÃ³n mostrar/ocultar, mensaje "La contraseÃ±a debe tener al menos 10 caracteres".
  - Controles: checkbox "Recordar sesiÃ³n" (solo si MFA completado), botÃ³n primario `Acceder` (disabled hasta inputs vÃ¡lidos), enlace `Â¿Problemas para entrar?` que abre modal con email/telÃ©fono de soporte.
  - Errores: credenciales incorrectas ? banner rojo "Email o contraseÃ±a no vÃ¡lidos"; usuario sin rol admin ? banner "Tu cuenta no dispone de acceso administrador" + registro en `adminAuditLogs` (`action: ADMIN_ACCESS_DENIED`).
  - Seguridad: mÃ¡ximo 5 intentos fallidos por hora ? bloqueo temporal 15 minutos + email automÃ¡tico al soporte.
- `/admin/dashboard` (`AdminDashboard.jsx`).
- Subrutas protegidas (siempre dentro de `AdminLayout` + `RequireAdmin`): `/admin/metrics`, `/admin/portfolio`, `/admin/users`, `/admin/integrations`, `/admin/settings`, `/admin/alerts`, `/admin/broadcast`, `/admin/audit`, `/admin/reports`, `/admin/support`.
- `AdminLayout` incluye header con breadcrumbs (`AdministraciÃ³n / MÃ©tricas`), botÃ³n `Cerrar sesiÃ³n`, indicador "Ãšltima actualizaciÃ³n HH:MM:SS" (refresco cada 60?s) y botÃ³n `Ayuda`; sidebar con secciones "Panel", "Operaciones", "AnalÃ­tica", "Infraestructura", "ConfiguraciÃ³n"; footer con versiÃ³n `vX.Y.Z` y enlace a polÃ­ticas de seguridad.

## 3. Paso a paso UX
1. **AdminLogin.jsx**
   - Flujo: submit ? spinner ? `useAuth().loginAdmin` ? si MFA habilitado, diÃ¡logo OTP (6 dÃ­gitos, vÃ¡lido 60?s). Error OTP ? banner "CÃ³digo invÃ¡lido" y decremento del contador. Tras Ã©xito: redirecciÃ³n a `/admin/dashboard` y escritura de `lastAdminLogin` en `adminAuditLogs`.
2. **AdminDashboard.jsx**
   - Fila 1 (KPIs principales, 4 tarjetas 25?% ancho):
     - `Usuarios activos (7 dÃ­as)` (valor entero, variaciÃ³n vs semana anterior, icono `Users`, badge verde #16A34A si =0, rojo #DC2626 si <0).
     - `Bodas creadas (30 dÃ­as)` (total, comparativa %, icono `Heart`, tooltip "Incluye bodas en estado active").
     - `ConversiÃ³n signup?boda` (porcentaje, sparkline Ãºltimos 8 dÃ­as, tooltip explicativo).
     - `Ingresos estimados (30 dÃ­as)` (moneda ES, subtexto "Incluye pagos confirmados").
   - Fila 2 (salud servicios: Firebase, Mailgun, WhatsApp, OpenAI): estado (Operativo/Degradado/CaÃ­do), latencia media, incidentes 30?d, botÃ³n `Ver detalles` ? `/admin/integrations#{service}`.
   - Fila 3 (alertas y tareas): lista `Alertas crÃ­ticas` (mÃ¡x 5, severidad, mÃ³dulo, mensaje, timestamp relativo, botones `Ver`, `Marcar resuelta` con modal para comentario) y checklist `Tareas admin` (items drag&drop guardados en `adminTasks` con acciones AÃ±adir/Completar/Eliminar).
   - Header adicional: botÃ³n `Generar informe PDF` (snapshot), toggle `Modo mantenimiento` (confirmaciÃ³n doble y comentario obligatorio).
   - Mobile (<768?px): tarjetas apiladas, alertas en acordeÃ³n, botÃ³n flotante para tareas.
3. **MÃ³dulos secundarios**
   - `AdminMetrics.jsx`: grÃ¡ficos 7/30/90 dÃ­as, date picker personalizado, funnel (Visitantes ? Registrados ? Bodas activas), tarjeta "Coste IA" (proveedor, prompts, coste Â€), botones `Exportar CSV/JSON` y `Abrir en BigQuery`.
   - `AdminPortfolio.jsx`: tabla paginada (50 filas) con columnas Pareja, Owner, Fecha evento, Estado, Invitados confirmados, Contratos firmados, Ãšltimo cambio; filtros por estado y fechas; bÃºsqueda owner/email; acciones `Ver detalle` (modal con tabs), `Destacar`, `Generar PDF`.
   - `AdminUsers.jsx`: tabla con Email, Rol, Estado, Ãšltimo acceso, Bodas activas, Fecha alta; filtros rÃ¡pidos; drawer con Perfil, Actividad, AuditorÃ­a; acciones `Suspender` (motivo obligatorio), `Reactivar`, `Reset contraseÃ±a`, `Forzar verificaciÃ³n`.
   - `AdminIntegrations.jsx`: tarjetas por servicio con estado, consumo actual, lÃ­mite, botÃ³n `Reintentar conexiÃ³n`; tabla incidentes (Fecha inicio, DuraciÃ³n, Impacto, Acciones, Resuelto por, exportable CSV).
   - `AdminSettings.jsx`: secciones Feature Flags (toggle + descripciÃ³n + owner), Claves/Secretos (nombre, Ãºltima rotaciÃ³n, botÃ³n `Rotar` con wizard), Plantillas globales (editor Markdown + vista previa + historial), ParÃ¡metros de sistema (limites, mantenimiento programado).
   - `AdminAlerts.jsx`: timeline con filtros severidad/mÃ³dulo/fecha, acciones `Ver detalle` y `Marcar resuelta` (campo acciones tomadas), severidad codificada: CrÃ­tica (rojo), Alta (Ã¡mbar), Media (azul).
   - `AdminBroadcast.jsx`: tabs Email/Push, campos asunto/contenido/segmentaciÃ³n/programaciÃ³n, botones `Enviar prueba`, `Enviar` (confirmaciÃ³n doble), histÃ³rico con estado, tasas de apertura/click.
   - `AdminAudit.jsx`: tabla filtrable por acciÃ³n, recurso, actor, fechas; columnas Fecha, Actor, AcciÃ³n, Recurso, Payload (JSON expandible); exportadores CSV/JSON.
   - `AdminReports.jsx`: reportes programados (Diario/Semanal/Mensual) con campos tipo, destinatarios, formato, estado; botÃ³n `Generar informe` (wizard con plantilla y destinatarios).
   - `AdminSupport.jsx`: panel de tickets (API soporte), KPIs SLA, tabla tickets abiertos/pending/resueltos; grÃ¡fico NPS mensual, comentarios recientes.
4. **Acciones globales**: botones permanentes `Crear bandera`, `Exportar mÃ©tricas`, `Modo mantenimiento`; panel lateral `Tareas admin` persistente; modal de broadcast accesible mediante botÃ³n flotante.

## 4. Persistencia y datos
- Colecciones Firestore:
  - `adminMetrics/{date}` ? `activeUsers7d`, `newWeddings30d`, `conversionRate`, `estimatedRevenue`, `servicesHealth[]`, `funnel`, `aiCosts`.
  - `adminTasks/{taskId}` ? `title`, `completed`, `createdAt`, `updatedAt`.
  - `adminAlerts/{id}` ? `severity`, `source`, `message`, `status`, `createdAt`, `resolvedAt`, `actionTaken`.
  - `adminBroadcasts/{id}` ? `type`, `segment`, `subject`, `content`, `scheduledAt`, `status`, `stats` (`opens`, `clicks`, `failures`).
  - `adminAuditLogs/{id}` ? `actorId`, `action`, `resourceType`, `resourceId`, `payload`, `createdAt`, `ip`, `userAgent`.
  - `featureFlags/{flagId}` ? `name`, `description`, `domain`, `enabled`, `lastModifiedBy`, `lastModifiedAt`.
  - `globalConfigs/{configId}` ? parÃ¡metros globales (ej. `maintenanceWindow`, `planLimits`).
- BigQuery dataset `admin_reports` con tablas `daily_metrics`, `funnels`, `ai_costs`.
- Ãndices requeridos: `adminMetrics` por `date` desc; `adminAlerts` por `status`+`createdAt`; `adminAuditLogs` por `resourceType`+`createdAt`; `adminBroadcasts` por `status`+`scheduledAt`.
- Integraciones externas: Firebase, Mailgun, Twilio/WhatsApp, OpenAI, pasarela pagos, herramienta soporte (Zendesk/Intercom) alimentan `servicesHealth` y alertas.

## 5. Reglas de negocio
- Solo `role === 'admin'` puede acceder a `/admin/**`.
- Login admin detectado en `/login` se redirige a `/admin/dashboard`.
- Todas las acciones crÃ­ticas registran evento en `adminAuditLogs`.
- Sesiones admin expiran a los 60 minutos de inactividad (vs 8?h estÃ¡ndar).
- Broadcasts limitados a 3 pendientes simultÃ¡neos y requieren envÃ­o de prueba previo.
- `MODE_MAINTENANCE` bloquea creaciÃ³n bodas y muestra banner global; sÃ³lo admin puede activarlo/desactivarlo.
- RotaciÃ³n de secretos obliga a registrar comentario obligatorio.

## 6. Estados especiales y errores
- Acceso denegado ? `/admin/forbidden` con acciones Soporte.
- SesiÃ³n expirada ? modal "Tu sesiÃ³n ha expirado" + logging `ADMIN_SESSION_EXPIRED`.
- Servicios caÃ­dos ? tarjeta roja en dashboard + alerta crÃ­tica + email soporte.
- Conflictos flags ? banner "Otro cambio detectado" con opciÃ³n recargar.
- Broadcast fallido ? alerta severidad Alta y entrada en histÃ³rico con causa.
- Intentos fallidos repetidos ? bloqueo IP, notificaciÃ³n soporte, entrada `LOGIN_RATE_LIMIT`.

## 7. IntegraciÃ³n con otros flujos
- Flujos 1-22 envÃ­an KPIs agregados a `adminMetrics` (jobs `calculateAdminMetrics`, `syncExternalKPIs`).
- `useAuth` expone `loginAdmin`, `hasAdminPrivileges`, `redirectIfAdmin`.
- `useMetrics` incluye `getAdminKPIs`, `getFunnelData`, `getAICosts`.
- Panel de contratos (Flujo 15) aporta `contractsSigned/pending`; Proveedores IA (Flujo 5) informa estado providers; Emails (Flujo 7) aporta tasas envÃ­o.

## 8. MÃ©tricas y monitorizaciÃ³n
- Principales: usuarios activos, bodas creadas, conversiÃ³n, ingresos.
- Soporte: invitaciones enviadas, confirmaciones RSVP, tareas crÃ­ticas vencidas.
- Salud servicios: uptime, latencia, incidentes, SLA.
- IA: prompts, coste diario/mensual, ratio Ã©xito IA/manual.
- Comunicaciones: envÃ­os, aperturas, clicks, fallos.
- Soporte: tickets abiertos/pending/resueltos, SLA, NPS.
- ActualizaciÃ³n automÃ¡tica cada 5 min (alertas en tiempo real).

## 9. Plan de pruebas
**E2E (Cypress)**
- `admin-login-happy`
- `admin-mfa-required`
- `admin-login-non-admin`
- `admin-dashboard-kpis`
- `admin-dashboard-service-health`
- `admin-alerts-acknowledge`
- `admin-users-suspend`
- `admin-portfolio-filter`
- `admin-settings-flag-toggle`
- `admin-settings-secret-rotate`
- `admin-broadcast-schedule`
- `admin-audit-export`
- `admin-mode-maintenance`
- `admin-logout`

**Unitarias / integraciÃ³n**
- `useAuth.loginAdmin`, `RequireAdmin`, `hasAdminPrivileges`.
- Servicios: `adminMetricsService`, `adminTasksService`, `adminAlertsService`, `broadcastService`.
- Componentes UI (widgets, tablas) con testing-library.
- Cloud Functions `calculateAdminMetrics`, `adminBroadcast`, `retryIntegration`.

**Smoke manual**
- Accesibilidad (labels, focus, atajos teclado).
- Responsividad desktop/tablet/mobile.
- Pruebas seguridad (rate limit, CSRF, XSS en editores).
- VerificaciÃ³n auditorÃ­a tras cada acciÃ³n crÃ­tica.

## 10. Checklist de despliegue
- Crear usuario admin Ãºnico (`role: admin` en Firestore) y habilitar MFA (si disponible) o restringir IP.
- Variables entorno: `VITE_ADMIN_ALLOWED_DOMAINS`, `ADMIN_METRICS_REFRESH_MS`, `ADMIN_SUPPORT_EMAIL`, `ADMIN_SUPPORT_PHONE`.
- Desplegar funciones cron `calculateAdminMetrics` (cada hora) y `syncExternalKPIs` (cada 5 min).
- Crear Ã­ndices Firestore definidos.
- Configurar bucket para exportes PDF.
- Verificar API keys y permisos de integraciones.
- Actualizar reglas Firestore para colecciones admin.
- Documentar rotaciÃ³n de claves y plan contingencia.

## Cobertura E2E implementada
- `cypress/e2e/admin/admin-flow.cy.js`: smoke end-to-end del login administrador, navegaciÃ³n principal del dashboard y validaciÃ³n de accesos restringidos.

## 11. Roadmap / pendientes
- MFA obligatorio (TOTP) para admin.
- ImpersonaciÃ³n segura (solo lectura) con trail completo.
- SSO corporativo (SAML/OAuth Enterprise).
- Alertas push/Slack en tiempo real.
- Dashboard dedicado Â“Estado integracionesÂ”.
- Reportes automÃ¡ticos semanales al comitÃ© directivo.
- KPI NPS automatizado (encuestas periÃ³dicas planners).

## 12. Backlog tÃ©cnico
**Frontend**
- Implementar `AdminLogin`, `AdminDashboard`, `AdminLayout`, `AdminMetrics`, `AdminPortfolio`, `AdminUsers`, `AdminIntegrations`, `AdminSettings`, `AdminAlerts`, `AdminBroadcast`, `AdminAudit`, `AdminReports`, `AdminSupport`.
- Crear componentes `KpiCard`, `ServiceHealthCard`, `AlertItem`, `AdminTable`, `AdminDrawer`, `BroadcastForm`.
- Integrar Recharts/Chart.js, react-hook-form, dayjs.
- AÃ±adir `RequireAdmin` y actualizar router principal.

**Backend/Infra**
- Cloud Functions: `calculateAdminMetrics`, `generatePdfReport`, `adminBroadcastHandler`, `logAdminAction`.
- Jobs (cron) para sincronizar mÃ©tricas y servicios externos.
- Endpoints `/api/admin/*` con middleware de verificaciÃ³n JWT/rol.
- Pipelines BigQuery (export Firestore?BQ) y Data Studio templates.

**Seguridad**
- Enforce HTTPS, HSTS, CSP restrictivo en `/admin`.
  - Detectar accesos sospechosos (IP nueva, ubicaciÃ³n) y alertar.
- RotaciÃ³n periÃ³dica de secretos vÃ­a Secret Manager.

**QA**
- Suite Cypress especÃ­fica (smoke + regresiÃ³n) y datos seed `adminSeed.ts`.
- Automatizar `npm run test:admin` (vitest + subset e2e).

## 13. Hoja de ruta
**Fase 0 - PreparaciÃ³n (Semana 0)**
- Bloquear alcance con producto y seguridad, incluyendo dependencias externas (BigQuery, Secret Manager).
- Crear usuario admin inicial y reglas Firestore provisionales para colecciones admin.
- Alinear convenciones de UI y definir design tokens especÃ­ficos `/admin`.

**Fase 1 - Acceso blindado (Sprints 1-2)**
- Entregar `AdminLogin`, `RequireAdmin` y `AdminLayout` end-to-end con MFA opcional y bloqueo tras 5 intentos.
- Desplegar middleware `/api/admin/login` y `logAdminAction`; habilitar auditorÃ­a bÃ¡sica.
- Implementar detecciÃ³n de accesos sospechosos (IP, geo, user-agent) con alertas de soporte.
- QA: smoke `admin-login-*`, pruebas de seguridad rate limit, verificador accesibilidad.

**Fase 2 - Dashboard vivo (Sprints 3-4)**
- Publicar `AdminDashboard` completo con `KpiCard`, `ServiceHealthCard`, alertas y tareas reales.
- Activar `calculateAdminMetrics`, cron de sincronizaciÃ³n y endpoints `/api/admin/dashboard/*`.
- Integrar notificaciones de bloqueo/alerta en `adminAuditLogs` y checklist `adminTasks`.
- QA: `admin-dashboard-*`, verificador responsive, seed `adminSeed.ts`.

**Fase 3 - OperaciÃ³n crÃ­tica (Sprints 5-6)**
- Implementar `AdminUsers`, `AdminPortfolio`, `AdminAlerts` con `AdminTable` + `AdminDrawer`.
- Exponer APIs de gestiÃ³n (usuarios, bodas, alertas) con trail y permisos granulares.
- Automatizar flujos de suspensiÃ³n/reactivaciÃ³n y destacar bodas con auditorÃ­a.
- QA: suites Cypress `admin-users-*`, `admin-portfolio-*`, `admin-alerts-*`; pruebas integraciÃ³n servicios.

**Fase 4 - ConfiguraciÃ³n y comunicaciÃ³n (Sprints 7-8)**
- Entregar `AdminSettings`, `AdminIntegrations`, `AdminBroadcast` y funciones `generatePdfReport`, `adminBroadcastHandler`.
- Añadir `AdminReports` con exportes CSV/JSON y plantillas Data Studio; programar informes periÃ³dicos.
- Integrar `AdminSupport` con sistema de tickets y SLA; preparar soporte SSO/impersonaciÃ³n.
- QA: `admin-broadcast-*`, `admin-settings-*`, pruebas de rendimiento PDF y reintentos integraciones.

**Fase 5 - Optimizar y escalar (Sprints 9+)**
- Activar MFA obligatorio (TOTP), SSO corporativo y modo impersonaciÃ³n lectura.
- Implementar alertas push/Slack, dashboard dedicado de integraciones, KPI NPS automatizado.
- Reforzar seguridad (rotaciÃ³n secretos, CSP/HSTS estricto, monitoreo 24/7) y observabilidad (telemetrÃ­a, alertas Slack).
- Ampliar automatizaciÃ³n QA (`npm run test:admin`, regresiÃ³n E2E completa) y playbooks de incidentes.
