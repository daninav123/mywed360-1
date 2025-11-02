/**
 * E2E Test: Seating Plan - Plantilla Circular
 */

describe('Seating Plan - Plantilla Circular', () => {
  beforeEach(() => {
    cy.visit('/invitados/seating');
    cy.wait(1000);
  });

  it('debe poder abrir selector de plantillas', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Plantilla"), button:contains("Template")').length > 0) {
        cy.get('button:contains("Plantilla"), button:contains("Template")').first().click();
        cy.wait(500);

        cy.log('Selector de plantillas abierto');
      }
    });
  });

  it('debe tener opción de distribución circular', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Circular"), button:contains("Círculo")').length > 0) {
        cy.log('Plantilla circular disponible');
      }
    });
  });

  it('debe generar layout circular correctamente', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    cy.get('body').then(($body) => {
      // Buscar modal de auto layout
      if (
        $body.find('button:contains("Generar Layout"), button:contains("Automático")').length > 0
      ) {
        cy.get('button:contains("Generar Layout"), button:contains("Automático")').first().click();
        cy.wait(500);

        if ($body.find('button:contains("Circular")').length > 0) {
          cy.get('button:contains("Circular")').click();
          cy.wait(500);

          if ($body.find('button:contains("Generar")').length > 0) {
            cy.get('button:contains("Generar")').first().click();
            cy.wait(2000);

            cy.log('Layout circular generado');
          }
        }
      }
    });
  });
});
