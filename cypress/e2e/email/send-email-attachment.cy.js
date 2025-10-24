describe('Adjuntos en envío de correo', () => {
  const testUser = {
    email: 'usuario.test@maloveapp.com',
    password: 'contraseña123',
  };

  beforeEach(() => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 'user123', email: testUser.email, name: 'Usuario Test' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    cy.intercept('POST', '**/api/upload', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          url: 'https://lovenda.com/uploads/fake-file.pdf',
          name: 'presupuesto.pdf',
          size: 1024 * 1024,
          type: 'application/pdf',
        },
      },
    }).as('fileUpload');

    cy.intercept('POST', '**/api/email/send', {
      statusCode: 200,
      body: { success: true },
    }).as('sendEmailRequest');

    cy.loginToLovenda(testUser.email, testUser.password);
  });

  it('adjunta un archivo y completa el envío', () => {
    cy.navigateToEmailInbox();
    cy.get('[data-testid="compose-button"]').click();

    cy.get('[data-testid="recipient-input"]').type('proveedor@example.com');
    cy.get('[data-testid="subject-input"]').type('Correo con adjunto');
    cy.get('[data-testid="body-editor"]').type('Por favor, revisa el archivo adjunto.');

    cy.get('[data-testid="attachment-input"]').attachFile({
      fileContent: 'test',
      fileName: 'presupuesto.pdf',
      mimeType: 'application/pdf',
    });

    cy.wait('@fileUpload');
    cy.get('[data-testid="attachment-list"]').should('contain', 'presupuesto.pdf');

    cy.get('[data-testid="send-button"]').click();
    cy.wait('@sendEmailRequest');
    cy.get('[data-testid="success-message"]').should('be.visible');
  });
});
