/// <reference types="Cypress" />

/**
 * Flujo 18 – Generador de documentos legales.
 * Fuente funcional: docs/flujos-especificos/flujo-18-generador-documentos-legales.md
 *
 * TODO: completar assertions cuando el generador exponga hooks/test-ids para automatizar:
 *       - Rellenar formulario y stubear `jsPDF` para verificar el contenido.
 *       - Comprobar descarga / feedback visual tras generar el PDF.
 */
describe('Documentos legales · generación básica', () => {
  beforeEach(() => {
    cy.loginToLovenda();
    cy.visit('/protocolo/documentos');
  });

  it.skip('genera el PDF tras completar campos obligatorios', () => {
    // TODO: stub de jsPDF.save y verificación del payload.
  });
});

