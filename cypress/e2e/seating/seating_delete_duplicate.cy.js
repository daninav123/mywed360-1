describe('Seating Plan - Duplicar y Eliminar mesa con Undo/Redo', () => {
  it('duplica, elimina y usa undo/redo correctamente', () => {
    cy.visit('/invitados/seating');

    // Generar layout 1x1
    cy.contains('button', 'Banquete', { timeout: 10000 }).should('be.visible').click();
    cy.get('button[title="Configurar banquete"]').click();
    cy.contains('h3', 'Configurar Banquete').should('be.visible');
    cy.contains('label', 'Filas de mesas').parent().find('input').clear().type('1');
    cy.contains('label', 'Columnas de mesas').parent().find('input').clear().type('1');
    cy.contains('label', 'Asientos por mesa').parent().find('input').clear().type('4');
    cy.contains('button', 'Generar').click();

    // Seleccionar mesa
    cy.get('[data-testid^="table-item-"]').first().click();

    // Contar mesas iniciales
    cy.get('[data-testid^="table-item-"]').then(($tables0) => {
      const initial = $tables0.length;
      expect(initial).to.be.greaterThan(0);

      // Duplicar
      cy.contains('button', 'Duplicar').click();
      cy.get('[data-testid^="table-item-"]').should('have.length', initial + 1);

      // Undo
      cy.get('button[title="Deshacer (Ctrl+Z)"]').click();
      cy.get('[data-testid^="table-item-"]').should('have.length', initial);

      // Redo
      cy.get('button[title="Rehacer (Ctrl+Y)"]').click();
      cy.get('[data-testid^="table-item-"]').should('have.length', initial + 1);

      // Eliminar mesa duplicada (seleccionar alguna mesa)
      cy.get('[data-testid^="table-item-"]').last().click();
      cy.on('window:confirm', () => true);
      cy.contains('button', 'Eliminar').click();
      cy.get('[data-testid^="table-item-"]').should('have.length', initial);
    });
  });
});
