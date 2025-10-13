/// <reference types="Cypress" />

/**
 * Flujo 18 – Generador de documentos legales.
 * Objetivo: conservar versiones posteriores a modificar parámetros.
 *
 * TODO: pendiente de implementación de historial/versionado en UI.
 *       Una vez disponible:
 *       - Guardar versión inicial, modificar datos, guardar segunda versión.
 *       - Comprobar listado cronológico de versiones y preview.
 */
describe('Documentos legales · versionado', () => {
  beforeEach(() => {
    cy.loginToLovenda();
    cy.visit('/protocolo/documentos');
  });

  it.skip('almacena versiones y permite revisar historial', () => {
    // TODO: instrumentar cuando se active el feature en frontend.
  });
});

