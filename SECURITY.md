# Seguridad

- No comitees credenciales: archivos `serviceAccount*.json` están ignorados por `.gitignore`.
- Variables sensibles deben inyectarse por entorno o secretos:
  - Backend: `/etc/secrets/app.env` (si existe) o `.env` local.
  - Firebase Admin: `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON o Base64) o `GOOGLE_APPLICATION_CREDENTIALS`.
  - Mailgun: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_SIGNING_KEY`.
- CORS restringido por `ALLOWED_ORIGIN` (coma-separado); preflight cacheado 10 min.
- Límites de body configurables: `BODY_JSON_LIMIT`, `BODY_URLENCODED_LIMIT`.
- Healthchecks:
  - `GET /api/health`, `GET /api/health/livez`, `GET /api/health/readyz`.
- Producción: desactiva tokens mock: `ALLOW_MOCK_TOKENS=false`.

## Reporte de vulnerabilidades

Envía un correo al equipo mantenedor con detalles y pasos para reproducir. No abras issues públicos con información sensible.
