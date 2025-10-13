/// <reference types="Cypress" />

/**
 * Flujo 24 – Inspiración visual unificada.
 * Escenario: compartir (link/descarga/presentación).
 *
 * TODO: cubrir cuando los botones de compartir expongan callbacks testables.
 */
describe('Inspiración · compartir ideas', () => {
  beforeEach(() => {
    cy.loginToLovenda();
    cy.visit('/inspiracion');
  });

  it.skip('genera link de compartido y permite descarga/presentación', () => {
    // TODO: stub de `navigator.clipboard` y verificación de descarga.
  });
});

