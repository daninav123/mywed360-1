# Flujos de Usuario — MaLoveApp

> Este documento actúa como mapa maestro de experiencias. Resume qué cubre cada grupo de flujos, su estado actual y dónde ampliar información. Usa `docs/FLUJOS-INDICE.md` como fuente de verdad para estados y numeración; aquí encontrarás el contexto funcional y técnico rápido para orientarte.

## Cómo navegar el sistema de flujos

1. **Identifica el flujo** en la tabla índice (`docs/FLUJOS-INDICE.md`). Cada flujo tiene número, estado (`Sí`, `No`, `En curso`) y documento dedicado.
2. **Lee el detalle** en `docs/flujos-especificos/<flujo>.md` para conocer reglas, UX, dependencias, checklist y cobertura E2E.
3. **Consulta el roadmap** (`docs/ROADMAP.md`) para saber qué entregables están priorizados y qué métricas medimos.
4. **Valida la implementación** en el repo: los documentos mencionan componentes React, hooks, servicios backend y specs Cypress asociadas. Usa la guía de testing (`docs/TESTING.md`) junto a los seeds de personalización (`docs/personalizacion/README.md`) para reproducir escenarios.

Lo que sigue consolida los grupos funcionales más relevantes y sus piezas clave (estado octubre 2025).

## Autenticación y Onboarding (flujos 1, 2, 2A, 2B, 2C)
- **Qué resuelven**: registro/login, creación de boda, cuestionario de descubrimiento IA y personalización continua.
- **Documentación**: `flujo-1-registro-autenticacion.md`, `flujo-2-descubrimiento-personalizado.md`, `flujo-2-creacion-boda-ia.md`, `flujo-2b-creacion-boda-asistente.md`, `flujo-2c-personalizacion-continua.md`.
- **Estado**: en curso. Onboarding conversacional operativo; personalización continua pendiente de orquestador y datasets vivos.
- **Componentes críticos**: `apps/main-app/src/pages/Login.jsx`, `apps/main-app/src/pages/Signup.jsx`, `apps/main-app/src/components/Onboarding/*`, `apps/main-app/src/hooks/useOnboarding.js`, `apps/main-app/src/hooks/useAuth.jsx`, `backend/routes/admin-auth.js`.
- **Pruebas**: `cypress/e2e/onboarding/*.cy.js`, `cypress/e2e/personalization/*.cy.js`. Usa `seedPersonalizationProfiles.js` para datos deterministas.

## Invitados, Seating y RSVP (flujos 3, 4, 9, 13)
- **Qué resuelven**: alta/gestión de invitados, RSVPs multicanal, seating plan colaborativo y exportes.
- **Documentación**: `flujo-3-gestion-invitados.md`, `flujo-4-invitados-operativa.md`, `flujo-9-rsvp-confirmaciones.md`, `flujo-13-seating-plan-e2e.md`.
- **Estado**: funcional con tareas abiertas (colaboración tiempo real, experiencia móvil, dashboards RSVP).
- **Componentes**: `apps/main-app/src/pages/Invitados.jsx`, `apps/main-app/src/pages/SeatingPlan.jsx`, `apps/main-app/src/hooks/useGuests.js`, `apps/main-app/src/hooks/useSeatingPlan.js` (backend: ver `backend/routes/*rsvp*` si aplica).
- **Pruebas**: `cypress/e2e/guests/*.cy.js`, `cypress/e2e/seating/*.cy.js`, `cypress/e2e/rsvp/*.cy.js`. Seeds recomendados: `seedWeddingGuests.js`, `seedSeatingPlan.js`.

## Proveedores, Contratos y Finanzas (flujos 5A, 5B, 6, 15, 18)
- **Qué resuelven**: recomendación de proveedores con IA, timeline/tareas, presupuesto y contratos/documentos legales.
- **Documentación**: `flujo-5-proveedores-ia.md`, `flujo-5-timeline-tareas.md`, `flujo-6-presupuesto.md`, `flujo-15-contratos-documentos.md`, `flujo-18-generador-documentos-legales.md`.
- **Estado**: en curso; pendientes importaciones financieras avanzadas, recordatorios colaborativos y firma digital.
- **Componentes**: `apps/main-app/src/pages/Proveedores.jsx`, `apps/main-app/src/hooks/useFinance.js`, `apps/main-app/src/services/financeService.js` (backend: `backend/routes/*finance*` y `backend/routes/*contracts*` si aplica).
- **Pruebas**: `cypress/e2e/finance/*.cy.js`, `cypress/e2e/contracts/*.cy.js`, `cypress/e2e/budget_flow.cy.js`. Seeds: `seedFinanceMovements.js`, `seedSuppliersSimple.js`, `seedTestDataForPlanner.js`.

## Comunicaciones y Contenido (flujos 7, 8, 19, 20, 26)
- **Qué resuelven**: email inbox unificado, mensajería inteligente, diseño web/invitaciones y blog/inspiración.
- **Documentación**: `flujo-7-comunicacion-emails.md`, `flujo-8-diseno-web-personalizacion.md`, `flujo-19-diseno-invitaciones.md`, `flujo-20-email-inbox.md`, `flujo-26-blog.md`.
- **Estado**: en curso; IA operativa con mejoras de backend pendientes (migrar prompts, analítica, publicación automatizada).
- **Componentes**: `apps/main-app/src/pages/UnifiedEmail.jsx`, `apps/main-app/src/pages/DisenoWeb.jsx`, `apps/main-app/src/components/email/*` (backend: `backend/routes/*mail*`, `backend/routes/*ai*`).
- **Pruebas**: `cypress/e2e/email/*.cy.js`, `cypress/e2e/style/*.cy.js`, `cypress/e2e/blog/*.cy.js`.

## Protocolo, Día B y Post-boda (flujos 11, 11A–11E, 14, 21, 27)
- **Qué resuelven**: momentos especiales, timeline del día B, checklist de última hora, documentación legal, ayudas IA para lecturas, web pública y álbum de momentos.
- **Documentación**: `flujo-11-protocolo-ceremonias.md`, `flujo-11a-momentos-especiales.md`, `flujo-11b-timeline-dia-b.md`, `flujo-11c-checklist-ultima-hora.md`, `flujo-11d-guia-documentacion-legal.md`, `flujo-11e-ayuda-textos-ceremonia.md`, `flujo-14-checklist-avanzado.md`, `flujo-21-sitio-publico.md`, `flujo-27-momentos.md`.
- **Estado**: la documentación cubre todo el detalle; implementación sigue pendiente en varias piezas (drag & drop, alertas, catálogos internacionales, exportes públicos).
- **Componentes**: páginas en `apps/main-app/src/pages/protocolo/*`, hooks `useSpecialMoments`, `useCeremonyTimeline`, `useChecklist` y servicios de notificaciones.
- **Pruebas**: `cypress/e2e/protocolo/*.cy.js`, `cypress/e2e/moments/*.cy.js`, `cypress/e2e/web/public-site.cy.js`.

## Notificaciones, Automatización y Gamificación (flujos 12, 16, 17, 22, 23, 28, 30)
- **Qué resuelven**: centro de notificaciones, asistente virtual y orquestador multicanal, gamificación/dashboards, navegación principal y métricas globales.
- **Documentación**: `flujo-12-notificaciones-configuracion.md`, `flujo-16-asistente-virtual-ia.md`, `flujo-17-gamificacion-progreso.md`, `flujo-22-dashboard-navegacion.md`, `flujo-23-metricas-proyecto.md`, `flujo-28-dashboard-planner.md`, `flujo-30-pagina-inicio.md`.
- **Estado**: notificaciones y dashboards en curso; asistente y automatizaciones pendientes de orquestador backend y UI de reglas.
- **Componentes**: `apps/main-app/src/components/notifications/*`, `apps/main-app/src/services/notificationService.js`, `apps/main-app/src/pages/HomeUser.jsx` (backend: `backend/routes/*automation*`).
- **Pruebas**: `cypress/e2e/notifications/*.cy.js`, `cypress/e2e/assistant/*.cy.js`, `cypress/e2e/dashboard/*.cy.js`, `cypress/e2e/home/*.cy.js`, `cypress/e2e/gamification/*.cy.js`.

## Administración y soporte (flujos 0, 10, 25, 29)
- **Qué resuelven**: panel admin, gestión multi-boda, planes/suscripciones y upgrade de roles.
- **Documentación**: `flujo-0-administracion-global.md`, `flujo-10-gestion-bodas-multiples.md`, `flujo-25-suscripciones.md`, `flujo-29-upgrade-roles.md`.
- **Estado**: panel admin implementado con pendientes de seguridad (MFA, impersonación). Multi-boda y monetización en curso/pending.
- **Componentes**: `apps/main-app/src/pages/admin/*`, `apps/main-app/src/pages/Bodas.jsx`, `apps/main-app/src/hooks/useWedding.js`, `backend/routes/admin-*.js` (suscripciones: `backend/routes/*subscription*`).
- **Pruebas**: `cypress/e2e/admin/*.cy.js`, `cypress/e2e/weddings/*.cy.js`, `cypress/e2e/subscriptions/*.cy.js`.

## Referencias cruzadas
- **Índice vivo**: `docs/FLUJOS-INDICE.md`
- **Roadmap consolidado**: `docs/ROADMAP.md`
- **Backlog operativo**: `docs/TODO.md`
- **Seeds y fixtures**: `docs/personalizacion/README.md`
- **Testing**: `docs/TESTING.md`
- **Arquitectura**: `docs/ARCHITECTURE.md`

Si detectas divergencias entre la experiencia real y la documentación, actualiza primero el flujo específico y luego ejecuta `node scripts/aggregateRoadmap.js` para regenerar el roadmap y la matriz de pruebas.
