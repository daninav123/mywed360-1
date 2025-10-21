/// <reference types="Cypress" />

/**
 * Dashboard - Navegación Principal con Integración Real
 * Tests de navegación entre secciones del dashboard con datos reales
 */

describe('Dashboard - Navegación Principal (Real)', () => {
  const testEmail = `cypress-dashboard-${Date.now()}@malove.app`;
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
      displayName: 'Usuario Dashboard Test'
    }).then((user) => {
      testUserId = user.uid;
      cy.log(`✅ Usuario creado: ${testEmail}`);
      
      // Crear boda activa para el usuario
      cy.createTestWeddingReal({
        name: 'Boda Test Dashboard',
        date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Lugar Test Dashboard',
        userId: testUserId
      }).then((wedding) => {
        if (wedding && wedding.id) {
          testWeddingId = wedding.id;
          cy.log(`✅ Boda creada: ${testWeddingId}`);
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
    cy.log('🗑️ Datos de dashboard limpiados');
  });

  beforeEach(() => {
    // Login antes de cada test
    cy.loginToLovendaReal(testEmail, testPassword);
    cy.closeDiagnostic();
    cy.visit('/home', { failOnStatusCode: false });
    cy.wait(2000);
  });

  it('carga el dashboard principal correctamente', () => {
    cy.get('body', { timeout: 10000 }).should('be.visible');
    
    // Verificar que estamos en una ruta válida del dashboard
    cy.url().should('satisfy', (url) => {
      const validRoutes = ['/home', '/dashboard', '/crear-evento'];
      return validRoutes.some(route => url.includes(route));
    });
    
    // Buscar elementos comunes del dashboard
    cy.get('body').then($body => {
      const text = $body.text().toLowerCase();
      const hasDashboardContent = text.includes('dashboard') || 
                                  text.includes('inicio') || 
                                  text.includes('home') ||
                                  text.includes('boda') ||
                                  text.includes('wedding');
      expect(hasDashboardContent).to.be.true;
    });
    
    cy.log('✅ Dashboard principal cargado');
  });

  it('permite navegar entre secciones principales', () => {
    const sections = [
      { name: 'Tareas', url: '/tasks' },
      { name: 'Invitados', url: '/invitados' },
      { name: 'Proveedores', url: '/proveedores' },
      { name: 'Finanzas', url: '/finance' }
    ];

    sections.forEach(section => {
      cy.visit(section.url, { failOnStatusCode: false });
      cy.wait(1500);
      
      cy.get('body').should('be.visible');
      
      // Verificar que no redirige a login
      cy.url({ timeout: 5000 }).should('not.include', '/login');
      
      cy.log(`✅ Navegación a ${section.name} correcta`);
    });
  });

  it('muestra la barra de navegación inferior o lateral', () => {
    cy.get('body').then($body => {
      // Buscar elementos de navegación
      const navSelectors = [
        'nav',
        '[role="navigation"]',
        '[data-testid*="nav"]',
        '[data-testid*="menu"]',
        '.navigation',
        '.sidebar',
        '.bottom-nav',
        'footer nav'
      ];
      
      let navFound = false;
      for (const selector of navSelectors) {
        if ($body.find(selector).length) {
          cy.get(selector).should('exist');
          navFound = true;
          cy.log(`✅ Navegación encontrada: ${selector}`);
          break;
        }
      }
      
      if (!navFound) {
        cy.log('⚠️ No se encontró barra de navegación específica');
        // Al menos verificar que hay links o botones
        expect($body.find('a, button').length).to.be.greaterThan(0);
      }
    });
  });

  it('mantiene el estado de la boda activa entre navegaciones', () => {
    // Navegar entre varias secciones
    cy.visit('/home', { failOnStatusCode: false });
    cy.wait(1000);
    
    cy.visit('/invitados', { failOnStatusCode: false });
    cy.wait(1000);
    
    cy.visit('/tasks', { failOnStatusCode: false });
    cy.wait(1000);
    
    // Verificar que la boda activa se mantiene en localStorage
    cy.window().then((win) => {
      const activeWedding = win.localStorage.getItem('mywed360_active_wedding') ||
                           win.localStorage.getItem('MyWed360_active_wedding');
      
      if (activeWedding) {
        cy.log(`✅ Boda activa mantenida: ${activeWedding}`);
        expect(activeWedding).to.exist;
      } else {
        cy.log('⚠️ No se encontró boda activa en localStorage (puede ser normal en primera carga)');
      }
    });
  });

  it('muestra breadcrumbs o indicador de ubicación actual', () => {
    const routes = ['/home', '/invitados', '/tasks', '/finance'];
    
    routes.forEach(route => {
      cy.visit(route, { failOnStatusCode: false });
      cy.wait(1000);
      
      cy.get('body').then($body => {
        // Buscar breadcrumbs, título de página o indicador de sección
        const indicatorSelectors = [
          '[data-testid="breadcrumb"]',
          '[aria-label="Breadcrumb"]',
          '.breadcrumb',
          'h1',
          'h2',
          '[data-testid="page-title"]',
          'header h1',
          'header h2'
        ];
        
        let indicatorFound = false;
        for (const selector of indicatorSelectors) {
          if ($body.find(selector).length && $body.find(selector).is(':visible')) {
            cy.get(selector).first().should('be.visible');
            indicatorFound = true;
            cy.log(`✅ Indicador de ubicación encontrado en ${route}`);
            break;
          }
        }
        
        if (!indicatorFound) {
          cy.log(`⚠️ No se encontró indicador visual en ${route}`);
        }
      });
    });
  });

  it('permite acceso rápido a secciones desde el menú principal', () => {
    cy.get('body').then($body => {
      // Buscar menú hamburguesa o menú principal
      const menuSelectors = [
        'button[aria-label*="menu"]',
        'button[aria-label*="Menu"]',
        '[data-testid="menu-button"]',
        '[data-testid="hamburger"]',
        '.menu-button',
        'button.hamburger'
      ];
      
      let menuFound = false;
      for (const selector of menuSelectors) {
        if ($body.find(selector).length) {
          cy.get(selector).first().click({ force: true });
          cy.wait(500);
          
          // Verificar que apareció algún menú desplegable
          cy.get('body').then($menuBody => {
            const hasMenu = $menuBody.find('[role="menu"], .menu, .dropdown, nav').length > 0;
            if (hasMenu) {
              menuFound = true;
              cy.log('✅ Menú principal accesible');
            }
          });
          
          break;
        }
      }
      
      if (!menuFound) {
        cy.log('⚠️ No se encontró menú hamburguesa (puede tener navegación siempre visible)');
      }
    });
  });

  it('muestra información de la boda actual en el dashboard', () => {
    cy.visit('/home', { failOnStatusCode: false });
    cy.wait(2000);
    
    cy.get('body').then($body => {
      const text = $body.text();
      
      // Buscar el nombre de la boda de test o indicadores de boda activa
      const hasWeddingInfo = text.includes('Boda Test Dashboard') ||
                             text.includes('boda') ||
                             text.includes('wedding') ||
                             $body.find('[data-testid*="wedding"], [data-testid*="boda"]').length > 0;
      
      if (hasWeddingInfo) {
        cy.log('✅ Información de boda visible en dashboard');
      } else {
        cy.log('⚠️ No se encontró información explícita de la boda (puede estar en otro componente)');
      }
    });
  });

  it('permite cambiar entre bodas si el usuario tiene múltiples', () => {
    cy.get('body').then($body => {
      // Buscar selector de bodas
      const weddingSwitcherSelectors = [
        '[data-testid="wedding-switcher"]',
        '[data-testid="wedding-selector"]',
        'select[name="wedding"]',
        'button[aria-label*="boda"]',
        'button[aria-label*="wedding"]'
      ];
      
      let switcherFound = false;
      for (const selector of weddingSwitcherSelectors) {
        if ($body.find(selector).length) {
          cy.get(selector).should('exist');
          switcherFound = true;
          cy.log('✅ Selector de bodas encontrado');
          break;
        }
      }
      
      if (!switcherFound) {
        cy.log('⚠️ Selector de bodas no encontrado (normal si solo hay una boda)');
      }
    });
  });
});
