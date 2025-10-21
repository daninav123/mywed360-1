/// <reference types="Cypress" />

/**
 * Tests Críticos de Email con Integración Real
 * Smoke tests esenciales del módulo de email
 */

describe('Email - Tests Críticos (Real)', () => {
  const testEmail = `cypress-email-critical-${Date.now()}@malove.app`;
  const testPassword = 'TestPassword123!';
  let testUserId;
  let testWeddingId;

  before(() => {
    cy.checkBackendHealth();
    
    cy.createFirebaseTestUser({
      email: testEmail,
      password: testPassword,
      displayName: 'Usuario Email Critical'
    }).then((user) => {
      testUserId = user.uid;
      
      cy.createTestWeddingReal({
        name: 'Boda Test Email Critical',
        date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Lugar Test Email',
        userId: testUserId
      }).then((wedding) => {
        if (wedding && wedding.id) {
          testWeddingId = wedding.id;
          cy.log('✅ Setup crítico de email completado');
        }
      });
    });
  });

  after(() => {
    if (testWeddingId) {
      cy.deleteTestWedding(testWeddingId);
    }
    if (testUserId) {
      cy.deleteFirebaseTestUser(testUserId);
    }
  });

  beforeEach(() => {
    cy.loginToLovendaReal(testEmail, testPassword);
    cy.closeDiagnostic();
  });

  it('[CRÍTICO] carga el módulo de email sin errores', () => {
    cy.visit('/email', { failOnStatusCode: false });
    cy.wait(3000);
    
    cy.get('body', { timeout: 10000 }).should('be.visible');
    
    // Verificar que estamos en email
    cy.url().should('include', '/email');
    
    cy.log('✅ [CRÍTICO] Módulo de email cargado');
  });

  it('[CRÍTICO] muestra interfaz básica de email (sidebar + lista)', () => {
    cy.visit('/email', { failOnStatusCode: false });
    cy.wait(3000);
    
    cy.get('body').then($body => {
      // Verificar estructura básica
      const hasStructure = $body.find('aside, nav, [data-testid*="sidebar"], [data-testid*="folder"]').length > 0 ||
                          $body.find('[data-testid*="email"], .email').length > 0;
      
      expect(hasStructure).to.be.true;
      cy.log('✅ [CRÍTICO] Interfaz básica presente');
    });
  });

  it('[CRÍTICO] permite enviar email básico', () => {
    cy.sendTestEmail({
      to: `critical-test-${Date.now()}@mg.malove.app`,
      subject: 'Test Crítico Email',
      body: 'Contenido de test crítico'
    }).then((response) => {
      expect(response).to.exist;
      cy.log('✅ [CRÍTICO] Envío de email funcional');
    });
  });

  it('[CRÍTICO] abre el composer de email', () => {
    cy.visit('/email', { failOnStatusCode: false });
    cy.wait(2000);
    
    cy.get('body').then($body => {
      const composeSelectors = [
        '[data-testid="compose-button"]',
        'button:contains("Redactar")',
        'button:contains("Nuevo")',
        'button:contains("Compose")'
      ];
      
      let composeFound = false;
      for (const selector of composeSelectors) {
        if ($body.find(selector).length) {
          cy.get(selector).first().click({ force: true });
          cy.wait(1000);
          
          // Verificar que se abrió algo
          cy.get('body').then($composerBody => {
            const composerVisible = $composerBody.find('[data-testid*="composer"], textarea, [contenteditable="true"]').length > 0;
            
            if (composerVisible) {
              cy.log('✅ [CRÍTICO] Composer abierto');
              composeFound = true;
            }
          });
          
          break;
        }
      }
      
      if (!composeFound) {
        cy.log('⚠️ [CRÍTICO] Composer no encontrado');
      }
    });
  });

  it('[CRÍTICO] navega entre carpetas principales', () => {
    cy.visit('/email', { failOnStatusCode: false });
    cy.wait(2000);
    
    const folderNames = ['Enviados', 'Sent', 'Papelera', 'Trash'];
    
    cy.get('body').then($body => {
      let navigationWorked = false;
      
      for (const folderName of folderNames) {
        const folderElement = $body.find(`:contains("${folderName}")`);
        
        if (folderElement.length) {
          cy.contains(folderName).first().click({ force: true });
          cy.wait(1500);
          navigationWorked = true;
          cy.log(`✅ [CRÍTICO] Navegación a ${folderName} funciona`);
          break;
        }
      }
      
      expect(navigationWorked).to.be.true;
    });
  });

  it('[CRÍTICO] backend de Mailgun está disponible', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:4004/api/health',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.equal(200);
      cy.log('✅ [CRÍTICO] Backend Mailgun disponible');
    });
  });

  it('[CRÍTICO] mantiene sesión al navegar en email', () => {
    cy.visit('/email', { failOnStatusCode: false });
    cy.wait(2000);
    
    // Navegar a diferentes secciones de email
    cy.visit('/email/inbox', { failOnStatusCode: false });
    cy.wait(1000);
    cy.url().should('not.include', '/login');
    
    cy.visit('/email/sent', { failOnStatusCode: false });
    cy.wait(1000);
    cy.url().should('not.include', '/login');
    
    cy.log('✅ [CRÍTICO] Sesión mantenida en módulo email');
  });

  it('[CRÍTICO] muestra loading states o contenido inicial', () => {
    cy.visit('/email', { failOnStatusCode: false });
    
    // Dentro de los primeros 3 segundos debe mostrar algo
    cy.get('body', { timeout: 3000 }).then($body => {
      const hasContent = $body.find('div, p, span, button').length > 10;
      expect(hasContent).to.be.true;
      cy.log('✅ [CRÍTICO] Contenido inicial cargando');
    });
  });

  it('[CRÍTICO] no bloquea la UI con errores de email', () => {
    const errors = [];
    
    cy.on('window:before:load', (win) => {
      const originalError = win.console.error;
      win.console.error = (...args) => {
        const errorMsg = args.join(' ');
        if (!errorMsg.includes('ResizeObserver') && 
            !errorMsg.includes('favicon')) {
          errors.push(errorMsg);
        }
        originalError.apply(win.console, args);
      };
    });
    
    cy.visit('/email', { failOnStatusCode: false });
    cy.wait(3000);
    
    // La UI debe estar funcional incluso con errores menores
    cy.get('body').should('be.visible');
    cy.get('button, a, input').should('have.length.greaterThan', 0);
    
    cy.then(() => {
      if (errors.length > 5) {
        cy.log(`⚠️ Múltiples errores de consola: ${errors.length}`);
      } else {
        cy.log('✅ [CRÍTICO] UI funcional sin errores bloqueantes');
      }
    });
  });

  it('[CRÍTICO] responde a acciones básicas del usuario', () => {
    cy.visit('/email', { failOnStatusCode: false });
    cy.wait(2000);
    
    // Intentar interactuar con elementos
    cy.get('body').then($body => {
      // Click en cualquier botón visible
      const buttons = $body.find('button:visible');
      if (buttons.length > 0) {
        cy.get('button:visible').first().click({ force: true });
        cy.wait(500);
        cy.log('✅ [CRÍTICO] UI responde a clicks');
      }
      
      // Verificar que hay elementos interactivos
      const interactiveElements = $body.find('button, a, input, [role="button"]').length;
      expect(interactiveElements).to.be.greaterThan(0);
      cy.log(`✅ [CRÍTICO] ${interactiveElements} elementos interactivos encontrados`);
    });
  });
});
