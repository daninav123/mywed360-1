/// <reference types="Cypress" />

// Flujo 16: Contratos y Documentos
// - Añadir contrato (modo local sin boda activa)
// - Ver en tabla y seleccionar

describe('Flujo 16 - Contratos y Documentos', () => {
  beforeEach(() => {
    cy.window().then((win) => win.localStorage.clear());
    cy.loginToLovenda();
    // Forzar modo local (sin boda activa)
    cy.window().then((win) => {
      win.localStorage.removeItem('mywed360_active_wedding');
      win.localStorage.removeItem('lovenda_active_wedding');
    });
  });

  it('crea un contrato y lo muestra en la lista', () => {
    cy.visit('/proveedores/contratos');

    cy.contains('button', 'Añadir Contrato').click({ force: true });

    // Rellenar formulario
    const today = new Date().toISOString().slice(0, 10);
    cy.get('input[placeholder="Proveedor"]').type('Eventos Catering S.A.');
    cy.get('input[placeholder="Tipo de contrato"]').type('Catering');
    cy.get('input[type="date"]').eq(0).clear().type(today);
    cy.get('input[type="date"]').eq(1).clear().type(today);
    cy.get('select').select('Vigente');
    cy.contains('button', 'Guardar').click();

    // Debe aparecer en la tabla de escritorio o en la lista móvil según viewport
    cy.contains('td,div,p', 'Eventos Catering S.A.').should('exist');

    // Seleccionar checkbox de la fila
    cy.contains('td,div,p', 'Eventos Catering S.A.')
      .parents('tr').find('input[type="checkbox"]').check({ force: true });
  });
});
