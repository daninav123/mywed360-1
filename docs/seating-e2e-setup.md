---
# Guía de ejecución E2E: Seating Plan
---

## Requisitos previos

- Frontend sirviendo en `http://localhost:5173` (puerto fijo, ver `docs/config.md`).
- No es necesario levantar backend local.
- Cypress instalado en el proyecto (scripts ya configurados).

## Variables de entorno útiles (opcional)

- `CYPRESS_BASE_URL`: base de la app.
  - Ej: `http://localhost:5173` (por defecto ya configurado).
- `BACKEND_BASE_URL`: backend a usar para prefijos `/api/*` (por comandos de Cypress).
  - Por defecto: `https://mywed360-backend.onrender.com` (ver `cypress.config.js`).
- `STUB_RSVP` (true/false): si es `true` y `BACKEND_BASE_URL` apunta a `onrender.com`, se stubbean en `cypress/support/e2e.js` los endpoints dev de RSVP:
  - `POST **/api/rsvp/dev/ensure-planner`
  - `POST **/api/rsvp/dev/create`
  - `GET  **/api/rsvp/by-token/*`
  - `POST **/api/rsvp/reminders`
- `STUB_FIRESTORE` (true/false): si es `true`, se interceptan llamadas a Firestore para evitar dependencia remota en E2E.

## Comandos útiles (PowerShell)

- Ejecutar un spec concreto (smoke):
```
$env:CYPRESS_BASE_URL= – http://localhost:5173 – ; npm run cypress:run -- --spec  – cypress/e2e/seating/seating_smoke.cy.js – 
```

- Ejecutar specs clave (fit y toasts):
```
$env:CYPRESS_BASE_URL= – http://localhost:5173 – ; npm run cypress:run -- --spec  – cypress/e2e/seating/seating_fit.cy.js – 
$env:CYPRESS_BASE_URL= – http://localhost:5173 – ; npm run cypress:run -- --spec  – cypress/e2e/seating/seating_toasts.cy.js – 
```

- Ejecutar todo Seating con stubs útiles (incluye capacidad):
```
$env:CYPRESS_BASE_URL= – http://localhost:5173 – ; $env:STUB_RSVP= – true – ; npm run cypress:run -- --spec  – cypress/e2e/seating/*.cy.js – 
```

## Tips de estabilidad

- `cy.mockWeddingMinimal()`: inyecta `window.__MOCK_WEDDING__` para evitar listeners de Firestore en `WeddingContext`.
- `cy.resetSeatingLS()`: limpia claves locales `seatingPlan:*` antes de un test para estado limpio.
- El seed automático de invitados en modo Cypress crea 6 invitados `Invitado E2E N` si no hay datos, permitiendo probar asignación.

## Mapeo rápido spec → UI

- Plantillas: botón `title= – Plantillas – ` y modal `h3: Plantillas`.
- Configuración: `title= – Configurar espacio – ` (Espacio), `title= – Configurar ceremonia – ` (Ceremonia), `title= – Configurar banquete – ` (Banquete).
- Herramientas: botones “Navegar”, “Mover mesas”, “Perímetro”, “Puertas”, “Obstáculos”, “Pasillos”.
- Ajuste de vista: botón `title= – Ajustar a pantalla – ` (⌂).
- Ceremonia: sillas con `aria-label= – Silla X – `.
- Invitados: `aria-label= – Invitado Nombre – ` y panel “Pendientes (N)”, botón “Mostrar Invitados”.
- Mesas: `data-testid^= – table-item- – `, badge ocupación X/Y y botón ✖ para desasignar.

## Notas

- No se modifican diseños visuales. Cambios funcionales enfocados en estabilidad E2E y fallback local.
- El puerto del frontend es SIEMPRE 5173.
