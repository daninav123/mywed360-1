/// <reference types="Cypress" />

// Flujo 2: Creación de evento con IA (wizard multi-evento)

describe('Flujo 2 - Wizard creación de evento', () => {
  beforeEach(() => {
    Cypress.env('STUB_FIRESTORE', true);
    cy.window().then((win) => {
      win.localStorage.clear();
    });
    cy.loginToLovenda('owner.e2e@lovenda.test');
    cy.window().then((win) => {
      const profileRaw = win.localStorage.getItem('MyWed360_user_profile');
      const profile = profileRaw ? JSON.parse(profileRaw) : {};
      const ownerProfile = {
        ...profile,
        uid: 'owner-e2e',
        role: 'owner',
        emailVerified: true,
      };
      win.localStorage.setItem('MyWed360_user_profile', JSON.stringify(ownerProfile));
      win.localStorage.removeItem('mywed360_active_wedding');
      win.localStorage.removeItem('lovenda_active_wedding');
      win.__MOCK_WEDDING__ = { weddings: [], activeWedding: null };
    });
  });

  it('recorre los dos pasos del wizard y conserva los datos', () => {
    cy.visit('/create-wedding-ai');
    cy.closeDiagnostic();

    cy.contains('Crear evento con IA', { timeout: 15000 }).should('be.visible');
    cy.contains('Paso 1 de 2').should('be.visible');

    cy.get('input[name="coupleName"]').type('Laura & Diego');
    cy.get('input[name="weddingDate"]').type('2026-06-15');
    cy.get('input[name="location"]').type('Madrid, España');
    cy.get('select[name="eventType"]').select('evento');
    cy.get('select[name="style"]').select('boho');

    cy.contains('button', 'Siguiente').click();

    cy.contains('Paso 2 de 2', { timeout: 10000 }).should('be.visible');
    cy.contains('Perfil del evento').should('exist');
    cy.get('select[name="guestCountRange"]').select('200-plus');
    cy.get('select[name="formalityLevel"]').select('formal');
    cy.get('select[name="ceremonyType"]').should('not.exist');

    cy.get('select[name="eventType"]').select('boda');
    cy.get('select[name="ceremonyType"]').should('be.visible').select('religiosa');
    cy.get('textarea[name="notes"]').type('Notas creadas desde test e2e.');

    cy.contains('button', 'Volver').click();
    cy.get('input[name="coupleName"]').should('have.value', 'Laura & Diego');
    cy.contains('button', 'Siguiente').click();
    cy.contains('button', 'Crear boda').should('be.visible');
  });
});
