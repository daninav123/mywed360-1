describe('Validaciones al enviar correo', () => {
  const testUser = {
    email: 'usuario.test@lovenda.com',
    password: 'contraseña123',
  };

  const testEmail = {
    subject: 'Consulta incompleta',
    body: 'Falta destinatario en este correo.',
  };

  beforeEach(() => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        user: {
          id: 'user123',
          email: testUser.email,
          name: 'Usuario Test',
        },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    cy.loginToLovenda(testUser.email, testUser.password);
  });

  it('alerta cuando falta el destinatario', () => {
    cy.navigateToEmailInbox();

    cy.get('[data-testid="compose-button"]').click();
    cy.get('[data-testid="email-composer"]').should('be.visible');

    cy.get('[data-testid="subject-input"]').type(testEmail.subject);
    cy.get('[data-testid="body-editor"]').type(testEmail.body);
    cy.get('[data-testid="send-button"]').click();

    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'El destinatario es obligatorio');
    cy.get('[data-testid="email-composer"]').should('be.visible');
  });
});
