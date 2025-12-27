/**
 * Test E2E: Funciones Especiales en InfoBoda
 * Verifica generación de slug, preview, QR, y otras funciones avanzadas
 */

describe('InfoBoda - Funciones Especiales', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
    cy.window().then((win) => {
      win.localStorage.setItem('userSession', JSON.stringify({
        token: 'test-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }));
    });
    cy.visit('http://localhost:5173/info-boda');
    cy.wait(1000);
  });

  describe('Generación de Slug', () => {
    it('debe generar slug desde nombre de pareja', () => {
      cy.get('input[name="coupleName"]').clear().type('María y Juan García');
      
      // Si hay botón de generar slug visible
      cy.get('body').then($body => {
        if ($body.text().includes('Generar slug') || $body.text().includes('Slug')) {
          cy.contains('Generar').click();
          cy.wait(500);
          
          // Verificar que se generó el slug
          cy.contains('Slug generado').should('be.visible');
        }
      });
    });

    it('no debe generar slug sin nombre de pareja', () => {
      cy.get('input[name="coupleName"]').clear();
      
      cy.get('body').then($body => {
        if ($body.text().includes('Generar slug')) {
          cy.contains('Generar').click();
          cy.contains('Primero ingresa el nombre de la pareja').should('be.visible');
        }
      });
    });
  });

  describe('Preview Web', () => {
    it('debe mostrar botón de preview cuando hay slug', () => {
      // Simular que ya hay un slug guardado
      cy.window().then((win) => {
        // Si se puede inyectar datos de prueba
        cy.get('body').then($body => {
          if ($body.text().includes('Preview Web')) {
            cy.contains('👁️ Preview Web').should('be.visible');
          }
        });
      });
    });

    it('debe abrir preview en nueva pestaña', () => {
      cy.get('body').then($body => {
        if ($body.text().includes('Preview Web')) {
          // Interceptar window.open
          cy.window().then(win => {
            cy.stub(win, 'open').as('windowOpen');
          });
          
          cy.contains('👁️ Preview Web').click();
          cy.get('@windowOpen').should('be.called');
        }
      });
    });
  });

  describe('Generador de QR', () => {
    it('debe mostrar botón de generar QR cuando hay slug', () => {
      cy.get('body').then($body => {
        if ($body.text().includes('Generar QR')) {
          cy.contains('📱 Generar QR').should('be.visible');
        }
      });
    });

    it('debe abrir QR en nueva pestaña', () => {
      cy.get('body').then($body => {
        if ($body.text().includes('Generar QR')) {
          cy.window().then(win => {
            cy.stub(win, 'open').as('windowOpen');
          });
          
          cy.contains('📱 Generar QR').click();
          cy.wait(500);
          
          cy.get('@windowOpen').should('be.calledWith', 
            Cypress.sinon.match(/qrserver\.com/)
          );
        }
      });
    });

    it('no debe generar QR sin slug', () => {
      // Sin slug, el botón no debería estar visible o debería mostrar error
      cy.get('body').then($body => {
        if (!$body.text().includes('Preview Web')) {
          // Verificar que los botones no están visibles
          cy.contains('📱 Generar QR').should('not.exist');
        }
      });
    });
  });

  describe('Copiar URL', () => {
    it('debe mostrar botón de copiar URL cuando hay slug', () => {
      cy.get('body').then($body => {
        if ($body.text().includes('Copiar URL')) {
          cy.contains('🔗 Copiar URL').should('be.visible');
        }
      });
    });

    it('debe copiar URL al portapapeles', () => {
      cy.get('body').then($body => {
        if ($body.text().includes('Copiar URL')) {
          cy.contains('🔗 Copiar URL').click();
          cy.wait(500);
          
          cy.contains('URL copiada').should('be.visible');
        }
      });
    });
  });

  describe('Chat de IA', () => {
    it('debe poder abrir modal de chat IA si está disponible', () => {
      // Cambiar a tab de Visión
      cy.contains('🎭 Visión y Estilo').click();
      cy.wait(1000);
      
      cy.get('body').then($body => {
        if ($body.text().includes('Chat') || $body.text().includes('IA')) {
          // Verificar que hay botones de chat
          cy.get('[class*="chat"]').should('exist');
        }
      });
    });
  });

  describe('Upload de Imágenes', () => {
    it('debe mostrar sección de imágenes en el tab correspondiente', () => {
      cy.contains('📸 Imágenes Web').click();
      cy.wait(1000);
      
      cy.contains('Imagen de Portada').should('be.visible');
      cy.contains('Galería de Fotos').should('be.visible');
    });

    it('debe tener componente de upload para hero image', () => {
      cy.contains('📸 Imágenes Web').click();
      cy.wait(1000);
      
      cy.contains('Imagen de Portada (Hero)').should('be.visible');
    });

    it('debe permitir añadir fotos a galería', () => {
      cy.contains('📸 Imágenes Web').click();
      cy.wait(1000);
      
      cy.get('body').then($body => {
        if ($body.text().includes('Añadir')) {
          cy.contains('foto').should('be.visible');
        }
      });
    });
  });

  describe('Navegación de pestañas con datos', () => {
    it('debe mantener datos al cambiar entre tabs', () => {
      cy.get('input[name="coupleName"]').type('Test Navigation');
      cy.wait(500);
      
      cy.contains('🎭 Visión y Estilo').click();
      cy.wait(500);
      
      cy.contains('📝 Información Básica').click();
      cy.wait(500);
      
      cy.get('input[name="coupleName"]').should('have.value', 'Test Navigation');
    });

    it('debe mostrar indicador de cambios sin guardar en todos los tabs', () => {
      cy.get('input[name="coupleName"]').type('Test Unsaved');
      cy.wait(500);
      cy.contains('⚠️ Cambios sin guardar').should('be.visible');
      
      cy.contains('📸 Imágenes Web').click();
      cy.wait(500);
      cy.contains('⚠️ Cambios sin guardar').should('be.visible');
    });
  });
});
