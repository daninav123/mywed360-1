/// <reference types="Cypress" />

describe('Funcionalidad Core de MyWed360', () => {
  beforeEach(() => {
    cy.loginToLovenda('test@example.com', 'owner');
  });

  it('carga la aplicación correctamente', () => {
    cy.visit('/');
    cy.get('body').should('be.visible');
    cy.get('#root').should('exist');
  });

  it('mantiene datos en localStorage', () => {
    cy.window().then((win) => {
      expect(win.localStorage.getItem('isLoggedIn')).to.equal('true');
      expect(win.localStorage.getItem('MyWed360_mock_user')).to.exist;
      expect(win.localStorage.getItem('MyWed360_user_profile')).to.exist;
    });
  });

  it('tiene boda activa configurada', () => {
    cy.window().then((win) => {
      const wedding = win.localStorage.getItem('MyWed360_active_wedding');
      expect(wedding).to.exist;
      const parsed = JSON.parse(wedding);
      expect(parsed).to.have.property('id');
      expect(parsed).to.have.property('name', 'Boda Test');
    });
  });

  it('puede navegar a home', () => {
    cy.visit('/home');
    cy.wait(2000);
    cy.get('body').should('be.visible');
  });

  it('puede navegar a invitados', () => {
    cy.visit('/invitados');
    cy.wait(2000);
    cy.get('body').should('be.visible');
  });

  it('renderiza elementos de UI básicos', () => {
    cy.visit('/home');
    cy.get('div').should('have.length.greaterThan', 5);
    cy.get('button').should('exist');
  });

  it('no tiene errores críticos en consola', () => {
    cy.visit('/home');
    cy.window().then((win) => {
      const originalError = win.console.error;
      let errorCount = 0;
      win.console.error = (...args) => {
        errorCount++;
        originalError.apply(win.console, args);
      };
      cy.wait(1000).then(() => {
        expect(errorCount).to.be.lessThan(3); // Permitir algunos warnings
      });
    });
  });
});
