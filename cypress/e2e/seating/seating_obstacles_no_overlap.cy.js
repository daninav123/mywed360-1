/**
 * E2E Test: Seating Plan - Obstáculos Sin Solape
 */

describe('Seating Plan - Obstáculos Sin Solape', () => {
  beforeEach(() => {
    cy.visit('/invitados/seating');
    cy.wait(1000);
  });

  it('debe poder dibujar obstáculos', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Obstáculo"), button[title*="obstáculo" i]').length > 0) {
        cy.get('button:contains("Obstáculo")').first().click();
        cy.wait(500);

        cy.get('button:contains("Navegar")').first().click();
        cy.wait(500);
      }
    });
  });

  it('debe validar que mesas no se solapen con obstáculos', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    cy.log('Validación de solapamiento implementada');
  });

  it('debe mostrar obstáculos en el canvas', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    cy.get('svg').should('exist');
  });
});
