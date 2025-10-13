describe('RSVP - Confirmación por token público', () => {
  it('crea invitado dev, visita enlace y confirma asistencia', () => {
    const BASE = Cypress.env('BACKEND_BASE_URL');
    const makeUrl = (p) => `${BASE.replace(/\/$/, '')}${p.startsWith('/') ? p : '/' + p}`;
    // Crear invitado de prueba (solo en desarrollo)
    cy.request({
      method: 'POST',
      url: makeUrl('/api/rsvp/dev/create'),
      headers: { 'user-agent': 'Cypress E2E' },
      failOnStatusCode: false,
      body: {
        weddingId: 'test-e2e',
        name: 'Invitado Cypress',
        phone: '+34600111222',
        email: 'invitado+cypress@example.com',
      },
    }).then((resp) => {
      cy.log(`dev/create status: ${resp.status}`);
      if (resp.status !== 200) {
        cy.log(JSON.stringify(resp.body || {}, null, 2));
      }
      expect(resp.status).to.eq(200);
      const { token, link } = resp.body;
      expect(token).to.be.a('string');
      expect(link).to.contain('/rsvp/');

      // Visitar página pública de confirmación
      cy.visit(link);

      // Esperar carga
      cy.contains('Confirmación de asistencia', { timeout: 10000 }).should('be.visible');

      // Marcar "Sí" y añadir 1 acompañante
      cy.get('input[type="radio"][value="accepted"]').check({ force: true });
      cy.get('input[type="number"]').clear().type('1');
      cy.get('textarea').clear().type('Sin alergias');

      // Enviar
      cy.contains('button', 'Enviar respuesta').click();

      // Validar toast y pantalla de gracias
      cy.contains('¡Respuesta registrada!', { timeout: 10000 }).should('be.visible');
      cy.contains('¡Gracias,', { timeout: 10000 }).should('be.visible');

      // Verificar por API que se guardó como accepted con 1 acompañante
      cy.request({ url: makeUrl(`/api/rsvp/by-token/${token}`), headers: { 'user-agent': 'Cypress E2E' }, failOnStatusCode: false }).then((check) => {
        cy.log(`by-token status: ${check.status}`);
        if (check.status !== 200) {
          cy.log(JSON.stringify(check.body || {}, null, 2));
        }
        expect(check.status).to.eq(200);
        expect(check.body.status).to.eq('accepted');
        expect(check.body.companions).to.eq(1);
      });
    });
  });
});
