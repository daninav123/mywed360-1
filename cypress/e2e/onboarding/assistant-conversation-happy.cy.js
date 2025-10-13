/// <reference types="Cypress" />

/**
 * Flujo 2B – Asistente conversacional (creación de boda).
 * Escenario feliz: conversación completa, resumen y creación.
 *
 * TODO: instrumentar con mocks de `createWedding`/`seedDefaultTasksForWedding`.
 */
describe('Asistente creación de boda · flujo feliz', () => {
  beforeEach(() => {
    cy.loginToLovenda();
    cy.visit('/crear-evento-asistente');
  });

  it.skip('conversa, recopila datos y crea la boda mostrando resumen final', () => {
    // TODO: simular respuestas y esperar resumen + redirección.
  });
});

