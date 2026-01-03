/// <reference types="cypress" />

describe('Editor de Diseño - Dimensiones del Canvas', () => {
  beforeEach(() => {
    // Login y navegar al editor
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Esperar a que cargue y navegar al editor
    cy.url().should('include', '/dashboard');
    cy.visit('/design-editor');
    cy.wait(2000);
  });

  it('Debe mostrar el selector de dimensiones', () => {
    // Verificar que existe el selector de tamaño
    cy.contains('Tamaño:').should('be.visible');
    cy.get('select').first().should('be.visible');
  });

  it('Debe cambiar dimensiones del canvas al seleccionar A6', () => {
    // Obtener dimensiones iniciales
    cy.window().then((win) => {
      const initialCanvas = win.fabricCanvas;
      expect(initialCanvas).to.exist;
      
      const initialWidth = initialCanvas.width;
      const initialHeight = initialCanvas.height;
      
      cy.log(`Dimensiones iniciales: ${initialWidth} x ${initialHeight}`);
      
      // Cambiar a A6
      cy.get('select').first().select('a6');
      cy.wait(500);
      
      // Verificar que las dimensiones cambiaron
      cy.window().then((win) => {
        const canvas = win.fabricCanvas;
        const newWidth = canvas.width;
        const newHeight = canvas.height;
        
        cy.log(`Nuevas dimensiones: ${newWidth} x ${newHeight}`);
        
        // A6 debe ser 744 x 1050
        expect(newWidth).to.equal(744);
        expect(newHeight).to.equal(1050);
        expect(newWidth).to.not.equal(initialWidth);
      });
    });
  });

  it('Debe cambiar dimensiones del canvas al seleccionar Postal', () => {
    cy.window().then((win) => {
      const canvas = win.fabricCanvas;
      expect(canvas).to.exist;
      
      // Cambiar a Postal
      cy.get('select').first().select('postcard');
      cy.wait(500);
      
      cy.window().then((win) => {
        const canvas = win.fabricCanvas;
        
        // Postal debe ser 709 x 1063
        expect(canvas.width).to.equal(709);
        expect(canvas.height).to.equal(1063);
      });
    });
  });

  it('Debe cambiar dimensiones del canvas al seleccionar Cuadrado', () => {
    cy.window().then((win) => {
      const canvas = win.fabricCanvas;
      expect(canvas).to.exist;
      
      // Cambiar a Cuadrado 14cm
      cy.get('select').first().select('square-small');
      cy.wait(500);
      
      cy.window().then((win) => {
        const canvas = win.fabricCanvas;
        
        // Cuadrado debe ser 992 x 992
        expect(canvas.width).to.equal(992);
        expect(canvas.height).to.equal(992);
      });
    });
  });

  it('Debe mostrar indicadores visuales de dimensiones', () => {
    // Verificar indicador superior en píxeles
    cy.contains(/\d+ × \d+ px/).should('be.visible');
    
    // Verificar indicador inferior en milímetros
    cy.contains(/\d+ × \d+ mm/).should('be.visible');
  });

  it('Debe actualizar indicadores al cambiar tamaño', () => {
    // Cambiar a A6
    cy.get('select').first().select('a6');
    cy.wait(500);
    
    // Verificar que los indicadores se actualizaron
    cy.contains('744 × 1050 px').should('be.visible');
    cy.contains(/105 × 148 mm/).should('be.visible');
  });

  it('Debe preservar elementos al cambiar tamaño', () => {
    // Añadir un elemento de texto
    cy.contains('Texto').click();
    cy.wait(500);
    
    // Verificar que se añadió
    cy.window().then((win) => {
      const canvas = win.fabricCanvas;
      const objectsBefore = canvas.getObjects().length;
      expect(objectsBefore).to.be.greaterThan(0);
      
      // Cambiar tamaño
      cy.get('select').first().select('a6');
      cy.wait(500);
      
      // Verificar que los elementos siguen ahí
      cy.window().then((win) => {
        const canvas = win.fabricCanvas;
        const objectsAfter = canvas.getObjects().length;
        expect(objectsAfter).to.equal(objectsBefore);
      });
    });
  });

  it('Debe mostrar borde visual del canvas', () => {
    // Verificar que existe el borde azul
    cy.get('div[style*="border: 3px solid #3b82f6"]').should('be.visible');
    
    // Verificar esquinas decorativas
    cy.get('.border-t-2.border-l-2.border-blue-600').should('have.length', 1);
    cy.get('.border-t-2.border-r-2.border-blue-600').should('have.length', 1);
    cy.get('.border-b-2.border-l-2.border-blue-600').should('have.length', 1);
    cy.get('.border-b-2.border-r-2.border-blue-600').should('have.length', 1);
  });

  it('Debe cambiar el tamaño visual del borde al cambiar dimensiones', () => {
    // Obtener el tamaño del contenedor del canvas
    cy.get('div[style*="border: 3px solid #3b82f6"]').then(($el) => {
      const initialWidth = $el.width();
      const initialHeight = $el.height();
      
      cy.log(`Tamaño visual inicial: ${initialWidth} x ${initialHeight}`);
      
      // Cambiar a un tamaño más pequeño (A6)
      cy.get('select').first().select('a6');
      cy.wait(500);
      
      cy.get('div[style*="border: 3px solid #3b82f6"]').then(($el) => {
        const newWidth = $el.width();
        const newHeight = $el.height();
        
        cy.log(`Nuevo tamaño visual: ${newWidth} x ${newHeight}`);
        
        // El tamaño debe haber cambiado
        expect(newWidth).to.not.equal(initialWidth);
        expect(newHeight).to.not.equal(initialHeight);
        
        // A6 es más pequeño que A5
        expect(newWidth).to.be.lessThan(initialWidth);
      });
    });
  });

  it('Sistema de doble cara debe funcionar', () => {
    // Verificar que existe el checkbox de doble cara
    cy.contains('Doble cara').should('be.visible');
    
    // Activar doble cara
    cy.get('input[type="checkbox"]').check();
    cy.wait(500);
    
    // Verificar que aparecen botones de anverso/reverso
    cy.contains('Anverso').should('be.visible');
    cy.contains('Reverso').should('be.visible');
  });

  it('Debe cambiar entre anverso y reverso sin perder contenido', () => {
    // Activar doble cara
    cy.get('input[type="checkbox"]').check();
    cy.wait(500);
    
    // Añadir elemento en anverso
    cy.contains('Texto').click();
    cy.wait(500);
    
    cy.window().then((win) => {
      const canvas = win.fabricCanvas;
      const frontObjects = canvas.getObjects().length;
      expect(frontObjects).to.be.greaterThan(0);
      
      // Cambiar a reverso
      cy.contains('button', 'Reverso').click();
      cy.wait(500);
      
      // Canvas debe estar limpio
      cy.window().then((win) => {
        const canvas = win.fabricCanvas;
        const backObjects = canvas.getObjects().length;
        expect(backObjects).to.equal(0);
        
        // Volver a anverso
        cy.contains('button', 'Anverso').click();
        cy.wait(500);
        
        // Elementos deben volver
        cy.window().then((win) => {
          const canvas = win.fabricCanvas;
          const restoredObjects = canvas.getObjects().length;
          expect(restoredObjects).to.equal(frontObjects);
        });
      });
    });
  });
});
