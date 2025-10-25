/// <reference types="Cypress" />

// Flujo 1: Recuperación y cambio de contraseña (reset)

describe('Flujo 1 - Recuperación de contraseña', () => {
  it('muestra feedback al solicitar restablecimiento', () => {
    cy.visit('/reset-password');

    cy.get('[data-testid="reset-email"]').should('be.visible').type('usuario.reset+e2e@lovenda.test');
    cy.get('[data-testid="reset-submit"]').should('be.visible').click({ force: true });

    // Debe mostrar algún feedback (éxito o error) en la UI
    // El componente usa CSS variables, no clases de Tailwind específicas
    cy.get('p[role="status"], p[role="alert"]', { timeout: 8000 }).should('exist').and('be.visible');
  });
});
