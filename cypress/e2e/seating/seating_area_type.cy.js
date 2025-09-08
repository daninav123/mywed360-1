describe('Seating Plan - Persistencia de tipo de áreas', () => {
  it('dibuja Puerta y Obstáculo, recarga y siguen presentes con su tipo', () => {
    cy.visit('/invitados/seating');

    // Ir a Banquete
    cy.contains('button', 'Banquete', { timeout: 10000 }).should('be.visible').click();

    // Seleccionar Puertas y dibujar un rectángulo pequeño
    cy.contains('button', 'Puertas').click();
    cy.get('svg').trigger('pointerdown', 200, 200).trigger('pointermove', 260, 230).trigger('pointerup', 260, 230);

    // Seleccionar Obstáculos y dibujar otro rectángulo
    cy.contains('button', 'Obstáculos').click();
    cy.get('svg').trigger('pointerdown', 320, 220).trigger('pointermove', 380, 260).trigger('pointerup', 380, 260);

    // Esperar auto-guardado (debounce ~800ms)
    cy.wait(1500);

    // Recargar
    cy.reload();

    // Verificar que hay al menos una puerta y un obstáculo (paths con data-area-type)
    cy.get('path[data-area-type="door"]', { timeout: 10000 }).should('have.length.greaterThan', 0);
    cy.get('path[data-area-type="obstacle"]').should('have.length.greaterThan', 0);
  });
});
