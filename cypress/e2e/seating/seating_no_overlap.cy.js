describe('Seating Plan - Plantillas sin solapes entre mesas', () => {
  function getRects($els) {
    return Array.from($els).map(el => el.getBoundingClientRect());
  }
  function overlap(a, b) {
    return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
  }

  it('aplica plantilla y no hay solapes entre mesas', () => {
    cy.visit('/invitados/seating');

    // Ir a Banquete y abrir Plantillas
    cy.contains('button', 'Banquete', { timeout: 15000 }).should('be.visible').click();
    cy.get('button[title="Plantillas"]').should('be.visible').click();
    cy.contains('h3', 'Plantillas', { timeout: 10000 }).should('be.visible');

    // Aplicar plantilla sugerida (se adapta a perímetro/obstáculos y resuelve colisiones)
    cy.contains('Sugerido por datos', { timeout: 10000 }).click();

    // Esperar a render y auto-guardado
    cy.get('[data-testid^="table-item-"]', { timeout: 10000 }).should('have.length.greaterThan', 0);
    cy.wait(800);

    // Verificar que no hay solapes entre bounding boxes de mesas
    cy.get('[data-testid^="table-item-"]').then(($els) => {
      const rects = getRects($els);
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i];
          const b = rects[j];
          const hasOverlap = overlap(a, b);
          expect(hasOverlap, `Mesas ${i} y ${j} no deben solaparse`).to.be.false;
        }
      }
    });
  });
});
