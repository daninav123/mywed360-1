/// <reference types="Cypress" />

// Cobertura asistente IA: fallback contextual con datos del evento activo

describe('Asistente IA - Fallback contextual', () => {
  beforeEach(() => {
    Cypress.env('STUB_FIRESTORE', true);
    cy.window().then((win) => {
      win.localStorage.clear();
    });
    cy.loginToLovenda('owner.chat@lovenda.test');
    cy.window().then((win) => {
      const profileRaw = win.localStorage.getItem('MyWed360_user_profile');
      const profile = profileRaw ? JSON.parse(profileRaw) : {};
      const ownerProfile = {
        ...profile,
        uid: 'owner-chat-fallback',
        role: 'owner',
        emailVerified: true,
      };
      win.localStorage.setItem('MyWed360_user_profile', JSON.stringify(ownerProfile));
      win.localStorage.setItem('mywed360_active_wedding', 'evt-1');
      win.localStorage.setItem('lovenda_active_wedding', 'evt-1');
      win.__MOCK_WEDDING__ = {
        weddings: [
          {
            id: 'evt-1',
            name: 'Evento Tech',
            eventType: 'evento',
            location: 'Barcelona',
            weddingDate: '2026-09-20',
            preferences: { style: 'boho' },
            eventProfile: { guestCountRange: '200-plus', formalityLevel: 'formal' },
          },
        ],
        activeWedding: { id: 'evt-1', name: 'Evento Tech' },
      };
    });
    cy.intercept('POST', '**/api/ai/parse-dialog', { forceNetworkError: true }).as('aiFallback');
  });

  it('responde con copy offline incluyendo detalles del evento', () => {
    cy.visit('/home');
    cy.closeDiagnostic();

    cy.get('button[aria-label="Abrir chat"]', { timeout: 10000 }).click();
    cy.get('input[aria-label="Mensaje de chat"]', { timeout: 10000 }).type(
      'Necesito ayuda con el presupuesto'
    );
    cy.get('button[aria-label="Enviar mensaje"]').click();

    cy.contains('tu evento de estilo Boho en Barcelona', { timeout: 10000 }).should('be.visible');
  });
});
