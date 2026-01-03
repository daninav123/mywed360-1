// ***********************************************
// Comandos personalizados de Cypress
// ***********************************************

/**
 * Comando para navegar al Seating Plan
 */
Cypress.Commands.add('goToSeatingPlan', () => {
  cy.visit('/invitados/seating');
  cy.wait(1000); // Esperar carga inicial
});

/**
 * Comando para cambiar de pestaña en Seating Plan
 */
Cypress.Commands.add('switchSeatingTab', (tabName) => {
  cy.contains(tabName).click();
  cy.wait(500);
});

/**
 * Comando para generar plan automáticamente
 */
Cypress.Commands.add('generateSeatingPlanAuto', () => {
  cy.get('button').contains('Generar Plan Automáticamente').click();
  cy.wait(5000); // Esperar generación
});

/**
 * Comando para crear invitados de prueba
 */
Cypress.Commands.add('createTestGuests', (count = 50) => {
  const guests = [];
  for (let i = 1; i <= count; i++) {
    guests.push({
      id: `test-guest-${i}`,
      name: `Invitado ${i}`,
      email: `guest${i}@test.com`,
      phone: `+34600${String(i).padStart(6, '0')}`,
      side: i % 2 === 0 ? 'bride' : 'groom',
      group: i % 5 === 0 ? 'family' : 'friends',
      companion: i % 10 === 0 ? 1 : 0,
      confirmed: true,
    });
  }

  // Guardar en localStorage para simular
  cy.window().then((win) => {
    win.localStorage.setItem('test-guests', JSON.stringify(guests));
  });
});

/**
 * Comando para limpiar datos de test
 */
Cypress.Commands.add('cleanSeatingPlan', () => {
  cy.window().then((win) => {
    // Limpiar localStorage
    const keysToRemove = [];
    for (let i = 0; i < win.localStorage.length; i++) {
      const key = win.localStorage.key(i);
      if (key && (key.includes('seating') || key.includes('table'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => win.localStorage.removeItem(key));
  });
});

/**
 * Comando para verificar toast
 */
Cypress.Commands.add('verifyToast', (message) => {
  cy.get('.Toastify__toast', { timeout: 10000 }).should('be.visible').and('contain', message);
});

/**
 * Comando para esperar a que cargue el canvas
 */
Cypress.Commands.add('waitForCanvas', () => {
  cy.get('svg[data-testid="seating-canvas"]', { timeout: 10000 }).should('be.visible');
});

/**
 * Comando para contar mesas en el canvas
 */
Cypress.Commands.add('countTables', () => {
  return cy.get('g[data-table-id]').its('length');
});

/**
 * Comando para verificar que existe el botón de generación automática
 */
Cypress.Commands.add('verifyAutoGenerationButton', () => {
  cy.get('button')
    .contains('Generar Plan Automáticamente')
    .should('be.visible')
    .and('not.be.disabled');
});
