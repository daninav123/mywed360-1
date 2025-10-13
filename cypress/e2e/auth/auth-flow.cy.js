/// <reference types="Cypress" />

// Flujo 1: Registro y Autenticación (parcial)
// - Login UI con "recuérdame"
// - Redirección a /home
// - Logout desde el menú de usuario

describe('Flujo 1 - Autenticación (login/logout)', () => {
  const email = 'planner.e2e@lovenda.com';
  const password = 'password123';

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('inicia sesión con "recuérdame" y luego cierra sesión', () => {
    const forceCleanAuthPersistence = (win) => {
      try {
        win.localStorage?.clear?.();
        win.sessionStorage?.clear?.();
        if (win.indexedDB) {
          try {
            win.indexedDB.deleteDatabase('firebaseLocalStorageDb');
          } catch (_) {}
          try {
            win.indexedDB.deleteDatabase('firebaseLocalStorageDb-auth');
          } catch (_) {}
        }
      } catch (_) {
        // Ignorar fallos al limpiar persistencia, continuamos con el flujo UI
      }
    };

    cy.visit('/login', {
      onBeforeLoad: (win) => {
        try {
          forceCleanAuthPersistence(win);
          win.__MYWED360_DISABLE_AUTOLOGIN__ = true;
          win.__MYWED360_DISABLE_LOGIN_REDIRECT__ = true;
        } catch (_) {}
      },
    });

    cy.location('pathname', { timeout: 10000 }).should('include', '/login');

    // Completar formulario de login (reconsultar evita detach tras re-render o hydrataciones)
    cy.get('[data-testid="email-input"]', { timeout: 10000 })
      .should('be.visible')
      .and('not.be.disabled')
      .clear();
    cy.get('[data-testid="email-input"]').type(email, { delay: 0 });

    cy.get('[data-testid="password-input"]', { timeout: 10000 })
      .should('be.visible')
      .and('not.be.disabled')
      .clear();
    cy.get('[data-testid="password-input"]')
      .should('be.visible')
      .and('not.be.disabled')
      .type(password, { delay: 0 });

    cy.get('input#remember').check({ force: true });
    cy.get('[data-testid="login-button"]').click();

    // Debe redirigir a /home (rutas protegidas)
    cy.url({ timeout: 10000 }).should('match', /\/home$/);

    // Desactivar el bypass de rutas protegidas para validar logout real
    cy.window().then((win) => {
      try {
        win.__MYWED360_DISABLE_PROTECTED_BYPASS__ = true;
      } catch (_) {}
    });

    // El email debe persistirse por remember me
    cy.window().then((win) => {
      const rememberedEmail =
        win.localStorage.getItem('mywed360_login_email') ||
        win.localStorage.getItem('lovenda_login_email');
      expect(rememberedEmail).to.eq(email);
      // También debe existir sesión mock del hook unificado
      const profile =
        win.localStorage.getItem('MyWed360_user_profile') ||
        win.localStorage.getItem('lovenda_user');
      expect(profile).to.exist;
    });

    // Abrir menú de usuario y cerrar sesión
    cy.get('[data-user-menu] > div').click();
    cy.contains('button', 'Cerrar sesión', { matchCase: false }).click();

    // Vuelve a login o landing
    cy.url({ timeout: 10000 }).should('match', /\/(login)?$/);

    cy.window().then((win) => {
      try {
        win.__MYWED360_DISABLE_LOGIN_REDIRECT__ = false;
        win.__MYWED360_DISABLE_AUTOLOGIN__ = false;
        win.__MYWED360_DISABLE_PROTECTED_BYPASS__ = false;
      } catch (_) {}
    });
  });
});
