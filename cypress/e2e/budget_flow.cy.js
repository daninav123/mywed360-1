/// <reference types="cypress" />

// E2E flujo completo: presupuesto detectado → aceptación
// Nota: Se simulan llamadas a la API backend; Firestore se stubbea.

context('Flujo de aprobación de presupuesto de proveedor', () => {
  const weddingId = 'wed-e2e-1';
  const supplierId = 'sup-e2e-1';

  beforeEach(() => {
    // Stub de listener que carga presupuestos (Firestore) devolviendo uno pendiente
    cy.intercept('GET', `/api/mock/budgets/${weddingId}/${supplierId}`, {
      statusCode: 200,
      body: [
        {
          id: 'budget-1',
          description: 'Prueba fotografía',
          amount: 500,
          currency: 'EUR',
          status: 'pending',
        },
      ],
    }).as('loadBudgets');

    // Interceptar actualización de presupuesto
    cy.intercept('PUT', `/api/weddings/${weddingId}/suppliers/${supplierId}/budget`, (req) => {
      expect(req.body).to.have.property('action', 'accept');
      req.reply({ success: true, status: 'accepted' });
    }).as('updateBudget');
  });

  it('El usuario acepta un presupuesto pendiente', () => {
    // Suponemos que existe ruta /test/e2eProveedor que monta componente con los parámetros
    cy.visit(`/test/e2eProveedor?w=${weddingId}&s=${supplierId}`);

    // Esperar carga de presupuestos fakes
    cy.wait('@loadBudgets');

    // El botón Aceptar debe estar visible y clicable
    cy.contains('button', /aceptar/i).click();

    // Esperar llamada PUT y verificar respuesta
    cy.wait('@updateBudget').its('response.body.status').should('eq', 'accepted');

    // El presupuesto debe mostrar estado aceptado
    cy.contains(/aceptado/i).should('exist');
  });
});
