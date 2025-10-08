/// <reference types="cypress" />

const loginAndReset = () => {
  cy.window().then((win) => win.localStorage.clear());
  cy.loginToLovenda();
  cy.window().then((win) => win.localStorage.removeItem('lovenda_active_wedding'));
};

const fillNumber = (labelMatcher, value) => {
  cy.contains('label', labelMatcher)
    .parent()
    .find('input[type="number"]')
    .first()
    .clear()
    .type(String(value));
};

describe('Finanzas - Configuración de aportaciones', () => {
  beforeEach(() => {
    loginAndReset();
    cy.visit('/finance');
    cy.contains('button', 'Aportaciones').click();
  });

  it('detecta cambios, guarda aportaciones y actualiza el resumen', () => {
    cy.contains('Tienes cambios sin guardar').should('not.exist');

    fillNumber(/Persona A \(€\)/i, 1500);
    fillNumber(/Persona B \(€\)/i, 800);
    fillNumber(/Persona A \(€\/mes\)/i, 250);
    fillNumber(/Persona B \(€\/mes\)/i, 200);
    fillNumber(/Total extras/i, 400);
    fillNumber(/Regalo estimado por invitado/i, 60);
    fillNumber(/Número de invitados/i, 90);

    cy.contains('Tienes cambios sin guardar').should('exist');
    cy.contains('Guardar Cambios').click();
    cy.contains('Tienes cambios sin guardar').should('not.exist');

    cy.contains('Total inicial')
      .parent()
      .should('contain', '2.300,00');

    cy.contains('Total Esperado')
      .parent()
      .should('contain', '8.400,00');

    fillNumber(/Persona A \(€\)/i, 1200);
    cy.contains('Tienes cambios sin guardar').should('exist');
    cy.contains('Cancelar').click();
    cy.contains('Tienes cambios sin guardar').should('not.exist');
    cy.contains('Total inicial')
      .parent()
      .should('contain', '2.300,00');
  });
});
