# 23. Métricas del Sistema (estado 2025-10-07)

> Implementado hoy: componentes de diagnóstico `components/metrics/MetricsDashboard.jsx` y `components/admin/MetricsDashboard.jsx` centrados en estadísticas de email, dependencias `emailMetricsService` y `performanceMonitor`.
> Pendiente: dashboard unificado multi-módulo, workers de agregación (`metricAggregatorWorker`/`insightsBackfillTask`) y rutas `/analytics/*`.

## 1. Objetivo y alcance
- Mostrar métricas de correo (volumen enviado, resultados de entregabilidad) para soporte/QA.
- Servir como base para un futuro dashboard global (proveedores, presupuesto, engagement).

## 2. Trigger y rutas
- No existe ruta pública; los componentes se renderizan en páginas internas/admin cuando se habilitan manualmente (`<MetricsDashboard />`).
- `/analytics/project` y la navegación “Analítica” aún no están implementadas.

## 3. Paso a paso UX (estado actual)
1. **Métricas de email**
   - `components/metrics/MetricsDashboard.jsx` muestra gráficos (Bar/Line/Pie de Recharts) con datos derivados de `performanceMonitor`.
   - Requiere inyectar manualmente datos (mock) o implementar `performanceMonitor.fetchMetrics()`.
2. **Panel admin**
   - `components/admin/MetricsDashboard.jsx` amplía la vista para uso interno (análisis QA, exportación CSV).
   - Incluye filtros, refresco manual y visualización agregada, pero no está enlazado a rutas.

## 4. Persistencia y datos
- No hay colección Firestore específica; los componentes esperan un servicio `performanceMonitor` o APIs `/api/email-metrics` (pendiente).
- Datos reales deben venir del backend de email (Mailgun) o logs; el repositorio sólo contiene mocks/stubs.

## 5. Reglas de negocio
- Uso restringido a personal interno hasta que exista dashboard formal.
- No se deben exponer métricas agregadas al usuario final sin autenticación adicional.

## 6. Estados especiales y errores
- Si `performanceMonitor` no devuelve datos → se muestran mensajes “Sin datos”.
- Error de fetch → se sugiere reintentar; UI actual es tolerante (no rompe app).

## 7. Integración con otros flujos (futuro)
- Flujo 5/6/7 (Proveedores, Finanzas, Email) alimentarán métricas cuando existan agregados.
- Flujo 17 (Gamificación) podría usar métricas para puntos; todavía sin integración.

## 8. Métricas y monitorización
- Actualmente no hay métricas instrumentadas; se espera backend para recolectar datos (Prometheus, BigQuery, etc.).

## 9. Pruebas recomendadas
- Unitarias: helpers del componente (formatters, transformaciones de datos mock).
- Integración: render con datos de ejemplo, verificar gráficos y filtros.


## Cobertura E2E implementada
- `cypress/e2e/performance/email-performance.cy.js`: verifica la generación de métricas de comunicación y paneles relacionados.
- `cypress/e2e/finance/finance-analytics.cy.js`: cubre el tablero analítico compartido que alimenta indicadores de proyecto.

## 10. Checklist de despliegue
- Definir APIs reales (`/api/email-metrics`, `/api/project-metrics`) antes de exposición en UI.
- Proteger la ruta futura con permisos (owner/planner/admin).
- Validar visualizaciones con datos reales y asegurar privacidad.

## 11. Roadmap
- Implementar workers (`metricAggregatorWorker`, `insightsBackfillTask`) y persistencia `supplierInsights`/`projectMetrics`.
- Crear ruta `/analytics/project` con dashboard consolidado y alertas configurables.
- Añadir exportación, comparativas multi-boda y panel público para planners.
