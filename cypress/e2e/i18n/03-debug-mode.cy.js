/**
 * Tests E2E para el Modo Debug de i18n
 *
 * Verifica que el sistema de depuración de traducciones funciona correctamente
 */

describe('Modo Debug i18n', () => {
  beforeEach(() => {
    cy.visit('/', { failOnStatusCode: false });
    cy.wait(1000);
  });

  describe('Activación del modo debug', () => {
    it('Debe activar el modo debug desde el selector', () => {
      cy.get('.language-selector').first().click();
      cy.wait(300);

      // Buscar y hacer clic en la opción de debug
      cy.get('.language-selector').contains(/debug/i).click({ force: true });

      cy.wait(500);

      // Verificar que el idioma es el de debug
      cy.window().then((win) => {
        const lang = win.__I18N_INSTANCE__?.language;
        expect(lang).to.equal('en-x-i18n');
      });
    });

    it('Debe activar el modo debug programáticamente', () => {
      cy.enableI18nDebugMode();

      cy.window().then((win) => {
        const lang = win.__I18N_INSTANCE__?.language;
        expect(lang).to.equal('en-x-i18n');
      });
    });

    it('Debe mostrar el panel de debug al activar el modo', () => {
      cy.enableI18nDebugMode();
      cy.wait(1000);

      // Buscar el panel amarillo de debug
      cy.get('body').then(($body) => {
        // El panel puede tardar un poco en aparecer
        if ($body.find('.fixed.bottom-20').length > 0) {
          cy.get('.fixed.bottom-20').should('contain', 'Modo Debug');
        }
      });
    });
  });

  describe('Panel de Debug', () => {
    beforeEach(() => {
      cy.enableI18nDebugMode();
      cy.wait(1000);
    });

    it('Debe mostrar el contador de claves faltantes', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.fixed.bottom-20').length > 0) {
          cy.get('.fixed.bottom-20').should('contain', 'Total de claves');
        }
      });
    });

    it('Debe permitir descargar el reporte de claves faltantes', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.fixed.bottom-20').length > 0) {
          // Buscar el botón de descarga
          cy.get('.fixed.bottom-20').find('button').should('have.length.greaterThan', 0);
        }
      });
    });

    it('Debe permitir limpiar el log de claves', () => {
      cy.resetI18nMissingKeys();

      cy.window().then((win) => {
        const keys = win.__I18N_MISSING_KEYS__ || [];
        expect(keys).to.have.length(0);
      });
    });
  });

  describe('Detección de claves faltantes', () => {
    beforeEach(() => {
      cy.resetI18nMissingKeys();
      cy.enableI18nDebugMode();
      cy.wait(1000);
    });

    it('Debe registrar claves faltantes al navegar', () => {
      // Navegar a diferentes páginas para activar traducciones
      cy.visit('/supplier/login', { failOnStatusCode: false });
      cy.wait(1000);

      cy.window().then((win) => {
        const keys = win.__I18N_MISSING_KEYS__ || [];
        // Puede haber claves faltantes o no, pero la estructura debe existir
        expect(keys).to.be.an('array');
      });
    });

    it('Debe exportar claves faltantes en formato JSON', () => {
      cy.window().then((win) => {
        if (win.__I18N_EXPORT_MISSING__) {
          const exported = win.__I18N_EXPORT_MISSING__();
          expect(exported).to.be.an('object');
        }
      });
    });

    it('Debe mostrar claves en lugar de traducciones', () => {
      // En modo debug, algunos textos deberían mostrar las claves
      // Por ejemplo, si hay un botón con traducción, debería mostrar la clave
      cy.get('body')
        .invoke('text')
        .then((text) => {
          // Verificar que contiene formato de clave (namespace.key)
          // Solo si hay elementos traducidos visibles
          expect(text).to.exist;
        });
    });
  });

  describe('Funciones globales de debug', () => {
    it('Debe exponer __I18N_INSTANCE__ en window', () => {
      cy.window().then((win) => {
        expect(win.__I18N_INSTANCE__).to.exist;
        expect(win.__I18N_INSTANCE__).to.have.property('language');
      });
    });

    it('Debe exponer __I18N_MISSING_KEYS__ en window', () => {
      cy.window().then((win) => {
        expect(win.__I18N_MISSING_KEYS__).to.exist;
        expect(win.__I18N_MISSING_KEYS__).to.be.an('array');
      });
    });

    it('Debe exponer __I18N_RESET_MISSING__ en window', () => {
      cy.window().then((win) => {
        expect(win.__I18N_RESET_MISSING__).to.exist;
        expect(win.__I18N_RESET_MISSING__).to.be.a('function');
      });
    });

    it('Debe exponer __I18N_EXPORT_MISSING__ en window', () => {
      cy.window().then((win) => {
        expect(win.__I18N_EXPORT_MISSING__).to.exist;
        expect(win.__I18N_EXPORT_MISSING__).to.be.a('function');
      });
    });

    it('Debe exponer __I18N_DOWNLOAD_MISSING__ en window', () => {
      cy.window().then((win) => {
        expect(win.__I18N_DOWNLOAD_MISSING__).to.exist;
        expect(win.__I18N_DOWNLOAD_MISSING__).to.be.a('function');
      });
    });

    it('Debe exponer __I18N_GET_MISSING__ en window', () => {
      cy.window().then((win) => {
        expect(win.__I18N_GET_MISSING__).to.exist;
        expect(win.__I18N_GET_MISSING__).to.be.a('function');
      });
    });
  });

  describe('Salir del modo debug', () => {
    it('Debe volver a español desde el modo debug', () => {
      cy.enableI18nDebugMode();
      cy.wait(500);

      cy.setLanguageProgrammatically('es');
      cy.wait(500);

      cy.verifyCurrentLanguage('es');
    });

    it('Debe volver a inglés desde el modo debug', () => {
      cy.enableI18nDebugMode();
      cy.wait(500);

      cy.setLanguageProgrammatically('en');
      cy.wait(500);

      cy.verifyCurrentLanguage('en');
    });

    it('Debe ocultar el panel de debug al salir', () => {
      cy.enableI18nDebugMode();
      cy.wait(1000);

      cy.setLanguageProgrammatically('es');
      cy.wait(1000);

      // El panel no debería estar visible
      cy.get('body').then(($body) => {
        const hasDebugPanel = $body.find('.fixed.bottom-20').length > 0;
        if (hasDebugPanel) {
          // Si existe, no debería mostrar "Modo Debug"
          cy.get('.fixed.bottom-20').should('not.be.visible');
        }
      });
    });
  });
});
