describe('Estado leído/no leído en bandeja', () => {
  const testUser = {
    email: 'usuario.test@maloveapp.com',
    password: 'contraseña123',
  };

  const inboxInitial = [
    { id: 'email1', from: 'proveedor1@example.com', to: testUser.email, subject: 'Presupuesto', body: 'Contenido', date: '2025-07-14T15:30:00Z', read: false, folder: 'inbox', attachments: [] },
    { id: 'email2', from: 'proveedor2@example.com', to: testUser.email, subject: 'Disponibilidad', body: 'Contenido', date: '2025-07-13T10:15:00Z', read: true, folder: 'inbox', attachments: [] },
  ];

  const inboxAfterRead = [
    { ...inboxInitial[0], read: true },
    inboxInitial[1],
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
      body: { success: true, data: inboxInitial },
    }).as('getInboxRequest');

    cy.intercept('GET', '**/api/email/email1', {
      statusCode: 200,
      body: { success: true, data: inboxInitial[0] },
    }).as('getEmailRequest');

    cy.intercept('PUT', '**/api/email/*/read', {
      statusCode: 200,
      body: { success: true },
    }).as('markAsReadRequest');

    cy.loginToLovenda(testUser.email, testUser.password);
  });

  it('actualiza contadores después de leer un correo', () => {
    cy.navigateToEmailInbox();
    cy.wait('@getInboxRequest');

    cy.get('[data-testid="email-list-item"].unread').should('have.length', 1);
    cy.get('[data-testid="unread-counter"]').should('contain', '1');

    cy.get('[data-testid="email-list-item"].unread').first().click();
    cy.wait('@getEmailRequest');
    cy.wait('@markAsReadRequest');

    cy.intercept('GET', '**/api/email/inbox', {
      statusCode: 200,
      body: { success: true, data: inboxAfterRead },
    }).as('getUpdatedInboxRequest');

    cy.get('[data-testid="back-to-inbox-button"]').click();
    cy.wait('@getUpdatedInboxRequest');

    cy.get('[data-testid="email-list-item"].unread').should('have.length', 0);
    cy.get('[data-testid="unread-counter"]').should('contain', '0');
  });
});