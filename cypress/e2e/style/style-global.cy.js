/// <reference types="cypress" />

describe('Perfil - edición de estilo global', () => {
  beforeEach(() => {
    cy.window().then((win) => win.localStorage.clear());
    cy.loginToLovenda('planner.style@test.com');
    cy.visit('/perfil');
    cy.closeDiagnostic();
  });

  const typeInField = (label, value) => {
    cy.contains('label', label, { matchCase: false })
      .should('be.visible')
      .parent()
      .find('input,textarea')
      .first()
      .clear()
      .type(value, { delay: 0 });
  };

  it('permite guardar estilo y paleta de colores', () => {
    typeInField('Estilo de la boda', 'Gourmet premium con acentos art déco');
    typeInField('Paleta de colores', 'Granate, dorado, blanco marfil');

    cy.contains('label', 'Estilo de la boda', { matchCase: false })
      .parent()
      .find('input')
      .should('have.value', 'Gourmet premium con acentos art déco');

    cy.contains('label', 'Paleta de colores', { matchCase: false })
      .parent()
      .find('input')
      .should('have.value', 'Granate, dorado, blanco marfil');
  });
});
