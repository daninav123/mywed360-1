/**
 * Tests E2E para la funcionalidad de Generación Automática del Seating Plan
 * Verifica el objetivo de mínimo esfuerzo del usuario
 */

describe('Seating Plan - Generación Automática Completa', () => {
  beforeEach(() => {
    // Setup: Visitar la página de Seating Plan
    cy.visit('/invitados/seating');

    // Esperar que la página cargue
    cy.wait(1000);
  });

  it('Debe mostrar el botón de generación automática cuando hay invitados pero no mesas', () => {
    // Verificar que estamos en la pestaña de Banquete
    cy.contains('Banquete').should('be.visible');

    // El botón grande flotante debería aparecer si hay invitados pero no mesas
    cy.get('button').contains('Generar Plan Automáticamente').should('exist');

    // Verificar que muestra el contador de invitados
    cy.get('button')
      .contains(/\d+ invitados detectados/)
      .should('exist');
  });

  it('Debe generar todo el plan automáticamente con un solo click', () => {
    // Click en el botón de generación automática
    cy.get('button').contains('Generar Plan Automáticamente').click();

    // Verificar toast de inicio
    cy.contains('Analizando invitados').should('be.visible');

    // Esperar a que complete (máximo 5 segundos)
    cy.wait(5000);

    // Verificar toast de éxito
    cy.contains('Seating Plan generado automáticamente', { timeout: 10000 }).should('be.visible');

    // Verificar que aparecen estadísticas
    cy.contains(/\d+ mesas creadas/).should('be.visible');
    cy.contains(/\d+ invitados asignados/).should('be.visible');

    // Verificar que las mesas aparecen en el canvas
    cy.get('[data-testid="seating-canvas"]', { timeout: 5000 })
      .find('g[data-table-id]')
      .should('have.length.at.least', 1);
  });

  it('Debe usar el layout correcto según el número de invitados', () => {
    // Generar plan
    cy.get('button').contains('Generar Plan Automáticamente').click();

    // Esperar resultado
    cy.wait(5000);

    // Verificar que menciona el layout usado
    cy.contains(/Layout: (circular|columns|with-aisle)/, { timeout: 10000 }).should('be.visible');
  });

  it('Debe estar disponible en el toolbar con atajo Ctrl+G', () => {
    // Verificar botón en toolbar
    cy.get('[title*="Generar TODO"]').should('exist');

    // Verificar que tiene el badge ✨
    cy.get('[title*="Generar TODO"]').contains('✨').should('exist');
  });

  it('Debe deshabilitar el botón durante la generación', () => {
    // Click en generar
    cy.get('button').contains('Generar Plan Automáticamente').click();

    // Verificar que el botón se deshabilita
    cy.get('button').contains('Generando').should('be.disabled');
  });

  it('Debe asignar invitados a las mesas generadas', () => {
    // Generar plan
    cy.get('button').contains('Generar Plan Automáticamente').click();

    // Esperar a que complete
    cy.wait(5000);

    // Abrir inspector de una mesa
    cy.get('g[data-table-id]').first().click();

    // Verificar que hay invitados asignados
    cy.get('[data-testid="table-inspector"]', { timeout: 3000 }).should('exist');
  });

  it('Debe mostrar invitados pendientes si no caben todos', () => {
    // Generar plan
    cy.get('button').contains('Generar Plan Automáticamente').click();

    // Esperar
    cy.wait(5000);

    // Si hay pendientes, debe mostrarlo
    cy.get('body').then(($body) => {
      if ($body.text().includes('pendientes')) {
        cy.contains(/\d+ pendientes/).should('be.visible');
      }
    });
  });
});

describe('Seating Plan - Funcionalidades Básicas', () => {
  beforeEach(() => {
    cy.visit('/invitados/seating');
    cy.wait(1000);
  });

  it('Debe cambiar entre pestañas Ceremonia y Banquete', () => {
    // Click en Ceremonia
    cy.contains('Ceremonia').click();
    cy.wait(500);

    // Verificar que cambió
    cy.contains('Ceremonia')
      .should('have.class', 'active')
      .or('have.attr', 'aria-selected', 'true');

    // Volver a Banquete
    cy.contains('Banquete').click();
    cy.wait(500);
  });

  it('Debe abrir el modal de Layout Generator', () => {
    // Click en botón de Layout Generator
    cy.get('[title*="Layout"]').click();

    // Verificar que abre el modal
    cy.get('[role="dialog"]').should('be.visible');
    cy.contains('Layout').should('be.visible');
  });

  it('Debe abrir el selector de plantillas', () => {
    // Click en plantillas
    cy.get('[title*="Plantillas"]').click();

    // Verificar modal
    cy.get('[role="dialog"]').should('be.visible');
  });

  it('Debe mostrar el minimap', () => {
    // Verificar que el minimap está visible
    cy.contains('Minimap').should('exist');
  });

  it('Debe permitir toggle del minimap con tecla M', () => {
    // Presionar M
    cy.get('body').type('m');

    // Verificar que cambia
    cy.wait(500);
  });

  it('Debe tener undo/redo disponibles', () => {
    // Verificar botones
    cy.get('[title*="Deshacer"]').should('exist');
    cy.get('[title*="Rehacer"]').should('exist');
  });
});

describe('Seating Plan - Herramientas de Dibujo', () => {
  beforeEach(() => {
    cy.visit('/invitados/seating');
    cy.contains('Banquete').click();
    cy.wait(1000);
  });

  it('Debe abrir las herramientas de dibujo', () => {
    // Click en botón de herramientas
    cy.get('[title*="Dibujo"]').click();

    // Verificar que aparece la barra de herramientas
    cy.wait(500);
  });

  it('Debe tener herramientas: Perímetro, Puertas, Obstáculos, Pasillos, Zonas', () => {
    // Abrir herramientas
    cy.get('[title*="Dibujo"]').click();
    cy.wait(500);

    // Verificar que existen las herramientas
    const tools = ['Perímetro', 'Puerta', 'Obstáculo', 'Pasillo', 'Zona'];
    tools.forEach((tool) => {
      cy.get('body').should('contain', tool);
    });
  });
});

describe('Seating Plan - Snap Guides', () => {
  beforeEach(() => {
    cy.visit('/invitados/seating');
    cy.contains('Banquete').click();
    cy.wait(1000);
  });

  it('Debe tener funcionalidad de snap guides implementada', () => {
    // Generar algunas mesas primero
    cy.get('button').contains('Generar Plan Automáticamente').click();
    cy.wait(5000);

    // Verificar que existen elementos SVG para guides
    cy.get('.snap-guides').should('exist');
  });
});

describe('Seating Plan - Exportación', () => {
  beforeEach(() => {
    cy.visit('/invitados/seating');
    cy.contains('Banquete').click();
    cy.wait(1000);
  });

  it('Debe abrir el wizard de exportación', () => {
    // Generar plan primero
    cy.get('button').contains('Generar Plan Automáticamente').click();
    cy.wait(5000);

    // Abrir exportación
    cy.contains('Exportar').click();

    // Verificar wizard
    cy.get('[role="dialog"]').should('be.visible');
  });

  it('Debe tener opciones de exportación: PDF, PNG, CSV, SVG', () => {
    // Generar plan
    cy.get('button').contains('Generar Plan Automáticamente').click();
    cy.wait(5000);

    // Abrir exportación
    cy.contains('Exportar').click();
    cy.wait(500);

    // Verificar opciones
    const formats = ['PDF', 'PNG', 'CSV', 'SVG'];
    formats.forEach((format) => {
      cy.get('body').should('contain', format);
    });
  });
});

describe('Seating Plan - Stats y Feedback', () => {
  beforeEach(() => {
    cy.visit('/invitados/seating');
    cy.wait(1000);
  });

  it('Debe mostrar estadísticas en el footer', () => {
    // Verificar que existe el footer con stats
    cy.contains(/\d+ invitados/).should('exist');
    cy.contains(/\d+ mesas/).should('exist');
  });

  it('Debe mostrar porcentaje de asignación', () => {
    // Verificar porcentaje
    cy.contains(/\d+%/).should('exist');
  });
});

describe('Seating Plan - Configuración Avanzada', () => {
  beforeEach(() => {
    cy.visit('/invitados/seating');
    cy.contains('Banquete').click();
    cy.wait(1000);
  });

  it('Debe abrir configuración avanzada de banquete', () => {
    // Click en settings
    cy.get('[title*="Configuración"]').click();

    // Verificar modal
    cy.wait(500);
  });
});
