/**
 * Tests E2E para el Selector de Idioma
 *
 * Verifica que el componente LanguageSelector funciona correctamente
 * en todas las páginas de la aplicación
 */

describe('Selector de Idioma', () => {
  beforeEach(() => {
    // Visitar la página principal
    cy.visit('/', { failOnStatusCode: false });
    cy.wait(1000);
  });

  it('Debe mostrar el selector de idioma en la página principal', () => {
    cy.get('.language-selector').should('exist');
  });

  it('Debe abrir el dropdown al hacer clic', () => {
    cy.get('.language-selector').first().click();
    cy.wait(300);

    // Verificar que aparece el menú con idiomas
    cy.get('.language-selector')
      .should('be.visible')
      .within(() => {
        cy.contains('Spanish').should('be.visible');
        cy.contains('English').should('be.visible');
        cy.contains('French').should('be.visible');
      });
  });

  it('Debe cerrar el dropdown con la tecla ESC', () => {
    cy.get('.language-selector').first().click();
    cy.wait(300);

    // Presionar ESC
    cy.get('body').type('{esc}');
    cy.wait(300);

    // El dropdown debería cerrarse (verificar que Spanish no está visible fuera del botón)
    cy.get('.language-selector button').should('not.contain', 'Spanish');
  });

  it('Debe mostrar un checkmark en el idioma actual', () => {
    cy.get('.language-selector').first().click();
    cy.wait(300);

    // Debería haber un check en el idioma actual
    cy.get('.language-selector svg').should('exist');
  });

  it('Debe cambiar el idioma al hacer clic en una opción', () => {
    // Abrir selector
    cy.get('.language-selector').first().click();
    cy.wait(300);

    // Hacer clic en English
    cy.get('.language-selector').contains('English').click({ force: true });

    cy.wait(500);

    // Verificar que el idioma cambió
    cy.verifyCurrentLanguage('en');
  });

  it('Debe persistir el idioma en localStorage', () => {
    cy.setLanguageProgrammatically('fr');

    cy.window().then((win) => {
      const storedLang = win.localStorage.getItem('i18nextLng');
      expect(storedLang).to.equal('fr');
    });
  });

  it('Debe mantener el idioma después de recargar la página', () => {
    // Cambiar a francés
    cy.setLanguageProgrammatically('fr');
    cy.wait(500);

    // Recargar
    cy.reload();
    cy.wait(1000);

    // Verificar que sigue en francés
    cy.verifyCurrentLanguage('fr');
  });

  it('Debe mostrar el modo debug en el selector', () => {
    cy.get('.language-selector').first().click();
    cy.wait(300);

    // Verificar que existe la opción de debug
    cy.get('.language-selector').contains('Debug').should('exist');
  });

  it('Debe funcionar en dispositivos móviles', () => {
    cy.viewport('iphone-x');
    cy.wait(500);

    cy.get('.language-selector').should('exist');
    cy.get('.language-selector').first().click();
    cy.wait(300);

    cy.get('.language-selector').contains('English').should('be.visible');
  });
});
