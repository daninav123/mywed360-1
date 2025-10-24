/// <reference types="cypress" />

describe('Momentos - estados iniciales', () => {
  beforeEach(() => {
    cy.window().then((win) => win.localStorage.clear());
    cy.loginToLovenda();
  });

  it('muestra aviso cuando no hay boda activa', () => {
    cy.window().then((win) => {
      const state = { users: { 'cypress-test': { weddings: [], activeWeddingId: '' } } };
      win.localStorage.setItem('maloveapp_local_weddings', JSON.stringify(state));
      win.dispatchEvent(new CustomEvent('maloveapp:local-weddings-updated'));
      win.localStorage.removeItem('maloveapp_active_wedding');
      win.localStorage.removeItem('maloveapp_active_wedding');
    });
    cy.visit('/momentos');
    cy.closeDiagnostic();

    cy.contains('h1,h2', 'Momentos', { timeout: 15000 }).should('be.visible');
    cy.contains('Selecciona una boda para gestionar Momentos.', { matchCase: false }).should(
      'be.visible'
    );
  });
});
