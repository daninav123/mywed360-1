/// <reference types="Cypress" />

// Cobertura adicional Flujo 2: CTA multi-evento en header

describe('Flujo 2 - CTA multi-evento', () => {
  beforeEach(() => {
    Cypress.env('STUB_FIRESTORE', true);
    cy.window().then((win) => {
      win.localStorage.clear();
    });
    cy.loginToLovenda('owner.multi@lovenda.test');
    cy.window().then((win) => {
      const profileRaw = win.localStorage.getItem('MyWed360_user_profile');
      const profile = profileRaw ? JSON.parse(profileRaw) : {};
      const ownerProfile = {
        ...profile,
        uid: 'owner-multi-cta',
        role: 'owner',
        emailVerified: true,
      };
      win.localStorage.setItem('MyWed360_user_profile', JSON.stringify(ownerProfile));
      win.localStorage.setItem('mywed360_active_wedding', 'w1');
      win.localStorage.setItem('lovenda_active_wedding', 'w1');
      win.__MOCK_WEDDING__ = {
        weddings: [
          {
            id: 'w1',
            name: 'Boda Principal',
            weddingDate: '2026-05-18',
            location: 'Madrid',
            eventType: 'boda',
            progress: 45,
          },
          {
            id: 'w2',
            name: 'Evento Corporativo',
            weddingDate: '2026-07-10',
            location: 'Barcelona',
            eventType: 'evento',
            progress: 10,
          },
        ],
        activeWedding: { id: 'w1', name: 'Boda Principal' },
      };
    });
  });

  it('muestra el CTA y navega al asistente de creación', () => {
    cy.visit('/home');
    cy.closeDiagnostic();

    cy.contains('label', 'Evento:', { timeout: 10000 }).should('be.visible');
    cy.contains('button', 'Crear nuevo evento', { timeout: 10000 })
      .should('be.visible')
      .click();

    cy.location('pathname', { timeout: 10000 }).should('include', '/crear-evento');
    cy.contains('Paso 1 de 2', { timeout: 10000 }).should('be.visible');

    cy.window().then((win) => {
      const state = win.history?.state || {};
      expect(state?.usr?.source).to.eq('multi_event_cta');
    });
  });
});
