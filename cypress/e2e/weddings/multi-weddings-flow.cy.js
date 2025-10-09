/// <reference types="Cypress" />

// Flujo 10: Gestión de múltiples bodas (planner)

describe('Flujo 10 - Gestión de bodas múltiples', () => {
  beforeEach(() => {
    Cypress.env('STUB_FIRESTORE', true);
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
      win.__MOCK_WEDDING__ = {
        weddings: [
          {
            id: 'w1',
            name: 'Boda Ana',
            weddingDate: '2026-05-10',
            location: 'Bilbao',
            progress: 45,
            active: true,
          },
          {
            id: 'w2',
            name: 'Boda Luis',
            weddingDate: '2026-09-15',
            location: 'Sevilla',
            progress: 70,
            active: true,
          },
          {
            id: 'w3',
            name: 'Boda Marta',
            weddingDate: '2024-11-02',
            location: 'Madrid',
            progress: 100,
            active: false,
          },
        ],
        activeWedding: { id: 'w1' },
      };
    });
  });

  it('muestra bodas activas y archivadas usando los datos mockeados', () => {
    cy.visit('/bodas');
    cy.closeDiagnostic();

    cy.contains('Mis Bodas', { timeout: 10000 }).should('be.visible');
    cy.contains('+ Crear nueva boda').should('be.visible');

    cy.window().should((win) => {
      expect(win.localStorage.getItem('mywed360_active_wedding')).to.eq('w1');
    });

    cy.contains('Bodas activas').should('have.class', /bg-blue-50/);
    cy.contains('Boda Ana').should('be.visible');
    cy.contains('Boda Luis').should('be.visible');
    cy.contains('span', 'Activa').should('exist');

    cy.contains('Bodas archivadas').click();
    cy.contains('Bodas archivadas').should('have.class', /bg-blue-50/);
    cy.contains('Boda Marta', { timeout: 5000 }).should('be.visible');
    cy.contains('span', 'Archivada').should('exist');
  });
});
