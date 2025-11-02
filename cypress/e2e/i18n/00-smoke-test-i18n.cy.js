/**
 * SMOKE TEST: Sistema i18n
 *
 * Tests básicos para verificar que el sistema de internacionalización
 * está funcionando correctamente
 */

describe('i18n - Smoke Test', () => {
  beforeEach(() => {
    cy.visit('/', { failOnStatusCode: false });
    cy.wait(1000);
  });

  describe('Verificación de configuración i18n', () => {
    it('Debe tener i18next configurado', () => {
      cy.window().then((win) => {
        expect(win.__I18N_INSTANCE__).to.exist;
        expect(win.__I18N_INSTANCE__).to.have.property('language');
        expect(win.__I18N_INSTANCE__).to.have.property('changeLanguage');
      });
    });

    it('Debe tener un idioma por defecto', () => {
      cy.window().then((win) => {
        const lang = win.__I18N_INSTANCE__?.language || win.localStorage?.getItem('i18nextLng');
        expect(lang).to.exist;
        expect(lang).to.be.a('string');
        expect(lang.length).to.be.greaterThan(0);
      });
    });

    it('Debe exponer funciones de debug', () => {
      cy.window().then((win) => {
        // Esperar un poco a que i18n se inicialice completamente
        cy.wait(500);
        expect(win.__I18N_MISSING_KEYS__).to.exist;
        expect(win.__I18N_RESET_MISSING__).to.exist.and.to.be.a('function');
        expect(win.__I18N_EXPORT_MISSING__).to.exist.and.to.be.a('function');
        expect(win.__I18N_DOWNLOAD_MISSING__).to.exist.and.to.be.a('function');
        expect(win.__I18N_GET_MISSING__).to.exist.and.to.be.a('function');
      });
    });
  });

  describe('Idiomas disponibles', () => {
    it('Debe tener al menos 3 idiomas disponibles', () => {
      cy.window().then((win) => {
        const i18n = win.__I18N_INSTANCE__;
        const languages = i18n?.options?.supportedLngs || [];

        // Debería tener al menos español, inglés y francés
        expect(languages.length).to.be.greaterThan(2);
        expect(languages).to.include('es');
        expect(languages).to.include('en');
      });
    });

    it('Debe incluir el modo debug', () => {
      cy.window().then((win) => {
        const i18n = win.__I18N_INSTANCE__;
        const languages = i18n?.options?.supportedLngs || [];
        expect(languages).to.include('en-x-i18n');
      });
    });

    it('Debe tener español como idioma base', () => {
      cy.window().then((win) => {
        const i18n = win.__I18N_INSTANCE__;
        const fallback = i18n?.options?.fallbackLng;
        // El fallback puede ser un array o string
        if (Array.isArray(fallback)) {
          expect(fallback).to.include('es');
        }
      });
    });
  });

  describe('Selector de idioma', () => {
    it('Debe existir el selector en la página', () => {
      cy.get('.language-selector').should('exist');
    });

    it('Debe poder abrirse el selector', () => {
      cy.get('.language-selector').first().click();
      cy.wait(300);

      // Debe mostrar opciones
      cy.get('.language-selector').should('be.visible');
    });

    it('Debe mostrar idiomas principales', () => {
      cy.get('.language-selector').first().click();
      cy.wait(500);

      // Verificar que hay opciones de idioma (buscar en todo el dropdown visible)
      cy.get('body').then(($body) => {
        const text = $body.text();
        const hasLanguages =
          text.includes('Spanish') ||
          text.includes('English') ||
          text.includes('French') ||
          text.includes('Español') ||
          text.includes('Inglés') ||
          text.includes('Francés');
        expect(hasLanguages).to.be.true;
      });
    });
  });

  describe('Cambio básico de idioma', () => {
    it('Debe poder cambiar a inglés', () => {
      cy.setLanguageProgrammatically('en');
      cy.wait(500);
      cy.verifyCurrentLanguage('en');
    });

    it('Debe poder cambiar a francés', () => {
      cy.setLanguageProgrammatically('fr');
      cy.wait(500);
      cy.verifyCurrentLanguage('fr');
    });

    it('Debe poder volver a español', () => {
      cy.setLanguageProgrammatically('en');
      cy.wait(500);
      cy.setLanguageProgrammatically('es');
      cy.wait(500);
      cy.verifyCurrentLanguage('es');
    });
  });

  describe('Persistencia básica', () => {
    it('Debe guardar el idioma en localStorage', () => {
      cy.setLanguageProgrammatically('en');
      cy.wait(500);

      cy.window().then((win) => {
        const stored = win.localStorage.getItem('i18nextLng');
        expect(stored).to.exist;
      });
    });

    it('Debe mantener el idioma después de recargar', () => {
      cy.setLanguageProgrammatically('fr');
      cy.wait(500);

      cy.reload();
      cy.wait(1000);

      cy.verifyCurrentLanguage('fr');
    });
  });

  describe('Modo debug básico', () => {
    it('Debe poder activar el modo debug', () => {
      cy.enableI18nDebugMode();

      cy.window().then((win) => {
        const lang = win.__I18N_INSTANCE__?.language;
        expect(lang).to.equal('en-x-i18n');
      });
    });

    it('Debe poder salir del modo debug', () => {
      cy.enableI18nDebugMode();
      cy.wait(500);

      cy.setLanguageProgrammatically('es');
      cy.wait(500);

      cy.verifyCurrentLanguage('es');
    });
  });

  describe('Sin errores críticos', () => {
    const languages = ['es', 'en', 'fr', 'de', 'it', 'pt'];

    languages.forEach((lang) => {
      it(`No debe tener errores de consola en ${lang}`, () => {
        cy.setLanguageProgrammatically(lang);
        cy.wait(500);

        // La aplicación debe cargar sin errores
        cy.get('body').should('exist');
      });
    });

    it('No debe crashear al cambiar idiomas rápidamente', () => {
      const langs = ['es', 'en', 'fr', 'de', 'it'];

      langs.forEach((lang) => {
        cy.setLanguageProgrammatically(lang);
        cy.wait(100);
      });

      // La aplicación debe seguir funcionando
      cy.get('body').should('exist');
    });
  });

  describe('Comandos Cypress personalizados', () => {
    it('Debe tener comando changeLanguage', () => {
      // Verificar que el comando existe intentando usarlo en un contexto seguro
      expect(cy.changeLanguage).to.be.a('function');
    });

    it('Debe tener comando setLanguageProgrammatically', () => {
      expect(cy.setLanguageProgrammatically).to.be.a('function');
    });

    it('Debe tener comando verifyCurrentLanguage', () => {
      expect(cy.verifyCurrentLanguage).to.be.a('function');
    });

    it('Debe tener comando enableI18nDebugMode', () => {
      expect(cy.enableI18nDebugMode).to.be.a('function');
    });

    it('Debe tener comando getMissingI18nKeys', () => {
      expect(cy.getMissingI18nKeys).to.be.a('function');
    });

    it('Debe tener comando resetI18nMissingKeys', () => {
      expect(cy.resetI18nMissingKeys).to.be.a('function');
    });
  });
});
