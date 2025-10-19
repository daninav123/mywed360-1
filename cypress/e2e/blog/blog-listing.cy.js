/// <reference types="Cypress" />

/**
 * Flujo 26 – Blog de tendencias.
 * Escenario: listado, paginación e incorporación progresiva de resultados.
 */
describe('Blog · listado y filtros', () => {
  beforeEach(() => {
    cy.window().then((win) => win.localStorage.clear());
    cy.loginToLovenda();
  });

  it('muestra el listado paginado y carga más artículos al llegar al final', () => {
    cy.fixture('blog/articles-page1.json').then((page1) => {
      cy.fixture('blog/articles-page2.json').then((page2) => {
        const visiblePage1 = page1.filter((post) => Boolean(post.image) && /^https?:\/\//i.test(post.image));
        const visiblePage2 = page2.filter((post) => Boolean(post.image) && /^https?:\/\//i.test(post.image));

        cy.mockWeddingNews({
          1: page1,
          2: page2,
          default: [],
        });

        cy.visit('/blog');

        cy.wait('@weddingNewsRequest').its('request.url').should('include', 'page=1');

        cy.get('[data-testid="blog-card"]').should('have.length', visiblePage1.length);

        cy.scrollTo('bottom');

        cy.wait('@weddingNewsRequest').its('request.url').should('include', 'page=2');

        cy.contains('[data-testid="blog-card"] h2', 'Guía rápida para bodas destino en la playa', {
          timeout: 10000,
        }).should('be.visible');

        cy.get('[data-testid="blog-card"]').should(
          'have.length.at.least',
          visiblePage1.length + visiblePage2.length
        );

        cy.get('[data-testid="blog-card"]').then(($cards) => {
          const sameDomain = [...$cards].filter((card) =>
            card.textContent.toLowerCase().includes('prensa-nupcial.com')
          ).length;
          expect(sameDomain).to.be.at.most(3);
        });
      });
    });
  });
});
