/// <reference types="Cypress" />

/**
 * Flujo 4 – Invitados / plan de asientos.
 * Escenario: validar conflictos (doble asignación, RSVP pendiente).
 *
 * TODO: cubrir cuando existan fixtures para estados RSVP y conflict engine.
 */
describe('Seating plan · validación de conflictos', () => {
  beforeEach(() => {
    cy.loginToLovenda();
    cy.visit('/invitados/seating');
  });

  it.skip('impide doble asignación de un invitado', () => {
    // TODO: simular asignación duplicada y esperar alerta/conflicto.
  });

  it.skip('alerta cuando se asigna invitado sin RSVP confirmado', () => {
    // TODO: preparar fixture RSVP pending y validar mensaje de error.
  });
});

