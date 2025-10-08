# Especificación de prototipos

## Wizard de exportación avanzada
- **Objetivo**: definir la experiencia de generación de planos listos para compartir con proveedores.
- **Flujo principal**

  ```
  [Step 1/3: Formato] --> [Step 2/3: Contenido] --> [Step 3/3: Configuración] --> [Resumen/Confirmación]
  ```

- **Wireframes low-fi**

  **Paso 1 – Selección de formato**
  ```
  ┌────────────────────────────── Wizard Header ──────────────────────────────┐
  │  Exportar plano · Paso 1/3                                                │
  ├───────────────────────────────────────────────────────────────────────────┤
  │  Formatos disponibles                                                     │
  │  [ ] PDF multipágina    [ ] SVG editable    [ ] CSV resumen               │
  │                                                                       i   │
  │  Tabs a incluir                                                          │
  │  [✓] Ceremonia   [✓] Banquete   [ ] Free draw                            │
  ├─────────────────────┬────────────────────────────────────────────────────┤
  │ Preview (mini)      │  Tips / Documentación                              │
  │  ┌────────────┐     │  - Selecciona al menos un formato.                 │
  │  │            │     │  - Puedes guardar preset al final.                 │
  │  └────────────┘     │                                                    │
  ├─────────────────────┴────────────────────────────────────────────────────┤
  │ < Cancelar                           Guardar configuración   Siguiente > │
  └──────────────────────────────────────────────────────────────────────────┘
  ```

  **Paso 2 – Contenido**
  ```
  ┌──────────────────────────── Wizard Header ───────────────────────────────┐
  │  Exportar plano · Paso 2/3                                               │
  ├──────────────────────────────────────────────────────────────────────────┤
  │  Leyendas y secciones                                                    │
  │  [✓] Leyenda de colores               (i)                                │
  │  [✓] Lista invitados por mesa          ── recordar allergens             │
  │  [ ] Resumen de conflictos resueltos                                   i │
  │  [ ] Notas para proveedores                                               │
  │  [ ] Instrucciones de montaje                                             │
  ├─────────────────────┬────────────────────────────────────────────────────┤
  │ Preview (actualiza) │  Panel lateral con toggles por tab                 │
  │                     │  - Ceremonia (n filas)                             │
  │                     │  - Banquete (n mesas)                              │
  ├─────────────────────┴────────────────────────────────────────────────────┤
  │ < Anterior                           Guardar preset        Siguiente >   │
  └──────────────────────────────────────────────────────────────────────────┘
  ```

  **Paso 3 – Configuración**
  ```
  ┌──────────────────────────── Wizard Header ───────────────────────────────┐
  │  Exportar plano · Paso 3/3                                               │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ Orientación: (•) Horizontal   ( ) Vertical                               │
  │ Escala: [ 1:50 ▾ ]                   Idioma: [ Español ▾ ]               │
  │ Mostrar medidas:   [✓]                                                   │
  │ Logotipo: [Subir archivo]                                                │
  │ Plantilla guardada: [ Ninguna ▾ ]   (Guardar como preset)                │
  ├─────────────────────┬────────────────────────────────────────────────────┤
  │ Preview final       │ Checklist final                                    │
  │                     │  - Formatos seleccionados                          │
  │                     │  - Contenido incluido                              │
  ├─────────────────────┴────────────────────────────────────────────────────┤
  │ < Anterior                   Generar exportación        Cancelar >       │
  └──────────────────────────────────────────────────────────────────────────┘
  ```

- **Estados adicionales**
  - `Éxito`: modal “Exportación generada” con lista de enlaces de descarga + botón “Ver historial”.
  - `Error`: mostrar banner rojo con mensaje y enlace a guía de troubleshooting.
  - `Preset guardado`: toast confirmando nombre del preset.

- **Interacciones**
  - Tooltips explican cada toggle.
  - Preview actualiza en vivo al cambiar opciones.
  - Guardado de preset para reutilizar configuraciones.
  - Accesibilidad: navegación por teclado entre pasos (`Alt+←/→`), aria-live para resumen final.

## Vista móvil / tablet (<=1024px)
- **Objetivo**: permitir asignaciones rápidas en dispositivos táctiles.
- **Mapa de pantalla**

  ```
  ┌──────────── Header (tabs + progreso) ────────────┐
  │  <  Ceremonia  |  Banquete  |  Libre   ⋮         │
  ├──────────────────────────────────────────────────┤
  │  Minimap (zoomable)                              │
  ├───────┬──────────────────────────────────────────┤
  │ Lista │  Canvas interactivo (solo banquete)      │
  │ de    │                                          │
  │ mesas │                                          │
  ├───────┴──────────────────────────────────────────┤
  │  Panel inferior invitados pendientes + conflictos│
  └────┬─────────────────────────────────────────────┘
       │  FAB radial (zoom, undo, export, IA)        │
       └─────────────────────────────────────────────┘
  ```

- **Componentes clave**
  - Header compacto con tabs `Ceremonia`, `Banquete`, `Libre` y contador de progreso.
  - Minimap fijo en la parte superior para orientación rápida.
  - Lista de mesas (banquete) con barras de capacidad y botón `Abrir mapa`.
  - Panel inferior para invitados pendientes con chips filtrables.
  - FAB radial: acciones principales + acceso rápido al wizard de exportación.

- **Interacciones táctiles**
  - Pinch to zoom, double tap para centrar.
  - Drag con retículas magnéticas y feedback háptico.
  - Panel inferior con invitados pendientes y badges de conflicto.
  - Swipe lateral para abrir/ocultar `GuestSidebar` compacto.

- **Accesibilidad**
  - Botones de 44px mínimo.
  - Gestos alternativos via botones (izquierda/derecha para mover).
  - Modo solo lectura para asistentes.
  - Anuncios de voz para cambios críticos (mesa llena, conflicto detectado).

## Notas para prototipado
- Usar Figma → biblioteca UI Lovenda (componentes `Wizard`, `FAB`, `Tabs compact`).
- Incluir estados de error/empty y confirmaciones.
- Entregar flujo clickable + handoff para desarrollo (autolayout + variantes).
- Documentar tokens de diseño (colores, espaciados) en figspec adjunta.
