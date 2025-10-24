/// <reference types="Cypress" />

// Flujo 2B: Asistente conversacional para crear eventos

describe('Flujo 2B - Asistente conversacional', () => {
  beforeEach(() => {
    Cypress.env('STUB_FIRESTORE', true);
    cy.window().then((win) => {
      win.localStorage.clear();
    });
    cy.loginToLovenda('owner.asistente@lovenda.test');
    cy.window().then((win) => {
      const profileRaw = win.localStorage.getItem('MaLoveApp_user_profile');
      const profile = profileRaw ? JSON.parse(profileRaw) : {};
      const ownerProfile = {
        ...profile,
        uid: 'owner-asistente',
        role: 'owner',
        emailVerified: true,
      };
      win.localStorage.setItem('MaLoveApp_user_profile', JSON.stringify(ownerProfile));
      win.localStorage.removeItem(`onboarding_completed_${ownerProfile.uid}`);
      win.localStorage.removeItem('forceOnboarding');
      win.localStorage.removeItem('maloveapp_active_wedding');
      win.localStorage.removeItem('maloveapp_active_wedding');
      win.__MOCK_WEDDING__ = { weddings: [], activeWedding: null };
    });
  });

  it('recorre la conversación hasta el resumen del evento', () => {
    cy.visit('/crear-evento-asistente');
    cy.closeDiagnostic();

    cy.contains('Asistente Conversacional', { timeout: 20000 }).should('be.visible');
    cy.contains('¿Qué tipo de evento quieres organizar?', { timeout: 20000 }).should('be.visible');

    cy.contains('button', 'Boda').click();
    cy.contains('¿Cómo se llama la pareja', { timeout: 15000 }).should('be.visible');

    cy.get('input[placeholder^="Escribe tu respuesta"]').type('Laura y Diego{enter}');
    cy.contains('¿Cuál es la fecha prevista?', { timeout: 15000 }).should('be.visible');

    cy.get('input[placeholder^="Escribe tu respuesta"]').type('2026-06-15{enter}');
    cy.contains('¿En qué ciudad o lugar te gustaría celebrarlo?', { timeout: 15000 }).should('be.visible');

    cy.get('input[placeholder^="Escribe tu respuesta"]').type('Madrid, España{enter}');
    cy.contains('¿Cuál encaja mejor?', { timeout: 15000 }).should('be.visible');

    cy.contains('button', 'Moderno').click();
    cy.contains('¿Cuántas personas calculas que asistirán?', { timeout: 15000 }).should('be.visible');

    cy.contains('button', 'Entre 100 y 200 personas').click();
    cy.contains('¿Qué nivel de formalidad imaginas?', { timeout: 15000 }).should('be.visible');

    cy.contains('button', 'Formal').click();
    cy.contains('Y sobre la ceremonia', { timeout: 15000 }).should('be.visible');

    cy.contains('button', 'Civil').click();
    cy.contains('¿Quieres añadir algún detalle importante', { timeout: 15000 }).should('be.visible');

    cy.contains('button', 'Saltar este detalle').click();

    cy.contains('Resumen del evento', { timeout: 15000 }).should('be.visible');
    cy.contains('Laura y Diego').should('be.visible');
    cy.contains('2026-06-15').should('be.visible');
    cy.contains('Madrid, España').should('be.visible');
    cy.contains('button', 'Crear evento').should('be.visible');
  });
});
