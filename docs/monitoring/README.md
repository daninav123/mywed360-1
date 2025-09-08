
## Paneles sugeridos de Grafana

### Seating: asignaciones y bloqueos
- Importar `docs/monitoring/grafana/seating-assignments.json`.
- Consultas principales del panel:
  - Asignaciones vs bloqueos por tipo de evento:
    - `sum(rate(seating_assignments_total[5m])) by (result, tab)`
  - Total asignaciones:
    - `sum(increase(seating_assignments_total[1h])) by (result)`

### HTTP Overview / Errors & Latency
- Ya incluidos: `http-overview.json` y `errors-latency.json`.
# Monitorización MyWed360

Esta guía te permite desplegar Prometheus + Grafana + Alertmanager para monitorizar el backend (Express) y opcionalmente comprobar `/health` del frontend/backend con blackbox_exporter.

## Requisitos
- Backend expone métricas en `GET /metrics` (ya integrado en `backend/index.js`).
  - Si `prom-client` no está instalado, `/metrics` devolverá 503 (degradación controlada).
- Archivos de configuración incluidos en este repo:
  - `docs/monitoring/prometheus.yml`
  - `docs/monitoring/alerting_rules.yml`
  - `docs/monitoring/alertmanager.yml` (plantilla)
  - `docs/monitoring/grafana/http-overview.json` (dashboard base)

## Pasos rápidos (local / laboratorio)
1) Ajusta `docs/monitoring/prometheus.yml`:
   - Reemplaza `localhost:4004` por el host:puerto real de tu backend si es distinto.
   - Si usas blackbox_exporter, valida la dirección `localhost:9115` o cámbiala.

2) Arranca Prometheus apuntando a `prometheus.yml`.
   - Ejemplo (manual):
     - Descarga Prometheus para tu SO
     - `./prometheus --config.file=docs/monitoring/prometheus.yml`

3) (Opcional) Arranca Alertmanager y carga `alertmanager.yml`.
   - Define Slack y/o SMTP en `alertmanager.yml` (o variables/env según despliegue).

4) Arranca Grafana y añade Prometheus como datasource.
   - Importa el dashboard `docs/monitoring/grafana/http-overview.json`.

## Métricas expuestas
- `http_requests_total{method,route,status}` (Counter)
- `http_request_duration_seconds{method,route,status}` (Histogram)
- Métricas por defecto de `prom-client` si está instalado.

### Métricas de dominio
- RSVP
  - `rsvp_update_status_total{status}`
  - `rsvp_reminders_total{type}` donde type ∈ attempted|sent|skipped|errors|failed
- Seating
  - `seating_assignments_total{result,tab}` donde result ∈ success|blocked y tab ∈ ceremony|banquet

## Reglas de alerta incluidas
Archivo: `docs/monitoring/alerting_rules.yml`

- HighErrorRate
  - `increase(http_requests_total{status=~"5.."}[5m]) > 5` durante 1m
  - `severity: warning`
- SlowRequestsP95
  - `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 1` durante 2m
  - `severity: warning`

## Alertmanager (plantilla)
Archivo: `docs/monitoring/alertmanager.yml`

- Incluye rutas y receptores para Slack y SMTP (plantilla, sin credenciales).
- Ajusta `slack_api_url` y SMTP según tu entorno.

## Endpoints de salud
- Backend: `GET /health` (ya implementado)
- Frontend: si tu front expone `/health`, puedes añadirlo al job `blackbox-http` en `prometheus.yml`.

## Buenas prácticas
- Revisa los buckets del histograma según tus SLOs.
- Añade etiquetas de negocio (p. ej., `route` más estable si usas middlewares).
- Exporta métricas de dominios específicos (correo, seating) con contadores propios para mayor detalle.

## Troubleshooting
- `/metrics` devuelve 503: instala `prom-client` o comprueba que no se eliminó la ruta.
- No aparecen métricas de rutas: asegura que las peticiones alcanzan el backend y el `metrics` middleware está antes de las rutas.
- Grafana no grafica p95: valida que `http_request_duration_seconds_bucket` existe; si no, `prom-client` no se cargó.
