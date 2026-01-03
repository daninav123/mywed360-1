# 4. Invitados – Plan de Asientos (estado 2025-10-12)

> Implementado (código 2025-10-08):  
> • Plano unificado (`SeatingPlanRefactored.jsx`, `SeatingPlanCanvas.jsx`, `SeatingPlanToolbar.jsx`, `SeatingLibraryPanel.jsx`, `SeatingGuestDrawer.jsx`).  
> • Configuración de ceremonia con reservas VIP y bloqueo de filas (`CeremonyConfigModal.jsx`, `SeatingInspectorPanel.jsx`).  
> • Exportador avanzado (PDF detallado, SVG por pestaña, CSV extendido) desde `SeatingExportWizard.jsx` + `useSeatingPlan`.  
> • Panel inteligente de seating con recomendaciones automáticas en banquete (`SeatingSmartPanel.jsx`).  
> • Hooks y servicios base: `useSeatingPlan`, `useGuests`, `SyncService`.

> Pendiente o incompleto:  
> • Panel inteligente de invitados con recomendaciones IA (en inspector sólo hay heurísticas simples).  
> • Automatización avanzada de versionado/plantillas y sincronización documental backend (roadmap).  
> • Auditoría de accesibilidad/UX tras los cambios recientes.

> Nota: la antigua “Biblioteca de Contenido” se documenta ahora en los flujos dedicados `flujo-24-galeria-inspiracion.md`, `flujo-25-inspiracion.md` y `flujo-26-blog.md`.

Este flujo cubre el módulo de plan de asientos (ceremonia, banquete y áreas libres) dentro de Invitados.

## 1. Objetivo y alcance
- Diseñar y mantener mapas de asientos para ceremonia, banquete y zonas libres.
- Garantizar coherencia entre invitados, RSVP y protocolo.
- Facilitar exportaciones y comunicación con proveedores y equipo operativo.

## 2. Trigger y rutas
- Menú inferior → `Más` → bloque **Invitados** → opción “Plan de asientos” (`/invitados/seating`).  
- Menú inferior → `Más` → bloque **Invitados** → opción “Gestión de invitados” (`/invitados`) para ajustes complementarios.  
- Deep-link desde emails/notificaciones cuando se detectan cambios en RSVP o seating pending review.

## 3. Paso a paso UX

La vista principal (`SeatingPlanRefactored`) agrupa el contexto de DnD, la lógica de persistencia y los paneles laterales. La disposición en escritorio sigue un patrón fijo:
- Barra superior con tabs (`SeatingPlanTabs`) y toolbar (`SeatingPlanToolbar`).
- Columna izquierda con la biblioteca/configuraciones (`SeatingLibraryPanel`) y, en banquete, el panel inteligente (`SeatingSmartPanel`).
- Área central con el canvas (`SeatingPlanCanvas`) y overlays contextuales (selección, guías, rulers).
- Columna derecha con el inspector (`SeatingInspectorPanel`/`SeatingPlanSidebar`) y el cajón de invitados (`SeatingGuestDrawer`).
- Capa flotante con modales (`SeatingPlanModals`) y toasts de `react-toastify` para feedback inmediato.

### 3.1 Preparación general
- `SeatingPlanTabs` permite alternar entre Ceremonia y Banquete con indicadores de avance (`ceremonyProgress`, `banquetProgress`) y contadores de elementos (`ceremonyCount`, `banquetCount`). El progreso se visualiza tanto en la pastilla individual como en una barra inferior que actúa de feedback continuo.
- `SeatingPlanToolbar` centraliza undo/redo, zoom (fit-to-content), exportaciones rápidas, apertura del asistente avanzado y herramientas de alineación/distribución. Gestiona snapshots locales (guardar/cargar/restaurar) y el historial de acciones.
- **Auto-asignación**: al habilitar `VITE_ENABLE_AUTO_ASSIGN`, el motor (`autoAssignGuests`) recorre primero VIP y restricciones (alergias, accesibilidad), respeta parejas marcadas, evita conflictos (alergias incompatibles, familiares separados) y llena huecos empezando por mesas con capacidad disponible. Los cambios ofrecen previsualización antes de confirmarlos y se pueden revertir con undo/redo.
- También expone toggles dedicados: mostrar/ocultar mesas, rulers, snap a cuadrícula (`gridStep`), numeración de sillas, validaciones en vivo, modal de capacidad global y limpieza rápida del salón.
- `SeatingLibraryPanel` ofrece plantillas, capas decorativas, fuentes de invitados y toggles de reglas (snap, grid, numeración). Contiene acciones rápidas para añadir mesas por tipo, abrir el Guest Drawer, cargar plantillas de venue y alternar la visibilidad de elementos (mesas, rulers, números de asiento), además de badges con pendientes por asignar y una leyenda coloreada con el conteo de áreas dibujadas (perímetro, puertas, obstáculos, pasillos, etc.). El bloque de mesas y el control de visibilidad solo aparecen en **Banquete** para evitar ruido en Ceremonia, e incluye medidores de capacidad (ocupadas/libres) por tipo de mesa.
- Barra de estado inferior: muestra zoom, métricas del salón, conflictos activos y los colaboradores conectados en tiempo real (lista con iniciales coloreadas). La presencia se sincroniza vía Firestore (`weddings/{id}/seatingPresence/{clientId}`); si dos editores actúan sobre la misma mesa aparece un banner ámbar "Edición simultánea" y el área queda resaltada hasta que se liberan los cambios.
- `SeatingPlanModals` agrupa el resto de configuraciones: `CeremonyConfigModal`, `BanquetConfigModal`, configuración del espacio (dimensiones/pasillos), selector de plantillas (`VenueTemplateSelector`), editor de fondo (`BackgroundModal`) y modal de capacidad global. Antes de persistir, cada modal valida contra reglas de seguridad (capacidad máxima, anchos mínimos de pasillo, accesibilidad) usando `useSeatingPlan` (`saveHallDimensions`, `saveBackground`, `applyBanquetTables`) y comunica el resultado con toasts.

### 3.2 Ceremonia (`tab=ceremony`)
1. `CeremonyConfigModal` define filas/columnas, pasillos, reservas VIP, etiquetas y notas internas.  
2. `SeatingInspectorPanel` muestra fila activa, ocupación, asientos VIP y atajos de asignación guiada (padrinos/familiares).  
3. Drag & drop asigna invitados; la agrupación rápida sugiere parejas, padrinos y familiares cercanos. El inspector advierte si se rompe una reserva VIP o si la fila queda desequilibrada.

### 3.3 Banquete (`tab=banquet`)
1. `SeatingPlanCanvas` permite crear/duplicar mesas (round, imperial, cocktail) y ajustar dimensiones/rotación.  
2. `SeatingGuestDrawer` lista invitados pendientes con filtros (lado, dieta, grupo), buscador y contadores por estado. Permite fijar invitados “en guía” (`guidedGuestId`) para seguimiento rápido, mostrar badges VIP/alergias y alternar entre vista de lista o tarjetas compactas.  
3. `SeatingPlanSidebar` edita atributos de la mesa (tipo, etiquetas, notas) y avisa cuando se excede capacidad.  
4. `SeatingSmartPanel` aplica heurísticas IA/heurísticas: propone ubicaciones por afinidad (familia, lado, grupo), prioriza dietas y accesibilidad, sugiere intercambios cuando detecta mesas sobrecargadas o invitados sin asiento y resume KPIs (personas sin asignar, % de ocupación, conflictos abiertos).

### 3.4 Zonas libres (`tab=free-draw`)
- `FreeDrawCanvas` dibuja zonas libres (escenario, proveedores, áreas infantiles) sin validación de capacidad, reutilizable en otras tabs.

### 3.5 Guardado y exportación
- **Autosave**: guarda en Firestore (`weddings/{id}/seatingPlan/{ceremony|banquet}`) con debounce de ~800 ms. Si no hay elementos, evita crear documentos vacíos.
- **Snapshots manuales**: el menú *Snapshots* almacena copias locales (`localStorage.seatingSnapshots` por boda) con nombre y timestamp; al restaurar se muestra previsualización antes de sobrescribir.
- **Historial remoto** (roadmap inmediato): cada autosave guarda `updatedBy`, `updatedAt` y versión incremental para auditoría.
- **Exportes**:
  * **PDF operativo**: plano completo + leyenda, lista por mesa, invitados sin asignar, indicadores de dieta/VIP.
  * **SVG**: un archivo por pestaña (ceremonia/banquete) pensado para imprimir o retocar en Illustrator.
  * **CSV extendido**: columnas `mesa`, `silla`, `invitado`, `acompañante`, `dieta`, `notas`, `vip`, `grupo` para catering/proveedores.
  * **PNG rápido**: captura del canvas con márgenes configurables para enviar por mensajería.
- `SeatingExportWizard` recuerda el último preset (orientación, escala, secciones) y muestra resumen de peso/tiempo estimado antes de descargar.

### 3.6 Experiencia móvil
- Canvas en modo "scroll-pan" con gestos naturales: pinch para zoom, doble tap para centrar, arrastre con dos dedos para pan.
- Toolbar se condensa en `ActionSheet` inferior con acciones esenciales (zoom, undo/redo, exportar, ver invitados, auto-asignación).
- Biblioteca e inspector se abren como paneles deslizables a pantalla completa; recuerdan la última pestaña utilizada.
- Invitados aparecen en tarjetas compactas con badges de estado (asignado, dieta, VIP, restricciones) y acceso rápido a WhatsApp.
- Autosave sigue activo cada 30 s y muestra aviso "Guardando…" o "Sin conexión" cuando corresponde.
- `SeatingMobileOverlay` mantiene minimapa simplificado basado en `hallSize` y primeras mesas (placeholder actual) y lista comprimida de mesas con ocupación; botones flotantes permiten abrir el guest drawer y exportador avanzado.
### 3.7 Feedback y estados
- Toasts diferenciados (`react-toastify`): verde (éxito), ámbar (alertas), rojo (errores cr críticos).
- Indicadores visuales: mesas sobrecargadas en rojo, mesas casi llenas en ámbar, segmentos vacíos en gris; badges de invitado muestran dieta, accesibilidad, VIP y conflictos.
- Autosave y snapshots muestran banners discretos (“Guardando…”, “Cambios guardados”) en barra inferior; si falla el guardado aparece toast rojo + opción “Reintentar”.
- Acciones intensivas (auto-asignar, limpiar salón, exportar) presentan cuadro de confirmación y resumen de cambios antes de aplicarse.
## 4. Persistencia y datos
- `weddings/{id}/seating/{tab}`: `tables`, `seats`, `settings`, metadatos de ceremonia, capas libres y versión.
- `weddings/{id}/guests`: fuente viva para `SeatingGuestDrawer`, estado RSVP y restricciones (dietas, accesibilidad).
- `weddings/{id}/seatingLocks/{resourceType-resourceId}`: bloqueos optimistas por recurso con TTL corto; la UI muestra quién está editando.
- `weddings/{id}/seatingPresence/{clientId}`: presencia en tiempo real para mostrar colaboradores conectados y su área de trabajo.
- `weddings/{id}/seatingHistory` (opcional): historial extendido para auditoría/deshacer avanzado.
- Snapshots locales: `localStorage seatingPlan:{weddingId}:snapshot:*` + índice; se conservan por dispositivo y pueden exportarse en JSON (modo DEV).

## 5. Reglas de negocio
- Capacidad mesa ≥ invitados asignados; al sobrepasar se marca conflicto `overbooking` y se impide guardar hasta resolver.
- Un invitado no puede ocupar dos asientos; `useSeatingPlan` detecta duplicados antes de confirmar arrastre/asignación.
- Reglas de proximidad: invitados con alergias incompatibles no pueden compartir mesa (configurable); accesibilidad reserva sillas cercanas a pasillos.
- Roles: planner/owner/assistant pueden editar/exportar; colaboradores invitados entran en modo lectura.
- Versionado: autosaves guardan versión incremental; snapshots antiguos se abren en modo lectura para comparar antes de restaurar.

### 3.8 Diseño visual y orden
- Layout mantiene canvas centrado con márgenes laterales de 24 px y paneles con `min-width` 320 px.
- Grid base de 16 px para espaciado interno; elementos se agrupan por tarjetas con sombras suaves.
- Paleta: fondo neutro (#F4F5F7), paneles blancos con sombras de 8 px; iconografía consistente con sistema de diseño.
- Tooltips y toasts usan tipografía compacta para evitar ruido; iconos por estado emplean colores accesibles (AA).
- Se recomienda cerrar paneles secundarios al trabajar en lienzo pequeño; la UI recuerda última disposición.

### Validaciones y alertas
- **Perímetro** (`out_of_bounds`): mesas y sillas deben permanecer dentro del polígono del salón.
- **Obstáculos/Puertas** (`obstacle`, `door`): conflicto cuando se invade un área marcada como inaccesible.
- **Pasillos y espaciado** (`spacing`): controla `aisleMin` y `tableGap`; mesas en rojo cuando no cumplen.
- **Capacidad** (`overbooking`): invitados > asientos; el panel sugiere mesas con espacio disponible.
- **Duplicados** (`duplicate_guest`): invita al usuario a saltar al asiento conflictivo y resolver.
- **Restricciones** (`restriction_mismatch`): dietas o accesibilidad en mesas incompatibles generan alerta ámbar.
- Los conflictos aparecen en el inspector y en `SeatingSmartPanel` con severidad (crítico/atención). Las exportaciones los incluyen en un anexo para proveedores.


## 6. Estados especiales y errores
- Sin invitados confirmados → banner “Agrega invitados primero” y enlace directo a gestión de invitados.
- Conflictos no resueltos → contador persistente y advertencia al intentar exportar.
- Error de autosave → toast rojo, rollback optimista y botón “Reintentar”.
- Modo offline → se permite edición local pero exportes quedan bloqueados; al reconectar se sincroniza y muestra toast verde.
- Colaboración: cuando otro usuario guarda encima, se muestra notificación “Se publicó una versión más reciente” con opción de cargar diferencias; se recomienda usar snapshots antes de cambios grandes.
- UX responsive: `SeatingMobileOverlay` ofrece accesos rápidos y atajos táctiles; en desktop se habilitan atajos (1-6 herramientas, Ctrl/Cmd+Z/Y, Shift+Mouse para mover todas las mesas).

## 7. Integración con otros flujos
- **Guest + RSVP (flujos 3/9)**: confirmaciones liberan o asignan sillas automáticamente; el Smart Panel recalcula prioridades.
- **Protocolo (flujos 11/11A)**: reservas VIP y notas ceremoniales alimentan seating y se reflejan en exportes.
- **Checklist (flujo 14)**: genera tareas cuando existen conflictos sin resolver o invitados sin asiento.
- **Finanzas/Contratos (flujos 6/15)**: catering recibe CSV actualizado tras cada exportación avanzada.
- **Sitio público y comunicaciones (flujos 21, 24–26)**: pueden adjuntar renders PNG/SVG generados desde seating.
- **Automatizaciones (flujos 12/16)**: eventos `seating_conflict_detected`, `seating_guest_reassigned` dispararán reglas IA (roadmap).

## 8. Métricas y monitorización
- Eventos: `seating_template_applied`, `seating_guest_assigned`, `seating_guest_removed`, `seating_conflict_detected`, `seating_autoassign_run`, `seating_export_generated`.
- KPIs: sillas libres por mesa, ratio VIP asignados, tiempo medio hasta "versión aprobada", número de exportes por preset, veces que se usó auto-assign.
- Logs: `seatingPresence`, `seatingSnapshots`, `seatingAudit` (roadmap) y métricas IA (`smartPanelSuggestions`).

## 9. Pruebas recomendadas
- Unitarias: reducers de `useSeatingPlan`, validaciones de `SeatingGuestDrawer`, heurísticas de `SeatingSmartPanel`, helpers de exportación.
- Integración: aplicar plantilla → auto-assign → ajustar manualmente → guardar/exportar → restaurar snapshot.
- E2E sugeridas: `seating_basic`, `seating_conflicts`, `seating_export`, `seating_mobile_overlay` (usar helpers `__SEATING_TEST_HELPERS__`).
- Nota: habilitar modo `?fixture=seating-demo` y mocks de descarga para pruebas deterministas.

## 10. Checklist de despliegue
- Revisar reglas Firestore (`seating`, `seatingHistory`, `seatingLocks`, `seatingPresence`).
- Validar seeds y límites (mesas, invitados) para rendimiento y uso de auto-assign.
- Testear exportes (PDF/SVG/CSV/PNG) con presets y tamaño de archivos.
- Verificar experiencia móvil/desktop: márgenes, paneles, persistencia de toggles, contraste.
- Automatizar backups periódicos de `seating` + `seatingHistory` para auditoría.

## 11. Roadmap / pendientes
- Panel lateral inteligente con recomendaciones autónomas y resolución de conflictos por IA.  
- Colaboración en tiempo real: evolucionar hacia versionado avanzado (locks y merge multi-editor) sobre la presencia y sincronización actuales.  
- Integración con proveedores/venues (ingesta automática de planos y configuraciones).  
- Exportaciones con presets guardados y envío directo a stakeholders.
- Reestructurar el PDF avanzado en secciones dedicadas (mapa de ceremonia, plano de banquete, lista global, invitados por mesa, dietas especiales, VIP de Momentos Especiales).  

## 12. Resumen operativo de brechas detectadas
- **Seating IA**: faltan simulaciones multi-escenario y aprendizaje continuo.  
- **Versionado colaborativo**: merge asistido básico; falta presencia en tiempo real.  
- **Exportaciones**: pendientes workflows compartidos, presets y automatización de envíos.  
- **Accesibilidad/UX**: revisar lectura con teclado y contraste del canvas tras refactor 2025-10.

## 13. Plan de QA incremental (2025-10-12)
### Estado actual verificado
- Drag & drop depende de interacciones complejas en canvas (`react-konva`); no hay helpers Cypress listos.
- Los datos provienen de Firestore real; no se han creado seeds controladas para entornos de prueba.
- Las exportaciones abren descargas reales (PDF/SVG/CSV) sin posibilidad de interceptar fácilmente desde Cypress.
- Sistema de conflictos (`useSeatingPlan`) requiere RSVP/estado invitado que hoy depende de datos en vivo.

### Experiencia mínima a construir
- Crear modo sandbox (`?fixture=seating-demo`) que cargue planos e invitados desde JSON estáticos (`fixtures/seating/banquet-basic.json`).
- Exponer utilidades de test (`window.__SEATING_TEST_HELPERS__`) para crear mesas/invitados sin drag & drop (por ejemplo métodos `createTable`, `assignGuest`).
- Añadir exportador en memoria (cuando `window.Cypress`) que devuelva blobs en lugar de descargar archivo para poder asertar contenido.
- Mostrar lista visible de conflictos con `data-testid="seating-conflict"` y tooltip detallado.

### Criterios de prueba E2E propuestos
1. `seating-basic`: cargar fixture demo, pulsar botón "Agregar mesa redonda", asignar invitado mediante helper y verificar que aparece en sidebar/resumen.
2. `seating-conflicts`: intentar asignar mismo invitado a dos sillas y comprobar mensaje "Asignación duplicada" + bandera `data-testid="seating-conflict-duplicate"`.
3. `seating-export`: abrir `SeatingExportWizard`, seleccionar PDF/SVG/CSV y confirmar que helpers mock devuelven archivos (validar nombres y contadores dentro del modal de confirmación).

### Dependencias técnicas
- Fixtures `cypress/fixtures/seating-plan-basic.json` y `seating-guests-basic.json` alineadas con IDs reales (`guest_1`, `table_round_1`).
- Hooks de test en frontend (`if (window.Cypress) { window.__SEATING_TEST_HELPERS__ = ... }`) para accionar sin canvas.
- Mock `downloadUtils.saveFile` para capturar exportaciones durante tests y evitar interacción con sistema de archivos.

