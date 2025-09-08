describe('Seating Plan - Plantilla: Distribución circular', () => {
  function getTableCenters() {
    return cy.get('[data-testid^="table-item-"]').then(($els) => {
      const rects = Array.from($els).map(el => el.getBoundingClientRect());
      return rects.map(r => ({ x: r.left + r.width/2, y: r.top + r.height/2 }));
    });
  }

  function centroid(points) {
    const n = points.length;
    const sx = points.reduce((a,p) => a + p.x, 0);
    const sy = points.reduce((a,p) => a + p.y, 0);
    return { x: sx / n, y: sy / n };
  }

  it('coloca las mesas aproximadamente en un anillo', () => {
    cy.visit('/invitados/seating');
    cy.contains('button', 'Banquete', { timeout: 15000 }).should('be.visible').click();

    cy.get('button[title="Plantillas"]').should('be.visible').click();
    cy.contains('Distribución circular', { timeout: 10000 }).click();

    cy.get('[data-testid^="table-item-"]', { timeout: 12000 }).should('have.length.greaterThan', 4);

    getTableCenters().then((centers) => {
      const c = centroid(centers);
      const radii = centers.map(p => Math.hypot(p.x - c.x, p.y - c.y));
      const rAvg = radii.reduce((a,b)=>a+b,0) / radii.length;
      const tolerance = rAvg * 0.25; // 25% de tolerancia
      const minR = Math.min(...radii);
      const maxR = Math.max(...radii);
      expect(maxR - minR).to.be.lessThan(tolerance);
    });
  });
});
