/// <reference types="Cypress" />

/**
 * Flujo 4 – Invitados / plan de asientos.
 * Escenario: crear mesa, asignar invitado y guardar.
 *
 * TODO: implementar sobre el seating refactor cuando existan seeds deterministas.
 */
describe('Seating plan · flujo básico', () => {
  beforeEach(() => {
    cy.loginToLovenda();
    cy.visit('/invitados/seating');
  });

  it.skip('crea una mesa, asigna un invitado y guarda cambios', () => {
    // TODO: simular drag&drop con `useSeatingPlan` y validar autosave.
  });
});

