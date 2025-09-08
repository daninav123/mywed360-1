describe('Seating Plan - Fit to Content', () => {
  it('ajusta escala y offset al contenido con el botón ⌂', () => {
    cy.visit('/invitados/seating');

    // Ir a Banquete y generar una disposición usando Plantillas
    cy.contains('button', 'Banquete', { timeout: 10000 }).should('be.visible').click();
    cy.get('button[title="Plantillas"]').click();
    cy.contains('h3', 'Plantillas').should('be.visible');
    cy.contains('Boda Mediana').click();

    // Capturar transform inicial del grupo principal del SVG
    cy.get('svg g[transform]').first().invoke('attr', 'transform').then((t0) => {
      // Pulsar Ajustar a pantalla
      cy.get('button[title="Ajustar a pantalla"]').click();
      // Verificar que cambió el transform (offset/scale)
      cy.get('svg g[transform]').first().invoke('attr', 'transform').should((t1) => {
        expect(t1).to.not.equal(t0);
      });
    });
  });
});
