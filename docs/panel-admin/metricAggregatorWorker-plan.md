# Plan de alineacion backend: metricAggregatorWorker e insightsBackfillTask

## 1. Objetivo
- Tener un pipeline unico que consolide eventos provenientes de `performanceMonitor`, colecciones Firestore y datasets batch (p. ej. `aiBudgetAdvisorSessions`) para alimentar `/api/project-metrics`.
- Garantizar que las tareas backend y frontend comparten esquema, SLA y contratos de respuesta antes de publicar `/analytics/project`.

## 2. Alcance de la primera iteracion
- **metricAggregatorWorker**
  - Fuente: cola diaria `performanceMonitor` (via `api/project-metrics:POST`) + lecturas incrementales de colecciones clave (`finance/main`, `emailMetrics`, `gamification`, `analytics/websiteEvents`, `publicSites`).
  - Destino: coleccion `projectMetrics/{weddingId}/{module}/{period}` (documentos diarios) + export a BigQuery `project_metrics.daily`.
  - Frecuencia: cada 15 minutos en prod, cada hora en staging.
  - SLA: <5 min desde evento hasta agregado disponible, con reintentos exponenciales hasta 3 veces.
- **insightsBackfillTask**
  - Proposito: recalcular historicos (90 dias) cuando se ajusta el esquema o se agrega un nuevo modulo.
  - Trigger manual (`gcloud scheduler`) y via API autenticada `/admin/metrics/backfill?module=...`.
  - Respeta cuotas Firestore/BigQuery (lotes de 500 documentos, sleep 200 ms).

## 3. Responsables y dependencias
| Area | Responsable | Entregable | Fecha objetivo |
|------|-------------|------------|----------------|
| Backend | Equipo Platform | Cloud Function `metricAggregatorWorker` (Node 20) con configuracion de Scheduler | 2025-10-21 |
| Backend | Equipo Platform | Cloud Task `insightsBackfillTask` + endpoint `/admin/metrics/backfill` con auth `support` | 2025-10-28 |
| Datos | Data Eng | Dataset BigQuery `project_metrics` + tabla `daily` y `module_summary` | 2025-10-23 |
| Frontend | Core App | Actualizar `MetricsDashboard` para consumir `/api/project-metrics?module=...` | 2025-10-24 |
| QA | QA Automation | Tests de contrato (`/api/project-metrics GET/POST`) y job replay controlado | 2025-10-27 |

## 4. Contratos de API propuestos
### POST `/api/project-metrics`
```json
{
  "weddingId": "w123",
  "module": "finance",
  "event": "budget_over_threshold",
  "payload": {
    "categoryId": "venue",
    "percentage": 0.92,
    "timestamp": "2025-10-14T10:03:22.000Z"
  },
  "meta": {
    "source": "performanceMonitor",
    "version": "1.0.0"
  }
}
```
- Respuesta `202 Accepted`; el worker lee de Pub/Sub o cola interna y agrega al documento del dia.

### GET `/api/project-metrics`
- Query params: `weddingId`, `module`, `range=7d|30d|90d`, `groupBy=daily|weekly`.
- Respuesta ejemplo:
```json
{
  "weddingId": "w123",
  "module": "finance",
  "range": "7d",
  "groupBy": "daily",
  "points": [
    {"date": "2025-10-08", "alerts": 2, "transactions": 14, "overBudget": 1},
    ...
  ],
  "refreshedAt": "2025-10-14T10:05:00.000Z",
  "source": "metricAggregatorWorker"
}
```

## 5. Esquema en Firestore
```
projectMetrics/{weddingId}/modules/{module}/daily/{YYYY-MM-DD}
  totals: { alerts: 2, events: 45, errors: 1 }
  breakdown:
    - key: "budget_over_threshold"
      count: 1
      lastEventAt: Timestamp
    - key: "email_bounced"
      count: 3
  metadata:
    computedAt: Timestamp
    version: "2025.10.1"
```

## 6. BigQuery
- Dataset: `project_metrics`
- Tabla `daily`:
  - `event_date` DATE
  - `wedding_id` STRING
  - `module` STRING
  - `metric_key` STRING
  - `metric_value` INT64
  - `source` STRING (default `metricAggregatorWorker`)
  - `ingested_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- Tabla `module_summary`: vista materializada (agrega por semana/mes).

## 7. Plan de pruebas
1. Unit tests en backend para normalizar eventos (`normalizeEvent`, `mergeAggregates`).
2. Test de integracion con Firestore emulado (seed de 3 bodas dummy).
3. E2E: simular evento via POST, verificar agregador, consumir GET, validar tablero (Cypress `metrics-dashboard.cy.js` pendiente).
4. Backfill: ejecutar `insightsBackfillTask` en staging con dataset reducido, comparar totales vs export manual.

## 8. Riesgos y mitigaciones
- **Cuotas Firestore**: usar lotes y cache local, registrar `readCount` en logs.
- **Eventos duplicados**: deduplicar por `eventId` opcional y timestamp (ventana 10 min).
- **Desincronizacion FE**: versionar la respuesta (`meta.version`), fallback a modo in-memory si API falla.
- **Costes BigQuery**: particionar por fecha, limitar backfill a rango solicitado, monitorizar bytes procesados.

## 9. Acciones inmediatas
1. Backend prepara PR con Cloud Functions + Scheduler (rama `feature/metrics-aggregator`).
2. Data Engineering habilita dataset BigQuery y credenciales de servicio (`METRICS_BIGQUERY_SA`).
3. Frontend ajusta `MetricsDashboard` para autodetectar si `/api/project-metrics` responde; mientras tanto mantiene modo local.
4. QA define test contract en Postman/newman y script de seed para staging.
5. Reunión de handoff (Platform + Core App + Data) 2025-10-16 16:00 CET para validar timeline.
