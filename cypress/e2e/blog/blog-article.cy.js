/// <reference types="Cypress" />

/**
 * Flujo 26 – Blog de tendencias.
 * Escenario: lectura de artículo completo desde la landing.
 */
describe('Blog · detalle de artículo', () => {
  const arrangeNews = () =>
    cy.fixture('blog/articles-page1.json').then((page1) => {
      cy.wrap(page1.filter((post) => Boolean(post.image) && /^https?:\/\//i.test(post.image))).as('visibleArticles');
      cy.mockWeddingNews({ 1: page1, default: [] });
    });

  beforeEach(() => {
    cy.window().then((win) => win.localStorage.clear());
    cy.loginToLovenda();
  });

  it('abre un artículo y muestra contenido completo con CTA a proveedores', () => {
    arrangeNews();

    cy.visit('/blog');
    cy.wait('@weddingNewsRequest');

    cy.get('@visibleArticles').then((visibleArticles) => {
      cy.get('[data-testid="blog-card"]').should('have.length', visibleArticles.length);
    });

    cy.contains('[data-testid="blog-card"] h2', 'Cómo planificar una boda íntima perfecta').should('be.visible');
    cy.contains('[data-testid="blog-card"] span', 'prensa-nupcial.com').should('be.visible');

    cy.get('[data-testid="blog-card"]')
      .first()
      .within(() => {
        cy.contains('Abrir artículo').should('be.visible');
      });

    cy.window().then((win) => {
      cy.stub(win, 'open').as('windowOpen');
    });

    cy.get('[data-testid="blog-card"]').first().click();

    cy.get('@windowOpen')
      .should('have.been.calledOnce')
      .and(
        'have.been.calledWith',
        'https://prensa-nupcial.com/articulo/planificar-boda-intima',
        '_blank',
        'noopener,noreferrer'
      );
  });
});
