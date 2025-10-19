# Guía de Onboarding — MyWed360

Objetivo: que cualquier persona nueva pueda instalar, configurar y ejecutar el proyecto localmente con el menor roce posible.

## Requisitos previos

- Node.js >= 20 y npm >= 10
- Git
- Credenciales Firebase (service account JSON). Colocar en la raíz como `serviceAccount.json` o configurar `GOOGLE_APPLICATION_CREDENTIALS`. Ver `backend/middleware/authMiddleware.js` para rutas de búsqueda.
- Accesos a APIs externas (opcional según tareas): Mailgun, Twilio/WhatsApp, OpenAI. No hardcodear secretos.

## 1) Clonar e instalar

```bash
# Clonar
git clone https://github.com/Daniel-Navarro-Campos/mywed360.git
cd mywed360

# Instalar dependencias
npm install
```

## 2) Configurar variables de entorno

- Frontend: seguir la tabla de `docs/ENVIRONMENT.md`.
- Backend: seguir `docs/deploy-backend.md` (variables para Express/Render, Mailgun, Twilio, OpenAI, etc.).
- Puertos: el frontend está fijado a 5173 (strict). No usar 3000. Ver también `docs/config.md`.

Sugerencia de archivos:
- `.env` para variables comunes (no subir a Git)
- `.env.local` para overrides locales (en `.gitignore`)

## 3) Levantar servicios en local

Nota: si trabajas en un entorno compartido evita levantar servidores en puertos ya ocupados.

- Backend (Express):
  - `npm start` (ejecuta `node backend/index.js`)
  - Comprobar salud: `GET http://localhost:4004/health` (o puerto definido por `PORT`)

- Frontend (Vite):
  - `npm run dev` (levanta en `http://localhost:5173` con `--strictPort`)
  - Si necesitas previsualización de build: `npm run preview`

## 4) Datos de prueba y scripts útiles

- Scripts de backfill y utilidades en `scripts/` y `backend/scripts/`.
  - Ejemplos: `node backend/scripts/backfillMailsToUsers.js`, `node backend/scripts/fixMailFrom.js`
- Pruebas E2E (Cypress) y datos de prueba: ver `docs/TESTING.md`.
  - Smoke de Seating: `npm run cypress:run:seating`
  - E2E general: `npm run e2e` (usa `start-server-and-test`)
- Personalización:
  - Revisa `docs/personalizacion/README.md` para cargar perfiles de boda y recomendaciones de ejemplo antes de QA (`node scripts/seedPersonalizationProfiles.js`).
  - Sigue el procedimiento allí descrito para limpiar/sembrar datos cuando cambie la lógica del flujo de descubrimiento.

## 5) QA rápido (pre-PR)

- Lint: `npm run lint`
- Unit tests: `npm run test:unit`
- Validación i18n: `npm run validate:i18n`
- Validación de esquemas: `npm run validate:schemas`
- Presupuesto de bundle: `npm run check:bundle`

También disponible: `npm run ci:check` (agrega varias comprobaciones en cadena).

## 6) Despliegue y CI/CD

- CI recomendado: lint/typecheck → unit tests → Cypress smoke (seating) → build. Ver `docs/DEPLOYMENT_CI.md`.
- Backend en Render: ver `docs/deploy-backend.md`.

## 7) Observabilidad y Alertas

- Resumen: ver `docs/monitoring/README.md`.
- Chequeos básicos: `GET /health` en frontend/backend, métricas Prometheus si están habilitadas.

## 8) Checklist final y enlaces

- Arquitectura general: `docs/ARCHITECTURE.md`
- Entorno: `docs/ENVIRONMENT.md`
- Backend/Render: `docs/deploy-backend.md`
- Testing: `docs/TESTING.md`
- CI/CD: `docs/DEPLOYMENT_CI.md`
- API (OpenAPI): `docs/api/openapi.yaml`
- Monitorización: `docs/monitoring/README.md`
- Roadmap: `docs/roadmap-2025-v2.md`
