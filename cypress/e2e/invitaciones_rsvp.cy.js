describe('Invitaciones RSVP', () => {
  it('abre invitaciones y muestra acciones RSVP', () => {
    cy.visit('/invitados/invitaciones');
    cy.contains('Selección de Plantilla').should('exist');
    // Ir al paso 4 para ver acciones de RSVP
    // Avanza de forma controlada pulsando el botón Generar invitación sin prompt (debe seguir visible la UI)
    cy.contains('Opciones Avanzadas', { timeout: 10000 }).should('exist');
    cy.contains('RSVP').should('exist');
    cy.contains('Simular recordatorios').should('exist');
  });
});

