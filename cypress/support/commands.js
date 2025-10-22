import 'cypress-file-upload';
const stubRemoved = (name) => {
  throw new Error(`[Cypress ${name}] Helper retirado: ya no se permiten stubs. Actualiza la prueba para preparar datos reales.`);
};

Cypress.Commands.add('loginAsStubUser', () => stubRemoved('loginAsStubUser'));
Cypress.Commands.add('logoutStubUser', () => stubRemoved('logoutStubUser'));
Cypress.Commands.add('mockWeddingSwitch', () => stubRemoved('mockWeddingSwitch'));

Cypress.Commands.add('seedPlannerWeddings', (plannerUid, weddings = [], activeId) => {
  cy.window().then((win) => {
    const uid = plannerUid || 'planner-e2e';
    const list = Array.isArray(weddings) ? weddings : [];
    const normalized = list.map((w, index) => ({
      id: w.id || `planner-wedding-${index}`,
      name: w.name || `Boda ${index + 1}`,
      weddingDate: w.weddingDate || w.date || '',
      location: w.location || w.banquetPlace || '',
      progress: Number.isFinite(w.progress) ? w.progress : 0,
      active: w.active !== false,
      ownerIds: Array.isArray(w.ownerIds) ? w.ownerIds : [],
      plannerIds: Array.isArray(w.plannerIds) ? w.plannerIds : [uid],
      assistantIds: Array.isArray(w.assistantIds) ? w.assistantIds : [],
      permissions: w.permissions || { archiveWedding: true, createWedding: true },
      modulePermissions: w.modulePermissions || {},
      crm: w.crm || { lastSyncStatus: 'never' },
      crmStatus: w.crmStatus || (w.crm && w.crm.lastSyncStatus) || 'never',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const store = {
      users: {
        [uid]: {
          weddings: normalized,
          activeWeddingId: activeId || normalized[0]?.id || '',
        },
      },
    };

    try {
      win.localStorage.setItem('lovenda_local_weddings', JSON.stringify(store));
      const activeWeddingId = activeId || normalized[0]?.id || '';
      if (activeWeddingId) {
        win.localStorage.setItem(`mywed360_active_wedding_user_${uid}`, activeWeddingId);
        win.localStorage.setItem('mywed360_active_wedding', activeWeddingId);
      }
      win.dispatchEvent?.(new win.CustomEvent('lovenda:local-weddings-updated'));
    } catch (error) {
      // No interrumpir el test si el seed falla
      // eslint-disable-next-line no-console
      console.warn('[Cypress] seedPlannerWeddings failed', error);
    }
  });
});

/**
 * Comando para configurar mock mínimo de boda sin navegar
 * Útil para tests de seating que ya están en la página correcta
 */
Cypress.Commands.add('mockWeddingMinimal', () => {
  cy.window().then((win) => {
    const mockUser = {
      uid: 'cypress-user-' + Date.now(),
      email: 'test@lovenda.com',
      displayName: 'Usuario Test',
      emailVerified: true,
      photoURL: null,
      idToken: 'mock-id-token',
    };

    const mockProfile = {
      id: mockUser.uid,
      email: mockUser.email,
      name: mockUser.displayName,
      role: 'owner',
      preferences: { theme: 'light', emailNotifications: true },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockWedding = {
      id: 'test-wedding-' + Date.now(),
      name: 'Boda Test',
      date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'Lugar Test',
      ownerIds: [mockUser.uid],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      guestCount: 100,
      budget: 50000,
      status: 'planning'
    };

    // Configurar localStorage
    win.localStorage.setItem('isLoggedIn', 'true');
    win.localStorage.setItem('MyWed360_mock_user', JSON.stringify(mockUser));
    win.localStorage.setItem('MyWed360_user_profile', JSON.stringify(mockProfile));
    win.localStorage.setItem('MyWed360_auth_token', 'mock-token');
    win.localStorage.setItem('MyWed360_active_wedding', JSON.stringify(mockWedding));
    win.localStorage.setItem('MyWed360_weddings', JSON.stringify([mockWedding]));
    win.localStorage.setItem('MyWed360_test_mode', 'true');
    
    cy.log('Mock wedding minimal configurado');
  });
  
  // Interceptar Firebase/Firestore
  cy.intercept('POST', '**googleapis.com/**', { statusCode: 200, body: {} });
  cy.intercept('GET', '**googleapis.com/**', { statusCode: 200, body: {} });
  cy.intercept('POST', '**firestore.googleapis.com/**', { statusCode: 200, body: {} });
  cy.intercept('GET', '**firestore.googleapis.com/**', { statusCode: 200, body: {} });
});

/**
 * Comando para autenticarse en Lovenda usando Firebase Auth real
 * @param {string} email - Email del usuario (opcional, usa uno por defecto)
 */
Cypress.Commands.add('loginToLovenda', (email = 'test@lovenda.com', role = 'owner') => {
  cy.visit('/');
  
  cy.window().then((win) => {
    // Simular usuario logueado
    const mockUser = {
      uid: 'cypress-user-' + Date.now(),
      email: email || 'test@lovenda.com',
      displayName: email.split('@')[0] || 'Usuario Test E2E',
      emailVerified: true,
      photoURL: null,
      idToken: 'mock-id-token-for-testing',
    };

    const mockProfile = {
      id: mockUser.uid,
      email: mockUser.email,
      name: mockUser.displayName,
      role: role || 'owner',
      preferences: {
        theme: 'light',
        emailNotifications: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Crear una boda activa para el usuario
    const mockWedding = {
      id: 'test-wedding-' + Date.now(),
      name: 'Boda Test',
      date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 días en el futuro
      venue: 'Lugar Test',
      ownerIds: [mockUser.uid],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      guestCount: 100,
      budget: 50000,
      status: 'planning'
    };

    // Configurar las claves que useAuth busca para sesiones presembradas
    win.localStorage.setItem('isLoggedIn', 'true');
    win.localStorage.setItem('MyWed360_mock_user', JSON.stringify(mockUser));
    win.localStorage.setItem('MyWed360_user_profile', JSON.stringify(mockProfile));
    win.localStorage.setItem('MyWed360_auth_token', 'mock-token');
    
    // Guardar la boda activa
    win.localStorage.setItem('MyWed360_active_wedding', JSON.stringify(mockWedding));
    win.localStorage.setItem('MyWed360_weddings', JSON.stringify([mockWedding]));
    
    // Agregar flag para indicar que es un usuario de prueba
    win.localStorage.setItem('MyWed360_test_mode', 'true');
    
    cy.log(`Usuario ${email} logueado con rol ${role || 'owner'} y boda activa creada`);
  });

  // Interceptar llamadas a Firebase y Firestore para que no fallen
  cy.intercept('POST', '**googleapis.com/**', { statusCode: 200, body: {} });
  cy.intercept('GET', '**googleapis.com/**', { statusCode: 200, body: {} });
  cy.intercept('POST', '**firestore.googleapis.com/**', { statusCode: 200, body: {} });
  cy.intercept('GET', '**firestore.googleapis.com/**', { statusCode: 200, body: {} });
  
  // Interceptar llamadas a la API de upgrade
  cy.intercept('POST', '**/api/users/upgrade-role', (req) => {
    const { newRole, tier } = req.body || {};
    req.reply({
      statusCode: 200,
      body: {
        success: true,
        role: newRole,
        subscription: { tier: tier || 'free' },
      },
    });
  });
});

/**
 * Comando para mockear la API de wedding news
 * @param {Object} pages - Objeto con páginas de resultados
 * @param {Object} options - Opciones adicionales
 */
Cypress.Commands.add('mockWeddingNews', (pages = {}, options = {}) => {
  const { defaultBody = [] } = options;
  
  // Interceptar todas las posibles rutas de la API de wedding news
  const interceptPaths = [
    '**/api/wedding-news*',
    '**/wedding-news*',
    '**localhost:4004/api/wedding-news*',
    '**mywed360-backend.onrender.com/api/wedding-news*'
  ];
  
  interceptPaths.forEach(path => {
    cy.intercept('GET', path, (req) => {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      
      console.log(`[Cypress] Intercepting wedding-news request: page=${page}, url=${req.url}`);
      
      // Si hay datos específicos para esta página, devolverlos
      if (pages[page]) {
        console.log(`[Cypress] Returning specific data for page ${page}:`, pages[page]);
        req.reply({
          statusCode: 200,
          body: pages[page],
        });
        return;
      }
      
      // Si hay un body por defecto, usarlo
      if (pages.default !== undefined) {
        console.log(`[Cypress] Returning default data:`, pages.default);
        req.reply({
          statusCode: 200,
          body: pages.default,
        });
        return;
      }
      
      // Fallback al defaultBody de opciones
      console.log(`[Cypress] Returning fallback data:`, defaultBody);
      req.reply({
        statusCode: 200,
        body: defaultBody,
      });
    });
  });
  
  // Alias solo en la primera interceptación
  cy.intercept('GET', '**/api/wedding-news*', { statusCode: 200, body: defaultBody }).as('weddingNewsRequest');
});

/**
 * Comando para cerrar el panel de diagnóstico si está abierto
 */
/**
 * Comando para autenticarse como admin
 * @param {string} username - Usuario admin (opcional)
 * @param {string} password - Contraseña admin (opcional)
 */
Cypress.Commands.add('loginAsAdmin', (username = 'admin@lovenda.com', password = 'admin123') => {
  cy.visit('/admin/login');
  
  cy.window().then((win) => {
    // Simular admin logueado
    const mockAdmin = {
      id: 'admin-cypress-' + Date.now(),
      email: username,
      name: 'Admin Test',
      role: 'admin',
      permissions: ['all'],
      token: 'mock-admin-token-' + Date.now(),
    };

    win.localStorage.setItem('admin_token', mockAdmin.token);
    win.localStorage.setItem('admin_user', JSON.stringify(mockAdmin));
    win.localStorage.setItem('admin_logged_in', 'true');
    
    cy.log(`Admin ${username} logueado`);
  });
  
  cy.wait(500);
});

Cypress.Commands.add('closeDiagnostic', () => {
  cy.get('body').then($body => {
    // Buscar el panel de diagnóstico por diferentes selectores posibles
    const selectors = [
      '[data-testid="diagnostic-panel"]',
      '[id="diagnostic-panel"]',
      '.diagnostic-panel',
      '[aria-label="Panel de diagnóstico"]'
    ];
    
    for (const selector of selectors) {
      if ($body.find(selector).length) {
        // Si existe el botón de cerrar, hacer clic
        cy.get(selector).within(() => {
          cy.get('[data-testid="diagnostic-close"], [aria-label="Cerrar"], button:contains("X"), button:contains("×")').first().click({ force: true });
        });
        break;
      }
    }
  });
});

/**
 * Comando para navegar al inbox de email
 */
Cypress.Commands.add('navigateToEmailInbox', () => {
  // Intentar navegar a la ruta de email
  cy.visit('/email', { failOnStatusCode: false });
  cy.wait(1000);
  
  // Alternativamente, si hay un botón de navegación
  cy.get('body').then($body => {
    if ($body.find('[href="/email"]').length) {
      cy.get('[href="/email"]').first().click();
    } else if ($body.find('[data-testid="nav-email"]').length) {
      cy.get('[data-testid="nav-email"]').click();
    }
  });
});
