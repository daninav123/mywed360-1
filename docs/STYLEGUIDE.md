# Guía de estilos (UI)

Base común inspirada en Home y Tasks. El objetivo es unificar colores, superficies y tipografías usando Tailwind + variables CSS.

## Tokens (src/index.css)

- --color-bg: color del fondo general.
- --color-surface: color de superficies (cards, modales, listas).
- --color-text: color de texto principal.
- --color-primary: color de marca y acento.
- --color-accent: acento suave para hovers/fondos sutiles.
- --color-success, --color-warning, --color-danger: estados.

En modo oscuro se sobreescriben en `.dark`.

## Patrones de uso

- Fondo de página: `bg-[var(--color-bg)]` (ya aplicado en `MainLayout`).
- Texto: `text-[color:var(--color-text)]` y variantes con opacidad (`/60`, `/70`).
- Superficies: `bg-[var(--color-surface)]` y `border border-[color:var(--color-text)]/10`.
- Acentos/hover: `hover:bg-[var(--color-accent)]/20`.
- Primario: `bg-[var(--color-primary)]` (texto blanco por defecto).

## Componentes UI

- `Card`: usa tokens de superficie por defecto. Preferir `<Card>` en lugar de `div bg-white`.
- `Button`: variantes tokenizadas (`primary`, `secondary`, `outline`, `ghost`, `destructive`).
- `Input`: bordes y foco con tokens; evitar colores fijos tipo blue-500/gray-300.
- `Progress`: barra con colores de estado e `--color-primary`.

## Migraciones rápidas

- `bg-white` → `bg-[var(--color-surface)]`
- `text-gray-800`/`text-gray-900` → `text-[color:var(--color-text)]`
- `text-gray-500/600` → `text-[color:var(--color-text)]/60..70`
- `border-gray-200/300` → `border-[color:var(--color-text)]/10..20`
- `hover:bg-gray-100` → `hover:bg-[var(--color-accent)]/20`
- Botones nativos: preferir `<Button variant="primary|secondary|...">`.

## Ejemplo

Antes:
```jsx
<div className="bg-white border border-gray-200 p-4">...</div>
```
Después:
```jsx
<Card className="p-4">...</Card>
```

## Notas

- Si necesitas transparencia tipo “glass”, añade `/80 backdrop-blur-md` al `Card` vía `className`.
- El calendario y Gantt mantienen su paleta propia para diferenciación; los contenedores sí usan tokens.

