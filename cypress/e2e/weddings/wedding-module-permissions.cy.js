/// <reference types="Cypress" />

describe('Flujo 10 - Permisos por módulo en detalle de boda', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.clear();
    });

    cy.loginToLovenda('planner.permisos@lovenda.test', 'planner');

    cy.window().then((win) => {
      const profileRaw = win.localStorage.getItem('MaLoveApp_user_profile');
      const profile = profileRaw ? JSON.parse(profileRaw) : {};
      const plannerProfile = {
        ...profile,
        uid: 'planner-permissions-e2e',
        role: 'planner',
        emailVerified: true,
      };
      win.localStorage.setItem('MaLoveApp_user_profile', JSON.stringify(plannerProfile));
    });

    cy.seedPlannerWeddings(
      'planner-permissions-e2e',
      [
        {
          id: 'perm-w1',
          name: 'Boda Permisos',
          weddingDate: '2026-04-20',
          location: 'Lisboa',
          progress: 50,
          active: true,
          permissions: {
            archiveWedding: true,
            manageSettings: true,
          },
          modulePermissions: {
            guests: { owner: 'manage', planner: 'manage', assistant: 'view' },
            finance: { owner: 'manage', planner: 'view', assistant: 'none' },
            tasks: { owner: 'manage', planner: 'manage', assistant: 'view' },
          },
          crm: { lastSyncStatus: 'synced' },
        },
      ],
      'perm-w1'
    );

    cy.intercept('PATCH', '**/api/weddings/perm-w1/module-permissions', {
      statusCode: 200,
      body: { success: true },
    }).as('updatePermissions');
  });

  it('permite consultar y actualizar permisos por módulo como planner', () => {
    cy.visit('/bodas/perm-w1');
    cy.closeDiagnostic();

    cy.contains('Checklist de Última Hora', { timeout: 10000 }).should('be.visible');
    cy.contains('Permisos por módulo').should('be.visible');

    cy.get('[data-testid="wedding-module-permissions"]').within(() => {
      cy.contains('Invitados').should('be.visible');
      cy.contains('Finanzas').should('be.visible');
      cy.contains('Tareas').should('be.visible');

      cy.get('[data-testid="module-permission-finance-planner"]').should('have.value', 'view');
      cy.get('[data-testid="module-permission-finance-planner"]').select('manage');
      cy.get('[data-testid="module-permission-guests-assistant"]').select('manage');
      cy.contains('Guardar cambios').click();
    });

    cy.wait('@updatePermissions');
  });
});

