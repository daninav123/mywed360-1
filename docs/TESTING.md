# Testing

Guía consolidada para ejecutar y mantener las suites de pruebas de MyWed360. Complementa la documentación específica de cada flujo (`docs/flujos-especificos/*`) y los scripts de semillas descritos en `docs/personalizacion/README.md`.

## 1. Configuración rápida

- **Instalación previa**: `npm install`, variables cargadas (`.env.test` o `.env`).
- **Frontend**: `FRONTEND_PORT=5173` (Cypress espera puerto estricto) o define `CYPRESS_BASE_URL`.
- **Backend**: `npm start` (puerto `4004`) o emplea `start-server-and-test` desde los scripts package.
- **Credenciales**: usa el set de seeds (`seedTestDataForPlanner`, `seedPersonalizationProfiles`, `seedSeatingPlan`) para asegurar datos deterministas antes de correr E2E.
- **Bypass de login**: `ProtectedRoute` detecta `window.Cypress`; no se necesitan usuarios reales para smoke locales.

## 2. Suites E2E (Cypress)

| Flujo | Cadencia sugerida | Specs principales | Seeds/datos requeridos |
|-------|-------------------|-------------------|------------------------|
| Seating plan (flujo 4/13) | CI (smoke) + nightly completa | `cypress/e2e/seating/*.cy.js`, `cypress/e2e/passing/seating_collab.cy.js` | `seedSeatingPlan.js`, `seedWeddingGuests.js`, locks habilitados. |
| Onboarding & personalización (flujo 2/2C) | Nightly + antes de cambios IA | `cypress/e2e/onboarding/discovery-personalized.cy.js`, `cypress/e2e/personalization/personalization-dashboard.cy.js` | `seedPersonalizationProfiles.js`, `seedTestDataForPlanner.js` con mismo `weddingId`. |
| RSVP + Invitados (flujos 3/9) | Semanal + regresiones | `cypress/e2e/guests/*.cy.js`, `cypress/e2e/rsvp/*.cy.js` | `seedWeddingGuests.js`, `seedSuppliersSimple.js` (notas de seating VIP), habilitar `__GUESTS_TEST_API__`. |
| Finanzas (flujo 6) | Nightly | `cypress/e2e/finance/*.cy.js`, `budget_flow.cy.js` | `seedFinanceMovements.js`, `seedTestDataForPlanner.js`. |
| Comunicaciones (flujos 7/20) | Antes de releases email/inbox | `cypress/e2e/email/*.cy.js`, `compose_quick_replies.cy.js` | `MAILGUN_TEST_MODE`, `seedTestDataForPlanner`. |
| Protocolo (flujos 11A–11E) | Cada iteración de protocolo | `cypress/e2e/protocolo/*.cy.js` | Seeds planner + `seedPersonalizationProfiles` (moments). |
| Dashboard/Home/Gamificación (flujos 22/17/30) | Nightly | `cypress/e2e/dashboard/*.cy.js`, `cypress/e2e/home/*.cy.js`, `cypress/e2e/gamification/*.cy.js` | `seedTestDataForPlanner`, `seedPersonalizationProfiles`, set `window.__GAMIFICATION_TEST_SUMMARY__`. |
| Admin/Automation (flujos 0/12/16) | Bajo demanda | `cypress/e2e/admin/*.cy.js`, `cypress/e2e/notifications/*.cy.js`, `cypress/e2e/assistant/*.cy.js` | `seedAdminData.js`, definir `ADMIN_MFA_TEST_CODE`, habilitar `window.__MYWED360_TEST_MODE__`. |

> Consulta la carpeta `cypress/e2e/<módulo>` para specs adicionales (blog, inspiración, subscriptions, web). Cada spec incluye comentarios con precondiciones y seeds específicos si difieren de la tabla.

### Ejecución

- **Modo interactivo**: `npm run cypress:open`
- **Smoke seating**: `npm run cypress:run:seating`
- **Pipeline completo (sin abrir navegador)**: `npm run e2e`
- **Seleccionar subset**: `npx cypress run --spec "cypress/e2e/finance/**/*.cy.js"`

## 3. Unit & integration tests

- **Frontend**: `npm run test:unit` (Vitest). Cobertura actual incluye hooks (`useGuests`, `useSeatingPlan`, `useTranslations`) y servicios (`GamificationService`, `NotificationService`). añade noches tests para nuevos hooks/servicios.
- **Firestore rules**: `src/__tests__/firestore.rules.extended.test.js` (emulador). Ejecuta con:
  ```
  set FIRESTORE_EMULATOR_HOST=localhost:8080
  npm run test:unit -- src/__tests__/firestore.rules.extended.test.js
  ```
  Requiere `firebase emulators:start --only firestore` en otra terminal.
- **Backend**: `npm run test:backend` (siempre establece `STRIPE_TEST_DISABLE_SIGNATURE=true` y `ADMIN_MFA_TEST_CODE=123456` para evitar dependencias externas).

## 4. Flags y helpers de test

- `STRIPE_TEST_DISABLE_SIGNATURE=true` → omite verificación HMAC en `POST /api/payments/webhook`.
- `ADMIN_MFA_TEST_CODE` → código fijo (123456 por defecto en no producción) para aprobar MFA admin en E2E.
- `window.__MYWED360_TEST_MODE__ = true` (se inyecta desde `cypress/support/e2e.js`) habilita mocks globales.
- `window.__GUESTS_TEST_API__` → permite resetear fixtures de invitados desde Cypress (ver `useGuests.js`).
- `window.__ENABLE_ONBOARDING_TEST__ = true` → desbloquea rutas internas del wizard de descubrimiento.
- `window.__GAMIFICATION_TEST_SUMMARY__` → devoluciones deterministas en `GamificationService`.
- `WHATSAPP_TEST_MODE=true` (cuando no hay número verificado) deja simular webhooks desde scripts.

Documenta cualquier nuevo flag/mock aquí y en las specs para mantener consistencia.

## 5. Checklist de calidad

### Antes de abrir PR
- `npm run lint`
- `npm run test:unit`
- `npm run validate:i18n`
- `npm run validate:schemas`
- `npm run cypress:run:seating` (smoke)

### Nightly
- `npm run e2e` (toda la matriz Cypress)
- `npm run test:coverage` (unitarias + cobertura)
- `npm run validate:roadmap` (ver sección scripts)
- `npm run check:bundle`

### Cuando tocar externos
- Stripe: `STRIPE_TEST_DISABLE_SIGNATURE=true` + eventos de ejemplo (ver `backend/__tests__/payments-webhook.test.js` o el snippet).
  ```json
  {
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "id": "cs_test_123",
        "currency": "eur",
        "amount_total": 1000,
        "metadata": {
          "contractId": "c1",
          "providerId": "p1",
          "weddingId": "w1"
        }
      }
    }
  }
  ```
- WhatsApp/Twilio: usa fixtures en `cypress/fixtures/whatsapp` y simula con `curl`/Postman apuntando a `POST /api/whatsapp/webhook`.
- Mailgun: `MAILGUN_TEST_MODE=true` o define `MAILGUN_API_KEY` dummy; valida responses en `cypress/e2e/email` y scripts `email-coverage-report.js`.

Mantén esta guía actualizada cuando se añadan suites, scripts o flags para que CI y QA manual sigan rutas homogéneas.
