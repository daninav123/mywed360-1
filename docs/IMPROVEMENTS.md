# Mejoras aplicadas (backend/API y CI)

- Unificación de Node a 20.x:
  - `functions/package.json` engines pasa a ` “ node “ :  “ 20 “ `.
  - `test-email-system.yml` ahora usa Node 20.x.

- CORS y preflight:
  - Respuestas `OPTIONS *` automáticas y caché de preflight (`Access-Control-Max-Age: 600`).
  - `optionsSuccessStatus: 204` para compatibilidad con proxies.

- Límites de tamaño de petición:
  - `express.json({ limit: '1mb' })` y `express.urlencoded({ limit: '2mb' })` (configurables vía `BODY_JSON_LIMIT` y `BODY_URLENCODED_LIMIT`).
  - No afecta a adjuntos de Mailgun (se manejan con `multer` en su ruta).

- Health checks estándar:
  - `GET /api/health` (detallado), `GET /api/health/livez` y `GET /api/health/readyz` (pruebas básicas de Firestore/entorno).

Notas:
- El backend ya soporta `/etc/secrets/app.env` para inyectar variables en despliegue.
- Los archivos `serviceAccount*.json` están ignorados en `.gitignore`; no deben versionarse.

- Multi-boda: vista portfolio con filtros y permisos por boda (Bodas.jsx, MultiWeddingSummary.jsx, WeddingPortfolioTable.jsx, actualización WeddingContext).
