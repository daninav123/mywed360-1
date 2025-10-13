/// <reference types="Cypress" />

/**
 * Flujo 26 – Blog de tendencias.
 * Escenario: fallback cuando no hay artículos disponibles.
 */
describe('Blog · suscripción a novedades', () => {
  beforeEach(() => {
    cy.window().then((win) => win.localStorage.clear());
    cy.loginToLovenda();
  });

  it('informa al usuario y evita mostrar tarjetas vacías si la API no devuelve artículos', () => {
    cy.mockWeddingNews({}, { defaultBody: [] });

    cy.visit('/blog');

    cy.wait('@weddingNewsRequest').its('request.url').should('include', 'page=1');
    cy.wait('@weddingNewsRequest').its('request.url').should('include', 'page=2');

    cy.contains(
      'No encontramos artículos relevantes en este momento. Intenta cambiar de idioma o vuelve a intentarlo más tarde.',
      { timeout: 12000 }
    ).should('be.visible');

    cy.contains('No hay artículos disponibles todavía.', { matchCase: false }).should('not.exist');
    cy.get('[role="status"]').should('not.exist');
    cy.get('[data-testid="blog-card"]').should('have.length', 0);
  });
});
