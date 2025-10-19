# Entorno y Configuración

Todos los entornos comparten un único archivo `.env` en la raíz del proyecto (ver `.env.example`). Este documento resume qué variables son necesarias, cómo agruparlas y qué valores sensibles deben mantenerse fuera del frontend.

> **Recordatorio**: en desarrollo local el backend Express escucha en `http://localhost:4004`. El dev server de Vite ya proxya `/api` hacia ese puerto salvo que definas `VITE_BACKEND_BASE_URL`.

## 📦 Resumen por ámbito

| Ámbito | Variables clave | Comentarios |
|--------|-----------------|-------------|
| Frontend (Vite) | `VITE_FIREBASE_*`, `VITE_BACKEND_BASE_URL`, `VITE_ENABLE_*`, `FRONTEND_PORT` | Se inyectan en el bundle. Evita exponer claves largas (OpenAI, Mailgun) en producción. |
| Backend Express (`PORT=4004`) | `ALLOWED_ORIGIN`, `RATE_LIMIT_*`, `AXIOS_*`, `LOG_REDACT` | Protege CORS y límites de petición. |
| Servicios externos | Mailgun (`VITE_MAILGUN_*`), WhatsApp/Twilio (`WHATSAPP_*`, `TWILIO_*`), Stripe (pendiente), Nordigen | Requieren credenciales secretas; definirlas sólo en entornos controlados. |
| Administración | `ADMIN_*`, `VITE_ADMIN_*`, `ADMIN_IP_ALLOWLIST` | Obliga MFA y dominios permitidos para panel admin. |
| Monitorización | `VITE_METRICS_ENDPOINT`, `VITE_ENABLE_WEB_VITALS`, `SLACK_WEBHOOK_URL`, `SMTP_*` | Habilitan métricas, alertas y telemetría. |
| Scripts/automatización | `BACKEND_BASE_URL`, `VITE_BANK_API_BASE_URL`, `VITE_BANK_API_KEY`, `DEFAULT_COUNTRY_CODE` | Usadas por `scripts/runTask.js`, orquestadores y worker de finanzas. |

Consulta `.env.example` para el listado completo. A continuación se destacan las secciones que debes rellenar para levantar el proyecto sin sorpresas.

## 🔧 Frontend (Vite)

Obligatorio para `npm run dev` o `npm run build`:

- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_APP_ID`, etc.
- `VITE_BACKEND_BASE_URL` → URL del backend Express (local o desplegado).
- `VITE_DEFAULT_COUNTRY_CODE` → Normalización de teléfonos (ej. `+34`).
- `VITE_ENABLE_AUTO_ASSIGN` (opcional) → Activa auto-asignación en Seating para QA local.
- `FRONTEND_PORT` → Puerto del servidor Vite (coincide con `CYPRESS_BASE_URL` si se usa Cypress).

Evita dejar `VITE_MAILGUN_API_KEY` u otras claves sensibles activas en builds de producción. Cuando sea posible, mueve el consumo al backend.

## 🛠️ Backend Express / API interna

- `PORT` → Puerto del servidor Express (por defecto `4004`).
- `ALLOWED_ORIGIN` → Lista de orígenes permitidos (separados por comas). Define producción con dominios reales.
- Rate limiting: `RATE_LIMIT_MAX`, `RATE_LIMIT_AI_MAX`, `RATE_LIMIT_GLOBAL_MAX`, `WEBHOOK_RATE_LIMIT_MAX`, `WHATSAPP_WEBHOOK_RATE_LIMIT_MAX`.
- Parsers: `BODY_JSON_LIMIT`, `BODY_URLENCODED_LIMIT`, `WEBHOOK_MAX_BYTES`.
- Reintentos HTTP: `AXIOS_TIMEOUT_MS`, `AXIOS_RETRY_*`.
- Logging: `LOG_REDACT` decide si se anonimizan emails/teléfonos en logs.

## ✉️ Mailgun y Email

- `VITE_MAILGUN_API_KEY`, `VITE_MAILGUN_DOMAIN`, `VITE_MAILGUN_SENDING_DOMAIN`, `VITE_EMAIL_MAX_ATTACHMENTS`, `VITE_EMAIL_MAX_ATTACHMENT_SIZE_MB`.
- `VITE_EMAIL_INSIGHTS_*` (consultar `.env.example`) para clasificación IA de correos.
- Los endpoints protegidos residen en el backend; no expongas la clave Mailgun en frontend productivo.

## 💬 WhatsApp / Twilio

- `WHATSAPP_PROVIDER` (por defecto `twilio`).
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`.
- `WHATSAPP_STATUS_CALLBACK_URL` si usas una URL distinta a `BACKEND_BASE_URL`.
- Normalización: `DEFAULT_COUNTRY_CODE` (backend) y `VITE_DEFAULT_COUNTRY_CODE` (frontend).
- Opcional: listas de IP (`WHATSAPP_WEBHOOK_IP_ALLOWLIST`) y límites específicos (`WHATSAPP_WEBHOOK_MAX_BYTES`).

## 💳 Finanzas y banca

- `NORDIGEN_SECRET_ID`, `NORDIGEN_SECRET_KEY`, `NORDIGEN_BASE_URL` para el agregador bancario.
- `VITE_BANK_API_BASE_URL`, `VITE_BANK_API_KEY` para llamadas desde frontend.
- Recordatorios y contribuciones: `VITE_ENABLE_FINANCE_ALERTS`, combinados con SMTP/Mailgun.

## 🛡️ Administración y seguridad

- `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (preferido) o `ADMIN_PASSWORD` (sólo desarrollo).
- `ADMIN_REQUIRE_MFA`, `ADMIN_MFA_SECRET`, `ADMIN_MFA_TEST_CODE` para MFA.
- `ADMIN_ALLOWED_DOMAINS`, `VITE_ADMIN_ALLOWED_DOMAINS`, `ADMIN_IP_ALLOWLIST` para restringir accesos.
- Sesiones: `ADMIN_SESSION_TTL_MINUTES`, `ADMIN_LOGIN_*` (protección contra brute force).

## 📈 Métricas, alertas y automatización

- Slack: `SLACK_WEBHOOK_URL`.
- Alertas email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `ALERT_EMAIL_TO`, `ALERT_EMAIL_FROM`.
- Web vitals: `VITE_ENABLE_WEB_VITALS`, `VITE_METRICS_ENDPOINT`.
- Automatizaciones IA/Workers: revisa `VITE_ENABLE_DIRECT_OPENAI`, `VITE_ENABLE_LEGACY_FALLBACKS`, `IMAGE_PROXY_*` si usas proxys.

## 🧪 Testing y entornos locales

- E2E: `CYPRESS_BASE_URL` (coherente con Vite), `FRONTEND_PORT`.
- Firebase emuladores: `FIRESTORE_EMULATOR_HOST=localhost:8080`, `FIREBASE_AUTH_EMULATOR_HOST` si trabajas sin producción.
- Scripts: `BACKEND_BASE_URL`, `VITE_BACKEND_BASE_URL` y `ALLOWED_ORIGIN` deben apuntar al mismo dominio/puerto.

## 🧩 Fixtures de personalización

- Consulta `docs/personalizacion/README.md` para conocer los scripts de seed disponibles.
- Mantén sincronizados los datasets de ejemplo (`weddingProfile`, `weddingInsights`, `recommendations`) usados en QA.
- Antes de ejecutar pruebas de recomendaciones, limpia y vuelve a sembrar según el procedimiento descrito en ese hub.
- Documenta cualquier nuevo dataset o script en el mismo hub para evitar divergencias.

## Pasos para levantar un entorno local

1. Duplica `.env.example` → `.env` y completa cada sección anterior con valores válidos para tu entorno.
2. Instala dependencias: `npm install`.
3. Inicia backend Express (si aplica) con `npm run backend` (ver `package.json`).
4. Levanta el frontend: `npm run dev` (Vite) o usa scripts específicos (`npm run dev:full` si existe).
5. (Opcional) Arranca emuladores Firebase (`firebase emulators:start`) si necesitas un entorno aislado.

## Buenas prácticas

- Mantén `.env` fuera de control de versiones. Usa `.env.local` o `.env.staging` para variantes.
- No subas claves reales a servicios de terceros; utiliza variables de entorno del sistema en CI/CD.
- Cuando añadas una variable nueva, actualiza **tanto** `.env.example` como este archivo y menciona su propósito en commits/PRs.
