/// <reference types=\"cypress\" />

describe('Proveedores smoke', () => {
  it('Carga la página principal sin romper y muestra botones clave', () => {
    cy.visit('/proveedores');
    cy.contains('Proveedores').should('exist');
    cy.contains('Nuevo Proveedor').should('exist');
    cy.contains('Búsqueda IA').should('exist');
  });

  it('Muestra barra de selección al seleccionar tarjetas (ruta de smoke)', () => {
    cy.visit('/test/proveedores-smoke');
    cy.contains('Smoke Proveedores').should('exist');
    cy.get('input[type="checkbox"]').first().check({ force: true });
    cy.get('input[type="checkbox"]').eq(1).check({ force: true });
    cy.contains('seleccionados').should('exist');
    cy.contains('Comparar').should('exist');
    cy.contains('Cambiar estado').should('exist');
    cy.contains('Revisar duplicados').should('exist');
    cy.contains('Limpiar').click();
    cy.contains('seleccionados').should('not.exist');
  });

  it('Comparar: orden, precio (num), quitar y crear grupo (stub)', () => {
    cy.visit('/test/proveedores-compare');
    cy.contains('Comparar (3)').should('be.visible');

    cy.contains('button', 'Puntuación IA').should('be.visible');
    cy.contains('button', 'Nombre').should('be.visible');
    cy.contains('button', 'Precio estimado').should('be.visible');

    cy.contains('label', 'Mostrar precio (num)').within(() => {
      cy.get('input[type="checkbox"]').check({ force: true });
    });
    cy.get('th').contains('Precio (num)').should('exist');

    cy.contains('button', 'Precio estimado').click();
    cy.contains('button', 'Asc').click({ force: true });
    cy.contains('button', 'Desc').click({ force: true });

    cy.get('tbody tr').first().within(() => {
      cy.contains('button', 'Quitar').click();
    });
    cy.contains('Comparar (2)').should('be.visible');

    cy.contains('button', 'Crear grupo con selección').click();
    cy.contains('Grupo "').should('exist');
  });
});

  it("Cambiar estado abre y cierra modal", () => {
    cy.visit('/test/proveedores-smoke');
    cy.get('input[type="checkbox"]').first().check({ force: true });
    cy.get('input[type="checkbox"]').eq(1).check({ force: true });
    cy.contains('Cambiar estado').click();
    cy.contains('Nuevo estado').should('be.visible');
    cy.contains('button', 'Cancelar').click();
    cy.contains('Nuevo estado').should('not.exist');
  });

  it("Seguimiento: actualiza eventos remotos", () => {
    cy.intercept('GET', '/api/mailgun/events*', {
      statusCode: 200,
      body: { success: true, items: [
        { event: 'delivered', timestamp: 1700000000 },
        { event: 'opened', timestamp: 1700000300 }
      ] }
    }).as('mailEvents');
    cy.visit('/test/proveedores-smoke');
    cy.contains('Foto Natural').parents('.relative').within(() => {
      cy.contains('button', 'Ver').click();
    });
    cy.contains('button', 'Seguimiento').click();
    cy.contains('button', 'Actualizar eventos').click();
    cy.wait('@mailEvents');
    cy.contains('Evento opened').should('exist');
  });
});
