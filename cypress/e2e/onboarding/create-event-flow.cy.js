/**
 * Test E2E: Creación de Evento
 * Verifica wizard de creación de boda
 */

describe('Flujo de Creación de Evento', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
    cy.window().then((win) => {
      win.localStorage.setItem('userSession', JSON.stringify({
        token: 'test-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }));
    });
  });

  it('debe mostrar wizard de creación', () => {
    cy.visit('http://localhost:5173/create-wedding');
    cy.contains('Crear tu boda', { matchCase: false, timeout: 10000 }).should('be.visible');
  });

  it('debe completar paso 1 - información básica', () => {
    cy.visit('http://localhost:5173/create-wedding');
    
    cy.get('input[name="brideName"]').type('María');
    cy.get('input[name="groomName"]').type('Juan');
    cy.get('input[name="weddingDate"]').type('2026-06-15');
    
    cy.contains('Siguiente').click();
    cy.contains('Ubicación', { matchCase: false }).should('be.visible');
  });

  it('debe completar paso 2 - ubicación', () => {
    cy.visit('http://localhost:5173/create-wedding?step=2');
    
    cy.get('input[name="venue"]').type('Hotel Ejemplo');
    cy.get('input[name="city"]').type('Madrid');
    cy.get('input[name="country"]').select('España');
    
    cy.contains('Siguiente').click();
    cy.contains('Invitados', { matchCase: false }).should('be.visible');
  });

  it('debe completar paso 3 - número de invitados', () => {
    cy.visit('http://localhost:5173/create-wedding?step=3');
    
    cy.get('input[name="guestCount"]').type('120');
    
    cy.contains('Siguiente').click();
    cy.contains('Presupuesto', { matchCase: false }).should('be.visible');
  });

  it('debe completar paso 4 - presupuesto estimado', () => {
    cy.visit('http://localhost:5173/create-wedding?step=4');
    
    cy.get('input[name="budget"]').type('20000');
    
    cy.contains('Crear boda').click();
    cy.url({ timeout: 10000 }).should('include', '/dashboard');
  });

  it('debe validar campos requeridos', () => {
    cy.visit('http://localhost:5173/create-wedding');
    
    cy.contains('Siguiente').click();
    cy.contains('requerido', { matchCase: false }).should('be.visible');
  });

  it('debe permitir volver atrás en el wizard', () => {
    cy.visit('http://localhost:5173/create-wedding?step=3');
    
    cy.contains('Atrás', { matchCase: false }).click();
    cy.contains('Ubicación', { matchCase: false }).should('be.visible');
  });
});
