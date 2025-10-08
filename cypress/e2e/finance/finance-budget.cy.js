/// <reference types="cypress" />

const loginAndReset = () => {
  cy.window().then((win) => win.localStorage.clear());
  cy.loginToLovenda();
  cy.window().then((win) => win.localStorage.removeItem('lovenda_active_wedding'));
};

const addCategory = (name, amount) => {
  cy.contains('button', 'Nueva categoría', { matchCase: false }).click();
  cy.get('[role="dialog"]').within(() => {
    cy.get('input[type="text"]').clear().type(name);
    cy.get('input[type="number"]').clear().type(String(amount));
    cy.contains('button', 'Crear Categoría', { matchCase: false }).click();
  });
  cy.contains('h4', name, { timeout: 8000 }).should('exist');
};

const createExpense = ({ concept, amount, category, dueDate }) => {
  cy.contains('button', 'Nueva Transacción', { matchCase: false }).click();
  cy.get('[role="dialog"]').within(() => {
    cy.contains('label', 'Concepto', { matchCase: false })
      .parent()
      .find('input')
      .clear()
      .type(concept);

    cy.contains('label', 'Monto', { matchCase: false })
      .parent()
      .find('input[type="number"]')
      .clear()
      .type(String(amount));

    cy.contains('label', 'Categoria', { matchCase: false })
      .parent()
      .find('select')
      .select(category);

    if (dueDate) {
      cy.contains('label', 'Fecha limite', { matchCase: false })
        .parent()
        .find('input[type="date"]')
        .clear()
        .type(dueDate);
    }

    cy.contains('button', 'Crear Transacción', { matchCase: false }).click();
  });

  cy.contains(concept).should('exist');
};

describe('Finanzas - Gestión de presupuesto', () => {
  beforeEach(() => {
    loginAndReset();
    cy.visit('/finance');
  });

  it('crea categorías, detecta sobrepresupuesto y permite silenciar alertas', () => {
    cy.contains('button', 'Presupuesto').click();

    addCategory('Catering', 1000);
    addCategory('Flores', 400);

    cy.contains('button', 'Transacciones').click();
    createExpense({
      concept: 'Pago Catering Deluxe',
      amount: 1200,
      category: 'Catering',
      dueDate: '2025-01-15',
    });

    cy.contains('button', 'Presupuesto').click();
    cy.contains('h4', 'Catering')
      .closest('div.p-6')
      .within(() => {
        cy.contains('Excedido').should('be.visible');
        cy.contains('Silenciar alertas')
          .find('input[type="checkbox"]')
          .check({ force: true });
      });

    cy.contains('button', 'Resumen').click();
    cy.contains('Alertas de Presupuesto').should('contain', 'Catering');

    cy.contains('button', 'Presupuesto').click();
    cy.contains('h4', 'Catering')
      .closest('div.p-6')
      .find('input[type="checkbox"]')
      .should('be.checked');

    cy.contains('button', 'Resumen').click();
    cy.contains('Alertas de Presupuesto').should('not.contain', 'Catering');
  });
});
