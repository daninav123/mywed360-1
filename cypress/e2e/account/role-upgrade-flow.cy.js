/// <reference types="Cypress" />

describe('Flujo 29 – Upgrade de roles', () => {
  beforeEach(() => {
    Cypress.env('STUB_FIRESTORE', true);
    cy.intercept('POST', '**/api/users/upgrade-role', (req) => {
      const { newRole, tier } = req.body || {};
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          role: newRole,
          subscription: { tier: tier || 'free' },
        },
      });
    }).as('upgradeRole');

    cy.visit('/test/role-upgrade');
    cy.loginToLovenda('owner.upgrade@lovenda.test');
    cy.reload();
    cy.closeDiagnostic();
    cy.get('[data-testid="role-upgrade-title"]', { timeout: 20000 }).should('be.visible');
  });

  it('permite promocionar a assistant y planner conservando el estado', () => {
    cy.get('[data-testid="role-upgrade-current"]').should('contain', 'owner');

    cy.get('[data-testid="role-upgrade-assistant"]').click();
    cy.wait('@upgradeRole').its('request.body.newRole').should('eq', 'assistant');
    cy.get('[data-testid="role-upgrade-status"]').should('contain', 'ok:assistant');
    cy.get('[data-testid="role-upgrade-current"]').should('contain', 'assistant');
    cy.window().then((win) => {
      const profile = JSON.parse(win.localStorage.getItem('MyWed360_user_profile') || '{}');
      expect(profile.role).to.equal('assistant');
    });

    cy.get('[data-testid="role-upgrade-planner"]').click();
    cy.wait('@upgradeRole').its('request.body.newRole').should('eq', 'planner');
    cy.get('[data-testid="role-upgrade-status"]').should('contain', 'ok:planner');
    cy.get('[data-testid="role-upgrade-current"]').should('contain', 'planner');
    cy.window().then((win) => {
      const profile = JSON.parse(win.localStorage.getItem('MyWed360_user_profile') || '{}');
      expect(profile.role).to.equal('planner');
    });
  });

  it('puede volver a owner tras un upgrade', () => {
    cy.get('[data-testid="role-upgrade-planner"]').click();
    cy.wait('@upgradeRole');
    cy.get('[data-testid="role-upgrade-current"]').should('contain', 'planner');

    cy.get('[data-testid="role-upgrade-owner"]').click();
    cy.wait('@upgradeRole').its('request.body.newRole').should('eq', 'owner');
    cy.get('[data-testid="role-upgrade-status"]').should('contain', 'ok:owner');
    cy.get('[data-testid="role-upgrade-current"]').should('contain', 'owner');
    cy.window().then((win) => {
      const profile = JSON.parse(win.localStorage.getItem('MyWed360_user_profile') || '{}');
      expect(profile.role).to.equal('owner');
    });
  });
});
