describe('Seating Plan - Límite de capacidad por mesa', () => {
  const WID = 'test-wedding-capacity';

  function setActiveWeddingBeforeVisit() {
    cy.visit('/invitados/seating', {
      onBeforeLoad(win) {
        win.localStorage.setItem('lovenda_active_wedding', WID);
        win.localStorage.setItem('mywed360_active_wedding', WID);
      },
    });
  }

  function ensureGuests(n = 3) {
    const names = Array.from({ length: n }).map((_, i) => `Invitado Cap ${i + 1}`);
    names.forEach((name, idx) => {
      cy.request('POST', '/api/rsvp/dev/create', {
        weddingId: WID,
        name,
        email: `cap${idx + 1}@example.com`,
      }).its('status').should('eq', 200);
    });
  }

  it('bloquea la asignación cuando seats está completo y muestra toast de error', () => {
    // Seed mínimo: 3 invitados en la boda de pruebas
    ensureGuests(3);

    // Abrir Seating con activeWedding forzado
    setActiveWeddingBeforeVisit();

    // Ir a Banquete y generar mesas
    cy.contains('button', 'Banquete', { timeout: 15000 }).should('be.visible').click();
    cy.get('button[title="Plantillas"]').should('be.visible').click();
    cy.contains('Sugerido por datos', { timeout: 10000 }).click();
    cy.get('[data-testid^="table-item-"]', { timeout: 10000 }).should('have.length.greaterThan', 0);

    // Seleccionar una mesa
    cy.get('[data-testid^="table-item-"]').first().click();

    // Establecer seats = 1 en el editor de mesa
    cy.get('#table-auto-capacity').uncheck({ force: true });\n    cy.contains('label', 'Capacidad máxima').parent().find('input').clear().type('1');

    // Mostrar lista de invitados disponibles desde acciones rápidas
    cy.contains('button', 'Mostrar Invitados').click();

    // Asignar primer invitado (debería funcionar)
    cy.get('[aria-label^="Invitado "]').first().click();

    // Intentar asignar segundo invitado (debe dar error de capacidad completa)
    cy.get('[aria-label^="Invitado "]').eq(1).click();

    // Validar toast de error
    cy.contains('Capacidad completa', { timeout: 8000 }).should('be.visible');

    // Badge de ocupación debe mostrar 1/1
    cy.get('[data-testid^="table-item-"]').first().within(() => {
      cy.contains('1/1').should('be.visible');
    });
  });
});
