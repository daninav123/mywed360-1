/// <reference types="Cypress" />

/**
 * Flujo 22 – Navegación / panel general.
 * Objetivo: panel de diagnóstico interno (`DevEnsureFinance`, `DevSeedGuests`, etc.).
 *
 * TODO: definir escenario estable en entorno de pruebas para abrir/cerrar el panel
 *       y validar métricas básicas sin depender de fixtures volátiles.
 */
describe('Dashboard · panel de diagnóstico', () => {
  beforeEach(() => {
    cy.loginToLovenda();
    cy.visit('/home');
  });

  it.skip('abre el panel de diagnóstico y muestra métricas resumen', () => {
    // TODO: instrumentar cuando existan data-testid y toggles reproducibles.
  });
});

