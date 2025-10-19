/// <reference types="Cypress" />

const inboxEmails = [
  {
    id: 'mail-001',
    from: 'catering@lovenda.test',
    to: 'owner@mail.lovenda.test',
    subject: 'Presupuesto actualizado',
    date: '2026-05-04T09:30:00Z',
    read: false,
    important: true,
    attachments: [{ name: 'presupuesto.pdf' }],
    body: '<p>Detalle del presupuesto actualizado.</p>',
  },
  {
    id: 'mail-002',
    from: 'decoracion@lovenda.test',
    to: 'owner@mail.lovenda.test',
    subject: 'Referencia de decoracion',
    date: '2026-05-03T18:10:00Z',
    read: true,
    important: false,
    attachments: [],
    body: '<p>Ideas de decoracion para la ceremonia.</p>',
  },
];

function stubEmailApis(responseEmails = inboxEmails) {
  cy.intercept('GET', '**/api/email/stats**', { statusCode: 200, body: { success: true, data: {} } });
  cy.intercept('GET', '**/api/email/alias**', { statusCode: 200, body: { success: true, data: { alias: 'owner@mail.lovenda.test' } } });
  cy.intercept('GET', '**/api/email/templates**', { statusCode: 200, body: { success: true, data: [] } });
  cy.intercept('GET', '**/api/email/tags**', { statusCode: 200, body: { success: true, data: [] } });
  cy.intercept('GET', '**/api/email/folders**', { statusCode: 200, body: { success: true, data: [] } });
  cy.intercept('GET', '**/api/email/inbox**', {
    statusCode: 200,
    body: { success: true, data: responseEmails },
  }).as('getInbox');
  responseEmails.forEach((mail) => {
    cy.intercept('GET', `**/api/email/${mail.id}`, {
      statusCode: 200,
      body: { success: true, data: { ...mail, html: mail.body } },
    }).as(`getMail-${mail.id}`);
  });
  cy.intercept('POST', '**/api/email/**', { statusCode: 200, body: { success: true } });
  cy.intercept('PUT', '**/api/email/**', { statusCode: 200, body: { success: true } });
  cy.intercept('DELETE', '**/api/email/**', { statusCode: 200, body: { success: true } });
  cy.intercept('GET', '**/api/email-insights/**', { statusCode: 200, body: { tasks: [], meetings: [], budgets: [], contracts: [] } });
}

describe('Email · inbox comportamientos base', () => {
  beforeEach(() => {
    Cypress.env('STUB_FIRESTORE', true);
    stubEmailApis();
    cy.loginToLovenda('owner@mail.lovenda.test');
    cy.navigateToEmailInbox();
    cy.wait('@getInbox');
  });

  it('resalta correos no leidos y muestra metadatos clave', () => {
    cy.get('[data-testid="email-list-item"]').should('have.length', inboxEmails.length);

    cy.get('[data-testid="email-list-item"]').first().as('firstEmail');
    cy.get('@firstEmail')
      .invoke('attr', 'class')
      .should('contain', 'font-medium');
    cy.get('@firstEmail').within(() => {
      cy.contains('catering@lovenda.test');
      cy.contains('Presupuesto actualizado');
    });

    cy.get('[data-testid="email-list-item"]').eq(1).as('secondEmail');
    cy.get('@secondEmail')
      .invoke('attr', 'class')
      .should('not.contain', 'font-medium');
    cy.get('@secondEmail').within(() => {
      cy.contains('decoracion@lovenda.test');
      cy.contains('Referencia de decoracion');
    });
  });

  it('abre un correo y renderiza el detalle en el panel', () => {
    cy.get('[data-testid="email-list-item"]').first().click();
    cy.wait('@getMail-mail-001');

    cy.contains('button', 'Responder', { timeout: 10000 }).should('be.visible');
    cy.contains('Presupuesto actualizado', { timeout: 10000 }).should('be.visible');
    cy.contains('Detalle del presupuesto actualizado.').should('be.visible');
  });
});

describe('Email · estados vacios de inbox', () => {
  beforeEach(() => {
    Cypress.env('STUB_FIRESTORE', true);
    stubEmailApis([]);
    cy.loginToLovenda('owner@mail.lovenda.test');
    cy.navigateToEmailInbox();
    cy.wait('@getInbox');
  });

  it('muestra mensaje de carpeta vacia cuando no hay correos', () => {
    cy.get('[data-testid="empty-folder-message"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain.text', 'No hay emails');
  });
});
