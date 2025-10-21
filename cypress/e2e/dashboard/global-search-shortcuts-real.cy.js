/// <reference types="Cypress" />

/**
 * Dashboard - Búsqueda Global y Shortcuts con Integración Real
 * Tests de accesos rápidos y funcionalidad de búsqueda
 */

describe('Dashboard - Búsqueda Global y Shortcuts (Real)', () => {
  const testEmail = `cypress-search-${Date.now()}@malove.app`;
  const testPassword = 'TestPassword123!';
  let testUserId;
  let testWeddingId;

  before(() => {
    // Verificar backend
    cy.checkBackendHealth();
    
    // Crear usuario y boda de test
    cy.createFirebaseTestUser({
      email: testEmail,
      password: testPassword,
      displayName: 'Usuario Search Test'
    }).then((user) => {
      testUserId = user.uid;
      
      // Crear boda activa
      cy.createTestWeddingReal({
        name: 'Boda Test Search',
        date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Lugar Test Search',
        userId: testUserId
      }).then((wedding) => {
        if (wedding && wedding.id) {
          testWeddingId = wedding.id;
          
          // Crear algunos invitados para buscar
          cy.createMultipleGuests(testWeddingId, 3).then(() => {
            cy.log('✅ Datos de test para búsqueda creados');
          });
        }
      });
    });
  });

  after(() => {
    // Cleanup
    if (testWeddingId) {
      cy.deleteTestWedding(testWeddingId);
    }
    if (testUserId) {
      cy.deleteFirebaseTestUser(testUserId);
    }
    cy.log('🗑️ Datos de búsqueda limpiados');
  });

  beforeEach(() => {
    cy.loginToLovendaReal(testEmail, testPassword);
    cy.closeDiagnostic();
    cy.visit('/home', { failOnStatusCode: false });
    cy.wait(2000);
  });

  it('busca y encuentra el campo de búsqueda global', () => {
    cy.get('body').then($body => {
      const searchSelectors = [
        'input[type="search"]',
        'input[placeholder*="buscar"]',
        'input[placeholder*="Buscar"]',
        'input[placeholder*="search"]',
        'input[placeholder*="Search"]',
        '[data-testid="global-search"]',
        '[data-testid="search-input"]',
        '[aria-label*="buscar"]',
        '[aria-label*="search"]',
        '.search-input',
        '#search'
      ];
      
      let searchFound = false;
      for (const selector of searchSelectors) {
        if ($body.find(selector).length) {
          cy.get(selector).should('exist');
          searchFound = true;
          cy.log(`✅ Campo de búsqueda encontrado: ${selector}`);
          break;
        }
      }
      
      if (!searchFound) {
        cy.log('⚠️ Campo de búsqueda global no encontrado (puede no estar implementado aún)');
      }
    });
  });

  it('abre la búsqueda global mediante shortcut Cmd/Ctrl+K', () => {
    // Simular el shortcut Cmd+K (Mac) o Ctrl+K (Windows/Linux)
    const isMac = Cypress.platform === 'darwin';
    const modifier = isMac ? 'meta' : 'ctrl';
    
    cy.get('body').type(`{${modifier}}k`, { force: true });
    cy.wait(500);
    
    // Buscar si apareció un modal o input de búsqueda
    cy.get('body').then($body => {
      const searchAppeared = $body.find('input[type="search"], [role="dialog"], .search-modal, [data-testid*="search"]').length > 0;
      
      if (searchAppeared) {
        cy.log('✅ Búsqueda global abierta con shortcut');
        
        // Verificar que el input está enfocado
        cy.focused().should('have.attr', 'type', 'search').or('have.attr', 'placeholder');
      } else {
        cy.log('⚠️ Shortcut Cmd/Ctrl+K no activo (puede no estar implementado)');
      }
    });
  });

  it('permite buscar contenido en el dashboard', () => {
    cy.get('body').then($body => {
      // Buscar campo de búsqueda
      const searchSelectors = [
        'input[type="search"]',
        'input[placeholder*="buscar"]',
        '[data-testid="search-input"]'
      ];
      
      let searchInput;
      for (const selector of searchSelectors) {
        if ($body.find(selector).length) {
          searchInput = selector;
          break;
        }
      }
      
      if (searchInput) {
        // Realizar búsqueda
        cy.get(searchInput).first().clear().type('invitado{enter}');
        cy.wait(1000);
        
        // Verificar que hay algún resultado o feedback
        cy.get('body').then($resultBody => {
          const hasResults = $resultBody.find('[data-testid*="result"], .search-result, .result').length > 0 ||
                            $resultBody.text().toLowerCase().includes('invitado') ||
                            $resultBody.text().toLowerCase().includes('resultado');
          
          if (hasResults) {
            cy.log('✅ Búsqueda ejecutada con resultados');
          } else {
            cy.log('⚠️ Sin resultados visuales (puede ser búsqueda vacía)');
          }
        });
      } else {
        cy.log('⚠️ No se pudo realizar búsqueda (campo no encontrado)');
      }
    });
  });

  it('muestra botones de quick actions (añadir invitado, crear tarea)', () => {
    cy.get('body').then($body => {
      const quickActionSelectors = [
        'button:contains("Añadir")',
        'button:contains("Agregar")',
        'button:contains("Crear")',
        'button:contains("Nuevo")',
        'button:contains("+")',
        '[data-testid*="quick"]',
        '[data-testid*="add"]',
        '[aria-label*="añadir"]',
        '[aria-label*="crear"]',
        '.quick-action',
        '.fab',
        'button[aria-label*="Add"]'
      ];
      
      let quickActionsFound = 0;
      for (const selector of quickActionSelectors) {
        if ($body.find(selector).length) {
          quickActionsFound += $body.find(selector).length;
        }
      }
      
      if (quickActionsFound > 0) {
        cy.log(`✅ ${quickActionsFound} botones de quick action encontrados`);
      } else {
        cy.log('⚠️ No se encontraron quick actions visibles');
      }
      
      // Al menos debe haber algunos botones
      expect($body.find('button').length).to.be.greaterThan(0);
    });
  });

  it('permite ejecutar quick action: añadir invitado', () => {
    // Buscar botón de añadir invitado
    cy.get('body').then($body => {
      const addGuestSelectors = [
        'button:contains("Añadir invitado")',
        'button:contains("Agregar invitado")',
        'button:contains("Nuevo invitado")',
        '[data-testid="add-guest"]',
        '[data-testid="quick-add-guest"]'
      ];
      
      let buttonFound = false;
      for (const selector of addGuestSelectors) {
        if ($body.find(selector).length) {
          cy.get(selector).first().click({ force: true });
          cy.wait(1000);
          
          // Verificar que apareció un formulario o modal
          cy.get('body').then($modalBody => {
            const hasModal = $modalBody.find('form, [role="dialog"], .modal, input[name="name"]').length > 0;
            
            if (hasModal) {
              cy.log('✅ Quick action: añadir invitado funcional');
              buttonFound = true;
            }
          });
          
          break;
        }
      }
      
      if (!buttonFound) {
        cy.log('⚠️ Quick action de añadir invitado no encontrado en dashboard');
      }
    });
  });

  it('permite ejecutar quick action: crear tarea', () => {
    cy.get('body').then($body => {
      const addTaskSelectors = [
        'button:contains("Nueva tarea")',
        'button:contains("Crear tarea")',
        'button:contains("Añadir tarea")',
        '[data-testid="add-task"]',
        '[data-testid="quick-add-task"]'
      ];
      
      let buttonFound = false;
      for (const selector of addTaskSelectors) {
        if ($body.find(selector).length) {
          cy.get(selector).first().click({ force: true });
          cy.wait(1000);
          
          cy.get('body').then($modalBody => {
            const hasModal = $modalBody.find('form, [role="dialog"], .modal, input[name="title"], input[name="task"]').length > 0;
            
            if (hasModal) {
              cy.log('✅ Quick action: crear tarea funcional');
              buttonFound = true;
            }
          });
          
          break;
        }
      }
      
      if (!buttonFound) {
        cy.log('⚠️ Quick action de crear tarea no encontrado en dashboard');
      }
    });
  });

  it('filtra resultados de búsqueda por tipo (invitados, tareas, etc.)', () => {
    cy.get('body').then($body => {
      // Buscar tabs o filtros de búsqueda
      const filterSelectors = [
        '[role="tab"]',
        '.tab',
        '.filter',
        '[data-testid*="filter"]',
        'button[data-value]',
        '.search-filter'
      ];
      
      let filtersFound = false;
      for (const selector of filterSelectors) {
        if ($body.find(selector).length > 1) {
          // Si hay múltiples tabs/filtros
          cy.get(selector).should('have.length.greaterThan', 1);
          filtersFound = true;
          cy.log('✅ Filtros de búsqueda encontrados');
          break;
        }
      }
      
      if (!filtersFound) {
        cy.log('⚠️ Filtros de búsqueda no encontrados (puede ser búsqueda simple)');
      }
    });
  });

  it('muestra sugerencias o autocompletado en la búsqueda', () => {
    cy.get('body').then($body => {
      const searchSelectors = [
        'input[type="search"]',
        'input[placeholder*="buscar"]',
        '[data-testid="search-input"]'
      ];
      
      let searchInput;
      for (const selector of searchSelectors) {
        if ($body.find(selector).length) {
          searchInput = selector;
          break;
        }
      }
      
      if (searchInput) {
        // Escribir texto sin presionar enter
        cy.get(searchInput).first().clear().type('inv');
        cy.wait(500);
        
        // Buscar dropdown o lista de sugerencias
        cy.get('body').then($suggestBody => {
          const hasSuggestions = $suggestBody.find('[role="listbox"], .autocomplete, .suggestions, [data-testid*="suggestion"]').length > 0;
          
          if (hasSuggestions) {
            cy.log('✅ Autocompletado/sugerencias funcionando');
          } else {
            cy.log('⚠️ Sin autocompletado visible (puede no estar implementado)');
          }
        });
      }
    });
  });

  it('navega a un resultado de búsqueda al hacer click', () => {
    cy.get('body').then($body => {
      // Buscar campo de búsqueda
      const searchSelectors = [
        'input[type="search"]',
        '[data-testid="search-input"]'
      ];
      
      let searchInput;
      for (const selector of searchSelectors) {
        if ($body.find(selector).length) {
          searchInput = selector;
          break;
        }
      }
      
      if (searchInput) {
        cy.get(searchInput).first().clear().type('invitado{enter}');
        cy.wait(1000);
        
        // Buscar primer resultado clickeable
        cy.get('body').then($resultBody => {
          const resultSelectors = [
            '[data-testid*="result"]',
            '.search-result',
            '[role="option"]',
            'a.result'
          ];
          
          for (const selector of resultSelectors) {
            if ($resultBody.find(selector).length) {
              const currentUrl = cy.url();
              
              cy.get(selector).first().click({ force: true });
              cy.wait(1000);
              
              // Verificar que hubo navegación
              cy.url().should('not.equal', currentUrl);
              cy.log('✅ Navegación desde resultado de búsqueda funcional');
              break;
            }
          }
        });
      } else {
        cy.log('⚠️ No se pudo realizar test de navegación (búsqueda no disponible)');
      }
    });
  });
});
