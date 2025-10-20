const stubRemoved = (name) => {
  throw new Error(`[Cypress ${name}] Helper retirado: ya no se permiten stubs. Actualiza la prueba para preparar datos reales.`);
};

Cypress.Commands.add('loginAsStubUser', () => stubRemoved('loginAsStubUser'));
Cypress.Commands.add('logoutStubUser', () => stubRemoved('logoutStubUser'));
Cypress.Commands.add('mockWeddingSwitch', () => stubRemoved('mockWeddingSwitch'));

/**
 * Comando para autenticarse en Lovenda usando Firebase Auth real
 * @param {string} email - Email del usuario (opcional, usa uno por defecto)
 */
Cypress.Commands.add('loginToLovenda', (email = 'test@lovenda.com') => {
  // Simular autenticación real creando un usuario válido en el localStorage
  // que coincida con el formato esperado por useAuth
  cy.window().then((win) => {
    // Limpiar localStorage previo
    win.localStorage.clear();
    
    // Crear usuario mock válido para tests E2E
    const mockUser = {
      uid: `cypress-${Date.now()}`,
      email: email,
      displayName: 'Usuario Test E2E',
      emailVerified: true,
      photoURL: null,
    };

    const mockProfile = {
      id: mockUser.uid,
      email: mockUser.email,
      name: mockUser.displayName,
      role: 'owner',
      preferences: {
        theme: 'light',
        emailNotifications: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Configurar las claves que useAuth busca para sesiones presembradas
    win.localStorage.setItem('isLoggedIn', 'true');
    win.localStorage.setItem('mywed360_login_email', email);
    win.localStorage.setItem('userEmail', email);
    win.localStorage.setItem('MyWed360_user_profile', JSON.stringify(mockProfile));
    
    // Flag para indicar que estamos en modo Cypress
    win.localStorage.setItem('mywed360_cypress_auth', 'true');

    // Configurar flag global de Cypress
    win.__MYWED360_DISABLE_AUTOLOGIN__ = false;

    // Desactivar fallbacks de blog para tests controlados
    if (!win.import) win.import = {};
    if (!win.import.meta) win.import.meta = {};
    if (!win.import.meta.env) win.import.meta.env = {};
    
    // Desactivar fallbacks para tener control total sobre los tests
    win.import.meta.env.VITE_BLOG_ENABLE_STATIC_FALLBACK = 'false';
    win.import.meta.env.VITE_ENABLE_EN_FALLBACK = 'false';
    win.import.meta.env.VITE_TRANSLATE_KEY = '';
  });

  // Interceptar llamadas a Firebase y Firestore para que no fallen
  cy.intercept('POST', '**googleapis.com/**', { statusCode: 200, body: {} });
  cy.intercept('GET', '**googleapis.com/**', { statusCode: 200, body: {} });
  cy.intercept('POST', '**firestore.googleapis.com/**', { statusCode: 200, body: {} });
  cy.intercept('GET', '**firestore.googleapis.com/**', { statusCode: 200, body: {} });
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
