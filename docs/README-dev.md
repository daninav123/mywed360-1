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
- Validación de capacidad por mesa al asignar invitados (considera acompañantes).
  - Archivo: `src/components/seating/SeatingPlanRefactored.jsx` (`handleAssignGuest`).
- Optimizaciones de rendimiento sin cambiar UI:
  - `src/components/seating/SeatingPlanCanvas.jsx`: backend DnD memoizado y pan con `requestAnimationFrame`.
  - `src/features/seating/SeatingCanvas.jsx`: exportado con `memo`.
  - `src/components/TableItem.jsx`: memo de cálculos (`guestCount`, `guestsList`, `getLabel`).
- Componentes ya memoizados: `ChairItem.jsx`, `FreeDrawCanvas.jsx`.

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

---

## Notas
- No se han modificado estilos visuales.
- No se arrancan servidores desde estos cambios; scripts listos para ejecución manual en tu entorno.
