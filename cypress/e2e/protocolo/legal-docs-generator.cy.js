/// <reference types="Cypress" />

/**
 * Flujo 18 – Generador de documentos legales.
 * Cobertura: validamos que los descargables expuestos funcionen en modo stub y
 *            emitimos feedback visible para el usuario.
 */
describe('Documentos legales · descargables', () => {
  const loadDocumentosLegales = () => {
    Cypress.env('STUB_FIRESTORE', true);
    cy.visit('/protocolo/documentos');
    cy.loginToLovenda();
    cy.reload();
    cy.closeDiagnostic();
    cy.window().then((win) => {
      if (win.URL && typeof win.URL.createObjectURL === 'function') {
        cy.stub(win.URL, 'createObjectURL')
          .callsFake(() => `blob:doc-${Date.now()}`)
          .as('createObjectURL');
      }
      cy.stub(win, 'open').callsFake(() => null).as('windowOpen');
    });
    cy.contains('h2', 'Descargables', { timeout: 20000 }).should('be.visible');
  };

  it('permite iniciar la descarga de plantillas .DOC para requisitos civiles', () => {
    loadDocumentosLegales();

    cy.contains('.font-medium', 'Solicitud de expediente matrimonial', { timeout: 20000 })
      .parents('div.border')
      .within(() => {
        cy.contains('button', '.DOC').click();
      });

    cy.contains('Descarga iniciada (.DOC)', { timeout: 10000 }).should('be.visible');

    cy.get('@createObjectURL').should('have.been.called');
  });
});
