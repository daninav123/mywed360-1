# 4. Invitados – Plan de Asientos y Biblioteca de Contenido (estado 2025-10-08)

> Implementado (código 2025-10-08):  
> • Plano unificado (`SeatingPlanRefactored.jsx`, `SeatingPlanCanvas.jsx`, `SeatingPlanToolbar.jsx`, `SeatingLibraryPanel.jsx`, `SeatingGuestDrawer.jsx`).  
> • Configuración de ceremonia con reservas VIP y bloqueo de filas (`CeremonyConfigModal.jsx`, `SeatingInspectorPanel.jsx`).  
> • Exportador avanzado (PDF detallado, SVG por pestaña, CSV extendido) desde `SeatingExportWizard.jsx` + `useSeatingPlan`.  
> • Panel inteligente de seating con recomendaciones automáticas en banquete (`SeatingSmartPanel.jsx`).  
> • Biblioteca de inspiración con eventos globales y tracking (`Inspiration.jsx`, `InspirationGallery.jsx`).  
> • Ideas con CRUD completo, carpetas y drag & drop (`src/pages/Ideas.jsx`).  
> • Blog interno con editor Markdown ligero y persistencia en `weddings/{id}` (`src/pages/Blog.jsx`).  
> • Documentos legales MVP (`DocumentosLegales.jsx`).  
> • Hooks y servicios base: `useSeatingPlan`, `useGuests`, `SyncService`, `inspirationService`.

> Pendiente o incompleto:  
> • Panel inteligente de invitados con recomendaciones IA (en inspector sólo hay heurísticas simples).  
> • Automatización de contenidos/IA y sincronización documental backend (roadmap).  
> • Auditoría de accesibilidad/UX pendiente tras los cambios recientes.

Este flujo cubre todo el módulo “Invitados”: el plano de asientos y la biblioteca de contenido/inspiración/documentos.

## 1. Objetivo y alcance
- Diseñar y mantener mapas de asientos para ceremonia, banquete y zonas libres.
- Gestionar inspiración visual, ideas, blog y documentos legales asociados a la boda.
- Sincronizar la información entre calendarios, tareas y proveedores para ofrecer una experiencia completa a planners y owners.

## 2. Trigger y rutas
- Menú inferior → pestaña **Tareas** (para checklist) y botón “Plan de asientos” en Invitados (`/plan-asientos`).
- Menú inferior → `Más` → bloque **Invitados** → “Gestión de invitados” → botón “Plan de asientos”.
- Menú inferior → `Más` → bloque **Extras** → “Diseño Web”, “Diseños”, “Ideas”, “Galería de Inspiración”, “Blog”.
- Menú inferior → `Más` → bloque **Protocolo** → “Documentos” (`/protocolo/documentos`, documentos legales MVP).

## 3. Paso a paso UX

### 3.1 Plan de Asientos
1. **Preparación general**  
   - `SeatingPlanToolbar` centraliza undo/redo, zoom, modo dibujo (boundary/table/chair/layout/free-draw), exportar y abrir modales (templates, ceremonia, banquete, fondos).
   - `SeatingLibraryPanel` ofrece plantillas, capas decorativas, toggles de reglas (snap, grid, numeración) y acceso al cajón de invitados.
2. **Ceremonia** (`tab=ceremony`)  
   - `CeremonyConfigModal` define filas/columnas, pasillos, reservas VIP, etiqueta y notas internas.  
   - `SeatingInspectorPanel` muestra fila activa, ocupación, asientos VIP y atajos de asignación guiada (padrinos/familiares).  
   - Drag & drop asigna invitados; la agrupación de parejas aún depende de los datos origen (sin heurística propia).
3. **Banquete** (`tab=banquet`)  
   - `SeatingPlanCanvas` permite crear/duplicar mesas (round, imperial, cocktail) y ajustar dimensiones/rotación.  
   - `SeatingGuestDrawer` lista invitados pendientes con filtros (lado, dieta, grupo) para arrastrar a cada silla.  
   - `SeatingPlanSidebar` edita atributos de la mesa (tipo, etiquetas, notas) y advierte cuando se excede capacidad.
   - `SeatingSmartPanel` ofrece sugerencias automáticas (VIP, familia, pendientes) y métricas de ocupación.
4. **Free draw** (`tab=free-draw`)  
   - `FreeDrawCanvas` dibuja zonas libres (escenario, proveedores, áreas infantiles) sin validación de capacidad, reutilizable en otras tabs.
5. **Guardado y exportación**  
   - `useSeatingPlan` realiza autosave con debounce y versiona snapshots.  
   - Exportador avanzado (PDF con resumen, SVG por pestaña, CSV extendido) vía `SeatingExportWizard`.  
   - Pending: personalización de plantillas, envío directo a proveedores y comentarios colaborativos.

### 3.2 Biblioteca de Contenido
1. **Inspiración visual** (`/inspiracion`)  
   - `Inspiration.jsx` consume `inspirationService` con feed infinito y filtros por tag.  
   - `InspirationGallery` permite favoritos, lightbox y dispara el evento global `mywed360-important-note` al destacar contenido, además de registrar interacciones.
2. **Ideas/Notas** (`/ideas`)  
   - Editor completo de notas con carpetas, drag & drop, edición y borrado; sincronizado vía `SyncService`.  
   - Almacena fotos de referencia en la nube y preserva el modo offline.
3. **Blog** (`/blog`)  
   - Editor propietario (Markdown ligero + vista previa) con almacenamiento en `weddings/{id}/blog`.  
   - Control de versiones básico (timestamps) y guardado automático.
4. **Documentos legales** (`/protocolo/documentos`)  
   - MVP `DocumentosLegales.jsx` genera PDF de consentimiento con jsPDF (sin guardado automático ni firma).  
   - Documentos oficiales se generan manualmente; el backend para almacenamiento y plantillas parametrizables sigue en planificación.

## 4. Persistencia y datos
- Plan de asientos: `weddings/{id}/seating/{tab}` con `tables`, `seats`, `settings`; metadatos de ceremonia en la misma colección.
- Invitados pendientes: `useGuests` + `SeatingGuestDrawer` extraen datos de `weddings/{id}/guests`.
- Contenido:  
  - `weddings/{id}/ideas`, `weddings/{id}/blog`.  
  - Favoritos de inspiración en `users/{uid}/favorites` + `localStorage ideasPhotos`.  
  - Documentos legales: sólo output PDF local (sin Firestore).

## 5. Reglas de negocio
- Plan de asientos:
  - Capacidad mesa ≥ invitados asignados; bloquea cuando se excede.  
  - Un invitado no puede estar en dos asientos simultáneamente (validación en `useSeatingPlan`).  
  - Solo owner/planner editan; assistants pueden reasignar si se habilita.
- Contenido:
  - Owners/planners editan; assistants lectura.  
  - Documentos generados requieren revisión antes de compartir.  
  - Modo offline mantiene estado local sincronizable.

## 6. Estados especiales y errores
- Plan de asientos:
  - Sin invitados confirmados → banner “Agrega invitados primero”.  
  - Error de guardado → toast + rollback optimista.  
  - Offline → modo lectura; exportación bloqueada.
- Contenido:
  - Galería sin resultados → CTA cambiar búsqueda.  
  - Fallo fetch → fallback local con mensaje.  
  - Generador PDF sin datos requeridos → validación de formulario.

## 7. Integración con otros flujos
- Flujo 3 (Gestión de invitados) proporciona datos y botones de acceso directo.
- Flujo 9 (RSVP) actualiza estados utilizados para seating.
- Flujo 11 (Protocolo) usa configuraciones de ceremonia y documentos.
- Flujo 14 (Checklist) crea tareas vinculadas (seeding y seguimiento).
- Flujo 17 (Gamificación) consume estadísticas (puntos por completar seating/publicar contenido).
- Sitio público (Flujo 21) reutiliza posts/blog/favoritos seleccionados.

## 8. Métricas y monitorización
- Eventos sugeridos: `seating_template_applied`, `seating_guest_assigned`, `inspiration_favorite_saved`, `idea_created`, `legal_doc_generated`.
- KPIs (pendiente de instrumentar): tiempo medio para completar seating, nº de favoritos, uso offline vs online.
- Logs locales (`SyncService`) para saber cuándo sincronizar pendientes.

## 9. Pruebas recomendadas
- Plan de asientos:
  - Unitarias: reducers de `useSeatingPlan`, filtros de `SeatingGuestDrawer`.  
  - Integración: aplicar plantilla → asignar invitados → guardar/exportar.  
  - E2E: flujo completo de seating (ceremonia + banquete + free draw).
- Biblioteca de contenido:
  - Unitarias: `InspirationGallery`, hooks de ideas/blog.  
  - Integración: favorito → sync → usar en sitio público.  
  - E2E: crear nota, publicar blog, generar documento legal, comprobar offline.


## Cobertura E2E implementada
- `cypress/e2e/seating/seating-content-flow.cy.js`: verifica alternancia entre pestañas de ceremonia/banquete y la navegación por inspiración, ideas, blog y documentos legales asociados al flujo.

## 10. Checklist de despliegue
- Reglas Firestore: `seating`, `ideas`, `blog` (roles y límites).
- Seeds y límites (mesas, invitados) validados para rendimiento.
- Clave API externa para inspiración (si se usa proveedor third-party).
- Validar compresión de exportaciones y legalidad de documentos.

## 11. Roadmap / pendientes
- Panel lateral inteligente con recomendaciones autónomas de seating (IA) y asistentes de conflictos.
- Automatización de contenidos (Ideas/Blog) con analítica avanzada y workflows colaborativos.
- Sincronización documental backend (almacenamiento seguro, versiones, firmas).
- Integración con proveedores/venues (ingesta automática de planos y configuraciones).

## 12. Resumen operativo de brechas detectadas
- **Seating IA**: el panel inteligente ofrece heurísticas avanzadas, pero faltan simulaciones multi-escenario y aprendizaje continuo.  
- **Documentación legal**: no se guarda en backend ni soporta flujos de firma.  
- **Exportaciones**: motores PDF/SVG listos, pendiente workflow para compartir, presets guardados y envío automatizado.  
- **Automatización de contenidos**: falta IA para sugerir/maquetar notas y posts, además de analítica avanzada.  
- **Accesibilidad/UX**: revisar flujos de Ideas y Blog tras las nuevas funcionalidades.
