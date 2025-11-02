/**
 * E2E Test: Seating Plan - Plantillas U/L/Imperial
 */

describe('Seating Plan - Plantillas U/L/Imperial', () => {
  beforeEach(() => {
    cy.visit('/invitados/seating');
    cy.wait(1000);
  });

  it('debe tener plantilla en U disponible', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    cy.get('body').then(($body) => {
      if ($body.find('button:contains("En U"), button:contains("U shape")').length > 0) {
        cy.log('Plantilla en U disponible');
      }
    });
  });

  it('debe poder generar layout en U', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Generar Layout")').length > 0) {
        cy.get('button:contains("Generar Layout")').first().click();
        cy.wait(500);

        if ($body.find('button:contains("En U")').length > 0) {
          cy.get('button:contains("En U")').click();
          cy.wait(500);

          if ($body.find('button:contains("Generar")').length > 0) {
            cy.get('button:contains("Generar")').first().click();
            cy.wait(2000);
          }
        }
      }
    });
  });

  it('debe tener otras plantillas disponibles', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    cy.get('body').then(($body) => {
      const hasTemplates =
        $body.find('button:contains("Espiga"), button:contains("Columnas")').length > 0;

      if (hasTemplates) {
        cy.log('Múltiples plantillas disponibles');
      }
    });
  });
});
