# Accesibilidad e i18n

## Accesibilidad (a11y)
- Usar etiquetas ARIA descriptivas en componentes interactivos.
- Ejemplo Seating: elementos de silla con `aria-label="Silla #"` (tests E2E los referencian).
- Contraste suficiente y foco visible en controles.
- Navegación por teclado en toolbars y modales (Seating/Tasks).

## Internacionalización (i18n)
- Codificación UTF‑8 en todos los archivos de docs (evitar mojibake de tildes/ñ).
- Centralizar textos en constantes cuando sea viable para futuros idiomas.
- Evitar concatenación de strings con variables sin formato.

## Recomendaciones de UI
- Validaciones con mensajes claros y localizables.
- Iconos con `title`/`aria-label` coherentes (toolbar seating ya lo usa).
- Formularios: asociar `label` y `input` correctamente.

