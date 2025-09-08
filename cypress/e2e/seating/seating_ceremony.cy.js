describe('Seating Plan - Ceremonia E2E', () => {
  it('genera sillas y permite togglear una silla', () => {
    cy.visit('/invitados/seating');

    // Asegurar pestaña Ceremonia activa
    cy.contains('button', 'Ceremonia', { timeout: 10000 }).should('be.visible').click();

    // Abrir configuración de ceremonia y generar
    cy.get('button[title="Configurar ceremonia"]').click();
    cy.contains('h3', 'Configurar Ceremonia').should('be.visible');

    cy.contains('label', 'Filas').parent().find('input').clear().type('3');
    cy.contains('label', 'Columnas').parent().find('input').clear().type('4');

    cy.contains('button', 'Generar').click();

    // Deben existir sillas
    cy.get('div[aria-label^="Silla"]', { timeout: 10000 }).should('have.length.greaterThan', 0);

    // Toggle de una silla: debería cambiar el estilo (borde dashed)
    cy.get('div[aria-label^="Silla"]').first().as('silla');
    cy.get('@silla').should('have.attr', 'style').and('contain', '1px solid');
    cy.get('@silla').click();
    // Reobtener para evitar referencias obsoletas
    cy.get('div[aria-label^="Silla"]').first().should('have.attr', 'style').and('contain', 'dashed');
  });
});
