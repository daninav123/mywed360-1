# Despliegue y CI

## Despliegue Frontend
- Build: `npm run build` (Vite)
- Hosting: cualquier CDN/hosting estático (configurar `VITE_*` en entorno)

## Backend (referencia)
- Render u otro PaaS expuesto como `VITE_BACKEND_BASE_URL`
- Variables seguras: claves Mailgun, OpenAI, WhatsApp

## CI (propuesta)
Pasos mínimos:
1. Instalar dependencias
2. Lint y typecheck (si aplica)
3. Ejecutar tests unitarios (cuando existan)
4. Ejecutar E2E seating smoke (modo headless) contra preview
5. Build

## Cypress en CI
- Usar `CYPRESS_BASE_URL` contra la URL del preview
- Bypass de auth habilitado (ver `TESTING.md`)

## Versionado/Entornos
- Ramas: `main` (prod), `develop` (staging)
- Entornos: dev/staging/prod con proyectos Firebase separados

