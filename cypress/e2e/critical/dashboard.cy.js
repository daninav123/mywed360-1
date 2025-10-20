/// <reference types="Cypress" />

describe('Tests Críticos del Dashboard', () => {
  beforeEach(() => {
    // Ignorar error de RegisterForm
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('RegisterForm')) {
        return false;
      }
    });
    
    cy.loginToLovenda('user@test.com');
    cy.visit('/home');
    cy.wait(2000);
  });

  it('muestra el dashboard correctamente', () => {
    cy.get('body').should('be.visible');
    cy.contains(/dashboard|inicio|home/i).should('exist');
  });

  it('permite navegar a tareas', () => {
    cy.visit('/tasks');
    cy.wait(2000);
    cy.get('body').should('be.visible');
    // Aceptar tanto /tasks como /crear-evento si no hay boda
    cy.url().should('satisfy', (url) => {
      return url.includes('/tasks') || url.includes('/crear-evento');
    });
  });

  it('permite navegar a invitados', () => {
    cy.visit('/invitados');
    cy.wait(2000);
    cy.get('body').should('be.visible');
    // Aceptar tanto /invitados como /crear-evento si no hay boda
    cy.url().should('satisfy', (url) => {
      return url.includes('/invitados') || url.includes('/crear-evento');
    });
  });

  it('permite navegar a proveedores', () => {
    cy.visit('/proveedores');
    cy.wait(2000);
    cy.get('body').should('be.visible');
    // Aceptar tanto /proveedores como /crear-evento si no hay boda
    cy.url().should('satisfy', (url) => {
      return url.includes('/proveedores') || url.includes('/crear-evento');
    });
  });

  it('permite navegar a finanzas', () => {
    cy.visit('/finance');
    cy.wait(2000);
    cy.get('body').should('be.visible');
    // Aceptar tanto /finance como /crear-evento si no hay boda
    cy.url().should('satisfy', (url) => {
      return url.includes('/finance') || url.includes('/crear-evento');
    });
  });
});
