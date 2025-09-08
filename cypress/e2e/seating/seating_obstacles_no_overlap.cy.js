describe('Seating Plan - Plantillas respetan obstáculos (sin solape)', () => {
  function overlap(a, b) {
    return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
  }

  it('dibuja obstáculos, aplica plantilla y verifica que mesas no los pisan', () => {
    cy.visit('/invitados/seating');

    // Ir a Banquete
    cy.contains('button', 'Banquete', { timeout: 15000 }).should('be.visible').click();

    // Seleccionar Obstáculos y dibujar un rectángulo
    cy.contains('button', 'Obstáculos', { timeout: 10000 }).should('be.visible').click();
    cy.get('svg').trigger('pointerdown', 300, 220)
      .trigger('pointermove', 480, 360)
      .trigger('pointerup', 480, 360);

    // Abrir Plantillas y aplicar sugerida
    cy.get('button[title="Plantillas"]').should('be.visible').click();
    cy.contains('h3', 'Plantillas', { timeout: 10000 }).should('be.visible');
    cy.contains('Sugerido por datos', { timeout: 10000 }).click();

    // Esperar a render
    cy.get('[data-testid^="table-item-"]', { timeout: 10000 }).should('have.length.greaterThan', 0);
    cy.wait(800);

    // Tomar bounding boxes de obstáculos y de mesas en coordenadas de pantalla
    cy.get('path[data-area-type="obstacle"]').then(($obs) => {
      const obstacleRects = Array.from($obs).map((el) => el.getBoundingClientRect());
      cy.get('[data-testid^="table-item-"]').then(($tables) => {
        const tableRects = Array.from($tables).map((el) => el.getBoundingClientRect());
        for (const tr of tableRects) {
          const hits = obstacleRects.some((or) => overlap(tr, or));
          expect(hits, 'La mesa no debe solapar con obstáculos').to.be.false;
        }
      });
    });
  });
});
