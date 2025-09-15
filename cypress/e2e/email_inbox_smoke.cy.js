describe('Email inbox smoke', () => {
  it('renders inbox list with stubbed emails', () => {
    cy.intercept('GET', '**/api/mail*', {
      statusCode: 200,
      body: [
        {
          id: 'e1',
          subject: 'Asunto de prueba',
          from: 'proveedor@test.com',
          date: new Date().toISOString(),
          folder: 'inbox',
          read: false,
          body: 'Contenido',
        },
      ],
    }).as('getMail');
    cy.visit('/email');
    cy.wait('@getMail');
    cy.contains('Asunto de prueba', { timeout: 10000 }).should('exist');
  });
});

