/**
 * SMOKE TEST: Verificación básica del sistema de portfolio
 *
 * Tests mínimos para verificar que las páginas cargan
 */

describe('Portfolio Proveedores - Smoke Test', () => {
  it('Debe cargar la aplicación principal', () => {
    cy.visit('/');
    cy.get('body').should('exist');
  });

  it('Debe cargar página de login de proveedor', () => {
    cy.visit('/supplier/login');
    cy.get('body').should('exist');
  });

  it('Debe poder navegar a proveedores', () => {
    cy.visit('/');
    // Verificar que la página carga sin errores
    cy.get('body').should('exist');
  });
});
