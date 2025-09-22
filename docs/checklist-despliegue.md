# Checklist de despliegue

Guía rápida para revisar antes de publicar.

## Backend (Render)
- Variables de entorno clave:
  - `ALLOWED_ORIGIN`: lista separada por comas (incluye tu dominio y `http://localhost:5173` si necesitas probar)
  - `OPENAI_API_KEY`: requerida si usas endpoints de IA
  - Mailgun: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` (y `MAILGUN_BASE_URL` si EU)
  - Twilio (si WhatsApp/SMS): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`
  - Wedding sites opcional: `PUBLIC_SITES_BASE_DOMAIN` (+ DNS wildcard)
  - Rate limits: `RATE_LIMIT_AI_MAX` (por defecto 60/min en producción)
- Puerto: Render inyecta `PORT`. Código usa 4004 por defecto local.

## Frontend (build)
- Ejecuta `npm run build` (aplica CSP estricta en `dist/index.html`).
- Advertencias de seguridad en build:
  - Evitar `VITE_ENABLE_DIRECT_OPENAI=true` en producción
  - No definir `VITE_OPENAI_API_KEY` en build (se incrusta en el bundle)

## PWA
- Manifiesto único: `public/app.webmanifest` (no hay duplicados).
- Iconos generados disponibles en `public/` (`icon-192.png`, `icon-512.png`, etc.).

## Tests y calidad
- Vitest configurado en `vitest.config.js`. Reporter JUnit deshabilitado para evitar fallos si no está instalado.
- ESLint/Prettier disponibles: `npm run lint`, `npm run format`.

## Observabilidad
- Endpoint `/metrics` del backend usa `prom-client` si está instalado (opcional).

## Seguridad
- CSP estricta en producción (scripts/patch-csp.js)
- Tokens mock deshabilitar en prod: no establecer `ALLOW_MOCK_TOKENS=true`.

