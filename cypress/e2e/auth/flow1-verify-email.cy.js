/// <reference types="Cypress" />

// Flujo 1: Verificación de email (pantalla de ayuda)

describe('Flujo 1 - Verificación de email', () => {
  beforeEach(() => {
    cy.window().then((win) => win.localStorage.clear());
    cy.loginToLovenda('usuario.verify+e2e@lovenda.test');
  });

  it('permite reenviar verificación y muestra feedback', () => {
    cy.visit('/verify-email');

    cy.contains('h2', /verifica tu email/i).should('be.visible');
    cy.get('[data-testid="resend-verification"]').click({ force: true });

    // Debe mostrar algún feedback (éxito o error) en la UI
    cy.get('p.text-green-600, p.text-red-600', { timeout: 8000 }).should('exist');

    cy.get('[data-testid="refresh-verification"]').click({ force: true });
  });
});

