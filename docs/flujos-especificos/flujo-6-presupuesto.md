# 6. Gestion de Presupuesto (estado 2025-10-08)

> Implementado: `src/pages/Finance.jsx`, componentes `src/components/finance/BudgetManager.jsx`, `FinanceOverview.jsx`, `FinanceCharts.jsx`, `PaymentSuggestions.jsx`, `TransactionManager.jsx`, hooks `useFinance`, `useSupplierBudgets`, servicios `EmailInsightsService`, `bankService`, `SyncService`.
> Pendiente: importación CSV/Excel con mapeo, analítica predictiva con IA, ampliación de aportaciones colaborativas, reportes exportables y automatización de alertas avanzadas.

## 1. Objetivo y alcance
- Consolidar configuracion del presupuesto total y por categoria para cada evento (`eventType` = `boda` | `evento`).
- Registrar gastos, aportaciones y pagos a proveedores con estados de seguimiento, adjuntos y orígenes multicanal (manual, email insights, importación bancaria).
- Ofrecer visualizaciones en tiempo real que permitan detectar desviaciones, proyecciones de liquidez y oportunidades de ahorro.
- Auto-categorizar gastos y sugerir proveedores cuando falta información, para acelerar el alta masiva.

## 2. Trigger y rutas
- Menú inferior → pestaña **Finanzas** (`/finanzas`, `Finance.jsx`) con tabs Presupuesto, Transacciones, Aportaciones y Análisis.
- Widgets del dashboard (`BudgetWidget`) enlazan a `/finanzas/resumen`.
- Atajos desde Proveedores (`GestionProveedores.jsx`) al registrar presupuestos confirmados.
- Panel de sugerencias en Transacciones (`PaymentSuggestions`) que extrae posibles pagos desde email (flujo 3) y permite registrar con un click.

## 3. Paso a paso UX
1. Configuracion inicial
   - Definir presupuesto total y moneda, ajustar porcentajes por categoria en `BudgetManager`.
   - Plantillas por defecto (venue, catering, fotografia, flores, musica, vestido, transporte, otros) editables.
   - Tooltip con recomendación de IA cuando el owner indica que no conoce el presupuesto.
2. Registro y control de gastos
   - Formulario de transaccion con concepto, monto, categoria, proveedor (matching automático), metodo de pago, adjuntos y seguimiento (`paidAmount`, `dueDate`).
   - Estados soportados:
     - Gastos (`type="expense"`): `pending` (pendiente), `partial` (pago parcial con `paidAmount` > 0) y `paid` (se fuerza `paidAmount = amount`).
     - Ingresos (`type="income"`): `expected` (previsto, `paidAmount` opcional) y `received` (recibido, normaliza `paidAmount = amount` si estaba vacío).
   - Cambios de estado ajustan automáticamente `paidAmount` para evitar inconsistencias.
   - Sugerencias automáticas desde correo (`PaymentSuggestions`) con pre-llenado de datos y conciliación con proveedores existentes.
   - Importación bancaria (si existe cuenta vinculada) usando `bankService`; importación CSV/Excel visible pero aún sin lógica (botones deshabilitados).
3. Seguimiento y reportes
   - `FinanceOverview` muestra progreso por categoria, alertas, proyeccion de gasto/ingreso y timeline, con enlaces de filtrado hacia Transacciones.
   - `FinanceCharts` resume distribucion, tendencia mensual y categorias criticas.
   - Proyección financiera (`useFinance.projection`) distribuye aportaciones mediante una curva Beta (entre invitaciones y boda) con cola geométrica 30 días post evento; mezcla ingresos mensuales/extra con pagos pendientes (`dueDate`).
   - Exportacion a PDF/CSV planificada (no implementada).
4. Aportaciones
   - `ContributionSettings` captura aportaciones iniciales y mensuales de cada persona, extras y regalos por invitado, sincronizando el número de asistentes desde `weddingInfo`.
   - Los datos alimentan proyecciones y el cálculo de ingresos esperados/`expectedIncome`.

## 4. Persistencia y datos
- Firestore `weddings/{id}/finance/main`: documento único con:
  - `budget`: `{ total: number, categories: Array<{ name: string, amount: number, muted?: boolean }> }`. El flag `muted` desactiva alertas de una categoría sin eliminarla.
  - `settings.alertThresholds`: `{ warn: number, danger: number }` (por defecto 75/90) usado por barras de progreso y alertas visuales.
  - `contributions`: `{ initA, initB, monthlyA, monthlyB, extras, giftPerGuest, guestCount }`.
  - Fechas clave (`weddingTimeline`) derivadas en runtime desde `weddingInfo`.
- Firestore `weddings/{id}/transactions`: subcolección con transacciones normalizadas (`type`, `status`, `amount`, `paidAmount`, `dueDate`, `category`, `provider`, `attachments[]`, `source`, `createdAt`, `meta` opcional).
- Adjuntos se guardan como `{ filename, url, storagePath, size, uploadedAt }`. El formulario envía `attachments: { keep: Attachment[], newFiles: File[] }`, y `useFinance` sube los nuevos archivos a `finance/{weddingId}/...` antes de unirlos.
- Campo `source` acepta `manual`, `email` o `bank` y alimenta métricas, filtros y limpieza de sugerencias.
- `SyncService` guarda copia local (`movements`), limita a ~200 ítems y vuelve a sincronizar al recuperar conexión. Tras crear/actualizar se ejecuta `window.dispatchEvent(new Event('mywed360-movements'))` para rehidratar widgets offline.
- Firestore `weddings/{id}/finance/accounts`: documento opcional con `primaryAccountId` para detectar conexión bancaria.
- `EmailInsightsService` consume `/api/email-insights/{mailId}` (REST) y mantiene resultados en memoria (no persiste en Firestore).
- `financeStats` agregados (`totalBudget`, `totalSpent`, `forecast`) planificados; aún sin persistencia.

## 5. Reglas de negocio
- Suma de porcentajes por categoria debe igualar 100%; la UI bloquea guardar si no coincide.
- Gastos no pueden exceder limites negativos; se registra sobrepresupuesto pero nunca se trunca cantidad.
- Solo owner o planner puede editar presupuesto total; assistants pueden registrar gastos pero no borrar categorias.
- Al actualizar categoria se recalcula `totalBudget` y se disparan hooks de notificacion.
- Auto-categorización: si no se define categoría o es genérica (`OTROS`), `AUTO_CATEGORY_RULES` infiere una categoría con base en concepto/proveedor.
- Matching de proveedores por email, dominio o coincidencia en asunto (sugerencias desde correo) y limpieza de la sugerencia una vez registrada la transacción.
- Conexión bancaria requiere `VITE_BANK_API_BASE_URL` y `VITE_BANK_API_KEY`; sin variables se devuelve lista vacía y se muestra CTA de conexión.
- `settings.alertThresholds.warn/danger` determinan el cambio de color en barras y la generación de alertas (`FinanceOverview`, `BudgetManager`).

## 6. Estados especiales y errores
- Si no hay presupuesto configurado se muestra CTA "Configura tu presupuesto".
- Importacion CSV: botones visibles pero deshabilitados; pendiente de implementación (mostrar aviso “Próximamente” when hovered).
- Errores Firestore -> toast y rollback optimista.
- Alertas de red (`offline`) muestran banner con modo solo lectura.
- Sugerencias de email: si `VITE_EMAIL_INSIGHTS_*` falta o la API responde error, se registra `console.warn`, se muestra mensaje “No se pudieron cargar las sugerencias” y no se reintenta automáticamente.
- Importación bancaria:
  - Sin `finance/accounts.primaryAccountId`: CTA “Conectar banco” (`hasBankAccount=false`).
  - Con ID pero sin variables `VITE_BANK_API_*`: se mantiene CTA y se avisa en consola (estado “conexión pendiente”).
  - Errores HTTP → `hasBankAccount=false`, toast genérico y `console.warn`, sin bloquear la vista.

## Alertas de presupuesto
- Umbrales: `settings.alertThresholds.warn` (75 % por defecto) colorea progreso en ámbar y agrega la categoría a la tarjeta de alertas; `danger` (90 % por defecto) cambia a rojo y marca el estado como crítico.
- Visualización: `FinanceOverview` renderiza la tarjeta “Alertas de Presupuesto” listando cada categoría sobre los umbrales con enlace a Transacciones filtrado por categoría y tipo de gasto. Los chips de estado por categoría usan los mismos colores.
- `BudgetManager` replica la lógica de colores en las barras de progreso para mantener consistencia visual, pero no muestra mensajes adicionales.
- `BudgetAlerts.jsx` quedó obsoleto y no se monta en `Finance.jsx`; el comportamiento oficial es el de `FinanceOverview`.

## 7. Integracion con otros flujos
- Flujo 2 usa presupuesto para seeds iniciales y recomendaciones de IA.
- Flujo 3 aporta correos y contactos para el matching automático de proveedores (sugerencias de email).
- Flujo 5 (proveedores) sincroniza presupuestos ofertados y estado de contratos.
- Flujo 6 conecta con timeline de pagos y tareas automáticas (Flujo 5b).
- Flujos 11A/11B/11C usan pagos confirmados para protocolo (celebrante, permisos, música).
- Flujo 17 considera `budgetProgress` para puntos y logros; Flujo 12 envia notificaciones de sobrepresupuesto.

## 8. Metricas y monitorizacion
- Eventos: `budget_configured`, `budget_category_updated`, `transaction_logged`, `budget_over_threshold`, `payment_suggestion_used`, `bank_import_triggered`.
- Seguimiento de tiempo desde configuracion hasta primer gasto, porcentaje de usuarios con alertas activas, adopción de fuentes (`source = email/bank`).
- Telemetria planificada para importaciones CSV (exitosas/fallidas), uso de aportaciones y precisión de la proyección financiera (gaps actuales).

## 9. Pruebas recomendadas
- Unitarias: `useFinance` (reducers, proyección beta+geométrica, auto-categoría), `BudgetManager` validaciones, `PaymentSuggestions` (parseo correos), `TransactionForm` (transiciones de estado/adjuntos), `bankService` (credenciales faltantes).
- Integracion: guardar presupuesto → leer en `FinanceOverview`, registrar sugerencia de email, sincronizar transacciones con widgets, importar movimientos bancarios simulados.
- E2E: configurar presupuesto, registrar gasto con adjunto, verificar alerta de categoría, procesar sugerencia de email, simular error de API bancaria y validar fallback.

## 10. Checklist de despliegue
- Reglas Firestore actualizadas para `finance/main`, subcolección `transactions` y almacenamiento de adjuntos (`finance/` en Storage).
- Revisar limites de seguridad en Cloud Functions de exportacion y notificaciones.
- Configurar variables `VITE_ENABLE_FINANCE_ALERTS`, `MAILGUN_*`, `VITE_BANK_API_BASE_URL`, `VITE_BANK_API_KEY`, `VITE_EMAIL_INSIGHTS_*`.
- Asegurar migracion de bodas antiguas para poblar `finance/main` con nuevas llaves (`alertThresholds`, `contributions`) y mover adjuntos a rutas `finance/`.
- Verificar permisos de storage y tokens para Email Insights / Open Banking, y limpiar colas pendientes en `SyncService` antes de despliegue.

## 11. Roadmap / pendientes
- Integracion Open Banking: UI de autenticación, refresco de tokens, categorización inteligente, reconciliación automática.
- Importación CSV/Excel con preview y mapeo de columnas (validaciones server-side).
- Reportes descargables (PDF/Excel) listos para proveedores y contabilidad.
- Gestion completa de aportaciones (recordatorios, agradecimientos, panel compartido).
- Prediccion de gasto y recomendaciones automaticas basadas en proyección.
- Automatizacion de pagos programados y conciliacion con contratos.
- Adjuntos en `TransactionForm` aceptan `image/*, application/pdf, .doc, .docx, .xls, .xlsx`. Otros tipos se bloquean en la carga de archivos.
