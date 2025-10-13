/// <reference types="Cypress" />

/**
 * Flujo 2B – Asistente conversacional.
 * Escenario: generación de recordatorios/tareas desde comandos específicos.
 *
 * TODO: implementar cuando los follow-ups creen tareas y feedback verificable.
 */
describe('Asistente creación de boda · follow-ups automáticos', () => {
  beforeEach(() => {
    cy.loginToLovenda();
    cy.visit('/crear-evento-asistente');
  });

  it.skip('convierte comandos en recordatorios/tareas', () => {
    // TODO: simular comandos y comprobar creación de tareas en contexto.
  });
});

