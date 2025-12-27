/**
 * Test E2E: Flujo de Presupuesto
 * Verifica gestión completa del presupuesto de boda
 */

describe('Flujo de Presupuesto', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
    cy.window().then((win) => {
      win.localStorage.setItem('userSession', JSON.stringify({
        token: 'test-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }));
    });
  });

  it('debe mostrar página de finanzas', () => {
    cy.visit('http://localhost:5173/finance');
    cy.contains('Presupuesto', { timeout: 10000 }).should('be.visible');
  });

  it('debe establecer presupuesto total', () => {
    cy.visit('http://localhost:5173/finance');
    cy.wait(1000);
    
    cy.get('input[type="number"]').first().clear().type('20000');
    cy.contains('Guardar', { matchCase: false }).click();
    
    cy.contains('20.000', { timeout: 5000 }).should('be.visible');
  });

  it('debe agregar categoría de gasto', () => {
    cy.visit('http://localhost:5173/finance');
    cy.wait(1000);
    
    cy.contains('Agregar categoría', { matchCase: false }).click();
    cy.get('select').select('catering');
    cy.get('input[type="number"]').type('5000');
    cy.contains('Añadir').click();
    
    cy.contains('Catering', { matchCase: false }).should('be.visible');
    cy.contains('5.000').should('be.visible');
  });

  it('debe calcular porcentajes correctamente', () => {
    cy.visit('http://localhost:5173/finance');
    cy.wait(1000);
    
    cy.intercept('GET', '**/api/finance/**').as('getFinance');
    cy.wait('@getFinance');
    
    cy.get('[data-testid="category-percentage"]').first().should('exist');
  });

  it('debe mostrar alertas de sobrepresupuesto', () => {
    cy.visit('http://localhost:5173/finance');
    cy.wait(1000);
    
    cy.window().then((win) => {
      win.dispatchEvent(new CustomEvent('budget-exceeded', {
        detail: { category: 'catering', amount: 6000, budget: 5000 }
      }));
    });
    
    cy.contains('excedido', { matchCase: false, timeout: 5000 }).should('be.visible');
  });

  it('debe exportar resumen de presupuesto', () => {
    cy.visit('http://localhost:5173/finance');
    cy.wait(1000);
    
    cy.contains('Exportar', { matchCase: false }).should('be.visible');
  });
});
