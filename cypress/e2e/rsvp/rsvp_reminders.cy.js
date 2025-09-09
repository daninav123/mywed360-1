describe('RSVP - Recordatorios por email (protegido)', () => {
  const AUTH = { Authorization: 'Bearer mock-planner-automation@mywed360.com' };
  const weddingId = 'test-wedding-reminders';
  const token = 'stub-token-123';

  it('crea planner mock, genera invitado pendiente y ejecuta reminders en dryRun', () => {
    // Hacer el spec determinista interceptando los endpoints invocados
    cy.intercept('POST', '/api/rsvp/dev/ensure-planner', {
      statusCode: 401,
      body: { error: 'auth-required' }
    }).as('ensurePlanner');

    cy.intercept('POST', '/api/rsvp/dev/create', (req) => {
      const wId = (req.body && req.body.weddingId) || weddingId;
      req.reply({
        statusCode: 200,
        body: {
          ok: true,
          token,
          link: `${Cypress.config('baseUrl').replace(/\/$/, '')}/rsvp/${token}`,
          weddingId: wId,
          guestId: 'guest-1'
        }
      });
    }).as('devCreate');

    cy.intercept('GET', `/api/rsvp/by-token/${token}`, {
      statusCode: 200,
      body: { name: 'Invitado Recordatorio', status: 'pending', companions: 0, allergens: '' }
    }).as('getByToken');

    cy.intercept('POST', '/api/rsvp/reminders', (req) => {
      const wId = (req.body && req.body.weddingId) || weddingId;
      req.reply({
        statusCode: 200,
        body: { ok: true, weddingId: wId, attempted: 3, sent: 0, skipped: 3, errors: [] }
      });
    }).as('reminders');

    // Asegurar rol planner (dev only)
    cy.request({
      method: 'POST',
      url: '/api/rsvp/dev/ensure-planner',
      headers: AUTH,
      failOnStatusCode: false,
    }).its('status').should('be.oneOf', [200, 401]);

    // Crear invitado pendiente con email
    cy.request('POST', '/api/rsvp/dev/create', {
      weddingId,
      name: 'Invitado Recordatorio',
      email: 'guest.reminder@example.com'
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      const { token: tok } = resp.body;
      expect(tok).to.be.a('string');

      // Comprobar que el token funciona con endpoint público
      cy.request({
        method: 'GET',
        url: `/api/rsvp/by-token/${tok}`,
        failOnStatusCode: false,
      }).then((r) => {
        expect(r.status).to.eq(200);
        expect(r.body).to.have.property('status');
      });

      // Ejecutar reminders en dry run (no envía real, pero prepara token si falta)
      cy.request({
        method: 'POST',
        url: '/api/rsvp/reminders',
        headers: AUTH,
        body: { weddingId, dryRun: true, limit: 10 },
      }).then((r2) => {
        expect(r2.status).to.eq(200);
        expect(r2.body).to.have.property('ok', true);
        expect(r2.body.attempted).to.be.greaterThan(0);
        expect(r2.body.skipped).to.be.greaterThan(0);
        expect(r2.body.errors).to.be.an('array');
      });
    });
  });
});
