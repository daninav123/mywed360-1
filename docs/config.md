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

