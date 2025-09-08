describe('Seating Plan - Pasillo mínimo afecta separación', () => {
  function minGap(rects) {
    let min = Number.POSITIVE_INFINITY;
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        // Distancia mínima eje-alineada entre bounding boxes (0 si solapan)
        const dx = Math.max(0, Math.max(a.left, b.left) - Math.min(a.right, b.right));
        const dy = Math.max(0, Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom));
        const gap = Math.sqrt(dx*dx + dy*dy);
        if (gap < min) min = gap;
      }
    }
    return min === Number.POSITIVE_INFINITY ? 0 : min;
  }

  function getTableRects() {
    return cy.get('[data-testid^="table-item-"]').then(($els) => Array.from($els).map(el => el.getBoundingClientRect()));
  }

  function openSpaceConfigAndSetAisle(value) {
    cy.get('button[title="Configurar espacio"], button:contains("Espacio")').first().click({ force: true });
    cy.contains('Guardar', { timeout: 10000 }).should('be.visible');
    cy.get('label').contains('Pasillo mínimo').parent().parent().find('input').clear().type(String(value));
    cy.contains('button', 'Guardar').click();
  }

  it('con aisleMin=200 el gap mínimo entre mesas es mayor que con 80', () => {
    cy.visit('/invitados/seating');
    cy.contains('button', 'Banquete', { timeout: 15000 }).should('be.visible').click();

    // Aplicar plantilla inicial
    cy.get('button[title="Plantillas"]').should('be.visible').click();
    cy.contains('Sugerido por datos', { timeout: 10000 }).click();
    cy.get('[data-testid^="table-item-"]', { timeout: 10000 }).should('have.length.greaterThan', 2);
    cy.wait(600);

    // Estado base con pasillo por defecto (~80cm)
    getTableRects().then((baseRects) => {
      const baseGap = minGap(baseRects);

      // Aumentar pasillo mínimo a 200 y re-aplicar plantilla
      cy.contains('button', 'Plantillas').click();
      openSpaceConfigAndSetAisle(200);
      cy.contains('Sugerido por datos', { timeout: 10000 }).click();
      cy.get('[data-testid^="table-item-"]', { timeout: 10000 }).should('have.length.greaterThan', 2);
      cy.wait(800);

      getTableRects().then((newRects) => {
        const newGap = minGap(newRects);
        expect(newGap).to.be.greaterThan(baseGap);
      });
    });
  });
});
