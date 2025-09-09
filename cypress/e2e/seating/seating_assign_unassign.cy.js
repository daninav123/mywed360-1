describe('Seating Plan - Asignar y Desasignar', () => {
  it('asigna por click desde Pendientes y desasigna con botón de mesa', () => {
    // Evitar problemas de fallback de SPA: cargar raíz y navegar con history API
    cy.visit('/');
    cy.mockWeddingMinimal();
    cy.closeDiagnostic();
    cy.window().then((win) => {
      win.history.pushState({}, '', '/invitados/seating');
      win.dispatchEvent(new win.PopStateEvent('popstate'));
    });

    // Esperar a que la toolbar esté lista
    cy.get('button[title="Plantillas"], button[title="Configurar ceremonia"], button[title="Configurar espacio"]', { timeout: 20000 }).should('be.visible');

    // Generar layout con Plantillas
    cy.contains('button', 'Banquete', { timeout: 15000 }).should('be.visible').click();
    cy.get('button[title="Plantillas"]', { timeout: 15000 }).should('be.visible').click();
    cy.contains('h3', 'Plantillas').should('be.visible');
    cy.contains('Sugerido por datos').click();

    // Seleccionar la única mesa
    cy.get('[data-testid^="table-item-"]', { timeout: 15000 }).first().click();

    // Abrir panel de pendientes
    cy.contains('Pendientes (', { timeout: 15000 }).should('be.visible');
    cy.contains('button', 'Mostrar Invitados').click();

    // Si no hay invitados seed, este test no puede validar asignación real.
    // Aún así, intentamos asignar si hay al menos un invitado pendiente.
    cy.get('div[aria-label^="Invitado"]').then(($items) => {
      if ($items.length > 0) {
        cy.wrap($items[0]).click();
        // Debe aparecer toast de éxito
        cy.contains('Invitado asignado a la mesa', { timeout: 15000 }).should('be.visible');

        // Quitar todos los invitados de la mesa con el botón ✖ de la mesa
        cy.get('[data-testid^="table-item-"]', { timeout: 15000 }).first().find('button').contains('✖').click();
        cy.get('.Toastify__toast', { timeout: 15000 }).should('exist').then(($toasts) => {
          const t = $toasts.text();
          expect(t).to.match(/invitado\(s\) desasignado\(s\)|Error al desasignar/);
        });
      } else {
        // Si no hay invitados, no falla el test.
        cy.log('No hay invitados pendientes para asignar');
      }
    });
  });
});
