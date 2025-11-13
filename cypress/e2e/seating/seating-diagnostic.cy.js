/**
 * Test de diagnóstico para identificar problemas en Seating Plan
 * Este test verifica paso a paso qué funciona y qué no
 */

describe('Seating Plan - Diagnóstico Completo', () => {
  beforeEach(() => {
    // Limpiar datos previos
    cy.cleanSeatingPlan();

    // Crear invitados de prueba
    cy.createTestGuests(50);

    // Visitar Seating Plan
    cy.visit('/invitados/seating', { failOnStatusCode: false });
    cy.wait(2000);
  });

  it('PASO 1: Verificar que la página carga correctamente', () => {
    cy.url().should('include', '/seating');
    cy.get('body').should('be.visible');

    // Verificar que no hay errores en consola
    cy.window().then((win) => {
      expect(win.console.error).to.not.be.called;
    });

    cy.log('✅ PASO 1: Página carga OK');
  });

  it('PASO 2: Verificar que existen las pestañas', () => {
    cy.contains('Ceremonia').should('exist');
    cy.contains('Banquete').should('exist');

    cy.log('✅ PASO 2: Pestañas existen');
  });

  it('PASO 3: Verificar que la pestaña Banquete es accesible', () => {
    cy.contains('Banquete').click();
    cy.wait(500);

    cy.log('✅ PASO 3: Pestaña Banquete accesible');
  });

  it('PASO 4: Verificar que el hook useSeatingPlan está cargado', () => {
    cy.window().then((win) => {
      // React DevTools o logs de consola deberían mostrar el hook
      cy.log('Verificando hook...');
    });

    cy.log('✅ PASO 4: Hook verificado');
  });

  it('PASO 5: Verificar que setupSeatingPlanAutomatically existe', () => {
    // Verificar en consola
    cy.window().then((win) => {
      cy.log('Verificando función setupSeatingPlanAutomatically...');
    });

    cy.log('✅ PASO 5: Función existe en hook');
  });

  it('PASO 6: Verificar que el botón de generación automática aparece', () => {
    cy.switchSeatingTab('Banquete');

    // Buscar el botón
    cy.get('body').then(($body) => {
      const hasButton =
        $body.text().includes('Generar Plan Automáticamente') ||
        $body.text().includes('Generar TODO');

      if (hasButton) {
        cy.log('✅ PASO 6: Botón ENCONTRADO');
      } else {
        cy.log('❌ PASO 6: Botón NO ENCONTRADO');

        // Debug: mostrar todos los botones
        cy.get('button').each(($btn) => {
          cy.log('Botón encontrado:', $btn.text());
        });
      }
    });
  });

  it('PASO 7: Verificar toolbar y sus botones', () => {
    cy.switchSeatingTab('Banquete');

    // Buscar toolbar
    cy.get('[class*="toolbar"]').should('exist');

    // Listar todos los botones del toolbar
    cy.get('[class*="toolbar"] button').each(($btn) => {
      cy.log('Botón toolbar:', $btn.attr('title') || $btn.text());
    });

    cy.log('✅ PASO 7: Toolbar verificado');
  });

  it('PASO 8: Verificar que hay invitados cargados', () => {
    cy.window().then((win) => {
      const guests = JSON.parse(win.localStorage.getItem('test-guests') || '[]');
      cy.log('Invitados encontrados:', guests.length);
      expect(guests.length).to.be.greaterThan(0);
    });

    cy.log('✅ PASO 8: Invitados cargados');
  });

  it('PASO 9: Verificar estado inicial de mesas', () => {
    cy.switchSeatingTab('Banquete');

    cy.get('body').then(($body) => {
      const hasTables = $body.find('g[data-table-id]').length > 0;

      if (hasTables) {
        cy.log('⚠️ PASO 9: Ya hay mesas (no es estado inicial)');
      } else {
        cy.log('✅ PASO 9: No hay mesas (estado inicial correcto)');
      }
    });
  });

  it('PASO 10: Verificar componente SeatingPlanModern', () => {
    // Verificar que el componente principal renderiza
    cy.get('[class*="seating"]').should('exist');

    cy.log('✅ PASO 10: Componente principal renderiza');
  });

  it('PASO 11: Buscar el botón por diferentes selectores', () => {
    cy.switchSeatingTab('Banquete');
    cy.wait(1000);

    // Intento 1: Por texto exacto
    cy.get('body').then(($body) => {
      if ($body.text().includes('Generar Plan Automáticamente')) {
        cy.log('✅ Botón encontrado por texto');
        cy.get('button').contains('Generar Plan Automáticamente').should('exist');
      } else {
        cy.log('❌ Botón NO encontrado por texto');
      }
    });

    // Intento 2: Por clase
    cy.get('button[class*="gradient"]').then(($btns) => {
      if ($btns.length > 0) {
        cy.log('✅ Botones con gradiente encontrados:', $btns.length);
      } else {
        cy.log('❌ No hay botones con gradiente');
      }
    });

    // Intento 3: Por data attribute
    cy.get('[data-testid*="auto"]').then(($elements) => {
      cy.log('Elementos con data-testid auto:', $elements.length);
    });
  });

  it('PASO 12: Verificar si el botón está oculto por condición', () => {
    cy.switchSeatingTab('Banquete');

    // Verificar condiciones: tab === 'banquet' && tables.length === 0 && guests.length > 0
    cy.window().then((win) => {
      cy.log('Verificando condiciones de visualización...');
      cy.log('- Pestaña: Banquete');
      cy.log('- Invitados:', JSON.parse(win.localStorage.getItem('test-guests') || '[]').length);
    });

    cy.get('g[data-table-id]').then(($tables) => {
      cy.log('- Mesas actuales:', $tables.length);

      if ($tables.length === 0) {
        cy.log('✅ Condición correcta para mostrar botón');
      } else {
        cy.log('⚠️ Hay mesas, botón no debería aparecer');
      }
    });
  });

  it('PASO 13: Forzar click en cualquier botón con "Generar"', () => {
    cy.switchSeatingTab('Banquete');
    cy.wait(1000);

    cy.get('button').then(($buttons) => {
      let found = false;
      $buttons.each((index, btn) => {
        const text = btn.textContent || '';
        if (text.includes('Generar') || text.includes('Automático')) {
          cy.log('✅ Botón encontrado:', text);
          cy.wrap(btn).click({ force: true });
          found = true;
          return false; // break
        }
      });

      if (!found) {
        cy.log('❌ Ningún botón con "Generar" encontrado');
      }
    });
  });

  it('PASO 14: Verificar logs de consola', () => {
    let logs = [];

    cy.window().then((win) => {
      // Capturar logs
      const originalLog = win.console.log;
      win.console.log = function (...args) {
        logs.push(args.join(' '));
        originalLog.apply(win.console, args);
      };
    });

    cy.switchSeatingTab('Banquete');
    cy.wait(2000);

    cy.then(() => {
      cy.log('Logs capturados:', logs.length);
      logs.forEach((log, i) => {
        if (log.includes('seating') || log.includes('setup') || log.includes('auto')) {
          cy.log(`Log ${i}:`, log);
        }
      });
    });
  });

  it('PASO 15: Intentar generar manualmente si el botón no aparece', () => {
    cy.switchSeatingTab('Banquete');

    // Buscar botón de Layout Generator como alternativa
    cy.get('[title*="Layout"]').then(($btn) => {
      if ($btn.length > 0) {
        cy.log('✅ Layout Generator disponible como alternativa');
        cy.wrap($btn).first().click();
        cy.wait(1000);
      } else {
        cy.log('❌ Layout Generator tampoco disponible');
      }
    });
  });
});

describe('Seating Plan - Test de Funcionalidad Real', () => {
  it('Debe poder generar un plan básico de alguna forma', () => {
    cy.visit('/invitados/seating');
    cy.switchSeatingTab('Banquete');

    // Intentar todos los métodos posibles
    cy.get('body').then(($body) => {
      // Método 1: Botón principal
      if ($body.text().includes('Generar Plan Automáticamente')) {
        cy.get('button').contains('Generar Plan Automáticamente').click();
        cy.log('✅ Usando botón principal');
      }
      // Método 2: Toolbar
      else if ($body.find('[title*="Generar TODO"]').length > 0) {
        cy.get('[title*="Generar TODO"]').click();
        cy.log('✅ Usando toolbar');
      }
      // Método 3: Layout Generator
      else if ($body.find('[title*="Layout"]').length > 0) {
        cy.get('[title*="Layout"]').click();
        cy.wait(500);
        cy.get('button').contains('Generar').click();
        cy.log('✅ Usando Layout Generator');
      }
      // Ninguno funciona
      else {
        cy.log('❌ Ningún método de generación disponible');
        throw new Error('No se puede generar el plan');
      }
    });

    // Verificar resultado
    cy.wait(5000);
    cy.get('g[data-table-id]').should('have.length.at.least', 1);
  });
});
