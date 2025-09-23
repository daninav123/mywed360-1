# Seguridad

- No comitees credenciales: archivos `serviceAccount*.json` están ignorados por `.gitignore`.
- Variables sensibles deben inyectarse por entorno o secretos:
  - Backend: `/etc/secrets/app.env` (si existe) o `.env` local.
  - Firebase Admin: `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON o Base64) o `GOOGLE_APPLICATION_CREDENTIALS`.
  - Mailgun: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_SIGNING_KEY`.
  - Cloud Functions (CORS): `FUNCTIONS_ALLOWED_ORIGINS` (coma-separado) o `ALLOWED_ORIGIN`.
  - Cloud Functions (adjuntos email): `EMAIL_ATTACHMENT_MAX_BYTES` (por defecto 5MB), `EMAIL_ATTACHMENT_TIMEOUT_MS` (por defecto 10000ms).
  - Cloud Functions (tipos MIME adjuntos permitidos): `EMAIL_ATTACHMENT_ALLOWED_MIME` (lista coma-separada; por defecto: `application/pdf,image/jpeg,image/png,image/gif,image/webp,image/svg+xml,text/plain`).
- CORS restringido por `ALLOWED_ORIGIN` (coma-separado); preflight cacheado 10 min.
- Límites de body configurables: `BODY_JSON_LIMIT`, `BODY_URLENCODED_LIMIT`.
- Healthchecks:
  - `GET /api/health`, `GET /api/health/livez`, `GET /api/health/readyz`.
- Producción: desactiva tokens mock: `ALLOW_MOCK_TOKENS=false`.
  - Se aplica tanto en backend Express como en Cloud Functions.

## Endpoints protegidos (Cloud Functions)

- `sendEmail` y `getMailgunEvents` requieren autenticación (Firebase ID token en `Authorization: Bearer ...`) y pasan por CORS restrictivo.
- `mailgunWebhook` exige firma válida (`MAILGUN_SIGNING_KEY`), validada por evento; rechaza 401 si falta o no coincide.

## Reporte de vulnerabilidades

Envía un correo al equipo mantenedor con detalles y pasos para reproducir. No abras issues públicos con información sensible.
