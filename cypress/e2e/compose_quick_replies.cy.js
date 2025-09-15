describe('Compose quick replies', () => {
  it('inserts a quick reply into the body', () => {
    cy.visit('/email/compose');
    cy.get('[data-testid="subject-input"]').type('Prueba');
    cy.get('[data-testid="recipient-input"]').type('test@example.com');
    cy.contains('button', 'Gracias por su respuesta').click({ force: true });
    cy.get('[data-testid="email-body-editor"]').invoke('html').should('contain', 'Gracias por su respuesta');
  });
});

