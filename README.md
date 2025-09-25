# MyWed360 â€“ Monorepo (Frontend + Backend + Docs)

MyWed360 â€“ Monorepo (Frontend + Backend + Docs)

Este repositorio contiene el frontend (React + Vite + Tailwind, PWA), el backend (Express) y documentaciÃ³n operativa. Sirve como punto de entrada para desarrollo local, CI/CD y despliegues.

Resumen de mÃ³dulos:
- Frontend: React 18 + Vite + TailwindCSS (PWA, offline-first) en `src/`
- Backend: Express + middleware de seguridad en `backend/`
- Funciones/Utilities: scripts y helpers en `scripts/`, `functions/`
- DocumentaciÃ³n: guÃ­as tÃ©cnicas y operativas en `docs/`

## Tabla de Contenidos

1. [CaracterÃ­sticas](#caracterÃ­sticas)
2. [InstalaciÃ³n](#instalaciÃ³n)
3. [Scripts de desarrollo](#scripts-de-desarrollo)
4. [Arquitectura](#arquitectura)
5. [PWA / Offline](#pwa--offline)
6. [Pruebas y CI](#pruebas-y-ci)
7. [Contribuir](#contribuir)

---

## Quick Start (Monorepo)

1) Clonar e instalar dependencias
   - `git clone ... && cd mywed360 && npm install`

2) Variables de entorno
   - Frontend: ver `docs/ENVIRONMENT.md`
   - Backend: ver `docs/deploy-backend.md`

3) Ejecutar servicios en local
   - Backend: `npm start` (o `node backend/index.js`)
   - Frontend: `npm run dev` (Vite en `http://localhost:5173` con `--strictPort`)
   - Health: backend `GET /health` y `GET /api/health`, mÃ©tricas `GET /metrics`

4) DocumentaciÃ³n clave
   - Arquitectura: `docs/ARCHITECTURE.md`
   - Onboarding: `docs/ONBOARDING.md`
   - API (OpenAPI): `docs/api/openapi.yaml`
   - API (Ejemplos/Próximos endpoints): `docs/api/OPENAPI_NEXT.md`
   - MonitorizaciÃ³n: `docs/monitoring/README.md`
   - Roadmap: `docs/roadmap-2025-v2.md`
   - CI/CD: `docs/DEPLOYMENT_CI.md`
   - Testing (incluye webhook pagos en CI): `docs/TESTING.md`

## CaracterÃ­sticas

MÃ³dulos principales del monorepo:
- Frontend (SPA): bandeja de correo, invitados, seating, finanzas, etc.
- Backend (Express): endpoints REST (RSVP, WhatsApp/Twilio, Mailgun, mÃ©tricas, health).
- Integraciones: Firebase Auth/Firestore/Storage, Mailgun, OpenAI, WhatsApp Business (Twilio).
- PWA: precache, offline-first, web-vitals.

## InstalaciÃ³n

Requisitos: Node 20+ y npm 10+.

Pasos detallados en `docs/ONBOARDING.md` y `docs/ENVIRONMENT.md`.

## Scripts de desarrollo

Comandos de QA recomendados:
- Lint: `npm run lint`
- Unit tests: `npm run test:unit`
- E2E (smoke seating): `npm run cypress:run:seating`
- E2E general: `npm run e2e` (usa `start-server-and-test`)
- ValidaciÃ³n i18n: `npm run validate:i18n`
- ValidaciÃ³n de esquemas: `npm run validate:schemas`
- Presupuesto de bundle: `npm run check:bundle`
- Health/Coverage: `npm run test:coverage`

CuÃ¡ndo ejecutarlos:
- Pre-PR: lint + unit + validate:i18n + validate:schemas + cypress:run:seating
- Nightly (orquestador): ver `scripts/nightlyRunner.js`
- CI: ver `docs/DEPLOYMENT_CI.md` (lint â†’ unit â†’ cypress smoke â†’ build)

## Observabilidad y Alertas

Resumen rÃ¡pido del stack de observabilidad y cÃ³mo comenzar:

- Endpoint de mÃ©tricas Prometheus en el backend: `GET /metrics` (protegido por `requireAdmin`).
- SeÃ±ales de salud: `GET /health`, `GET /api/health`, `GET /api/health/livez`, `GET /api/health/readyz`.
- GuÃ­a completa, dashboards Grafana y reglas de Alertmanager: ver `docs/monitoring/README.md`.
- Arquitectura y diagrama resumido: ver `docs/ARCHITECTURE.md`.
