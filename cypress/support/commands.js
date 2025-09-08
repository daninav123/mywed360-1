// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Import cypress-file-upload plugin for attachFile command
import 'cypress-file-upload';

// Prefijo automático para llamadas a backend cuando se usa URL relativa '/api/*'
// Lee Cypress.env('BACKEND_BASE_URL') definido en cypress.config.js o variables de entorno
const __prefixApiUrl = (url) => {
  try {
    const backend = Cypress.env('BACKEND_BASE_URL');
    if (backend && typeof url === 'string' && url.startsWith('/')) {
      if (url.startsWith('/api/')) {
        return backend.replace(/\/$/, '') + url;
      }
    }
  } catch (_) {}
  return url;
};

// Soporte de todas las firmas: request(url), request(options), request(method, url, body)
Cypress.Commands.overwrite('request', (originalFn, ...args) => {
  try {
    // request(options)
    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
      const opts = { ...args[0] };
      if (opts.url) opts.url = __prefixApiUrl(opts.url);
      return originalFn(opts);
    }
    // request(method, url, body)
    if (
      args.length >= 2 &&
      typeof args[0] === 'string' &&
      typeof args[1] === 'string'
    ) {
      const [method, url, body] = args;
      return originalFn(method, __prefixApiUrl(url), body);
    }
    // request(url)
    if (args.length === 1 && typeof args[0] === 'string') {
      return originalFn(__prefixApiUrl(args[0]));
    }
  } catch (_) {}
  return originalFn(...args);
});

//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Comando personalizado para iniciar sesión
Cypress.Commands.add('loginToLovenda', (email, password) => {
  // Simular autenticación directamente con localStorage (compatible con useAuth.jsx)
  cy.window().then((win) => {
    win.localStorage.setItem('userEmail', email || 'usuario.test@lovenda.com');
    win.localStorage.setItem('isLoggedIn', 'true');
    // También configurar datos de usuario completos para compatibilidad
    const mockUser = {
      uid: 'cypress-test',
      email: email || 'usuario.test@lovenda.com',
      displayName: 'Usuario Test Cypress'
    };
    win.localStorage.setItem('lovenda_user', JSON.stringify(mockUser));
  });
});

// Comando personalizado para navegar a la bandeja de entrada de correo
Cypress.Commands.add('navigateToEmailInbox', () => {
  cy.visit('/email/inbox');
  // Esperar a que la bandeja de entrada se cargue
  cy.get('[data-testid="email-list"]', { timeout: 10000 }).should('be.visible');
});

// Comando para crear y enviar un correo electrónico
Cypress.Commands.add('sendEmail', (recipient, subject, body) => {
  // Navegar al formulario de composición
  cy.get('[data-testid="compose-button"]').click();
  
  // Rellenar el formulario
  cy.get('[data-testid="recipient-input"]').type(recipient);
  cy.get('[data-testid="subject-input"]').type(subject);
  
  // Usar el editor de contenido (podría ser un editor rico)
  cy.get('[data-testid="body-editor"]').type(body);
  
  // Enviar el correo
  cy.get('[data-testid="send-button"]').click();
  
  // Esperar confirmación
  cy.get('[data-testid="success-message"]', { timeout: 10000 }).should('be.visible');
});
