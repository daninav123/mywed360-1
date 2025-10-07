/// <reference types="Cypress" />

// Flujo 1: Registro y Autenticación (parcial)
// - Login UI con "recuérdame"
// - Redirección a /home
// - Logout desde el menú de usuario

describe('Flujo 1 - Autenticación (login/logout)', () => {
  const email = 'planner.e2e@lovenda.com';
  const password = 'password123';

  beforeEach(() => {
    cy.window().then((win) => win.localStorage.clear());
  });

  it('inicia sesión con "recuérdame" y luego cierra sesión', () => {
    cy.visit('/login');

    // Completar formulario de login
    cy.get('[data-testid="email-input"]').clear().type(email);
    cy.get('[data-testid="password-input"]').clear().type(password);
    cy.get('input#remember').check({ force: true });
    cy.get('[data-testid="login-button"]').click();

    // Debe redirigir a /home (rutas protegidas)
    cy.url({ timeout: 10000 }).should('match', /\/home$/);

    // El email debe persistirse por remember me
    cy.window().then((win) => {
      expect(win.localStorage.getItem('lovenda_login_email')).to.eq(email);
      // También debe existir sesión mock del hook unificado
      expect(win.localStorage.getItem('lovenda_user')).to.exist;
    });

    // Abrir menú de usuario y cerrar sesión
    cy.get('[data-user-menu] > div').click();
    cy.contains('button', 'Cerrar sesión', { matchCase: false }).click();

    // Vuelve a login o landing
    cy.url({ timeout: 10000 }).should('match', /\/(login)?$/);
  });
});

