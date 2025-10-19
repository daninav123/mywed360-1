/// <reference types="Cypress" />

const OWNER_UID = 'owner-discovery-e2e';
const ACTIVE_WEDDING_ID = 'wedding-discovery-e2e';

function seedSession(win) {
  const email = 'owner.discovery@lovenda.test';
  const baseProfile = {
    uid: OWNER_UID,
    id: OWNER_UID,
    email,
    displayName: 'Owner Discovery',
    role: 'owner',
    weddings: [
      {
        id: ACTIVE_WEDDING_ID,
        name: 'Boda Descubrimiento',
        weddingDate: '2026-09-12',
        location: 'Madrid',
        progress: 10,
        active: true,
        subscription: { tier: 'free' },
      },
    ],
    activeWeddingId: ACTIVE_WEDDING_ID,
    subscription: { tier: 'free' },
    hasActiveWedding: true,
  };

  win.__ENABLE_ONBOARDING_TEST__ = true;
  win.localStorage.setItem('forceOnboarding', '1');
  win.localStorage.setItem('userEmail', email);
  win.localStorage.setItem('isLoggedIn', 'true');
  win.localStorage.setItem('mywed360_active_wedding', ACTIVE_WEDDING_ID);
  win.localStorage.setItem('lovenda_active_wedding', ACTIVE_WEDDING_ID);
  win.localStorage.setItem('MyWed360_user_profile', JSON.stringify(baseProfile));
  win.localStorage.setItem('lovenda_user', JSON.stringify(baseProfile));
  win.localStorage.setItem('mywed360_user', JSON.stringify(baseProfile));

  const store = {
    users: {
      [OWNER_UID]: {
        activeWeddingId: ACTIVE_WEDDING_ID,
        weddings: baseProfile.weddings,
      },
    },
  };
  win.localStorage.setItem('lovenda_local_weddings', JSON.stringify(store));
}

describe('Flujo 2 – Descubrimiento personalizado', () => {
  beforeEach(() => {
    Cypress.env('STUB_FIRESTORE', true);
    cy.visit('/home', {
      onBeforeLoad(win) {
        seedSession(win);
      },
    });
    cy.closeDiagnostic();
    cy.contains('Bienvenido a MyWed360!', { timeout: 20000 }).should('be.visible');
  });

  it('recorre y completa el tutorial de descubrimiento', () => {
    cy.contains('button', 'Siguiente').click();

    cy.contains('label', 'Nombres de la pareja')
      .parent()
      .find('input')
      .clear()
      .type('Laura y Diego');

    cy.get('input[type="date"]').clear().type('2026-06-15');
    cy.contains('label', 'Lugar de')
      .parent()
      .find('input')
      .clear()
      .type('Madrid Centro');

    cy.contains('button', 'Siguiente').click();

    cy.contains('h2', 'Gest', { matchCase: false }).should('be.visible');
    cy.contains('button', 'Siguiente').click();

    cy.contains('h2', 'Proveedores').should('be.visible');
    cy.contains('button', 'Siguiente').click();

    cy.contains('h2', 'Planific', { matchCase: false }).should('be.visible');
    cy.contains('button', 'Siguiente').click();

    cy.contains('h2', 'Dise', { matchCase: false }).should('be.visible');
    cy.contains('button', 'Siguiente').click();

    cy.contains('button', 'Finalizar').should('be.visible').click();

    cy.get('body').should('not.contain', 'Bienvenido a MyWed360!');
    cy.get('body', { timeout: 10000 }).should('not.contain', 'Comienza a planificar tu boda!');

    cy.window().then((win) => {
      expect(win.localStorage.getItem('forceOnboarding')).to.be.null;
      expect(
        win.localStorage.getItem(`onboarding_completed_${OWNER_UID}`)
      ).to.equal('true');
    });
  });
});
