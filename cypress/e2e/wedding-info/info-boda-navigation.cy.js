/**
 * Test E2E: Navegación y Tabs en InfoBoda
 * Verifica la estructura de tabs y navegación entre secciones
 */

describe('InfoBoda - Navegación y Tabs', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
    cy.window().then((win) => {
      win.localStorage.setItem('userSession', JSON.stringify({
        token: 'test-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }));
    });
    cy.visit('http://localhost:5173/info-boda');
  });

  it('debe mostrar la página de información de boda', () => {
    cy.contains('Información de la Boda', { timeout: 10000 }).should('be.visible');
  });

  it('debe tener 4 tabs principales', () => {
    cy.contains('📝 Información Básica').should('be.visible');
    cy.contains('🎭 Visión y Estilo').should('be.visible');
    cy.contains('👥 Especificaciones Proveedores').should('be.visible');
    cy.contains('📸 Imágenes Web').should('be.visible');
  });

  it('debe mostrar tab de información básica por defecto', () => {
    cy.contains('📝 Información Básica')
      .should('have.class', 'bg-blue-500');
  });

  it('debe cambiar a tab de visión y estilo', () => {
    cy.contains('🎭 Visión y Estilo').click();
    cy.contains('🎭 Visión y Estilo')
      .should('have.class', 'bg-purple-500');
    cy.wait(500);
  });

  it('debe cambiar a tab de especificaciones proveedores', () => {
    cy.contains('👥 Especificaciones Proveedores').click();
    cy.contains('👥 Especificaciones Proveedores')
      .should('have.class', 'bg-green-500');
    cy.wait(500);
  });

  it('debe cambiar a tab de imágenes web', () => {
    cy.contains('📸 Imágenes Web').click();
    cy.contains('📸 Imágenes Web')
      .should('have.class', 'bg-pink-500');
    cy.contains('Imágenes de la Web').should('be.visible');
  });

  it('debe mostrar indicador de progreso', () => {
    cy.contains('Progreso de Información').should('be.visible');
    cy.get('[class*="bg-gradient-to-r"]').should('exist');
  });

  it('debe mostrar secciones organizadas en información básica', () => {
    cy.contains('💭 Visión General').should('be.visible');
    cy.contains('💑 Información Esencial').should('be.visible');
    cy.contains('⛪ Ceremonia').should('be.visible');
    cy.contains('🍽️ Banquete y Fiesta').should('be.visible');
    cy.contains('🎨 Estilo y Diseño').should('be.visible');
    cy.contains('👥 Perfil de Invitados').should('be.visible');
    cy.contains('🚌 Logística para Invitados').should('be.visible');
    cy.contains('💕 Vuestra Historia').should('be.visible');
    cy.contains('📋 Información Adicional').should('be.visible');
  });

  it('debe tener botón de guardar flotante', () => {
    cy.contains('💾 Guardar Cambios').should('be.visible');
  });
});
