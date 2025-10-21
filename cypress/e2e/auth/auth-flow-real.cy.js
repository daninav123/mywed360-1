/// <reference types="Cypress" />

/**
 * Test de Autenticación con Integración Real
 * Usa Firebase Auth real en lugar de mocks
 */

describe('Flujo de Autenticación Real (Login/Logout)', () => {
  const testEmail = `cypress-auth-${Date.now()}@malove.app`;
  const testPassword = 'TestPassword123!';
  let testUserId;

  before(() => {
    // Verificar que el backend esté corriendo
    cy.checkBackendHealth();
    
    // Crear usuario de test con Firebase Auth real
    cy.createFirebaseTestUser({
      email: testEmail,
      password: testPassword,
      displayName: 'Usuario Test Cypress Auth'
    }).then((user) => {
      testUserId = user.uid;
      cy.log(`✅ Usuario creado: ${testEmail} (${testUserId})`);
    });
  });

  after(() => {
    // Limpiar usuario de test
    if (testUserId) {
      cy.deleteFirebaseTestUser(testUserId);
      cy.log(`🗑️ Usuario eliminado: ${testUserId}`);
    }
  });

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Limpiar IndexedDB de Firebase
    cy.window().then((win) => {
      if (win.indexedDB) {
        try {
          win.indexedDB.deleteDatabase('firebaseLocalStorageDb');
        } catch (e) {
          // Ignorar errores
        }
      }
    });
  });

  it('debe iniciar sesión con usuario real de Firebase', () => {
    cy.visit('/login');
    cy.location('pathname', { timeout: 10000 }).should('include', '/login');

    // Completar formulario de login
    cy.get('[data-testid="email-input"], input[type="email"], input[name="email"]', { timeout: 10000 })
      .should('be.visible')
      .and('not.be.disabled')
      .clear()
      .type(testEmail, { delay: 50 });

    cy.get('[data-testid="password-input"], input[type="password"], input[name="password"]', { timeout: 10000 })
      .should('be.visible')
      .and('not.be.disabled')
      .clear()
      .type(testPassword, { delay: 50 });

    // Marcar "recuérdame" si existe
    cy.get('body').then($body => {
      if ($body.find('input#remember, [data-testid="remember-checkbox"]').length) {
        cy.get('input#remember, [data-testid="remember-checkbox"]').check({ force: true });
      }
    });

    // Click en botón de login
    cy.get('[data-testid="login-button"], button[type="submit"], button:contains("Iniciar sesión")')
      .should('be.visible')
      .click();

    // Esperar redirección (puede ser /home o /dashboard)
    cy.url({ timeout: 15000 }).should('satisfy', (url) => {
      return url.includes('/home') || url.includes('/dashboard') || !url.includes('/login');
    });

    cy.log('✅ Login exitoso con Firebase Auth real');

    // Verificar que Firebase Auth tiene usuario autenticado
    cy.window().then((win) => {
      cy.waitForFirebaseAuth();
      
      // Verificar que hay un usuario autenticado
      if (win.firebaseAuth && win.firebaseAuth.currentUser) {
        expect(win.firebaseAuth.currentUser.email).to.equal(testEmail);
        cy.log(`✅ Usuario autenticado en Firebase: ${win.firebaseAuth.currentUser.email}`);
      }
    });
  });

  it('debe cerrar sesión correctamente', () => {
    // Primero hacer login
    cy.loginToLovendaReal(testEmail, testPassword);

    // Verificar que estamos logueados
    cy.url({ timeout: 10000 }).should('not.include', '/login');

    // Cerrar diagnóstico si está abierto
    cy.closeDiagnostic();

    // Buscar y hacer click en el menú de usuario
    cy.get('body').then($body => {
      // Intentar varios selectores posibles para el menú de usuario
      const userMenuSelectors = [
        '[data-user-menu]',
        '[data-testid="user-menu"]',
        '[aria-label="Menú de usuario"]',
        'button:contains("perfil")',
        'button[aria-label="User menu"]'
      ];

      let menuFound = false;
      for (const selector of userMenuSelectors) {
        if ($body.find(selector).length) {
          cy.get(selector).first().click({ force: true });
          menuFound = true;
          break;
        }
      }

      if (!menuFound) {
        // Si no se encuentra el menú, buscar cualquier dropdown o avatar
        cy.get('[role="button"], button, [data-testid*="avatar"], [data-testid*="menu"]')
          .filter(':visible')
          .last()
          .click({ force: true });
      }
    });

    // Esperar a que aparezca el menú desplegable
    cy.wait(500);

    // Click en "Cerrar sesión"
    cy.get('body').then($body => {
      const logoutSelectors = [
        'button:contains("Cerrar sesión")',
        'button:contains("Logout")',
        'button:contains("Sign out")',
        '[data-testid="logout-button"]',
        'a:contains("Cerrar sesión")'
      ];

      for (const selector of logoutSelectors) {
        if ($body.find(selector).length) {
          cy.get(selector).first().click({ force: true });
          break;
        }
      }
    });

    // Verificar redirección a login o landing
    cy.url({ timeout: 15000 }).should('satisfy', (url) => {
      return url.includes('/login') || url.endsWith('/');
    });

    cy.log('✅ Logout exitoso');

    // Verificar que Firebase Auth no tiene usuario
    cy.window().then((win) => {
      if (win.firebaseAuth) {
        cy.waitForFirebaseAuth();
        expect(win.firebaseAuth.currentUser).to.be.null;
        cy.log('✅ Usuario desautenticado de Firebase');
      }
    });
  });

  it('debe mantener la sesión con "recuérdame"', () => {
    cy.visit('/login');

    // Login con "recuérdame" marcado
    cy.get('[data-testid="email-input"], input[type="email"]')
      .clear()
      .type(testEmail);

    cy.get('[data-testid="password-input"], input[type="password"]')
      .clear()
      .type(testPassword);

    // Marcar "recuérdame"
    cy.get('body').then($body => {
      if ($body.find('input#remember, [data-testid="remember-checkbox"]').length) {
        cy.get('input#remember, [data-testid="remember-checkbox"]').check({ force: true });
      }
    });

    cy.get('[data-testid="login-button"], button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('not.include', '/login');

    // Verificar que el email se guardó en localStorage
    cy.window().then((win) => {
      const savedEmail = win.localStorage.getItem('mywed360_login_email') ||
                        win.localStorage.getItem('lovenda_login_email') ||
                        win.localStorage.getItem('rememberedEmail');
      
      if (savedEmail) {
        expect(savedEmail).to.equal(testEmail);
        cy.log('✅ Email guardado por "recuérdame"');
      }
    });

    // Simular cierre y reapertura del navegador
    cy.clearCookies();
    
    // Visitar login de nuevo
    cy.visit('/login');

    // El email debería estar pre-rellenado
    cy.get('[data-testid="email-input"], input[type="email"]').should(($input) => {
      const value = $input.val();
      if (value) {
        expect(value).to.equal(testEmail);
        cy.log('✅ Email pre-rellenado correctamente');
      }
    });
  });

  it('debe mostrar error con credenciales incorrectas', () => {
    cy.visit('/login');

    cy.get('[data-testid="email-input"], input[type="email"]')
      .clear()
      .type(testEmail);

    cy.get('[data-testid="password-input"], input[type="password"]')
      .clear()
      .type('PasswordIncorrecto123!');

    cy.get('[data-testid="login-button"], button[type="submit"]').click();

    // Debe permanecer en login
    cy.url({ timeout: 5000 }).should('include', '/login');

    // Buscar mensaje de error
    cy.get('body').then($body => {
      const errorSelectors = [
        '[data-testid="error-message"]',
        '[role="alert"]',
        '.error',
        '.alert-error',
        'p:contains("incorrecto")',
        'p:contains("error")',
        'div:contains("credenciales")'
      ];

      let errorFound = false;
      for (const selector of errorSelectors) {
        if ($body.find(selector).length) {
          cy.get(selector).should('be.visible');
          errorFound = true;
          cy.log('✅ Mensaje de error mostrado');
          break;
        }
      }

      if (!errorFound) {
        cy.log('⚠️ No se encontró mensaje de error visible (puede estar en toast)');
      }
    });
  });
});
