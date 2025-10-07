/// <reference types="Cypress" />

// Flujo 20: Inspiración Visual
// - Carga del muro (usa fallback demo si backend no disponible)
// - Marcar favorito y visualizar en pestaña de favoritos

describe('Flujo 20 - Inspiración Visual', () => {
  beforeEach(() => {
    cy.window().then((win) => win.localStorage.clear());
    cy.loginToLovenda();
  });

  it('marca una imagen como favorita y la ve en "favs"', () => {
    cy.visit('/inspiracion');

    // Esperar a que se renderice alguna imagen (fallback demo del servicio lo facilita)
    cy.get('img[alt="inspiration"]', { timeout: 15000 }).should('exist');

    // Favorito en la primera
    cy.get('img[alt="inspiration"]').first().parents('div.relative').within(() => {
      cy.get('button').first().click({ force: true });
    });

    // Ir a favoritos
    cy.contains('button', 'favs', { matchCase: false }).click();

    // Debe haber al menos una imagen
    cy.get('img[alt="inspiration"]').should('have.length.greaterThan', 0);
  });
});

