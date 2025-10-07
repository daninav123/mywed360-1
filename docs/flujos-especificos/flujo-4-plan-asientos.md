# 4. Plan de Asientos (estado 2025-10-07)

> Implementado: `SeatingPlanRefactored.jsx`, `SeatingPlanCanvas.jsx`, `SeatingPlanToolbar.jsx`, `SeatingPlanSidebar.jsx`, `SeatingLibraryPanel.jsx`, `SeatingGuestDrawer.jsx`, `SeatingPlanModals.jsx`, `CeremonyConfigModal.jsx`, `FreeDrawCanvas.jsx`, hooks `useSeatingPlan.js` y `useSeatingPlan.hook.js`.
> Pendiente: panel avanzado `GuestSidebar`, generador automatico de plantillas, reportes/exportadores enriquecidos y vista movil optimizada.

## 1. Objetivo y alcance
- Entregar un espacio unificado para disenar y compartir mapas de asientos diferenciados para ceremonia y banquete, mas un modo libre para planos especiales.
- Permitir que planificadores gestionen inventario de mesas, invitados pendientes y elementos visuales antes de compartir con proveedores.
- Garantizar coherencia con RSVP, restricciones y calendario, evitando asignaciones invalidas.

## 2. Modos y diferencias clave
- **Ceremony**: permite decidir si se reservaran cero, algunas o todas las filas (familia directa, padrinos, cortejo). El seating libre se representa como bloque general y no se dibuja silla por silla. Incluye barra lateral exclusiva para seleccionar a los VIP mediante buscador y arrastrarlos a filas reservadas. Un boton `Definir sillas` abre el configurador donde se elige cantidad total de sillas (slider 0 -> total de invitados), filas reservadas y plantilla de disposicion; la IA genera automaticamente la malla propuesta (clasica, envolvente circular, semicirculo, multi-pasillo) ajustada al numero elegido.
- **Banquet**: parte de la preasignacion realizada en la pagina de Invitados. Al abrir la pestaña se importan las mesas existentes y la IA sugiere hasta tres layouts segun cantidad/capacidad de mesas. El usuario puede aceptar una plantilla o ajustar posiciones, crear mesas adicionales (auxiliares de staff/proveedores) con o sin invitados asignados, mover invitados entre mesas o dejarlos sin mesa para revisarlos luego.
- **Free-draw**: lienzo sin restricciones para zonas auxiliares (coctel, proveedores, areas infantile). No participa en la validacion de capacidad pero se guarda junto al resto de tabs para referenciar en otras areas.
- El usuario puede mover invitados entre modos sin perder metadata. Los cambios en un modo no se propagan a los demas salvo que el sistema pregunte explicita duplicacion (modal "Copiar distribucion al banquete").

## 3. Trigger y rutas
- Entrada principal desde menu lateral -> `/plan-asientos` (`SeatingPlanRefactored.jsx`).
- Tabs internas `ceremony`, `banquet` y `free-draw` persisten en query param `?tab`.
- Atajos: desde Invitados (boton "Asignar mesa") se abre `SeatingGuestDrawer` en tab `banquet`; desde Timeline (hito "Ceremonia") se abre con tab `ceremony` y modal de configuracion.

## 4. Paso a paso UX
1. Preparacion general
   - Toolbar centraliza undo/redo, zoom, selector de modo (boundary, table, chair, layout, free-draw), botones de exportar y acceso a configuraciones especificas por tab.
   - Library panel ofrece perimetros, plantillas guardadas, capas decorativas y toggles de reglas (snap, grid, numeracion). Incluye herramientas de trazado rapido para:
     * Definir contornos con poligonos, lineas Bezier y rectas, mostrando medidas en metros/pies y angulos al arrastrar.
     * Insertar obstaculos del venue (columnas, barras, escenarios, puertas) con dimensiones editables y capas bloqueables.
     * Dibujar pasillos y zonas de circulacion mediante la herramienta `AislePainter`, con opciones de ancho minimo y color diferenciador.
   - Desde la library tambien se expone el switch entre ver invitados por estado RSVP o por rol, el acceso directo al boton `Definir sillas` cuando el tab es ceremony y el boton `Sugerir layout` en banquet para reabrir el asistente IA.
   - `SeatingPlanCanvas` soporta regla lateral, snap a grid configurable, visualizacion de distancias entre elementos y bloqueo de perimetros para evitar desplazamientos accidentales.
2. Edicion en Ceremony
   - `CeremonyConfigModal` evoluciona para gestionar total de sillas, numero de filas, cantidad de filas reservadas (desde cero hasta el total), ancho de pasillos y plantilla IA seleccionada (clasica, envolvente, semicirculo, multi-pasillo). El slider de sillas se limita al numero de invitados confirmados y muestra tooltip con equivalencias (`n` sillas = `m` filas x `k` asientos).
   - Estructura del modal:
     1. Bloque de inputs primarios (slider `Total de sillas`, numeric stepper `Filas reservadas`, toggle `Agregar filas libres` con contador).
     2. Selector de plantilla IA con tarjetas previsualizadas; cambiar de plantilla recalcula la malla previa a confirmacion.
     3. Controles de pasillos (checkbox `Doble pasillo`, input de ancho) y resumen de capacidad restante.
     4. CTA `Generar distribucion` que dispara la IA y muestra previsualizacion editable antes de aplicar.
   - `CeremonyPrioritySidebar` (solo visible en tab ceremony) muestra buscador de invitados VIP, chips por rol (Parents, Cortejo, Testigos, Padrinos) y arrastrar/soltar hacia las filas reservadas. Cuando se suelta un invitado, se colorea la silla correspondiente y se actualiza la lista de pendientes.
   - `SeatingPlanCanvas` solo dibuja las filas reservadas; las filas libres se representan como zona sombreada con conteo de capacidad y badge `Seating libre`. Drag and drop coloca invitados en posicion relativa (fila, asiento) y permite agrupar acompanantes en bloques contiguos con quick action `Mantener juntos`.
3. Edicion en Banquet
   - Al cargar la pestaña se importan las mesas definidas en Flujo 3 (`guest.tableId`) y se generan objetos `table` con capacidad inicial igual al numero de invitados asignados. Las mesas sin posicion previa quedan en panel lateral hasta aplicar una distribucion.
   - `SeatingPlanModals` incorpora un `LayoutSuggestionsModal` que ofrece hasta tres distribuciones IA (clasica, islas, perimetral) calculadas a partir del numero de mesas, su tamanio medio y restricciones del venue. Puede relanzarse desde la toolbar o el boton `Sugerir layout`.
   - `SeatingPlanCanvas` coloca las mesas segun el layout seleccionado y permite moverlas, rotarlas, duplicarlas o eliminarlas. Al crear una mesa manual se solicita nombre, capacidad y tipo (`principal`, `auxiliar`, `staff`) y se marca como `manual` para distinguirla de las importadas.
   - `SeatingGuestDrawer` agrupa invitados por mesa original y muestra una seccion "Sin mesa". Arrastrar un invitado a otra mesa actualiza `guest.tableId` y muestra alerta si la nueva mesa supera capacidad; soltarlo en "Sin mesa" lo deja pendiente de reasignacion.
- `SeatingPlanSidebar` edita propiedades (tipo, capacidad, etiquetas, notas de servicio) e incluye acciones `Bloquear mesa` (la IA no la mueve) y `Liberar invitados` (devuelve todos los asignados a la seccion "Sin mesa"). Para mesas auxiliares se permite marcar si aceptan invitados o son solo de staff/decoracion.
4. Free draw y capas compartidas
   - `FreeDrawCanvas` crea capas decorativas (escenario, pista, areas proveedor) con colores y leyendas. No valida capacidad pero si respeta snap y limites del venue.
   - Las capas pueden mostrarse o esconderse por tab; banquete puede reutilizar el mismo fondo para mantener consistencia.
5. Guardado y exportacion
   - Autosave cada 5 s con debounce via `useSeatingPlan`. Guardado manual forzado cuando se exporta.
   - Exportacion actual genera imagen raster y JSON del layout. Roadmap contempla PDF/SVG con leyendas.

## 5. Persistencia y datos
- Firestore `weddings/{id}/seating/{tab}` con payload `{ layout, tables, seats, layers, settings, lastEditedBy, lastEditedAt }`. `tables` persiste objetos `{ id, sourceTableId, label, capacity, layoutPosition, manual, locked, tableKind }` donde `sourceTableId` apunta a la mesa definida en Invitados y `tableKind` determina si es principal, auxiliar o staff.
- `settings.ceremony` ahora contiene `{ totalChairs, reservedRows, freeSeatingCapacity, aisleConfig, aiTemplate, accessibilityBlocks }`. `reservedRows` puede ser lista vacia (sin filas asignadas) o abarcar todas las filas. `freeSeatingCapacity` = `totalChairs - (sum(reservedRows.capacity))` y se recalcula cuando cambia el slider. `settings.banquet` agrega `{ aiLayoutTemplate, layoutVersion, lockedTables, auxiliaryTablePolicy }` para rastrear la plantilla aplicada, mesas bloqueadas y si las mesas auxiliares aceptan invitados.
- Invitados asignados guardan `guestId`, `seatId`, `tableId`, `role`, `side`, `dietaryTag`, `linkedGuestIds`. Para ceremony solo existen `seatId` en filas reservadas; el seating libre se resume en `freeSeatingCapacity` y contador `freeSeatingPendingGuests`. En banquet `tableId` se mantiene sincronizado con Flujo 3 y permite `tableId = null` para invitados vinculados a mesas auxiliares solo staff.
- Historial de versiones basico en `weddings/{id}/seatingSnapshots` para auditoria manual. Cada snapshot almacena metadata `{ tab, generatorVersion, configHash }` para trazar plantillas IA aplicadas.
- Notas operativas:
  - `totalChairs` inicia con total de invitados confirmados + 10% redondeado; se puede bajar a cero para ceremony simbolica sin seating.
  - Import al abrir banquet: se agregan mesas faltantes si se detectan invitados con `tableId` nuevo en Invitados. Si se eliminan mesas manualmente, los invitados quedan en "Sin mesa" y se registra `tableId = null`.
  - Cambios de RSVP disparan recalculo en background mediante trigger que ajusta `freeSeatingCapacity`, reevalua sugerencias de layout y publica evento `ceremony_capacity_updated`.
  - Exportadores deben incluir resumen de filas reservadas (nombre invitado, fila, asiento) y seccion separada para seating libre con capacidad total, ademas del listado de mesas con invitados asignados tras cualquier override.

## 6. Reglas de negocio
- Invitado no puede ocupar multiples asientos simultaneamente (validacion por `guestId` global).
- En ceremony se validan exclusivamente las filas reservadas; el resto de sillas se marcan como "general seating" y no requieren asignacion individual. El slider de total de sillas no puede superar invitados confirmados + margen definido por el usuario.
- En banquet la IA solo reacomoda posiciones; no crea ni elimina mesas ni cambia capacidad sin confirmacion explicita. Para fusionar o dividir mesas se abre wizard que sincroniza con Invitados.
- Mesas auxiliares marcadas como `solo staff` no se incluyen en las métricas de invitados asignados ni en sugerencias IA, pero persisten en el layout y exportaciones.
- Capacidad por fila (ceremony reservada) y por mesa (banquet) debe respetarse antes de guardar; se permite sobrerreserva temporal solo en modo edicion con aviso amarillo.
- Cuando se arrastra un invitado a nueva mesa, se actualiza `guest.tableId` y se crea registro en timeline y tarea pendiente si la mesa queda sobre capacidad.
- Roles: owner/planner pueden crear y borrar mesas, assistants solo asignan invitados, viewers modo lectura.
- Duplicar layout entre tabs requiere confirmacion explicita y no sobreescribe capas personalizadas salvo aceptacion.
- Cuando RSVP cambia a cancelado, se libera asiento y se crea aviso en timeline.

## 7. Estados especiales y errores
- Sin invitados confirmados se muestra banner con CTA hacia Flujo 3 (Invitados) para importar listas.
- Si hay desconexion, se activa modo lectura con toast persistente y boton "Reintentar guardado".
- Conflictos de guardado muestran modal con diff basica (quien edito, que tab) y opcion de sobrescribir o clonar como nueva version.
- Plantillas vacias disparan mensaje "No hay plantillas disponibles aun" con enlace a catalogo en Flujo 12 (Biblioteca visual).

## 8. Integracion con otros flujos
- Flujo 3 (Invitados/RSVP) provee fuente de invitados, tags, restricciones alimentarias y la preasignacion `tableId`. Los cambios realizados en banquet regresan como actualizaciones al listado de invitados.
- Flujo 6 (Presupuesto) usa la capacidad definida para pedir mobiliario y reflejar costos, considerando mesas auxiliares si aceptan invitados.
- Flujo 9 (RSVP confirmaciones) alimenta estado de invitados pendientes y acompanantes.
- Flujo 11 (Ceremonia) reutiliza el layout ceremony para protocolo y orden de entrada.
- Flujo 14 (Tasks) crea recordatorios cuando faltan asignaciones criticas o hay conflictos.
- Flujo 17 (Gamificacion) suma puntos al completar 100% de invitados asignados.

## 9. Metricas y monitorizacion
- Eventos: `seating_tab_opened`, `seating_ai_layout_previewed`, `seating_template_applied`, `seating_guest_assigned`, `seating_layout_saved`, `seating_conflict_resolved`.
- Guardar duracion de sesion activa, conversion a exportacion, y ratio de invitados sin asignar tras n dias antes del evento.
- Alertas en logs cuando autosave falla mas de 3 veces o cuando se detecta layout superando limite de documentos Firestore.

## 10. Pruebas recomendadas
- Unitarias: reducers `useSeatingPlan`, helpers de generacion de filas y calculo de capacidad, filtros de `SeatingGuestDrawer`.
- Integracion: crear layout ceremony, asignar cortejo, exportar; en banquet importar mesas desde Invitados, aplicar sugerencia IA, mover invitado a nueva mesa y validar sincronizacion de `tableId`.
- E2E: flujo completo con invitado confirmado -> asignacion -> cambio de RSVP -> liberacion de asiento -> exportacion y verificacion en timeline.

## 11. Checklist de despliegue
- Reglas Firestore actualizadas para `weddings/*/seating/*` con limites de size y validacion por rol.
- Seed inicial de plantillas ceremony/banquet y assets SVG sincronizados.
- Revisar traducciones y tooltips por modo, asegurando copy diferenciado ceremony vs banquet.
- QA responsivo en tablets para toolbar y drawer; validar accesibilidad de drag and drop con teclado.

## 12. Roadmap / pendientes
- Lanzar `GuestSidebar` con recomendaciones automaticas y deteccion de conflictos de mesas.
- Entrenar IA para proponer distribuciones ceremony avanzadas segun venue, tipo de ceremonia y numero de sillas elegido.
- Exportacion avanzada (PDF/SVG) con capas, leyendas y lista de invitados por zona.
- Sincronizacion colaborativa en tiempo real con bloqueo optimista por elemento.
- Vista movil simplificada que permita asignar invitados en modo lista y ver progreso por tab.
