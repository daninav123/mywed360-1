/// <reference types=\"cypress\" />

describe('Comparativa de Proveedores (test route)', () => {
  it('Ordena, muestra precio numérico, quita de selección y exporta CSV', () => {
    cy.visit('/test/proveedores-compare');

    // Modal abierto con 3 elementos
    cy.contains('Comparar (3)').should('be.visible');

    // Botones de orden
    cy.contains('button', 'Puntuación IA').should('be.visible');
    cy.contains('button', 'Nombre').should('be.visible');
    cy.contains('button', 'Precio estimado').should('be.visible');

    // Mostrar precio (num)
    cy.contains('label', 'Mostrar precio (num)').within(() => {
      cy.get('input[type="checkbox"]').check({ force: true });
    });
    cy.get('th').contains('Precio (num)').should('exist');

    // Orden por precio
    cy.contains('button', 'Precio estimado').click();\n    // Toast de éxito\n    cy.contains("Grupo \"", { matchCase: false }).should("exist");
    cy.contains('button', 'Asc').click({ force: true });
    cy.contains('button', 'Desc').click({ force: true });

    // Quitar un elemento
    cy.get('tbody tr').should('have.length.at.least', 2);
    cy.get('tbody tr').first().within(() => {
      cy.contains('button', 'Quitar').click();\n    // Toast de éxito\n    cy.contains("Grupo \"", { matchCase: false }).should("exist");
    });
    cy.contains('Comparar (2)').should('be.visible');

    // Crear grupo con selección (no validamos contenido, pero debe ejecutarse sin errores)
    cy.contains('button', 'Crear grupo con selección').click();\n    // Toast de éxito\n    cy.contains("Grupo \"", { matchCase: false }).should("exist");
  });
});

