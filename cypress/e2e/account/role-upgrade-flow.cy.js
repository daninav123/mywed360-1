/// <reference types="Cypress" />

describe('Flujo 29 – Upgrade de roles', () => {
  beforeEach(() => {
    // Login primero
    cy.loginToLovenda('owner.upgrade@lovenda.test', 'owner');
    
    // Visitar la página de test
    cy.visit('/test/role-upgrade');
    
    // Esperar que la página cargue completamente
    cy.wait(3000);
  });
  

  it('permite promocionar a assistant y planner conservando el estado', () => {
    // Primero verificar que estamos en la URL correcta
    cy.url().then(url => {
      cy.log('URL actual:', url);
    });
    
    // Verificar que el componente se carga
    cy.get('[data-testid="role-upgrade-title"]').should('exist');
    cy.get('[data-testid="role-upgrade-current"]').should('exist');
    
    // Verificar que hay botones con data-testid específicos
    cy.get('[data-testid="role-upgrade-assistant"]').should('exist').click();
    cy.wait(500);
    cy.get('[data-testid="role-upgrade-status"]').should('contain', 'ok:assistant');
    
    cy.get('[data-testid="role-upgrade-planner"]').should('exist').click();
    cy.wait(500);
    cy.get('[data-testid="role-upgrade-status"]').should('contain', 'ok:planner');
    
    cy.get('[data-testid="role-upgrade-owner"]').should('exist').click();
    cy.wait(500);
    cy.get('[data-testid="role-upgrade-status"]').should('contain', 'ok:owner');
  });

  it('puede volver a owner tras un upgrade', () => {
    // Verificar que el componente se carga
    cy.get('[data-testid="role-upgrade-title"]').should('exist');
    cy.get('[data-testid="role-upgrade-current"]').should('exist');
    
    // Cambiar a planner
    cy.get('[data-testid="role-upgrade-planner"]').should('exist').click();
    cy.wait(500);
    cy.get('[data-testid="role-upgrade-status"]').should('contain', 'ok:planner');
    cy.get('[data-testid="role-upgrade-current"]').should('contain', 'planner');
    
    // Volver a owner
    cy.get('[data-testid="role-upgrade-owner"]').should('exist').click();
    cy.wait(500);
    cy.get('[data-testid="role-upgrade-status"]').should('contain', 'ok:owner');
    cy.get('[data-testid="role-upgrade-current"]').should('contain', 'owner');
  });
});
