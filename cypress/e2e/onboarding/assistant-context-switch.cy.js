/// <reference types="Cypress" />

/**
 * Flujo 2B – Asistente conversacional.
 * Escenario: cambio de tema manteniendo contexto (p. ej. catering → música).
 *
 * TODO: cubrir cuando el asistente exponga almacenamiento de contexto detectable.
 */
describe('Asistente creación de boda · cambio de contexto', () => {
  beforeEach(() => {
    cy.loginToLovenda();
    cy.visit('/crear-evento-asistente');
  });

  it.skip('permite cambiar de tema sin perder respuestas previas', () => {
    // TODO: simular cambio de tema y validar estado acumulado.
  });
});

