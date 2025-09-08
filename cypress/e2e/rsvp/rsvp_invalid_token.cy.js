describe('RSVP - Token inválido', () => {
  it('muestra mensaje de error cuando el token no existe', () => {
    cy.visit('/rsvp/invalid-token-xyz');
    cy.contains('Invitado no encontrado', { timeout: 10000 }).should('be.visible');
  });
});
