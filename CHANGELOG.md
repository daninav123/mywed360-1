# CHANGELOG — MyWed360

Formato: entradas agrupadas por fecha (YYYY-MM-DD). Referencias a documentación y módulos.

## 2025-09-24
- Portada de monorepo actualizada en `README.md` con Quick Start, módulos, QA y Observabilidad.
- Guía de onboarding unificada en `docs/ONBOARDING.md`.
- Especificación OpenAPI inicial en `docs/api/openapi.yaml` (health, RSVP, WhatsApp webhook, Mailgun webhook).
- Playbook operacional y alertas críticas añadidos a `docs/monitoring/README.md`.

## 2025-09 (anteriores)
- i18n completo con `react-i18next`, selector de idioma y documentación (`docs/i18n.md`).
- Refactor Seating Plan en módulos: `useSeatingPlan`, `SeatingPlanCanvas`, etc. Documentación en `docs/archive/seating-plan-refactor.md`.
- Refactor Finance en arquitectura modular (`useFinance.js`, componentes especializados). Documentación en `docs/finance-refactor.md`.
- Corrección del flujo de autenticación Firebase (Auth real, eliminación de mock), orden de providers (Auth → Wedding), y reglas de Firestore. Ver `FLUJO-AUTENTICACION-FIREBASE.md` y `DIAGNOSTICO-ERRORES-FIREBASE.md`.
- WhatsApp RSVP: endpoints backend (`/api/whatsapp/*`), sesiones conversacionales y documentado en `docs/whatsapp-messaging.md`.
- Mailgun: webhook con verificación HMAC (`/api/mailgun/webhook`) y guía de despliegue `docs/deploy-backend.md`.
- CI en GitHub Actions: flujo para rama `windows`, scripts de verificación (`ci:check`).
- Fijado puerto frontend a 5173 (Vite) y baseUrl de Cypress en `cypress.config.js`. Documentado en `docs/config.md`.
- Orquestador nocturno para tareas pendientes (`scripts/nightlyRunner.js`, `scripts/runTask.js`).

## Notas
- Flujos Git: trabajar en rama `windows` y no hacer push a `main` sin aprobación. Ver políticas en documentación del repo.
- No se han modificado diseños visuales de la app en estas tareas; cambios son de documentación y backend/frontend funcional.
