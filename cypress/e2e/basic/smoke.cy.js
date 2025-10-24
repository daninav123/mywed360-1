/// <reference types="Cypress" />

describe('Smoke Tests Básicos', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('carga la página principal', () => {
    cy.get('body').should('be.visible');
    cy.contains(/MaLoveApp|Lovenda|Boda/i).should('exist');
  });

  it('puede navegar al login', () => {
    cy.visit('/login');
    cy.wait(1000);
    cy.get('body').should('be.visible');
  });

  it('puede hacer login básico', () => {
    cy.loginToLovenda('test@example.com');
    cy.visit('/home');
    cy.wait(2000);
    cy.get('body').should('be.visible');
  });
});
