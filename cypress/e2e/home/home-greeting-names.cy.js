/// <reference types="Cypress" />

describe('Home - saludo muestra nombres actualizados', () => {
  const initialAlias = 'danielnavarrocampos';
  const initialCoupleName = 'Dani y Pepa';
  const updatedUserName = 'Daniel & Josefa';
  const updatedCoupleName = 'Daniel y Pepa Actualizados';

  beforeEach(() => {
    Cypress.env('STUB_FIRESTORE', true);
    cy.window().then((win) => {
      win.localStorage.clear();
    });
    cy.loginToLovenda('owner.perfil@lovenda.test');
    cy.window().then((win) => {
      const baseProfile = {
        uid: 'owner-profile-e2e',
        role: 'owner',
        email: 'owner.perfil@lovenda.test',
        emailVerified: true,
        name: initialAlias,
        displayName: initialAlias,
      };
      win.localStorage.setItem('MyWed360_user_profile', JSON.stringify(baseProfile));
      win.localStorage.setItem('mywed360_active_wedding', 'w-profile');
      win.localStorage.setItem('lovenda_active_wedding', 'w-profile');
      win.localStorage.setItem('mywed360_active_wedding_name', initialCoupleName);
      win.__MOCK_WEDDING__ = {
        weddings: [
          {
            id: 'w-profile',
            name: 'Boda Perfil',
            coupleName: initialCoupleName,
            couple: initialCoupleName,
            brideAndGroom: initialCoupleName,
            role: 'owner',
          },
        ],
        activeWedding: { id: 'w-profile', name: 'Boda Perfil' },
      };
    });
  });

  it('refresca el saludo tras guardar nombres de usuario y pareja', () => {
    cy.visit('/home');
    cy.closeDiagnostic();

    cy.contains('h1.page-title', `Bienvenidos, ${initialCoupleName}`, { timeout: 10000 }).should(
      'be.visible'
    );
    cy.contains('h1.page-title', initialAlias).should('not.exist');

    cy.visit('/perfil');
    cy.closeDiagnostic();

    cy.get('input[name="name"]').clear().type(updatedUserName);
    cy.contains('h2', 'Información de la cuenta', { matchCase: false })
      .parent()
      .within(() => {
        cy.contains('button', 'Guardar').click({ force: true });
      });

    cy.get('input[name="coupleName"]').clear().type(updatedCoupleName);
    cy.contains('h2', 'Información de la boda', { matchCase: false })
      .parent()
      .within(() => {
        cy.contains('button', 'Guardar').click({ force: true });
      });

    cy.window().then((win) => {
      try {
        const profileRaw = win.localStorage.getItem('MyWed360_user_profile');
        const profile = profileRaw ? JSON.parse(profileRaw) : {};
        const updatedProfile = {
          ...profile,
          name: updatedUserName,
          displayName: updatedUserName,
        };
        win.localStorage.setItem('MyWed360_user_profile', JSON.stringify(updatedProfile));
      } catch {}

      const updatedWedding = {
        id: 'w-profile',
        name: 'Boda Perfil',
        coupleName: updatedCoupleName,
        couple: updatedCoupleName,
        brideAndGroom: updatedCoupleName,
        role: 'owner',
      };
      win.__MOCK_WEDDING__ = {
        weddings: [updatedWedding],
        activeWedding: { id: 'w-profile', name: 'Boda Perfil' },
      };
      try {
        win.localStorage.setItem('mywed360_active_wedding_name', updatedCoupleName);
      } catch {}
    });

    cy.visit('/home');
    cy.closeDiagnostic();

    cy.contains('h1.page-title', `Bienvenidos, ${updatedCoupleName}`, { timeout: 10000 }).should(
      'be.visible'
    );
    cy.contains('h1.page-title', initialAlias).should('not.exist');
  });
});
