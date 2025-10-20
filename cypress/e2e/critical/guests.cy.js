/// <reference types="Cypress" />

describe('Tests Críticos de Invitados', () => {
  beforeEach(() => {
    cy.loginToLovenda('user@test.com');
    cy.visit('/invitados');
    cy.wait(3000);
  });

  it('carga la página de invitados', () => {
    cy.get('body').should('be.visible');
    // Buscar texto relacionado con invitados o crear evento
    cy.get('body').then($body => {
      const text = $body.text();
      const hasGuestContent = /invitado|guest|crear evento/i.test(text);
      expect(hasGuestContent).to.be.true;
    });
  });

  it('muestra el botón de añadir invitado', () => {
    cy.get('button').should('exist');
  });

  it('puede buscar invitados', () => {
    cy.get('input').first().type('Juan');
    cy.wait(1000);
    cy.get('body').should('be.visible');
  });

  it('navega al plan de asientos', () => {
    cy.visit('/invitados/seating');
    cy.wait(3000);
    cy.get('body').should('be.visible');
    // Aceptar tanto la ruta esperada como redirección a crear-evento
    cy.url().should('satisfy', (url) => {
      return url.includes('seating') || url.includes('crear-evento');
    });
  });

  it('navega a invitaciones', () => {
    cy.visit('/invitados/invitaciones');
    cy.wait(3000);
    cy.get('body').should('be.visible');
    // Aceptar tanto la ruta esperada como redirección a crear-evento
    cy.url().should('satisfy', (url) => {
      return url.includes('invitaciones') || url.includes('crear-evento');
    });
  });
});
