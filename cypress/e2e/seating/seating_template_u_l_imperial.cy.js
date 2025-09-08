describe('Seating Plan - Plantillas U / L / Imperial', () => {
  function getCenters() {
    return cy.get('[data-testid^="table-item-"]').then(($els) => {
      const rects = Array.from($els).map(el => el.getBoundingClientRect());
      return rects.map(r => ({ x: r.left + r.width/2, y: r.top + r.height/2 }));
    });
  }

  function groupsByEdge(points, tol = 60) {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const near = (v, target) => Math.abs(v - target) <= tol;
    const left = points.filter(p => near(p.x, minX)).length;
    const right = points.filter(p => near(p.x, maxX)).length;
    const top = points.filter(p => near(p.y, minY)).length;
    const bottom = points.filter(p => near(p.y, maxY)).length;
    return { left, right, top, bottom, minX, maxX, minY, maxY };
  }

  beforeEach(() => {
    cy.visit('/invitados/seating');
    cy.contains('button', 'Banquete', { timeout: 15000 }).should('be.visible').click();
    cy.get('button[title="Plantillas"]').should('be.visible');
  });

  it('Forma U: mesas en tres bordes (izquierda, derecha e inferior)', () => {
    cy.get('button[title="Plantillas"]').click();
    cy.contains('Forma U', { timeout: 10000 }).click();
    cy.get('[data-testid^="table-item-"]', { timeout: 12000 }).should('have.length.greaterThan', 5);

    getCenters().then((pts) => {
      const g = groupsByEdge(pts, 80);
      expect(g.left).to.be.greaterThan(1);
      expect(g.right).to.be.greaterThan(1);
      expect(g.bottom).to.be.greaterThan(1);
    });
  });

  it('Forma L: mesas en dos bordes (inferior e izquierdo)', () => {
    cy.get('button[title="Plantillas"]').click();
    cy.contains('Forma L', { timeout: 10000 }).click();
    cy.get('[data-testid^="table-item-"]', { timeout: 12000 }).should('have.length.greaterThan', 3);

    getCenters().then((pts) => {
      const g = groupsByEdge(pts, 80);
      expect(g.left).to.be.greaterThan(1);
      expect(g.bottom).to.be.greaterThan(1);
    });
  });

  it('Mesa Imperial única: debe haber 1 mesa grande', () => {
    cy.get('button[title="Plantillas"]').click();
    cy.contains('Mesa Imperial única', { timeout: 10000 }).click();
    cy.get('[data-testid^="table-item-"]', { timeout: 12000 }).should('have.length', 1);
  });
});
