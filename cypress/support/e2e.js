// ***********************************************************
// Support file E2E para Cypress
// Se carga automáticamente antes de cada spec
// ***********************************************************

import './commands';

// Configuración global
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevenir que errores no capturados fallen los tests
  // Útil para errores de terceros o warnings esperados
  console.log('Uncaught exception:', err.message);
  return false;
});

// Bypass de autenticación para tests E2E
beforeEach(() => {
  // Marcar que estamos en Cypress para bypass de auth
  cy.window().then((win) => {
    win.Cypress = true;
  });
});
