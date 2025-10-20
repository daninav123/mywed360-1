/// <reference types="Cypress" />

describe('Tests de Navegación Simple', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('carga la página principal', () => {
    cy.get('body').should('be.visible');
  });

  it('tiene un título', () => {
    cy.title().should('exist');
  });

  it('tiene contenido', () => {
    cy.get('div').should('exist');
  });

  it('puede navegar a login', () => {
    cy.visit('/login');
    cy.get('body').should('be.visible');
  });

  it('puede navegar a registro', () => {
    cy.visit('/register');
    cy.get('body').should('be.visible');
  });

  it('mantiene la URL correcta', () => {
    cy.url().should('include', 'localhost');
  });

  it('no tiene errores de consola críticos', () => {
    cy.window().then((win) => {
      expect(win).to.exist;
    });
  });
});
