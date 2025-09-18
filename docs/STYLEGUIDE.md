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
  - Lazy + Suspense para vistas pesadas; `prefetchModule` como en `Home.jsx`.
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
