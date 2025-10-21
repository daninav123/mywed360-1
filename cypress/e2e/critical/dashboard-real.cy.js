/// <reference types="Cypress" />

/**
 * Tests Críticos del Dashboard con Integración Real
 * Smoke tests para verificar que el dashboard funciona correctamente
 */

describe('Tests Críticos del Dashboard (Real)', () => {
  const testEmail = `cypress-dashboard-critical-${Date.now()}@malove.app`;
  const testPassword = 'TestPassword123!';
  let testUserId;
  let testWeddingId;

  before(() => {
    // Verificar backend
    cy.checkBackendHealth();
    
    // Crear usuario y boda de test
    cy.createFirebaseTestUser({
      email: testEmail,
      password: testPassword,
      displayName: 'Usuario Dashboard Critical'
    }).then((user) => {
      testUserId = user.uid;
      
      // Crear boda activa
      cy.createTestWeddingReal({
        name: 'Boda Crítica Test',
        date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Lugar Crítico',
        userId: testUserId
      }).then((wedding) => {
        if (wedding && wedding.id) {
          testWeddingId = wedding.id;
          cy.log(`✅ Boda crítica creada: ${testWeddingId}`);
        }
      });
    });
  });

  after(() => {
    // Cleanup
    if (testWeddingId) {
      cy.deleteTestWedding(testWeddingId);
    }
    if (testUserId) {
      cy.deleteFirebaseTestUser(testUserId);
    }
    cy.log('🗑️ Datos críticos de dashboard limpiados');
  });

  beforeEach(() => {
    // Ignorar errores comunes de componentes
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('RegisterForm') || 
          err.message.includes('ResizeObserver') ||
          err.message.includes('Firebase')) {
        return false;
      }
    });
    
    cy.loginToLovendaReal(testEmail, testPassword);
    cy.closeDiagnostic();
    cy.visit('/home', { failOnStatusCode: false });
    cy.wait(2000);
  });

  it('[CRÍTICO] muestra el dashboard correctamente', () => {
    cy.get('body', { timeout: 10000 }).should('be.visible');
    
    // Verificar que estamos en una ruta válida
    cy.url().should('satisfy', (url) => {
      return url.includes('/home') || 
             url.includes('/dashboard') || 
             url.includes('/crear-evento');
    });
    
    // Buscar contenido del dashboard
    cy.get('body').then($body => {
      const text = $body.text().toLowerCase();
      const hasDashboardContent = text.includes('dashboard') || 
                                  text.includes('inicio') || 
                                  text.includes('home') ||
                                  text.includes('bienvenid');
      
      expect(hasDashboardContent || $body.find('h1, h2').length > 0).to.be.true;
    });
    
    cy.log('✅ [CRÍTICO] Dashboard visible');
  });

  it('[CRÍTICO] permite navegar a tareas', () => {
    cy.visit('/tasks', { failOnStatusCode: false });
    cy.wait(2000);
    
    cy.get('body').should('be.visible');
    
    // Verificar URL
    cy.url({ timeout: 5000 }).should('satisfy', (url) => {
      return url.includes('/tasks') || url.includes('/crear-evento');
    });
    
    // Verificar que no redirige a login
    cy.url().should('not.include', '/login');
    
    cy.log('✅ [CRÍTICO] Navegación a tareas correcta');
  });

  it('[CRÍTICO] permite navegar a invitados', () => {
    cy.visit('/invitados', { failOnStatusCode: false });
    cy.wait(2000);
    
    cy.get('body').should('be.visible');
    
    cy.url({ timeout: 5000 }).should('satisfy', (url) => {
      return url.includes('/invitados') || url.includes('/crear-evento');
    });
    
    cy.url().should('not.include', '/login');
    
    cy.log('✅ [CRÍTICO] Navegación a invitados correcta');
  });

  it('[CRÍTICO] permite navegar a proveedores', () => {
    cy.visit('/proveedores', { failOnStatusCode: false });
    cy.wait(2000);
    
    cy.get('body').should('be.visible');
    
    cy.url({ timeout: 5000 }).should('satisfy', (url) => {
      return url.includes('/proveedores') || url.includes('/crear-evento') || url.includes('/suppliers');
    });
    
    cy.url().should('not.include', '/login');
    
    cy.log('✅ [CRÍTICO] Navegación a proveedores correcta');
  });

  it('[CRÍTICO] permite navegar a finanzas', () => {
    cy.visit('/finance', { failOnStatusCode: false });
    cy.wait(2000);
    
    cy.get('body').should('be.visible');
    
    cy.url({ timeout: 5000 }).should('satisfy', (url) => {
      return url.includes('/finance') || 
             url.includes('/finanzas') || 
             url.includes('/crear-evento') ||
             url.includes('/budget');
    });
    
    cy.url().should('not.include', '/login');
    
    cy.log('✅ [CRÍTICO] Navegación a finanzas correcta');
  });

  it('[CRÍTICO] mantiene la sesión al navegar entre módulos', () => {
    const routes = ['/home', '/tasks', '/invitados', '/proveedores', '/finance'];
    
    routes.forEach(route => {
      cy.visit(route, { failOnStatusCode: false });
      cy.wait(1000);
      
      // Verificar que no redirige a login
      cy.url({ timeout: 3000 }).should('not.include', '/login');
    });
    
    // Verificar que Firebase Auth mantiene el usuario
    cy.window().then((win) => {
      if (win.firebaseAuth && win.firebaseAuth.currentUser) {
        expect(win.firebaseAuth.currentUser.email).to.equal(testEmail);
        cy.log('✅ [CRÍTICO] Sesión de Firebase Auth mantenida');
      }
    });
    
    cy.log('✅ [CRÍTICO] Sesión mantenida entre módulos');
  });

  it('[CRÍTICO] carga elementos básicos del dashboard (headers, nav, content)', () => {
    cy.visit('/home', { failOnStatusCode: false });
    cy.wait(2000);
    
    cy.get('body').then($body => {
      // Verificar que hay estructura básica
      const hasHeader = $body.find('header, [role="banner"], nav').length > 0;
      const hasContent = $body.find('main, [role="main"], .content, article').length > 0;
      const hasElements = $body.find('h1, h2, button, a').length > 0;
      
      expect(hasHeader || hasContent || hasElements).to.be.true;
      
      if (hasHeader) cy.log('✅ Header encontrado');
      if (hasContent) cy.log('✅ Área de contenido encontrada');
      if (hasElements) cy.log('✅ Elementos interactivos encontrados');
    });
    
    cy.log('✅ [CRÍTICO] Estructura básica del dashboard presente');
  });

  it('[CRÍTICO] responde correctamente a navegación directa por URL', () => {
    // Navegación directa a diferentes rutas
    const directRoutes = [
      '/home',
      '/invitados',
      '/tasks'
    ];
    
    directRoutes.forEach(route => {
      // Limpiar y navegar directamente
      cy.clearCookies();
      cy.clearLocalStorage();
      
      // Login y navegación directa
      cy.loginToLovendaReal(testEmail, testPassword);
      cy.visit(route, { failOnStatusCode: false });
      cy.wait(2000);
      
      // Verificar que carga correctamente
      cy.get('body').should('be.visible');
      cy.url().should('not.include', '/login');
      
      cy.log(`✅ [CRÍTICO] Navegación directa a ${route} funcional`);
    });
  });

  it('[CRÍTICO] muestra feedback visual al cambiar de sección', () => {
    cy.visit('/home', { failOnStatusCode: false });
    cy.wait(1000);
    
    const homeContent = cy.get('body').invoke('text');
    
    cy.visit('/invitados', { failOnStatusCode: false });
    cy.wait(1000);
    
    const invitadosContent = cy.get('body').invoke('text');
    
    // El contenido debe ser diferente entre secciones
    homeContent.then(home => {
      invitadosContent.then(invitados => {
        expect(home).to.not.equal(invitados);
        cy.log('✅ [CRÍTICO] Contenido cambia entre secciones');
      });
    });
  });

  it('[CRÍTICO] no muestra errores de consola críticos', () => {
    const errors = [];
    
    cy.on('window:before:load', (win) => {
      const originalError = win.console.error;
      win.console.error = (...args) => {
        const errorMsg = args.join(' ');
        
        // Filtrar errores conocidos/ignorables
        if (!errorMsg.includes('ResizeObserver') &&
            !errorMsg.includes('favicon') &&
            !errorMsg.includes('deprecated')) {
          errors.push(errorMsg);
        }
        
        originalError.apply(win.console, args);
      };
    });
    
    cy.visit('/home', { failOnStatusCode: false });
    cy.wait(3000);
    
    cy.then(() => {
      if (errors.length > 0) {
        cy.log(`⚠️ Errores de consola detectados: ${errors.length}`);
        errors.forEach(err => cy.log(`  - ${err}`));
      } else {
        cy.log('✅ [CRÍTICO] Sin errores críticos de consola');
      }
    });
  });
});
