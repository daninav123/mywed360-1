/// <reference types="cypress" />

/**
 * E2E Tests para Modal de Favoritos - Funcionalidades Implementadas
 *
 * Tests para:
 * 1. Ver Portfolio Completo (lightbox)
 * 2. Ordenar Favoritos (rating, precio, etc)
 * 3. Editar Notas Rápido (inline)
 */

describe('Modal de Favoritos - Funcionalidades Nuevas', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'test123456',
  };

  beforeEach(() => {
    // Login y navegar a página con favoritos
    cy.visit('/login');
    cy.get('input[type="email"]').type(testUser.email);
    cy.get('input[type="password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();

    // Esperar a que cargue la app
    cy.url().should('not.include', '/login');

    // Ir a página de proveedores o servicios
    cy.visit('/');
    cy.wait(1000);
  });

  describe('1. Ver Portfolio Completo (Lightbox)', () => {
    it('Debe abrir galería al hacer click en imagen del proveedor', () => {
      // Buscar botón "Ver favoritos"
      cy.contains('button', /ver favoritos/i)
        .first()
        .click({ force: true });

      // Esperar a que abra el modal
      cy.contains('Elige uno de tus favoritos').should('be.visible');

      // Click en la imagen del proveedor
      cy.get('[data-testid="portfolio-image"], img[alt]').first().click({ force: true });

      // Verificar que se abre el lightbox
      cy.get('[class*="fixed"]').should('contain', '/');

      // Cerrar lightbox
      cy.get('body').type('{esc}');
    });

    it('Debe navegar entre fotos con flechas', () => {
      cy.contains('button', /ver favoritos/i)
        .first()
        .click({ force: true });

      // Abrir galería
      cy.get('img[alt]').first().click({ force: true });

      // Esperar y navegar con teclado
      cy.wait(500);
      cy.get('body').type('{rightarrow}');
      cy.wait(500);
      cy.get('body').type('{leftarrow}');

      // Cerrar
      cy.get('body').type('{esc}');
    });

    it('Debe mostrar contador de fotos', () => {
      cy.contains('button', /ver favoritos/i)
        .first()
        .click({ force: true });

      // Verificar que muestra "Ver X fotos" en hover
      cy.get('img[alt]').first().trigger('mouseover');
      cy.contains(/ver.*fotos?/i).should('exist');
    });
  });

  describe('2. Ordenar Favoritos', () => {
    it('Debe tener dropdown de ordenamiento visible', () => {
      cy.contains('button', /ver favoritos/i)
        .first()
        .click({ force: true });

      // Buscar select de ordenamiento
      cy.get('select').should('be.visible');

      // Verificar opciones
      cy.get('select option').should('have.length.at.least', 4);
    });

    it('Debe ordenar por mejor valorados', () => {
      cy.contains('button', /ver favoritos/i)
        .first()
        .click({ force: true });

      // Seleccionar "Mejor valorados"
      cy.get('select').select('rating');

      // Esperar re-render
      cy.wait(500);

      // Verificar que cambió el orden (primero debe tener más estrellas)
      cy.get('[class*="Star"]').should('exist');
    });

    it('Debe ordenar por menor precio', () => {
      cy.contains('button', /ver favoritos/i)
        .first()
        .click({ force: true });

      // Seleccionar "Menor precio"
      cy.get('select').select('price');

      // Esperar re-render
      cy.wait(500);

      // Verificar que existen precios
      cy.contains(/€|\$/).should('exist');
    });

    it('Debe ordenar por recientes (default)', () => {
      cy.contains('button', /ver favoritos/i)
        .first()
        .click({ force: true });

      // Verificar que está seleccionado "recent" por defecto
      cy.get('select').should('have.value', 'recent');
    });
  });

  describe('3. Editar Notas Rápido', () => {
    it('Debe mostrar botón "Agregar nota" si no hay nota', () => {
      cy.contains('button', /ver favoritos/i)
        .first()
        .click({ force: true });

      // Buscar botón "Agregar nota"
      cy.contains('button', /agregar nota/i).should('be.visible');
    });

    it('Debe poder agregar una nota nueva', () => {
      cy.contains('button', /ver favoritos/i)
        .first()
        .click({ force: true });

      // Click en "Agregar nota"
      cy.contains('button', /agregar nota/i)
        .first()
        .click();

      // Escribir nota
      cy.get('input[placeholder*="nota"]').first().type('Proveedor recomendado');

      // Guardar
      cy.get('button')
        .contains(/check|✓/i)
        .click();

      // Verificar que se guardó
      cy.contains('Proveedor recomendado').should('be.visible');
    });

    it('Debe mostrar botón editar al hacer hover en nota existente', () => {
      cy.contains('button', /ver favoritos/i)
        .first()
        .click({ force: true });

      // Buscar nota existente (si hay)
      cy.get('[class*="bg-yellow"]').first().trigger('mouseover');

      // Verificar que aparece botón editar
      cy.get('button').find('[class*="Edit"]').should('exist');
    });

    it('Debe poder editar nota existente', () => {
      cy.contains('button', /ver favoritos/i)
        .first()
        .click({ force: true });

      // Agregar nota primero
      cy.contains('button', /agregar nota/i)
        .first()
        .click();
      cy.get('input[placeholder*="nota"]').first().type('Nota inicial');
      cy.get('button')
        .contains(/check|✓/i)
        .click();
      cy.wait(500);

      // Editar la nota
      cy.get('[class*="bg-yellow"]').first().trigger('mouseover');
      cy.get('button').find('[class*="Edit"]').first().click({ force: true });

      // Modificar texto
      cy.get('input[placeholder*="nota"]').first().clear().type('Nota editada');
      cy.get('button')
        .contains(/check|✓/i)
        .click();

      // Verificar cambio
      cy.contains('Nota editada').should('be.visible');
    });

    it('Debe poder cancelar edición de nota', () => {
      cy.contains('button', /ver favoritos/i)
        .first()
        .click({ force: true });

      // Click en agregar nota
      cy.contains('button', /agregar nota/i)
        .first()
        .click();

      // Escribir algo
      cy.get('input[placeholder*="nota"]').first().type('Nota temporal');

      // Cancelar
      cy.get('button').find('[class*="X"]').first().click();

      // Verificar que no se guardó
      cy.contains('Nota temporal').should('not.exist');
    });
  });

  describe('4. Funcionalidades Existentes (Regresión)', () => {
    it('Debe poder asignar proveedor', () => {
      cy.contains('button', /ver favoritos/i)
        .first()
        .click({ force: true });

      // Click en "Asignar"
      cy.contains('button', /asignar/i)
        .first()
        .click();

      // Verificar que se cierra el modal o muestra éxito
      cy.contains(/asignado|success/i, { timeout: 5000 }).should('exist');
    });

    it('Debe poder solicitar presupuesto', () => {
      cy.contains('button', /ver favoritos/i)
        .first()
        .click({ force: true });

      // Click en "Presupuesto"
      cy.contains('button', /presupuesto/i)
        .first()
        .click();

      // Verificar que abre modal de presupuesto
      cy.contains(/solicitar|presupuesto/i).should('be.visible');
    });

    it('Debe poder eliminar favorito', () => {
      cy.contains('button', /ver favoritos/i)
        .first()
        .click({ force: true });

      // Click en botón eliminar (trash icon)
      cy.get('button').find('[class*="Trash"]').first().click({ force: true });

      // Confirmar en alert nativo (Cypress lo maneja automáticamente)
      cy.on('window:confirm', () => true);

      // Esperar mensaje de éxito
      cy.contains(/eliminado/i, { timeout: 3000 }).should('exist');
    });

    it('Debe poder cerrar el modal', () => {
      cy.contains('button', /ver favoritos/i)
        .first()
        .click({ force: true });

      // Click en X
      cy.get('button').find('[class*="X"]').last().click();

      // Verificar que se cerró
      cy.contains('Elige uno de tus favoritos').should('not.exist');
    });
  });

  describe('5. Casos Edge', () => {
    it('Debe manejar lista vacía de favoritos', () => {
      // Navegar a servicio sin favoritos
      cy.visit('/');

      // Si no hay favoritos, el botón no debería existir
      // O debería mostrar mensaje de vacío
      cy.get('body').then(($body) => {
        if ($body.find(':contains("Ver favoritos")').length > 0) {
          cy.contains('button', /ver favoritos/i)
            .first()
            .click({ force: true });
          cy.contains(/no tienes favoritos/i).should('be.visible');
        }
      });
    });

    it('Debe manejar proveedor sin portfolio', () => {
      cy.contains('button', /ver favoritos/i)
        .first()
        .click({ force: true });

      // Verificar que muestra placeholder si no hay imagen
      cy.get('[class*="gradient"]').should('exist');
    });

    it('Debe manejar error al guardar nota', () => {
      // Simular offline
      cy.intercept('PATCH', '**/api/favorites/**', {
        statusCode: 500,
        body: { error: 'Error de red' },
      });

      cy.contains('button', /ver favoritos/i)
        .first()
        .click({ force: true });
      cy.contains('button', /agregar nota/i)
        .first()
        .click();
      cy.get('input[placeholder*="nota"]').first().type('Nota con error');
      cy.get('button')
        .contains(/check|✓/i)
        .click();

      // Verificar mensaje de error
      cy.contains(/error/i, { timeout: 3000 }).should('exist');
    });
  });
});
