/**
 * Tests E2E para Persistencia de Idioma
 *
 * Verifica que el idioma seleccionado se mantiene entre sesiones
 * y diferentes páginas de la aplicación
 */

describe('Persistencia de Idioma', () => {
  beforeEach(() => {
    // Limpiar localStorage antes de cada test
    cy.clearLocalStorage();
    cy.visit('/', { failOnStatusCode: false });
    cy.wait(1000);
  });

  describe('Persistencia en localStorage', () => {
    it('Debe guardar el idioma en localStorage al cambiar', () => {
      cy.setLanguageProgrammatically('en');
      cy.wait(500);

      cy.window().then((win) => {
        const stored = win.localStorage.getItem('i18nextLng');
        expect(stored).to.equal('en');
      });
    });

    it('Debe cargar el idioma guardado al iniciar', () => {
      // Establecer idioma en localStorage manualmente
      cy.window().then((win) => {
        win.localStorage.setItem('i18nextLng', 'fr');
      });

      // Recargar la página
      cy.reload();
      cy.wait(1000);

      // Verificar que cargó el idioma guardado
      cy.verifyCurrentLanguage('fr');
    });

    it('Debe mantener el idioma después de múltiples recargas', () => {
      cy.setLanguageProgrammatically('de');
      cy.wait(500);

      // Primera recarga
      cy.reload();
      cy.wait(1000);
      cy.verifyCurrentLanguage('de');

      // Segunda recarga
      cy.reload();
      cy.wait(1000);
      cy.verifyCurrentLanguage('de');
    });

    it('Debe usar español por defecto si no hay idioma guardado', () => {
      cy.clearLocalStorage('i18nextLng');
      cy.reload();
      cy.wait(1000);

      cy.window().then((win) => {
        const lang = win.__I18N_INSTANCE__?.language;
        // Debería ser español o el idioma del navegador
        expect(lang).to.match(/^(es|en)/);
      });
    });
  });

  describe('Persistencia entre páginas', () => {
    const pages = ['/', '/supplier/login'];

    it('Debe mantener español al navegar entre páginas', () => {
      cy.setLanguageProgrammatically('es');
      cy.wait(500);

      pages.forEach((page) => {
        cy.visit(page, { failOnStatusCode: false });
        cy.wait(500);
        cy.verifyCurrentLanguage('es');
      });
    });

    it('Debe mantener inglés al navegar entre páginas', () => {
      cy.setLanguageProgrammatically('en');
      cy.wait(500);

      pages.forEach((page) => {
        cy.visit(page, { failOnStatusCode: false });
        cy.wait(500);
        cy.verifyCurrentLanguage('en');
      });
    });

    it('Debe mantener francés al navegar entre páginas', () => {
      cy.setLanguageProgrammatically('fr');
      cy.wait(500);

      pages.forEach((page) => {
        cy.visit(page, { failOnStatusCode: false });
        cy.wait(500);
        cy.verifyCurrentLanguage('fr');
      });
    });
  });

  describe('Persistencia con diferentes idiomas', () => {
    const languages = ['es', 'en', 'fr', 'de', 'it', 'pt'];

    languages.forEach((lang) => {
      it(`Debe persistir ${lang} después de recargar`, () => {
        cy.setLanguageProgrammatically(lang);
        cy.wait(500);

        cy.reload();
        cy.wait(1000);

        cy.verifyCurrentLanguage(lang);
      });
    });
  });

  describe('Sincronización entre tabs/ventanas', () => {
    it('Debe actualizar el idioma en localStorage', () => {
      cy.setLanguageProgrammatically('en');
      cy.wait(500);

      // Verificar que está en localStorage
      cy.window().then((win) => {
        const stored = win.localStorage.getItem('i18nextLng');
        expect(stored).to.equal('en');
      });

      // Cambiar a otro idioma
      cy.setLanguageProgrammatically('fr');
      cy.wait(500);

      // Verificar que se actualizó
      cy.window().then((win) => {
        const stored = win.localStorage.getItem('i18nextLng');
        expect(stored).to.equal('fr');
      });
    });
  });

  describe('Recuperación de errores', () => {
    it('Debe usar español si el idioma guardado es inválido', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('i18nextLng', 'invalid-lang');
      });

      cy.reload();
      cy.wait(1000);

      cy.window().then((win) => {
        const lang = win.__I18N_INSTANCE__?.language;
        // Debería caer en el fallback (español)
        expect(lang).to.match(/^es/);
      });
    });

    it('Debe manejar localStorage corrupto', () => {
      cy.window().then((win) => {
        // Intentar guardar algo inválido
        try {
          win.localStorage.setItem('i18nextLng', null);
        } catch (e) {
          // Ignorar error
        }
      });

      cy.reload();
      cy.wait(1000);

      // La aplicación no debería crashear
      cy.get('body').should('exist');
    });
  });

  describe('Cambio múltiple de idiomas', () => {
    it('Debe manejar cambios rápidos de idioma', () => {
      const languages = ['es', 'en', 'fr', 'de', 'it'];

      languages.forEach((lang) => {
        cy.setLanguageProgrammatically(lang);
        cy.wait(200);
      });

      // El último idioma debe persistir
      cy.verifyCurrentLanguage('it');

      cy.reload();
      cy.wait(1000);
      cy.verifyCurrentLanguage('it');
    });

    it('Debe mantener consistencia después de muchos cambios', () => {
      // Cambiar de idioma varias veces
      for (let i = 0; i < 10; i++) {
        const lang = i % 2 === 0 ? 'es' : 'en';
        cy.setLanguageProgrammatically(lang);
        cy.wait(100);
      }

      // Verificar que el estado es consistente
      cy.window().then((win) => {
        const storedLang = win.localStorage.getItem('i18nextLng');
        const currentLang = win.__I18N_INSTANCE__?.language;
        expect(storedLang).to.equal(currentLang);
      });
    });
  });

  describe('Modo debug persistencia', () => {
    it('Debe recordar que estaba en modo debug', () => {
      cy.enableI18nDebugMode();
      cy.wait(500);

      cy.reload();
      cy.wait(1000);

      cy.window().then((win) => {
        const lang = win.__I18N_INSTANCE__?.language;
        expect(lang).to.equal('en-x-i18n');
      });
    });

    it('Debe salir del modo debug si se cambia el idioma', () => {
      cy.enableI18nDebugMode();
      cy.wait(500);

      cy.setLanguageProgrammatically('es');
      cy.wait(500);

      cy.reload();
      cy.wait(1000);

      cy.verifyCurrentLanguage('es');
    });
  });
});
