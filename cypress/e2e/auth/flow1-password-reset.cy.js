/// <reference types="Cypress" />

// Flujo 1: Recuperación y cambio de contraseña (reset)

describe('Flujo 1 - Recuperación de contraseña', () => {
  it('muestra feedback al solicitar restablecimiento', () => {
    cy.visit('/reset-password');

    cy.get('[data-testid="reset-email"]').type('usuario.reset+e2e@lovenda.test');
    cy.get('[data-testid="reset-submit"]').click({ force: true });

    // Debe mostrar algún feedback (éxito o error) en la UI
    cy.get('p.text-green-600, p.text-red-600', { timeout: 8000 }).should('exist');
  });
});
