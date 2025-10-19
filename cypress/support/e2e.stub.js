// cypress/support/e2e.stub.js
// ------------------------------
// Mantiene todos los intercepts y stubs necesarios para los E2E. Se importa
// explícitamente desde los tests o desde cypress.config cuando se necesita
// comportamiento stub.

import './commands';

const rsvpStubState = {};

export function registerStubbedRsvpRoutes() {
  beforeEach(() => {
    const stubRsvp = Cypress.env('STUB_RSVP') === true || Cypress.env('STUB_RSVP') === 'true';
    if (!stubRsvp) return;

    cy.intercept('POST', '**/api/rsvp/dev/ensure-planner', (req) => {
      req.reply({ statusCode: 401, body: { error: 'auth-required' } });
    });

    cy.intercept('POST', '**/api/rsvp/dev/create', (req) => {
      const token = stub-token-${Date.now()}-${Math.floor(Math.random() * 1000)};
      const weddingId = (req.body && req.body.weddingId) || 'test-wedding-reminders';
      const guestId = (req.body && req.body.guestId) || guest-;
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
          link: ${Cypress.config('baseUrl').replace(/\/$/, '')}/rsvp/,
          weddingId,
          guestId,
        },
      });
    });

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
        req.reply({ statusCode: 200, body: data });
        return;
      } catch (error) {}
      req.reply({ statusCode: 200, body: { name: 'Invitado Recordatorio', status: 'pending', companions: 0, allergens: '' } });
    });

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
          companions: typeof body.companions === 'number' ? body.companions : Number(body.companions || current.companions),
          allergens: body.allergens ?? current.allergens,
        };
        rsvpStubState[token] = updated;
        req.reply({ statusCode: 200, body: updated });
      } catch (error) {
        req.reply({ statusCode: 200, body: req.body || {} });
      }
    });

    cy.intercept('POST', '**/api/rsvp/reminders', (req) => {
      const weddingId = (req.body && req.body.weddingId) || 'test-wedding-reminders';
      req.reply({ statusCode: 200, body: { ok: true, weddingId, attempted: 3, sent: 0, skipped: 3, errors: [] } });
    });
  });
}

export function registerFirestoreStub() {
  beforeEach(() => {
    const stubFs = Cypress.env('STUB_FIRESTORE') === true || Cypress.env('STUB_FIRESTORE') === 'true';
    if (!stubFs) return;
    cy.intercept('POST', '**google.firestore**', (req) => {
      req.reply({ statusCode: 200, body: {} });
    });
  });
}
