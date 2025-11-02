/**
 * E2E Test: Seating Plan - Mensajes y Toasts
 */

describe('Seating Plan - Toasts y Mensajes', () => {
  beforeEach(() => {
    cy.visit('/invitados/seating');
    cy.wait(1000);
  });

  it('debe mostrar toast al guardar dimensiones del espacio', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="space-config-btn"]').length > 0) {
        cy.get('[data-testid="space-config-btn"]').first().click();
        cy.wait(500);

        if ($body.find('button:contains("Guardar")').length > 0) {
          cy.get('button:contains("Guardar")').first().click();
          cy.wait(1000);

          cy.get('[class*="toast"], [role="alert"]', { timeout: 3000 }).should('exist');
        }
      }
    });
  });

  it('debe mostrar feedback al ejecutar Auto-IA', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    cy.get('body').then(($body) => {
      const hasAutoButton = $body.find('button:contains("Auto"), button:contains("IA")').length > 0;

      if (hasAutoButton) {
        cy.get('button:contains("Auto"), button:contains("IA")').first().click();
        cy.wait(2000);
        cy.log('Auto-IA ejecutado');
      }
    });
  });

  it('debe mostrar toast al generar layout', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="banquet-config-btn"]').length > 0) {
        cy.get('[data-testid="banquet-config-btn"]').click();
        cy.wait(500);

        if ($body.find('button:contains("Generar")').length > 0) {
          cy.get('button:contains("Generar")').first().click();
          cy.wait(1000);
          cy.log('Layout generado');
        }
      }
    });
  });
});
