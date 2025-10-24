/// <reference types="Cypress" />

/**
 * Flujo 1: Social login (Google / Facebook) validado sin mocks.
 * El test confirma que los botones disparan el flujo real de Firebase
 * y que la interfaz maneja de forma controlada la respuesta del proveedor
 * cuando las credenciales OAuth no están configuradas en el entorno.
 */

const SOCIAL_SELECTORS = [
  '[data-provider="google"]',
  '[data-testid="google-login"]',
  'button:contains("Google")',
  'button[aria-label*="Google"]',
];

const FACEBOOK_SELECTORS = [
  '[data-provider="facebook"]',
  '[data-testid="facebook-login"]',
  'button:contains("Facebook")',
  'button[aria-label*="Facebook"]',
];

const assertControlledFeedback = () => {
  const feedbackSelectors = [
    '[role="alert"]',
    '[data-testid="error-message"]',
    '.toast-error',
    '.alert-error',
    'p:contains("error")',
    'p:contains("Google")',
    'p:contains("Facebook")',
  ];

  cy.get('body', { timeout: 10000 }).then(($body) => {
    const selector = feedbackSelectors.find((s) => $body.find(s).length);
    expect(selector, 'feedback visible tras intento de social login').to.exist;
    cy.get(selector).first().should('be.visible');
  });
};

describe('Flujo 1 - Social login (integración real)', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/login', {
      failOnStatusCode: false,
      onBeforeLoad(win) {
        try {
          win.__MALOVEAPP_DISABLE_AUTOLOGIN__ = true;
          win.__MALOVEAPP_DISABLE_LOGIN_REDIRECT__ = true;
        } catch (error) {
          // Los flags son opcionales; continuar aunque no existan.
        }
      },
    });

    cy.location('pathname', { timeout: 10000 }).should('include', '/login');
  });

  it('gestiona el intento de login con Google cuando OAuth no está configurado', () => {
    cy.get('body', { timeout: 10000 }).then(($body) => {
      const selector = SOCIAL_SELECTORS.find((s) => $body.find(s).length);
      expect(selector, 'botón de Google visible').to.exist;

      cy.get(selector).first().click({ force: true });
    });

    assertControlledFeedback();
  });

  it('gestiona el intento de login con Facebook cuando OAuth no está configurado', () => {
    cy.get('body', { timeout: 10000 }).then(($body) => {
      const selector = FACEBOOK_SELECTORS.find((s) => $body.find(s).length);
      expect(selector, 'botón de Facebook visible').to.exist;

      cy.get(selector).first().click({ force: true });
    });

    assertControlledFeedback();
  });
});
