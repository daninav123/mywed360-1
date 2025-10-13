describe('Listado de correos en bandeja de entrada', () => {
  const testUser = {
    email: 'usuario.test@lovenda.com',
    password: 'contraseña123',
  };

  const inboxResponse = [
    {
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
    },
    {
      id: 'email2',
      from: 'proveedor2@example.com',
      to: testUser.email,
      subject: 'Disponibilidad para fotografía',
      body: '<p>Gracias por tu interés en nuestros servicios de fotografía. Te confirmo que tenemos disponibilidad para la fecha de tu boda.</p>',
      date: '2025-07-13T10:15:00Z',
      read: true,
      folder: 'inbox',
      attachments: [],
    },
  ];

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
      body: { success: true, data: inboxResponse },
    }).as('getInboxRequest');

    cy.loginToLovenda(testUser.email, testUser.password);
  });

  it('muestra correos y estados de lectura', () => {
    cy.navigateToEmailInbox();
    cy.wait('@getInboxRequest');

    cy.get('[data-testid="email-list-item"]').should('have.length', 2);
    cy.get('[data-testid="email-list-item"].unread').should('have.length', 1);
    cy.get('[data-testid="email-list-item"]').first().within(() => {
      cy.contains('proveedor1@example.com');
      cy.contains('Presupuesto para catering');
      cy.get('[data-testid="attachment-indicator"]').should('exist');
    });
  });
});
