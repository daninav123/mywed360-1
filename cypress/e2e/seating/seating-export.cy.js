/// <reference types="Cypress" />

/**
 * Flujo 4 – Invitados / plan de asientos.
 * Escenario: exportaciones (PDF/imagen/CSV) y validación de descarga.
 *
 * TODO: preparar stubs de `useSeatingPlan` y `SeatingExportWizard` en entorno E2E.
 */
describe('Seating plan · exportaciones', () => {
  beforeEach(() => {
    cy.loginToLovenda();
    cy.visit('/invitados/seating');
  });

  it.skip('lanza el asistente de exportación y genera archivos esperados', () => {
    // TODO: stub de `URL.createObjectURL`/descargas y verificación de contenido.
  });
});

