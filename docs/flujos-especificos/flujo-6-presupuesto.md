# 6. Gestion de Presupuesto (estado 2025-10-08)

> Implementado: `src/pages/Finance.jsx`, componentes `src/components/finance/BudgetManager.jsx`, `FinanceOverview.jsx`, `FinanceCharts.jsx`, `PaymentSuggestions.jsx`, `TransactionManager.jsx`, hooks `useFinance`, `useSupplierBudgets`, servicios `EmailInsightsService`, `bankService`, `SyncService`.
> Pendiente: importaciÃ³n CSV/Excel con mapeo, analÃ­tica predictiva con IA, ampliaciÃ³n de aportaciones colaborativas, reportes exportables y automatizaciÃ³n de alertas avanzadas.

## 1. Objetivo y alcance
- Consolidar configuracion del presupuesto total y por categoria para cada evento (`eventType` = `boda` | `evento`).
- Registrar gastos, aportaciones y pagos a proveedores con estados de seguimiento, adjuntos y orÃ­genes multicanal (manual, email insights, importaciÃ³n bancaria).
- Ofrecer visualizaciones en tiempo real que permitan detectar desviaciones, proyecciones de liquidez y oportunidades de ahorro.
- Auto-categorizar gastos y sugerir proveedores cuando falta informaciÃ³n, para acelerar el alta masiva.

## 2. Trigger y rutas
- MenÃº inferior â†’ pestaÃ±a **Finanzas** (`/finanzas`, `Finance.jsx`) con tabs Presupuesto, Transacciones, Aportaciones y AnÃ¡lisis.
- Widgets del dashboard (`BudgetWidget`) enlazan a `/finanzas/resumen`.
- Atajos desde Proveedores (`GestionProveedores.jsx`) al registrar presupuestos confirmados.
- Panel de sugerencias en Transacciones (`PaymentSuggestions`) que extrae posibles pagos desde email (flujo 3) y permite registrar con un click.

## 3. Paso a paso UX
1. Configuracion inicial
   - Definir presupuesto total y moneda, ajustar porcentajes por categoria en `BudgetManager`.
   - Las categorias iniciales del presupuesto se generan automÃ¡ticamente a partir de los servicios marcados como necesarios en Proveedores (`wantedServices`). Si la boda solo tiene la plantilla heredada (venue, catering, fotografÃ­a, etc.) o estÃ¡ vacÃ­a, el presupuesto se repuebla con esos servicios, evitando duplicados y respetando los montos ya asignados a categorÃ­as coincidentes.
   - Tooltip con orientaciones financieras basicas cuando el owner indica que no conoce el presupuesto.
   - Boton `Abrir consejero` en cada categoria/servicio que inicia una sesion guiada con el consejero IA para recibir recomendaciones de distribucion.
2. Registro y control de gastos
   - Formulario de transaccion con concepto, monto, categoria, proveedor (matching automÃ¡tico), metodo de pago, adjuntos y seguimiento (`paidAmount`, `dueDate`).
   - Estados soportados:
     - Gastos (`type="expense"`): `pending` (pendiente), `partial` (pago parcial con `paidAmount` > 0) y `paid` (se fuerza `paidAmount = amount`).
     - Ingresos (`type="income"`): `expected` (previsto, `paidAmount` opcional) y `received` (recibido, normaliza `paidAmount = amount` si estaba vacÃ­o).
   - Cambios de estado ajustan automÃ¡ticamente `paidAmount` para evitar inconsistencias.
   - Sugerencias automÃ¡ticas desde correo (`PaymentSuggestions`) con pre-llenado de datos y conciliaciÃ³n con proveedores existentes.
   - ImportaciÃ³n bancaria (si existe cuenta vinculada) usando `bankService`; importaciÃ³n CSV/Excel visible pero aÃºn sin lÃ³gica (botones deshabilitados).
3. Seguimiento y reportes
   - `FinanceOverview` muestra progreso por categoria, alertas, proyeccion de gasto/ingreso y timeline, con enlaces de filtrado hacia Transacciones.
   - `FinanceCharts` resume distribucion, tendencia mensual y categorias criticas.
   - ProyecciÃ³n financiera (`useFinance.projection`) distribuye aportaciones mediante una curva Beta (entre invitaciones y boda) con cola geomÃ©trica 30 dÃ­as post evento; mezcla ingresos mensuales/extra con pagos pendientes (`dueDate`).
   - Exportacion a PDF/CSV planificada (no implementada).
4. Aportaciones
   - `ContributionSettings` captura aportaciones iniciales y mensuales de cada persona, extras y regalos por invitado, sincronizando el nÃºmero de asistentes desde `weddingInfo`.
   - Los datos alimentan proyecciones y el cÃ¡lculo de ingresos esperados/`expectedIncome`.
5. Consejero IA de distribucion del presupuesto
   - Objetivo: recomendar como repartir el presupuesto total entre las categorias activas segun servicios necesarios, estilo del evento y restricciones declaradas por la pareja.
   - Flujo: al pulsar `Abrir consejero`, `Finance.jsx` compila `budget`, `wantedServices`, datos del evento (`eventContext`) y el estado financiero actual (ingresos confirmados, pagos pendientes). Se envia una solicitud `POST /api/ai/budget-advisor` a una Cloud Function dedicada.
   - Payload preliminar:
     ```json
     {
       "weddingId": "abc123",
       "context": {
         "eventType": "boda",
         "guestCount": 120,
         "city": "Madrid",
         "date": "2025-06-14",
         "currency": "EUR",
         "styleNotes": "Boda urbana, enfoque gastronomico, decoracion minimalista."
       },
       "budget": {
         "total": 35000,
         "categories": [
           { "name": "Catering", "amount": 12000 },
           { "name": "Fotografia", "amount": 5000 },
           { "name": "Decoracion", "amount": 3000 }
         ]
       },
       "constraints": {
         "mustHave": ["Catering", "Fotografia", "Musica/DJ"],
         "priorities": ["Fotografia", "Experiencia invitados"],
         "maxVendors": 12
       },
       "financeStatus": {
         "incomeConfirmed": 10000,
         "incomeExpected": 12000,
         "expensesCommitted": 8000
       }
     }
     ```
   - Respuesta esperada:
     ```json
     {
       "scenarios": [
         {
           "id": "equilibrado",
           "label": "Escenario balanceado",
           "summary": "Distribuye prioridad entre gastronomia y captura de recuerdos.",
           "allocation": [
             { "category": "Catering", "percentage": 38, "notes": "Incluye prueba de menu y barra libre basica." },
             { "category": "Fotografia", "percentage": 16, "notes": "Recomienda paquete de 10 horas con segundo tirador." },
             { "category": "Decoracion", "percentage": 10, "notes": "Propone alquilar piezas destacadas en lugar de compra." }
           ],
           "alerts": ["Reserva 5% para imprevistos en proveedores creativos."]
         }
       ],
       "globalTips": [
         "Destina 8-10% a contingencias para evitar sobrecostes de ultima hora.",
         "Negocia pagos escalonados con proveedores de alto importe."
       ]
     }
     ```
   - Presentacion en UI: `BudgetManager` mostrara hasta tres escenarios (balanceado, eficiente, premium) con tablas comparativas. El usuario puede aplicar un escenario completo o aceptar recomendaciones por categoria; los cambios se marcan con `source: 'advisor'`.
   - Explicabilidad: cada sugerencia incluye notas breves justificando la distribucion y alertas sobre desviaciones frente a promedios de mercado.
   - Persistencia: `finance/main.aiAdvisor` guardara la ultima sesion (`scenarios`, `selectedScenarioId`, `requestedAt`) para auditoria y para evitar repetir recomendaciones si no hay cambios.
   - Roadmap:
     - Permitir iteraciones guiadas (el usuario ajusta prioridades y el consejero recalcula).
     - Cruzar escenarios con proveedores confirmados para detectar huecos de cobertura (flujo 5).
     - Analizar la evolucion real frente a la recomendada y generar alertas proactivas.
## 4. Persistencia y datos
- Firestore `weddings/{id}/finance/main`: documento Ãºnico con:
  - `budget`: `{ total: number, categories: Array<{ name: string, amount: number, mutedâ†’: boolean }> }`. El flag `muted` desactiva alertas de una categorÃ­a sin eliminarla.
  - `settings.alertThresholds`: `{ warn: number, danger: number }` (por defecto 75/90) usado por barras de progreso y alertas visuales.
  - `contributions`: `{ initA, initB, monthlyA, monthlyB, extras, giftPerGuest, guestCount }`.
  - Fechas clave (`weddingTimeline`) derivadas en runtime desde `weddingInfo`.
- Firestore `weddings/{id}/transactions`: subcolecciÃ³n con transacciones normalizadas (`type`, `status`, `amount`, `paidAmount`, `dueDate`, `category`, `provider`, `attachments[]`, `source`, `createdAt`, `meta` opcional).
- Adjuntos se guardan como `{ filename, url, storagePath, size, uploadedAt }`. El formulario envÃ­a `attachments: { keep: Attachment[], newFiles: File[] }`, y `useFinance` sube los nuevos archivos a `finance/{weddingId}/...` antes de unirlos.
- Campo `source` acepta `manual`, `email` o `bank` y alimenta mÃ©tricas, filtros y limpieza de sugerencias.
- `SyncService` guarda copia local (`movements`), limita a ~200 Ã­tems y vuelve a sincronizar al recuperar conexiÃ³n. Tras crear/actualizar se ejecuta `window.dispatchEvent(new Event('mywed360-movements'))` para rehidratar widgets offline.
- Firestore `weddings/{id}/finance/accounts`: documento opcional con `primaryAccountId` para detectar conexiÃ³n bancaria.
- `aiAdvisor`: objeto persistido en `finance/main.aiAdvisor` con `{ scenarios: Scenario[], selectedScenarioId, requestedAt, appliedAt, feedback }`. Cada escenario conserva la recomendacion completa (`allocation`, `alerts`, `globalTips`) para auditoria, comparativas y aprendizaje.
- Dataset `aiBudgetAdvisorSessions`: job nocturno agrega escenarios aceptados o descartados (sin PII) para recalibrar recomendaciones. Se unifican importes a `EUR`, se agrupan por rango de invitados y region, y se registran feedbacks (aceptado, ajustado, descartado con razon). Retencion 12 meses en `storage://datasets/ai-budget-advisor/{YYYY-MM}/sessions.parquet` con metadatos en `adminMetrics/{date}.aiBudgetAdvisorMeta`.
- `EmailInsightsService` consume `/api/email-insights/{mailId}` (REST) y mantiene resultados en memoria (no persiste en Firestore).
- `financeStats` agregados (`totalBudget`, `totalSpent`, `forecast`) planificados; aÃºn sin persistencia.

## 5. Reglas de negocio
- Suma de porcentajes por categoria debe igualar 100%; la UI bloquea guardar si no coincide.
- Gastos no pueden exceder limites negativos; se registra sobrepresupuesto pero nunca se trunca cantidad.
- Solo owner o planner puede editar presupuesto total; assistants pueden registrar gastos pero no borrar categorias.
- Al actualizar categoria se recalcula `totalBudget` y se disparan hooks de notificacion.
- Auto-categorizaciÃ³n: si no se define categorÃ­a o es genÃ©rica (`OTROS`), `AUTO_CATEGORY_RULES` infiere una categorÃ­a con base en concepto/proveedor.
- Matching de proveedores por email, dominio o coincidencia en asunto (sugerencias desde correo) y limpieza de la sugerencia una vez registrada la transacciÃ³n.
- ConexiÃ³n bancaria requiere `VITE_BANK_API_BASE_URL` y `VITE_BANK_API_KEY`; sin variables se devuelve lista vacÃ­a y se muestra CTA de conexiÃ³n.
- `settings.alertThresholds.warn/danger` determinan el cambio de color en barras y la generaciÃ³n de alertas (`FinanceOverview`, `BudgetManager`).

## 6. Estados especiales y errores
- Si no hay presupuesto configurado se muestra CTA "Configura tu presupuesto".
- Importacion CSV: botones visibles pero deshabilitados; pendiente de implementaciÃ³n (mostrar aviso â€œPrÃ³ximamenteâ€ when hovered).
- Errores Firestore -> toast y rollback optimista.
- Alertas de red (`offline`) muestran banner con modo solo lectura.
- Sugerencias de email: si `VITE_EMAIL_INSIGHTS_*` falta o la API responde error, se registra `console.warn`, se muestra mensaje â€œNo se pudieron cargar las sugerenciasâ€ y no se reintenta automÃ¡ticamente.
- ImportaciÃ³n bancaria:
  - Sin `finance/accounts.primaryAccountId`: CTA â€œConectar bancoâ€ (`hasBankAccount=false`).
  - Con ID pero sin variables `VITE_BANK_API_*`: se mantiene CTA y se avisa en consola (estado â€œconexiÃ³n pendienteâ€).
  - Errores HTTP â†’ `hasBankAccount=false`, toast genÃ©rico y `console.warn`, sin bloquear la vista.

## Alertas de presupuesto
- Umbrales: `settings.alertThresholds.warn` (75â€¯% por defecto) colorea progreso en Ã¡mbar y agrega la categorÃ­a a la tarjeta de alertas; `danger` (90â€¯% por defecto) cambia a rojo y marca el estado como crÃ­tico.
- VisualizaciÃ³n: `FinanceOverview` renderiza la tarjeta â€œAlertas de Presupuestoâ€ listando cada categorÃ­a sobre los umbrales con enlace a Transacciones filtrado por categorÃ­a y tipo de gasto. Los chips de estado por categorÃ­a usan los mismos colores.
- `BudgetManager` replica la lÃ³gica de colores en las barras de progreso para mantener consistencia visual, pero no muestra mensajes adicionales.
- `BudgetAlerts.jsx` quedÃ³ obsoleto y no se monta en `Finance.jsx`; el comportamiento oficial es el de `FinanceOverview`.

## 7. Integracion con otros flujos
- Flujo 2 usa presupuesto para seeds iniciales y recomendaciones de IA.
- Flujo 3 aporta correos y contactos para el matching automÃ¡tico de proveedores (sugerencias de email).
- Flujo 5 (proveedores) sincroniza presupuestos ofertados y estado de contratos; el consejero IA usa esas cotizaciones para ajustar escenarios y generar alertas cuando un servicio supera el reparto recomendado.
- Flujo 6 conecta con timeline de pagos y tareas automÃ¡ticas (Flujo 5b).
- Flujos 11A/11B/11C usan pagos confirmados para protocolo (celebrante, permisos, mÃºsica).
- Flujo 17 considera `budgetProgress` para puntos y logros; Flujo 12 envia notificaciones de sobrepresupuesto.

## 8. Metricas y monitorizacion
- Eventos: `budget_configured`, `budget_category_updated`, `transaction_logged`, `budget_over_threshold`, `payment_suggestion_used`, `bank_import_triggered`, `ai_budget_estimate_requested`, `ai_budget_estimate_applied`, `ai_budget_estimate_overridden`.
- Seguimiento de tiempo desde configuracion hasta primer gasto, porcentaje de usuarios con alertas activas, adopciÃ³n de fuentes (`source = email/bank`), tasa de aceptaciÃ³n de sugerencias IA y delta medio entre `median` recomendado y monto final aplicado.
- Telemetria planificada para importaciones CSV (exitosas/fallidas), uso de aportaciones y precisiÃ³n de la proyecciÃ³n financiera (gaps actuales).

## 9. Pruebas recomendadas
- Unitarias: `useFinance` (reducers, proyecciÃ³n beta+geomÃ©trica, auto-categorÃ­a), `BudgetManager` validaciones, `PaymentSuggestions` (parseo correos), `TransactionForm` (transiciones de estado/adjuntos), `bankService` (credenciales faltantes).
- Integracion: guardar presupuesto â†’ leer en `FinanceOverview`, registrar sugerencia de email, sincronizar transacciones con widgets, importar movimientos bancarios simulados.
- E2E: configurar presupuesto, registrar gasto con adjunto, verificar alerta de categorÃ­a, procesar sugerencia de email, simular error de API bancaria y validar fallback.


## Cobertura E2E implementada
- `cypress/e2e/finance/finance-flow.cy.js` y `cypress/e2e/finance/finance-flow-full.cy.js`: validan creaciÃ³n del presupuesto base, contribuciones y navegaciÃ³n entre pestaÃ±as financieras.
- `cypress/e2e/finance/finance-budget.cy.js`, `cypress/e2e/finance/finance-transactions.cy.js`, `cypress/e2e/finance/finance-contributions.cy.js`, `cypress/e2e/finance/finance-analytics.cy.js` y `cypress/e2e/budget_flow.cy.js`: cubren ediciÃ³n de categorÃ­as, registro de movimientos y paneles analÃ­ticos.

## 10. Checklist de despliegue
- Reglas Firestore actualizadas para `finance/main`, subcolecciÃ³n `transactions` y almacenamiento de adjuntos (`finance/` en Storage).
- Revisar limites de seguridad en Cloud Functions de exportacion y notificaciones.
- Configurar variables `VITE_ENABLE_FINANCE_ALERTS`, `MAILGUN_*`, `VITE_BANK_API_BASE_URL`, `VITE_BANK_API_KEY`, `VITE_EMAIL_INSIGHTS_*`.
- Asegurar migracion de bodas antiguas para poblar `finance/main` con nuevas llaves (`alertThresholds`, `contributions`) y mover adjuntos a rutas `finance/`.
- Verificar permisos de storage y tokens para Email Insights / Open Banking, y limpiar colas pendientes en `SyncService` antes de despliegue.

## 11. Roadmap / pendientes
- Integracion Open Banking: UI de autenticaciÃ³n, refresco de tokens, categorizaciÃ³n inteligente, reconciliaciÃ³n automÃ¡tica.
- ImportaciÃ³n CSV/Excel con preview y mapeo de columnas (validaciones server-side).
- Reportes descargables (PDF/Excel) listos para proveedores y contabilidad.
- Gestion completa de aportaciones (recordatorios, agradecimientos, panel compartido).
- Prediccion de gasto y recomendaciones automaticas basadas en proyecciÃ³n.
- Automatizacion de pagos programados y conciliacion con contratos.
- Adjuntos en `TransactionForm` aceptan `image/*, application/pdf, .doc, .docx, .xls, .xlsx`. Otros tipos se bloquean en la carga de archivos.
- Entrenamiento y calibraciÃ³n continua del estimador de costos (dataset anonimizado, feedback con `overridden`/`dismissedAt`, segmentaciÃ³n regional) para mantener precisiÃ³n y reducir sesgos.







