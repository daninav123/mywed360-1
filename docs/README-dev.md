# Guía de Desarrollo (MyWed360)

Este documento consolida los flujos técnicos añadidos recientemente: Seating Plan, Automatización, RSVP Scheduler y Monitorización.

> Nota: no se han realizado cambios de diseño visual; solo mejoras funcionales y de rendimiento.

## Índice
- Seating Plan
- Pruebas (Unit / E2E)
- Automatización (runTask)
- Scheduler de RSVP
- Monitorización (Prometheus / Grafana / Alertmanager)
- Variables de entorno

---

## Seating Plan
- Resumen visual del estado del plano:
  - `src/components/seating/SeatingPlanSummary.jsx` centraliza tarjetas de personas ubicadas, pendientes, mesas activas y capacidad, con chips de avance (ceremonia/banquete) y glosario de areas dibujadas.
  - Integrado tras las pestanas principales en `src/components/seating/SeatingPlanRefactored.jsx`.
- Acciones rapidas y toggle de herramientas avanzadas:
  - `src/components/seating/SeatingPlanQuickActions.jsx` expone Configurar espacio/banquete, pendientes, autoasignacion, plantillas, exportaciones y ajuste de vista.
  - El estado `showAdvancedTools` se persiste para mostrar u ocultar la toolbar completa.
- Persistencia y calculos de progreso:
  - `SeatingPlanRefactored.jsx` guarda `showAdvancedTools`, `showRulers`, `showSeatNumbers` y `showTables` en `localStorage` (`uiPrefsKey`) y calcula `seatingProgress` (personas totales, asignadas, asientos habilitados y % avance).
- Onboarding guiado para primeros pasos:
  - Checklist y tooltips sugeridos (Configurar espacio, importar invitados, asignar mesas) con estado persistido en `uiPrefsKey`.
  - Guardar banderas `onboardingSteps` y `onboardingDismissed` en `SeatingPlanRefactored.jsx` para reanudar o descartar el recorrido.
- Validacion de capacidad por mesa al asignar invitados (considera acompanantes).
  - Archivo: `src/components/seating/SeatingPlanRefactored.jsx` (`handleAssignGuest`).
- Optimizaciones de rendimiento sin cambiar UI:
  - `src/components/seating/SeatingPlanCanvas.jsx`: backend DnD memoizado y pan con `requestAnimationFrame`.
  - `src/features/seating/SeatingCanvas.jsx`: exportado con `memo`.
  - `src/components/TableItem.jsx`: memo de calculos (`guestCount`, `guestsList`, `getLabel`).
- Componentes ya memoizados: `ChairItem.jsx`, `FreeDrawCanvas.jsx`.

### Guia de estilo visual (propuesta)
- Jerarquia y espacio: fondo gris claro (`#f8fafc`), tarjetas blancas con bordes suaves (`#e2e8f0`) y padding consistente (24px).
- Tipografia: escala corta (titulares 22px, subtitulos 16px, cuerpo 14px) con una sola familia; `font-medium` solo en titulos.
- Colores: azul principal para acciones y verde para confirmaciones; estados informativos/peligro via badges ligeros.
- Toolbar: barra plegable, fondo neutro, iconos outline sin cajas internas y maximo dos filas separadas por divisores sutiles.
- Acciones rapidas: tres cards horizontales (icono circular + texto alineado) o timeline vertical limpio sin multiples badges.
- Checklist onboarding: tarjeta unica con tres filas numeradas, barra de progreso discreta arriba.
- Paneles laterales: aplicar fondo `#f1f5f9`, titulos en mayusculas pequenas y divisores finos para secciones.
- Canvas: encabezado fijo con datos clave, controles fuera del lienzo y toasts discretos en la esquina inferior.
- Iconografia: seleccionar 6-8 iconos outline uniformes (mismo tamano, sin mezclar rellenos).
- Estados vacios: componentes dedicados con ilustracion minimal y CTA central; ocultar bloques que ya no aplican (ej. onboarding completado).
- Toggles de panel: Quick Actions expone switches para Biblioteca, Inspector, Invitados y Panel inteligente, persistidos en `uiPrefsKey`.
- Identificacion de mesas: cada mesa debe renderizar su numero o nombre centrado sobre la figura para facilitar la lectura del plano.

### E2E relevantes de Seating
- Ubicación: `cypress/e2e/seating/`
  - `seating_capacity_limit.cy.js`: bloquea asignación si no hay capacidad.
  - `seating_template_circular.cy.js`: valida disposición en anillo.
  - `seating_template_u_l_imperial.cy.js`: plantillas U/L/Imperial.
  - Otros: `seating_aisle_min`, `seating_obstacles_no_overlap`, etc.

---

## Pruebas
- Unit tests de reglas Firestore (Seating Plan):
  - `src/__tests__/firestore.rules.seating.test.js`
  - Requiere `@firebase/rules-unit-testing` (ya en devDependencies).
- Scripts:
  - `npm run test:unit` (alias de `vitest run`).
  - `npm run validate:schemas` (verifica `firestore.rules` y JSONs clave).

---

## Automatización (runTask)
- Runner: `scripts/runTask.js`
  - Lee `roadmap.json` y ejecuta la primera `pending` o `--id=<taskId>`.
  - Logs JSONL en `logs/tasks.log`.
  - Health Check con reintentos (2s, 4s, 8s): `test:unit`, `lint`, `validate:schemas`.
  - Ante fallo: envía alertas (Slack/SMTP si configurado) y añade incidente en `docs/incidents/YYYY-MM-DD_task_errors.md`.
- Ejemplos:
  - `node scripts/runTask.js`
  - `node scripts/runTask.js --id=validate_schemas`
- Tareas ejemplo en `roadmap.json`:
  - `rsvp_scheduler_dryrun`, `validate_schemas`, `unit_rules`.

---

## Scheduler de RSVP
- Script: `scripts/rsvpScheduler.js`
  - Itera bodas y llama `POST /api/rsvp/reminders`.
  - Usa `dryRun=true` por defecto.
  - Asegura rol planner vía `POST /api/rsvp/dev/ensure-planner`.
- Parámetros:
  - `--dryRun=true|false`
  - `--limit=50` (por defecto 100)
  - `--minIntervalMinutes=1440` (24h)
  - `--force=true|false` (omite rate limit de última ejecución)
- Variables: `BACKEND_BASE_URL` o `VITE_BACKEND_BASE_URL`.

Endpoints robustecidos (Zod opcional) en `backend/routes/rsvp.js`:
- `PUT /api/rsvp/by-token/:token` (status, companions, allergens)
- `POST /api/rsvp/reminders` (weddingId, limit, dryRun, minIntervalMinutes, force)

---

## Monitorización
- Backend expone `GET /metrics` (lazy `prom-client`) y `GET /health`.
- Prometheus/Alertmanager:
  - `docs/monitoring/prometheus.yml`
  - `docs/monitoring/alerting_rules.yml` (HighErrorRate + SlowRequestsP95)
  - `docs/monitoring/alertmanager.yml` (plantilla Slack/SMTP)
- Grafana:
  - `docs/monitoring/grafana/http-overview.json`
  - `docs/monitoring/grafana/errors-latency.json`
- Guía: `docs/monitoring/README.md`.

---

## Variables de entorno
- Ver `.env.example` (ampliado) con:
  - `BACKEND_BASE_URL` (scheduler)
  - `SLACK_WEBHOOK_URL` (alertas)
  - `SMTP_*`, `ALERT_EMAIL_*` (alertas email)
  - Resto de variables existentes (Firebase, Mailgun, etc.)

### CORS y Rate Limiting (IA)
- `ALLOWED_ORIGIN`: lista de orígenes permitidos separada por comas. Debe coincidir exactamente con `window.location.origin` del frontend. Ejemplo producción: `https://app.tu-dominio.com,https://www.tu-dominio.com`.
- `RATE_LIMIT_AI_MAX`: solicitudes por minuto para rutas de IA (por usuario autenticado). Por defecto: 60/min en `NODE_ENV=production` y 0 en el resto. Pon `0` para desactivar.
- El limitador cuenta por `uid` (Firebase) si existe; si no, cae a IP. `app.set('trust proxy', 1)` ya está activo para Render.

### OpenAI directo en frontend (solo local)
- `VITE_ENABLE_DIRECT_OPENAI`: cuando es `true`, el frontend puede usar la API de OpenAI directamente con `VITE_OPENAI_API_KEY` para pruebas locales.
- En producción, mantenerlo ausente o `false` para forzar el uso del backend `/api/ai` y no exponer claves.

---

## Notas
- No se han modificado estilos visuales.
- No se arrancan servidores desde estos cambios; scripts listos para ejecución manual en tu entorno.
