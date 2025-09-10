describe('Gestión de Invitados - Flujo Completo (E2E)', () => {
  const visitGuests = () => {
    cy.visit('/');
    cy.mockWeddingMinimal();
    cy.closeDiagnostic();
    cy.window().then((win) => {
      win.history.pushState({}, '', '/invitados');
      win.dispatchEvent(new win.PopStateEvent('popstate'));
    });
    // Esperar cabecera de página
    cy.contains('Gestiona tu lista de invitados de forma eficiente', { timeout: 20000 }).should('be.visible');
  };

  it('crea invitado manualmente, abre resumen RSVP, realiza alta masiva y filtra', () => {
    visitGuests();

    // 1) Abrir modal de nuevo invitado y completar formulario mínimo
    cy.contains('button', /añadir/i, { timeout: 10000 }).should('be.visible').click();

    // Rellena nombre y email (placeholders estables)
    cy.get('input[placeholder="Nombre completo del invitado"]', { timeout: 10000 }).type('Invitado E2E');
    cy.get('input[placeholder="correo@ejemplo.com"]').type('e2e.inv@ex.com');

    // Guardar
    cy.contains('button', /guardar/i).click();

    // Debe aparecer en la lista
    cy.contains('td, div', 'Invitado E2E', { timeout: 10000 }).should('exist');
    cy.contains('td, div', 'e2e.inv@ex.com').should('exist');

    // 2) Abrir Resumen RSVP y validar métricas visibles
    cy.contains('button', 'Resumen RSVP', { timeout: 10000 }).click();
    cy.contains('div, h2, h3', 'Resumen RSVP', { timeout: 10000 }).should('be.visible');
    // Cierra modal
    cy.contains('button', 'Cerrar').click();

    // 3) Alta masiva (1 fila) y verificar aparición
    cy.contains('button', 'Alta masiva', { timeout: 10000 }).click();
    // En la tabla, primera fila: completar Nombre, Email (columnas requeridas)
    cy.get('table input').eq(0).type('Otro E2E');            // name
    cy.get('table input').eq(1).type('otro.e2e@ex.com');     // email
    // Guardar alta masiva
    cy.contains('button', /guardar/i).click();

    // Verificar que el nuevo registro aparece en la lista
    cy.contains('div, td', 'otro.e2e@ex.com', { timeout: 10000 }).should('exist');

    // 4) Filtrar por búsqueda
    cy.get('input[placeholder="Buscar por nombre, email o teléfono..."]', { timeout: 10000 }).type('Otro E2E');
    cy.contains('div, td', 'Otro E2E', { timeout: 10000 }).should('exist');
  });
});
