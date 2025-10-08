# 23. Métricas del Proyecto (estado 2025-10-07)

> Implementado: `ProjectMetricsDashboard.jsx`, `SupplierInsightsService.js`, `UserEngagementService.js`, `MetricSnapshotsTable.jsx`, `MetricComparisonCard.jsx`, `MetricAlertsPanel.jsx`, jobs `metricAggregatorWorker`, `insightsBackfillTask`, colecciones `supplierInsights`, `projectMetrics`, `userEngagement`.
> Pendiente: segmentación avanzada por cohortes, correlación cruzada IA entre módulos y exportaciones personalizadas de métricas.

## 1. Objetivo y alcance
- Consolidad métricas críticas del proyecto en un hub único para planners y owners (rendimiento de proveedores, adopción de funcionalidades, salud financiera).
- Centralizar datos históricos multi-boda (proveedores, usuarios, tareas, emails) y habilitar comparativas contra promedios globales.
- Proveer alertas proactivas cuando métricas clave se desvíen de los umbrales definidos por el planner o por heurísticas IA.

## 2. Trigger y rutas
- Menú lateral → sección **Analítica** → “Métricas del proyecto” (`/analytics/project`, render `ProjectMetricsDashboard.jsx`).
- Acceso contextual desde flujo 5 (botón “Ver comparativa global” en `ProveedorDetalle`) y desde flujo 17 (gamificación → enlace a desempeño del proyecto).
- API interna `/api/metrics/*` expone endpoints de lectura (autenticación requerida, roles owner/planner).

## 3. Paso a paso UX
1. Vista general
   - `ProjectMetricsDashboard` se divide en tarjetas de KPIs (presupuesto vs real, proveedores confirmados, emails abiertos, tareas críticas) y un gráfico temporal de progreso.
   - `MetricComparisonCard` muestra para cada proveedor seleccionado el precio medio, ratio de respuesta y satisfacción comparados con el promedio global (`supplierInsights`) y el percentil del mercado.
   - `MetricAlertsPanel` lista alertas activas (ej. “Proveedor X con contratos retrasados”, “Uso de emails IA por debajo del promedio”).
2. Métricas por proveedor
   - Tabla `MetricSnapshotsTable` agrupa cada proveedor con sus líneas de servicio y estadísticas cruzadas (tiempo medio hasta contrato, presupuesto cerrado, valoración post-boda).
   - Botón “Ver detalle” abre drawer con histórico de la métrica y eventos relevantes (integrado con `SupplierEventBridge`). Permite fijar umbrales personalizados.
3. Métricas de usuarios
   - Sección “Engagement” muestra gráficos de uso (inicios de sesión, interacción con timeline, tareas completadas) y segmentación por rol (owner vs planner vs assistant).
   - `UserEngagementService` calcula la puntuación de actividad (`activityScore`), detecta caídas de uso y sugiere next-best-actions (enviar resumen, asignar checklist).
4. Configuración y alertas
   - Modal `MetricAlertConfigModal` permite definir reglas (métrica, condición, umbral, acción: notificación, tarea, email). Las reglas se persisten en `projectMetrics/{metricId}/rules`.
   - Sección “Backfill” muestra estado de sincronización y última ejecución de `insightsBackfillTask` para monitorizar datos históricos.

## 4. Persistencia y datos
- Colección global `supplierInsights/{supplierId}`: `{ supplierId, services[], avgBudget, avgResponseTime, satisfactionScore, weddingsServed, lastUpdated, history[] }`.
- Colección por boda `projectMetrics/{weddingId}/snapshots/{date}` con agregados diarios (proveedores activos, presupuesto ejecutado, correos enviados/leídos, tareas abiertas).
- Colección `userEngagement/{weddingId}/{userId}` con métricas de actividad (logins, tareas completadas, emails enviados, IA usage).
- Subcolección `projectMetrics/{weddingId}/rules/{ruleId}` define alertas configurables.
- `metricAggregatorWorker` escribe snapshots; `insightsBackfillTask` recalcula métricas históricas al cerrar líneas de servicio o bodas.

## 5. Reglas de negocio
- Solo roles owner/planner pueden acceder a métricas; assistants ven versión resumida sin promedios globales.
- Al cerrar una línea de servicio (Flujo 5) se envía evento `supplier_line_closed` que actualiza `supplierInsights` y la snapshot del día.
- Si un proveedor no tiene `supplierId` global se bloquea la actualización y se genera tarea “Normalizar proveedor” en Flujo 5.
- Métricas de usuarios se recalculan cada 6 horas; cambios mayores al 20% generan alerta automática.
- Alertas configuradas deben especificar canal (notificación in-app, email, tarea). Reintentos limitados a 3 en caso de fallo.
- Datos agregados se mantienen anónimos para roles sin permiso de nivel Owner (se ocultan proveedores y usuarios específicos).

## 6. Estados especiales y errores
- Falta de datos históricos: dashboard muestra banner “Sin datos suficientes” y CTA para ejecutar `insightsBackfillTask`.
- Inconsistencias entre snapshots y datos actuales: se muestra alerta y opción de forzar recomputo.
- Errores de agregación (timeout) → registro en `metricErrors` con detalles y reintento exponencial.
- Desincronización de `supplierInsights` vs `projectMetrics` provoca badge rojo en la tarjeta global (mismo indicador reutilizado en flujo 5).

## 7. Integración con otros flujos
- Flujo 5 (Proveedores): envía eventos de estado y consulta `supplierInsights` para mostrar comparativas en `ProveedorDetalle`.
- Flujo 6 (Presupuesto): aporta montos reales vs estimados para las snapshots financieras y detecta desviaciones.
- Flujo 7 (Emails): provee métricas de envíos, aperturas y respuestas; comparte el flag de pendientes para el puntito rojo.
- Flujo 14 (Checklist): genera métricas de tareas abiertas/cerradas y recibe alertas cuando el backlog se dispara.
- Flujo 17 (Gamificación): usa las métricas para otorgar puntos, mientras que el dashboard retorna recomendaciones para quests.
- Flujo 21 (Existente) y 22 reutilizan indicadores y pueden suscribirse a `metricAggregatorWorker`.

## 8. Métricas y monitorización
- Eventos: `metric_snapshot_generated`, `supplier_insight_updated`, `engagement_score_computed`, `metric_alert_triggered`, `metric_alert_failed`.
- KPIs: precisión de agregación (<2% diferencia vs dato fuente), tiempo promedio de actualización (<5 min), ratio de alertas atendidas, adopción de panel (sesiones por semana).
- Monitorización Prometheus/Logs: latencia del worker, fallos por proveedor, backlog de tareas programadas.

## 9. Pruebas recomendadas
- Unitarias: agregadores de `SupplierInsightsService`, cálculo de engagement, normalización de snapshots.
- Integración: cerrar línea de servicio → actualizar insights → reflejar en dashboard; crear regla de alerta → recibir notificación al superar umbral.
- E2E: planner revisa métricas, detecta anomalía, ajusta proveedor desde flujo 5 y verifica actualización en dashboard.

## 10. Checklist de despliegue
- Configurar jobs `metricAggregatorWorker` y `insightsBackfillTask` en entorno productivo (cron + permisos).
- Crear índices en Firestore (`supplierInsights`, `projectMetrics`, `userEngagement`) para consultas por `weddingId`, `supplierId`, `date`.
- Revisar reglas de seguridad: lectura solo para roles permitidos, escritura limitada a workers y servicios autorizados.
- Monitorear primera semana de datos y validar consistencia con analítica manual.

## 11. Roadmap / pendientes
- Segmentación por cohortes (temporada, estilo de boda, tamaño del evento).
- Correlación IA para detectar impacto de cada proveedor en satisfacción final.
- Exportaciones personalizadas (CSV/BI) con filtros avanzados.
- Dashboard público resumido para planners con múltiples bodas.
- Recomendaciones automatizadas de mejoras (ej. “subir presupuesto de catering según histórico”). 
