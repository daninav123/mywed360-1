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
- `SeatingPlanToolbar` centraliza undo/redo, zoom (fit-to-content), exportaciones rápidas, apertura del asistente avanzado y herramientas de alineación/distribución. Desde la misma barra se gestionan snapshots locales (guardar/cargar/borrar), rotaciones, limpieza del layout de banquete, acceso a los modales clave (ceremonia, banquete, espacio, fondos) y, cuando está activo `VITE_ENABLE_AUTO_ASSIGN`, el botón de auto-asignación. También expone toggles dedicados: mostrar/ocultar mesas, rulers, snap a cuadrícula (`gridStep`), numeración de sillas, validaciones en vivo y modal de capacidad global.
- `SeatingLibraryPanel` ofrece plantillas, capas decorativas, fuentes de invitados y toggles de reglas (snap, grid, numeración). Contiene acciones rápidas para añadir mesas por tipo, abrir el Guest Drawer, cargar plantillas de venue y alternar la visibilidad de elementos (mesas, rulers, números de asiento), además de badges con pendientes por asignar y una leyenda coloreada con el conteo de áreas dibujadas (perímetro, puertas, obstáculos, pasillos, etc.). El bloque de mesas y el control de visibilidad solo aparecen en **Banquete** para evitar ruido en Ceremonia.
- Barra de estado inferior: muestra zoom, métricas del salón, conflictos activos y los colaboradores conectados en tiempo real (lista con iniciales coloreadas). La presencia se sincroniza vía Firestore (`weddings/{id}/seatingPresence/{clientId}`) y se actualiza automáticamente.
- `SeatingPlanModals` agrupa el resto de configuraciones: `CeremonyConfigModal`, `BanquetConfigModal`, configuración del espacio (dimensiones/aisles), selector de plantillas (`VenueTemplateSelector`), editor de fondo (`BackgroundModal`) y modal de capacidad global. Cada modal normaliza datos antes de persistirlos vía `useSeatingPlan` (`saveHallDimensions`, `saveBackground`, `applyBanquetTables`), e informa mediante toasts en caso de error o éxito.

### 3.2 Ceremonia (`tab=ceremony`)
1. `CeremonyConfigModal` define filas/columnas, pasillos, reservas VIP, etiquetas y notas internas.  
2. `SeatingInspectorPanel` muestra fila activa, ocupación, asientos VIP y atajos de asignación guiada (padrinos/familiares).  
3. Drag & drop asigna invitados; la agrupación de parejas depende de los datos origen (sin heurística propia).

### 3.3 Banquete (`tab=banquet`)
1. `SeatingPlanCanvas` permite crear/duplicar mesas (round, imperial, cocktail) y ajustar dimensiones/rotación.  
2. `SeatingGuestDrawer` lista invitados pendientes con filtros (lado, dieta, grupo), buscador y contadores por estado. Permite fijar invitados “en guía” (`guidedGuestId`) para seguimiento rápido, mostrar badges VIP/alergias y alternar entre vista de lista o tarjetas compactas.  
3. `SeatingPlanSidebar` edita atributos de la mesa (tipo, etiquetas, notas) y avisa cuando se excede capacidad.  
4. `SeatingSmartPanel` ofrece sugerencias automáticas (VIP, familia, pendientes) y métricas de ocupación.

### 3.4 Zonas libres (`tab=free-draw`)
- `FreeDrawCanvas` dibuja zonas libres (escenario, proveedores, áreas infantiles) sin validación de capacidad, reutilizable en otras tabs.

### 3.5 Guardado y exportación
- **Autosave**: cada cambio en ceremonia o banquete se guarda automáticamente en Firestore con un debounce de ~800 ms (`weddings/{id}/seatingPlan/{ceremony|banquet}`). Si el plano está vacío el autosave se omite para no generar documentos sin contenido.
- **Snapshots manuales**: el botón *Snapshots* de la toolbar guarda un estado local (localStorage por boda). Desde el mismo menú se cargan versiones anteriores y se eliminan snapshots; no hay guardado automático fuera de los autosaves.
- **Exportación rápida**: el botón *Exportar PDF* captura el canvas actual (pestaña activa) en un PDF continuo; *Exportar SVG/CSV* generan assets editables y listados de invitados.
- **Exportación avanzada**: el asistente `SeatingExportWizard` permite combinar formatos (PDF multi-sección, SVG apilado, CSV) y elegir contenidos (leyenda, lista por mesas/filas, conflictos, instrucciones). Hoy genera un resumen textual por pestaña; queda en roadmap reorganizar el PDF en páginas dedicadas: plano completo de ceremonia, plano de banquete, lista global de invitados, invitados por mesa, dietas especiales y VIP vinculados a Momentos Especiales.
- **Pendiente**: personalización de plantillas, envío directo a proveedores y comentarios colaborativos sobre las exportaciones.

### 3.6 Experiencia móvil
- `SeatingMobileOverlay` ofrece un minimapa simplificado (placeholder actual) calculado a partir de `hallSize` y primeras mesas. Muestra listado compacto de mesas con ocupación, botón para abrir plantillas y FAB con accesos rápidos a guest drawer y exportador avanzado.
- Los gestos táctiles (zoom, pan) se delegan al canvas principal; el overlay actúa como puente hasta que se implemente el minimapa interactivo descrito en roadmap.

### 3.7 Feedback y estados
- Los guardados exitosos o fallos de autosave muestran toasts (`react-toastify`) disparados desde `useSeatingPlan` (`showNotification` en `SyncService` y callbacks locales).
- Acciones de exportación, auto-IA y limpieza del layout notifican al usuario con mensajes específicos, diferenciando éxito vs fallback (p.ej. Auto-IA avisando si el backend no responde).
- Los toggles de validaciones, rulers o numeración modifican inmediatamente el canvas y mantienen estado persistido (localStorage) para evitar sorpresas al recargar.

## 4. Persistencia y datos
- `weddings/{id}/seating/{tab}`: `tables`, `seats`, `settings`, metadatos de ceremonia y snapshots.  
- `weddings/{id}/guests`: fuente para `SeatingGuestDrawer` y validaciones de estado RSVP.  
- `weddings/{id}/seatingLocks/{resourceType-resourceId}`: bloqueos optimistas por recurso con TTL corto para evitar colisiones en edición colaborativa.  
- `weddings/{id}/seatingHistory`: historial opcional (si está habilitado) para auditoría y deshacer extendido.
- Snapshots manuales: `localStorage seatingPlan:{weddingId}:snapshot:*` + índice; se conservan por dispositivo.

## 5. Reglas de negocio
- Capacidad mesa ≥ invitados asignados; bloqueo cuando se excede.  
- Un invitado no puede estar en dos asientos simultáneamente (validación en `useSeatingPlan`).  
- Planner, Owner y Assistant tienen permisos completos para crear, editar, exportar y borrar en seating; el resto de roles quedan en solo lectura.  
- Versiones antiguas permanecen en solo lectura para trazabilidad.

### Validaciones y alertas
- **Perímetro**: banquet tables y sillas de ceremonia deben permanecer dentro del boundary dibujado.
- **Obstáculos/Puertas**: se marca conflicto cuando una mesa o silla invade áreas definidas como `obstacle` o `door`.
- **Pasillos y espaciado**: se exige separación mínima (aisleMin) entre mesas; los conflictos aparecen como `spacing`.
- **Capacidad**: `overbooking` alerta cuando los invitados asignados superan los asientos configurados.
- **Resumen visual**: los conflictos se muestran en el sidebar con filtros por tipo y en el smart panel con severidad (crítico/atención); también alimentan las exportaciones avanzadas.


## 6. Estados especiales y errores
- Sin invitados confirmados → banner “Agrega invitados primero”.  
- Error de guardado → toast + rollback optimista.  
- Offline → modo lectura; exportación bloqueada.  
- Colaboración: no hay edición en tiempo real tipo Google Sheets; cada sesión guarda sobre la anterior. Si varios usuarios trabajan a la vez, prevalece el autosave más reciente, por lo que se recomienda coordinar horarios y usar snapshots/manual save antes de cambios grandes.
- UX responsive: en pantallas pequeñas se activa `SeatingMobileOverlay` con accesos rápidos a pestañas, filtros y cajón de invitados; en escritorio se favorecen atajos de teclado (1-6 para herramientas, Ctrl/Cmd+Z/Y).

## 7. Integración con otros flujos
- Flujos 3 y 9 (Gestión de invitados + RSVP) alimentan `weddings/{id}/guests`; cualquier confirmación/cancelación se refleja en el autosave y en las recomendaciones del smart panel.  
- Flujo 11A (Momentos especiales) aportará el destinatario del momento; esa señal se usa para etiquetar invitados VIP y alimentar la hoja de VIP en la exportación avanzada.  
- Flujo 11 (Protocolo) comparte la configuración de ceremonia (filas VIP, notas) que se replica en seating y en las exportaciones.  
- Flujo 14 (Checklist) dispara tareas cuando hay conflictos abiertos o mesas sin asignar.  
- Flujos 24–26 (Galería/Inspiración/Blog) se integran en comunicaciones externas y pueden adjuntar renders/exports del seating para proveedores o sitio público (Flujo 21).

## 8. Métricas y monitorización
- Eventos sugeridos: `seating_template_applied`, `seating_guest_assigned`, `seating_export_triggered`, `seating_conflict_detected`.  
- KPIs (pendiente): tiempo medio para completar seating, nº de iteraciones por RSVP, % de autosaves exitosos.  
- Logs locales (`SyncService`) para saber cuándo sincronizar pendientes.

## 9. Pruebas recomendadas
- Unitarias: reducers de `useSeatingPlan`, validaciones de `SeatingGuestDrawer`, helpers de exportación.  
- Integración: aplicar plantilla → asignar invitados → guardar/exportar → revertir snapshot.  
- E2E: `cypress/e2e/seating/seating_smoke.cy.js`, `seating_assign_unassign.cy.js`, `seating_capacity_limit.cy.js`, `seating_template_circular.cy.js`, `seating_ui_panels.cy.js` (leyenda de áreas, cajón de invitados y persistencia de toggles).  
- Nota: `cypress/e2e/seating/seating-content-flow.cy.js` seguirá cubriendo navegación cruzada hasta que se reubique conforme a los nuevos flujos.

## 10. Checklist de despliegue
- Reglas Firestore: colecciones `seating` y `seatingHistory` (roles y límites).  
- Seeds y límites (mesas, invitados) validados para rendimiento.  
- Validar compresión y consistencia de exportaciones.  
- Automatizar backups periódicos de `seating` para auditoría.

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

