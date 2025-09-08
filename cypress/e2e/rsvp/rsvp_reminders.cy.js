describe('RSVP - Recordatorios por email (protegido)', () => {
  const AUTH = { Authorization: 'Bearer mock-planner-automation@mywed360.com' };
  const weddingId = 'test-wedding-reminders';

  it('crea planner mock, genera invitado pendiente y ejecuta reminders en dryRun', () => {
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
      const { token } = resp.body;
      expect(token).to.be.a('string');

      // Comprobar que el token funciona con endpoint público
      cy.request({
        method: 'GET',
        url: `/api/rsvp/by-token/${token}`,
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
