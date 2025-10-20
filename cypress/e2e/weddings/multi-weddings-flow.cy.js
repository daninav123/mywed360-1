/// <reference types=""Cypress"" />

// Flujo 10: Gestión de múltiples bodas (planner)

describe('Flujo 10 - Gestión de bodas múltiples', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.clear();
    });
    cy.loginToLovenda('planner.multi@lovenda.test');
    cy.window().then((win) => {
      const profileRaw = win.localStorage.getItem('MyWed360_user_profile');
      const profile = profileRaw ? JSON.parse(profileRaw) : {};
      const plannerProfile = {
        ...profile,
        uid: 'planner-multi-e2e',
        role: 'planner',
        emailVerified: true,
      };
      win.localStorage.setItem('MyWed360_user_profile', JSON.stringify(plannerProfile));
    });
    cy.seedPlannerWeddings('planner-multi-e2e', [
      {
        id: 'w1',
        name: 'Boda Ana',
        weddingDate: '2026-05-10',
        location: 'Bilbao',
        progress: 45,
        active: true,
        permissions: { archiveWedding: true },
        modulePermissions: {
          guests: { owner: 'manage', planner: 'manage', assistant: 'view' },
          finance: { owner: 'manage', planner: 'view', assistant: 'none' },
        },
        crm: { lastSyncStatus: 'synced' },
      },
      {
        id: 'w2',
        name: 'Boda Luis',
        weddingDate: '2026-09-15',
        location: 'Sevilla',
        progress: 70,
        active: true,
        permissions: { archiveWedding: true },
        modulePermissions: {
          guests: { owner: 'manage', planner: 'manage', assistant: 'view' },
          finance: { owner: 'manage', planner: 'view', assistant: 'none' },
        },
        crm: { lastSyncStatus: 'queued' },
      },
      {
        id: 'w3',
        name: 'Boda Marta',
        weddingDate: '2024-11-02',
        location: 'Madrid',
        progress: 100,
        active: false,
        permissions: { archiveWedding: true },
        modulePermissions: {
          guests: { owner: 'manage', planner: 'manage', assistant: 'view' },
          finance: { owner: 'manage', planner: 'view', assistant: 'none' },
        },
        crm: { lastSyncStatus: 'failed' },
      },
    ], 'w1');
  });

  it('muestra bodas activas y archivadas desde el stub de datos', () => {
    cy.visit('/bodas');
    cy.closeDiagnostic();
    cy.intercept('POST', '**/api/crm/sync-weddings/bulk', {
      statusCode: 200,
      body: { success: true, queued: ['bulk-stub'] },
    }).as('crmBulk');
    cy.intercept('POST', '**/api/crm/sync-wedding', {
      statusCode: 200,
      body: { success: true, queueId: 'single-stub' },
    }).as('crmSingle');

    cy.contains(/Mis Bodas/i, { timeout: 10000 }).should('be.visible');
    cy.contains(/\+?\s*Crear nueva boda/i).should('be.visible');

    cy.window().should((win) => {
      expect(win.localStorage.getItem('mywed360_active_wedding')).to.eq('w1');
    });

    cy.contains(/Bodas activas/i).should('have.class', /bg-blue-50/);
    cy.contains('Boda Ana').should('be.visible');
    cy.contains('Boda Luis').should('be.visible');
    cy.contains('span', 'Activa').should('exist');

    cy.contains(/Bodas archivadas/i).click();
   cy.contains(/Bodas archivadas/i).should('have.class', /bg-blue-50/);
    cy.contains('Boda Marta', { timeout: 5000 }).should('be.visible');
    cy.contains('span', 'Archivada').should('exist');

    cy.contains(/Resumen multi boda/i).click();
    cy.get('[data-testid="multi-wedding-summary"]').within(() => {
      cy.contains('Bodas activas').should('be.visible');
      cy.contains('Próximas 60 días').should('be.visible');
      cy.contains('Estado CRM').parent().should('contain', 'Sincronizadas: 1');
      cy.contains('Estado CRM').parent().should('contain', 'En cola: 1');
      cy.contains('Estado CRM').parent().should('contain', 'Errores: 1');
    });

    cy.contains('Sincronizar selección con CRM').should('be.enabled').click();
    cy.wait('@crmBulk');
    cy.contains('Sincronizar selección con CRM').should('be.enabled');

    cy.get('[data-testid="wedding-portfolio-table"]').within(() => {
      cy.contains('Boda Ana').should('be.visible');
      cy.get('[data-testid="portfolio-sync-w1"]').click();
    });
    cy.wait('@crmSingle');

    cy.get('[data-testid="wedding-portfolio-table"]').within(() => {
      cy.contains('Sincronizado').should('exist');
      cy.contains('En cola').should('exist');
      cy.contains('Error').should('exist');
    });
  });
});
