/// <reference types="Cypress" />

/**
 * Flujo 1: Registro real utilizando Firebase Auth
 * Este test ejecuta el formulario de signup contra la infraestructura real
 * y valida que el usuario se cree en Firebase sin depender de mocks.
 */

describe('Flujo 1 - Registro (integración real)', () => {
  const testEmail = `cypress-signup-${Date.now()}@malove.app`;
  const testPassword = 'TestPassword123!';
  const displayName = 'Usuario Cypress Signup';

  const emailSelectors = [
    '[data-testid="signup-email"]',
    '#signup-email',
    'input[name="email"]',
    'input[type="email"]',
  ];

  const passwordSelectors = [
    '[data-testid="signup-password"]',
    '#signup-password',
    'input[name="password"]',
    'input[type="password"]',
  ];

  const roleSelectors = [
    '[data-testid="signup-role"]',
    '#signup-role',
    'select[name="role"]',
  ];

  const submitSelectors = [
    '[data-testid="signup-submit"]',
    'button[type="submit"]',
    'button:contains("Registrarse")',
    'button:contains("Crear cuenta")',
  ];

  after(() => {
    // Limpieza defensiva: eliminar el usuario creado si existe
    cy.deleteFirebaseUserByEmail(testEmail);
  });

  it('registra un usuario real y lo redirige al flujo protegido', () => {
    cy.checkBackendHealth();

    cy.visit('/signup', {
      failOnStatusCode: false,
      onBeforeLoad(win) {
        try {
          win.__MALOVEAPP_DISABLE_AUTOLOGIN__ = true;
          win.__MALOVEAPP_DISABLE_LOGIN_REDIRECT__ = true;
        } catch (error) {
          // Ignorar si los flags no existen
        }
      },
    });

    cy.location('pathname', { timeout: 10000 }).should('include', '/signup');

    // Completar email
    cy.get('body', { timeout: 10000 }).then(($body) => {
      const selector = emailSelectors.find((s) => $body.find(s).length);
      expect(selector, 'selector de email en formulario de registro').to.exist;

      if ($body.find('input[name="fullname"]').length) {
        cy.get('input[name="fullname"]').clear({ force: true }).type(displayName, { delay: 15 });
      }

      cy.get(selector).first().clear({ force: true }).type(testEmail, { delay: 15 });
    });

    // Completar password
    cy.get('body').then(($body) => {
      const selector = passwordSelectors.find((s) => $body.find(s).length);
      expect(selector, 'selector de contraseña en formulario de registro').to.exist;

      cy.get(selector).first().clear({ force: true }).type(testPassword, { delay: 15 });
    });

    // Seleccionar rol si el selector está presente
    cy.get('body').then(($body) => {
      const selector = roleSelectors.find((s) => $body.find(s).length);
      if (selector) {
        cy.get(selector).first().select('planner', { force: true });
      }
    });

    // Enviar formulario
    cy.get('body').then(($body) => {
      const selector = submitSelectors.find((s) => $body.find(s).length);
      expect(selector, 'selector de submit en formulario de registro').to.exist;

      cy.get(selector).first().click({ force: true });
    });

    // Esperar a que nos saque de /signup
    cy.url({ timeout: 20000 }).should((currentUrl) => {
      const allowed =
        currentUrl.includes('/verify-email') ||
        currentUrl.includes('/home') ||
        currentUrl.includes('/onboarding') ||
        currentUrl.includes('/dashboard');

      expect(
        allowed,
        `Redirección posterior al registro (${currentUrl})`
      ).to.equal(true);
    });

    // Comprobar que el usuario existe realmente en Firebase (con un pequeño retry)
    const ensureUserCreated = (attempt = 1) => {
      return cy.getFirebaseUserByEmail(testEmail).then((user) => {
        if (user && user.uid) {
          cy.wrap(user).as('createdUser');
          if (typeof user.emailVerified === 'boolean') {
            expect(
              user.emailVerified,
              'emailVerified debería ser false tras el signup'
            ).to.be.false;
          }
          return;
        }

        if (attempt >= 5) {
          throw new Error('Usuario no sincronizado en Firebase tras el registro');
        }

        cy.log('⏳ Usuario aún no sincronizado, reintentando...');
        cy.wait(2000);
        return ensureUserCreated(attempt + 1);
      });
    };

    ensureUserCreated();
  });
});
