/**
 * Test E2E para Buscador de Proveedores con IA
 * Verifica que el sistema funcione end-to-end
 */

describe('🤖 Buscador de Proveedores con IA', () => {
  const TEST_USER = {
    email: Cypress.env('TEST_USER_EMAIL') || 'danielnavarrocampos@icloud.com',
    password: Cypress.env('TEST_USER_PASSWORD') || 'Test123!'
  };

  beforeEach(() => {
    // Limpiar tokens expirados antes de cada test
    cy.clearLocalStorage('mw360_auth_token');
    cy.clearCookies();
    
    // Visitar página principal
    cy.visit('/');
    cy.wait(1000);
  });

  describe('Autenticación previa', () => {
    it('✅ Usuario puede hacer login', () => {
      // Verificar que está en login o hacer login
      cy.url().then(url => {
        if (url.includes('/login')) {
          cy.log('🔐 Usuario no autenticado, haciendo login...');
          cy.get('input[type="email"]').clear().type(TEST_USER.email);
          cy.get('input[type="password"]').clear().type(TEST_USER.password);
          cy.contains('button', /iniciar|login|entrar/i).click();
          cy.wait(2000);
        } else {
          cy.log('✅ Usuario ya autenticado');
        }
      });

      // Verificar que la autenticación funcionó
      cy.window().then((win) => {
        const user = win.firebase?.auth()?.currentUser;
        expect(user).to.not.be.null;
        expect(user?.email).to.equal(TEST_USER.email);
        cy.log(`✅ Autenticado como: ${user?.email}`);
      });
    });

    it('✅ Token de Firebase es válido y no expirado', () => {
      // Login si es necesario
      cy.url().then(url => {
        if (url.includes('/login')) {
          cy.get('input[type="email"]').clear().type(TEST_USER.email);
          cy.get('input[type="password"]').clear().type(TEST_USER.password);
          cy.contains('button', /iniciar|login|entrar/i).click();
          cy.wait(2000);
        }
      });

      // Verificar token
      cy.window().then(async (win) => {
        const user = win.firebase?.auth()?.currentUser;
        expect(user).to.not.be.null;

        // Obtener token
        const token = await user.getIdToken(true);
        expect(token).to.not.be.null;
        expect(token.length).to.be.greaterThan(100);

        // Decodificar y verificar expiración
        const parts = token.split('.');
        const payload = JSON.parse(atob(parts[1]));
        const expiresAt = new Date(payload.exp * 1000);
        const now = new Date();
        
        cy.log(`Token expira: ${expiresAt.toLocaleString()}`);
        expect(expiresAt).to.be.greaterThan(now);
        
        // Verificar que el token es reciente (generado hace menos de 5 minutos)
        const issuedAt = new Date(payload.iat * 1000);
        const tokenAge = (now - issuedAt) / 1000 / 60; // minutos
        cy.log(`Token generado hace: ${tokenAge.toFixed(1)} minutos`);
        expect(tokenAge).to.be.lessThan(5);
      });
    });
  });

  describe('Navegación a Proveedores', () => {
    beforeEach(() => {
      // Login
      cy.url().then(url => {
        if (url.includes('/login')) {
          cy.get('input[type="email"]').clear().type(TEST_USER.email);
          cy.get('input[type="password"]').clear().type(TEST_USER.password);
          cy.contains('button', /iniciar|login|entrar/i).click();
          cy.wait(2000);
        }
      });
    });

    it('✅ Puede navegar a página de Proveedores', () => {
      // Buscar link de Proveedores
      cy.contains('a', /proveedores/i, { timeout: 10000 }).click();
      
      // Verificar URL
      cy.url().should('include', '/proveedores');
      
      // Verificar que la página cargó
      cy.contains(/proveedores/i).should('be.visible');
    });
  });

  describe('Búsqueda de Proveedores con IA', () => {
    beforeEach(() => {
      // Login
      cy.url().then(url => {
        if (url.includes('/login')) {
          cy.get('input[type="email"]').clear().type(TEST_USER.email);
          cy.get('input[type="password"]').clear().type(TEST_USER.password);
          cy.contains('button', /iniciar|login|entrar/i).click();
          cy.wait(2000);
        }
      });

      // Ir a proveedores
      cy.contains('a', /proveedores/i, { timeout: 10000 }).click();
      cy.wait(1000);
    });

    it('🔍 Puede abrir el buscador de IA', () => {
      // Buscar botón de búsqueda IA
      cy.contains('button', /buscar.*ia|ia.*buscar|inteligencia/i, { timeout: 10000 })
        .should('be.visible')
        .click();

      // Verificar que el modal se abrió
      cy.contains(/buscar|proveedores/i).should('be.visible');
    });

    it('✅ Puede buscar "DJ Valencia" y obtener resultados', () => {
      const SEARCH_QUERY = 'dj valencia';

      // Abrir buscador
      cy.contains('button', /buscar.*ia|ia.*buscar|inteligencia/i, { timeout: 10000 }).click();

      // Escribir búsqueda
      cy.get('input[type="text"]').last().clear().type(SEARCH_QUERY);
      
      // Click en buscar
      cy.contains('button', /buscar|search/i).click();

      // Interceptar llamada al backend
      cy.intercept('POST', '**/api/ai-suppliers').as('aiSearch');

      // Esperar respuesta
      cy.wait('@aiSearch', { timeout: 30000 }).then((interception) => {
        cy.log('📡 Respuesta del backend:', JSON.stringify(interception.response));
        
        // Verificar que la respuesta es 200
        expect(interception.response.statusCode).to.equal(200);
        
        // Verificar que hay resultados
        const results = interception.response.body;
        expect(results).to.be.an('array');
        expect(results.length).to.be.greaterThan(0);
        
        cy.log(`✅ ${results.length} resultados encontrados`);
      });

      // Verificar que los resultados se muestran en la UI
      cy.contains(/resultados|proveedores/i, { timeout: 10000 }).should('be.visible');
      
      // Verificar que hay al menos un resultado visible
      cy.get('[data-testid="supplier-result"]', { timeout: 5000 })
        .should('have.length.greaterThan', 0);
    });

    it('❌ Muestra error si el token está expirado (simulado)', () => {
      // Simular token expirado guardando uno inválido
      cy.window().then((win) => {
        win.localStorage.setItem('mw360_auth_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxNjAwMDAwMDAwfQ.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ');
      });

      // Abrir buscador
      cy.contains('button', /buscar.*ia|ia.*buscar|inteligencia/i, { timeout: 10000 }).click();

      // Escribir búsqueda
      cy.get('input[type="text"]').last().clear().type('dj valencia');
      
      // Click en buscar
      cy.contains('button', /buscar|search/i).click();

      // Verificar que muestra error 401
      cy.contains(/401|unauthorized|expirado|token/i, { timeout: 10000 }).should('be.visible');
    });
  });

  describe('Troubleshooting', () => {
    it('🔧 Verificar estado de Firebase Auth', () => {
      cy.window().then((win) => {
        const firebaseAuth = win.firebase?.auth();
        expect(firebaseAuth).to.not.be.undefined;
        
        const currentUser = firebaseAuth?.currentUser;
        if (currentUser) {
          cy.log('✅ Usuario autenticado:', currentUser.email);
        } else {
          cy.log('❌ No hay usuario autenticado');
        }
      });
    });

    it('🔧 Verificar OpenAI API Key en backend', () => {
      cy.request({
        method: 'GET',
        url: 'http://localhost:4004/api/health',
        failOnStatusCode: false
      }).then((response) => {
        cy.log('Backend health:', JSON.stringify(response.body));
        
        if (response.body?.openai) {
          cy.log('✅ OpenAI configurado');
        } else {
          cy.log('⚠️ OpenAI puede no estar configurado');
        }
      });
    });

    it('🔧 Limpiar tokens y verificar refresh', () => {
      // Login
      cy.url().then(url => {
        if (url.includes('/login')) {
          cy.get('input[type="email"]').clear().type(TEST_USER.email);
          cy.get('input[type="password"]').clear().type(TEST_USER.password);
          cy.contains('button', /iniciar|login|entrar/i).click();
          cy.wait(2000);
        }
      });

      // Limpiar tokens
      cy.clearLocalStorage('mw360_auth_token');

      // Intentar obtener nuevo token
      cy.window().then(async (win) => {
        const user = win.firebase?.auth()?.currentUser;
        expect(user).to.not.be.null;

        const newToken = await user.getIdToken(true);
        expect(newToken).to.not.be.null;
        cy.log('✅ Token refrescado correctamente');
      });
    });
  });
});
