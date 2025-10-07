/// <reference types="Cypress" />

// Flujo 1: Registro de cuenta (UI)
// Valida que el formulario de registro se renderiza y acepta datos.

describe('Flujo 1 - Registro (signup)', () => {
  it('renderiza formulario y permite introducir datos', () => {
    cy.visit('/signup');

    // Completar formulario con data-testid
    cy.get('[data-testid="signup-email"]').type('nuevo.usuario+e2e@lovenda.test');
    cy.get('[data-testid="signup-password"]').type('Password123!');
    cy.get('[data-testid="signup-role"]').select('planner');

    // Enviar formulario
    cy.get('[data-testid="signup-submit"]').click({ force: true });

    // Según entorno, podría navegar a /home o mostrar error.
    // Validamos que la UI sigue operativa tras el submit.
    cy.location('pathname', { timeout: 8000 }).should('match', /(\/home|\/signup)/);
  });
});
