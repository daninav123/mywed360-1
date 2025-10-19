/// <reference types="cypress" />

const answerPrompt = (text) => {
  cy.get('input[placeholder^="Escribe tu respuesta"]', { timeout: 12000 })
    .clear()
    .type(`${text}{enter}`, { delay: 0 });
};

describe('Personalización IA continua - captura de estilo', () => {
  beforeEach(() => {
    cy.window().then((win) => win.localStorage.clear());
    cy.loginToLovenda('owner.personalizacion@lovenda.test');
    cy.window().then((win) => {
      const profileRaw = win.localStorage.getItem('MyWed360_user_profile');
      const profile = profileRaw ? JSON.parse(profileRaw) : {};
      win.localStorage.setItem(
        'MyWed360_user_profile',
        JSON.stringify({
          ...profile,
          uid: 'owner-personalizacion',
          role: 'owner',
          emailVerified: true,
        })
      );
    });
  });

  it('registra el estilo seleccionado durante la conversación asistida', () => {
    cy.visit('/crear-evento-asistente');
    cy.closeDiagnostic();

    cy.contains('¿Qué tipo de evento quieres organizar?', { timeout: 20000 }).should('be.visible');
    cy.contains('button', 'Boda').click();

    answerPrompt('Claudia y Marcos');
    answerPrompt('2026-09-20');
    answerPrompt('Sevilla, España');

    cy.contains('¿Cuál encaja mejor?', { timeout: 15000 }).should('be.visible');
    cy.contains('button', 'Boho').click();

    cy.contains('¿Cuántas personas calculas que asistirán?', { timeout: 15000 }).should('be.visible');
    cy.contains('button', 'Entre 50 y 100 personas').click();
    cy.contains('¿Qué nivel de formalidad imaginas?', { timeout: 15000 }).should('be.visible');
    cy.contains('button', 'Semi formal').click();
    cy.contains('Y sobre la ceremonia', { timeout: 15000 }).should('be.visible');
    cy.contains('button', 'Civil').click();

    cy.contains('¿Quieres añadir algún detalle importante', { timeout: 15000 }).should('be.visible');
    cy.contains('button', 'Saltar este detalle').click();

    cy.contains('Resumen del evento', { timeout: 15000 }).should('be.visible');
    cy.contains('Estilo').closest('li').should('contain', 'Boho');
  });
});
