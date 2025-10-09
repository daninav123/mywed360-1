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

const rsvpStubState = {};

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Intercepts condicionales para entornos donde el backend remoto no expone endpoints de desarrollo
// (p.ej., /api/rsvp/dev/*). Si BACKEND_BASE_URL apunta al backend en producción, stubear estos
// endpoints para que los E2E no dependan de un servidor dev local.
beforeEach(() => {
  const stubRsvp = (Cypress.env('STUB_RSVP') === true || Cypress.env('STUB_RSVP') === 'true');
  // Aplicar stubs cuando explicitamente se solicite, sin depender del backend
  if (!stubRsvp) return;

  // 1) Asegurar planner (aceptamos 401 en test, pero devolvemos 401 estable)
  cy.intercept('POST', '**/api/rsvp/dev/ensure-planner', (req) => {
    req.reply({ statusCode: 401, body: { error: 'auth-required' } });
  });

  // 2) Crear invitado con token (dev)
  cy.intercept('POST', '**/api/rsvp/dev/create', (req) => {
    const token = `stub-token-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const weddingId = (req.body && req.body.weddingId) || 'test-wedding-reminders';
    const guestId = (req.body && req.body.guestId) || `guest-${Math.floor(Math.random() * 1000)}`;
    const guestName = (req.body && req.body.name) || 'Invitado Cypress';
    rsvpStubState[token] = {
      name: guestName,
      status: 'pending',
      companions: Number(req.body?.companions) || 0,
      allergens: req.body?.allergens || '',
      weddingId,
      guestId,
    };
    req.reply({
      statusCode: 200,
      body: {
        ok: true,
        token,
        link: `${Cypress.config('baseUrl').replace(/\/$/, '')}/rsvp/${token}`,
        weddingId,
        guestId,
      }
    });
  });

  // 3) Consulta pública por token
  cy.intercept('GET', /.*\/api\/rsvp\/by-token\/.+/, (req) => {
    try {
      const url = new URL(req.url);
      const parts = url.pathname.split('/');
      const token = parts[parts.length - 1];
      const data = rsvpStubState[token] || {
        name: 'Invitado Recordatorio',
        status: 'pending',
        companions: 0,
        allergens: '',
      };
      req.reply({
        statusCode: 200,
        body: data,
      });
      return;
    } catch (error) {
      // fall through to default reply
    }
    req.reply({
      statusCode: 200,
      body: { name: 'Invitado Recordatorio', status: 'pending', companions: 0, allergens: '' }
    });
  });

  // 4) Actualizar respuesta pública por token
  cy.intercept('PUT', /.*\/api\/rsvp\/by-token\/.+/, (req) => {
    try {
      const url = new URL(req.url);
      const parts = url.pathname.split('/');
      const token = parts[parts.length - 1];
      const current = rsvpStubState[token] || {
        name: 'Invitado Cypress',
        status: 'pending',
        companions: 0,
        allergens: '',
      };
      const body = req.body || {};
      const updated = {
        ...current,
        status: typeof body.status === 'string' ? body.status : current.status,
        companions:
          typeof body.companions === 'number' ? body.companions : Number(body.companions || current.companions),
        allergens: body.allergens ?? current.allergens,
      };
      rsvpStubState[token] = updated;
      req.reply({ statusCode: 200, body: updated });
    } catch (error) {
      req.reply({ statusCode: 200, body: req.body || {} });
    }
  });

  // 4) Ejecutar recordatorios (dryRun)
  cy.intercept('POST', '**/api/rsvp/reminders', (req) => {
    const weddingId = (req.body && req.body.weddingId) || 'test-wedding-reminders';
    req.reply({
      statusCode: 200,
      body: { ok: true, weddingId, attempted: 3, sent: 0, skipped: 3, errors: [] }
    });
  });
});

// Intercept global para Firestore (opcional: habilitar solo si STUB_FIRESTORE=true)
beforeEach(() => {
  try {
    const stubFs = Cypress.env('STUB_FIRESTORE') === true || Cypress.env('STUB_FIRESTORE') === 'true';
    if (!stubFs) return;
    cy.intercept('POST', '**google.firestore**', (req) => {
      // Responder 200 vacío para estabilizar la UI en tests que no validan persistencia real
      req.reply({ statusCode: 200, body: {} });
    });
  } catch (_) {}
});
