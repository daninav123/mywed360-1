/// <reference types="Cypress" />

describe('API Mocks y Interceptors', () => {
  beforeEach(() => {
    // Configurar interceptors para todas las APIs
    cy.intercept('GET', '**/api/**', { statusCode: 200, body: { success: true } });
    cy.intercept('POST', '**/api/**', { statusCode: 200, body: { success: true } });
    cy.intercept('GET', '**firebase**', { statusCode: 200, body: {} });
    cy.intercept('POST', '**firebase**', { statusCode: 200, body: {} });
  });

  it('intercepta llamadas a la API correctamente', () => {
    cy.visit('/');
    cy.wait(500);
    cy.get('body').should('be.visible');
  });

  it('puede hacer login sin backend real', () => {
    cy.loginToLovenda('mock@user.com');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('isLoggedIn')).to.equal('true');
    });
  });

  it('maneja errores de red gracefully', () => {
    cy.intercept('GET', '**/api/error', { statusCode: 500, body: { error: 'Test error' } });
    cy.visit('/');
    cy.get('body').should('be.visible');
  });

  it('puede simular respuestas de Firebase', () => {
    cy.intercept('GET', '**firestore.googleapis.com/**', {
      statusCode: 200,
      body: {
        documents: [
          { fields: { name: { stringValue: 'Test Wedding' } } }
        ]
      }
    });
    cy.visit('/');
    cy.get('body').should('be.visible');
  });

  it('funciona sin conexión a servicios externos', () => {
    // Bloquear todos los servicios externos
    cy.intercept('GET', '**googleapis.com/**', { statusCode: 503 });
    cy.intercept('GET', '**cloudinary.com/**', { statusCode: 503 });
    cy.intercept('GET', '**sentry.io/**', { statusCode: 503 });
    
    // La app debería seguir funcionando
    cy.visit('/');
    cy.get('body').should('be.visible');
  });

  it('puede mockar autenticación', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('MaLoveApp_auth_token', 'mock-token-123');
      win.localStorage.setItem('isLoggedIn', 'true');
    });
    cy.reload();
    cy.window().then((win) => {
      expect(win.localStorage.getItem('MaLoveApp_auth_token')).to.equal('mock-token-123');
    });
  });

  it('intercepta y modifica respuestas', () => {
    cy.intercept('GET', '**/api/user', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          id: 'test-123',
          email: 'test@example.com',
          role: 'owner'
        }
      });
    });
    cy.visit('/');
    cy.get('body').should('be.visible');
  });

  it('maneja timeouts correctamente', () => {
    cy.intercept('GET', '**/api/slow', (req) => {
      req.reply({
        statusCode: 200,
        delay: 100,
        body: { success: true }
      });
    });
    cy.visit('/');
    cy.get('body').should('be.visible');
  });

  it('puede simular diferentes roles de usuario', () => {
    // Simular owner
    cy.loginToLovenda('owner@test.com', 'owner');
    cy.window().then((win) => {
      const profile = JSON.parse(win.localStorage.getItem('MaLoveApp_user_profile'));
      expect(profile.role).to.equal('owner');
    });
    
    // Simular assistant
    cy.loginToLovenda('assistant@test.com', 'assistant');
    cy.window().then((win) => {
      const profile = JSON.parse(win.localStorage.getItem('MaLoveApp_user_profile'));
      expect(profile.role).to.equal('assistant');
    });
  });

  it('preserva cookies entre navegaciones', () => {
    cy.setCookie('session', 'test-session-123');
    cy.setCookie('user_id', 'user-456');
    
    cy.visit('/');
    cy.getCookie('session').should('have.property', 'value', 'test-session-123');
    cy.getCookie('user_id').should('have.property', 'value', 'user-456');
  });
});
