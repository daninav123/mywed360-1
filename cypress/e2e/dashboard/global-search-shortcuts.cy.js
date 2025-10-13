/// <reference types="Cypress" />

/**
 * Flujo 22 – Navegación / panel general.
 * Cobertura: accesos rápidos (global search, quick add).
 *
 * TODO: completar cuando la búsqueda global exponga atajos (por ejemplo Cmd/Ctrl+K)
 *       y los botones Quick Add reflejen resultado visible.
 */
describe('Dashboard · accesos rápidos y búsqueda global', () => {
  beforeEach(() => {
    cy.loginToLovenda();
    cy.visit('/home');
  });

  it.skip('abre la búsqueda global mediante shortcut y permite navegar a resultados', () => {
    // TODO: simular shortcut y verificar navegación a módulo.
  });

  it.skip('ejecuta quick actions (añadir invitado, crear tarea, etc.)', () => {
    // TODO: cubrir quick actions una vez tengan feedback determinístico.
  });
});

