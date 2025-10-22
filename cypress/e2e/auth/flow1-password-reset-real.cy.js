/// <reference types="Cypress" />

/**
 * Flujo 1: Recuperación de contraseña con infraestructura real.
 * Valida que la UI interactúa con Firebase Auth y muestra feedback al usuario.
 */

describe('Flujo 1 - Recuperación de contraseña (real)', () => {
  const testEmail = `cypress-reset-${Date.now()}@malove.app`;
  const testPassword = 'TestPassword123!';
  let testUserUid;

  before(() => {
    cy.checkBackendHealth();

    cy.createFirebaseTestUser({
      email: testEmail,
      password: testPassword,
      displayName: 'Usuario Reset Cypress',
      emailVerified: true,
    }).then((user) => {
      testUserUid = user?.uid;
    });
  });

  after(() => {
    if (testUserUid) {
      cy.deleteFirebaseTestUser(testUserUid);
    } else {
      cy.deleteFirebaseUserByEmail(testEmail);
    }
  });

  it('solicita un restablecimiento real y muestra feedback en la UI', () => {
    cy.visit('/reset-password', {
      failOnStatusCode: false,
      onBeforeLoad(win) {
        try {
          win.__MYWED360_DISABLE_AUTOLOGIN__ = true;
        } catch (error) {
          // Ignorar si los flags no existen
        }
      },
    });

    cy.location('pathname', { timeout: 10000 }).should('include', '/reset-password');

    cy.intercept('POST', '**identitytoolkit.googleapis.com/**').as('firebaseReset');

    cy.get('[data-testid="reset-email"], input[name="email"], input[type="email"]', { timeout: 10000 })
      .first()
      .clear({ force: true })
      .type(testEmail, { delay: 20 });

    cy.get('[data-testid="reset-submit"], button[type="submit"], button:contains("Enviar")', { timeout: 5000 })
      .first()
      .click({ force: true });

    cy.wait('@firebaseReset', { timeout: 15000 });

    cy.get('p.text-green-600, p.text-red-600, [role="alert"]', { timeout: 8000 })
      .should('be.visible')
      .then(($feedback) => {
        cy.log(`✅ Feedback mostrado: ${$feedback.text()}`);
      });
  });
});
