/**
 * Comandos Cypress con Integración Real
 * Usa Firebase Auth, Firestore, Backend API real
 */

import 'cypress-file-upload';

// ============================================
// AUTENTICACIÓN REAL CON FIREBASE
// ============================================

/**
 * Login real usando Firebase Auth
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 */
Cypress.Commands.add('loginToLovendaReal', (email = 'cypress-test@malove.app', password = 'TestPassword123!') => {
  // Verificar si ya estamos logueados
  cy.visit('/home', { failOnStatusCode: false });
  cy.wait(1000);
  
  cy.url({ timeout: 5000 }).then((url) => {
    if (!url.includes('/login')) {
      // Ya estamos logueados
      cy.log(`✅ Ya logueado (sesión activa)`);
      return;
    }
    
    // No estamos logueados, ir a login
    cy.visit('/login', { failOnStatusCode: false });
    cy.wait(1000);
    
    // Verificar si hay formulario de login
    cy.get('body').then($body => {
      const hasLoginForm = $body.find('input[type="email"], input[name="email"], [data-testid="email-input"]').length > 0;
      
      if (!hasLoginForm) {
        cy.log('⚠️ Formulario de login no visible, puede que ya esté logueado');
        return;
      }
      
      // Llenar el formulario de login
      cy.get('input[type="email"], input[name="email"], [data-testid="email-input"]')
        .should('be.visible')
        .clear()
        .type(email);
        
      cy.get('input[type="password"], input[name="password"], [data-testid="password-input"]')
        .should('be.visible')
        .clear()
        .type(password);
        
      cy.get('button[type="submit"], [data-testid="login-button"], button:contains("Iniciar sesión")')
        .should('be.visible')
        .click();
      
      // Esperar redirección o mensaje de éxito
      cy.url().should('not.include', '/login', { timeout: 10000 });
      cy.log(`✅ Login exitoso: ${email}`);
    });
  });
});

/**
 * Crear un usuario de test real en Firebase Auth
 * @param {Object} userData - Datos del usuario
 * @returns {Cypress.Chainable} Usuario creado
 */
Cypress.Commands.add('createFirebaseTestUser', (userData = {}) => {
  const email = userData.email || `cypress-test-${Date.now()}@malove.app`;
  const password = userData.password || 'TestPassword123!';
  const displayName = userData.displayName || 'Usuario Test Cypress';
  
  cy.log(`Creando usuario de test: ${email}`);
  
  // Llamar al endpoint del backend para crear usuario
  cy.request({
    method: 'POST',
    url: 'http://localhost:4004/api/test/create-user',
    body: {
      email,
      password,
      displayName,
      ...userData
    },
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200 || response.status === 201) {
      cy.log(`✅ Usuario creado: ${email}`);
      return cy.wrap({
        uid: response.body.uid,
        email,
        password,
        displayName
      });
    } else {
      cy.log(`⚠️ Usuario ya existe o error: ${email}`);
      return cy.wrap({ email, password, displayName });
    }
  });
});

/**
 * Eliminar usuario de test de Firebase Auth
 * @param {string} uid - UID del usuario
 */
Cypress.Commands.add('deleteFirebaseTestUser', (uid) => {
  if (!uid) return;
  
  cy.request({
    method: 'DELETE',
    url: `http://localhost:4004/api/test/delete-user/${uid}`,
    failOnStatusCode: false
  }).then(() => {
    cy.log(`🗑️ Usuario eliminado: ${uid}`);
  });
});

/**
 * Obtener información de un usuario real por email
 * @param {string} email - Email del usuario
 * @returns {Cypress.Chainable<{uid: string, email: string, emailVerified: boolean}>}
 */
Cypress.Commands.add('getFirebaseUserByEmail', (email) => {
  if (!email) {
    return cy.wrap(null);
  }

  return cy.request({
    method: 'GET',
    url: 'http://localhost:4004/api/test/users/by-email',
    qs: { email },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200 && response.body && response.body.uid) {
      return cy.wrap(response.body);
    }

    if (response.status === 404) {
      cy.log(`⚠️ Usuario no encontrado por email: ${email}`);
      return cy.wrap(null);
    }

    cy.log(`⚠️ Error al obtener usuario por email (${email}): ${response.status}`);
    return cy.wrap(null);
  });
});

/**
 * Eliminar usuario real de Firebase utilizando su email.
 * @param {string} email
 */
Cypress.Commands.add('deleteFirebaseUserByEmail', (email) => {
  if (!email) return;

  cy.getFirebaseUserByEmail(email).then((user) => {
    if (user && user.uid) {
      cy.deleteFirebaseTestUser(user.uid);
    }
  });
});

// ============================================
// GESTIÓN DE BODAS EN FIRESTORE
// ============================================

/**
 * Crear una boda de test real en Firestore
 * @param {Object} weddingData - Datos de la boda
 * @returns {Cypress.Chainable} Boda creada
 */
Cypress.Commands.add('createTestWeddingReal', (weddingData = {}) => {
  const weddingName = weddingData.name || 'Boda Test Cypress ' + Date.now();
  const weddingDate = weddingData.date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  
  cy.log(`Creando boda de test: ${weddingName}`);
  
  return cy.request({
    method: 'POST',
    url: 'http://localhost:4004/api/test/create-wedding',
    body: {
      name: weddingName,
      date: weddingDate,
      venue: weddingData.venue || 'Lugar Test',
      ...weddingData
    },
    headers: {
      'Authorization': 'Bearer test-token'
    },
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200 || response.status === 201) {
      cy.log(`✅ Boda creada: ${weddingName}`);
      return cy.wrap(response.body.wedding);
    } else {
      cy.log(`⚠️ Error al crear boda`);
      return cy.wrap(null);
    }
  });
});

/**
 * Eliminar boda de test de Firestore
 * @param {string} weddingId - ID de la boda
 */
Cypress.Commands.add('deleteTestWedding', (weddingId) => {
  if (!weddingId) return;
  
  cy.request({
    method: 'DELETE',
    url: `http://localhost:4004/api/test/delete-wedding/${weddingId}`,
    failOnStatusCode: false
  }).then(() => {
    cy.log(`🗑️ Boda eliminada: ${weddingId}`);
  });
});

// ============================================
// GESTIÓN DE INVITADOS EN FIRESTORE
// ============================================

/**
 * Crear invitado de test real en Firestore
 * @param {string} weddingId - ID de la boda
 * @param {Object} guestData - Datos del invitado
 * @returns {Cypress.Chainable} Invitado creado
 */
Cypress.Commands.add('createTestGuest', (weddingId, guestData = {}) => {
  const guestName = guestData.name || 'Invitado Test ' + Date.now();
  
  cy.log(`Creando invitado: ${guestName}`);
  
  return cy.request({
    method: 'POST',
    url: `http://localhost:4004/api/weddings/${weddingId}/guests`,
    body: {
      name: guestName,
      email: guestData.email || `guest-${Date.now()}@test.com`,
      phone: guestData.phone || '+34600000000',
      confirmed: guestData.confirmed || false,
      ...guestData
    },
    headers: {
      'Authorization': 'Bearer test-token'
    },
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200 || response.status === 201) {
      cy.log(`✅ Invitado creado: ${guestName}`);
      return cy.wrap(response.body.guest);
    }
    return cy.wrap(null);
  });
});

/**
 * Crear múltiples invitados de test
 * @param {string} weddingId - ID de la boda
 * @param {number} count - Número de invitados a crear
 * @returns {Cypress.Chainable} Array de invitados creados
 */
Cypress.Commands.add('createMultipleGuests', (weddingId, count = 10) => {
  cy.log(`Creando ${count} invitados para boda ${weddingId}`);
  
  const guests = [];
  for (let i = 0; i < count; i++) {
    guests.push({
      name: `Invitado Test ${i + 1}`,
      email: `guest${i + 1}-${Date.now()}@test.com`,
      confirmed: i % 2 === 0 // Alternar confirmados/no confirmados
    });
  }
  
  return cy.request({
    method: 'POST',
    url: `http://localhost:4004/api/weddings/${weddingId}/guests/bulk`,
    body: { guests },
    headers: {
      'Authorization': 'Bearer test-token'
    },
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200 || response.status === 201) {
      cy.log(`✅ ${count} invitados creados`);
      return cy.wrap(response.body.guests);
    }
    return cy.wrap([]);
  });
});

// ============================================
// LIMPIEZA DE DATOS DE TEST
// ============================================

/**
 * Limpiar todos los datos de test del usuario actual
 */
Cypress.Commands.add('cleanupTestData', () => {
  cy.log('🧹 Limpiando datos de test...');
  
  cy.request({
    method: 'POST',
    url: 'http://localhost:4004/api/test/cleanup',
    headers: {
      'Authorization': 'Bearer test-token'
    },
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200) {
      cy.log('✅ Datos de test limpiados');
    }
  });
});

/**
 * Limpiar bodas de test de un usuario específico
 * @param {string} userId - ID del usuario
 */
Cypress.Commands.add('cleanupUserWeddings', (userId) => {
  if (!userId) return;
  
  cy.request({
    method: 'DELETE',
    url: `http://localhost:4004/api/test/users/${userId}/weddings`,
    failOnStatusCode: false
  }).then(() => {
    cy.log(`🗑️ Bodas del usuario ${userId} eliminadas`);
  });
});

// ============================================
// UTILIDADES Y HELPERS
// ============================================

/**
 * Esperar a que Firebase Auth esté listo
 */
Cypress.Commands.add('waitForFirebaseAuth', () => {
  cy.window().its('firebaseAuth').should('exist');
  cy.log('✅ Firebase Auth listo');
});

/**
 * Esperar a que Firestore esté listo
 */
Cypress.Commands.add('waitForFirestore', () => {
  cy.window().its('firebaseDb').should('exist');
  cy.log('✅ Firestore listo');
});

/**
 * Verificar que el backend está corriendo
 */
Cypress.Commands.add('checkBackendHealth', () => {
  cy.request('http://localhost:4004/api/health').then((response) => {
    expect(response.status).to.eq(200);
    cy.log('✅ Backend corriendo en puerto 4004');
  });
});

/**
 * Cerrar panel de diagnóstico si está abierto
 */
Cypress.Commands.add('closeDiagnostic', () => {
  cy.get('body').then($body => {
    const selectors = [
      '[data-testid="diagnostic-panel"]',
      '[id="diagnostic-panel"]',
      '.diagnostic-panel',
      '[aria-label="Panel de diagnóstico"]'
    ];
    
    for (const selector of selectors) {
      if ($body.find(selector).length) {
        cy.get(selector).within(() => {
          cy.get('[data-testid="diagnostic-close"], [aria-label="Cerrar"], button:contains("X"), button:contains("×")')
            .first()
            .click({ force: true });
        });
        break;
      }
    }
  });
});

/**
 * Navegar a una ruta del dashboard
 * @param {string} route - Ruta a navegar (ej: '/invitados', '/email')
 */
Cypress.Commands.add('navigateTo', (route) => {
  cy.visit(route, { failOnStatusCode: false });
  cy.url().should('include', route);
  cy.log(`✅ Navegado a ${route}`);
});

/**
 * Navegar al inbox de email
 */
Cypress.Commands.add('navigateToEmailInbox', () => {
  cy.navigateTo('/email');
});

/**
 * Esperar a que un elemento esté visible sin fallar
 * @param {string} selector - Selector del elemento
 * @param {number} timeout - Timeout en ms
 */
Cypress.Commands.add('waitForElementSafe', (selector, timeout = 10000) => {
  cy.get('body', { timeout }).then($body => {
    if ($body.find(selector).length) {
      cy.get(selector).should('be.visible');
      cy.log(`✅ Elemento ${selector} visible`);
      return true;
    } else {
      cy.log(`⚠️ Elemento ${selector} no encontrado`);
      return false;
    }
  });
});

// ============================================
// COMANDOS LEGACY (COMPATIBILIDAD)
// ============================================

/**
 * Alias del comando antiguo para compatibilidad
 */
Cypress.Commands.add('loginToLovenda', (email, password) => {
  cy.loginToLovendaReal(email, password);
});

/**
 * Comando para login como admin
 */
Cypress.Commands.add('loginAsAdmin', (username = 'admin@lovenda.com', password = 'AdminPass123!') => {
  cy.visit('/admin/login');
  
  cy.get('input[type="email"], input[name="username"], [data-testid="admin-username"]')
    .should('be.visible')
    .clear()
    .type(username);
    
  cy.get('input[type="password"], input[name="password"], [data-testid="admin-password"]')
    .should('be.visible')
    .clear()
    .type(password);
    
  cy.get('button[type="submit"], [data-testid="admin-login-button"]')
    .should('be.visible')
    .click();
  
  cy.url().should('not.include', '/login', { timeout: 10000 });
  cy.log(`✅ Admin login exitoso: ${username}`);
});

// ============================================
// EMAIL Y MAILGUN
// ============================================

/**
 * Enviar email de test real usando Mailgun
 * @param {Object} emailData - Datos del email
 */
Cypress.Commands.add('sendTestEmail', (emailData = {}) => {
  const to = emailData.to || 'cypress-test@malove.app';
  const subject = emailData.subject || 'Test Email ' + Date.now();
  const body = emailData.body || 'Este es un email de test de Cypress';
  
  cy.log(`Enviando email de test a ${to}`);
  
  return cy.request({
    method: 'POST',
    url: 'http://localhost:4004/api/mail/send',
    body: {
      to,
      subject,
      body,
      from: emailData.from || 'no-reply@malove.app'
    },
    headers: {
      'Authorization': 'Bearer test-token'
    },
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200) {
      cy.log(`✅ Email enviado a ${to}`);
      return cy.wrap(response.body);
    }
    return cy.wrap(null);
  });
});

// ============================================
// INTERCEPTORES (PARA CASOS ESPECÍFICOS)
// ============================================

/**
 * Interceptar llamadas a OpenAI para no gastar créditos
 */
Cypress.Commands.add('mockOpenAI', () => {
  cy.intercept('POST', '**/openai.com/v1/**', {
    statusCode: 200,
    body: {
      choices: [{
        message: {
          content: 'Respuesta mock de OpenAI para tests E2E'
        }
      }]
    }
  }).as('openaiRequest');
  
  cy.log('⚠️ OpenAI mockeado para ahorrar créditos');
});

export {};
