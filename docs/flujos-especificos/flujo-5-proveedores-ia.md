# 5. Proveedores con IA (estado 2025-10-07)

> Implementado: `GestionProveedores.jsx` (panel superior plegable con zona de confirmados), `ProveedorList.jsx`, `ProveedorCard.jsx`, `ProveedorDetail.jsx`, `GroupAllocationModal.jsx`, `GroupCreateModal.jsx`, `GroupSuggestions.jsx`, `DuplicateDetectorModal.jsx`, `CompareSelectedModal.jsx`, `ProviderSearchDrawer.jsx`, modales IA (`AIBusquedaModal.jsx`, `AISearchModal.jsx`, `AIEmailModal.jsx`), servicios `aiSuppliersService.js`, `supplierEventBridge`, `EmailTrackingList.jsx`, `ProviderEmailModal.jsx`, `RFQModal.jsx`, `ReservationModal.jsx`.
> Pendiente: scoring inteligente consolidado, portal proveedor completamente funcional, automatización de RFQ multi-proveedor y reportes comparativos.

## 1. Objetivo y alcance
- Orquestar el ciclo completo de proveedores (planificación, búsqueda, negociación, contratación) apoyado en IA y contexto del proyecto.
- Traducir los requerimientos específicos de cada boda en servicios concretos, permitiendo asociar un proveedor a múltiples servicios o dividirlo cuando cubre ámbitos distintos.
- Integrar superficies diferenciadas para monitorizar shortlist (ideas en exploración) y el control presupuestario de confirmados por grupo o servicio.
- Aprovechar `weddingProfile`, `specialInterests` y `noGoItems` para que la IA proponga opciones alineadas con el estilo core y con los contrastes controlados definidos en el flujo 2C (personalización continua), evitando sugerencias que rompan reglas o presupuesto.

### Supuestos y alcance operativo
- El modulo documenta y coordina proveedores; no realiza pagos, firmas legales ni envios de propuestas en nombre del usuario sin aprobacion explicita.
- Requiere datos base de la boda: `weddingInfo`, `wantedServices`, `weddingProfile`, `budget` (flujo 6) y permisos de usuario (`modulePermissions.proveedores`).
- La informacion sensible (tarifas, contratos, datos de contacto) se almacena bajo Firestore y Storage con reglas que limitan acceso a bodas activas y roles habilitados.
- El motor IA usa prompts compuestos con datos descriptivos, nunca envia PII no necesaria (p.ej. telefonos de invitados) y registra cada intercambio en `weddings/{id}/ai/suppliers`.
- El portal colaborativo expone solo campos explicitamente marcados como compartibles; cualquier carga de documentos queda en revision manual antes de volverse visible al resto del equipo.

## 2. Trigger y rutas
- Menú inferior `Más` bloque **Proveedores** "Gestión de proveedores" (`/proveedores`, `GestionProveedores.jsx`).
- El desplegable del bloque solo lista "Gestión de proveedores" (`/proveedores`) y "Contratos" (`/proveedores/contratos`).
- Las fichas individuales (`/proveedores/:id`) y el portal externo (`/proveedores/:id/portal`) se abren desde enlaces contextuales dentro del propio módulo.
- `ProviderSearchDrawer` puede abrirse como overlay desde otras vistas (Timeline, Home, Tasks) para alta rápida o búsqueda IA.

## 3. UX (layout progresivo)
- **Header global**
  - La vista mantiene un header fijo con acciones globales (`Añadir proveedor`, apertura del `Panel de servicios`). Desde aquí se lanza `ProviderSearchDrawer`, se accede a fichas (`/proveedores/:id`) y al portal externo (`/proveedores/:id/portal`).
  - El botón “Panel de servicios” abre `ServicesBoard` con servicios críticos y sugerencias IA (Core/Contraste) más el wizard `SupplierMergeWizard`. Se abre automáticamente únicamente en la primera visita (flag `suppliers_needs_intro_{weddingId|userId}`); a partir de entonces solo se accede manualmente desde el botón correspondiente.

- **Panel superior plegable de búsqueda**
  - Único bloque de interacción. Arranca desplegado y puede plegarse (“Plegar exploración”). Al cerrarlo queda un botón flotante (“Explorar proveedores”) para reabrirlo sin abandonar la vista.
  - Contenido:
    - Campo de búsqueda manual con historial persistido (`searchHistory`). Al ejecutar, la shortlist bajo el mismo panel se actualiza sin navegar.
    - Contadores rápidos (todos/favoritos) y feedback del último resultado (origen IA/manual, fecha, notas).
    - Sub-sección **Shortlist guardada**: tarjetas semitransparentes con candidatos “vistos” agrupados por servicio, mostrando match y notas. Desde aquí se puede promover o descartar sin cambiar de pestaña.
  - Cuando se lanza una búsqueda IA:
    - El sistema genera un *prompt* compuesto automáticamente a partir del perfil de la boda (`weddingInfo` + `wantedServices`): estilo preferido, tipo de evento, fecha, presupuesto objetivo, localización, número de asistentes, servicios aún pendientes y restricciones (`noGoItems`). 
    - Ese prompt se envía al proveedor IA (OpenAI / modelo propio) solicitando candidatos contextualizados. El usuario puede modificar el texto base antes de enviar (“Florista Barcelona 2500”, etc.), pero el motor siempre anexa los datos estructurados para mejorar la relevancia.
    - Las respuestas se normalizan (`mapAIResultToProvider`) y se guardan de forma idempotente en la shortlist, evitando duplicados por email o enlace. Si la IA devuelve información incompleta, se rellenan campos con defaults (email sintético, servicio actual).
    - En caso de fallo o respuesta vacía, se muestra mensaje en el panel y se mantiene el buscador abierto para ajustes manuales.
    - Los resultados inmediatos se muestran justo debajo del formulario como tarjetas de “candidato sugerido”: nombre, servicio, snippet y match. Desde ahí el planner puede guardarlo (añade a shortlist) o descartarlo sin salir del panel.
- **Área principal (scroll)**
  - El bloque **Servicios** lista cada servicio en tarjetas semitransparentes (pendientes) o sólidas (confirmados). Las tarjetas muestran nombre del servicio, badge “Pendiente/Confirmado” y, en caso de shortlist, el número de candidatos guardados.
  - Al hacer clic sobre una tarjeta pendiente se abre el modal **Opciones Guardadas**:
    - Lista todas las alternativas capturadas (shortlist + búsquedas recientes) con acciones rápidas (`Promover`, `Descartar`, `Registrar nota`). 
    - Pestañas internas: “Candidatos” (ordenados por match), “Historial” (notas y comunicaciones) y “Acciones” (crear proveedor manual preasignado, abrir ficha existente).
    - CTA contextual para abrir la matriz de necesidades filtrada por el servicio.
  - El bloque mantiene fondo neutro y, al pie, tarjetas de KPIs (“Servicios confirmados”, “Servicios pendientes”, “Próximo pago”) que reutilizan el mismo patrón de color sólido cuando existe proveedor asignado.

- **Tarjetas de servicios pendientes**
  - Visual: borde discontinuo y fondo translúcido (`bg-surface/80`). El badge “Pendiente” aparece junto al nombre del servicio.
  - Shortlist asociada: si existen candidatos guardados, se muestra el contador (`n opciones guardadas`) y el copy invita a revisar opciones.
  - Confirmación: al detectar un proveedor con palabras clave `confirm/contrat/firm/reserva`, la tarjeta adopta fondo sólido, badge verde “Confirmado” y muestra nombre/estado, presupuesto asignado, gasto y próximo pago.
  - Acciones rápidas:
    1. Click → abre el modal “Opciones Guardadas”.
    2. Cuando está confirmada, la tarjeta incluye botones `Registrar pago`, `Añadir nota` y `Abrir ficha` para llevar el seguimiento sin abandonar la vista.
    3. Si no hay shortlist, el modal muestra estado vacío con CTA hacia la matriz o una nueva búsqueda.

- **Modal “Opciones Guardadas”**
  - Se abre al pulsar cualquier tarjeta pendiente del grid de servicios y evita abandonar la vista principal.
  - **Candidatos**: recoge shortlist + proveedores en seguimiento; incluye acciones `Promover`, `Descartar`, `Registrar nota`, enlace al detalle y marcador de match.
  - **Historial**: timeline con notas, comunicaciones y cambios de estado para aportar contexto antes de promover.
  - **Acciones**: accesos rápidos a crear proveedor manual preasignado, reabrir la matriz filtrada y relanzar búsquedas manuales.
  - Si ya existe un proveedor confirmado, aparece destacado en la cabecera del modal con enlace directo al detalle (`ProveedorDetalle`).

- **Persistencia y shortlist**
  - `localStorage` conserva `suppliers_search_history_{weddingId|userId}` (chips reutilizables) y `suppliers_needs_intro_{weddingId|userId}` (apertura automática sólo la primera visita).
  - `useSupplierShortlist` centraliza candidatos guardados: deduplica por email/link, limita historial y alimenta tanto el panel superior como el modal.
  - Las tarjetas detectan confirmación mediante `isConfirmedStatus` (palabras clave “confirm/contrat/firm/reserva”), lo que activa el estilo sólido y la cabecera de KPIs.

- **Ficha detalle (overlay)**
  - `ProveedorDetalle` se abre desde cualquier tarjeta. Conserva layout dividido: cabecera fija (avatar, estado global, tags Core/Contraste/Portal), columna central (≈70 %) con pestañas de información/comunicaciones/contratos, y sidebar (≈30 %) con “Resumen financiero”, “Agenda”, checklist y alertas IA (`style_balance_alert`, duplicados, contratos pendientes).
  - **Información**: datos editables, líneas de servicio (`serviceLines`) con acciones de reasignar, fusionar, cerrar con snapshot en `supplierInsights`, y gestión de adjuntos.
  - **Comunicaciones**: timeline cronológico de correos (`EmailTrackingList`), mensajes portal y notas manuales con filtros por tipo, búsqueda, CTA de contacto manual y programación de citas. Marcar una entrada como leída limpia indicadores en la lista y en las tarjetas del pipeline.
  - **Contratos y pagos**: tabla de contratos (monto, estado, fechas) e hitos previstos vs realizados sincronizados con Finance; acciones `Solicitar contrato`, registrar pago, subir evidencia y alertas automáticas por faltas de aprobación/firma.
  - **Insights**: métricas comparativas (precio medio vs objetivo, ratio de respuesta, satisfacción, SLA), resúmenes IA (“Refuerza estilo core”, “Contraste controlado”, “Riesgo por baja respuesta”), historial global `supplierInsights/{supplierId}` y enlaces a reseñas externas. Alertas `style_balance_alert` sugieren acciones correctivas.
  - Acciones globales: editar, duplicar, fusionar (`SupplierMergeWizard`), mover a otra boda, abrir portal, generar RFQ, archivar proveedor (requiere líneas cerradas) y registrar contacto manual (`supplier_manual_contact`).
    - **Estados especiales**
      - Sin líneas: mostrar empty state con CTA “Añadir línea de servicio”.
      - Sin agenda: sugerir crear cita (abre `ReservationModal`).
      - Fallos de sincronización (`supplierEmails`, `supplierInsights`): banner amarillo con opción “Reintentar” o “Marcar revisado manualmente”.
    - **Integraciones**
      - Botón `Abrir portal` enlaza `/proveedores/:id/portal` mostrando estado (Borrador/Activo/Público).
      - `SupplierEventBridge` sincroniza citas con timeline/tareas y actualiza agenda.
    - **Permisos y seguridad**
      - Owner/Planner: control total.
      - Assistant: notas, comunicaciones, registrar tareas, marcar pagos recuperados (sin editar montos ni cerrar contratos).
      - Invitados externos: sólo vía portal con vistas limitadas; sin acceso a `ProveedorDetalle`.
    - **Telemetría y alertas**
      - Eventos emitidos: `supplier_detail_viewed`, `supplier_detail_tab_changed`, `supplier_contact_manual_added`, `supplier_contract_updated`, `supplier_payment_recorded`.
      - Alertas automáticas: ratio de respuesta <40 % en 7 días → tarea “Reforzar seguimiento”; precio estimado >20 % sobre presupuesto objetivo → alerta en panel financiero.
  - La pestaña de insights incluye resúmenes IA con mensajes como “Refuerza estilo core” o “Contraste controlado (after-party)”; si se supera el límite de contraste (`style_balance_alert`), destaca proveedores que podrían reducir ese desequilibrio.

### Portal colaborativo del proveedor (`/proveedores/:id/portal`)
- **Acceso y autenticacion**
  - Invitacion enviada desde la ficha con token firmado (`supplierPortalToken`) que expira a los 14 dias; se puede regenerar en cualquier momento. Opcionalmente se fuerza passphrase adicional.
  - Roles: `supplierOwner` (edicion total permitida), `supplierStaff` (actualiza hitos, responde mensajes) y `readOnly` (consulta). Los roles se guardan en `supplierPortalAccess`.
  - Si `SUPPLIER_PORTAL_OAUTH` esta activo, el token se intercambia por login Google/Microsoft; sin OAuth se valida token + passphrase.
- **Onboarding inicial**
  1. El proveedor confirma datos basicos compartibles (`publicName`, `phone`, `website`, `primaryContact`).
  2. Acepta terminos y politica de tratamiento (`supplierPortalAgreements`).
  3. Selecciona servicios disponibles (subset de `serviceLines` marcadas como `portalShareable=true`) y declara disponibilidad.
  4. Puede cargar propuesta preliminar (PDF/imagen) que se almacena en `storage://suppliers/{weddingId}/{supplierId}/portal/` con estado `pendingReview`.
- **Areas del portal**
  - **Resumen**: estado por servicio, presupuesto objetivo, proximo hito y notas compartidas (`shareWithSupplier=true`). Solo lectura.
  - **Mensajes**: hilo bidireccional grabado en `supplierEmails` con `source='portal'`. Permite adjuntos hasta 10 MB; cada mensaje genera notificacion interna (`supplier_portal_message`).
  - **Documentos**: subida de presupuestos, contratos, facturas. Cada archivo crea entrada en `supplierPortalDocuments` con `status=pendingReview` hasta validacion del planner.
  - **Pagos e hitos**: lista los pagos esperados desde Finance y permite marcar `invoiceSent`, `depositReceived`, `paidExternally`. Los cambios actualizan `serviceLines` y generan comentarios en timeline.
  - **Feedback**: formulario opcional que registra calificacion y notas en `supplierInsights.feedback`.
- **Permisos y aprobaciones**
  - Para cada campo editable existe flag `portalEditableFields` en la ficha; al recibir cambios se crean registros `pendingUpdates` con detalle del campo, valor propuesto y usuario. Un rol interno debe aprobar o rechazar cada item.
  - La aprobacion aplica el cambio y guarda audit trail en `supplier_auditLog`. El rechazo notifica al proveedor con comentario.
- **Alertas y recordatorios**
  - Falta de respuesta >72h → tarea “Dar seguimiento a proveedor” y recordatorio email.
  - Expiracion de token → banner en vista interna y opcion de reenviar acceso.
  - Errores de upload → mensaje en portal y log en `supplierPortalErrors`.
## 5. Integración con personalización continua
- Consumir `weddingInsights.nextBestActions` para priorizar tareas y recomendaciones dentro del módulo.
- Emitir eventos `supplier_preference_applied` y `supplier_preference_rejected` al confirmar o descartar proveedores sugeridos por contrastes.
- Panel de “packs sorpresa” (ideas IA) se conecta con el asistente (flujo 16) para presentar a planners opciones curadas según `specialInterests`.
   - Panel lateral "Resumen financiero" expone KPIs agregados (asignado, gastado, presupuestos pendientes, recordatorios, próximo deadline) y aloja filtros globales.

## 4. Persistencia y datos
- Firestore `weddings/{id}/suppliers/{supplierId}`
  - Campos obligatorios: `name`, `primaryContact`, `email`, `phone`, `statusGlobal`, `ownerUserId`, `createdAt`, `updatedAt`.
  - Campos financieros: `budget = { planned: number, estimated: number, currency, lastSyncedAt }`, `payments = { pending: number, paid: number }`, `financeLink` (path a documento de finanzas relacionado).
  - Flags y metadatos: `isFavorite`, `isMultiService`, `tags[]`, `portalState` (`draft|active|public`), `source` (`manual|ai|import`), `mergeRootId` (para duplicados), `styleAlignment`.
  - Auditoria: `audit = { createdBy, updatedBy, lastPortalUpdate }`.
  - Indices compuestos: `(statusGlobal, isFavorite)`, `(tags, statusGlobal)`, `(portalState, statusGlobal)`.
- Subcoleccion `serviceLines` (`weddings/{id}/suppliers/{supplierId}/serviceLines/{lineId}`)
  - Campos clave: `serviceName`, `category`, `status`, `stageHistory[]`, `budget = { planned, negotiated, variance }`, `dates = { requested, proposalReceived, contractSigned, eventDate }`, `kpis = { responseTimeHours, winProbability }`.
  - Campos de portal: `portalShareable` (bool), `portalEditableFields[]`, `portalNotes`.
  - Integraciones: `financeTransactionIds[]`, `contractId`, `taskIds[]`.
  - Indices: `(category, status)`, `(status, budget.planned)`, `(portalShareable, status)`.
- Colecciones auxiliares bajo `weddings/{id}`:
  - `supplierGroups/{groupId}`: `{ name, objectiveBudget, currentBudget, services[], ownerId, isLocked }`.
  - `supplierShortlist/{candidateId}`: `{ supplierId?, rawName, service, matchScore, source, capturedAt, originSearchId, notes, status (pending|saved|discarded) }`.
  - `supplierEmails/{emailId}`: metadatos del correo (`subject`, `threadId`, `direction`, `status`, `attachments[]`, `source`=`manual|portal|auto`), geeter `syncedAt`.
  - `supplierRFQ/{rfqId}`: solicitudes enviadas, respuestas, comparaciones.
  - `supplierMeetings/{meetingId}`: `{ startsAt, endsAt, serviceLineId, location, attendees[], status, followUpTaskId }`.
  - `supplierPortalAccess/{accessId}`: tokens activos, rol otorgado, expiracion, historial de uso.
  - `supplierPortalActivity/{activityId}` y `pendingUpdates/{updateId}` para auditar cambios propuestos desde el portal.
  - `supplierPortalDocuments/{docId}`: metadata de archivos cargados (`filename`, `storagePath`, `status`, `reviewedBy`).
- Repositorio global `supplierInsights/{supplierId}`
  - Campos agregados: `avgPriceByCategory`, `winRate`, `responseRate`, `nps`, `feedback[]`, `lastWeddingIds[]`.
  - `snapshots[]` guarda cierre por boda (`weddingId`, `serviceLineId`, `budget`, `variance`, `savings`, `feedbackScore`, `notes`).
  - Indices globales: `(category, winRate)`, `(region, responseRate)`.
- Logs IA `weddings/{id}/ai/suppliers/{uuid}`
  - Guardan `prompt`, `model`, `response`, `contextHash`, `status`, `latencyMs`, `userId`.
  - Cruciales para auditoria y replays; TTL 90 dias.
- Integracion con finanzas
  - Cada `serviceLine` mantiene `financeLinks = { budgetCategoryId, transactionIds[], forecastRef }`.
  - `financeSyncState` en proveedor indica ultima sincronizacion (`lastSyncedAt`, `pendingItems[]`).
  - Cuando se registra pago externo desde portal o ficha, se crea evento `finance.externalPaymentLogged` con payload `{ supplierId, serviceLineId, amount, dueDate }`.
- Almacenamiento de adjuntos
  - `storage://suppliers/{weddingId}/{supplierId}/contracts/` para contratos aprobados.
  - `storage://suppliers/{weddingId}/{supplierId}/portal/` para archivos enviados por proveedor (estatus `pendingReview`).
  - `storage://suppliers/{weddingId}/{supplierId}/notes/` para archivos referenciales internos.
- Indices globales adicionales
  - Firestore requiere `(statusGlobal, budget.planned)` para filtros masivo.
  - `supplierShortlist` usa `(service, status)` y `(source, capturedAt DESC)`.
  - `supplierPortalActivity` indexado por `(supplierId, createdAt DESC)` para feeds.

### Calculos y agregados derivados
- `matchScore` de shortlist combina `styleAlignment` (30%), `budgetFit` (40%), `responseSignal` (20%) y `recency` (10%).
- `savings = budget.planned - budget.negotiated` (positivo implica ahorro). Este valor se propaga a `FinanceOverview`.
- `responseRate` y `winRate` se recalculan cada vez que una linea cambia a `contactado`, `presupuesto` o `contratado`.
- `supplierHealthScore` (0..100) = promedio ponderado de `responseRate`, `winRate`, `feedback`, penalizaciones por atrasos de pago y tareas sin resolver.
- `portalEngagement` mide interacciones (mensajes, documentos, actualizaciones) en los ultimos 14 dias y se usa para alertas de inactividad.

## 5. Reglas de negocio
- Estados validos por linea de servicio: `por_definir`, `vistos`, `contactado`, `presupuesto`, `contratado`, `rechazado`. El estado global del proveedor refleja la etapa mas avanzada entre lineas activas y se calcula cada vez que cambia `serviceLines[].status`.

### Transiciones de pipeline
| Transicion | Trigger principal | Validaciones |
|-----------|-------------------|--------------|
| `por_definir -> vistos` | Creacion de shortlist o alta manual | Requiere `serviceName` y `matchScore` > 0. |
| `vistos -> contactado` | Envio de correo/llamada registrada (`supplierEmails` o nota) | Debe existir `primaryContact` o `email`. |
| `contactado -> presupuesto` | Registro de propuesta recibida (portal, email o manual) | Se exige `budget.negotiated` y `proposalReceived` con fecha. |
| `presupuesto -> contratado` | Aprobacion manual o automatica (flujo 6/15) | Debe haber `contractId` o documento aprobado + `budget.negotiated` <= `budget.planned` (o justificar variance). |
| `* -> rechazado` | Accion manual o marcaje portal | Obliga a incluir `rejectionReason` y `notes`. |
| `contratado -> presupuesto/contactado` | Solo manual (rollback) | Solo owner/planner; registra entrada en `stageHistory` con motivo. |

- Automatizaciones IA solo promueven a `contratado` cuando detectan simultaneamente: `budgetStatus='approved'`, contrato firmado (`contractStatus='signed'`) y confirmacion en correo/portal. Si falta alguno, se crea tarea “Revisar respuesta” y el estado se mantiene en `presupuesto`.
- Cada cambio de estado escribe `stageHistory` (`from`, `to`, `reason`, `actor`, `source`, `timestamp`). Rollbacks requieren motivo y generan alerta en Slack/Email (si esta habilitado `SUPPLIER_ALERTS_WEBHOOK`).
- Shortlist caduca a los 30 dias sin revision (`capturedAt`). Al caducar, cambia `status` a `stale` y el panel muestra CTA “Volver a revisar”. Se genera recordatorio semanal hasta que se marque como revisado.
- Deteccion de duplicados compara `email`, `phone`, `website`, `socialHandle` y `normalizedName`. Si se detecta conflicto el sistema abre `DuplicateDetectorModal` y bloquea la promocion hasta decidir fusion o crear registro separado.
- Wizard de fusion/separacion:
  - Fusionar requiere elegir proveedor principal (`mergeRootId`) y reasignar `serviceLines`, `contracts`, `financeLinks`, `supplierEmails`.
  - Separar obliga a definir que lineas migran al nuevo proveedor y recalcula `budget` por cada parte antes de confirmar.
- Portal y aprobaciones:
  - Cambios entrantes se almacenan en `pendingUpdates`. Hasta aprobacion no se reflejan en la UI interna (se muestran badges `Pendiente`).
  - Si un cambio afecta `budget` o `status`, la aprobacion forza recalcular proyecciones en finanzas y enviar evento `supplier_portal_update_approved`.
- Integridad con finanzas y contratos:
  - No se permite cerrar (archivar) un proveedor con `finance.pendingPayments > 0` o `contracts` sin firma.
  - Si una linea pasa a `contratado` pero falta `financeLinks.budgetCategoryId`, se muestra alerta critica y se impide generar pagos automaticos.
  - Al cancelar (`rechazado`) un proveedor con transacciones vinculadas se requiere reasignar o anular referencias para evitar registros huerfanos.
- Permisos:
  - Owner/planner pueden eliminar lineas o proveedores. `financeCollaborator` puede actualizar estados financieros y adjuntos; `assistant` se limita a notas/comunicaciones.
- Auditoria y correspondencia:
  - Todo correo registrado en `supplierEmails` debe tener `threadId`. Si en 15 minutos no se encuentra correspondencia con la tarjeta, se crea alerta “Verificar tracking”.
  - Cada reunion (`supplierMeetings`) debe enlazar `serviceLineId`. Los eventos sin enlace quedan en estado `orphan` y se listan en reportes de saneamiento.
- Grupos (`supplierGroups`) controlan que `currentBudget` <= `objectiveBudget` (+ tolerancia 5%). Si se excede se genera alerta amarilla y, de superar el 15%, alerta roja con tarea de ajuste.

## 6. Estados especiales y errores
- Falta de IA (sin API) -> modales muestran fallback para entrada manual.
- Tracking email deshabilitado -> panel indica "Sin seguimiento activo".
- Registro bancario fallido -> se muestra alerta y se reintenta tras reautenticación.
- Conexión perdida -> las vistas de tarjetas (exploración/confirmados) pasan a modo lectura y muestran aviso de reconexión.

## 7. Integración con otros flujos
- **Flujo 3 — Invitados / RSVP**
  - Provee `guestSegments`, `scheduleConstraints` y `venuePreferences` que se incluyen en prompts IA.
  - Si cambia el numero de invitados, se recalcula `budget.planned` forzando revisar proveedores de catering/alojamiento.
- **Flujo 6 — Finanzas**
  - `useFinance` expone `budgetCategories` y `transactions`; se enlazan via `financeLinks`.
  - Cuando se registra pago en finanzas se actualiza `serviceLines[].payments` y se marca checkpoint en `stageHistory`.
  - Fallback: si finanzas esta offline, los cambios quedan en `pendingFinanceSync` y se reintentan cada 15 min.
- **Flujo 7 — Comunicaciones**
  - Sincroniza correos enviados/recibidos; el análisis IA (flujo 16) etiqueta intencion (`proposal`, `followup`, `warning`).
  - Las respuestas detectadas como confirmaciones pueden proponer transición a `presupuesto` o `contratado`.
- **Flujo 14 — Tareas / Timeline**
  - Cada transición relevante dispara tarea automática (ej. `supplier_follow_up`, `supplier_contract_review`).
  - Reservas confirmadas crean hitos en timeline y se sincronizan con `supplierMeetings`.
- **Flujo 15 — Contratos y documentos**
  - Desde la ficha se crean contratos (`contractTemplates`). El ID del contrato se guarda en `serviceLines.contractId`.
  - Estado del contrato (`draft|sent|signed|cancelled`) gobierna si se puede pasar a `contratado`.
- **Flujo 16 — Asistente IA**
  - Mismo contexto alimenta sugerencias en chat; respuestas del asistente pueden abrir modales de proveedores o prellenar RFQ.
- **Flujo 17 — Gamificacion**
  - Al confirmar proveedores core se emite `supplier_core_confirmed` para otorgar puntos/logros.
- **Flujo 23 — Metricas proyecto**
  - Recoge KPIs (`serviceCoverage`, `savingsPercent`, `supplierHealthScore`) y genera comparativas mensuales.
- **Portal publico / Marketing**
  - Cuando se publica un proveedor (permiso explicito) se expone en landing publica usando `supplierInsights` filtrado y se redactan blurbs con IA controlada.

## 8. Métricas y monitorización
- Eventos rastreados: `supplier_ai_search`, `supplier_service_defined`, `supplier_shortlist_added`, `supplier_shortlist_reviewed`, `supplier_stage_changed`, `supplier_email_sent`, `supplier_portal_message`, `supplier_portal_update_approved`, `supplier_merge_completed`.
- KPIs clave:
  - `shortlistToContractRatio = contratados / shortlistRevisada` por servicio y global.
  - `serviceCoverage = serviciosDefinidos / serviciosRequeridos` (espera >= 90% antes de cierre).
  - `avgStageTime[stage]` calculado a partir de `stageHistory`.
  - `savingsPercent = (budget.planned - budget.negotiated) / budget.planned`.
  - `supplierHealthScore` y `portalEngagement` (ver cálculos en sección 4) usados para ordenar alertas.
- Monitoreo IA:
  - `aiSuppliersService` registra `latencyMs`, `success`, `feedbackThumb`. Alertas se disparan si `successRate` cae <85% en 1h o `latencyMs` promedio >6s.
  - El dataset nocturno cruza prompts vs resultados para recalibrar `matchScore`.
- Comunicaciones pendientes:
  - Widget rojo se enciende cuando `supplierEmails` con `direction='inbound'` quedan sin respuesta >48h o cuando existen `pendingUpdates` sin revisar >72h.
- Analítica administrativa:
  - `GET /api/admin/suppliers/analytics` agrega datos (por región, categoría, plan). Solo accesible a roles admin.
  - Exporta CSV con columnas `supplierId`, `category`, `winRate`, `avgNegotiated`, `savings`, `portalEngagement`.

## 9. Pruebas recomendadas
- Unitarias: servicio AI (`aiSuppliersService`), detectores de duplicados, reducers de grupos, normalización de líneas de servicio.
- Integración: definir matriz de servicios, agregar proveedor IA/manual a shortlist, promoverlo a contacto, enviar RFQ, actualizar presupuesto y validar transición automática a contratado.
- E2E: búsqueda IA, consolidación en "Vistos", comparación, seguimiento de emails y cierre de contrato multi-servicio.


## Cobertura E2E implementada
- `cypress/e2e/proveedores_flow.cy.js`: cubre alta y curación de proveedores con IA asistida y validaciones de búsqueda.
- `cypress/e2e/proveedores_compare.cy.js`: valida la comparativa de proveedores y la generación de shortlist.
- `cypress/e2e/proveedores_smoke.cy.js`: smoke general del módulo para garantizar accesos y filtros básicos.

## 10. Checklist de despliegue
- Credenciales `OPENAI_*` / `VITE_OPENAI_*`, `MAILGUN_*`, `SUPPLIER_TRACKING_ENDPOINT` configuradas.
- Reglas Firestore para `suppliers`, subcolección `serviceLines`, `supplierGroups`, `supplierEmails`, `supplierShortlist`.
- Validar límites de documentos y seguridad para narrativas IA y almacenamiento de shortlist.
- QA del tablero y filtros (performance > 500 proveedores).

## 11. Roadmap / pendientes
- Scoring IA consolidado con métricas históricas por servicio.
- Portal proveedor completo con autenticación, feedback bidireccional y vista del estado por servicio contratado.
- Automatización multi-proveedor (RFQ masivo, recordatorios automáticos) extendida a líneas de servicio combinadas.
- Reportes comparativos y analítica de mercado (incluyendo cobertura de servicios pendientes).
- Integración con marketplaces externos y recomendaciones en sitio público.


### 🔍 ESTADO REAL VERIFICADO (2025-10-24)

**✅ IMPLEMENTADO Y FUNCIONAL:**

1. **useAISearch Hook** - `src/hooks/useAISearch.jsx` ✅ (439 líneas)
   - Búsqueda IA con OpenAI integrada
   - Normalización de resultados (`normalizeResult()`)
   - Match scoring automático
   - Generación de resúmenes IA
   - Funciones: `guessServiceFromQuery()`, `ensureMatchScore()`, `generateAISummary()`

2. **Componentes IA** ✅
   - `src/components/proveedores/ai/AISearchModal.jsx` ✅
   - `src/components/proveedores/ai/AIEmailModal.jsx` ✅ (6103 bytes)
   - `src/components/proveedores/ai/AIResultList.jsx` ✅ (13425 bytes)

3. **Componentes Core** ✅
   - `src/components/proveedores/ProveedorList.jsx` ✅ (CORREGIDO)
   - `src/components/proveedores/ProveedorCard.jsx` ✅

4. **Tests E2E** ✅
   - `cypress/e2e/ai-supplier-search.cy.js` ✅ (252 líneas)
   - `cypress/e2e/proveedores_flow.cy.js` ✅
   - `cypress/e2e/proveedores_smoke.cy.js` ✅

**❌ NO IMPLEMENTADO:**

1. **Portal Proveedor Completo** ❌
   - Autenticación de proveedores ❌
   - Feedback bidireccional ❌
   - Vista de estado por servicio ❌
   - Estimación: 40-60 horas

2. **RFQ Multi-Proveedor Automatizado** ❌
   - RFQ masivo ❌
   - Recordatorios automáticos ❌
   - Estimación: 20-30 horas

3. **Scoring IA Consolidado** ❌
   - Métricas históricas ❌
   - Análisis predictivo ❌
   - Estimación: 15-20 horas

4. **Reportes Comparativos Avanzados** ❌
   - Analítica de mercado ❌
   - Cobertura de servicios ❌
   - Estimación: 12-15 horas

5. **Integración Marketplaces Externos** ❌
   - Conectores externos ❌
   - Recomendaciones sitio público ❌
   - Estimación: 30-40 horas

**🟡 PARCIALMENTE IMPLEMENTADO:**

1. **Tests** 🟡
   - Tests E2E básicos: ✅ (navegación, autenticación)
   - Tests de lógica IA: ❌ (useAISearch sin tests unitarios)
   - Tests de modales: ❌ (AISearchModal, AIEmailModal sin tests)
   - Cobertura E2E: ~50%

### Implementación Actual: **70%**

**Código verificado:**
```javascript
// useAISearch.jsx - Líneas 46-66
const normalizeResult = (item, index, query, source) => {
  const name = (item?.name || item?.title || `Proveedor sugerido ${index + 1}`).trim();
  const service = (item?.service || item?.category || guessServiceFromQuery(query)).trim();
  const location = item?.location || item?.city || '';
  const priceRange = item?.priceRange || item?.price || '';
  // ... normalización completa con 15+ campos
  return { id, name, service, location, priceRange, description, tags, 
           image, website, email, phone, match, aiSummary, source };
};
```

### Pendientes Priorizados:

**Corto Plazo (1-2 meses):**
- ⏳ Tests unitarios para useAISearch (4h)
- ⏳ Tests para modales IA (6h)
- ⏳ Scoring IA consolidado (15-20h)

**Medio Plazo (3-6 meses):**
- ⏳ Portal proveedor MVP (40-60h)
- ⏳ RFQ multi-proveedor (20-30h)
- ⏳ Reportes comparativos (12-15h)

**Largo Plazo (6-12 meses):**
- ⏳ Integración marketplaces externos (30-40h)
