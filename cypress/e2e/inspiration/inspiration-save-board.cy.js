/// <reference types="Cypress" />

/**
 * Flujo 24 – Inspiración visual unificada.
 * Escenario: guardar una idea en el moodboard y verificar sincronización.
 *
 * TODO: implementar cuando `SyncService` exponga mocks/fixtures deterministas.
 */
describe('Inspiración · guardado en moodboard', () => {
  beforeEach(() => {
    cy.loginToLovenda();
    cy.visit('/inspiracion');
  });

  it.skip('marca como favorito y confirma presencia en la colección', () => {
    // TODO: interceptar POST/PUT de favoritos y validar UI (chip “Guardado”).
  });
});

