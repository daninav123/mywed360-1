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
    // Primer page (NewsAPI)
    cy.intercept('GET', 'https://newsapi.org/v2/everything*', {
      statusCode: 200,
      body: {
        articles: Array.from({ length: 10 }).map((_, i) => ({
          title: `Titular boda ${i + 1}`,
          description: `Descripción boda ${i + 1}`,
          url: `https://ejemplo.com/boda-${i + 1}`,
          urlToImage: null,
          source: { name: 'Fuente Demo' },
          publishedAt: new Date().toISOString()
        }))
      }
    }).as('newsPage1');

    cy.visit('/blog');
    cy.wait('@newsPage1');

    // Debe renderizar 10 artículos
    cy.contains('h2', 'Titular boda 1', { timeout: 10000 }).should('exist');
    cy.contains('h2', 'Titular boda 10').should('exist');

    // Simular cargas adicionales: intercepts subsecuentes al hacer scroll
    cy.intercept('GET', 'https://newsapi.org/v2/everything*', {
      statusCode: 200,
      body: {
        articles: Array.from({ length: 10 }).map((_, i) => ({
          title: `Titular boda extra ${i + 1}`,
          description: `Descripción boda extra ${i + 1}`,
          url: `https://ejemplo.com/boda-extra-${i + 1}`,
          urlToImage: null,
          source: { name: 'Fuente Demo 2' },
          publishedAt: new Date().toISOString()
        }))
      }
    }).as('newsMore');

    // Scroll para disparar IntersectionObserver
    cy.scrollTo('bottom');
    cy.wait('@newsMore');

    // Algún titular extra debería aparecer
    cy.contains('h2', 'Titular boda extra 1', { timeout: 10000 }).should('exist');
  });
});

