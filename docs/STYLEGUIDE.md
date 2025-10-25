# Guía de Estilo y Arquitectura

Esta guía define convenciones para código, UI y estructura, alineadas con las vistas que ya funcionan y gustan (Home, Tasks).

## Código (JS/JSX)
- Nombres
  - Componentes React: PascalCase (`HomePage`, `TasksRefactored`).
  - Hooks/utilidades: camelCase (`useAuth`, `prefetchModule`).
  - Archivos: kebab-case para no-React (`email-service.js`), PascalCase para componentes (`HomePage.jsx`).
- Imports (alias `@`)
  - Internos de dominio: `@/features/tasks/...` antes que relativos complejos.
  - Orden impuesto por ESLint: builtin/external → internal (`@/**`) → parent/sibling/index → type.
- Estilo
  - Prettier con `printWidth 100`, `singleQuote`, `semi` (ver `.prettierrc.json`).
  - EditorConfig: `utf-8`, `lf`, indent 2 espacios (ver `.editorconfig`).
- React
  - Lazy + Suspense para vistas pesadas; `prefetchModule` como en `HomeUser.jsx`.
  - Estado local primero, Context cuando cruza múltiples rutas, y URL state para filtros/paginación.
  - Error boundaries para bloques complejos (p. ej. `Tasks.jsx`).

## Estructura de carpetas
- Por dominios (feature-first):
  - `src/features/tasks/{components,hooks,services,types}`
  - `src/features/email/...`
  - `src/components/ui` (kit reutilizable: Button, Input, Modal, Table, EmptyState, Loader)
- Reglas
  - Dentro del feature: imports relativos; entre features: alias `@`.
  - Evitar carpetas duplicadas: consolidar `context/` y `contexts/` en una sola (`context/`).
  - Tests junto al archivo (`*.test.jsx`) o en `__tests__` por dominio si es integración.

## UI (Tailwind + MUI)
- Principios
  - Layout y espaciado con Tailwind, componentes complejos con MUI cuando aporte accesibilidad (pickers/tablas).
  - Tokens coherentes: usar variables de Tailwind extendidas en `tailwind.config.js`.
- Tokens recomendados (Tailwind)
  - Tipografía: `font-sans: Inter`; escala sugerida: `sm, base, lg, xl, 2xl, 3xl`.
- Colores: usar paleta `blue` existente + neutrales (`slate/gray`) y estados: `success (#16a34a)`, `warning (#f59e0b)`, `danger (#dc2626)`, `info (#0ea5e9)`.
- Radios: `rounded-md` (controles), `rounded-lg` (cards/modals), `rounded-full` (pills/avatars).
- Sombras: `shadow-sm` (controles), `shadow` (cards), `shadow-lg` (modals/overlays).
- Menú usuario: el botón (esquina superior derecha) muestra `maloveapp-logo.png` como avatar por defecto; mantiene `aria-label`/`title` con `app.brandName`. No se ancla el logo en la esquina superior izquierda.
- Header marketing (páginas públicas): barra superior opaca (`bg-app` sin sufijos de transparencia ni `backdrop-blur`) con CTAs únicos `Iniciar sesión`/`Crear cuenta` y logotipo `maloveapp-logo.png`; no debe existir enlace duplicado «Login / Registro» en la navegación.
- Layout responsivo:
  - Variables CSS (`src/index.css`): `--layout-max-width: 1120px`, `--layout-wide-width: 1280px`, `--layout-padding: clamp(16px, 4vw, 32px)`.
  - Contenedor estándar: aplica `.layout-container` para vistas de aplicación; mantiene padding fluido en móviles y un `max-width` legible en desktop.
  - Contenedor ancho: usa `.layout-container-wide` cuando se requiera más espacio horizontal (p. ej. tablas densas, paneles IA).
  - En móviles, el padding cae automáticamente a 16 px; en pantallas grandes se limita a 32 px, garantizando una experiencia consistente en móviles, tabletas y desktop.
- Patrones (inspirados en Home/Tasks)
  - Cards con `rounded-lg bg-white dark:bg-slate-900 shadow` y `p-4/6`.
  - Listas de tareas: list/grid responsivo, estados vacíos con `EmptyState` claro y CTA.
  - Barra superior con acciones primarias a la derecha y filtros persistentes.
  - Notificaciones: `react-toastify` posición `top-right`, duración 4s.

## Formularios y validación
- React Hook Form + Zod (preferido). Esquemas en `*/types` o `*/schemas`.
- Errores: mensajes breves, i18n clave `form.errors.*`, focus en primer campo inválido.

## i18n y copy
- Namespaces por dominio (`common`, `finance`, `tasks`, etc.).
- Claves `scope.sublabel` (`tasks.add_button`), sin textos hardcode.
- Revisión con `scripts/validateI18n.js` en CI y `jest-axe` para a11y.

## Accesibilidad (a11y)
- Contraste AA mínimo. Focus visible en todos los controles.
- Labels/aria para inputs; roles semánticos en listas/tablas.

## API y errores
- Respuesta uniforme
  - Éxito: `{ success: true, data }`
  - Error: `{ success: false, error: { code, message } }`
- Códigos de error estandarizados y traducibles (frontend mapea a toasts/estados vacíos).

## Commits y PR
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`.
- PR checklist: tests pasan, lint ok, i18n validado, UI accesible.

## Sistema Visual Definitivo (Tokens + Utilidades)

- Tokens CSS (definidos en `src/index.css`):
- `--color-bg` (claro: `#F7F1E7`), `--color-surface`, `--color-text`
  - `--color-primary`, `--color-accent`, `--color-success`, `--color-warning`, `--color-danger`, `--color-info`
  - Derivados: `--color-border`, `--color-muted`, `--radius-md`
- Modo oscuro controlado por clase (`dark`) con equivalentes de todos los tokens.
- Utilidades semánticas para migración gradual (definidas en `@layer utilities` en `src/index.css`):
  - Fondo: `bg-app`, `bg-surface`, `bg-primary`, `bg-accent`, `bg-success`, `bg-warning`, `bg-danger`, `bg-info`
  - Texto: `text-body`, `text-muted`, `text-primary`, `text-accent`, `text-success`, `text-warning`, `text-danger`, `text-info`
  - Bordes/Anillos: `border-soft`, `ring-primary`
- Reglas base (`@layer base`) ya aplican tipografía, enlaces, inputs/select/textarea y foco con `--tw-ring-color: var(--color-primary)`.

## Kit UI (reutilizable)

- `Card` (`src/components/ui/Card.jsx`): contenedor estándar con `bg-[var(--color-surface)]`, borde suave y sombra.
- `Button` (`src/components/ui/Button.jsx`): variantes `primary|secondary|outline|ghost|destructive|link`, tamaños `xs..xl`.
- `Input` (`src/components/Input.jsx`): con etiqueta, error, y foco consistente.
- `Modal` (`src/components/Modal.jsx`) actualizado: tokens, accesible y tamaños `sm|md|lg|xl|full`.
- `Tabs` (`src/components/ui/Tabs.jsx`) actualizado: indicador inferior con `--color-primary` y texto inactivo atenuado.
- `Loader` (`src/components/ui/Loader.jsx`) actualizado: colores por tokens.
- Recomendado añadir (si se necesita en nuevas vistas): `EmptyState`, `Badge`, `Table` estilizados con tokens.

## Estándares de Página

- Envolver vistas con `MainLayout` (ya lo hace `App.jsx`) y usar `PageWrapper` para título/acciones.
- Usar `Card` para secciones internas; no aplicar `bg-white` directo.
- Títulos: `h1` con `.page-title` (definido en base) o `text-2xl font-semibold` + color desde tokens.
- Formularios: `Input`/`Button` y `focus:ring-2` con `ring-primary` para consistencia.

## Migración Gradual (aplicar al resto de páginas)

1) Preferir utilidades semánticas sobre colores crudos:
   - Reemplazar `bg-white` → `bg-surface`, `text-gray-700` → `text-body` o `text-muted`, `border-gray-200` → `border-soft`.
   - Reemplazar `text-blue-500|border-blue-500` → `text-primary|border-[var(--color-primary)]`.
2) Sustituir componentes ad-hoc por el kit UI:
   - Modales manuales → `Modal`.
   - Botones manuales → `Button` con `variant` adecuado.
3) Para nuevas piezas, partir de Home/Tasks como referencia visual: tarjetas translúcidas, uso de `var(--color-*)`, `backdrop-blur-md` cuando aplique.
4) Accesibilidad: mantener foco visible, `aria-*` en modales y tabs.

Checklist rápida por vista:
- [ ] Usa tokens (no colores hardcodeados).
- [ ] Encapsula secciones en `Card`.
- [ ] Inputs con foco consistente y etiquetas.
- [ ] Acciones principales a la derecha del título (`PageWrapper`).
- [ ] Modo oscuro revisado (clase `dark`).

## Títulos de Página
- Ubicación: siempre en la parte superior izquierda del contenido, fuera de los cards.
- Tamaño: referencia Tasks → `text-2xl` con `font-semibold` y `mb-6` (ver `h1, .page-title` en `src/index.css`).
- Contenedor: usar `PageWrapper` que ya renderiza una cabecera estándar (`.page-header`) con acciones a la derecha.
- Excepción: Home tiene composición propia; no usar `.page-title` ahí si se requiere un estilo especial.

## Pestañas (Tabs) de Página
- Estilo base inspirado en Proveedores (borde inferior y realce de la activa):
  - Contenedor: `.tabs-nav`
  - Botón: `.tab-trigger` y activa `.tab-trigger-active`
- Componente listo: `src/components/ui/PageTabs.jsx`
  - Props: `value`, `onChange`, `options: [{ id, label }]`
  - Usa tokens (`var(--color-primary)`, `border-soft`) para consistencia claro/oscuro.
