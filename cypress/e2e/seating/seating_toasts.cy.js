describe('Seating Plan - Toasts E2E', () => {
  it('muestra toast al guardar dimensiones del espacio', () => {
    cy.visit('/invitados/seating');

    // Abrir configuración de espacio y guardar
    cy.get('button[title="Configurar espacio"]', { timeout: 10000 }).should('be.visible').click();
    cy.contains('h3', 'Configurar Espacio').should('be.visible');

    // Cambiar ligeramente el ancho y guardar
    cy.contains('label', 'Ancho (m)').parent().find('input').then($input => {
      const current = $input.val();
      const next = (parseFloat(current || '10') + 0.5).toString();
      cy.wrap($input).clear().type(next);
    });
    cy.contains('button', 'Guardar').click();

    // Debe aparecer toast de éxito
    cy.contains('Dimensiones guardadas', { timeout: 10000 }).should('be.visible');

    // No hay botón de Auto IA: test finaliza tras validar guardado de espacio
  });
});
