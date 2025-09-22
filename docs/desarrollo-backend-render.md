# Desarrollo del frontend con backend en Render

Este proyecto está preparado para desarrollar el frontend contra el backend desplegado en Render, sin levantar backend local.

## Requisitos
- Node `>=20` y npm `>=10` (ver `package.json` engines).
- Variables ya definidas en Render (no es necesario tocarlas aquí).

## Configuración local rápida
- `.env.example` ya apunta por defecto a Render:
  - `VITE_BACKEND_BASE_URL=https://mywed360-backend.onrender.com`
  - `VITE_BANK_API_BASE_URL=https://mywed360-backend.onrender.com/api`
  - `VITE_ENABLE_DIRECT_OPENAI=false` (recomendado mantenerlo así)

## Levantar el frontend
1. Instalar dependencias: `npm install`
2. Ejecutar el dev server: `npm run dev`
   - Vite escucha en `http://localhost:5173`
   - El proxy `/api` reenvía a `VITE_BACKEND_BASE_URL` (Render)

## CORS (backend en Render)
- Asegurar en Render que `ALLOWED_ORIGIN` incluya el origen del front local: `http://localhost:5173` y tu dominio de producción (separados por coma).

## Autenticación (modo desarrollo)
- El middleware de backend permite tokens mock cuando `ALLOW_MOCK_TOKENS` no es `false` y `NODE_ENV !== 'production'`.
- Para probar endpoints protegidos desde el front, puedes enviar `Authorization: Bearer mock-<uid>-<email>`.

## OpenAI desde el navegador
- Por defecto `VITE_ENABLE_DIRECT_OPENAI=false` para evitar exponer claves.
- Solo para pruebas locales, puedes ponerlo a `true` temporalmente y definir `VITE_OPENAI_API_KEY` en tu entorno local (no en producción).

## Build de producción (resumen)
- `npm run build` aplica CSP estricta automáticamente sobre `dist/index.html`.
- Se ejecuta un chequeo de seguridad no bloqueante que avisa si:
  - `VITE_ENABLE_DIRECT_OPENAI=true` en el build
  - `VITE_OPENAI_API_KEY` está definido en el entorno del build

## Notas
- Si en algún momento necesitas backend local, puedes hacerlo con `npm run start` (usa puerto 4004 por defecto) y cambiar `VITE_BACKEND_BASE_URL` a `http://localhost:4004`.

