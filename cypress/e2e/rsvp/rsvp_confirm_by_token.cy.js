describe('RSVP - Confirmación por token público', () => {
  it('crea invitado dev, visita enlace y confirma asistencia', () => {
    // Crear invitado de prueba (solo en desarrollo)
    cy.request('POST', '/api/rsvp/dev/create', {
      weddingId: 'test-e2e',
      name: 'Invitado Cypress',
      phone: '+34600111222',
      email: 'invitado+cypress@example.com'
    }).then((resp) => {
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
      cy.request(`/api/rsvp/by-token/${token}`).then((check) => {
        expect(check.status).to.eq(200);
        expect(check.body.status).to.eq('accepted');
        expect(check.body.companions).to.eq(1);
      });
    });
  });
});
