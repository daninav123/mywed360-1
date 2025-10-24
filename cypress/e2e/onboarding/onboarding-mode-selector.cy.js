/// <reference types="Cypress" />

describe('Onboarding - Selector de modo', () => {
  beforeEach(() => {
    Cypress.env('STUB_FIRESTORE', true);
    cy.window().then((win) => {
      win.localStorage.clear();
    });
    cy.loginToLovenda('owner.selector@lovenda.test');
    cy.window().then((win) => {
      const profileRaw = win.localStorage.getItem('MaLoveApp_user_profile');
      const profile = profileRaw ? JSON.parse(profileRaw) : {};
      const ownerProfile = {
        ...profile,
        uid: 'owner-selector',
        role: 'owner',
        emailVerified: true,
      };
      win.localStorage.setItem('MaLoveApp_user_profile', JSON.stringify(ownerProfile));
      const onboardingKey = `onboarding_completed_${ownerProfile.uid}`;
      win.localStorage.removeItem(onboardingKey);
      win.localStorage.removeItem('forceOnboarding');
      win.localStorage.removeItem('maloveapp_cached_weddings');
      win.localStorage.removeItem('maloveapp_active_wedding');
      win.localStorage.removeItem('maloveapp_active_wedding');
      win.localStorage.removeItem('maloveapp_active_wedding_name');
      win.localStorage.setItem('forceOnboarding', '1');
      win.__MOCK_WEDDING__ = { weddings: [], activeWedding: null };
    });
  });

  it('permite elegir el tutorial clásico desde el selector', () => {
    cy.visit('/home', {
      onBeforeLoad(win) {
        win.__ENABLE_ONBOARDING_TEST__ = true;
        try {
          win.localStorage.setItem('forceOnboarding', '1');
          win.localStorage.removeItem('maloveapp_cached_weddings');
          win.localStorage.removeItem('maloveapp_active_wedding');
          win.localStorage.removeItem('maloveapp_active_wedding');
          win.localStorage.removeItem('maloveapp_active_wedding_name');
          win.__MOCK_WEDDING__ = { weddings: [], activeWedding: null };
        } catch (_) {}
      },
    });
    cy.closeDiagnostic();

    cy.contains('Como quieres empezar?', { timeout: 20000 }).should('be.visible');
    cy.contains('button', 'Tutorial guiado clasico').should('be.visible').click();

    cy.contains('Bienvenido a MaLoveApp', { timeout: 15000 }).should('be.visible');
    cy.contains('Datos bsicos').should('be.visible');
  });

  it('permite abrir el flujo con IA desde el selector', () => {
    cy.visit('/home', {
      onBeforeLoad(win) {
        win.__ENABLE_ONBOARDING_TEST__ = true;
        try {
          win.localStorage.setItem('forceOnboarding', '1');
          win.localStorage.removeItem('maloveapp_cached_weddings');
          win.localStorage.removeItem('maloveapp_active_wedding');
          win.localStorage.removeItem('maloveapp_active_wedding');
          win.localStorage.removeItem('maloveapp_active_wedding_name');
          win.__MOCK_WEDDING__ = { weddings: [], activeWedding: null };
        } catch (_) {}
      },
    });
    cy.closeDiagnostic();

    cy.contains('Como quieres empezar?', { timeout: 20000 }).should('be.visible');
    cy.contains('button', 'Crear boda con IA (beta)').should('be.visible').click();

    cy.url().should('include', '/crear-evento');
    cy.contains('Crear evento con IA (beta)', { timeout: 15000 }).should('be.visible');
    cy.contains('Paso 1 de 2').should('be.visible');
  });
});
