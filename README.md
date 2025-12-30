# Planivia – Monorepo (Frontend + Backend + Docs)

## Propósito del producto

Planivia funciona como wedding planner digital. Capturamos el estilo, prioridades y restricciones únicas de cada boda para guiar a las parejas y planners hacia las mejores decisiones en cada etapa. El perfil de la boda alimenta las recomendaciones del checklist, los proveedores sugeridos, el presupuesto y los contenidos generados por IA.  
Más detalles y playbooks en `docs/personalizacion/README.md`.

Este repositorio contiene el frontend (React + Vite + Tailwind, PWA), el backend (Express) y documentación operativa. Sirve como punto de entrada para desarrollo local, CI/CD y despliegues.

Resumen de módulos:
- Frontend: React 18 + Vite + TailwindCSS (PWA, offline-first) en `apps/main-app/src/`
- Backend: Express + middleware de seguridad en `backend/`
- Utilities: scripts y helpers en `scripts/` y `backend/scripts/`
- Documentación: guías técnicas y operativas en `docs/`

## Tabla de Contenidos

1. [Características](#características)
2. [Instalación](#instalación)
3. [Scripts de desarrollo](#scripts-de-desarrollo)
4. [Observabilidad y Alertas](#observabilidad-y-alertas)

---

## Quick Start (Monorepo)

1) Clonar e instalar dependencias
   - `git clone <repository-url> && cd maloveapp && npm install`

2) Variables de entorno
   - Frontend: ver `docs/ENVIRONMENT.md`
   - Backend: ver `docs/deploy-backend.md`

3) Ejecutar servicios en local
   - Backend: `npm run backend` (ejecuta `node backend/index.js`)
   - Frontend: `npm run dev:main` (Vite en `http://localhost:5173` con `--strictPort`)
   - Alternativa (todo en uno): `npm run dev` (backend + frontend main)
   - Health: backend `GET /health` y `GET /api/health`, métricas `GET /metrics`

4) Documentación clave
   - **Cumplimiento de requisitos:** `docs/CUMPLIMIENTO-REQUISITOS.md` ⭐
   - **Automatización de tareas:** `docs/AUTOMATIZACION-TAREAS.md` ⭐
   - Arquitectura: `docs/ARCHITECTURE.md`
   - Personalización y recomendaciones: `docs/personalizacion/README.md`
   - Onboarding: `docs/ONBOARDING.md`
   - API (OpenAPI): `docs/api/openapi.yaml`
   - API (Ejemplos/Próximos endpoints): `docs/api/OPENAPI_NEXT.md`
   - Monitorización: `docs/monitoring/README.md`
   - Roadmap: `docs/ROADMAP.md` (actual) y `docs/archive/roadmap-2025-v2.md` (snapshot histórico)
   - CI/CD: `docs/DEPLOYMENT_CI.md`
   - Testing (incluye webhook pagos en CI): `docs/TESTING.md`
   - Seguridad: `docs/SECURITY_PRIVACY.md`
   - Diseño / Prototipos Figma: `docs/diseno/README.md`
   - i18n: `docs/i18n/README-i18n.md`

## Características

Módulos principales del monorepo:
- Frontend (SPA): bandeja de correo, invitados, seating, finanzas, etc.
- Backend (Express): endpoints REST (RSVP, WhatsApp/Twilio, Mailgun, métricas, health).
- Integraciones: Firebase Auth/Firestore/Storage, Mailgun, OpenAI, WhatsApp Business (Twilio).
- PWA: precache, offline-first, web-vitals.

## Instalación

Requisitos: Node 20+ y npm 10+.

Pasos detallados en `docs/ONBOARDING.md` y `docs/ENVIRONMENT.md`.

## Scripts de desarrollo

Comandos de QA recomendados:
- Lint: `npm run lint`
- Unit tests: `npm run test:unit`
- E2E (smoke seating): `npm run cypress:run:seating`
- E2E general: `npm run e2e` (usa `start-server-and-test`)
- Validación i18n: `npm run validate:i18n`
- Validación de esquemas: `npm run validate:schemas`
- Presupuesto de bundle: `npm run check:bundle`
- Health/Coverage: `npm run test:coverage`

- ### Mantenimiento del roadmap / cobertura E2E
  - `npm run validate:roadmap`: ejecuta `aggregateRoadmap`, `debugSpecDiff` y `roadmapCrossCheck` para asegurar que documentación, tareas y specs físicas están sincronizadas.
  - `node scripts/debugSpecDiff.js`: compara specs declaradas en la documentación (`roadmap_aggregated.json`) con las tareas de `roadmap.json` y los archivos reales en `cypress/e2e`. Útil para detectar desalineaciones puntuales.
  - `node scripts/addOrphanSpecsToRoadmap.js`: toma los resultados del cross-check y crea tareas pendientes para cada spec huérfana. Ejecutarlo tras añadir nuevas suites o mover archivos.

Cuándo ejecutarlos:
- Pre-PR: lint + unit + validate:i18n + validate:schemas + cypress:run:seating
- Nightly (orquestador): ver `scripts/nightlyRunner.js`
- CI: ver `docs/DEPLOYMENT_CI.md` (lint → unit → cypress smoke → build)

## Observabilidad y Alertas

Resumen rápido del stack de observabilidad y cómo comenzar:

- Endpoint de métricas Prometheus en el backend: `GET /metrics` (protegido por `requireAdmin`).
- Señales de salud: `GET /health`, `GET /api/health`, `GET /api/health/livez`, `GET /api/health/readyz`.
- Guía completa, dashboards Grafana y reglas de Alertmanager: ver `docs/monitoring/README.md`.
- Arquitectura y diagrama resumido: ver `docs/ARCHITECTURE.md`.
