/// <reference types="cypress" />

const loginAndVisitBudget = () => {
  cy.window().then((win) => win.localStorage.clear());
  cy.loginToLovenda();
  cy.visit('/finance');
  cy.closeDiagnostic();
  cy.contains('button', 'Presupuesto', { timeout: 20000 }).click();
};

const addCategory = (name, amount) => {
  cy.contains('button', 'Nueva categoría', { matchCase: false }).click();
  cy.get('[role="dialog"]', { timeout: 10000 }).within(() => {
    cy.get('input[type="text"]').clear().type(name);
    cy.get('input[type="number"]').clear().type(String(amount));
    cy.contains('button', 'Crear Categoría', { matchCase: false }).click();
  });
  cy.contains('h4', name, { timeout: 10000 }).should('exist');
};

describe('Finanzas - Consejero IA conversacional', () => {
  beforeEach(() => {
    loginAndVisitBudget();
  });

  it('abre el modal del consejero y permite solicitar recomendaciones', () => {
    addCategory('Catering', 1000);

    cy.contains('button', 'Abrir consejero').click();
    cy.contains('Consejero IA de presupuesto', { timeout: 10000 }).should('be.visible');
  });
});
