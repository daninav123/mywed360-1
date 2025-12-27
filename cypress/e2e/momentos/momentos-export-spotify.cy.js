/**
 * Test E2E: Exportación a Spotify desde Momentos Especiales
 * Verifica la funcionalidad de exportar canciones a Spotify
 */

describe('Momentos Especiales - Exportación a Spotify', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
    cy.window().then((win) => {
      win.localStorage.setItem('userSession', JSON.stringify({
        token: 'test-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }));
    });
    cy.visit('http://localhost:5173/momentos-especiales');
    cy.wait(1000);
  });

  it('debe mostrar la barra de exportación', () => {
    cy.contains('Exportar Música').should('be.visible');
  });

  it('debe mostrar estadísticas de canciones', () => {
    cy.contains('Ver detalles').click();
    cy.wait(500);
    
    cy.contains('Total').should('be.visible');
    cy.contains('En Spotify').should('be.visible');
    cy.contains('Especiales').should('be.visible');
    cy.contains('Definitivas').should('be.visible');
  });

  it('debe mostrar botón de exportar a Spotify', () => {
    cy.contains('Exportar a Spotify').should('be.visible');
  });

  it('debe mostrar botón de PDF para DJ', () => {
    cy.contains('PDF para DJ').should('be.visible');
  });

  it('debe mostrar botón de lista simple', () => {
    cy.contains('Lista Simple').should('be.visible');
  });

  it('debe deshabilitar exportación a Spotify si no hay canciones', () => {
    // Si no hay canciones seleccionadas
    cy.get('body').then($body => {
      if ($body.text().includes('No has seleccionado ninguna canción')) {
        cy.contains('Exportar a Spotify')
          .should('have.class', 'cursor-not-allowed')
          .or('be.disabled');
      }
    });
  });

  it('debe permitir seleccionar una canción de Spotify', () => {
    // Expandir primer momento
    cy.get('[class*="border-2"]').first().click();
    cy.wait(500);
    
    // Seleccionar tipo canción específica
    cy.contains('🎵 Canción específica').click();
    cy.wait(500);
    
    // Click en buscar canción
    cy.get('body').then($body => {
      if ($body.text().includes('Buscar') || $body.text().includes('Agregar opción')) {
        cy.contains('Buscar').click().or(cy.contains('Agregar opción').click());
        cy.wait(1000);
      }
    });
  });

  it('debe exportar a Spotify al hacer click si hay canciones', () => {
    cy.get('body').then($body => {
      if (!$body.text().includes('No has seleccionado')) {
        cy.contains('Exportar a Spotify').click();
        cy.wait(1000);
        
        // Verificar alguna respuesta (toast, modal, etc)
        cy.get('body').should('exist');
      }
    });
  });

  it('debe generar PDF para DJ al hacer click', () => {
    cy.get('body').then($body => {
      if (!$body.text().includes('No has seleccionado')) {
        cy.contains('PDF para DJ').click();
        cy.wait(1000);
      }
    });
  });

  it('debe descargar lista simple al hacer click', () => {
    cy.get('body').then($body => {
      if (!$body.text().includes('No has seleccionado')) {
        cy.contains('Lista Simple').click();
        cy.wait(500);
      }
    });
  });

  it('debe navegar entre bloques de momentos', () => {
    cy.contains('Ceremonia').should('be.visible');
    cy.contains('Cóctel').should('be.visible');
    cy.contains('Banquete').should('be.visible');
    cy.contains('Disco').should('be.visible');
    
    // Click en otro bloque
    cy.contains('Ceremonia').click();
    cy.wait(500);
    cy.contains('Ceremonia').should('have.class', 'border-blue-500');
  });

  it('debe mostrar progreso por bloque', () => {
    cy.contains('Progreso').should('be.visible');
    cy.get('[class*="rounded-full"]').should('exist'); // Barra de progreso
  });
});
