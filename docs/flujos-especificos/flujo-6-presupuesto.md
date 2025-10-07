# 6. Gestion de Presupuesto (estado 2025-10-07)

> Implementado: `src/pages/Finance.jsx`, componentes `src/components/finance/BudgetManager.jsx`, `FinanceOverview.jsx`, `FinanceCharts.jsx`, `BudgetAlerts.jsx`, hooks `useFinance` y `useSupplierBudgets`.
> Pendiente: integracion bancaria/Open Banking, analitica predictiva con IA, gestion completa de aportaciones, reportes exportables y automatizacion de alertas.

## 1. Objetivo y alcance
- Consolidar configuracion del presupuesto total y por categoria para cada evento (`eventType` = `boda` | `evento`).
- Registrar gastos, aportaciones y pagos a proveedores con estados de seguimiento, adaptando etiquetas segun el tipo de evento.
- Ofrecer visualizaciones en tiempo real que permitan detectar desviaciones y oportunidades de ahorro.
## 2. Trigger y rutas
- Menú inferior → pestaña **Finanzas** (`/finanzas`, `Finance.jsx`) con tabs Presupuesto, Transacciones y Reportes.
- Widgets del dashboard (`BudgetWidget`) enlazan a `/finanzas/resumen`.
- Atajos desde Proveedores (`GestionProveedores.jsx`) al registrar presupuestos confirmados.

## 3. Paso a paso UX
1. Configuracion inicial
   - Definir presupuesto total y moneda, ajustar porcentajes por categoria en `BudgetManager`.
   - Plantillas por defecto (venue, catering, fotografia, flores, musica, vestido, transporte, otros) editables.
   - IA sugerida (tooltip) cuando el owner indica que no conoce el presupuesto.
2. Registro y control de gastos
   - Formulario de transaccion con concepto, monto, categoria, proveedor, metodo de pago y archivos adjuntos.
   - Soporte para estados `planificado`, `pendiente`, `parcial`, `pagado` y alertas automaticas por sobrepresupuesto.
   - Importacion CSV/Excel con previsualizacion y mapeo de columnas.
3. Seguimiento y reportes
   - `FinanceOverview` muestra progreso por categoria, alertas, proyeccion de gasto y timeline.
   - `FinanceCharts` resume distribucion, tendencia mensual y categorias criticas.
   - Exportacion prevista a PDF/CSV desde modales de reportes.

## 4. Persistencia y datos
- Firestore `weddings/{id}/budget`: total, moneda, categorias (budgeted/spent/percentage), configuracion de alertas.
- `weddings/{id}/transactions`: lista de gastos con metadatos (`status`, `attachments`, `providerId`).
- `weddings/{id}/contributions`: aportaciones prometidas y recibidas (nombre, monto, estado, metodo).
- `financeStats` agregados para dashboards (`totalBudget`, `totalSpent`, `forecast`).

## 5. Reglas de negocio
- Suma de porcentajes por categoria debe igualar 100%; UI bloquea guardar si no coincide.
- Gastos no pueden exceder limites negativos; se registra sobrepresupuesto pero nunca se trunca cantidad.
- Solo owner o planner puede editar presupuesto total; assistants pueden registrar gastos pero no borrar categorias.
- Al actualizar categoria se recalcula `totalBudget` y se disparan hooks de notificacion.

## 6. Estados especiales y errores
- Si no hay presupuesto configurado se muestra CTA "Configura tu presupuesto".
- Importacion CSV valida duplicados y formatos, mostrando filas con error para correccion.
- Errores Firestore -> toast y rollback optimista.
- Alertas de red (`offline`) muestran banner con modo solo lectura.

## 7. Integracion con otros flujos
- Flujo 2 usa presupuesto para seeds iniciales y recomendaciones de IA.
- Flujo 5 (proveedores) sincroniza presupuestos ofertados y estado de contratos.
- Flujo 6 conecta con timeline de pagos y tareas automaticas (Flujo 5b).
- Flujo 17 considera `budgetProgress` para puntos y logros; Flujo 12 envia notificaciones de sobrepresupuesto.

## 8. Metricas y monitorizacion
- Eventos: `budget_configured`, `budget_category_updated`, `transaction_logged`, `budget_over_threshold`.
- Seguimiento de tiempo desde configuracion hasta primer gasto, y porcentaje de usuarios con alertas activas.
- Telemetria planificada para importaciones (exitosas/fallidas) y uso de aportaciones.

## 9. Pruebas recomendadas
- Unitarias: reducers/hook `useFinance`, `BudgetManager` validaciones, `BudgetAlerts`.
- Integracion: guardar presupuesto -> leer en `FinanceOverview`, sincronizar transacciones con widgets.
- E2E: configurar presupuesto, registrar gasto con adjunto, verificar alerta, importar CSV con errores y corregir.

## 10. Checklist de despliegue
- Reglas Firestore actualizadas para colecciones `budget`, `transactions`, `contributions`.
- Revisar limites de seguridad en Cloud Functions de exportacion y notificaciones.
- Configurar variables `VITE_ENABLE_FINANCE_ALERTS`, `MAILGUN_*` si se envian avisos por email.
- Asegurar migracion de bodas antiguas para poblar nuevas llaves (`alertThresholds`, `contributions`).

## 11. Roadmap / pendientes
- Integracion Open Banking / sincronizacion bancaria con categorizacion IA.
- Reportes descargables (PDF/Excel) listos para proveedores y contabilidad.
- Gestion completa de aportaciones (recordatorios, agradecimientos, panel compartido).
- Prediccion de gasto y recomendaciones automaticas.
- Automatizacion de pagos programados y conciliacion con contratos.
