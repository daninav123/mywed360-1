/// <reference types="Cypress" />

describe('Flujo de Usuario Básico', () => {
  it('permite el flujo completo de login', () => {
    cy.visit('/');
    cy.loginToLovenda('usuario@test.com', 'owner');
    cy.wait(1000);
    cy.window().then((win) => {
      expect(win.localStorage.getItem('isLoggedIn')).to.equal('true');
    });
  });

  it('mantiene la sesión activa', () => {
    cy.loginToLovenda('usuario@test.com', 'owner');
    cy.visit('/home');
    cy.wait(1000);
    cy.reload();
    cy.wait(1000);
    cy.window().then((win) => {
      expect(win.localStorage.getItem('isLoggedIn')).to.equal('true');
    });
  });

  it('puede cambiar entre páginas públicas', () => {
    cy.visit('/');
    cy.wait(500);
    cy.visit('/login');
    cy.wait(500);
    cy.visit('/register');
    cy.wait(500);
    cy.visit('/');
    cy.get('body').should('be.visible');
  });

  it('renderiza correctamente en diferentes viewports', () => {
    cy.visit('/');
    
    // Mobile
    cy.viewport(375, 667);
    cy.get('body').should('be.visible');
    
    // Tablet
    cy.viewport(768, 1024);
    cy.get('body').should('be.visible');
    
    // Desktop
    cy.viewport(1920, 1080);
    cy.get('body').should('be.visible');
  });

  it('puede usar funciones básicas del DOM', () => {
    cy.visit('/');
    cy.document().should('have.property', 'readyState', 'complete');
    cy.title().should('exist');
    cy.url().should('include', 'localhost');
  });

  it('mantiene el estado del usuario entre navegaciones', () => {
    cy.loginToLovenda('test@user.com', 'owner');
    
    // Navegar a varias páginas
    cy.visit('/home');
    cy.wait(1000);
    
    cy.visit('/tasks');
    cy.wait(1000);
    
    // Verificar que el usuario sigue logueado
    cy.window().then((win) => {
      const profile = win.localStorage.getItem('MaLoveApp_user_profile');
      expect(profile).to.exist;
      const parsed = JSON.parse(profile);
      expect(parsed.email).to.equal('test@user.com');
    });
  });

  it('puede manejar navegación con el botón atrás', () => {
    cy.visit('/');
    cy.wait(500);
    cy.visit('/login');
    cy.wait(500);
    cy.go('back');
    cy.wait(500);
    cy.url().should('include', 'localhost:5173');
  });

  it('carga recursos estáticos correctamente', () => {
    cy.visit('/');
    cy.get('link[rel="stylesheet"]').should('exist');
    cy.get('script').should('exist');
  });
});
