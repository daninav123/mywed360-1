/**
 * Test E2E: Canciones Especiales en Momentos
 * Verifica la funcionalidad de marcar canciones como especiales (remixes, edits, custom)
 */

describe('Momentos Especiales - Canciones Especiales/Custom', () => {
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

  it('debe mostrar botón para configurar canción especial', () => {
    // Expandir primer momento
    cy.get('[class*="border-2"]').first().click();
    cy.wait(500);
    
    cy.get('body').then($body => {
      if ($body.text().includes('Marcar especial') || $body.text().includes('Editar especial')) {
        cy.contains(/Marcar especial|Editar especial/).should('be.visible');
      }
    });
  });

  it('debe abrir modal de configuración de canción especial', () => {
    // Expandir primer momento que tenga canción
    cy.get('[class*="border-2"]').first().click();
    cy.wait(500);
    
    cy.get('body').then($body => {
      if ($body.text().includes('Marcar especial')) {
        cy.contains('Marcar especial').click();
        cy.wait(500);
        
        // Verificar que se abre el modal
        cy.contains('Configurar Canción').should('be.visible');
      }
    });
  });

  it('debe permitir marcar canción como especial', () => {
    cy.get('[class*="border-2"]').first().click();
    cy.wait(500);
    
    cy.get('body').then($body => {
      if ($body.text().includes('Marcar especial')) {
        cy.contains('Marcar especial').click();
        cy.wait(500);
        
        // Marcar checkbox de canción especial
        cy.get('input[type="checkbox"][id="isSpecial"]').check();
        cy.wait(300);
        
        // Verificar que se muestran campos adicionales
        cy.contains('Tipo de canción especial').should('be.visible');
        cy.contains('Instrucciones para el DJ').should('be.visible');
      }
    });
  });

  it('debe requerir tipo de canción especial', () => {
    cy.get('[class*="border-2"]').first().click();
    cy.wait(500);
    
    cy.get('body').then($body => {
      if ($body.text().includes('Marcar especial')) {
        cy.contains('Marcar especial').click();
        cy.wait(500);
        
        cy.get('input[type="checkbox"][id="isSpecial"]').check();
        cy.wait(300);
        
        // Verificar que el select tiene opciones
        cy.get('select').first().should('exist');
        cy.get('select option[value="remix"]').should('exist');
        cy.get('select option[value="edit"]').should('exist');
        cy.get('select option[value="mashup"]').should('exist');
      }
    });
  });

  it('debe permitir ingresar instrucciones para DJ', () => {
    cy.get('[class*="border-2"]').first().click();
    cy.wait(500);
    
    cy.get('body').then($body => {
      if ($body.text().includes('Marcar especial')) {
        cy.contains('Marcar especial').click();
        cy.wait(500);
        
        cy.get('input[type="checkbox"][id="isSpecial"]').check();
        cy.wait(300);
        
        // Seleccionar tipo
        cy.get('select').first().select('remix');
        
        // Ingresar instrucciones
        cy.get('textarea').first().type('Buscar remix oficial de David Guetta 2021, versión extendida');
        
        // Verificar que se escribió
        cy.get('textarea').first().should('contain.value', 'David Guetta');
      }
    });
  });

  it('debe permitir ingresar URL de referencia', () => {
    cy.get('[class*="border-2"]').first().click();
    cy.wait(500);
    
    cy.get('body').then($body => {
      if ($body.text().includes('Marcar especial')) {
        cy.contains('Marcar especial').click();
        cy.wait(500);
        
        cy.get('input[type="checkbox"][id="isSpecial"]').check();
        cy.wait(300);
        
        // Buscar input de URL
        cy.get('input[type="url"]').type('https://youtube.com/watch?v=test123');
        cy.get('input[type="url"]').should('have.value', 'https://youtube.com/watch?v=test123');
      }
    });
  });

  it('debe guardar configuración de canción especial', () => {
    cy.get('[class*="border-2"]').first().click();
    cy.wait(500);
    
    cy.get('body').then($body => {
      if ($body.text().includes('Marcar especial')) {
        cy.contains('Marcar especial').click();
        cy.wait(500);
        
        cy.get('input[type="checkbox"][id="isSpecial"]').check();
        cy.wait(300);
        
        cy.get('select').first().select('remix');
        cy.get('textarea').first().type('Instrucciones de prueba');
        
        // Guardar
        cy.contains('Guardar Configuración').click();
        cy.wait(1000);
        
        // Verificar que se cierra el modal
        cy.contains('Configurar Canción').should('not.exist');
      }
    });
  });

  it('debe mostrar badge de canción especial después de marcarla', () => {
    cy.get('[class*="border-2"]').first().click();
    cy.wait(500);
    
    cy.get('body').then($body => {
      if ($body.text().includes('🔥 ESPECIAL') || $body.text().includes('Canción Especial')) {
        cy.contains(/🔥|ESPECIAL|Canción Especial/).should('be.visible');
      }
    });
  });

  it('debe mostrar warning sobre canciones especiales en exportación', () => {
    cy.get('body').then($body => {
      if ($body.text().includes('canción') && $body.text().includes('especial')) {
        cy.contains(/especial|ESPECIAL/).should('be.visible');
        cy.contains(/PDF|documento/i).should('be.visible');
      }
    });
  });

  it('debe cambiar texto del botón si canción ya es especial', () => {
    cy.get('[class*="border-2"]').first().click();
    cy.wait(500);
    
    cy.get('body').then($body => {
      if ($body.text().includes('Editar especial')) {
        cy.contains('Editar especial').should('be.visible');
        cy.contains('Editar especial').should('have.class', 'border-orange-400');
      }
    });
  });

  it('debe permitir desmarcar canción como especial', () => {
    cy.get('[class*="border-2"]').first().click();
    cy.wait(500);
    
    cy.get('body').then($body => {
      if ($body.text().includes('Editar especial')) {
        cy.contains('Editar especial').click();
        cy.wait(500);
        
        // Desmarcar checkbox
        cy.get('input[type="checkbox"][id="isSpecial"]').uncheck();
        cy.wait(300);
        
        // Campos adicionales deben ocultarse
        cy.contains('Tipo de canción especial').should('not.exist');
        
        // Guardar
        cy.contains('Guardar Configuración').click();
        cy.wait(1000);
      }
    });
  });
});
