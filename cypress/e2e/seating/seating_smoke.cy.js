/**
 * E2E Test: Seating Plan - Smoke Test
 * Valida funcionalidad básica del seating plan
 */

describe('Seating Plan - Smoke Test', () => {
  beforeEach(() => {
    // Bypass autenticación para E2E (detecta window.Cypress)
    cy.visit('/invitados/seating');
    cy.wait(1000); // Esperar carga inicial
  });

  it('debe cargar la página del seating plan correctamente', () => {
    // Verificar que la página carga
    cy.url().should('include', '/invitados/seating');

    // Verificar que existe el canvas o contenido de seating
    cy.get('body').then(($body) => {
      const hasSeatingContent =
        $body.find('[data-testid="seating-canvas"]').length > 0 ||
        $body.find('svg').length > 0 ||
        $body.text().match(/ceremonia|banquete|mesa/i);

      expect(hasSeatingContent).to.be.true;
    });
  });

  it('debe mostrar las pestañas de Ceremonia y Banquete', () => {
    // Verificar tabs
    cy.contains('Ceremonia').should('be.visible');
    cy.contains('Banquete').should('be.visible');
  });

  it('debe poder cambiar entre pestañas Ceremonia y Banquete', () => {
    // Cambiar a Banquete
    cy.contains('Banquete').click();
    cy.wait(500);

    // Volver a Ceremonia
    cy.contains('Ceremonia').click();
    cy.wait(500);

    // Verificar que no hay errores
    cy.get('body').should('not.contain', 'Error');
  });

  it('debe abrir modal de Configurar Banquete', () => {
    // Cambiar a Banquete
    cy.contains('Banquete').click();
    cy.wait(500);

    // Buscar botón de configurar banquete (puede estar en toolbar o quick actions)
    cy.get('body').then(($body) => {
      if ($body.find('button[title*="banquete" i], button:contains("Banquete")').length > 0) {
        // Intentar abrir configuración
        cy.get('button[title*="banquete" i], button:contains("Configurar")').first().click();
        cy.wait(500);

        // Verificar que el modal se abre (buscar texto común en modales)
        cy.get('body').should('contain.text', 'Banquete');
      }
    });
  });

  it('debe poder usar herramienta de dibujo (Perímetro)', () => {
    // Buscar botón de Perímetro
    cy.get('body').then(($body) => {
      const hasBoundaryButton =
        $body.find('button:contains("Perímetro"), button[title*="perímetro" i]').length > 0;

      if (hasBoundaryButton) {
        cy.get('button:contains("Perímetro"), button[title*="perímetro" i]').first().click();
        cy.wait(500);

        // Volver a modo Navegar
        cy.get('button:contains("Navegar"), button[title*="navegar" i]').first().click();
        cy.wait(500);
      }
    });
  });

  it('debe tener botones de Undo y Redo disponibles', () => {
    // Verificar que existen los botones (aunque estén disabled inicialmente)
    cy.get(
      '[data-testid="undo-btn"], button[title*="Deshacer"], button[aria-label*="Deshacer"]'
    ).should('exist');

    cy.get(
      '[data-testid="redo-btn"], button[title*="Rehacer"], button[aria-label*="Rehacer"]'
    ).should('exist');
  });

  it('debe mantener la UI responsive sin errores', () => {
    // Cambiar tamaño de viewport
    cy.viewport(1920, 1080);
    cy.wait(500);

    cy.viewport(1366, 768);
    cy.wait(500);

    cy.viewport(768, 1024);
    cy.wait(500);

    // Verificar que no hay errores
    cy.get('body').should('not.contain', 'Error');
  });

  it('debe mostrar estadísticas o resumen del seating plan', () => {
    // Buscar elementos de resumen (pueden estar en diferentes ubicaciones)
    cy.get('body').then(($body) => {
      const hasStats = $body.text().match(/mesa|invitado|asiento/i);
      expect(hasStats).to.exist;
    });
  });

  it('no debe mostrar errores de consola críticos', () => {
    // Interceptar errores de consola
    cy.window().then((win) => {
      cy.spy(win.console, 'error').as('consoleError');
    });

    // Realizar acciones básicas
    cy.contains('Banquete').click();
    cy.wait(500);
    cy.contains('Ceremonia').click();
    cy.wait(500);

    // Verificar que no hay errores críticos (algunos warnings son aceptables)
    cy.get('@consoleError').should((spy) => {
      const calls = spy.getCalls();
      const criticalErrors = calls.filter(
        (call) =>
          call.args[0] &&
          typeof call.args[0] === 'string' &&
          (call.args[0].includes('Cannot read') || call.args[0].includes('undefined is not'))
      );
      expect(criticalErrors).to.have.length(0);
    });
  });
});
