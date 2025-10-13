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

// Prefijo automÃ¡tico para llamadas a backend cuando se usa URL relativa '/api/*'
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

const __maybeStubRequest = (method, url, body) => {
  try {
    const stubRsvp =
      Cypress.env('STUB_RSVP') === true || Cypress.env('STUB_RSVP') === 'true';
    if (!stubRsvp) return null;
    if (!method || !url) return null;
    const normalizedMethod = String(method).toUpperCase();
    if (
      normalizedMethod !== 'POST' ||
      !url.includes('/api/rsvp/dev/create')
    ) {
      return null;
    }

    const now = Date.now();
    const token = `stub-token-${now}-${Math.floor(Math.random() * 1000)}`;
    const weddingId = body?.weddingId || 'stub-wedding';
    const guestId =
      body?.guestId ||
      body?.id ||
      `guest-${Math.floor(Math.random() * 1000)}`;

    return cy.wrap({
      status: 200,
      statusText: 'OK',
      headers: {},
      body: {
        success: true,
        ok: true,
        token,
        link: `${(Cypress.config('baseUrl') || 'http://localhost:5173').replace(/\/$/, '')}/rsvp/${token}`,
        weddingId,
        guestId,
      },
    });
  } catch (_) {
    return null;
  }
};

// Soporte de todas las firmas: request(url), request(options), request(method, url, body)
Cypress.Commands.overwrite('request', (originalFn, ...args) => {
  try {
    // request(options)
    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
      const opts = { ...args[0] };
      if (opts.url) opts.url = __prefixApiUrl(opts.url);
      const stubbed = __maybeStubRequest(opts.method || opts.body?.method || 'GET', opts.url, opts.body);
      if (stubbed) return stubbed;
      return originalFn(opts);
    }
    // request(method, url, body)
    if (
      args.length >= 2 &&
      typeof args[0] === 'string' &&
      typeof args[1] === 'string'
    ) {
      const [method, url, body] = args;
      const prefixed = __prefixApiUrl(url);
      const stubbed = __maybeStubRequest(method, prefixed, body);
      if (stubbed) return stubbed;
      return originalFn(method, prefixed, body);
    }
    // request(url)
    if (args.length === 1 && typeof args[0] === 'string') {
      const prefixed = __prefixApiUrl(args[0]);
      const stubbed = __maybeStubRequest('GET', prefixed, undefined);
      if (stubbed) return stubbed;
      return originalFn(prefixed);
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

// Comando personalizado para iniciar sesiÃ³n
Cypress.Commands.add('loginToLovenda', (email, password) => {
  // Simular autenticaciÃ³n directamente con localStorage (compatible con useAuth.jsx)
  cy.window().then((win) => {
    const userEmail = email || 'usuario.test@lovenda.com';
    win.localStorage.setItem('userEmail', userEmail);
    win.localStorage.setItem('isLoggedIn', 'true');
    // TambiÃ©n configurar datos de usuario completos para compatibilidad
    const mockUser = {
      uid: 'cypress-test',
      email: userEmail,
      displayName: 'Usuario Test Cypress'
    };
    win.localStorage.setItem('lovenda_user', JSON.stringify(mockUser));
    win.localStorage.setItem('mywed360_user', JSON.stringify(mockUser));
    win.localStorage.setItem('mywed360_login_email', userEmail);
    win.localStorage.setItem('MyWed360_user_profile', JSON.stringify(mockUser));

    if (!win.__MOCK_WEDDING__) {
      const defaultWeddingId = 'cypress-wedding';
      win.__MOCK_WEDDING__ = {
        weddings: [
          {
            id: defaultWeddingId,
            name: 'Boda Cypress',
            weddingDate: '2026-05-15',
            location: 'Madrid',
            progress: 35,
            active: true,
          },
        ],
        activeWedding: { id: defaultWeddingId },
      };
    }
    try {
      const activeId =
        (win.__MOCK_WEDDING__ && win.__MOCK_WEDDING__.activeWedding?.id) ||
        win.localStorage.getItem('mywed360_active_wedding') ||
        'cypress-wedding';
      win.localStorage.setItem('mywed360_active_wedding', activeId);
      win.localStorage.setItem('lovenda_active_wedding', activeId);
    } catch (_) {}
  });
});

// Comando específico para preparar una sesión de administrador
Cypress.Commands.add('loginAsAdmin', () => {
  cy.window().then((win) => {
    const adminUser = {
      uid: 'admin-cypress',
      email: 'admin@lovenda.com',
      displayName: 'Administrador Lovenda',
      role: 'admin',
      isAdmin: true,
      preferences: {
        theme: 'dark',
        emailNotifications: false
      }
    };

    win.localStorage.setItem('lovenda_user', JSON.stringify(adminUser));
    win.localStorage.setItem('MyWed360_user_profile', JSON.stringify(adminUser));
    win.localStorage.setItem('MyWed360_admin_profile', JSON.stringify(adminUser));
    win.localStorage.setItem('isLoggedIn', 'true');
    win.localStorage.setItem('isAdminAuthenticated', 'true');

    // Añadir también claves de sesión para compatibilidad con restoreAdminSession()
    try {
      const now = Date.now();
      const sessionId = `sess_${now}`;
      const sessionToken = `tok_${now}`;
      const expiresAt = new Date(now + 12 * 60 * 60 * 1000).toISOString(); // +12h
      win.localStorage.setItem('MyWed360_admin_session_id', sessionId);
      win.localStorage.setItem('MyWed360_admin_session_token', sessionToken);
      win.localStorage.setItem('MyWed360_admin_session_expires', expiresAt);
    } catch (_) {}
  });
});

// Comando personalizado para navegar a la bandeja de entrada de correo
Cypress.Commands.add('navigateToEmailInbox', () => {
  cy.visit('/email/inbox');
  cy.get('[data-testid="email-title"]', { timeout: 20000 }).should('contain', 'Recibidos');
  cy.closeDiagnostic();
});

// Comando para crear y enviar un correo electrÃ³nico

// ======== Seating helpers =========
// Cierra el panel de diagnÃ³stico si estÃ¡ visible
Cypress.Commands.add('closeDiagnostic', () => {
  cy.get('body').then(($body) => {
    const hasModal = $body.find('div.fixed.inset-0').length > 0;
    if (hasModal) {
      // Intentar cerrar por el botÃ³n Ã— del header del panel
      cy.contains('h2', 'Panel de DiagnÃ³stico MyWed360', { timeout: 1000 })
        .parents('div')
        .first()
        .parent() // header container
        .within(() => {
          cy.contains('button', 'Ã—').click({ force: true });
        });
    } else {
      // Fallback: busca el botÃ³n en el DOM actual sin fallar si no existe
      const $btn = $body.find('button[title="Panel de DiagnÃ³stico"]');
      if ($btn && $btn.length) {
        cy.wrap($btn.first()).click({ force: true });
      }
    }
  });
});

// Inyecta un contexto mÃ­nimo de boda para que SeatingPlanRefactored renderice la toolbar
Cypress.Commands.add('mockWeddingMinimal', () => {
  cy.window().then((win) => {
    win.__MOCK_WEDDING__ = {
      weddings: [{ id: 'w1', name: 'Demo Wedding' }],
      activeWedding: { id: 'w1', name: 'Demo Wedding' },
    };
  });
});

// Limpia el estado local del Seating (localStorage) para tests aislados
Cypress.Commands.add('resetSeatingLS', () => {
  cy.window().then((win) => {
    try {
      const keys = Object.keys(win.localStorage || {});
      keys.filter((k) => k.startsWith('seatingPlan:')).forEach((k) => win.localStorage.removeItem(k));
    } catch (_) {}
  });
});
Cypress.Commands.add('sendEmail', (recipient, subject, body) => {
  // Navegar al formulario de composiciÃ³n
  cy.get('[data-testid="compose-button"]').click();
  
  // Rellenar el formulario
  cy.get('[data-testid="recipient-input"]').type(recipient);
  cy.get('[data-testid="subject-input"]').type(subject);
  
  // Usar el editor de contenido (podrÃ­a ser un editor rico)
  cy.get('[data-testid="body-editor"]').type(body);
  
  // Enviar el correo
  cy.get('[data-testid="send-button"]').click();
  
  // Esperar confirmaciÃ³n
  cy.get('[data-testid="success-message"]', { timeout: 10000 }).should('be.visible');
});


// Stub helper for /api/wedding-news so blog specs can control backend responses.
Cypress.Commands.add('mockWeddingNews', (pages = {}, { defaultBody = [], statusCode = 200 } = {}) => {
  cy.intercept('GET', '**/api/wedding-news*', (req) => {
    let replyStatus = statusCode;
    let replyBody = defaultBody;

    try {
      const pageParam = (() => {
        try {
          const url = new URL(req.url);
          return url.searchParams.get('page') || '1';
        } catch (_) {
          return '1';
        }
      })();

      const handler =
        pages[pageParam] ??
        pages[Number(pageParam)] ??
        pages.default;

      const applyHandlerResult = (result) => {
        if (result == null) return;
        if (Array.isArray(result)) {
          replyBody = result;
          return;
        }
        if (typeof result === 'object') {
          if (typeof result.statusCode === 'number') {
            replyStatus = result.statusCode;
          }
          if ('body' in result) {
            replyBody = result.body;
          }
        }
      };

      if (typeof handler === 'function') {
        applyHandlerResult(handler(req, Number(pageParam)));
      } else {
        applyHandlerResult(handler);
      }
    } catch (_) {
      // Fallback to the default body if parsing fails.
    }

    req.reply({ statusCode: replyStatus, body: replyBody });
  }).as('weddingNewsRequest');
});

Cypress.Commands.add('seedPlannerWeddings', (plannerUid, weddings = [], activeId = '') => {
  cy.window().then((win) => {
    const uid = plannerUid || 'planner-multi-e2e';
    const store = {
      users: {
        [uid]: {
          weddings,
          activeWeddingId: activeId || (weddings[0]?.id || ''),
        },
      },
    };
    try {
      win.localStorage.setItem('lovenda_stub_weddings_enabled', 'true');
      win.localStorage.setItem('__lovenda_stub_weddings_store__', JSON.stringify(store));
      win.dispatchEvent(new CustomEvent('lovenda:stub-weddings-updated'));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('seedPlannerWeddings failed', error);
    }
  });
});

