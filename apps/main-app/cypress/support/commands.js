/**
 * Comandos personalizados de Cypress
 */

// Comando de login
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/');

  // Si ya está logueado, no hacer nada
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="dashboard"]').length === 0) {
      // Buscar inputs de login
      cy.get('input[type="email"]').type(email);
      cy.get('input[type="password"]').type(password);
      cy.get('button[type="submit"]').click();

      // Esperar a que cargue el dashboard
      cy.url().should('include', '/dashboard', { timeout: 10000 });
    }
  });
});
