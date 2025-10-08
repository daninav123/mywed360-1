/// <reference types="cypress" />

const loginAndReset = () => {
  cy.window().then((win) => win.localStorage.clear());
  cy.loginToLovenda();
  cy.window().then((win) => win.localStorage.removeItem('lovenda_active_wedding'));
};

const stubEmailInsights = () => {
  const mailId = 'mail-transaction-1';

  cy.intercept('GET', '**/api/mail/page**', {
    statusCode: 200,
    body: {
      items: [
        {
          id: mailId,
          subject: 'Factura DJ Groove',
          date: '2025-04-20T18:00:00Z',
          from: 'facturas@djgroove.test',
          to: 'usuario.test@lovenda.com',
        },
      ],
    },
  }).as('mailPage');

  cy.intercept('GET', `**/api/email-insights/${mailId}**`, {
    statusCode: 200,
    body: {
      payments: [
        {
          amount: '850,00 €',
          currency: 'EUR',
          direction: 'outgoing',
          method: 'transfer',
        },
      ],
    },
  }).as('mailInsight');

  cy.intercept('POST', '**/api/email-insights/reanalyze/**', {
    statusCode: 200,
    body: { payments: [] },
  }).as('mailReanalyze');
};

const createIncome = () => {
  cy.contains('button', 'Nueva Transacción', { matchCase: false }).click();
  cy.get('[role="dialog"]').within(() => {
    cy.get('input[type="radio"][value="income"]').check({ force: true });
    cy.contains('label', 'Concepto', { matchCase: false })
      .parent()
      .find('input')
      .clear()
      .type('Regalo padrinos');
    cy.contains('label', 'Monto', { matchCase: false })
      .parent()
      .find('input[type="number"]')
      .clear()
      .type('500');
    cy.contains('label', 'Categoria', { matchCase: false })
      .parent()
      .find('select')
      .select('Regalo de boda');
    cy.contains('label', 'Estado', { matchCase: false })
      .parent()
      .find('select')
      .select('Recibido');
    cy.contains('button', 'Crear Transacción', { matchCase: false }).click();
  });
  cy.contains('Regalo padrinos').should('exist');
};

describe('Finanzas - Transacciones y sugerencias', () => {
  beforeEach(() => {
    loginAndReset();
    stubEmailInsights();
    cy.visit('/finance');
    cy.contains('button', 'Transacciones').click();
    cy.wait('@mailPage');
    cy.wait('@mailInsight');
  });

  it('registra una sugerencia desde email y crea una transacción manual', () => {
    cy.contains('Conecta tu banco para importar movimientos').should('be.visible');
    cy.contains('a', 'Conectar banco').should('have.attr', 'href', '/finance/bank-connect');

    cy.contains('div', 'Sugerencias de pago desde emails').within(() => {
      cy.contains('Factura DJ Groove').should('exist');
      cy.contains('button', 'Registrar').click();
    });

    cy.get('[role="dialog"]').within(() => {
      cy.contains('label', 'Categoria', { matchCase: false })
        .parent()
        .find('select')
        .select('Musica');
      cy.contains('label', 'Fecha limite', { matchCase: false })
        .parent()
        .find('input[type="date"]')
        .clear()
        .type('2025-05-10');
      cy.contains('button', 'Crear Transacción', { matchCase: false }).click();
    });

    cy.contains('Transacciones registradas desde emails')
      .parent()
      .within(() => {
        cy.contains('Factura DJ Groove').should('exist');
        cy.contains('850,00').should('exist');
      });

    createIncome();

    cy.contains('select', 'Todos los tipos').select('Ingresos');
    cy.contains('Regalo padrinos').should('exist');

    cy.contains('select', 'Todas las categorías', { matchCase: false }).select('Musica');
    cy.contains('Factura DJ Groove').should('exist');
  });
});
