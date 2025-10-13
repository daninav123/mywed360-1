describe('Lectura de un correo', () => {
  const testUser = {
    email: 'usuario.test@lovenda.com',
    password: 'contraseña123',
  };

  const emailDetail = {
    id: 'email1',
    from: 'proveedor1@example.com',
    to: testUser.email,
    subject: 'Presupuesto para catering',
    body: '<p>Adjunto encontrarás el presupuesto para el servicio de catering que solicitaste.</p>',
    date: '2025-07-14T15:30:00Z',
    read: false,
    folder: 'inbox',
    attachments: [
      {
        name: 'presupuesto_catering.pdf',
        type: 'application/pdf',
        size: 512000,
        url: 'https://lovenda.com/attachments/presupuesto_catering.pdf',
      },
    ],
  };

  beforeEach(() => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 'user123', email: testUser.email, name: 'Usuario Test' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    cy.intercept('GET', '**/api/email/inbox', {
      statusCode: 200,
      body: { success: true, data: [emailDetail] },
    }).as('getInboxRequest');

    cy.intercept('GET', '**/api/email/email1', {
      statusCode: 200,
      body: { success: true, data: emailDetail },
    }).as('getEmailRequest');

    cy.intercept('PUT', '**/api/email/*/read', {
      statusCode: 200,
      body: { success: true },
    }).as('markAsReadRequest');

    cy.loginToLovenda(testUser.email, testUser.password);
  });

  it('abre un correo no leído y actualiza su estado', () => {
    cy.navigateToEmailInbox();
    cy.wait('@getInboxRequest');

    cy.get('[data-testid="email-list-item"].unread').first().click();
    cy.wait('@getEmailRequest');
    cy.wait('@markAsReadRequest');

    cy.get('[data-testid="email-detail-from"]').should('contain', 'proveedor1@example.com');
    cy.get('[data-testid="email-detail-subject"]').should('contain', 'Presupuesto para catering');
    cy.get('[data-testid="email-detail-body"]').should('contain', 'presupuesto para el servicio de catering');
  });
});
