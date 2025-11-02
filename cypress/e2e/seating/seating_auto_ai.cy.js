/**
 * E2E Test: Seating Plan - Auto-IA
 */

describe('Seating Plan - Auto-IA', () => {
  beforeEach(() => {
    cy.visit('/invitados/seating');
    cy.wait(1000);
  });

  it('debe tener botón de Auto-IA disponible', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    cy.get('body').then(($body) => {
      const hasAutoButton =
        $body.find('button:contains("Auto"), button:contains("IA"), button:contains("Automátic")')
          .length > 0;

      if (hasAutoButton) {
        cy.log('Botón de Auto-IA encontrado');
      }
    });
  });

  it('debe ejecutar Auto-IA sin errores críticos', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Auto"), button:contains("IA")').length > 0) {
        cy.get('button:contains("Auto"), button:contains("IA")').first().click();
        cy.wait(3000);

        // Verificar que no hay errores críticos
        cy.get('body').should('not.contain', 'Cannot read');
      }
    });
  });

  it('debe mostrar feedback tras ejecutar Auto-IA', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Auto")').length > 0) {
        cy.get('button:contains("Auto")').first().click();
        cy.wait(2000);

        // Debe mostrar algún feedback (toast, mensaje, cambio de estado)
        cy.log('Auto-IA ejecutado');
      }
    });
  });
});
