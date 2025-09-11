# Testing

## E2E — Seating Plan

Documentación específica: `docs/flujos-especificos/flujo-13-seating-plan-e2e.md`

Rutas de specs (Cypress):
- `cypress/e2e/seating/seating_smoke.cy.js`
- `cypress/e2e/seating/seating_ceremony.cy.js`
- `cypress/e2e/seating/seating_toasts.cy.js`
- `cypress/e2e/seating/seating_fit.cy.js`
- `cypress/e2e/seating/seating_area_type.cy.js`
- `cypress/e2e/seating/seating_assign_unassign.cy.js`

Configuración baseUrl:
- `CYPRESS_BASE_URL` o `http://localhost:${FRONTEND_PORT || 5173}`

Bypass de login:
- `ProtectedRoute` permite pasar si detecta `window.Cypress`

## Unit/Integration (pendiente)
- Añadir pruebas unitarias de hooks/servicios (`useSeatingPlan`, `SyncService`)
- Añadir pruebas de componentes críticos (`TasksRefactored`, RSVP views)

## Reglas de Firestore — Tests unitarios
- Archivo: `src/__tests__/firestore.rules.extended.test.js:1`
- Requiere emulador o `FIRESTORE_RULES_TESTS=true`.
- Carga `firestore.rules` y valida casos de permisos (owner/planner/assistant, auto‑adición a planners, etc.).

Ejemplo de ejecución (con emulador):
```
set FIRESTORE_EMULATOR_HOST=localhost:8080
npm run test:unit -- src/__tests__/firestore.rules.extended.test.js
```

## Cobertura mínima (propuesta)
- E2E seating smoke + ceremony verdes en CI
- 1–2 unit tests por servicio crítico
