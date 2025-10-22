/// <reference types="Cypress" />

/**
 * Flujo 1: Pantalla de verificación de email con datos reales.
 * Asegura que usuarios no verificados pueden solicitar el reenvío
 * y refrescar su estado utilizando Firebase Auth real.
 */

describe('Flujo 1 - Verificación de email (real)', () => {
  const testEmail = `cypress-verify-${Date.now()}@malove.app`;
  const testPassword = 'TestPassword123!';
  let testUserUid;

  before(() => {
    cy.checkBackendHealth();

    cy.createFirebaseTestUser({
      email: testEmail,
      password: testPassword,
      displayName: 'Usuario Verify Cypress',
      emailVerified: false,
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

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('permite reenviar el correo de verificación y refrescar el estado', () => {
    cy.loginToLovendaReal(testEmail, testPassword);

    cy.url({ timeout: 15000 }).should('include', '/verify-email');

    cy.contains('h2, h1', /verifica tu email/i, { timeout: 8000 }).should('be.visible');

    cy.intercept('POST', '**identitytoolkit.googleapis.com/**').as('firebaseAction');

    cy.get('[data-testid="resend-verification"], button:contains("reenviar")', { timeout: 8000 })
      .first()
      .click({ force: true });

    cy.wait('@firebaseAction', { timeout: 15000 });

    cy.get('p.text-green-600, p.text-red-600, [role="alert"]', { timeout: 8000 })
      .should('be.visible');

    cy.get('[data-testid="refresh-verification"], button:contains("ya verifiqué")', { timeout: 8000 })
      .first()
      .click({ force: true });

    cy.wait(1000);

    cy.getFirebaseUserByEmail(testEmail).then((user) => {
      expect(user, 'usuario debe existir en Firebase').to.not.be.null;
      if (user) {
        expect(user.emailVerified, 'el usuario aún no debería estar verificado automáticamente')
          .to.be.false;
      }
    });
  });
});
