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

    // Esperar a que cargue la UI
    cy.get('[data-testid="email-title"]', { timeout: 10000 }).should('be.visible');
    
    // Click en compose button
    cy.get('[data-testid="compose-button"]').first().click();
    
    // Esperar a que aparezca el composer
    cy.get('[data-testid="email-composer"]', { timeout: 5000 }).should('be.visible');

    cy.get('[data-testid="recipient-input"]').type(testEmail.recipient);
    cy.get('[data-testid="subject-input"]').type(testEmail.subject);
    cy.get('[data-testid="body-editor"]').type(testEmail.body);

    cy.get('[data-testid="send-button"]').click();
    cy.wait('@sendEmailRequest');

    // Mensaje de éxito puede tardar un poco
    cy.get('[data-testid="success-message"]', { timeout: 5000 })
      .should('be.visible')
      .and('contain.text', 'correctamente');
    
    // URL puede ser /email o /email/inbox
    cy.url().should('match', /\/email/);

    // Navegar a carpeta enviados
    cy.get('[data-testid="folder-item"][data-folder="sent"]', { timeout: 5000 })
      .should('be.visible')
      .click();
    
    // Verificar que el email aparece en la lista
    cy.get('[data-testid="email-list"]', { timeout: 5000 })
      .should('be.visible')
      .and('contain.text', testEmail.subject);
  });
});
