/// <reference types="Cypress" />

// Cobertura adicional Flujo 2: CTA multi-evento en header
const OWNER_UID = 'owner-multi-cta';
const OWNER_EMAIL = 'owner.multi@lovenda.test';
const MULTI_EVENT_WEDDINGS = [
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
];

const buildStubStore = (uid, weddings, activeId) => ({
  users: {
    [uid]: {
      weddings,
      activeWeddingId: activeId || (weddings[0]?.id || ''),
    },
  },
});

describe('Flujo 2 - CTA multi-evento', () => {
  beforeEach(() => {
    Cypress.env('STUB_FIRESTORE', true);
  });

  it('muestra el CTA y navega al asistente de creación', () => {
    const stubStore = buildStubStore(OWNER_UID, MULTI_EVENT_WEDDINGS, 'w1');

    cy.visit('/home', {
      onBeforeLoad(win) {
        const mockUser = {
          uid: OWNER_UID,
          email: OWNER_EMAIL,
          displayName: 'Usuario Test Cypress',
          role: 'owner',
        };
        const ownerProfile = {
          id: OWNER_UID,
          uid: OWNER_UID,
          email: OWNER_EMAIL,
          role: 'owner',
          emailVerified: true,
          name: 'Owner Multi CTA',
        };

        win.localStorage.clear();
        win.localStorage.setItem('userEmail', OWNER_EMAIL);
        win.localStorage.setItem('isLoggedIn', 'true');
        win.localStorage.setItem('lovenda_user', JSON.stringify(mockUser));
        win.localStorage.setItem('mywed360_user', JSON.stringify(mockUser));
        win.localStorage.setItem('mywed360_login_email', OWNER_EMAIL);
        win.localStorage.setItem('MyWed360_user_profile', JSON.stringify(ownerProfile));
        win.localStorage.setItem('mywed360_active_wedding', 'w1');
        win.localStorage.setItem('lovenda_active_wedding', 'w1');
        win.localStorage.setItem('lovenda_stub_weddings_enabled', 'true');
        win.localStorage.setItem('__lovenda_stub_weddings_store__', JSON.stringify(stubStore));
        win.dispatchEvent(new CustomEvent('lovenda:stub-weddings-updated'));
      },
    });

    cy.closeDiagnostic();

    // Desde julio 2024 el selector de evento se oculta en /home,
    // validamos el contexto multi-evento a partir del WeddingContext real.
    cy.window().should((win) => {
      const weddings = win.weddingContext?.weddings || [];
      expect(weddings, 'eventos disponibles en la cuenta multi-evento').to.have.length.greaterThan(1);
    });

    cy.contains('button', 'Crear nuevo evento', { timeout: 10000 })
      .should('be.visible')
      .click();

    cy.location('pathname', { timeout: 10000 }).should('include', '/crear-evento');
    cy.contains('Paso 1 de 2', { timeout: 10000 }).should('be.visible');

    cy.window().should((win) => {
      const state = win.history?.state || {};
      expect(state?.usr?.source).to.eq('multi_event_cta');
    });
  });
});
