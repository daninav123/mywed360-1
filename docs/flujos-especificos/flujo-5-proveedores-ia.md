# 5. Proveedores con IA (estado 2025-10-07)

> Implementado: `GestionProveedores.jsx` (panel superior plegable con zona de confirmados), `ProveedorList.jsx`, `ProveedorCard.jsx`, `ProveedorDetail.jsx`, `GroupAllocationModal.jsx`, `GroupCreateModal.jsx`, `GroupSuggestions.jsx`, `DuplicateDetectorModal.jsx`, `CompareSelectedModal.jsx`, `ProviderSearchDrawer.jsx`, modales IA (`AIBusquedaModal.jsx`, `AISearchModal.jsx`, `AIEmailModal.jsx`), servicios `aiSuppliersService.js`, `supplierEventBridge`, `EmailTrackingList.jsx`, `ProviderEmailModal.jsx`, `RFQModal.jsx`, `ReservationModal.jsx`.
> Pendiente: scoring inteligente consolidado, portal proveedor completamente funcional, automatización de RFQ multi-proveedor y reportes comparativos.

## 1. Objetivo y alcance
- Orquestar el ciclo completo de proveedores (planificación, búsqueda, negociación, contratación) apoyado en IA y contexto del proyecto.
- Traducir los requerimientos específicos de cada boda en servicios concretos, permitiendo asociar un proveedor a múltiples servicios o dividirlo cuando cubre ámbitos distintos.
- Integrar superficies diferenciadas para monitorizar shortlist (ideas en exploración) y el control presupuestario de confirmados por grupo o servicio.
- Aprovechar `weddingProfile`, `specialInterests` y `noGoItems` para que la IA proponga opciones alineadas con el estilo core y con los contrastes controlados definidos en el flujo 2C (personalización continua), evitando sugerencias que rompan reglas o presupuesto.

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

## 5. Integración con personalización continua
- Consumir `weddingInsights.nextBestActions` para priorizar tareas y recomendaciones dentro del módulo.
- Emitir eventos `supplier_preference_applied` y `supplier_preference_rejected` al confirmar o descartar proveedores sugeridos por contrastes.
- Panel de “packs sorpresa” (ideas IA) se conecta con el asistente (flujo 16) para presentar a planners opciones curadas según `specialInterests`.
   - Panel lateral "Resumen financiero" expone KPIs agregados (asignado, gastado, presupuestos pendientes, recordatorios, próximo deadline) y aloja filtros globales.

## 4. Persistencia y datos
- Firestore `weddings/{id}/suppliers/{supplierId}`: datos base, notas, presupuesto objetivo, estado pipeline y banderas globales (favorito, proveedor multi-servicio).
- Subcolección `serviceLines` (`weddings/{id}/suppliers/{supplierId}/serviceLines/{lineId}`) para cubrir cada servicio asociado: nombre, categoría, presupuesto objetivo, estado, fechas clave.
- Colecciones auxiliares: `supplierGroups` (agrupaciones, metas), `supplierEmails` (historial de comunicaciones), `supplierRFQ`, `supplierShortlist` (vistos/buscados con fuente y fecha de revisión).
- Subcolección `supplierMeetings` (citas, recordatorios, enlaces calendario) sincronizada con `ReservationModal` y timeline.
- Repositorio global `supplierInsights/{supplierId}` agrega métricas históricas entre bodas (ratio de respuesta, precio medio contratado, satisfacción) y enlaces a reseñas; se actualiza al cerrar cada línea de servicio.
- Logs IA en `weddings/{id}/ai/suppliers/{uuid}` con prompt, respuesta, proveedor, usuario.
- Integración con `finance` refleja gastos confirmados/estimados por proveedor y por línea de servicio.

## 5. Reglas de negocio
- Estados válidos por línea de servicio: `por_definir`, `vistos`, `contactado`, `presupuesto`, `contratado`, `rechazado`. El estado global del proveedor refleja el estadio más avanzado entre sus líneas activas.
- Solo owner/planner pueden eliminar o mover líneas a columnas críticas; assistants gestionan notas y comunicaciones.
- Detección de duplicados por email, nombre, teléfono y coincidencia de servicio. Al fusionar líneas se solicita confirmación y se preserva histórico.
- Shortlist **Vistos** requiere etiqueta de origen (IA, manual, recomendado) y fecha de última revisión; las entradas caducadas disparan recordatorios.
- Automatizaciones IA solo promueven a "contratado" si detectan presupuesto aprobado (`budgetStatus`) y contrato firmado (`contractStatus`). Señales válidas: campos sincronizados desde Flujo 6/15, etiquetas reconocidas en email, adjuntos firmados (PDF con firma). Ante señales inconsistentes se genera tarea "Revisar respuesta".
- El wizard de fusión/separación preserva contratos, pagos e historiales; si hay facturas vinculadas exige seleccionar a qué línea se reasignan antes de confirmar.
- Todos los correos y citas quedan registrados (colecciones `supplierEmails` y `supplierMeetings`); si falta correspondencia entre agenda y card se genera alerta para revisión manual.
- Al cerrar una línea de servicio se persiste un snapshot en `supplierInsights` con métricas agregadas y feedback; se valida que cada proveedor comparta ID global para evitar duplicados.
- Grupos respetan presupuesto objetivo agregado; avisos cuando se excede por servicio o categoría.

## 6. Estados especiales y errores
- Falta de IA (sin API) -> modales muestran fallback para entrada manual.
- Tracking email deshabilitado -> panel indica "Sin seguimiento activo".
- Registro bancario fallido -> se muestra alerta y se reintenta tras reautenticación.
- Conexión perdida -> las vistas de tarjetas (exploración/confirmados) pasan a modo lectura y muestran aviso de reconexión.

## 7. Integración con otros flujos
- Flujo 3 (Invitados/RSVP) aporta datos de perfil y timing para ajustar plantillas de servicios sugeridos.
- Flujo 6 sincroniza presupuestos por proveedor y por línea de servicio, además de controlar pagos planificados.
- Flujo 7 centraliza comunicaciones; las respuestas analizadas por IA actualizan automáticamente las tarjetas y KPIs asociados (a través del [Flujo 16](./flujo-16-asistente-virtual-ia.md)).
- Flujo 14 crea tareas automáticas tras cambios de estado (ej. "revisar propuesta", "confirmar contrato detectado por IA").
- Flujo 15 genera contratos y documentos desde la ficha del proveedor (con enlaces por servicio).
- Flujo 17 otorga puntos al confirmar proveedores clave.
- Flujo 23 consolida métricas globales de proveedores y muestra comparativas históricas en el dashboard de proyecto.

## 8. Métricas y monitorización
- Eventos: `supplier_ai_search`, `supplier_service_defined`, `supplier_shortlist_added`, `supplier_stage_changed`, `supplier_email_sent`.
- KPIs: ratio shortlistcontactocontrato por servicio, cobertura de servicios definidos vs requeridos, tiempo medio por etapa, ahorro conseguido vs presupuesto objetivo, variaciones respecto al promedio global del proveedor (`supplierInsights`).
- Tracking de uso IA (peticiones, aciertos, feedback), efectividad de detección automática de contratos/presupuestos y tasa de comunicaciones pendientes (indicador rojo activo).
- La analítica IA consolidada vive únicamente en backend (`GET /api/admin/suppliers/analytics`) y se visualiza solo en el dashboard administrativo; la UI del flujo no renderiza métricas IA para los usuarios finales.

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

