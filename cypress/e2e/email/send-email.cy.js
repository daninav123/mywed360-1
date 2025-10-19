describe('Flujo de envío de correo electrónico', () => {
  const testUser = {
    email: 'usuario.test@lovenda.com',
    password: 'contraseña123',
  };

  const testEmail = {
    recipient: 'proveedor@example.com',
    subject: 'Consulta sobre servicios para boda',
    body: 'Hola, estoy interesada en los servicios que ofreces para mi boda. ¿Podrías proporcionarme más información sobre disponibilidad y precios? Gracias.',
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
        profile: {
          id: 'profile123',
          userId: 'user123',
          brideFirstName: 'María',
          brideLastName: 'García',
          groomFirstName: 'Juan',
          groomLastName: 'Pérez',
          weddingDate: '2025-10-15',
          emailAlias: 'maria.juan',
        },
      },
    }).as('loginRequest');

    cy.intercept('POST', '**/api/email/send', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 'email123',
          from: 'maria.juan@lovenda.com',
          to: testEmail.recipient,
          subject: testEmail.subject,
          date: new Date().toISOString(),
          folder: 'sent',
        },
      },
    }).as('sendEmailRequest');

    cy.loginToLovenda(testUser.email, testUser.password);
  });

  it('envía un correo a un proveedor y lo mueve a enviados', () => {
    cy.navigateToEmailInbox();

    cy.get('[data-testid="email-title"]').should('contain', 'Recibidos');
    cy.get('[data-testid="compose-button"]').click();
    cy.get('[data-testid="email-composer"]').should('be.visible');

    cy.get('[data-testid="recipient-input"]').type(testEmail.recipient);
    cy.get('[data-testid="subject-input"]').type(testEmail.subject);
    cy.get('[data-testid="body-editor"]').type(testEmail.body);

    cy.get('[data-testid="send-button"]').click();
    cy.wait('@sendEmailRequest');

    cy.get('[data-testid="success-message"]').should('be.visible').and('contain', 'Correo enviado correctamente');
    cy.url().should('include', '/email/inbox');

    cy.get('[data-testid="folder-item"][data-folder="sent"]').click();
    cy.get('[data-testid="email-list"]').should('contain', testEmail.subject);
  });
});
