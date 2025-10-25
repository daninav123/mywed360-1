/// <reference types="cypress" />

const languagesToAudit = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
];

const navFlows = [
  { key: 'navigation.home', path: '/home' },
  { key: 'navigation.tasks', path: '/tasks' },
  { key: 'navigation.finance', path: '/finance' },
  { key: 'navigation.more', path: '/more' },
];

const getLabelForKey = (win, key, lng) => {
  const i18n = win.__I18N_INSTANCE__ || win.i18next || win.i18n;
  if (!i18n) {
    throw new Error('No se encontró la instancia de i18n en window');
  }
  const fixedT = i18n.getFixedT(lng);
  return fixedT ? fixedT(key, { defaultValue: key }) : key;
};

const assertNoMissingTranslations = (win, targetLng) => {
  const getMissing =
    win.__I18N_GET_MISSING__ ||
    (() => (Array.isArray(win.__I18N_MISSING_KEYS__) ? win.__I18N_MISSING_KEYS__ : []));
  const missing = (getMissing() || []).filter((entry) =>
    (entry.languages || []).some((lng) => typeof lng === 'string' && lng.startsWith(targetLng))
  );

  if (missing.length) {
    const formatted = missing
      .map((entry) => `${entry.namespace || 'common'}:${entry.key}`)
      .join(', ');
    throw new Error(`[i18n ${targetLng}] Faltan traducciones para: ${formatted}`);
  }
};

const openProfileFromUserMenu = () => {
  cy.get('[data-user-menu] > div')
    .first()
    .click({ force: true });
  cy.get('[data-user-menu]')
    .find('a[href="/perfil"]')
    .should('be.visible')
    .click({ force: true });
  cy.location('pathname', { timeout: 10000 }).should('include', '/perfil');
  cy.get('main', { timeout: 10000 }).should('be.visible');
};

describe('🌐 Auditoría de i18n - Integración completa', () => {
  beforeEach(() => {
    cy.viewport(1400, 900);
  });

  languagesToAudit.forEach(({ code, name }) => {
    it(`verifica traducciones para ${name}`, () => {
      cy.loginToLovenda(`i18n-${code}@maloveapp.com`);

      cy.window().then((win) => {
        win.localStorage.setItem('i18nextLng', code);
        win.__I18N_RESET_MISSING__?.();
        const i18n = win.__I18N_INSTANCE__ || win.i18next || win.i18n;
        if (!i18n) {
          throw new Error('Instancia i18n no disponible');
        }

        return new Cypress.Promise((resolve, reject) => {
          i18n
            .changeLanguage(code)
            .then(() => resolve())
            .catch(reject);
        });
      });

      cy.document()
        .its('documentElement')
        .should('have.attr', 'lang', code);

      cy.get('main', { timeout: 15000 }).should('be.visible');

      cy.get('nav button').should('have.length.at.least', navFlows.length);

      navFlows.forEach(({ key, path }, index) => {
        cy.get('nav button')
          .eq(index)
          .as('navButton')
          .then(($btn) => {
            const text = $btn.text().trim();
            return cy
              .window()
              .then((win) => {
                const expected = getLabelForKey(win, key, code);
                expect(text).to.eq(expected);
              })
              .then(() => {
                cy.wrap($btn).scrollIntoView();
                cy.wrap($btn).click({ force: true });
              });
          });

        cy.location('pathname', { timeout: 10000 }).should('include', path);
        cy.get('main', { timeout: 10000 }).should('be.visible');
      });

      openProfileFromUserMenu();

      cy.window().then((win) => {
        assertNoMissingTranslations(win, code);
      });
    });
  });

  it('permite activar el modo de auditoría i18n sin traducciones', () => {
    cy.loginToLovenda('i18n-debug@maloveapp.com');

    cy.window().then((win) => {
      win.localStorage.setItem('i18nextLng', 'i18n');
      win.__I18N_RESET_MISSING__?.();
      const i18n = win.__I18N_INSTANCE__ || win.i18next || win.i18n;
      if (!i18n) {
        throw new Error('Instancia i18n no disponible');
      }

      return new Cypress.Promise((resolve, reject) => {
        i18n
          .changeLanguage('i18n')
          .then(() => resolve())
          .catch(reject);
      });
    });

    cy.document()
      .its('documentElement')
      .should('have.attr', 'lang', 'i18n');

    cy.get('main', { timeout: 15000 }).should('be.visible');

    openProfileFromUserMenu();

    cy.window().then((win) => {
      const t = (key) => getLabelForKey(win, key, 'i18n');
      const rawLabel = t('navigation.profile');
      expect(rawLabel).to.match(/navigation\.profile|profile\.|Perfil/i);
    });
  });
});
