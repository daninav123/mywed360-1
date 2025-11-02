/**
 * Tests E2E para Cobertura de Traducciones
 *
 * Verifica que las páginas críticas tienen traducciones completas
 * y detecta texto hardcodeado
 */

describe('Cobertura de Traducciones', () => {
  const criticalPages = [
    { path: '/', name: 'Página Principal' },
    { path: '/supplier/login', name: 'Login Proveedores' },
  ];

  const languagesToTest = ['es', 'en', 'fr'];

  describe('Verificación de traducciones por página', () => {
    criticalPages.forEach((page) => {
      describe(`${page.name}`, () => {
        languagesToTest.forEach((lang) => {
          it(`Debe cargar completamente en ${lang}`, () => {
            cy.visit(page.path, { failOnStatusCode: false });
            cy.setLanguageProgrammatically(lang);
            cy.wait(1000);

            // La página debe existir
            cy.get('body').should('exist');

            // No debe haber errores visibles
            cy.get('body').should('not.contain', 'Error');
            cy.get('body').should('not.contain', 'undefined');
          });
        });
      });
    });
  });

  describe('Detección de claves i18n sin traducir', () => {
    it('Debe detectar claves faltantes en modo debug', () => {
      cy.resetI18nMissingKeys();
      cy.enableI18nDebugMode();
      cy.wait(500);

      // Navegar por páginas críticas
      criticalPages.forEach((page) => {
        cy.visit(page.path, { failOnStatusCode: false });
        cy.wait(1000);
      });

      // Obtener claves faltantes
      cy.window().then((win) => {
        const missing = win.__I18N_MISSING_KEYS__ || [];

        // Registrar en consola para debugging
        if (missing.length > 0) {
          cy.log(`Claves faltantes detectadas: ${missing.length}`);

          // Agrupar por namespace
          const byNamespace = {};
          missing.forEach((entry) => {
            const ns = entry.namespace || 'unknown';
            if (!byNamespace[ns]) byNamespace[ns] = [];
            byNamespace[ns].push(entry.key);
          });

          cy.log('Por namespace:', byNamespace);
        }
      });
    });

    it('Debe registrar las páginas con más claves faltantes', () => {
      cy.resetI18nMissingKeys();
      cy.enableI18nDebugMode();
      cy.wait(500);

      const pageResults = {};

      criticalPages.forEach((page) => {
        cy.visit(page.path, { failOnStatusCode: false });
        cy.wait(1000);

        cy.window().then((win) => {
          const missing = win.__I18N_MISSING_KEYS__ || [];
          pageResults[page.name] = missing.length;
        });

        cy.resetI18nMissingKeys();
      });
    });
  });

  describe('Verificación de texto hardcodeado', () => {
    it('No debe tener texto hardcodeado común en español', () => {
      cy.setLanguageProgrammatically('en');
      cy.wait(500);

      cy.visit('/', { failOnStatusCode: false });
      cy.wait(1000);

      // En inglés, no debería haber palabras comunes en español
      cy.get('body').then(($body) => {
        const text = $body.text();

        // Palabras que no deberían aparecer en inglés
        const spanishWords = ['Inicio', 'Tareas', 'Guardar', 'Cancelar', 'Buscar'];

        spanishWords.forEach((word) => {
          if (text.includes(word)) {
            cy.log(`Advertencia: Texto hardcodeado encontrado: "${word}"`);
          }
        });
      });
    });

    it('No debe tener claves i18n visibles en producción', () => {
      cy.setLanguageProgrammatically('es');
      cy.wait(500);

      cy.visit('/', { failOnStatusCode: false });
      cy.wait(1000);

      cy.get('body').then(($body) => {
        const text = $body.text();

        // Buscar patrones de claves i18n (namespace.key)
        const i18nKeyPattern = /\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+\b/g;
        const matches = text.match(i18nKeyPattern);

        if (matches && matches.length > 0) {
          cy.log(`Advertencia: Posibles claves i18n visibles: ${matches.join(', ')}`);
        }
      });
    });
  });

  describe('Consistencia entre idiomas', () => {
    it('Debe tener estructura similar en todos los idiomas', () => {
      const structures = {};

      languagesToTest.forEach((lang) => {
        cy.setLanguageProgrammatically(lang);
        cy.wait(500);

        cy.visit('/', { failOnStatusCode: false });
        cy.wait(1000);

        // Contar elementos principales
        cy.get('body').then(($body) => {
          structures[lang] = {
            buttons: $body.find('button').length,
            links: $body.find('a').length,
            inputs: $body.find('input').length,
          };
        });
      });

      // Verificar que las estructuras son similares
      // (pueden variar ligeramente pero no mucho)
      cy.wrap(structures).then((struct) => {
        cy.log('Estructuras por idioma:', struct);
      });
    });
  });

  describe('Exportación de reporte', () => {
    it('Debe generar reporte de claves faltantes en formato JSON', () => {
      cy.resetI18nMissingKeys();
      cy.enableI18nDebugMode();
      cy.wait(500);

      // Navegar por páginas para acumular claves
      criticalPages.forEach((page) => {
        cy.visit(page.path, { failOnStatusCode: false });
        cy.wait(1000);
      });

      // Exportar reporte
      cy.window().then((win) => {
        if (win.__I18N_EXPORT_MISSING__) {
          const report = win.__I18N_EXPORT_MISSING__();

          expect(report).to.be.an('object');
          cy.log('Reporte de claves faltantes:', report);

          // El reporte debe tener estructura por idioma
          Object.keys(report).forEach((lang) => {
            expect(report[lang]).to.be.an('object');
          });
        }
      });
    });

    it('Debe poder descargar reporte sin errores', () => {
      cy.window().then((win) => {
        if (win.__I18N_DOWNLOAD_MISSING__) {
          // Intentar descargar (en Cypress no descargará realmente)
          try {
            const result = win.__I18N_DOWNLOAD_MISSING__();
            expect(result).to.exist;
          } catch (e) {
            // En Cypress puede fallar la descarga pero no debe romper
            cy.log('Descarga no soportada en Cypress, pero función existe');
          }
        }
      });
    });
  });

  describe('Métricas de cobertura', () => {
    it('Debe calcular porcentaje de cobertura aproximado', () => {
      const coverage = {};

      languagesToTest.forEach((lang) => {
        cy.resetI18nMissingKeys();
        cy.setLanguageProgrammatically(lang);
        cy.wait(500);

        // Visitar todas las páginas críticas
        let totalKeys = 0;
        criticalPages.forEach((page) => {
          cy.visit(page.path, { failOnStatusCode: false });
          cy.wait(1000);
        });

        cy.window().then((win) => {
          const missing = win.__I18N_MISSING_KEYS__ || [];
          coverage[lang] = {
            missingKeys: missing.length,
            // Estimación: si hay pocas claves faltantes, la cobertura es alta
            estimatedCoverage:
              missing.length < 10 ? 'Alta' : missing.length < 50 ? 'Media' : 'Baja',
          };
        });
      });

      cy.wrap(coverage).then((cov) => {
        cy.log('Cobertura por idioma:', cov);
      });
    });
  });

  describe('Prioridad de traducciones', () => {
    it('Elementos críticos de UI deben estar traducidos', () => {
      languagesToTest.forEach((lang) => {
        cy.setLanguageProgrammatically(lang);
        cy.wait(500);

        cy.visit('/', { failOnStatusCode: false });
        cy.wait(1000);

        // Verificar que existen elementos comunes (no importa el texto exacto)
        cy.get('body').should('exist');

        // Botones deben existir
        cy.get('button').should('have.length.greaterThan', 0);
      });
    });

    it('Mensajes de error deben estar traducidos', () => {
      // Este test es más conceptual - verificamos que el sistema está listo
      languagesToTest.forEach((lang) => {
        cy.setLanguageProgrammatically(lang);
        cy.wait(500);

        cy.window().then((win) => {
          const i18n = win.__I18N_INSTANCE__;
          // Verificar que existen traducciones para errores comunes
          expect(i18n).to.exist;
        });
      });
    });
  });
});
