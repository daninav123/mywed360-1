/// <reference types="Cypress" />

// Flujo 9: Diseño Web y Personalización
// - Selecciona plantilla y genera vista previa (usa fallback demo si no hay API key)

describe('Flujo 9 - Diseño web y personalización', () => {
  beforeEach(() => {
    cy.window().then((win) => win.localStorage.clear());
    cy.loginToLovenda();
  });

  it('genera una vista previa de la web con una plantilla', () => {
    cy.visit('/diseno-web');

    // Seleccionar plantilla "Moderna" (o equivalente) de forma robusta
    cy.contains('button', /Moderna/i, { timeout: 10000 })
      .should('be.visible')
      .click();

    // Escribir prompt y generar
    cy.get('textarea[placeholder*="Describe" i]').type('Página moderna minimalista para una boda en Madrid.');
    cy.contains('button', 'Generar Página Web').click();

    // Debe aparecer una vista previa en un iframe (fallback demo si no hay clave)
    cy.get('iframe[title="Vista previa"], iframe').should('exist');
  });
});
