# 5. Proveedores con IA (estado 2025-10-07)

> Implementado: `GestionProveedores.jsx`, `ProveedorList.jsx`, `ProveedorCard.jsx`, `ProveedorDetail.jsx`, `SupplierKanban.jsx`, `GroupAllocationModal.jsx`, `GroupCreateModal.jsx`, `GroupSuggestions.jsx`, `DuplicateDetectorModal.jsx`, `CompareSelectedModal.jsx`, `ProviderSearchDrawer.jsx`, `AI` modals (`AIBusquedaModal.jsx`, `AISearchModal.jsx`, `AIEmailModal.jsx`), servicios `aiSuppliersService.js`, `supplierEventBridge`, `EmailTrackingList.jsx`, `ProviderEmailModal.jsx`, `RFQModal.jsx`, `ReservationModal.jsx`.
> Pendiente: scoring inteligente consolidado, portal proveedor completamente funcional, automatizacin de RFQ multi-proveedor y reportes comparativos.

## 1. Objetivo y alcance
- Orquestar el ciclo completo de proveedores (planificacin, bsqueda, negociacin, contratacin) apoyado en IA y contexto del proyecto.
- Traducir los requerimientos especficos de cada boda en servicios concretos, permitiendo asociar un proveedor a mltiples servicios o dividirlo cuando cubre mbitos distintos.
- Integrar tableros para monitorear shortlist ("vistos/buscados"), pipeline operativo y control presupuestario por grupo o servicio.

## 2. Trigger y rutas
- Men inferior  `Ms`  bloque **Proveedores**  "Gestin de proveedores" (`/proveedores`, `GestionProveedores.jsx`).
- El desplegable del mismo bloque incluye "Contratos" (`/proveedores/contratos`) y acceso a fichas individuales (`/proveedores/:id`); el portal externo vive en `/proveedores/:id/portal`.
- `ProviderSearchDrawer` puede abrirse como overlay desde otras vistas (Timeline, Home, Tasks) para alta rpida o bsqueda IA.

## 3. Paso a paso UX
- La vista principal se organiza en pestañas visibles **Vistos** (shortlist), **Pipeline** (kanban por lnea) y **Contratos** (resumen financiero/documental); la matriz de necesidades se abre como modal desde el header ("Matriz de necesidades"). El header mantiene acciones globales (buscar IA, aadir manualmente, filtros contextuales) accesibles en todo momento.
1. Planificacin de servicios
   - `ServicesBoard` se muestra dentro del modal "Matriz de necesidades": lista los servicios crticos para la boda, permite marcar cuales estn "por definir" y sugiere combinaciones habituales segn tipo de evento sin abandonar la vista principal.
   - Cada proveedor puede descomponerse en "lneas de servicio" (ej. `Espacio Las Brisas`  servicios `Venue` y `Catering`). Un wizard de fusin/separacin (`SupplierMergeWizard`) gua el proceso: selecciona lneas implicadas, decide si se crean proveedores independientes, reubica contratos/pagos asociados y registra un histrico de cambios.
   - `DuplicateDetectorModal` evita crear lneas duplicadas y gua el proceso de fusin.
   - Cada tarjeta de servicio incluye accesos directos `Buscar`, `IA` y `Aadir` para abrir el drawer, disparar bsqueda inteligente o crear un proveedor nuevo preasignado al servicio seleccionado.
2. Exploracin y shortlist (**Vistos**)
   - `ProviderSearchDrawer`, `AISearchModal` y `ServicesBoard` (desde el modal de necesidades) lanzan bsquedas IA usando ubicacin, presupuesto objetivo y estilo de la boda; los resultados se guardan en la pestaa **Vistos** (`ProveedorList.jsx` en modo shortlist).
   - `ProveedorFiltro` expone pestaas globales (todos/contratados/contactados/favoritos/vistos) y bsqueda rpida que impacta shortlist y pipeline; los usuarios pueden marcar favoritos desde la propia tarjeta y el filtro se actualiza en tiempo real.
   - Desde **Vistos** se promueven proveedores a evaluacin o se descartan con motivo. `ProveedorForm` permite capturar proveedores offline y, si se encuentra coincidencia, la IA enriquece datos pblicos.
3. Evaluacin y negociacin
   - `CompareSelectedModal` contrasta propuestas y notas por servicio; `AIEmailModal` genera correos iniciales (la operativa detallada vive en la pgina de mail).
   - `SupplierKanban` gestiona estados "Por definir  Vistos  Contactados  Presupuesto  Contratado  Rechazado" por lnea de servicio, con drag & drop y acciones rpidas.
   - Las tarjetas de proveedor (`ProveedorCardNuevo`) muestran imagen de cabecera, nombre, servicio principal, estado con etiqueta coloreada, prxima cita y presupuesto estimado; incluyen acciones inline para marcar favorito, abrir men contextual (editar/eliminar) y abrir detalle al hacer clic en el cuerpo.
   - `EmailTrackingList` registra cada correo enviado y recibido (IA o manual) y `SupplierEventBridge` enlaza invitaciones/calendarios para mantener historial de citas; ambos se muestran dentro de la pestaa de comunicaciones del detalle.
   - Las tarjetas muestran un punto rojo de alerta cuando existen correos o citas sin revisar; el indicador se limpia al abrir la ficha o marcar la comunicacin como leda.
   - `GroupCreateModal`, `GroupAllocationModal` y `GroupSuggestions` ayudan a equilibrar presupuestos y detectar huecos sin cobertura.
4. Contratacin y seguimiento
   - `RFQModal`, `ReservationModal` y `ProviderEmailModal` disparan solicitudes formales; `SupplierEventBridge` alimenta timeline y tareas.
   - Automatizaciones IA monitorean respuestas de correo y estados de contrato/presupuesto: necesitan detectar `budgetStatus = approved` + `contractStatus = signed` (ya sea por lectura del correo, adjunto reconocido o registro manual en Flujo 15). Si solo llega uno de los dos, se crea alerta "Falta validar presupuesto/contrato" antes de mover la lnea.
   - Los planificadores pueden marcar "Contacto manual registrado" desde `SupplierKanban` o `ProveedorDetalle` para reflejar comunicaciones fuera del mdulo de email; esto evita que el pipeline dependa exclusivamente del rastreo automtico.
   - `GestionProveedores` integra las vistas; `ProveedorDetalle` muestra pestaas de informacin/comunicaciones, detalla qu servicios cubre cada proveedor, enlaza contratos/pagos y aporta un bloque de mtricas comparativas (precio medio, ratio de respuesta, satisfaccin) calculadas a partir de `supplierInsights`.
   - Panel lateral "Resumen financiero" expone KPIs agregados (asignado, gastado, presupuestos pendientes, recordatorios, prximo deadline) y aloja filtros globales.

## 4. Persistencia y datos
- Firestore `weddings/{id}/suppliers/{supplierId}`: datos base, notas, presupuesto objetivo, estado pipeline y banderas globales (favorito, proveedor multi-servicio).
- Subcoleccin `serviceLines` (`weddings/{id}/suppliers/{supplierId}/serviceLines/{lineId}`) para cubrir cada servicio asociado: nombre, categora, presupuesto objetivo, estado, fechas clave.
- Colecciones auxiliares: `supplierGroups` (agrupaciones, metas), `supplierEmails` (historial de comunicaciones), `supplierRFQ`, `supplierShortlist` (vistos/buscados con fuente y fecha de revisin).
- Subcoleccin `supplierMeetings` (citas, recordatorios, enlaces calendario) sincronizada con `ReservationModal` y timeline.
- Repositorio global `supplierInsights/{supplierId}` agrega mtricas histricas entre bodas (ratio de respuesta, precio medio contratado, satisfaccin) y enlaces a reseas; se actualiza al cerrar cada lnea de servicio.
- Logs IA en `weddings/{id}/ai/suppliers/{uuid}` con prompt, respuesta, proveedor, usuario.
- Integracin con `finance` refleja gastos confirmados/estimados por proveedor y por lnea de servicio.

## 5. Reglas de negocio
- Estados vlidos por lnea de servicio: `por_definir`, `vistos`, `contactado`, `presupuesto`, `contratado`, `rechazado`. El estado global del proveedor refleja el estadio ms avanzado entre sus lneas activas.
- Solo owner/planner pueden eliminar o mover lneas a columnas crticas; assistants gestionan notas y comunicaciones.
- Deteccin de duplicados por email, nombre, telfono y coincidencia de servicio. Al fusionar lneas se solicita confirmacin y se preserva histrico.
- Shortlist **Vistos** requiere etiqueta de origen (IA, manual, recomendado) y fecha de ltima revisin; las entradas caducadas disparan recordatorios.
- Automatizaciones IA solo promueven a "contratado" si detectan presupuesto aprobado (`budgetStatus`) y contrato firmado (`contractStatus`). Seales vlidas: campos sincronizados desde Flujo 6/15, etiquetas reconocidas en email, adjuntos firmados (PDF con firma). Ante seales inconsistentes se genera tarea "Revisar respuesta".
- El wizard de fusin/separacin preserva contratos, pagos e historiales; si hay facturas vinculadas exige seleccionar a qu lnea se reasignan antes de confirmar.
- Todos los correos y citas quedan registrados (colecciones `supplierEmails` y `supplierMeetings`); si falta correspondencia entre agenda y card se genera alerta para revisin manual.
- Al cerrar una lnea de servicio se persiste un snapshot en `supplierInsights` con mtricas agregadas y feedback; se valida que cada proveedor comparta ID global para evitar duplicados.
- Grupos respetan presupuesto objetivo agregado; avisos cuando se excede por servicio o categora.

## 6. Estados especiales y errores
- Falta de IA (sin API)  modales muestran fallback para entrada manual.
- Tracking email deshabilitado  panel indica "Sin seguimiento activo".
- Registro bancario fallido  se muestra alerta y se reintenta tras reautenticacin.
- Conexin perdida  tabla y kanban pasan a modo lectura.

## 7. Integracin con otros flujos
- Flujo 3 (Invitados/RSVP) aporta datos de perfil y timing para ajustar plantillas de servicios sugeridos.
- Flujo 6 sincroniza presupuestos por proveedor y por lnea de servicio, adems de controlar pagos planificados.
- Flujo 7 centraliza comunicaciones; las respuestas analizadas por IA actualizan automticamente el kanban del flujo 5 (a travs del [Flujo 16](./flujo-16-asistente-virtual-ia.md)).
- Flujo 14 crea tareas automticas tras cambios de estado (ej. "revisar propuesta", "confirmar contrato detectado por IA").
- Flujo 15 genera contratos y documentos desde la ficha del proveedor (con enlaces por servicio).
- Flujo 17 otorga puntos al confirmar proveedores clave.
- Flujo 23 consolida mtricas globales de proveedores y muestra comparativas histricas en el dashboard de proyecto.

## 8. Mtricas y monitorizacin
- Eventos: `supplier_ai_search`, `supplier_service_defined`, `supplier_shortlist_added`, `supplier_stage_changed`, `supplier_email_sent`.
- KPIs: ratio shortlistcontactocontrato por servicio, cobertura de servicios definidos vs requeridos, tiempo medio por etapa, ahorro conseguido vs presupuesto objetivo, variaciones respecto al promedio global del proveedor (`supplierInsights`).
- Tracking de uso IA (peticiones, aciertos, feedback), efectividad de deteccin automtica de contratos/presupuestos y tasa de comunicaciones pendientes (indicador rojo activo).

## 9. Pruebas recomendadas
- Unitarias: servicio AI (`aiSuppliersService`), detectores de duplicados, reducers de grupos, normalizacin de lneas de servicio.
- Integracin: definir matriz de servicios, agregar proveedor IA/manual a shortlist, promoverlo a contacto, enviar RFQ, actualizar presupuesto y validar transicin automtica a contratado.
- E2E: bsqueda IA, consolidacin en "Vistos", comparacin, seguimiento de emails y cierre de contrato multi-servicio.


## Cobertura E2E implementada
- `cypress/e2e/proveedores_flow.cy.js`: cubre alta y curacin de proveedores con IA asistida y validaciones de bsqueda.
- `cypress/e2e/proveedores_compare.cy.js`: valida la comparativa de proveedores y la generacin de shortlist.
- `cypress/e2e/proveedores_smoke.cy.js`: smoke general del mdulo para garantizar accesos y filtros bsicos.

## 10. Checklist de despliegue
- Credenciales `OPENAI_*` / `VITE_OPENAI_*`, `MAILGUN_*`, `SUPPLIER_TRACKING_ENDPOINT` configuradas.
- Reglas Firestore para `suppliers`, subcoleccin `serviceLines`, `supplierGroups`, `supplierEmails`, `supplierShortlist`.
- Validar lmites de documentos y seguridad para narrativas IA y almacenamiento de shortlist.
- QA del tablero y filtros (performance > 500 proveedores).

## 11. Roadmap / pendientes
- Scoring IA consolidado con mtricas histricas por servicio.
- Portal proveedor completo con autenticacin, feedback bidireccional y vista del estado por servicio contratado.
- Automatizacin multi-proveedor (RFQ masivo, recordatorios automticos) extendida a lneas de servicio combinadas.
- Reportes comparativos y analtica de mercado (incluyendo cobertura de servicios pendientes).
- Integracin con marketplaces externos y recomendaciones en sitio pblico.
