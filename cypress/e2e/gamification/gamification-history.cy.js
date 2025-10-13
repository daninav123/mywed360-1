/// <reference types="Cypress" />

/**
 * Flujo 17 – Gamificación y progreso.
 * Cobertura E2E: la Home no debe renderizar paneles de gamificación ni disparar peticiones
 * automáticas a `/api/gamification/*`, de acuerdo al alcance backend-only del flujo.
 */
describe('Gamificación · Home sin panel dedicado', () => {
  beforeEach(() => {
    cy.loginToLovenda();
  });

  it('no renderiza tarjetas ni consulta la API de gamificación al cargar Home', () => {
    let apiCalled = false;

    cy.intercept('**/api/gamification/**', () => {
      apiCalled = true;
    }).as('gamificationApi');

    cy.visit('/home');

    cy.get('body').should('be.visible');
    cy.get('body').find('[data-testid="gamification-card"]').should('not.exist');

    cy.then(() => {
      expect(apiCalled, 'API de gamificación no debería invocarse automáticamente').to.eq(false);
    });
  });
});
