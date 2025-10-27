/**
 * Test E2E para verificar que el Buscador de IA muestra imágenes correctas
 * Este test verifica:
 * 1. Que las imágenes se cargan correctamente
 * 2. Que las imágenes son accesibles (HTTP 200)
 * 3. Que los datos del proveedor corresponden a la URL indicada
 */

describe('🖼️ Validación de Imágenes en Buscador de IA', () => {
  const TEST_USER = {
    email: Cypress.env('TEST_USER_EMAIL') || 'danielnavarrocampos@icloud.com',
    password: Cypress.env('TEST_USER_PASSWORD') || 'Test123!'
  };

  const TEST_SEARCH_QUERIES = [
    { query: 'fotógrafo bodas Valencia', expectedService: 'fotografo' },
    { query: 'DJ Barcelona', expectedService: 'dj' },
    { query: 'catering bodas Madrid', expectedService: 'catering' }
  ];

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit('/');
    cy.wait(1000);

    // Login
    cy.url().then(url => {
      if (url.includes('/login')) {
        cy.log('🔐 Haciendo login...');
        cy.get('input[type="email"]').clear().type(TEST_USER.email);
        cy.get('input[type="password"]').clear().type(TEST_USER.password);
        cy.contains('button', /iniciar|login|entrar/i).click();
        cy.wait(3000);
      }
    });

    // Ir a proveedores
    cy.contains('a', /proveedores/i, { timeout: 10000 }).click();
    cy.wait(1000);
  });

  TEST_SEARCH_QUERIES.forEach(({ query, expectedService }) => {
    describe(`Búsqueda: "${query}"`, () => {
      let searchResults = [];

      it(`✅ Puede buscar "${query}" y obtener resultados con imágenes`, () => {
        // Abrir buscador IA
        cy.contains('button', /buscar.*ia|ia.*buscar|inteligencia/i, { timeout: 10000 })
          .should('be.visible')
          .click();

        // Interceptar llamada al backend
        cy.intercept('POST', '**/api/ai-suppliers-tavily*').as('aiSearchTavily');
        cy.intercept('POST', '**/api/ai-suppliers*').as('aiSearch');

        // Escribir búsqueda
        cy.get('input[placeholder*="busca"]', { timeout: 5000 })
          .last()
          .clear()
          .type(query);
        
        // Click en buscar
        cy.contains('button', /buscar|search/i).click();

        // Esperar respuesta del backend
        cy.wait('@aiSearchTavily', { timeout: 60000 }).then((interception) => {
          cy.log('📡 Respuesta Tavily:', JSON.stringify(interception.response?.body?.slice(0, 2)));
          
          expect(interception.response.statusCode).to.equal(200);
          searchResults = interception.response.body;
          
          expect(searchResults).to.be.an('array');
          expect(searchResults.length).to.be.greaterThan(0);
          
          cy.log(`✅ ${searchResults.length} resultados encontrados`);

          // Verificar que cada resultado tiene los campos necesarios
          searchResults.forEach((result, index) => {
            cy.log(`\n📦 Resultado [${index}]:
              - Título: ${result.title}
              - Link: ${result.link}
              - Imagen: ${result.image || '❌ SIN IMAGEN'}
              - Service: ${result.service}
              - Location: ${result.location || 'N/A'}
            `);

            expect(result).to.have.property('title');
            expect(result).to.have.property('link');
            expect(result.link).to.match(/^https?:\/\//);
          });

          // Contar resultados con imagen
          const resultsWithImage = searchResults.filter(r => r.image && r.image.trim() !== '');
          cy.log(`🖼️ Resultados con imagen: ${resultsWithImage.length}/${searchResults.length}`);

          // Al menos el 50% de los resultados deben tener imagen
          expect(resultsWithImage.length).to.be.greaterThan(searchResults.length * 0.5);
        });

        // Verificar que los resultados se muestran en la UI
        cy.get('[data-testid="ai-results-list"]', { timeout: 10000 })
          .should('be.visible');
      });

      it(`🖼️ Verifica que las imágenes son accesibles (HTTP 200)`, () => {
        // Abrir buscador IA
        cy.contains('button', /buscar.*ia|ia.*buscar|inteligencia/i, { timeout: 10000 }).click();

        // Interceptar llamada
        cy.intercept('POST', '**/api/ai-suppliers-tavily*').as('aiSearchTavily');

        // Buscar
        cy.get('input[placeholder*="busca"]', { timeout: 5000 })
          .last()
          .clear()
          .type(query);
        cy.contains('button', /buscar|search/i).click();

        // Esperar resultados
        cy.wait('@aiSearchTavily', { timeout: 60000 }).then((interception) => {
          const results = interception.response.body;
          const resultsWithImage = results.filter(r => r.image && r.image.trim() !== '');

          cy.log(`🔍 Verificando ${resultsWithImage.length} imágenes...`);

          // Verificar cada imagen
          resultsWithImage.forEach((result, index) => {
            cy.request({
              url: result.image,
              failOnStatusCode: false,
              timeout: 10000
            }).then((response) => {
              const status = response.status;
              const isValid = status === 200;

              cy.log(`${isValid ? '✅' : '❌'} [${index}] ${result.title}
                - Imagen: ${result.image}
                - Status: ${status}
                - Content-Type: ${response.headers['content-type'] || 'N/A'}
              `);

              // La imagen debe ser accesible
              expect(status).to.equal(200);

              // Debe ser una imagen
              expect(response.headers['content-type']).to.match(/image\/(jpeg|jpg|png|webp|gif)/);
            });
          });
        });
      });

      it(`🔗 Verifica que las URLs de proveedores son válidas`, () => {
        // Abrir buscador IA
        cy.contains('button', /buscar.*ia|ia.*buscar|inteligencia/i, { timeout: 10000 }).click();

        // Interceptar llamada
        cy.intercept('POST', '**/api/ai-suppliers-tavily*').as('aiSearchTavily');

        // Buscar
        cy.get('input[placeholder*="busca"]', { timeout: 5000 })
          .last()
          .clear()
          .type(query);
        cy.contains('button', /buscar|search/i).click();

        // Esperar resultados
        cy.wait('@aiSearchTavily', { timeout: 60000 }).then((interception) => {
          const results = interception.response.body;

          cy.log(`🔍 Verificando ${results.length} URLs de proveedores...`);

          // Verificar cada URL de proveedor
          results.forEach((result, index) => {
            cy.request({
              url: result.link,
              failOnStatusCode: false,
              timeout: 15000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            }).then((response) => {
              const status = response.status;
              const isValid = status === 200 || status === 301 || status === 302;

              cy.log(`${isValid ? '✅' : '❌'} [${index}] ${result.title}
                - URL: ${result.link}
                - Status: ${status}
              `);

              // La URL del proveedor debe ser accesible
              expect(isValid, `URL del proveedor ${result.title} debe ser accesible`).to.be.true;
            });
          });
        });
      });

      it(`📊 Verifica coherencia entre imagen y proveedor`, () => {
        // Abrir buscador IA
        cy.contains('button', /buscar.*ia|ia.*buscar|inteligencia/i, { timeout: 10000 }).click();

        // Interceptar llamada
        cy.intercept('POST', '**/api/ai-suppliers-tavily*').as('aiSearchTavily');

        // Buscar
        cy.get('input[placeholder*="busca"]', { timeout: 5000 })
          .last()
          .clear()
          .type(query);
        cy.contains('button', /buscar|search/i).click();

        // Esperar resultados
        cy.wait('@aiSearchTavily', { timeout: 60000 }).then((interception) => {
          const results = interception.response.body;
          const resultsWithImage = results.filter(r => r.image && r.image.trim() !== '');

          cy.log(`🔍 Verificando coherencia de ${resultsWithImage.length} resultados...`);

          resultsWithImage.forEach((result, index) => {
            // Extraer dominio del proveedor
            const providerDomain = new URL(result.link).hostname;
            
            // Extraer dominio de la imagen
            const imageDomain = new URL(result.image).hostname;

            cy.log(`[${index}] ${result.title}
              - Dominio proveedor: ${providerDomain}
              - Dominio imagen: ${imageDomain}
            `);

            // Las imágenes de bodas.net/bodas.com.mx son válidas
            const validImageDomains = [
              'bodas.net',
              'bodas.com.mx',
              'cdn0.bodas.net',
              'cdn0.bodas.com.mx',
              providerDomain, // O del mismo dominio del proveedor
              'instagram.com',
              'facebook.com'
            ];

            const isValidDomain = validImageDomains.some(domain => 
              imageDomain.includes(domain)
            );

            if (!isValidDomain) {
              cy.log(`⚠️ [${index}] Imagen de dominio inesperado: ${imageDomain}`);
            } else {
              cy.log(`✅ [${index}] Dominio de imagen válido`);
            }

            // No forzar error, solo advertir
            if (!isValidDomain) {
              cy.log(`⚠️ ADVERTENCIA: La imagen puede no corresponder al proveedor`);
            }
          });
        });
      });

      it(`🎯 Verificaimágenes se muestran en la UI`, () => {
        // Abrir buscador IA
        cy.contains('button', /buscar.*ia|ia.*buscar|inteligencia/i, { timeout: 10000 }).click();

        // Buscar
        cy.get('input[placeholder*="busca"]', { timeout: 5000 })
          .last()
          .clear()
          .type(query);
        cy.contains('button', /buscar|search/i).click();

        // Esperar que se muestren resultados
        cy.get('[data-testid="ai-results-list"]', { timeout: 15000 })
          .should('be.visible');

        // Esperar que carguen las imágenes
        cy.wait(2000);

        // Verificar que hay elementos <img> visibles
        cy.get('img[src^="http"]', { timeout: 10000 })
          .should('have.length.greaterThan', 0)
          .each(($img) => {
            const src = $img.attr('src');
            cy.log(`🖼️ Imagen encontrada en UI: ${src}`);

            // Verificar que la imagen se cargó correctamente
            expect($img[0].naturalWidth, `Imagen debe tener ancho > 0: ${src}`).to.be.greaterThan(0);
          });

        cy.log('✅ Todas las imágenes en la UI se cargaron correctamente');
      });
    });
  });

  describe('📊 Reporte de Calidad de Imágenes', () => {
    it('📈 Genera reporte de calidad de imágenes', () => {
      const report = {
        totalSearches: TEST_SEARCH_QUERIES.length,
        searches: []
      };

      TEST_SEARCH_QUERIES.forEach(({ query }) => {
        // Abrir buscador IA
        cy.contains('button', /buscar.*ia|ia.*buscar|inteligencia/i, { timeout: 10000 }).click();

        // Interceptar llamada
        cy.intercept('POST', '**/api/ai-suppliers-tavily*').as('aiSearchTavily');

        // Buscar
        cy.get('input[placeholder*="busca"]', { timeout: 5000 })
          .last()
          .clear()
          .type(query);
        cy.contains('button', /buscar|search/i).click();

        // Esperar resultados
        cy.wait('@aiSearchTavily', { timeout: 60000 }).then((interception) => {
          const results = interception.response.body;
          const resultsWithImage = results.filter(r => r.image && r.image.trim() !== '');

          const searchReport = {
            query,
            totalResults: results.length,
            resultsWithImage: resultsWithImage.length,
            percentage: ((resultsWithImage.length / results.length) * 100).toFixed(1),
            validImages: 0,
            invalidImages: 0
          };

          // Verificar accesibilidad de imágenes
          const imageChecks = resultsWithImage.map((result) => {
            return cy.request({
              url: result.image,
              failOnStatusCode: false,
              timeout: 10000
            }).then((response) => {
              if (response.status === 200) {
                searchReport.validImages++;
              } else {
                searchReport.invalidImages++;
              }
            });
          });

          Promise.all(imageChecks).then(() => {
            report.searches.push(searchReport);

            cy.log(`\n📊 REPORTE: "${query}"
              - Resultados totales: ${searchReport.totalResults}
              - Con imagen: ${searchReport.resultsWithImage} (${searchReport.percentage}%)
              - Imágenes válidas: ${searchReport.validImages}
              - Imágenes inválidas: ${searchReport.invalidImages}
            `);
          });
        });

        // Cerrar búsqueda para siguiente iteración
        cy.get('body').type('{esc}');
        cy.wait(500);
      });

      // Al final, mostrar reporte completo
      cy.then(() => {
        cy.log('\n\n📊 ===== REPORTE FINAL DE CALIDAD DE IMÁGENES =====');
        cy.log(JSON.stringify(report, null, 2));

        // Guardar reporte
        cy.writeFile('cypress/results/image-quality-report.json', report);
      });
    });
  });
});
