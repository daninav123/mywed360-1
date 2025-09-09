describe('RSVP - Token inválido', () => {
  it('muestra mensaje de error cuando el token no existe', () => {
    // Algunos servidores no tienen fallback de SPA para rutas profundas.
    // Cargamos primero la raíz y navegamos por history API para asegurar que React Router procese la ruta.
    cy.visit('/');
    // Interceptar la petición para simular un token inválido (404) de forma determinista
    cy.intercept('GET', '**/api/rsvp/by-token/**', {
      statusCode: 404,
      body: { error: 'not-found' }
    }).as('getGuestByToken');
    cy.window().then((win) => {
      win.history.pushState({}, '', '/rsvp/invalid-token-xyz');
      win.dispatchEvent(new win.PopStateEvent('popstate'));
    });
    cy.wait('@getGuestByToken');
    cy.contains('Invitado no encontrado', { timeout: 10000 }).should('be.visible');
  });
});
