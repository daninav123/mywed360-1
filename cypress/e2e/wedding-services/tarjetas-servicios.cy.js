/**
 * Test E2E: Diagnóstico de Tarjetas de Servicios
 *
 * Objetivo: Reproducir el problema donde las tarjetas NO aparecen/desaparecen
 * al activar/desactivar servicios desde el modal "Gestionar servicios"
 */

describe('🔍 DIAGNÓSTICO: Tarjetas de Servicios', () => {
  // Usuario y boda de prueba
  const TEST_USER = {
    email: 'test@mywed360.com',
    password: 'Test123456',
    uid: null,
  };

  before(() => {
    cy.log('🚀 Configurando test de diagnóstico');
  });

  beforeEach(() => {
    // Limpiar cookies y localStorage antes de cada test
    cy.clearCookies();
    cy.clearLocalStorage();

    // Visitar la página de login
    cy.visit('/login');
  });

  it('📋 PASO 1: Login y navegación a /proveedores', () => {
    cy.log('🔐 Haciendo login...');

    // Login
    cy.get('input[type="email"]').type(TEST_USER.email);
    cy.get('input[type="password"]').type(TEST_USER.password);
    cy.get('button[type="submit"]').click();

    // Esperar redirect a dashboard
    cy.url().should('include', '/dashboard', { timeout: 10000 });
    cy.log('✅ Login exitoso');

    // Ir a proveedores
    cy.visit('/proveedores');
    cy.url().should('include', '/proveedores');
    cy.log('✅ En página /proveedores');
  });

  it('📊 PASO 2: Contar tarjetas iniciales', () => {
    // Login primero
    cy.visit('/login');
    cy.get('input[type="email"]').type(TEST_USER.email);
    cy.get('input[type="password"]').type(TEST_USER.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard', { timeout: 10000 });

    // Ir a proveedores
    cy.visit('/proveedores');

    // Esperar a que cargue el componente
    cy.contains('Servicios de tu boda', { timeout: 10000 }).should('be.visible');

    // Contar tarjetas iniciales
    cy.get('[data-testid="wedding-service-card"]')
      .its('length')
      .then((initialCount) => {
        cy.log(`📊 Tarjetas iniciales: ${initialCount}`);

        // Guardar para comparar después
        cy.wrap(initialCount).as('initialCardCount');

        // Verificar que hay al menos 1 tarjeta
        expect(initialCount).to.be.greaterThan(0);
      });
  });

  it('🎯 PASO 3: Abrir modal y verificar estado inicial', () => {
    // Login
    cy.visit('/login');
    cy.get('input[type="email"]').type(TEST_USER.email);
    cy.get('input[type="password"]').type(TEST_USER.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard', { timeout: 10000 });

    // Ir a proveedores
    cy.visit('/proveedores');
    cy.contains('Servicios de tu boda', { timeout: 10000 }).should('be.visible');

    // Click en "Gestionar servicios"
    cy.log('🖱️ Abriendo modal "Gestionar servicios"...');
    cy.contains('button', 'Gestionar servicios').click();

    // Verificar que el modal se abre
    cy.contains('h2', 'Gestionar servicios').should('be.visible');
    cy.log('✅ Modal abierto');

    // Contar servicios activos (con borde morado)
    cy.get('.border-purple-600')
      .its('length')
      .then((activeCount) => {
        cy.log(`✅ Servicios activos en modal: ${activeCount}`);
        cy.wrap(activeCount).as('initialActiveServices');
      });
  });

  it('❌ PASO 4: DESACTIVAR un servicio y verificar', () => {
    // Login
    cy.visit('/login');
    cy.get('input[type="email"]').type(TEST_USER.email);
    cy.get('input[type="password"]').type(TEST_USER.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard', { timeout: 10000 });

    // Ir a proveedores
    cy.visit('/proveedores');
    cy.contains('Servicios de tu boda', { timeout: 10000 }).should('be.visible');

    // Contar tarjetas antes
    let cardsBefore;
    cy.get('[data-testid="wedding-service-card"]')
      .its('length')
      .then((count) => {
        cardsBefore = count;
        cy.log(`📊 Tarjetas ANTES: ${cardsBefore}`);
      });

    // Abrir modal
    cy.contains('button', 'Gestionar servicios').click();
    cy.contains('h2', 'Gestionar servicios').should('be.visible');

    // Buscar un servicio activo para desactivar
    cy.get('.border-purple-600')
      .first()
      .within(() => {
        cy.get('p').first().invoke('text').as('serviceName');
      });

    // Desactivar el primer servicio activo
    cy.log('❌ Desactivando servicio...');
    cy.get('.border-purple-600').first().click();

    // Esperar el toast de confirmación
    cy.contains('desactivado', { timeout: 5000 }).should('be.visible');
    cy.log('✅ Toast de desactivación visible');

    // Cerrar modal
    cy.log('🚪 Cerrando modal...');
    cy.contains('button', 'Guardar y cerrar').click();

    // Esperar a que el modal se cierre
    cy.contains('h2', 'Gestionar servicios').should('not.exist');

    // ⚠️ MOMENTO CRÍTICO: ¿Se actualizaron las tarjetas?
    cy.wait(1000); // Dar tiempo para re-render

    // Contar tarjetas después
    cy.get('[data-testid="wedding-service-card"]')
      .its('length')
      .then((cardsAfter) => {
        cy.log(`📊 Tarjetas DESPUÉS: ${cardsAfter}`);
        cy.log(`📊 Tarjetas ANTES: ${cardsBefore}`);
        cy.log(`📊 Diferencia: ${cardsBefore - cardsAfter}`);

        // ✅ VERIFICACIÓN: Debe haber 1 tarjeta menos
        expect(cardsAfter).to.equal(
          cardsBefore - 1,
          `❌ ERROR: Esperábamos ${cardsBefore - 1} tarjetas pero hay ${cardsAfter}`
        );
      });

    // Verificar en consola
    cy.get('@serviceName').then((name) => {
      cy.log(`🔍 Verificando que la tarjeta "${name}" desapareció...`);
      cy.contains('[data-testid="wedding-service-card"]', name).should('not.exist');
    });
  });

  it('✅ PASO 5: ACTIVAR un servicio y verificar', () => {
    // Login
    cy.visit('/login');
    cy.get('input[type="email"]').type(TEST_USER.email);
    cy.get('input[type="password"]').type(TEST_USER.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard', { timeout: 10000 });

    // Ir a proveedores
    cy.visit('/proveedores');
    cy.contains('Servicios de tu boda', { timeout: 10000 }).should('be.visible');

    // Contar tarjetas antes
    let cardsBefore;
    cy.get('[data-testid="wedding-service-card"]')
      .its('length')
      .then((count) => {
        cardsBefore = count;
        cy.log(`📊 Tarjetas ANTES: ${cardsBefore}`);
      });

    // Abrir modal
    cy.contains('button', 'Gestionar servicios').click();
    cy.contains('h2', 'Gestionar servicios').should('be.visible');

    // Buscar un servicio inactivo para activar
    cy.get('.border-gray-200')
      .first()
      .within(() => {
        cy.get('p').first().invoke('text').as('serviceName');
      });

    // Activar el primer servicio inactivo
    cy.log('✅ Activando servicio...');
    cy.get('.border-gray-200').first().click();

    // Esperar el toast de confirmación
    cy.contains('añadido', { timeout: 5000 }).should('be.visible');
    cy.log('✅ Toast de activación visible');

    // Cerrar modal
    cy.log('🚪 Cerrando modal...');
    cy.contains('button', 'Guardar y cerrar').click();

    // Esperar a que el modal se cierre
    cy.contains('h2', 'Gestionar servicios').should('not.exist');

    // ⚠️ MOMENTO CRÍTICO: ¿Se actualizaron las tarjetas?
    cy.wait(1000); // Dar tiempo para re-render

    // Contar tarjetas después
    cy.get('[data-testid="wedding-service-card"]')
      .its('length')
      .then((cardsAfter) => {
        cy.log(`📊 Tarjetas DESPUÉS: ${cardsAfter}`);
        cy.log(`📊 Tarjetas ANTES: ${cardsBefore}`);
        cy.log(`📊 Diferencia: ${cardsAfter - cardsBefore}`);

        // ✅ VERIFICACIÓN: Debe haber 1 tarjeta más
        expect(cardsAfter).to.equal(
          cardsBefore + 1,
          `❌ ERROR: Esperábamos ${cardsBefore + 1} tarjetas pero hay ${cardsAfter}`
        );
      });

    // Verificar que la nueva tarjeta aparece
    cy.get('@serviceName').then((name) => {
      cy.log(`🔍 Verificando que la tarjeta "${name}" apareció...`);
      cy.contains('[data-testid="wedding-service-card"]', name).should('be.visible');
    });
  });

  it('🐛 DIAGNÓSTICO: Capturar logs de consola', () => {
    // Login
    cy.visit('/login');
    cy.get('input[type="email"]').type(TEST_USER.email);
    cy.get('input[type="password"]').type(TEST_USER.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard', { timeout: 10000 });

    // Capturar logs de consola
    cy.window().then((win) => {
      cy.spy(win.console, 'log').as('consoleLog');
    });

    // Ir a proveedores
    cy.visit('/proveedores');
    cy.contains('Servicios de tu boda', { timeout: 10000 }).should('be.visible');

    // Abrir modal y hacer cambio
    cy.contains('button', 'Gestionar servicios').click();
    cy.get('.border-purple-600').first().click();
    cy.wait(500);
    cy.contains('button', 'Guardar y cerrar').click();

    // Esperar y revisar logs
    cy.wait(2000);

    cy.get('@consoleLog').should('have.been.called');

    // Buscar logs específicos
    cy.get('@consoleLog').then((spy) => {
      const calls = spy.getCalls();
      const logs = calls.map((call) => call.args.join(' '));

      cy.log('📋 LOGS CAPTURADOS:');
      logs.forEach((log) => {
        if (
          log.includes('activeCategories') ||
          log.includes('Servicios activos') ||
          log.includes('useWeddingCategories')
        ) {
          cy.log(`  ${log}`);
        }
      });
    });
  });
});
