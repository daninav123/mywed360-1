/**
 * Test E2E: Flujo de Autenticación
 * Verifica rutas protegidas, sesión persistente y remember me
 */

describe('Flujo de Autenticación', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('debe redirigir a login si usuario no autenticado accede a ruta protegida', () => {
    cy.visit('http://localhost:5173/dashboard');
    cy.url().should('include', '/login');
  });

  it('debe mantener sesión después de refresh si remember me activado', () => {
    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('input[type="checkbox"]').check();
    
    cy.window().then((win) => {
      win.localStorage.setItem('userSession', JSON.stringify({
        token: 'test-token',
        user: { id: 'test-user', email: 'test@example.com' },
        rememberMe: true
      }));
    });

    cy.visit('http://localhost:5173/dashboard');
    cy.reload();
    
    cy.url().should('not.include', '/login');
  });

  it('debe cerrar sesión correctamente', () => {
    cy.visit('http://localhost:5173');
    cy.window().then((win) => {
      win.localStorage.setItem('userSession', JSON.stringify({
        token: 'test-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }));
    });

    cy.visit('http://localhost:5173/dashboard');
    cy.contains('Cerrar sesión', { timeout: 10000 }).click();
    
    cy.url().should('include', '/login');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('userSession')).to.be.null;
    });
  });
});
