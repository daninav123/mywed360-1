/// <reference types="Cypress" />

const inboxEmails = [
  {
    id: 'mail-100',
    from: 'catering@lovenda.test',
    to: 'owner.mail@lovenda.test',
    subject: 'Presupuesto actualizado de catering',
    date: '2026-05-04T10:15:00Z',
    read: false,
    important: true,
    attachments: [{ name: 'presupuesto.pdf' }],
  },
  {
    id: 'mail-101',
    from: 'decoracion@lovenda.test',
    to: 'owner.mail@lovenda.test',
    subject: 'Ideas de decoración para la ceremonia',
    date: '2026-05-03T18:40:00Z',
    read: true,
    important: false,
    attachments: [],
  },
];

const searchResults = [
  {
    id: 'mail-200',
    from: 'fotografia@lovenda.test',
    to: 'owner.mail@lovenda.test',
    subject: 'Propuesta fotografica premium',
    date: '2026-05-05T09:00:00Z',
    read: false,
    important: false,
    attachments: [],
  },
];

const sentEmails = [
  {
    id: 'mail-300',
    from: 'owner.mail@lovenda.test',
    to: 'planner@lovenda.test',
    subject: 'Envio de contrato firmado',
    date: '2026-05-02T14:25:00Z',
    read: true,
    important: false,
    attachments: [{ name: 'contrato.pdf' }],
  },
];

const okEmpty = { success: true, data: [] };

function stubEmailEndpoints() {
  cy.intercept('GET', '**/api/email/stats**', { statusCode: 200, body: { success: true, data: {} } });
  cy.intercept('GET', '**/api/email-insights/**', { statusCode: 200, body: { tasks: [], meetings: [], budgets: [], contracts: [] } });
  cy.intercept('GET', '**/api/email/alias**', { statusCode: 200, body: { success: true, data: { alias: 'wedding.team@lovenda.test' } } });
  cy.intercept('GET', '**/api/email/templates**', { statusCode: 200, body: okEmpty });
  cy.intercept('GET', '**/api/email/tags**', { statusCode: 200, body: okEmpty });
  cy.intercept('GET', '**/api/email/folders**', { statusCode: 200, body: okEmpty });

  cy.intercept('GET', '**/api/email/inbox**', (req) => {
    req.reply({
      statusCode: 200,
      delay: 160,
      body: { success: true, data: inboxEmails },
    });
  }).as('getInbox');

  cy.intercept('GET', '**/api/email/search**', (req) => {
    const term = new URL(req.url).searchParams.get('q') || '';
    const filtered = term.toLowerCase().includes('foto') ? searchResults : [];
    req.reply({
      statusCode: 200,
      delay: 80,
      body: { success: true, data: filtered },
    });
  }).as('searchEmails');

  cy.intercept('GET', '**/api/email/sent**', {
    statusCode: 200,
    delay: 90,
    body: { success: true, data: sentEmails },
  }).as('getSentFolder');

  cy.intercept('PUT', '**/api/email/**', { statusCode: 200, body: { success: true } }).as('emailPutFallback');
  cy.intercept('POST', '**/api/email/**', { statusCode: 200, body: { success: true } }).as('emailPostFallback');
  cy.intercept('DELETE', '**/api/email/**', { statusCode: 200, body: { success: true } }).as('emailDeleteFallback');
  cy.intercept('GET', '**/api/email/**', (req) => {
    if (req.alias) return;
    req.reply({ statusCode: 200, body: okEmpty });
  }).as('emailGetFallback');
}

describe('Email · comportamiento bajo cargas simuladas', () => {
  beforeEach(() => {
    Cypress.env('STUB_FIRESTORE', true);
    stubEmailEndpoints();
    cy.loginToLovenda('owner.mail@lovenda.test');
  });

  it('carga la bandeja de entrada dentro del presupuesto simulado', () => {
    const start = Date.now();
    cy.navigateToEmailInbox();
    cy.wait('@getInbox');
    cy.then(() => {
      const elapsed = Date.now() - start;
      expect(elapsed).to.be.greaterThan(150);
      expect(elapsed).to.be.lessThan(800);
    });
    cy.get('[data-testid="email-list-item"]').should('have.length', inboxEmails.length);
    cy.get('[data-testid="email-list-item"]').first().within(() => {
      cy.contains('catering@lovenda.test');
      cy.contains('Presupuesto actualizado de catering');
    });
  });

  it('filtra correos usando el endpoint de búsqueda nuevo', () => {
    cy.navigateToEmailInbox();
    cy.wait('@getInbox');

    const start = Date.now();
    cy.get('[data-testid="email-search-input"]', { timeout: 10000 }).type('fotografia');
    cy.wait('@searchEmails');
    cy.then(() => {
      const elapsed = Date.now() - start;
      expect(elapsed).to.be.greaterThan(70);
      expect(elapsed).to.be.lessThan(600);
    });

    cy.get('[data-testid="email-list-item"]').should('have.length', searchResults.length);
    cy.get('[data-testid="email-list-item"]').first().should('contain.text', 'Propuesta fotografica premium');
  });

  it('permite cambiar a la carpeta de enviados y mostrar los correos correspondientes', () => {
    cy.navigateToEmailInbox();
    cy.wait('@getInbox');

    const start = Date.now();
    cy.get('[data-testid="folder-item"][data-folder="sent"]').click();
    cy.wait('@getSentFolder');
    cy.then(() => {
      const elapsed = Date.now() - start;
      expect(elapsed).to.be.greaterThan(80);
      expect(elapsed).to.be.lessThan(700);
    });

    cy.get('[data-testid="email-list-item"]').should('have.length', sentEmails.length);
    cy.get('[data-testid="email-list-item"]').first().within(() => {
      cy.contains('planner@lovenda.test');
      cy.contains('Envio de contrato firmado');
    });
  });
});
