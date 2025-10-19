/// <reference types="Cypress" />

// Flujo 21: Noticias del Sector
// - Interceptar NewsAPI y renderizar artículos
// - Scroll infinito añade más artículos

describe('Flujo 21 - Noticias del Sector (Blog)', () => {
  beforeEach(() => {
    cy.window().then((win) => win.localStorage.clear());
    cy.loginToLovenda();
  });

  it('carga artículos de noticias y añade más al hacer scroll', () => {
    const makeBatch = (prefix) =>
      Array.from({ length: 10 }).map((_, i) => ({
        id: `${prefix}-${i + 1}`,
        title: `${prefix === 'main' ? 'Titular boda' : 'Titular boda extra'} ${i + 1}`,
        description: `${prefix === 'main' ? 'Descripción boda' : 'Descripción boda extra'} ${i + 1}`,
        url: `https://medio${prefix === 'main' ? '' : '-extra'}${i + 1}.demo/${prefix}-${i + 1}`,
        image: `https://imagenes.ejemplo.com/${prefix}-${i + 1}.jpg`,
        source: prefix === 'main' ? 'Fuente Demo' : 'Fuente Demo 2',
        published: new Date().toISOString()
      }));

    const callCounts = { total: 0 };

    cy.intercept('GET', '**/api/wedding-news*', (req) => {
      callCounts.total += 1;
      const page = Number(req.query.page || '1');
      const body = page === 1 ? makeBatch('main') : makeBatch('extra');
      req.reply({ statusCode: 200, body });
    }).as('weddingNews');

    cy.visit('/blog', {
      onBeforeLoad(win) {
        let triggers = 0;
        const OriginalIO = win.IntersectionObserver;
        win.IntersectionObserver = class {
          constructor(cb) {
            this.cb = cb;
          }
          observe() {
            if (triggers < 1) {
              triggers += 1;
              setTimeout(() => this.cb([{ isIntersecting: true }]), 0);
            }
          }
          disconnect() {}
          unobserve() {}
          takeRecords() {
            return [];
          }
        };
        win.__OriginalIO__ = OriginalIO;
      }
    });
    cy.wait('@weddingNews').its('request.url').should('include', 'page=1');

    // Debe renderizar 10 artículos
    cy.contains('h2', 'Titular boda 1', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="blog-card"]').should('have.length', 10);

    cy.wait('@weddingNews', { timeout: 10000 });

    // Debe haber más tarjetas tras cargar la siguiente página
    cy.get('[data-testid="blog-card"]', { timeout: 10000 }).should('have.length', 20);
    cy.wrap(null).then(() => {
      expect(callCounts.total).to.be.greaterThan(1);
    });
  });
});
