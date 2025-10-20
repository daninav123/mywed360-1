/// <reference types="Cypress" />

describe('Tests Básicos de UI', () => {
  it('verifica elementos HTML básicos', () => {
    cy.visit('/');
    cy.get('html').should('exist');
    cy.get('head').should('exist');
    cy.get('body').should('exist');
  });

  it('verifica que hay algún contenedor', () => {
    cy.visit('/');
    cy.get('div').should('have.length.greaterThan', 0);
  });

  it('verifica viewport responsive', () => {
    cy.visit('/');
    cy.viewport(320, 568);
    cy.get('body').should('be.visible');
    cy.viewport(768, 1024);
    cy.get('body').should('be.visible');
    cy.viewport(1920, 1080);
    cy.get('body').should('be.visible');
  });

  it('verifica localStorage disponible', () => {
    cy.visit('/');
    cy.window().then((win) => {
      expect(win.localStorage).to.exist;
    });
  });

  it('verifica sessionStorage disponible', () => {
    cy.visit('/');
    cy.window().then((win) => {
      expect(win.sessionStorage).to.exist;
    });
  });

  it('puede hacer scroll', () => {
    cy.visit('/');
    cy.scrollTo('bottom');
    cy.scrollTo('top');
    cy.get('body').should('be.visible');
  });

  it('puede hacer click en el body', () => {
    cy.visit('/');
    // Hacer click en un punto específico del body
    cy.get('body').click(10, 10, { force: true });
    cy.get('body').should('be.visible');
  });

  it('acepta input de teclado', () => {
    cy.visit('/');
    cy.get('body').type('{esc}');
    cy.get('body').should('be.visible');
  });
});
