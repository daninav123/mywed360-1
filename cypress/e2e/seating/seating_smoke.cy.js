describe('Seating Plan - Smoke E2E', () => {
  it('renderiza, genera layout vía Plantillas, dibuja área y undo/redo sin romper', () => {
    // Visitar raíz y navegar vía history API para evitar problemas de fallback de SPA
    cy.visit('/');
    cy.mockWeddingMinimal();
    cy.closeDiagnostic();
    cy.window().then((win) => {
      win.history.pushState({}, '', '/invitados/seating');
      win.dispatchEvent(new win.PopStateEvent('popstate'));
    });
    // Cerrar panel diagnóstico si se vuelve a mostrar tras el cambio de ruta
    cy.closeDiagnostic();
    // Esperar a que la toolbar esté disponible
    cy.get('button[title="Plantillas"], button[title="Configurar ceremonia"], button[title="Configurar espacio"]', { timeout: 20000 }).should('be.visible');

    // Tabs visibles
    cy.contains('button', 'Ceremonia', { timeout: 10000 }).should('be.visible');
    cy.contains('button', 'Banquete').should('be.visible').click();

    // Abrir Plantillas y aplicar una plantilla de banquete
    cy.get('button[title="Plantillas"]').click();
    cy.contains('h3', 'Plantillas').should('be.visible');
    cy.contains('Sugerido por datos').click();

    // Deberían existir botones de quitar invitado (✖) en alguna mesa
    cy.contains('button', '✖', { timeout: 10000 }).should('exist');

    // Cambiar a herramienta Perímetro, dibujar un polígono y finalizar (cambiar a Navegar)
    cy.contains('button', 'Perímetro').click();
    cy.get('svg').first().click(150, 150, { force: true }).click(250, 150, { force: true }).click(250, 230, { force: true }).click(150, 230, { force: true });
    cy.contains('button', 'Navegar').click();

    // Ahora podemos deshacer y rehacer
    cy.get('button[title="Deshacer (Ctrl+Z)"]').should('not.be.disabled').click();
    cy.get('button[title="Rehacer (Ctrl+Y)"]').should('not.be.disabled').click();

    // Comprobar que la toolbar sigue visible tras las acciones
    cy.get('button[title="Plantillas"], button[title="Configurar ceremonia"], button[title="Exportar como PDF"]').should('exist');
  });
});
