# 5. Proveedores con IA (estado 2025-10-07)

> Implementado: `GestionProveedores.jsx`, `ProveedorList.jsx`, `ProveedorCard.jsx`, `ProveedorDetail.jsx`, `SupplierKanban.jsx`, `GroupAllocationModal.jsx`, `GroupCreateModal.jsx`, `GroupSuggestions.jsx`, `DuplicateDetectorModal.jsx`, `CompareSelectedModal.jsx`, `ProviderSearchDrawer.jsx`, `AI` modals (`AIBusquedaModal.jsx`, `AISearchModal.jsx`, `AIEmailModal.jsx`), servicios `aiSuppliersService.js`, `supplierEventBridge`, `EmailTrackingList.jsx`, `ProviderEmailModal.jsx`, `RFQModal.jsx`, `ReservationModal.jsx`.
> Pendiente: scoring inteligente consolidado, portal proveedor completamente funcional, automatización de RFQ multi-proveedor y reportes comparativos.

## 1. Objetivo y alcance
- Orquestar el ciclo completo de proveedores (planificación, búsqueda, negociación, contratación) apoyado en IA y contexto del proyecto.
- Traducir los requerimientos específicos de cada boda en servicios concretos, permitiendo asociar un proveedor a múltiples servicios o dividirlo cuando cubre ámbitos distintos.
- Integrar tableros para monitorear shortlist (“vistos/buscados”), pipeline operativo y control presupuestario por grupo o servicio.

## 2. Trigger y rutas
- Menú inferior → `Más` → bloque **Proveedores** → “Gestión de proveedores” (`/proveedores`, `GestionProveedores.jsx`).
- El desplegable del mismo bloque incluye “Contratos” (`/proveedores/contratos`) y acceso a fichas individuales (`/proveedores/:id`); el portal externo vive en `/proveedores/:id/portal`.
- `ProviderSearchDrawer` puede abrirse como overlay desde otras vistas (Timeline, Home, Tasks) para alta rápida o búsqueda IA.

## 3. Paso a paso UX
- La vista principal se organiza en pestañas: **Necesidades** (matriz de servicios), **Vistos** (shortlist), **Pipeline** (kanban por línea) y **Contratos** (resumen financiero/documental). El header mantiene acciones globales (buscar IA, añadir manualmente, filtros) visibles en todas las pestañas.
1. Planificación de servicios
   - `ServicesBoard` funciona como matriz de necesidades: lista los servicios críticos para la boda, permite marcar cuáles están “por definir” y sugiere combinaciones habituales según tipo de evento.
   - Cada proveedor puede descomponerse en “líneas de servicio” (ej. `Espacio Las Brisas` → servicios `Venue` y `Catering`). Un wizard de fusión/separación (`SupplierMergeWizard`) guía el proceso: selecciona líneas implicadas, decide si se crean proveedores independientes, reubica contratos/pagos asociados y registra un histórico de cambios.
   - `DuplicateDetectorModal` evita crear líneas duplicadas y guía el proceso de fusión.
2. Exploración y shortlist (**Vistos**)
   - `ProviderSearchDrawer`, `AISearchModal` y `ServicesBoard` lanzan búsquedas IA usando ubicación, presupuesto objetivo y estilo de la boda; los resultados se guardan en la pestaña **Vistos** (`ProveedorList.jsx` en modo shortlist).
   - `ProveedorFiltro` expone pestañas globales (todos/contratados/contactados/favoritos/vistos) y búsqueda rápida que impacta shortlist y pipeline.
   - Desde **Vistos** se promueven proveedores a evaluación o se descartan con motivo. `ProveedorForm` permite capturar proveedores offline y, si se encuentra coincidencia, la IA enriquece datos públicos.
3. Evaluación y negociación
   - `CompareSelectedModal` contrasta propuestas y notas por servicio; `AIEmailModal` genera correos iniciales (la operativa detallada vive en la página de mail).
   - `SupplierKanban` gestiona estados “Por definir → Vistos → Contactados → Presupuesto → Contratado → Rechazado” por línea de servicio, con drag & drop y acciones rápidas.
   - `GroupCreateModal`, `GroupAllocationModal` y `GroupSuggestions` ayudan a equilibrar presupuestos y detectar huecos sin cobertura.
4. Contratación y seguimiento
   - `RFQModal`, `ReservationModal` y `ProviderEmailModal` disparan solicitudes formales; `SupplierEventBridge` alimenta timeline y tareas.
   - Automatizaciones IA monitorean respuestas de correo y estados de contrato/presupuesto: necesitan detectar `budgetStatus = approved` + `contractStatus = signed` (ya sea por lectura del correo, adjunto reconocido o registro manual en Flujo 15). Si solo llega uno de los dos, se crea alerta “Falta validar presupuesto/contrato” antes de mover la línea.
   - Los planificadores pueden marcar “Contacto manual registrado” desde `SupplierKanban` o `ProveedorDetalle` para reflejar comunicaciones fuera del módulo de email; esto evita que el pipeline dependa exclusivamente del rastreo automático.
   - `GestionProveedores` integra las vistas; `ProveedorDetalle` muestra pestañas de información/comunicaciones, detalla qué servicios cubre cada proveedor y enlaza contratos/pagos.
   - Panel lateral “Resumen financiero” expone KPIs agregados (asignado, gastado, presupuestos pendientes, recordatorios, próximo deadline) y aloja filtros globales.

## 4. Persistencia y datos
- Firestore `weddings/{id}/suppliers/{supplierId}`: datos base, notas, presupuesto objetivo, estado pipeline y banderas globales (favorito, proveedor multi-servicio).
- Subcolección `serviceLines` (`weddings/{id}/suppliers/{supplierId}/serviceLines/{lineId}`) para cubrir cada servicio asociado: nombre, categoría, presupuesto objetivo, estado, fechas clave.
- Colecciones auxiliares: `supplierGroups` (agrupaciones, metas), `supplierEmails` (historial de comunicaciones), `supplierRFQ`, `supplierShortlist` (vistos/buscados con fuente y fecha de revisión).
- Logs IA en `weddings/{id}/ai/suppliers/{uuid}` con prompt, respuesta, proveedor, usuario.
- Integración con `finance` refleja gastos confirmados/estimados por proveedor y por línea de servicio.

## 5. Reglas de negocio
- Estados válidos por línea de servicio: `por_definir`, `vistos`, `contactado`, `presupuesto`, `contratado`, `rechazado`. El estado global del proveedor refleja el estadio más avanzado entre sus líneas activas.
- Solo owner/planner pueden eliminar o mover líneas a columnas críticas; assistants gestionan notas y comunicaciones.
- Detección de duplicados por email, nombre, teléfono y coincidencia de servicio. Al fusionar líneas se solicita confirmación y se preserva histórico.
- Shortlist **Vistos** requiere etiqueta de origen (IA, manual, recomendado) y fecha de última revisión; las entradas caducadas disparan recordatorios.
- Automatizaciones IA solo promueven a “contratado” si detectan presupuesto aprobado (`budgetStatus`) y contrato firmado (`contractStatus`). Señales válidas: campos sincronizados desde Flujo 6/15, etiquetas reconocidas en email, adjuntos firmados (PDF con firma). Ante señales inconsistentes se genera tarea “Revisar respuesta”.
- El wizard de fusión/separación preserva contratos, pagos e historiales; si hay facturas vinculadas exige seleccionar a qué línea se reasignan antes de confirmar.
- Grupos respetan presupuesto objetivo agregado; avisos cuando se excede por servicio o categoría.

## 6. Estados especiales y errores
- Falta de IA (sin API) ? modales muestran fallback para entrada manual.
- Tracking email deshabilitado ? panel indica Sin seguimiento activo.
- Registro bancario fallido ? se muestra alerta y se reintenta tras reautenticación.
- Conexión perdida ? tabla y kanban pasan a modo lectura.

## 7. Integración con otros flujos
- Flujo 3 (Invitados/RSVP) aporta datos de perfil y timing para ajustar plantillas de servicios sugeridos.
- Flujo 6 sincroniza presupuestos por proveedor y por línea de servicio, además de controlar pagos planificados.
- Flujo 7 centraliza comunicaciones; las respuestas analizadas por IA actualizan automáticamente el kanban del flujo 5.
- Flujo 14 crea tareas automáticas tras cambios de estado (ej. “revisar propuesta”, “confirmar contrato detectado por IA”).
- Flujo 15 genera contratos y documentos desde la ficha del proveedor (con enlaces por servicio).
- Flujo 17 otorga puntos al confirmar proveedores clave.

## 8. Métricas y monitorización
- Eventos: `supplier_ai_search`, `supplier_service_defined`, `supplier_shortlist_added`, `supplier_stage_changed`, `supplier_email_sent`.
- KPIs: ratio shortlist→contacto→contrato por servicio, cobertura de servicios definidos vs requeridos, tiempo medio por etapa, ahorro conseguido vs presupuesto objetivo.
- Tracking de uso IA (peticiones, aciertos, feedback) y efectividad de detección automática de contratos/presupuestos.

## 9. Pruebas recomendadas
- Unitarias: servicio AI (`aiSuppliersService`), detectores de duplicados, reducers de grupos, normalización de líneas de servicio.
- Integración: definir matriz de servicios, agregar proveedor IA/manual a shortlist, promoverlo a contacto, enviar RFQ, actualizar presupuesto y validar transición automática a contratado.
- E2E: búsqueda IA, consolidación en “Vistos”, comparación, seguimiento de emails y cierre de contrato multi-servicio.

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
