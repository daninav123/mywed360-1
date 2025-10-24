/// <reference types="cypress" />

const loginAndReset = () => {
  cy.window().then((win) => win.localStorage.clear());
  cy.loginToLovenda();
  cy.window().then((win) => {
    win.localStorage.removeItem('maloveapp_active_wedding');
    win.localStorage.removeItem('maloveapp_active_wedding');
  });
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

const createTransaction = ({ type = 'expense', concept, amount, category }) => {
  cy.contains('button', 'Nueva Transacción', { matchCase: false }).click();
  cy.get('[role="dialog"]').within(() => {
    if (type === 'income') {
      cy.get('input[type="radio"][value="income"]').check({ force: true });
    }
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
    if (type === 'income') {
      cy.contains('label', 'Estado', { matchCase: false })
        .parent()
        .find('select')
        .select('Recibido');
    }
    cy.contains('button', 'Crear Transacción', { matchCase: false }).click();
  });
  cy.contains(concept).should('exist');
};

describe('Finanzas - Panel de análisis', () => {
  beforeEach(() => {
    loginAndReset();
    cy.visit('/finance');
  });

  it('muestra métricas y gráficas con datos de ingresos y gastos', () => {
    cy.contains('button', 'Presupuesto').click();
    addCategory('Catering', 1200);
    addCategory('Musica', 600);
    addCategory('Regalos', 0);

    cy.contains('button', 'Transacciones').click();
    createTransaction({
      type: 'expense',
      concept: 'Pago catering abril',
      amount: 900,
      category: 'Catering',
    });
    createTransaction({
      type: 'expense',
      concept: 'Reserva DJ',
      amount: 450,
      category: 'Musica',
    });
    createTransaction({
      type: 'income',
      concept: 'Regalo padrinos',
      amount: 2000,
      category: 'Regalo de boda',
    });

    cy.contains('button', 'Análisis').click();
    cy.contains('Análisis Financiero', { timeout: 10000 }).should('be.visible');

    cy.get('svg.recharts-surface', { timeout: 10000 }).its('length').should('be.greaterThan', 0);
    cy.contains('No hay datos suficientes').should('not.exist');

    cy.contains('Mayor Gasto')
      .parent()
      .should('contain', 'Catering')
      .and('contain', '900,00');

    cy.contains('Más Eficiente')
      .parent()
      .should('not.contain', 'No hay datos suficientes');

    cy.contains('Mejor mes')
      .parent()
      .should('not.contain', 'No hay datos suficientes')
      .and('contain', '€');
  });
});
