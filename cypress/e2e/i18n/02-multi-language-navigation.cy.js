/**
 * Tests E2E para Navegación Multi-Idioma
 *
 * Verifica que todas las páginas principales funcionan en múltiples idiomas
 */

describe('Navegación Multi-Idioma', () => {
  const languages = [
    { code: 'es', name: 'Spanish', locale: 'es' },
    { code: 'en', name: 'English', locale: 'en' },
    { code: 'fr', name: 'French', locale: 'fr' },
  ];

  const pagesToTest = [
    { path: '/', name: 'Página Principal' },
    { path: '/supplier/login', name: 'Login Proveedores' },
  ];

  languages.forEach((language) => {
    describe(`Idioma: ${language.name}`, () => {
      beforeEach(() => {
        // Configurar idioma antes de cada test
        cy.visit('/', { failOnStatusCode: false });
        cy.setLanguageProgrammatically(language.locale);
        cy.wait(500);
      });

      it(`Debe cargar la aplicación en ${language.name}`, () => {
        cy.verifyCurrentLanguage(language.locale);
        cy.get('body').should('exist');
      });

      pagesToTest.forEach((page) => {
        it(`Debe mostrar ${page.name} correctamente en ${language.name}`, () => {
          cy.visit(page.path, { failOnStatusCode: false });
          cy.wait(1000);

          // Verificar que no hay errores críticos
          cy.get('body').should('exist');

          // Verificar que el idioma sigue siendo el correcto
          cy.verifyCurrentLanguage(language.locale);
        });
      });

      it(`Debe cambiar dinámicamente el contenido al seleccionar ${language.name}`, () => {
        // Primero en español
        cy.setLanguageProgrammatically('es');
        cy.wait(500);

        // Capturar texto de ejemplo
        cy.get('body')
          .invoke('text')
          .then((spanishText) => {
            // Cambiar al idioma de prueba
            cy.setLanguageProgrammatically(language.locale);
            cy.wait(500);

            // El texto debería ser diferente (a menos que sea español)
            cy.get('body')
              .invoke('text')
              .then((translatedText) => {
                if (language.locale !== 'es') {
                  expect(translatedText).to.not.equal(spanishText);
                }
              });
          });
      });

      it(`Debe mantener ${language.name} al navegar entre páginas`, () => {
        cy.verifyCurrentLanguage(language.locale);

        // Visitar diferentes páginas
        cy.visit('/supplier/login', { failOnStatusCode: false });
        cy.wait(500);
        cy.verifyCurrentLanguage(language.locale);

        cy.visit('/', { failOnStatusCode: false });
        cy.wait(500);
        cy.verifyCurrentLanguage(language.locale);
      });
    });
  });

  describe('Cambio de idioma en tiempo real', () => {
    beforeEach(() => {
      cy.visit('/', { failOnStatusCode: false });
      cy.wait(1000);
    });

    it('Debe cambiar de español a inglés sin recargar', () => {
      cy.setLanguageProgrammatically('es');
      cy.wait(500);

      cy.setLanguageProgrammatically('en');
      cy.wait(500);

      cy.verifyCurrentLanguage('en');
    });

    it('Debe cambiar de inglés a francés sin recargar', () => {
      cy.setLanguageProgrammatically('en');
      cy.wait(500);

      cy.setLanguageProgrammatically('fr');
      cy.wait(500);

      cy.verifyCurrentLanguage('fr');
    });

    it('Debe cambiar entre todos los idiomas principales', () => {
      const langs = ['es', 'en', 'fr', 'de', 'it'];

      langs.forEach((lang) => {
        cy.setLanguageProgrammatically(lang);
        cy.wait(300);
        cy.verifyCurrentLanguage(lang);
      });
    });
  });

  describe('Compatibilidad de navegadores', () => {
    it('Debe funcionar en diferentes viewports', () => {
      const viewports = [
        { name: 'desktop', width: 1920, height: 1080 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'mobile', width: 375, height: 667 },
      ];

      viewports.forEach((viewport) => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit('/', { failOnStatusCode: false });
        cy.wait(500);

        cy.setLanguageProgrammatically('en');
        cy.wait(500);
        cy.verifyCurrentLanguage('en');
      });
    });
  });
});
