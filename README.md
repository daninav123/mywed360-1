# MyWed360 – Monorepo (Frontend + Backend + Docs)

MyWed360 – Monorepo (Frontend + Backend + Docs)

Este repositorio contiene el frontend (React + Vite + Tailwind, PWA), el backend (Express) y documentación operativa. Sirve como punto de entrada para desarrollo local, CI/CD y despliegues.

Resumen de módulos:
- Frontend: React 18 + Vite + TailwindCSS (PWA, offline-first) en `src/`
- Backend: Express + middleware de seguridad en `backend/`
- Funciones/Utilities: scripts y helpers en `scripts/`, `functions/`
- Documentación: guías técnicas y operativas en `docs/`

## Tabla de Contenidos

1. [Características](#características)
2. [Instalación](#instalación)
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
   - Health: backend `GET /health` y `GET /api/health`, métricas `GET /metrics`

4) Documentación clave
   - Arquitectura: `docs/ARCHITECTURE.md`
   - Onboarding: `docs/ONBOARDING.md`
   - API (OpenAPI): `docs/api/openapi.yaml`
   - Monitorización: `docs/monitoring/README.md`
   - Roadmap: `docs/roadmap-2025-v2.md`
   - CI/CD: `docs/DEPLOYMENT_CI.md`

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
