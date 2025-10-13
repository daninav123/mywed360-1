/// <reference types="Cypress" />

/**
 * Flujo 24 – Inspiración visual unificada.
 * Escenario: carga de galería, filtros y scroll infinito.
 *
 * TODO: consolidar intercepts (`/api/instagram-wall`, `/api/inspiration/favorites`)
 *       y assertions cuando la vista unificada esté estable.
 */
describe('Inspiración · galería unificada', () => {
  beforeEach(() => {
    cy.loginToLovenda();
    cy.visit('/inspiracion');
  });

  it.skip('aplica filtros de categorías/colores y soporta scroll infinito', () => {
    // TODO: simular `fetchWall` paginado, toggles de tags y verificación de merge.
  });
});

