/// <reference types="cypress" />

/**
 * Tests E2E para sincronización bidireccional Seating ↔ Invitados
 * Verifica que cambios en un módulo se reflejan en el otro
 * 
 * Hook implementado: src/hooks/useSeatingSync.js
 */

describe('Sincronización Seating ↔ Invitados', () => {
  const testGuest = {
    id: 'guest-sync-001',
    name: 'Juan Pérez',
    email: 'juan@test.com',
  };

  const testTable = {
    id: 'table-001',
    name: 'Mesa 1',
    capacity: 8,
  };

  beforeEach(() => {
    // Stub de autenticación
    cy.window().then((win) => {
      win.localStorage.setItem('mw360_auth_token', 'test-token');
    });

    // Mock de guest sin asignación
    cy.intercept('GET', '**/api/guests', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            ...testGuest,
            seatAssignment: null,
            tableId: null,
          },
        ],
      },
    }).as('getGuests');

    // Mock de seating plan vacío
    cy.intercept('GET', '**/api/seating/banquet', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          tables: [
            {
              ...testTable,
              seats: Array(8).fill(null).map((_, i) => ({
                index: i,
                guestId: null,
                occupied: false,
              })),
            },
          ],
        },
      },
    }).as('getSeating');
  });

  describe('Seating → Invitados', () => {
    it('asigna invitado a mesa desde Seating y se refleja en lista de invitados', () => {
      // 1. Ir a Seating Plan
      cy.visit('/invitados/seating');
      cy.wait('@getSeating');

      // Mock de actualización de seating
      cy.intercept('PUT', '**/api/seating/banquet', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            tables: [
              {
                ...testTable,
                seats: [
                  { index: 0, guestId: testGuest.id, occupied: true },
                  ...Array(7).fill(null).map((_, i) => ({
                    index: i + 1,
                    guestId: null,
                    occupied: false,
                  })),
                ],
              },
            ],
          },
        },
      }).as('updateSeating');

      // Mock de actualización de guest
      cy.intercept('PUT', `**/api/guests/${testGuest.id}`, {
        statusCode: 200,
        body: {
          success: true,
          data: {
            ...testGuest,
            seatAssignment: {
              tableId: testTable.id,
              tableName: testTable.name,
              seatIndex: 0,
            },
            tableId: testTable.id,
            table: testTable.name,
          },
        },
      }).as('updateGuest');

      // 2. Arrastrar invitado a mesa
      cy.get('[data-testid="unassigned-guests"]')
        .contains(testGuest.name)
        .drag(`[data-testid="table-${testTable.id}"]`);

      // 3. Verificar que se actualizó seating
      cy.wait('@updateSeating');

      // 4. Verificar que se sincronizó a guest
      cy.wait('@updateGuest').its('request.body').should((body) => {
        expect(body.seatAssignment).to.deep.equal({
          tableId: testTable.id,
          tableName: testTable.name,
          seatIndex: 0,
        });
      });

      // 5. Verificar toast de confirmación
      cy.contains(/asignado.*mesa 1/i).should('be.visible');

      // 6. Ir a lista de invitados
      cy.visit('/invitados');

      // Mock actualizado con asignación
      cy.intercept('GET', '**/api/guests', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              ...testGuest,
              seatAssignment: {
                tableId: testTable.id,
                tableName: testTable.name,
                seatIndex: 0,
              },
              tableId: testTable.id,
              table: testTable.name,
            },
          ],
        },
      }).as('getGuestsUpdated');

      cy.wait('@getGuestsUpdated');

      // 7. Verificar que se muestra la mesa asignada
      cy.get('[data-testid="guest-list-item"]')
        .contains(testGuest.name)
        .parents('[data-testid="guest-list-item"]')
        .within(() => {
          cy.contains('Mesa 1').should('be.visible');
        });
    });

    it('desasigna invitado desde Seating y se refleja en invitados', () => {
      // Mock inicial con guest asignado
      cy.intercept('GET', '**/api/seating/banquet', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            tables: [
              {
                ...testTable,
                seats: [
                  { index: 0, guestId: testGuest.id, occupied: true },
                  ...Array(7).fill(null).map((_, i) => ({
                    index: i + 1,
                    guestId: null,
                    occupied: false,
                  })),
                ],
              },
            ],
          },
        },
      }).as('getSeatingAssigned');

      cy.visit('/invitados/seating');
      cy.wait('@getSeatingAssigned');

      // Mock de desasignación
      cy.intercept('PUT', `**/api/guests/${testGuest.id}`, {
        statusCode: 200,
        body: {
          success: true,
          data: {
            ...testGuest,
            seatAssignment: null,
            tableId: null,
            table: null,
          },
        },
      }).as('unassignGuest');

      // Hacer clic en botón de desasignar
      cy.get(`[data-testid="seat-${testGuest.id}"]`).rightClick();
      cy.contains('button', /desasignar/i).click();

      cy.wait('@unassignGuest');

      // Verificar que vuelve a lista de sin asignar
      cy.get('[data-testid="unassigned-guests"]')
        .contains(testGuest.name)
        .should('be.visible');
    });
  });

  describe('Invitados → Seating', () => {
    it('cambia mesa desde lista de invitados y se refleja en Seating', () => {
      // Mock inicial
      cy.intercept('GET', '**/api/guests', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              ...testGuest,
              seatAssignment: null,
            },
          ],
        },
      }).as('getGuests');

      cy.visit('/invitados');
      cy.wait('@getGuests');

      // Abrir modal de asignación
      cy.get('[data-testid="guest-list-item"]')
        .contains(testGuest.name)
        .click();

      cy.contains('button', /asignar mesa/i).click();

      // Mock de mesas disponibles
      cy.intercept('GET', '**/api/seating/tables', {
        statusCode: 200,
        body: {
          success: true,
          data: [testTable],
        },
      }).as('getTables');

      cy.wait('@getTables');

      // Seleccionar mesa
      cy.get('[data-testid="table-select"]').select(testTable.name);
      cy.contains('button', /confirmar/i).click();

      // Mock de actualización
      cy.intercept('PUT', `**/api/guests/${testGuest.id}`, {
        statusCode: 200,
        body: {
          success: true,
        },
      }).as('assignFromGuests');

      cy.intercept('PUT', '**/api/seating/banquet', {
        statusCode: 200,
        body: {
          success: true,
        },
      }).as('updateSeatingFromGuests');

      cy.wait('@assignFromGuests');
      cy.wait('@updateSeatingFromGuests');

      // Verificar mensaje
      cy.contains(/mesa asignada/i).should('be.visible');

      // Ir a Seating y verificar
      cy.visit('/invitados/seating');

      cy.get(`[data-testid="table-${testTable.id}"]`)
        .contains(testGuest.name)
        .should('be.visible');
    });
  });

  describe('Sincronización masiva', () => {
    it('detecta y corrige discrepancias entre módulos', () => {
      // Mock con discrepancia: guest dice Mesa 1, seating dice Mesa 2
      cy.intercept('GET', '**/api/guests', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              ...testGuest,
              seatAssignment: {
                tableId: 'table-001',
                tableName: 'Mesa 1',
              },
              tableId: 'table-001',
            },
          ],
        },
      }).as('getGuestsDiscrepancy');

      cy.intercept('GET', '**/api/seating/banquet', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            tables: [
              { id: 'table-001', name: 'Mesa 1', seats: [] },
              {
                id: 'table-002',
                name: 'Mesa 2',
                seats: [
                  { index: 0, guestId: testGuest.id, occupied: true },
                ],
              },
            ],
          },
        },
      }).as('getSeatingDiscrepancy');

      cy.visit('/invitados/seating');

      cy.wait('@getSeatingDiscrepancy');
      cy.wait('@getGuestsDiscrepancy');

      // Ejecutar sincronización
      cy.get('[data-testid="sync-button"]').click();

      // Mock de corrección (seating es fuente de verdad)
      cy.intercept('PUT', `**/api/guests/${testGuest.id}`, {
        statusCode: 200,
        body: {
          success: true,
        },
      }).as('correctGuest');

      cy.wait('@correctGuest').its('request.body').should((body) => {
        expect(body.tableId).to.equal('table-002');
        expect(body.table).to.equal('Mesa 2');
      });

      // Verificar mensaje
      cy.contains(/1.*invitado.*sincronizado/i).should('be.visible');
    });

    it('no hace cambios si todo está sincronizado', () => {
      cy.intercept('POST', '**/api/seating/sync', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            changesCount: 0,
          },
        },
      }).as('syncNoChanges');

      cy.visit('/invitados/seating');
      cy.get('[data-testid="sync-button"]').click();

      cy.wait('@syncNoChanges');

      cy.contains(/no hay discrepancias/i).should('be.visible');
    });
  });

  describe('Casos edge', () => {
    it('maneja mesa llena correctamente', () => {
      // Mock de mesa llena
      cy.intercept('GET', '**/api/seating/banquet', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            tables: [
              {
                ...testTable,
                capacity: 2,
                seats: [
                  { index: 0, guestId: 'other-1', occupied: true },
                  { index: 1, guestId: 'other-2', occupied: true },
                ],
              },
            ],
          },
        },
      }).as('getSeatingFull');

      cy.visit('/invitados/seating');
      cy.wait('@getSeatingFull');

      // Intentar asignar
      cy.intercept('PUT', `**/api/guests/${testGuest.id}`, {
        statusCode: 400,
        body: {
          success: false,
          error: 'Mesa llena',
        },
      }).as('assignToFullTable');

      cy.get('[data-testid="unassigned-guests"]')
        .contains(testGuest.name)
        .drag(`[data-testid="table-${testTable.id}"]`);

      cy.wait('@assignToFullTable');

      // Verificar mensaje de error
      cy.contains(/mesa llena/i).should('be.visible');
    });

    it('maneja errores de red en sincronización', () => {
      cy.intercept('PUT', `**/api/guests/${testGuest.id}`, {
        statusCode: 500,
        body: {
          success: false,
          error: 'Error de red',
        },
      }).as('networkError');

      cy.visit('/invitados/seating');

      cy.get('[data-testid="unassigned-guests"]')
        .contains(testGuest.name)
        .drag(`[data-testid="table-${testTable.id}"]`);

      cy.wait('@networkError');

      // Verificar mensaje de error
      cy.contains(/error.*sincronización/i).should('be.visible');

      // Verificar que ofrece reintentar
      cy.contains('button', /reintentar/i).should('be.visible');
    });
  });
});

describe('Sincronización - Eventos en tiempo real', () => {
  it('escucha eventos de sincronización de otros componentes', () => {
    cy.visit('/invitados/seating');

    // Simular evento de sincronización desde otro componente
    cy.window().then((win) => {
      win.dispatchEvent(new CustomEvent('mywed360-seating-sync', {
        detail: {
          source: 'guests',
          guestId: 'guest-001',
          seatAssignment: { tableId: 'table-001' },
        },
      }));
    });

    // Verificar que se actualizó la vista
    // (requiere que el componente esté escuchando)
    cy.wait(1000); // Esperar debounce
    
    // El componente debería recargar datos
    cy.get('[data-testid="table-table-001"]').should('be.visible');
  });
});
