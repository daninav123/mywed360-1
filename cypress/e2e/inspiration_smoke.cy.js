describe('Inspiracion smoke', () => {
  it('carga grid y permite marcar favoritos', () => {
    cy.visit('/inspiracion');
    cy.contains('Inspiración');
    // espera a que carguen imágenes
    cy.get('img[aria-label^="Imagen de inspiración"]', { timeout: 10000 }).should('exist');
    // marca favorito del primer item
    cy.get('button[aria-label^="Añadir a favoritos"]').first().click({ force: true });
    // debe reflejarse en localStorage
    cy.window().then((win) => {
      const storageKey = Object.keys(win.localStorage).find((key) =>
        key.startsWith('inspirationFavorites')
      );
      expect(storageKey, 'clave de favoritos en localStorage').to.exist;
      const favs = JSON.parse(win.localStorage.getItem(storageKey) || '[]');
      expect(Array.isArray(favs)).to.eq(true);
    });
  });
});
