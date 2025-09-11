# Entorno y Configuración

## Variables de entorno (.env)

Frontend (Vite):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_OPENAI_API_KEY` (ideal mover a backend)
- `VITE_MAILGUN_API_KEY` (ideal mover a backend)
- `VITE_BACKEND_BASE_URL` (p. ej. https://mywed360-backend.onrender.com)
- `FRONTEND_PORT` (opcional; usado por Cypress)
- `VITE_ENABLE_AUTO_ASSIGN` (opcional; 'true' para habilitar auto‑asignación en Seating)

Testing E2E:
- `CYPRESS_BASE_URL` (opcional)

## Puesta en marcha local
1. Crear `.env` con las variables anteriores
2. Instalar dependencias: `npm install`
3. Ejecutar: `npm run dev` (Vite)

### Emuladores Firebase (opcional)
- `firebase.json` define emulador Firestore en puerto `8080`.
- Variables útiles:
  - `FIRESTORE_EMULATOR_HOST=localhost:8080`
  - `FIREBASE_AUTH_EMULATOR_HOST` si usas emulador de Auth (no configurado aquí)

## Notas
- Evitar exponer claves sensibles en el cliente cuando existan alternativas en backend
- Usar proyectos de Firebase separados por entorno (dev/staging/prod)

## Ejemplo `.env.example`
```
VITE_FIREBASE_API_KEY=... 
VITE_FIREBASE_PROJECT_ID=...
VITE_OPENAI_API_KEY=...
VITE_MAILGUN_API_KEY=...
VITE_BACKEND_BASE_URL=https://mywed360-backend.onrender.com
FRONTEND_PORT=5173
# E2E/Emulador
# CYPRESS_BASE_URL=http://localhost:5173
# FIRESTORE_EMULATOR_HOST=localhost:8080
```
