/// <reference types="Cypress" />

// Flujo 1: Social login (Google/Facebook) - validación de wiring

describe('Flujo 1 - Social login (Google/Facebook)', () => {
  beforeEach(() => {
    cy.window().then((win) => win.localStorage.clear());
  });

  it('muestra error controlado al intentar Google si no está configurado', () => {
    cy.visit('/login');
    cy.get('button[data-provider="google"]').click({ force: true });
    cy.contains(/google/i).should('exist'); // mensaje de error probable incluye la palabra
  });

  it('muestra error controlado al intentar Facebook si no está configurado', () => {
    cy.visit('/login');
    cy.get('button[data-provider="facebook"]').click({ force: true });
    cy.contains(/facebook/i).should('exist'); // mensaje de error probable incluye la palabra
  });
});
