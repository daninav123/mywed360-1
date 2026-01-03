# Diseño – Personalización IA Continua

Guía para prototipar la experiencia de personalización continua: mapa de preferencias, medidor de estilo y asistente IA aplicado.

## 1. Archivos Figma recomendados
- **Proyecto**: `Lovenda · Diseño / Personalización`
  - `01 - Mapa de Preferencias` (desktop + responsive)
  - `02 - Panel IA / Cards de ideas`
  - `03 - Widget Health + Alertas`
  - `04 - Flujos Conversacionales (chat IA)`
- Usa componentes de `Lovenda · UI Kit`. Crea variantes para chips (`core`, `contraste`, `revisión`) y badges de checklist/proveedores.

## 1.1 Estilo base (consistente con el proyecto)
- Tipografía: `Inter` (ya configurada en Tailwind). Usa `font-semibold` para títulos y `text-sm text-gray-500` para subtítulos.
- Colores:
  - Fondo principal: `bg-white` con `border border-gray-200` y `shadow-sm`/`shadow-md`.
  - Primarios: `blue-600` para CTA principales; `blue-500` para hovers.
  - Estados IA / resaltados: pastel del tema actual (`bg-pastel-yellow`, `bg-pastel-blue`, etc.).
  - Alertas: `text-amber-700 bg-amber-50 border-amber-200` (warning), `text-rose-700 bg-rose-50` (crítico).
- Radius y espaciado: `rounded-lg` para tarjetas; `rounded-full` para chips. Usa padding 16–24 px (`p-4`, `p-6`).
- Iconografía: `lucide-react` (misma librería en app). Utiliza iconos `Sparkles`, `AlertTriangle`, `Gauge`, etc.
- Dark mode: prepara variantes con `bg-slate-900` y `text-slate-100` si el UI kit las incluye.

## 2. Mapa de preferencias
### Requerimientos
- Visual circular con:
  - Núcleo: estilo principal, descripción corta, métricas (`coreStyleWeight`).
  - Órbitas: chips de contrastes con etiquetas (`Core`, `Contraste`, `Revisión`), tooltips y botón de edición.
  - Indicador `StyleMeter` (semáforo) mostrando equilibrio; tooltip con breakdown.
- Estados:
  1. Sin contrastes → mensaje vacío y CTA “Explorar ideas”.
  2. Contrastes dentro de límite → medidor en verde.
  3. Contraste alto → medidor ámbar/rojo + enlace a alertas.

### Interacciones
- Click en chip abre “Hoja de contraste” (contexto, tareas, presupuesto).
- Hover muestra resumen (zona, responsable, nota de IA).
- En modo QA demo: banner “Dataset de ejemplo” y botón “Restaurar”.

## 3. Panel de exploración IA
### Cards de ideas
- Tarjetas agrupadas por categoría con pictogramas e indicador de afinidad (0–100).
- Botones `❤️ Me encanta`, `🤔 Considerar`, `🚫 No va`.
- CTA “Algo distinto” → wizard:
  1. Seleccionar zona (ceremonia/after-party/etc.).
  2. Slider intensidad (sutil → audaz).
  3. Campo de contexto libre.
- Confirmación muestra cómo se registrará (`nivelContraste`, `zonaAplicacion`).

### Checklist de micro-feedback
- Modal con botones de motivo rápido (“Demasiado infantil”, “No encaja con invitados”, “Coste alto”).
- Guardar actualiza mapa y lanza toast “Preferencia actualizada”.

## 4. Widget Salud del perfil
- Panel compacto con:
  - Lista `profileGaps`, `recommendation_conflict`, `style_balance_alert`.
  - Botones “Resolver ahora”.
  - Status global (OK / seguimiento / crítico).
- Estados ilustrados: sin alertas, con alertas menores, con alertas críticas.

## 5. Integración con checklist/proveedores
- Mock de checklist con badges (`Core`, `Contraste (After-party)`, `Revisión`).
- Hoja lateral “Confirmar contraste”:
  - Resumen.
  - Tareas auto-generadas (editable).
  - Ajustes de presupuesto.
  - CTA “Confirmar y crear” + nota auditoría.

## 6. Asistente IA (chat)
- Storyboard de conversación:
  - Propuesta pack sorpresa.
  - Confirmación de contraste (preguntas de ámbito).
  - Generación de resumen compartible.
- Diseñar etiquetas de métricas en UI (`assistant_contrast_followup_sent`).

## 7. Notas de handoff
- Documentar estilos (tipografía, colores, blur) en la página “Tokens”.
- Incluir variantes responsive (desktop ≥1280, tablet 1024, móvil 768).
- Adjuntar prototipos interactivos (Figma → Prototype) para:
  - Selección de contraste.
  - Aceptación y creación de tareas.
  - Visualización de alertas.
- Añadir captura/GIF para soporte y QA.

## 8. Checklist para diseño
- [ ] Frames creados y nombrados (`LOVENDA - Personalización - …`).
- [ ] Componentes publicados en librería.
- [ ] Interacciones prototipadas (hover/click, wizard, alerts).
- [ ] Anotaciones de copy y tono alineadas con `docs/personalizacion/tono-mensajes.md`.
- [ ] Enlace de handoff (Inspect) añadido a ticket o documentación.
- [ ] Variantes dark mode y responsive documentadas si aplica.
- Reutiliza patrones existentes:
  - Panel lateral → `TaskSidePanel` (`bg-white`, `shadow-2xl`, `border-gray-200`, `p-4`).
  - Tarjetas → `Card` genérica (`bg-white`, `shadow-sm`, `rounded-lg`, `divide-y`).
  - Chips → Pilas con `inline-flex items-center rounded-full border`.
  - Botones secundarios → `hover:bg-gray-100`, `text-gray-600`; primarios → `bg-blue-600 text-white hover:bg-blue-700`.
