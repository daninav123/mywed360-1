/**
 * TEST E2E: Link al Portfolio desde Dashboard del Proveedor
 *
 * Verifica que el proveedor pueda acceder a su portfolio
 * desde un link destacado en su dashboard
 */

describe('Portfolio Proveedores - Link Dashboard', () => {
  beforeEach(() => {
    // Limpiar estado
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('Debe mostrar link al portfolio en dashboard del proveedor', () => {
    // Mock: Proveedor autenticado
    cy.window().then((win) => {
      win.localStorage.setItem('supplier_token', 'mock-token-123');
      win.localStorage.setItem('supplier_id', 'supplier-test-001');
    });

    // Visitar dashboard del proveedor
    cy.visit('/supplier/dashboard/supplier-test-001');

    // Verificar que carga el dashboard
    cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');

    // Verificar que existe el link al portfolio
    cy.get('a[href*="/portfolio"]').should('exist').and('be.visible');

    // Verificar que tiene el icono de cámara
    cy.get('a[href*="/portfolio"]').within(() => {
      cy.get('svg').should('exist'); // Icono Lucide Camera
      cy.contains('Mi Portfolio').should('be.visible');
    });

    // Verificar el diseño del card
    cy.get('a[href*="/portfolio"]')
      .should('have.class', 'shadow-md')
      .should('have.css', 'border-left-width', '4px');
  });

  it('Debe navegar al portfolio al hacer clic en el link', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('supplier_token', 'mock-token-123');
      win.localStorage.setItem('supplier_id', 'supplier-test-001');
    });

    cy.visit('/supplier/dashboard/supplier-test-001');

    // Hacer clic en el link del portfolio
    cy.get('a[href*="/portfolio"]').click();

    // Verificar que navega a la página correcta
    cy.url().should('include', '/supplier/dashboard/supplier-test-001/portfolio');
  });

  it('Debe tener estilos hover correctos', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('supplier_token', 'mock-token-123');
      win.localStorage.setItem('supplier_id', 'supplier-test-001');
    });

    cy.visit('/supplier/dashboard/supplier-test-001');

    // Verificar hover effect
    cy.get('a[href*="/portfolio"]').trigger('mouseover').should('have.class', 'hover:shadow-lg');
  });
});
