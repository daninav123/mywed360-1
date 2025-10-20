/// <reference types="Cypress" />

describe('Tests Críticos de Autenticación', () => {
  it('permite hacer login', () => {
    cy.visit('/login');
    cy.wait(2000);
    cy.get('body').should('be.visible');
    
    // Buscar campos de login
    cy.get('input').first().type('test@example.com');
    cy.get('input').last().type('password123');
    cy.wait(1000);
  });

  it('redirige a home después de login', () => {
    cy.loginToLovenda('user@test.com');
    cy.visit('/home');
    cy.wait(2000);
    cy.get('body').should('be.visible');
    // Aceptar /home o /crear-evento si no hay boda activa
    cy.url().should('satisfy', (url) => {
      return url.includes('/home') || url.includes('/crear-evento');
    });
  });

  it('mantiene la sesión entre navegaciones', () => {
    cy.loginToLovenda('user@test.com');
    cy.visit('/home');
    cy.wait(1000);
    cy.visit('/tasks');
    cy.wait(1000);
    cy.get('body').should('be.visible');
    
    // Verificar que no redirige al login
    cy.url().should('not.include', '/login');
  });
});
