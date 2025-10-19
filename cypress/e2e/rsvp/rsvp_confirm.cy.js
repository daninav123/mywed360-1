/// <reference types="Cypress" />

const guestToken = 'token-valid-guest';

describe('RSVP · confirmación directa desde enlace', () => {
  beforeEach(() => {
    Cypress.env('STUB_FIRESTORE', true);
  });

  it('permite confirmar asistencia de un invitado válido', () => {
    const guestPayload = {
      name: 'Maria Fernandez',
      status: 'pending',
      companions: 1,
      allergens: 'Frutos secos',
    };

    cy.intercept('GET', `**/api/rsvp/by-token/${guestToken}`, {
      statusCode: 200,
      body: guestPayload,
    }).as('getGuest');

    cy.intercept('PUT', `**/api/rsvp/by-token/${guestToken}`, (req) => {
      req.reply({
        statusCode: 200,
        body: { success: true },
      });
    }).as('updateGuest');

    cy.visit(`/rsvp/${guestToken}`);
    cy.wait('@getGuest');

    cy.get('h1', { timeout: 10000 }).should('contain.text', 'Confirm');
    cy.contains('Hola Maria Fernandez').should('be.visible');

    cy.get('form').within(() => {
      cy.get('input[type="number"]').clear().type('2');
      cy.get('textarea').clear().type('Sin restricciones');
      cy.get('input[type="radio"][value="rejected"]').check({ force: true });
    });

    cy.contains('button', 'Enviar respuesta').click();
    cy.wait('@updateGuest').its('request.body').should((body) => {
      expect(body).to.include({
        status: 'rejected',
        companions: 2,
      });
      expect(body.allergens).to.equal('Sin restricciones');
    });

    cy.get('h1', { timeout: 10000 }).should('contain.text', 'Gracias');
    cy.contains('Maria Fernandez').should('be.visible');
    cy.contains('Hemos registrado tu respuesta', { timeout: 10000 }).should('be.visible');
    cy.contains('Hemos registrado tu respuesta. Nos vemos pronto.').should('be.visible');
  });

  it('muestra mensaje de error si el token es inválido', () => {
    cy.intercept('GET', '**/api/rsvp/by-token/token-no-existe', {
      statusCode: 404,
      body: { error: 'not_found' },
    }).as('getInvalidGuest');

    cy.visit('/rsvp/token-no-existe');
    cy.wait('@getInvalidGuest');

    cy.contains('Invitado no encontrado', { timeout: 10000 }).should('be.visible');
  });
});
