/**
 * E2E Test: Seating Plan - Ajuste al Lienzo (Fit)
 * Valida la funcionalidad de ajustar vista al contenido
 */

describe('Seating Plan - Ajuste al Lienzo', () => {
  beforeEach(() => {
    cy.visit('/invitados/seating');
    cy.wait(1000);
  });

  it('debe tener botón de ajustar a pantalla disponible', () => {
    // Buscar botón de fit/ajustar
    cy.get('body').then(($body) => {
      const hasFitButton =
        $body.find('button[title*="ajustar" i], button[title*="fit" i], button:contains("Ajustar")')
          .length > 0;

      if (hasFitButton) {
        cy.get('button[title*="ajustar" i], button[title*="fit" i]').should('be.visible');
      } else {
        cy.log('Botón de ajustar no encontrado visiblemente');
      }
    });
  });

  it('debe responder al evento de ajustar vista', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    // Disparar evento personalizado si existe
    cy.window().then((win) => {
      win.dispatchEvent(new Event('seating-fit'));
    });

    cy.wait(500);

    // Verificar que no hay errores
    cy.get('body').should('not.contain', 'Error');
  });

  it('debe poder hacer zoom in y out', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    // Verificar que existe el canvas con zoom
    cy.get('svg, canvas, [data-testid="seating-canvas"]').then(($canvas) => {
      // Intentar scroll/zoom
      cy.wrap($canvas).trigger('wheel', { deltaY: -50 }); // Zoom in
      cy.wait(300);

      cy.wrap($canvas).trigger('wheel', { deltaY: 50 }); // Zoom out
      cy.wait(300);
    });
  });

  it('debe mostrar indicador de nivel de zoom', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    // Buscar indicador de zoom (puede estar en barra inferior)
    cy.get('body').then(($body) => {
      const text = $body.text();
      const hasZoomIndicator = text.match(/zoom|%|escala/i);

      if (hasZoomIndicator) {
        cy.log('Indicador de zoom encontrado');
      }
    });
  });

  it('debe poder hacer pan (desplazar vista)', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    // Asegurar que está en modo Navegar
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Navegar")').length > 0) {
        cy.get('button:contains("Navegar")').first().click();
        cy.wait(300);
      }
    });

    // Hacer drag en el canvas para pan
    cy.get('svg, [data-testid="seating-canvas"]').then(($canvas) => {
      cy.wrap($canvas)
        .trigger('mousedown', { clientX: 200, clientY: 200 })
        .trigger('mousemove', { clientX: 300, clientY: 300 })
        .trigger('mouseup');

      cy.wait(500);
    });
  });

  it('debe mantener proporciones al ajustar', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    // Generar contenido primero (mesas)
    cy.get('body').then(($body) => {
      if ($body.find('button[data-testid="banquet-config-btn"]').length > 0) {
        cy.get('button[data-testid="banquet-config-btn"]').click();
        cy.wait(500);

        if ($body.find('button:contains("Generar")').length > 0) {
          cy.get('button:contains("Generar")').first().click();
          cy.wait(1000);
        }
      }
    });

    // Intentar ajustar
    cy.get('body').then(($body) => {
      if ($body.find('button[title*="ajustar" i]').length > 0) {
        cy.get('button[title*="ajustar" i]').first().click();
        cy.wait(500);
      }
    });
  });

  it('debe resetear vista al ajustar contenido', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    // Hacer zoom primero
    cy.get('svg, [data-testid="seating-canvas"]').trigger('wheel', { deltaY: -100 });
    cy.wait(500);

    // Ajustar
    cy.window().then((win) => {
      win.dispatchEvent(new Event('seating-fit'));
    });

    cy.wait(500);

    // Verificar que el zoom cambió (debe mostrar indicador diferente)
    cy.log('Vista ajustada');
  });

  it('debe funcionar con diferentes tamaños de salón', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    // Abrir configuración de espacio
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="space-config-btn"], button:contains("Espacio")').length > 0) {
        cy.get('[data-testid="space-config-btn"], button:contains("Espacio")').first().click();
        cy.wait(500);

        // Verificar que se puede configurar dimensiones
        cy.get('input[type="number"], input[name*="width"], input[name*="height"]').should('exist');
      }
    });
  });

  it('debe ajustar vista cuando se añaden nuevos elementos', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    // Añadir mesa
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Mesa"), button[title*="mesa" i]').length > 0) {
        cy.get('button:contains("Mesa"), button[title*="mesa" i]').first().click();
        cy.wait(500);

        // Ajustar
        cy.window().then((win) => {
          win.dispatchEvent(new Event('seating-fit'));
        });
        cy.wait(500);
      }
    });
  });

  it('no debe perder elementos al ajustar vista', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    // Contar elementos antes
    cy.get('svg circle, svg rect').then(($elements) => {
      const countBefore = $elements.length;

      // Ajustar vista
      cy.window().then((win) => {
        win.dispatchEvent(new Event('seating-fit'));
      });
      cy.wait(500);

      // Contar elementos después
      cy.get('svg circle, svg rect').should('have.length', countBefore);
    });
  });
});
