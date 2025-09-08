// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Intercepts condicionales para entornos donde el backend remoto no expone endpoints de desarrollo
// (p.ej., /api/rsvp/dev/*). Si BACKEND_BASE_URL apunta al backend en producción, stubear estos
// endpoints para que los E2E no dependan de un servidor dev local.
beforeEach(() => {
  const backend = Cypress.env('BACKEND_BASE_URL') || '';
  const isProdBackend = /onrender\.com/i.test(backend);
  if (!isProdBackend) return;

  // 1) Asegurar planner (aceptamos 401 en test, pero devolvemos 401 estable)
  cy.intercept('POST', '/api/rsvp/dev/ensure-planner', (req) => {
    req.reply({ statusCode: 401, body: { error: 'auth-required' } });
  });

  // 2) Crear invitado con token (dev)
  cy.intercept('POST', '/api/rsvp/dev/create', (req) => {
    const token = 'stub-token-123';
    const weddingId = (req.body && req.body.weddingId) || 'test-wedding-reminders';
    req.reply({
      statusCode: 200,
      body: {
        ok: true,
        token,
        link: `${Cypress.config('baseUrl').replace(/\/$/, '')}/rsvp/${token}`,
        weddingId,
        guestId: 'guest-1'
      }
    });
  });

  // 3) Consulta pública por token
  cy.intercept('GET', /\/api\/rsvp\/by-token\/.+/, (req) => {
    req.reply({
      statusCode: 200,
      body: { name: 'Invitado Recordatorio', status: 'pending', companions: 0, allergens: '' }
    });
  });

  // 4) Ejecutar recordatorios (dryRun)
  cy.intercept('POST', '/api/rsvp/reminders', (req) => {
    const weddingId = (req.body && req.body.weddingId) || 'test-wedding-reminders';
    req.reply({
      statusCode: 200,
      body: { ok: true, weddingId, attempted: 3, sent: 0, skipped: 3, errors: [] }
    });
  });
});
