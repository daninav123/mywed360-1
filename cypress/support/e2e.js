import './commands';
import './commands-real-integration';
import { setupAllInterceptors } from './interceptors';

// Configuración global para todos los tests
beforeEach(() => {
  // Solo usar interceptors en tests sin sufijo -real.cy.js
  const specName = Cypress.spec.name || '';
  const isRealIntegrationTest = specName.includes('-real.cy.js');
  
  if (!isRealIntegrationTest) {
    // Setup interceptors solo para tests legacy (sin -real)
    setupAllInterceptors();
  } else {
    cy.log('⚡ Modo integración real: SIN mocks ni interceptors');
  }
  
  // Configurar timeouts más largos para componentes lazy
  cy.intercept('GET', '**/*.js', (req) => {
    req.continue();
  });
});

// Comando para configurar ventana después de visitar una página
Cypress.Commands.add('setupTestMode', () => {
  cy.window().then((win) => {
    if (win) {
      win.__MALOVEAPP_TEST_MODE__ = true;
      win.__MALOVEAPP_DISABLE_PROTECTED_BYPASS__ = false;
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
