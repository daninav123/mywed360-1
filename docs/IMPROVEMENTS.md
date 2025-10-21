# Mejoras aplicadas (backend/API y CI)

- UnificaciÃ³n de Node a 20.x:
  - `functions/package.json` engines pasa a ` â€“ node â€“ :  â€“ 20 â€“ `.
  - `test-email-system.yml` ahora usa Node 20.x.

- CORS y preflight:
  - Respuestas `OPTIONS *` automÃ¡ticas y cachÃ© de preflight (`Access-Control-Max-Age: 600`).
  - `optionsSuccessStatus: 204` para compatibilidad con proxies.

- LÃ­mites de tamaÃ±o de peticiÃ³n:
  - `express.json({ limit: '1mb' })` y `express.urlencoded({ limit: '2mb' })` (configurables vÃ­a `BODY_JSON_LIMIT` y `BODY_URLENCODED_LIMIT`).
  - No afecta a adjuntos de Mailgun (se manejan con `multer` en su ruta).

- Health checks estÃ¡ndar:
  - `GET /api/health` (detallado), `GET /api/health/livez` y `GET /api/health/readyz` (pruebas bÃ¡sicas de Firestore/entorno).

Notas:
- El backend ya soporta `/etc/secrets/app.env` para inyectar variables en despliegue.
- Los archivos `serviceAccount*.json` estÃ¡n ignorados en `.gitignore`; no deben versionarse.

- Multi-boda: vista portfolio con filtros y permisos por boda (Bodas.jsx, MultiWeddingSummary.jsx, WeddingPortfolioTable.jsx, actualización WeddingContext).
