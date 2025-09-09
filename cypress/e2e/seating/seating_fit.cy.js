describe('Seating Plan - Fit to Content', () => {
  it('ajusta escala y offset al contenido con el botón ⌂', () => {
    // Evitar problemas de fallback de SPA: cargar raíz y navegar con history API
    cy.visit('/');
    cy.mockWeddingMinimal();
    cy.closeDiagnostic();
    cy.window().then((win) => {
      win.history.pushState({}, '', '/invitados/seating');
      win.dispatchEvent(new win.PopStateEvent('popstate'));
    });

    // Esperar toolbar y luego ir a Banquete y generar una disposición usando Plantillas
    cy.get('button[title="Plantillas"], button[title="Configurar ceremonia"], button[title="Configurar espacio"]', { timeout: 20000 }).should('be.visible');
    cy.contains('button', 'Banquete', { timeout: 10000 }).should('be.visible').click();
    cy.get('button[title="Plantillas"]', { timeout: 10000 }).should('be.visible').click();
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
