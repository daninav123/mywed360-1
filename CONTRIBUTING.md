# Guía de Contribución — MyWed360

Gracias por tu interés en contribuir. Esta guía resume cómo trabajar con el repositorio y qué esperamos en los PRs.

## Requisitos
- Node.js >= 20 y npm >= 10.
- Cuenta de GitHub.
- Variables de entorno según `docs/ENVIRONMENT.md` (no subas secretos).

## Flujo de trabajo
- Rama base: `main` (prod) y `develop` (staging si aplica).
- Crea ramas desde `develop` con prefijo: `feature/`, `fix/`, `docs/`.
- Pequeños PRs enfocados son preferibles a PRs grandes.

## Estándares de código
- Lint: `npm run lint` (sin warnings graves en PRs).
- Formato: usamos Prettier (via lint-staged) en commits.
- Tests: añade/actualiza pruebas con Vitest y/o Cypress cuando proceda.
- i18n/a11y: valida `npm run validate:i18n` y revisa `docs/ACCESSIBILITY_I18N.md`.

## Qué ejecutar antes de abrir PR
- `npm ci` en raíz (y en `backend/` si trabajaste ahí).
- `npm run ci:check` (lint + unit + validate:i18n + bundle budget).
- E2E relevantes: `npm run cypress:run` o `npm run cypress:run:seating`.

## Commits y PRs
- Mensajes de commit claros (tipo / alcance / resumen breve si aplica).
- PRs deben incluir: objetivo, cambios, pruebas realizadas, riesgos.
- No incluyas secretos/keys ni archivos generados (dist, coverage, videos/screenshots de Cypress).

## Seguridad
- Reporta vulnerabilidades siguiendo `SECURITY.md` (no abras issues públicos para fallos de seguridad).

## Documentación
- Si cambias APIs o comportamientos, actualiza `docs/*` y/o `docs/api/openapi.yaml`.

## Dudas
- Abre un borrador de PR temprano o crea un issue con el contexto.

