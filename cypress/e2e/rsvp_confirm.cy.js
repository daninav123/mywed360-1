describe('RSVP confirm flow', () => {
  it('loads guest by token and submits answer', () => {
    cy.intercept('GET', '**/api/rsvp/by-token/*', {
      statusCode: 200,
      body: {
        name: 'Invitado Test',
        status: 'pending',
        companions: 0,
        allergens: ''
      }
    }).as('getGuest');
    cy.intercept('PUT', '**/api/rsvp/by-token/*', { statusCode: 200, body: { ok: true } }).as('putGuest');

    cy.visit('/rsvp/abc123');
    cy.wait('@getGuest');
    // El título puede tener encoding distinto en algunos entornos; comprobamos parcialmente
    cy.contains('Confirm', { matchCase: false }).should('exist');
    cy.contains('Invitado Test').should('exist');
    cy.contains('Enviar respuesta').click();
    cy.wait('@putGuest');
    cy.contains('Gracias', { timeout: 10000 }).should('exist');
  });
});

