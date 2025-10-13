# Panel “Configuración de pieza” – Flujo 19 (Diseño de Invitaciones)

> Wireframe y lineamientos para la UI que permite editar presets imprimibles (invitaciones, menús, papelería, señalética).

## 1. Objetivo
- Permitir que el usuario ajuste dimensiones, sangrado, márgenes y marcas de corte dentro de rangos seguros.
- Proveer feedback inmediato sobre validaciones y estado del preflight.
- Facilitar la selección de imprenta/preset técnico y mantener versionado de cambios.

## 2. Layout (wireframe ASCII)
```text
┌────────────────────────────────────────────────────────────────┐
│ Canvas / editor principal                                       │
│                                                                │
│ (Contenido editable con overlay de print area)                 │
└────────────────────────────────────────────────────────────────┘
┌───────────────────────┬─────────────────────────────────────────┐
│ Barra superior         │ Badge preflight | Botón Ejecutar       │
├───────────────────────┴─────────────────────────────────────────┤
│ Panel lateral: Configuración de pieza                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 1. Preset y versión                                         │ │
│ │    [Dropdown imprenta/preset ▾] [Ver historial]            │ │
│ │    Estado: ◉ Original  ○ Duplicado                         │ │
│ │                                                         i  │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ 2. Dimensiones (mm)                                         │ │
│ │    Ancho: [ 148 ] ─ (Rango 90-230)                          │ │
│ │    Alto : [ 210 ] ─ (Rango 90-320)                          │ │
│ │    Botón: [↺ Restablecer valores base]                      │ │
│ │    Tooltip valores fuera de rango (rojo)                    │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ 3. Sangrado y márgenes                                      │ │
│ │    Sangrado externo: [ 3 ] mm                               │ │
│ │    Margen de seguridad: [ 5 ] mm                            │ │
│ │    Toggle: [✔] Bloquear proporciones                        │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ 4. Marcas de corte y guías                                  │ │
│ │    [✔] Incluir marcas de corte                              │ │
│ │    [ Selector ] Tipo de marca (Esquina / Centro)            │ │
│ │    [✔] Mostrar retícula en canvas                           │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ 5. Perfil de color                                          │ │
│ │    [Dropdown CMYK preset ▾]                                 │ │
│ │    Botón: [Aplicar a lienzo]                                │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ 6. Estado                                                    │ │
│ │    Preflight: [Pendiente ⚠]                                 │ │
│ │    Última validación: --                                    │ │
│ │    Botón: [Ejecutar preflight]                              │ │
│ │    Link: Ver reporte detallado                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Interacciones clave
- **Dropdown de imprenta/preset**: carga automáticamente rangos, perfiles CMYK y reglas de preflight asociados. Al duplicar un preset se crea una versión editable.
- **Inputs con rangos**: muestran límites en tooltip y línea de progreso. Si se supera el rango, el input se marca en rojo y el botón “Aplicar a lienzo” queda deshabilitado.
- **Aplicar a lienzo**: recalcula el lienzo, guías y overlays; actualiza el estado del canvas a “en revisión”.
- **Badge “Preflight pendiente”**: aparece tras cada cambio que afecta el área imprimible. Desaparece cuando se ejecuta el preflight y este se aprueba.
- **Ejecutar preflight**: dispara validaciones (vectorización, efectos permitidos, tolerancias). Muestra un modal/resumen con los hallazgos y permite descargar reporte PDF.

## 4. Estados y feedback
- **Preflight pendiente (amarillo)**: cambios no validados. Exportación bloqueada.
- **Preflight aprobado (verde)**: se habilita exportar/enviar a imprenta. Se guarda timestamp y hash del preset.
- **Preflight fallido (rojo)**: lista de errores (ej. capa raster detectada, sombra externa). Botón “Ir a capa problemática”.

## 5. Versionado
- Cada modificación de preset guarda snapshot con: usuario, timestamp, valores cambiados y resultado del último preflight.
- Historial accesible desde “Ver historial” con opción de revertir a versiones previas (respetando permisos).

## 6. Accesibilidad y usabilidad
- Todos los inputs soportan teclado (tab/arrow) y unidades visibles.
- Tooltips con ejemplos de imprenta (ej. “Menú estándar 110x297 mm”).
- Estado del preflight anunciado vía ARIA live region.

## 7. Dependencias técnicas
- Requiere sincronización con `designTemplates` y presets de imprenta.
- El componente debe emitir eventos para actualizar overlays (`VectorEditor` / `InvitationDesigner`).
- Preflight integra con el pipeline descrito en `docs/flujos-especificos/flujo-19-diseno-invitaciones.md`.
- Prototipo visual en Figma: ver `docs/diseno/flujo-19-panel-configuracion-figma.md`.
