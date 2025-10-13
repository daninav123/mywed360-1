# Prototipo Figma – Panel “Configuración de pieza” (Flujo 19)

> Blueprint para trasladar el wireframe a Figma y validar con el equipo de diseño.

## 1. Estructura del archivo
- **Archivo**: `LOVENDA – Flujo 19 – Panel Configuración`.
- **Páginas**:
  1. `00 Cover`
  2. `01 Componentes`
  3. `02 Flujos`
  4. `03 Notas`
- **Frames base** (nombre estándar):
  - `LOVENDA – Flujo19 – Panel Configuracion – Desktop`
  - `LOVENDA – Flujo19 – Panel Configuracion – Overlay Preflight`
  - Variantes responsive opcionales: `... – Tablet`, `... – Mobile`.

## 2. Guías y layout
- Canvas desktop: 1440×1024 px.
- Grilla: columnas de 12 con gutter 24 px; margen 120 px.
- Panel lateral: ancho fijo 360 px; canvas principal ocupa el resto.
- Usar Auto Layout en panel para secciones colapsables (padding 24 px, gap 16 px).

## 3. Estilos y tokens
- **Colores**:
  - `Lovenda/Neutral/900`, `Lovenda/Neutral/100` para texto y fondos.
  - `Lovenda/Accent/500` para CTAs.
  - Estados de preflight: `Lovenda/Feedback/Warning`, `Lovenda/Feedback/Success`, `Lovenda/Feedback/Danger`.
- **Tipografía**:
  - Título secciones: `Inter Semibold 16`.
  - Etiquetas/input: `Inter Medium 13`.
  - Tooltip/help: `Inter Regular 12`.
- **Iconografía**: set Feather o Phosphor; instancias de `info`, `history`, `alert-circle`, `check-circle`.

## 4. Componentes y variantes
- Crear en la página `01 Componentes`:
  - `Form/Input-Number` con variantes `default`, `error`, `disabled`.
  - `Form/Toggle`, `Form/Checkbox`, `Form/Select`.
  - `Badge/Preflight` con variantes `pendiente`, `aprobado`, `fallido`.
  - `Button/Primary`, `Button/Secondary`, `Button/Text`.
  - `Modal/Preflight` (estructura con header, body scrollable, footer CTA).
- Agregar variables para estados (boolean `isOutOfRange`, `preflightStatus`).

## 5. Escenarios a prototipar (página `02 Flujos`)
1. **Preset original cargado**:
   - Panel muestra todos los campos en verde.
   - Badge `Preflight aprobado`.
2. **Cambio fuera de rango**:
   - Input ancho en rojo, tooltip visible.
   - Botón “Aplicar a lienzo” deshabilitado.
   - Badge `Preflight pendiente`.
3. **Preflight fallido**:
   - Modal con lista de errores y botón “Ir a capa problemática”.
   - Panel resalta sección infractora con borde rojo.
4. **Duplicar preset**:
   - Dropdown abre modal “Duplicar”.
   - Nueva versión aparece en historial.
5. **Seleccionar imprenta**:
   - Dropdown con logos/avatars de imprentas.
   - Card resumen con especificaciones y link “Ver requisitos”.

Configurar interacciones con prototyping simple (click navegar) y micro-animaciones mediante Smart Animate para mostrar transiciones panel/modal.

## 6. Notas para handoff
- Documentar en página `03 Notas`:
  - Lista de tokens utilizados (`Style` → `Lovenda/…`).
  - Reglas de accesibilidad (contraste mínimo 4.5:1, foco en inputs).
  - Checklist para QA visual (alineaciones, padding, estados).
- Adjuntar enlaces a documentación técnica: `docs/flujos-especificos/flujo-19-diseno-invitaciones.md`, `docs/diseno/flujo-19-panel-configuracion.md`.

## 7. Exportables
- Exportar PNG 2× del frame principal para compartir rápidamente.
- Generar prototipo compartible (Present) con hotspots documentados en `03 Notas`.

