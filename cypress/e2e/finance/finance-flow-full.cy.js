/**
 * Test E2E: Flujo Completo de Finanzas
 * Verifica wizard, categorías, rebalanceo y analytics
 */

describe('Flujo Completo de Finanzas', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
    cy.window().then((win) => {
      win.localStorage.setItem('userSession', JSON.stringify({
        token: 'test-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }));
    });
  });

  it('debe completar wizard de presupuesto inicial', () => {
    cy.visit('http://localhost:5173/finance/wizard');
    
    cy.get('input[name="totalBudget"]').type('25000');
    cy.contains('Siguiente').click();
    
    cy.get('select[name="weddingType"]').select('formal');
    cy.contains('Siguiente').click();
    
    cy.contains('Finalizar').click();
    cy.url().should('include', '/finance');
  });

  it('debe distribuir presupuesto por categorías', () => {
    cy.visit('http://localhost:5173/finance');
    cy.wait(1000);
    
    const categories = [
      { name: 'catering', amount: '8000' },
      { name: 'fotografia', amount: '3000' },
      { name: 'decoracion', amount: '2500' }
    ];
    
    categories.forEach(cat => {
      cy.contains('Agregar categoría').click();
      cy.get('select').last().select(cat.name);
      cy.get('input[type="number"]').last().type(cat.amount);
      cy.contains('Añadir').click();
      cy.wait(500);
    });
    
    cy.contains('8.000').should('be.visible');
    cy.contains('3.000').should('be.visible');
  });

  it('debe rebalancear presupuesto automáticamente', () => {
    cy.visit('http://localhost:5173/finance');
    cy.wait(1000);
    
    cy.contains('Rebalancear', { matchCase: false }).click();
    cy.contains('Confirmar').click();
    
    cy.contains('rebalanceado', { matchCase: false, timeout: 5000 }).should('be.visible');
  });

  it('debe registrar pagos y actualizar gastado', () => {
    cy.visit('http://localhost:5173/finance');
    cy.wait(1000);
    
    cy.get('[data-testid="category-item"]').first().click();
    cy.contains('Registrar pago').click();
    
    cy.get('input[name="amount"]').type('1500');
    cy.get('input[name="date"]').type('2025-12-25');
    cy.contains('Guardar').click();
    
    cy.contains('1.500', { timeout: 5000 }).should('be.visible');
  });

  it('debe mostrar analytics de presupuesto', () => {
    cy.visit('http://localhost:5173/finance/analytics');
    
    cy.get('[data-testid="budget-chart"]').should('be.visible');
    cy.get('[data-testid="spending-trend"]').should('be.visible');
  });

  it('debe alertar cuando se excede categoría', () => {
    cy.visit('http://localhost:5173/finance');
    cy.wait(1000);
    
    cy.intercept('POST', '**/api/finance/payment', {
      statusCode: 200,
      body: { warning: 'Presupuesto excedido', exceeded: true }
    }).as('payment');
    
    cy.get('[data-testid="category-item"]').first().click();
    cy.contains('Registrar pago').click();
    cy.get('input[name="amount"]').type('99999');
    cy.contains('Guardar').click();
    
    cy.wait('@payment');
    cy.contains('excedido', { matchCase: false, timeout: 5000 }).should('be.visible');
  });
});
