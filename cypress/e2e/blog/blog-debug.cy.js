/// <reference types="Cypress" />

/**
 * Test de debug para entender qué está pasando con la página de blog
 */
describe('Blog Debug', () => {
  beforeEach(() => {
    cy.window().then((win) => win.localStorage.clear());
    cy.loginToLovenda();
  });

  it('debug: ver qué muestra la página cuando no hay artículos', () => {
    // Mock API para devolver array vacío
    cy.mockWeddingNews({}, { defaultBody: [] });

    cy.visit('/blog');

    // Esperar a que la API sea llamada
    cy.wait('@weddingNewsRequest', { timeout: 10000 });

    // Esperar un poco para que la página se cargue
    cy.wait(3000);

    // Capturar todo el contenido de la página para debug
    cy.get('body').should('be.visible');
    
    // Ver si hay algún mensaje de error
    cy.get('body').then(($body) => {
      cy.log('Contenido de la página:', $body.text());
    });

    // Buscar específicamente el div de error
    cy.get('body').contains('No encontramos artículos').should('exist').then(($el) => {
      cy.log('Encontrado mensaje de error:', $el.text());
    });
  });
});
