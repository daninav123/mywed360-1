/// <reference types="Cypress" />

/**
 * Flujo 18 – Generador de documentos legales.
 * Verifica que el progreso marcado en los requisitos se conserva entre recargas.
 */
describe('Documentos legales · progreso de requisitos', () => {
  const LEGAL_STORAGE_KEY = 'legalRequirements_cypress-wedding';
  const REQUIREMENT_LABEL = 'Solicitud de expediente matrimonial';

  beforeEach(() => {
    Cypress.env('STUB_FIRESTORE', true);
    cy.visit('/protocolo/documentos');
    cy.loginToLovenda();
    cy.window().then((win) => {
      win.localStorage.removeItem(LEGAL_STORAGE_KEY);
    });
    cy.reload();
    cy.closeDiagnostic();
    cy.contains('h2', 'Requisitos para registrar la boda', { timeout: 20000 }).should('be.visible');
  });

  it('mantiene el requisito marcado tras recargar la página', () => {
    cy.contains('label', REQUIREMENT_LABEL)
      .find('input[type="checkbox"]')
      .should('not.be.checked');

    cy.contains('label', REQUIREMENT_LABEL).click();

    cy.contains('label', REQUIREMENT_LABEL)
      .find('input[type="checkbox"]')
      .should('be.checked');

    cy.reload();
    cy.closeDiagnostic();
    cy.contains('h2', 'Requisitos para registrar la boda', { timeout: 20000 }).should('be.visible');

    cy.contains('label', REQUIREMENT_LABEL)
      .find('input[type="checkbox"]')
      .should('be.checked');
  });
});
