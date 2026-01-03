# Automatización MaLoveApp

Este documento resume cómo ejecutar tareas automáticas, validar el estado del repo y programar recordatorios RSVP, cumpliendo con el flujo 1.1 y 1.2.

## Requisitos
- Node 18+ / 20+
- Variables opcionales en `.env` (o variables de entorno del sistema):
  - `SLACK_WEBHOOK_URL` (para alertas por Slack)
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `ALERT_EMAIL_TO`, `ALERT_EMAIL_FROM` (para alertas por email)
  - `BACKEND_BASE_URL` (p. ej., `http://localhost:4004`) para el scheduler RSVP

Consulta `.env.example` para una lista de campos.

---

## 1) runTask: ejecutar tareas pendientes del roadmap (1.1)

Archivo: `scripts/runTask.js`

- Lee `roadmap.json` (si existen `sprint`, `priority` o `blockedBy`, el runner puede ordenar por sprint y prioridad y omitir tareas bloqueadas hasta que sus dependencias estén completadas)
- Ejecuta la primera tarea con `status=pending` o la indicada por `--id`
- Registra logs JSONL en `logs/tasks.log`:
  - `{timestamp, taskId, action: 'start'}`
  - `{timestamp, taskId, action: 'end', status: 'success' | 'error'}`
  - `{timestamp, taskId, error: '...'} (si ocurre)
- Tras ejecutar la tarea, realiza Health Check (1.2):
  - `npm run test:unit` → `vite/vitest`
  - `npm run lint` → ESLint
  - `npm run validate:schemas` → verifica reglas y JSONs claves
- Reintentos: 3 intentos por paso con retraso exponencial 2s, 4s, 8s
- Alertas: si el health-check falla, envía Slack y/o email (si config) y añade incidente en `docs/incidents/YYYY-MM-DD_task_errors.md`.

Ejemplos de uso:

```
node scripts/runTask.js
node scripts/runTask.js --id=validate_schemas
```

`roadmap.json` de ejemplo ya incluido:
- `rsvp_scheduler_dryrun` → Programador de recordatorios (dry run)
- `validate_schemas` → Validador de reglas/JSON
- `unit_rules` → Unit tests de reglas Firestore de Seating

---

## 2) Scheduler de recordatorios RSVP

Archivo: `scripts/rsvpScheduler.js`

- Revisa bodas (limit configurable) y llama al endpoint protegido `/api/rsvp/reminders` del backend.
- Usa un token mock Bearer y asegura rol planner con `/api/rsvp/dev/ensure-planner`.
- Por defecto hace `dryRun=true` (no envía correos reales, deja trazas en BD/logs del servicio de email, según disponibilidad).

Parámetros:
- `--dryRun=true|false` (por defecto true)
- `--limit=N` (por defecto 100)
- `--minIntervalMinutes=N` (por defecto 1440 = 24h)
- `--force=true|false` (omitir rate limit por última ejecución)

Ejemplo:
```
node scripts/rsvpScheduler.js --dryRun=true --limit=50 --minIntervalMinutes=1440
```

Variables de entorno:
- `BACKEND_BASE_URL` o `VITE_BACKEND_BASE_URL` (host del backend, por defecto `http://localhost:4004`)

---

## 3) Validación de esquemas y reglas (1.2)

Archivo: `scripts/validateSchemas.js`

- Verifica que `firestore.rules` incluye las funciones clave para `seatingPlan`.
- Valida `firestore.indexes.json` y `firebase.json` si existen.

Uso:
```
npm run validate:schemas
```

---

## 4) Logs e Incidentes (1.2)

- Logs de tareas: `logs/tasks.log` (formato JSONL)
- Incidentes: `docs/incidents/YYYY-MM-DD_task_errors.md`

Plantilla por entrada:
```
### <Fecha y Hora>
- **Tarea:** <ID>
- **Error:** <Mensaje>
- **Acciones:** Reintentos x3, health-check fallido, notificaciones enviadas.
```

---

## 5) Consejos
- Mantén `roadmap.json` con `status=pending|in_progress|completed`.
- Opcional: añade `sprint` (número), `priority` (número; menor = más prioritario) y `blockedBy` (array de ids) para facilitar ejecución ordenada y respetar dependencias.
- Script helper: `node scripts/roadmapOrder.js --check|--write` para validar o reordenar el roadmap según estos criterios.
- Revisa `.env.example` para Slack/SMTP y completa tus credenciales en `.env` o variables del sistema.
- El backend ya expone `GET /metrics` (si `prom-client` está instalado) y `GET /health`.


