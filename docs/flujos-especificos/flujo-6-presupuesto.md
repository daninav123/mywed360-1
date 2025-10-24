# 6. Gestion de Presupuesto (estado 2025-10-08)

> Implementado: `src/pages/Finance.jsx`, componentes `src/components/finance/BudgetManager.jsx`, `FinanceOverview.jsx`, `FinanceCharts.jsx`, `PaymentSuggestions.jsx`, `TransactionManager.jsx`, hooks `useFinance`, `useSupplierBudgets`, servicios `EmailInsightsService`, `bankService`, `SyncService`.
> Pendiente: importación CSV/Excel con mapeo, analítica predictiva con IA, ampliación de aportaciones colaborativas, reportes exportables y automatización de alertas avanzadas.

## 1. Objetivo y alcance
- Consolidar configuracion del presupuesto total y por categoria para cada evento (`eventType` = `boda` | `evento`).
- Registrar gastos, aportaciones y pagos a proveedores con estados de seguimiento, adjuntos y origenes multicanal (manual, email insights, importacion bancaria). **Los estados son informativos; la app no ejecuta transferencias ni cobra en nombre del usuario.**
- Ofrecer visualizaciones en tiempo real que permitan detectar desviaciones, proyecciones de liquidez y oportunidades de ahorro.
- Auto-categorizar gastos y sugerir proveedores cuando falta informacion, para acelerar el alta masiva.
- Reflejar automaticamente los gustos y contrastes capturados en `weddingProfile` (`specialInterests`, `noGoItems`) y mantener el equilibrio estilistico-financiero junto con el flujo 2C (personalizacion continua).

### Supuestos clave
- El modulo es contable y opera solo con datos declarados o importados de lectura; cualquier pago real ocurre fuera de la plataforma.
- Cada boda utiliza una moneda base (`wedding.currency`). Las conversiones mostradas en UI son referenciales y usan tasas guardadas en `exchangeRates`.
- Se espera un comprobante por transaccion, pero los adjuntos en Storage son opcionales y solo almacenan evidencias (imagen/pdf/doc).
- Los registros se consideran fiables cuando contienen categoria, proveedor y fecha; la documentacion de pruebas debe cubrir estos campos.

### Fuentes de datos y sincronizacion
- **UI manual** (`Finance.jsx`): formularios de presupuesto, transacciones y aportaciones. Escrituras a `finance/main` y `transactions`.
- **Seeds iniciales**: al crear boda se generan categorias base desde proveedores (`wantedServices`) y preferencias (`weddingProfile`).
- **Email Insights (`PaymentSuggestions`)**: propone movimientos detectados en correo; el planner decide si convertirlos en transaccion.
- **Importacion bancaria** (`bankService`): integra movimientos de solo lectura (`source=bank`), sin almacenar credenciales.
- **CSV/Excel** (planificado): importacion asistida con mapeo de columnas; requiere confirmacion manual.
- **Aportaciones colaborativas**: cantidades ingresadas por owner/planner o invitados (si se expone el portal) para reflejar liquidez.

## 2. Trigger y rutas
- Menu inferior → pestaña **Finanzas** (`/finanzas`, `Finance.jsx`) con tabs Presupuesto, Transacciones, Aportaciones y Analisis.
- Widgets del dashboard (`BudgetWidget`) enlazan a `/finanzas/resumen`.
- Atajos desde Proveedores (`GestionProveedores.jsx`) al registrar presupuestos confirmados.
- Panel de sugerencias en Transacciones (`PaymentSuggestions`) que extrae posibles pagos desde email (flujo 3) y permite registrar con un click.

## 3. Paso a paso UX
1. Configuracion inicial
   - Definir presupuesto total y moneda, ajustar porcentajes por categoria en `BudgetManager`.
   - Las categorias iniciales del presupuesto se generan automáticamente a partir de los servicios marcados como necesarios en Proveedores (`wantedServices`). Si la boda solo tiene la plantilla heredada (venue, catering, fotografía, etc.) o está vacía, el presupuesto se repuebla con esos servicios, evitando duplicados y respetando los montos ya asignados a categorías coincidentes.
   - Cuando existen `specialInterests` con `nivelContraste` distinto de `complementa`, se crean partidas etiquetadas `Contraste` vinculadas a su `zonaAplicacion`; incluyen nota de contexto y un enlace rápido al mapa de preferencias.
   - Si un contraste supera el límite tolerado (`style_balance_alert` del flujo 2C) el asistente sugiere redistribuir presupuesto core o mover la idea a inspiración.
   - Tooltip con orientaciones financieras basicas cuando el owner indica que no conoce el presupuesto.
   - Panel `Consejero IA` accesible mediante el boton `Abrir consejero`. Abre un chat lateral persistente (`AdvisorChat`) donde la pareja conversa en lenguaje natural sobre prioridades y dudas, con historial por boda y atajos para aplicar ajustes sin salir del presupuesto.
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
   - Sección “Contrastes” compara gasto previsto vs. ejecutado en cada `zonaAplicacion` y muestra badges informativos (`Contraste controlado`, `Revisión`); si un contraste se dispara genera alerta IA con CTA “Reequilibrar”.
   - Exportacion a PDF/CSV planificada (no implementada).
4. Aportaciones
   - `ContributionSettings` captura aportaciones iniciales y mensuales de cada persona, extras y regalos por invitado, sincronizando el número de asistentes desde `weddingInfo`.
   - Los datos alimentan proyecciones y el cálculo de ingresos esperados/`expectedIncome`.
5. Consejero IA conversacional de presupuesto
   - Objetivo: comprender la identidad y prioridades de cada boda para proponer ajustes personalizados (aumentar o reducir partidas, reasignar porcentajes, sugerir proveedores o tareas) sin romper el presupuesto total ni las metas financieras.
   - Experiencia de chat:
     1. Al abrir el panel se carga `AdvisorChat` con el historial persistido (`finance/main.aiAdvisorChat.messages`) y un mensaje de bienvenida con sugerencias de entrada (por ejemplo, "Que parte quieres priorizar?").
     2. Cada mensaje del usuario se guarda con `role="user"` y se envia, junto con el contexto financiero completo, a la Cloud Function `POST /api/ai/budget-advisor/chat`.
     3. La respuesta de la IA incluye:
        - `message`: texto conversacional (Markdown simple) que explica recomendaciones, dudas y trade-offs.
        - `adjustments`: lista normalizada de propuestas (ej. `{ category: "Catering", deltaPercent: 8, rationale: "Incluir jamon iberico y barra libre premium", tradeOff: [{ category: "Decoracion", deltaPercent: -3 }] }`).
        - `questions`: follow-ups cuando la IA necesita mas datos (p.ej. "Quereis mantener el proveedor de fotografia actual?").
        - `insights`: notas destacadas, alertas o enlaces directos a proveedores y tareas.
     4. El panel renderiza cada ajuste con botones `Aplicar`, `Aplicar parcialmente` (abre popover para tunear el porcentaje o importe) y `Descartar`. Al aceptar un ajuste se actualiza el presupuesto (`source: 'advisor'`), se recalculan totales y se agrega un mensaje de confirmacion del sistema en el hilo.
     5. La IA soporta simulaciones: si el usuario pregunta "Que pasa si bajo fotografia 5%?", se genera una respuesta comparativa sin tocar los datos hasta que el usuario elija una accion.
   - Payload enviado al endpoint:
     ```jsonc
     {
       "weddingId": "abc123",
       "threadId": "finance-ai-abc123",
       "message": "Queremos priorizar jamon y vino premium.",
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
           { "name": "Catering", "amount": 12000, "source": "user" },
           { "name": "Fotografia", "amount": 5000, "source": "user" },
           { "name": "Decoracion", "amount": 3000, "source": "user" }
         ]
       },
       "preferences": {
         "cuisineQuality": "high",
         "beverageFocus": "premium",
         "mustHaveSuppliers": ["Jamon iberico de bellota", "Sommelier"]
       },
       "financeStatus": {
         "incomeConfirmed": 10000,
         "incomeExpected": 12000,
         "expensesCommitted": 8000,
         "pendingExpenses": 4500
       },
       "history": [
         { "role": "user", "content": "..." },
         { "role": "assistant", "content": "...", "adjustments": [] }
       ]
     }
     ```
   - Respuesta esperada:
     ```jsonc
     {
       "message": "Si el jamon y el vino son la prioridad, podemos subir Catering un 8% y equilibrar reduciendo Decoracion. Tambien conviene reservar 2000 EUR para maridaje y sommeliers.",
       "adjustments": [
         {
           "category": "Catering",
           "deltaPercent": 8,
           "deltaAmount": 2800,
           "rationale": "Incluir jamon iberico de bellota y seleccion premium de vinos.",
           "tradeOff": [
             { "category": "Decoracion", "deltaPercent": -3, "rationale": "Reducir arreglos florales secundarios." }
           ]
         }
       ],
       "contrastContext": {
         "sourceInterest": "Speakeasy circo vintage",
         "zonaAplicacion": "after-party",
         "nivelContraste": "contraste_controlado"
       },
        "questions": [
         "Quereis mantener el proveedor de fotografia actual o explorar opciones mas ajustadas?"
       ],
       "insights": [
         "El proveedor 'Delicias Ibericas' tiene disponibilidad y pedidos minimos compatibles con la fecha."
       ],
       "traceId": "chat-2025-10-13T22:45:10Z"
     }
     ```
   - Presentacion en UI:
     - `AdvisorChat` usa burbujas con soporte de Markdown y chips para insights/alertas.
     - Cada ajuste muestra los botones de accion y, al aplicarse, dispara toasts, actualiza el tablero de presupuesto y añade un mensaje `system` describiendo el resultado.
     - Se ofrecen enlaces rapidos a crear tareas, abrir proveedores o registrar aportaciones cuando la IA lo sugiera.
   - Persistencia y preferencias:
     - `finance/main.aiAdvisorChat`: `{ schema: "v2-chat", messages: Message[], lastInteractionAt, preferences, summary, feedback }`.
     - `Message`: `{ id, role, content, createdAt, adjustments?, insights?, satisfaction? }`.
     - Las preferencias inferidas (ej. `cuisineQuality`, `beverageFocus`, `musicMood`, `decorStyle`) se guardan en `preferences` y se comparten con Flujo 5 y 17.
     - Cuando el hilo supera 15 turnos, se genera `summary` (texto) y el backend recibe un historial truncado para optimizar costes.
    - Controles y seguridad:
      - Ningun ajuste se aplica sin confirmacion explicita del usuario.
      - Si un ajuste supera el presupuesto disponible, la IA propone alternativas (recortes, aportaciones extra o cambios de proveedor) antes de permitir la aplicacion.
      - El usuario puede puntuar cada respuesta (pulgar arriba/abajo); ese feedback se almacena en `aiAdvisorChat.feedback` y se envia al dataset nocturno para reentrenar prompts.

### Ajustes de interfaz planificados (2025-10)
- **Resumen**: se reemplazará el mosaico actual por una franja ligera (presupuesto total, gastado, disponible y proyección) con hasta tres alertas clave. Las recomendaciones predictivas pasarán a tarjetas plegables “Ver sugerencias IA” y se sumarán accesos directos hacia Presupuesto y Aportaciones.
- **Transacciones**: la cabecera se organizará en dos columnas (filtros y totales mensuales a la izquierda; tarjetas de acciones rápidas a la derecha) y las secciones “Transacciones desde email” y “Conecta tu banco” quedarán dentro de un acordeón “Fuentes automáticas” para mantener la tabla como foco.
- **Presupuesto**: el editor del presupuesto total y el estado del consejero aparecerán antes de la tabla en una columna lateral; las categorías se mostrarán colapsadas por defecto y se expandirán por grupo.
- **Aportaciones**: los datos agregados (recaudado vs. objetivo) se concentrarán en un encabezado compacto; el botón de recargar invitados solo se mostrará cuando haya desfase de datos.
- **Análisis**: se sustituirá la carga simultánea de gráficos por un selector (“Ver tendencia”, “Comparar proveedores”) que renderice únicamente la visual elegida; los dos gráficos más consultados podrán exponerse como mini indicadores dentro del Resumen.

### Ciclo contable recomendado
1. **Planificacion**: definir presupuesto total, categorias y moneda base; validar tolerancias y seeds iniciales.
2. **Registro**: capturar gastos, ingresos y aportaciones a medida que ocurren (manual, email, banco o CSV).
3. **Conciliacion**: revisar sugerencias y movimientos importados, ajustar estados (`pending`, `partial`, `paid`, etc.) y documentar diferencias en `variance`/`notes`.
4. **Analisis**: usar paneles (`FinanceOverview`, `FinanceCharts`) para revisar desviaciones, proyeccion de liquidez y alertas.
5. **Cierre**: generar `closingSnapshot`, adjuntar evidencias clave y exportar (cuando la funcionalidad este disponible) o compartir con el equipo financiero.
## 4. Persistencia y datos
- Firestore `weddings/{id}/finance/main`: documento unico con:
  - `budget`: `{ total: number, categories: Array<{ name: string, amount: number, muted: boolean, source?: 'user' | 'advisor' }> }`. El flag `muted` desactiva alertas sin eliminar la categoria.
    - Categorías derivadas de contrastes incluyen `contrastContext: { zonaAplicacion, nivelContraste, sourceInterestId }` para enlazarlas con el flujo 2C.
  - `settings.alertThresholds`: `{ warn: number, danger: number }` (por defecto 75/90) usado por barras de progreso y alertas visuales.
  - `styleWeights`: copia de `weddingInsights.styleWeights` para permitir cálculos offline (opcional, se sincroniza al recalcular).
  - `contributions`: `{ initA, initB, monthlyA, monthlyB, extras, giftPerGuest, guestCount }`.
  - `preferences`: diccionario opcional con etiquetas inferidas (`cuisineQuality`, `beverageFocus`, `musicMood`, `decorStyle`, etc.).
  - `aiAdvisorChat`: `{ schema: 'v2-chat', messages: Message[], lastInteractionAt, preferences, summary?, feedback? }`.
  - Fechas clave (`weddingTimeline`) derivadas en runtime desde `weddingInfo`.
- Firestore `weddings/{id}/transactions`: subcoleccion con transacciones normalizadas (`type`, `status`, `amount`, `paidAmount`, `dueDate`, `category`, `provider`, `attachments[]`, `source`, `createdAt`, `meta` opcional). Los campos `status` y `paidAmount` reflejan progreso declarado; no disparan cobros ni pagos automaticos.
- Adjuntos se guardan como `{ filename, url, storagePath, size, uploadedAt }`. El formulario envia `attachments: { keep: Attachment[], newFiles: File[] }`, y `useFinance` sube los archivos nuevos a `finance/{weddingId}/...` antes de unirlos.
- Campo `source` acepta `manual`, `email` o `bank` y alimenta metricas, filtros y limpieza de sugerencias.
- `SyncService` guarda copia local (`movements`), limita a ~200 items y vuelve a sincronizar al recuperar conexion. Tras crear/actualizar se ejecuta `window.dispatchEvent(new Event('maloveapp-movements'))` para rehidratar widgets offline.
- Firestore `weddings/{id}/finance/accounts`: documento opcional con `primaryAccountId` para detectar conexion bancaria.
- `aiAdvisor`: objeto legado (`finance/main.aiAdvisor`). Se mantiene lectura para migraciones, pero el flujo oficial usa `aiAdvisorChat`.
- Dataset `aiBudgetAdvisorSessions`: job nocturno agrega sesiones de chat (sin PII) para recalibrar respuestas. Se unifican importes a `EUR`, se agrupan por rango de invitados, preferencias y region, y se registran feedbacks (aceptado, ajustado, descartado con razon). Retencion 12 meses en `storage://datasets/ai-budget-advisor/{YYYY-MM}/sessions.parquet` con metadatos en `adminMetrics/{date}.aiBudgetAdvisorMeta`.
- `finance_auditLog`: subcoleccion que registra cambios (`field`, `before`, `after`, `userId`, `timestamp`, `source`) para trazabilidad.
- `finance/reconciliationLogs`: lista opcional de checkpoints periodicos con resumen de ajustes pendientes, responsables y fecha de la proxima revision.
- `finance_closingSnapshots`: documento/coleccion con totales finales (`realIncome`, `realExpenses`, `variance`, `notes`, `attachments[]`) para compartir post-evento.
- Webhooks `finance.snapshot.generated` y `finance.alert.triggered` ofrecen exportacion de solo lectura hacia ERPs externos.

### Tipologias de ingresos
| Tipo | Origen | Campos clave | Particularidades |
|------|--------|--------------|------------------|
| Aportaciones fijas | Pareja / familiares | `amount`, `frequency`, `startDate` | Alimentan proyecciones; no generan cargos automaticos. |
| Aportaciones puntuales | Invitados / sponsors | `amount`, `source`, `note`, `guestId?` | Registro manual o via CSV; vincula invitado cuando aplica. |
| Reembolsos | Proveedores / seguros | `amount`, `relatedTransactionId`, `notes` | Compensan egresos existentes y recalculan liquidez. |
| Ingresos externos | Venta merchandising, etc. | `amount`, `category='externalIncome'`, `source` | Se reflejan para balance del evento sin integracion externa. |

### Registro de egresos
- Cada categoria del presupuesto define `plannedAmount`, `tolerance`, `ownerNotes` y puede mutear alertas puntuales (`muted=true`).
- Transacciones con pagos fraccionados guardan `installments[]` (monto, fecha, status) para ayudar a conciliacion manual.
- Las desviaciones se expresan en `variance` (importe) y `variancePercent`; se muestran en `FinanceOverview` y en alertas.

### Conciliacion y cierre
- Se recomienda documentar cada sesion de conciliacion en `finance/reconciliationLogs` y dejar comentarios sobre movimientos dudosos.
- Al cerrar el evento se genera `closingSnapshot` (JSON + adjuntos) y se comparte por exportacion (PDF/CSV cuando este disponible).
- Los snapshots pueden disparar webhooks externos o descargarse desde el panel de administracion (`Docs > Finanzas`).

## 5. Reglas de negocio
- Suma de porcentajes por categoria debe igualar 100%; la UI bloquea guardar si no coincide.
- Gastos no pueden exceder limites negativos; se registra sobrepresupuesto pero nunca se trunca cantidad.
- Solo owner, planner o `financeCollaborator` pueden editar el presupuesto total; assistants tienen lectura (y registro limitado) si reciben permiso especifico.
- Al actualizar categoria se recalcula `totalBudget` y se disparan hooks de notificacion.
- Auto-categorización: si no se define categoría o es genérica (`OTROS`), `AUTO_CATEGORY_RULES` infiere una categoría con base en concepto/proveedor.
- Matching de proveedores por email, dominio o coincidencia en asunto (sugerencias desde correo) y limpieza de la sugerencia una vez registrada la transacción.
- Conexión bancaria requiere `VITE_BANK_API_BASE_URL` y `VITE_BANK_API_KEY`; sin variables se devuelve lista vacía y se muestra CTA de conexión.
- `settings.alertThresholds.warn/danger` determinan el cambio de color en barras y la generación de alertas (`FinanceOverview`, `BudgetManager`).
- `financeAlertService` genera recordatorios cuando una categoria supera la tolerancia, hay transacciones vencidas >7 dias o el saldo proyectado cae por debajo de `liquidityBuffer`.

### Escenarios de proyeccion
- **Base**: presupuesto inicial + aportaciones confirmadas (confidence medio).
- **Optimista**: aplica descuentos y aportaciones extra (`optimisticAdjustment`) para evaluar holgura.
- **Conservador**: baja aportaciones a `confidence=low`, adelanta egresos criticos y refuerza colchones.
- Variables sensibles: variacion de tipo de cambio, cambios en numero de invitados, renegociaciones con proveedores, aportaciones canceladas.
- Resultados principales: `burnRate`, `cashOnHand`, `runway` hasta la fecha del evento y curva de liquidez semanal.

### Checklist operativo
1. Revisar transacciones pendientes y vencidas cada semana (o con la frecuencia definida en `finance/reconciliationLogs`).
2. Conciliar aportaciones recibidas vs. prometidas y actualizar estados (`expected` → `received`).
3. Ajustar tolerancias o categorias cuando cambie el alcance del evento o surjan contrastes nuevos.
4. Generar snapshot previo al evento y otro al cierre para compartir con stakeholders y alimentar exportaciones externas.

## 6. Estados especiales y errores
- Si no hay presupuesto configurado se muestra CTA "Configura tu presupuesto".
- Importacion CSV: botones visibles pero deshabilitados; pendiente de implementacion (mostrar aviso "Proximamente" when hovered).
- Errores Firestore -> toast y rollback optimista.
- Alertas de red (`offline`) muestran banner con modo solo lectura.
- Sugerencias de email: si `VITE_EMAIL_INSIGHTS_*` falta o la API responde error, se registra `console.warn`, se muestra mensaje "No se pudieron cargar las sugerencias" y no se reintenta automaticamente.
- Importación bancaria:
  - Sin `finance/accounts.primaryAccountId`: CTA "Conectar banco" (`hasBankAccount=false`).
  - Con ID pero sin variables `VITE_BANK_API_*`: se mantiene CTA y se avisa en consola (estado "conexion pendiente").
  - Errores HTTP → `hasBankAccount=false`, toast genérico y `console.warn`, sin bloquear la vista.

## Alertas de presupuesto
- Umbrales: `settings.alertThresholds.warn` (75 % por defecto) colorea progreso en ámbar y agrega la categoría a la tarjeta de alertas; `danger` (90 % por defecto) cambia a rojo y marca el estado como crítico.
- Visualizacion: `FinanceOverview` renderiza la tarjeta "Alertas de Presupuesto" listando cada categoria sobre los umbrales con enlace a Transacciones filtrado por categoria y tipo de gasto. Los chips de estado por categoria usan los mismos colores.
- `BudgetManager` replica la lógica de colores en las barras de progreso para mantener consistencia visual, pero no muestra mensajes adicionales.
- `BudgetAlerts.jsx` quedó obsoleto y no se monta en `Finance.jsx`; el comportamiento oficial es el de `FinanceOverview`.

## 7. Integracion con otros flujos
- Flujo 2 usa presupuesto para seeds iniciales y recomendaciones de IA.
- Flujo 3 aporta correos y contactos para el matching automatico de proveedores (sugerencias de email).
- Flujo 5 (proveedores) sincroniza presupuestos ofertados y estado de contratos; el consejero IA conversa con esos datos para sugerir proveedores alineados a las preferencias (ej. catering gourmet) y detectar cuando un ajuste rompe el reparto recomendado.
- Flujo 6 conecta con timeline de pagos y tareas automaticas (Flujo 5b).
- Flujos 11A/11B/11C usan pagos confirmados para protocolo (celebrante, permisos, musica).
- Flujo 12 escucha `advisorChat.adjustmentApplied` para disparar notificaciones cuando un cambio implique pagos cercanos, renegociaciones o tareas nuevas.
- Flujo 17 considera `budgetProgress` para puntos y logros y registra interacciones con la IA (`advisor_chat_completed`, `advisor_feedback_submitted`) como hitos de acompanamiento financiero.

## 8. Metricas y monitorizacion
  - Eventos: `budget_configured`, `budget_category_updated`, `transaction_logged`, `budget_over_threshold`, `payment_suggestion_used`, `bank_import_triggered`, `advisor_chat_opened`, `advisor_chat_message_sent`, `advisor_chat_response_received`, `advisor_adjustment_applied`, `advisor_adjustment_discarded`, `advisor_feedback_submitted`.
  - Nuevos eventos: `budget_contrast_created`, `budget_contrast_rebalanced`, `style_balance_alert`, `budget_contrast_dismissed`.
  - Seguimiento de tiempo desde configuracion hasta primer gasto, porcentaje de usuarios con alertas activas, adopcion de fuentes (`source = email/bank`), ratio de ajustes aceptados vs descartados por la IA y delta medio entre recomendaciones y montos finales aplicados.
  - Telemetria planificada para importaciones CSV (exitosas/fallidas), uso de aportaciones, precision de la proyeccion financiera y satisfaccion con respuestas IA (pulgar arriba/abajo, NPS conversacional).
  - KPIs derivados: `budgetCoverage` por categoria/global, `liquidityForecast` 30/60/90 dias, `pendingPaymentsCount`, `avgDaysOverdue`, `advisorAdoptionRate`, `dataCompletenessScore`.

## 9. Pruebas recomendadas
- Unitarias: `useFinance` (reducers, proyección beta+geométrica, auto-categoría), `BudgetManager` validaciones, `PaymentSuggestions` (parseo correos), `TransactionForm` (transiciones de estado/adjuntos), `bankService` (credenciales faltantes).
- Integracion: guardar presupuesto → leer en `FinanceOverview`, registrar sugerencia de email, sincronizar transacciones con widgets, importar movimientos bancarios simulados.
- E2E: configurar presupuesto, registrar gasto con adjunto, verificar alerta de categoría, procesar sugerencia de email, simular error de API bancaria y validar fallback.


## Cobertura E2E implementada
- `cypress/e2e/finance/finance-flow.cy.js` y `cypress/e2e/finance/finance-flow-full.cy.js`: validan creación del presupuesto base, contribuciones y navegación entre pestañas financieras.
- `cypress/e2e/finance/finance-budget.cy.js`, `cypress/e2e/finance/finance-transactions.cy.js`, `cypress/e2e/finance/finance-contributions.cy.js`, `cypress/e2e/finance/finance-analytics.cy.js`, `cypress/e2e/budget_flow.cy.js` y `cypress/e2e/finance/finance-advisor-chat.cy.js`: cubren edición de categorías, registro de movimientos, paneles analíticos y la aplicación de recomendaciones del consejero IA.

## 10. Checklist de despliegue
- Reglas Firestore actualizadas para `finance/main`, subcolección `transactions` y almacenamiento de adjuntos (`finance/` en Storage).
- Revisar limites de seguridad en Cloud Functions de exportacion y notificaciones.
- Configurar variables `VITE_ENABLE_FINANCE_ALERTS`, `MAILGUN_*`, `VITE_BANK_API_BASE_URL`, `VITE_BANK_API_KEY`, `VITE_EMAIL_INSIGHTS_*`.
- Asegurar migracion de bodas antiguas para poblar `finance/main` con nuevas llaves (`alertThresholds`, `contributions`) y mover adjuntos a rutas `finance/`.
- Verificar permisos de storage y tokens para Email Insights / Open Banking, y limpiar colas pendientes en `SyncService` antes de despliegue.

## 11. Roadmap / pendientes
- Integracion Open Banking: UI de autenticacion, refresco de tokens, categorizacion inteligente, reconciliacion automatica.
- Importacion CSV/Excel con preview y mapeo de columnas (validaciones server-side).
- Reportes descargables (PDF/Excel) listos para proveedores y contabilidad.
- Gestion completa de aportaciones (recordatorios, agradecimientos, panel compartido).
- Prediccion de gasto y recomendaciones automaticas basadas en proyeccion.
- Automatizacion de pagos programados y conciliacion con contratos.
- Adjuntos en `TransactionForm` aceptan `image/*`, `application/pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`. Otros tipos se bloquean en la carga de archivos.
- Entrenamiento y calibracion continua del consejero conversacional (dataset anonimizado, feedback `advisor_feedback_submitted`, segmentacion regional) para mantener precision y reducir sesgos.

## 12. Riesgos conocidos
- Dependencia alta de entrada manual → riesgo de datos desactualizados; mitigacion: recordatorios, tareas automaticas y conciliaciones frecuentes.
- Falta de bloqueo duro para categorias excedidas → se trabaja en modo de aprobacion adicional antes de aplicar ajustes sobrepasados.
- Importaciones masivas aun sin deduplicacion automatica → requerir revision manual y registros en `reconciliationLogs`.
- Exposicion a variaciones de tipo de cambio si no se actualizan tasas en `exchangeRates`.
- Sesgos potenciales del consejero IA → se monitorea `advisor_feedback_submitted` y se recalibran prompts con datasets regionalizados.

