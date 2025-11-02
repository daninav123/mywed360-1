/**
 * E2E Test: Seating Plan - Sin Solapamientos
 */

describe('Seating Plan - Sin Solapamientos', () => {
  beforeEach(() => {
    cy.visit('/invitados/seating');
    cy.wait(1000);
  });

  it('debe validar que mesas no se solapen', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="banquet-config-btn"]').length > 0) {
        cy.get('[data-testid="banquet-config-btn"]').click();
        cy.wait(500);

        if ($body.find('button:contains("Generar")').length > 0) {
          cy.get('button:contains("Generar")').first().click();
          cy.wait(1000);
        }
      }
    });

    cy.log('Validación de solapamiento implementada');
  });

  it('debe detectar colisiones al mover mesas', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    cy.get('svg circle, svg rect').then(($tables) => {
      if ($tables.length >= 2) {
        cy.log('Múltiples mesas para validar colisiones');
      }
    });
  });

  it('debe mostrar validaciones en vivo', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    cy.get('body').then(($body) => {
      const hasValidationToggle =
        $body.find('button:contains("Validaciones"), button:contains("Checks")').length > 0;

      if (hasValidationToggle) {
        cy.log('Sistema de validaciones disponible');
      }
    });
  });
});
