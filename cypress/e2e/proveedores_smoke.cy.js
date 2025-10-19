/// <reference types="Cypress" />

describe('Proveedores · tablero principal (harness)', () => {
  beforeEach(() => {
    cy.loginToLovenda();
    cy.visit('/test/proveedores-flow');
    cy.get('[data-cy="header-title"]').should('contain', 'Gestión de Proveedores');
  });

  it('muestra datos base y abre la matriz de necesidades', () => {
    cy.get('[data-cy="vistos-section"]').within(() => {
      cy.contains('Catering Deluxe').should('be.visible');
      cy.contains('DJ Night').should('be.visible');
      cy.contains('Foto Natural').should('be.visible');
    });

    cy.get('[data-cy="tab-pipeline"]').click();
    cy.get('[data-cy="pipeline-section"]').within(() => {
      cy.contains('Catering Deluxe').should('be.visible');
      cy.contains('Solicitar propuesta inicial').should('be.visible');
      cy.contains('Esperar confirmación de agenda').should('be.visible');
    });

    cy.get('[data-cy="pipeline-open-matrix"]').click();
    cy.get('[data-cy="needs-modal"]', { timeout: 10000 })
      .should('be.visible')
      .within(() => {
        cy.contains('Matriz de necesidades').should('be.visible');
        cy.contains('Catering Deluxe').should('be.visible');
      });
  });

  it('navega a contratos y muestra métricas calculadas', () => {
    cy.get('[data-cy="tab-contratos"]').click();
    cy.get('[data-cy="contratos-section"]').within(() => {
      cy.get('[data-cy="contratos-total"]').should('contain.text', '0');
      cy.get('[data-cy="contratos-presupuestos"]').should('contain.text', '1');
      cy.get('[data-cy="contratos-servicios"]').should('contain.text', '3');
    });
  });
});

describe('Proveedores · selección múltiple', () => {
  beforeEach(() => {
    cy.loginToLovenda();
    cy.visit('/test/proveedores-smoke');
    cy.contains('Smoke Proveedores').should('be.visible');
  });

  it('activa la barra de acciones masivas y la restablece al limpiar', () => {
    cy.get('input[type="checkbox"]').eq(0).check({ force: true });
    cy.get('input[type="checkbox"]').eq(1).check({ force: true });

    cy.get('[data-cy="selection-bar"]')
      .should('be.visible')
      .and('contain.text', '2 seleccionados')
      .within(() => {
        cy.contains('Comparar').should('exist');
        cy.contains('Cambiar estado').should('exist');
        cy.contains('Revisar duplicados').should('exist');
      });

    cy.get('[data-cy="selection-clear"]').click();
    cy.get('[data-cy="selection-bar"]').should('not.exist');
  });

  it('abre el modal de cambio de estado y lo cierra correctamente', () => {
    cy.get('input[type="checkbox"]').eq(0).check({ force: true });
    cy.get('input[type="checkbox"]').eq(1).check({ force: true });

    cy.contains('Cambiar estado').click();
    cy.contains('Nuevo estado', { timeout: 10000 }).should('be.visible');
    cy.contains('button', 'Cancelar').click();
    cy.contains('Nuevo estado').should('not.exist');
  });
});

describe('Proveedores · comparativa rápida', () => {
  beforeEach(() => {
    cy.loginToLovenda();
    cy.visit('/test/proveedores-compare');
    cy.contains('Comparar (3)').should('be.visible');
  });

  it('ordena columnas y conserva el conteo tras quitar un proveedor', () => {
    cy.contains('button', 'Precio estimado').should('be.visible').click();
    cy.get('button[title="Cambiar dirección"]').as('sortToggle');
    cy.get('@sortToggle').click();
    cy.get('@sortToggle').should('contain.text', 'Asc');
    cy.get('@sortToggle').click();
    cy.get('@sortToggle').should('contain.text', 'Desc');

    cy.contains('label', 'Mostrar precio (num)').within(() => {
      cy.get('input[type="checkbox"]').check({ force: true });
    });
    cy.get('th').contains('Precio (num)').should('be.visible');

    cy.get('tbody tr').first().within(() => {
      cy.contains('button', 'Quitar').click();
    });
    cy.contains('Comparar (2)').should('be.visible');
  });

  it('permite crear grupo desde la selección simulada', () => {
    cy.contains('button', 'Crear grupo con selección').click();
    cy.contains('Grupo "', { timeout: 10000 }).should('be.visible');
  });
});

describe('Proveedores · seguimiento de correos', () => {
  beforeEach(() => {
    cy.loginToLovenda();
    cy.intercept('GET', '**/api/mailgun/events*', {
      statusCode: 200,
      body: {
        success: true,
        items: [
          { event: 'delivered', timestamp: 1700000000 },
          { event: 'opened', timestamp: 1700000300 },
        ],
      },
    }).as('mailEvents');
    cy.visit('/test/proveedores-smoke');
  });

  it('actualiza el historial de eventos y muestra los registros recibidos', () => {
    cy.contains('Foto Natural').parents('.relative').first().within(() => {
      cy.contains('button', 'Ver').click();
    });
    cy.contains('button', 'Seguimiento').click();
    cy.contains('button', 'Actualizar eventos').click();

    cy.wait('@mailEvents');
    cy.contains('Evento delivered').should('be.visible');
    cy.contains('Evento opened').should('be.visible');
  });
});
