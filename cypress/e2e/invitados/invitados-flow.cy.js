/**
 * Test E2E: Gestión de Invitados
 * Verifica CRUD de invitados y grupos
 */

describe('Flujo de Gestión de Invitados', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
    cy.window().then((win) => {
      win.localStorage.setItem('userSession', JSON.stringify({
        token: 'test-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }));
    });
  });

  it('debe mostrar lista de invitados', () => {
    cy.visit('http://localhost:5173/guests');
    cy.contains('Invitados', { timeout: 10000 }).should('be.visible');
  });

  it('debe agregar nuevo invitado', () => {
    cy.visit('http://localhost:5173/guests');
    cy.wait(1000);
    
    cy.contains('Agregar invitado', { matchCase: false }).click();
    cy.get('input[name="name"]').type('Juan Pérez');
    cy.get('input[name="email"]').type('juan@example.com');
    cy.contains('Guardar').click();
    
    cy.contains('Juan Pérez', { timeout: 5000 }).should('be.visible');
  });

  it('debe crear grupo de invitados', () => {
    cy.visit('http://localhost:5173/guests');
    cy.wait(1000);
    
    cy.contains('Crear grupo', { matchCase: false }).click();
    cy.get('input[name="groupName"]').type('Familia');
    cy.contains('Crear').click();
    
    cy.contains('Familia').should('be.visible');
  });

  it('debe buscar invitados por nombre', () => {
    cy.visit('http://localhost:5173/guests');
    cy.wait(1000);
    
    cy.get('input[type="search"]').type('María');
    cy.wait(500);
    
    cy.contains('María').should('be.visible');
  });

  it('debe filtrar por estado de confirmación', () => {
    cy.visit('http://localhost:5173/guests');
    cy.wait(1000);
    
    cy.get('select[name="filter"]').select('confirmed');
    cy.wait(500);
    
    cy.get('[data-status="confirmed"]').should('exist');
  });

  it('debe actualizar información de invitado', () => {
    cy.visit('http://localhost:5173/guests');
    cy.wait(1000);
    
    cy.get('[data-testid="guest-item"]').first().click();
    cy.get('input[name="phone"]').clear().type('+34666777888');
    cy.contains('Guardar').click();
    
    cy.contains('actualizado', { matchCase: false, timeout: 5000 }).should('be.visible');
  });

  it('debe eliminar invitado', () => {
    cy.visit('http://localhost:5173/guests');
    cy.wait(1000);
    
    cy.get('[data-testid="delete-guest"]').first().click();
    cy.contains('Confirmar').click();
    
    cy.contains('eliminado', { matchCase: false, timeout: 5000 }).should('be.visible');
  });
});
