/// <reference types="Cypress" />

// Flujo 13: Notificaciones y Configuración (preferencias)
// - Carga preferencias (GET)
// - Cambia switches y guarda (PUT)

describe('Flujo 13 - Preferencias de notificaciones', () => {
  beforeEach(() => {
    cy.window().then((win) => win.localStorage.clear());
    cy.loginToLovenda();

    // Intercepts al backend (usa base http://localhost:4004 si no hay VITE_BACKEND_BASE_URL)
    cy.intercept('GET', /\/api\/notification-preferences.*/i, {
      statusCode: 200,
      body: { preferences: { channels: { email: true, inapp: true, push: false }, quietHours: { start: '', end: '' } } }
    }).as('getPrefs');

    cy.intercept('PUT', /\/api\/notification-preferences.*/i, (req) => {
      // Validar payload básico
      expect(req.body).to.have.property('channels');
      req.reply({ statusCode: 200, body: { ok: true } });
    }).as('savePrefs');
  });

  it('edita preferencias y guarda cambios', () => {
    cy.visit('/notificaciones/preferencias');
    cy.wait('@getPrefs');

    // Toggle push y setear horario
    cy.contains('label', 'Push', { matchCase: false }).find('input[type="checkbox"]').check({ force: true });
    cy.get('input[placeholder="22:00"]').clear().type('22:00');
    cy.get('input[placeholder="07:00"]').clear().type('07:00');

    cy.contains('button', 'Guardar').click();
    cy.wait('@savePrefs');
    cy.contains('Preferencias guardadas').should('exist');
  });
});

