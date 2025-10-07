---
# Nota de configuración de puertos
---

## Puertos de la aplicación

- Frontend (Vite): 5173
- Backend (Express): 3001
- Especial testing contenedor: 30001 reservado (no usar en local)

## Reglas

- El frontend debe estar SIEMPRE en 5173. Los scripts, Cypress y la documentación se ajustan a este puerto.
- Cypress usa por defecto `http://localhost:5173` como `baseUrl` (configurado en `cypress.config.js`).
  - Si excepcionalmente se necesita otro puerto, se puede sobreescribir con la variable de entorno `CYPRESS_BASE_URL`.

## Referencias en código

- `package.json`:
  - `dev`: `vite --host --port 5173`
  - `e2e` / `e2e:open`: verificación en `http://localhost:5173`.
- `cypress.config.js`: `baseUrl` por defecto `http://localhost:5173`.
- `.env.example`: `FRONTEND_PORT=5173` documentado (informativo).


---

## Checklist Despliegue (Render)

- ALLOWED_ORIGIN: dominios del frontend permitidos, separados por comas. Ej.: `https://app.tu-dominio.com,https://www.tu-dominio.com`.
- RATE_LIMIT_AI_MAX: límite de IA por usuario (uid). Recomendado: `60` en prod, `0` en staging/local. Por defecto el backend usa 60/min en prod si no defines variable (`backend/index.js:117`).
- NODE_ENV: `production`.
- OPENAI_API_KEY: clave para endpoints de IA.
- Mailgun: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` y opcional `MAILGUN_BASE_URL` (UE/US).
- WhatsApp (opcional): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `WHATSAPP_PROVIDER=twilio`.
- Web Push (opcional): `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`.
- Firebase Admin: usa uno de estos métodos:
  - `FIREBASE_SERVICE_ACCOUNT_KEY` con JSON (o base64 del JSON), o
  - `GOOGLE_APPLICATION_CREDENTIALS` apuntando a `serviceAccount.json`, o
  - Montar secreto en `/etc/secrets/serviceAccount.json`.
- .env (opcional): puedes montar un archivo con variables en `/etc/secrets/app.env` (el backend lo carga si existe).
- BACKEND_BASE_URL / VITE_BACKEND_BASE_URL: asegúralos si hay jobs/schedulers externos o llamadas cross-origin.
- Build & Start (Render):
  - Build command: `npm install; npm run build`
  - Start command: `npm start`
  - Nota: existe `postinstall` en el root que instala dependencias del `backend/` automáticamente (`package.json:7`).

### Notas técnicas
- `trust proxy` activado para contar IPs reales detrás de Render (`backend/index.js:93`).
- CORS con allowlist (coma-separada) y credenciales activadas (`backend/index.js:102`).
- Limitador de IA por usuario mediante `uid`; fallback a IP si no hay sesión (`backend/index.js:119`).

### Problemas frecuentes
- 403 CORS: revisa `ALLOWED_ORIGIN` y que coincida exactamente con el `window.location.origin` del FE.
- 429 rate_limit: sube `RATE_LIMIT_AI_MAX` o revisa picos automáticos. Dado que cuenta por usuario, evita colisiones por IP compartida.
- Módulos no encontrados (helmet/express-rate-limit): Render debe instalar en root; ver `postinstall` en `package.json`. Si personalizas comandos, incluye `npm --prefix backend install`.
