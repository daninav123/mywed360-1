import './commands';
import { setupAllInterceptors } from './interceptors';

// Configuración global para todos los tests
beforeEach(() => {
  // Setup interceptors para cada test
  setupAllInterceptors();
  
  // Configurar timeouts más largos para componentes lazy
  cy.intercept('GET', '**/*.js', (req) => {
    req.continue();
  });
});

// Comando para configurar ventana después de visitar una página
Cypress.Commands.add('setupTestMode', () => {
  cy.window().then((win) => {
    if (win) {
      win.__MYWED360_TEST_MODE__ = true;
      win.__MYWED360_DISABLE_PROTECTED_BYPASS__ = false;
    }
  });
});

// Prevenir errores de aplicación no capturados
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignorar errores comunes en tests
  if (err.message.includes('ResizeObserver') ||
      err.message.includes('Non-Error promise rejection') ||
      err.message.includes('NetworkError') ||
      err.message.includes('Firebase') ||
      err.message.includes('firebaseapp')) {
    return false;
  }
  // Dejar que otros errores fallen el test
  return true;
});
