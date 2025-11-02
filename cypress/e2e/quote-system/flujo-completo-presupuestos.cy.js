/**
 * 💰 Test E2E: Sistema Completo de Presupuestos
 *
 * Verifica el flujo completo:
 * 1. Botón "Solicitar Presupuesto" visible en tarjetas
 * 2. Modal de solicitud se abre y funciona
 * 3. Sección "Mis Solicitudes" visible
 * 4. QuoteComparator accesible
 * 5. Selección de presupuesto funciona
 * 6. WeddingServiceCard se actualiza automáticamente
 */

describe('💰 Sistema Completo de Presupuestos', () => {
  const TEST_USER = {
    email: 'test@mywed360.com',
    password: 'Test123456',
  };

  before(() => {
    cy.log('🚀 Configurando test del sistema de presupuestos');
  });

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  /**
   * PASO 1: Verificar que el botón "Solicitar Presupuesto" está visible
   */
  it('✅ PASO 1: Botón "Solicitar Presupuesto" visible en tarjetas de proveedores', () => {
    cy.log('🔐 Haciendo login...');

    // Login
    cy.visit('/login');
    cy.get('input[type="email"]').type(TEST_USER.email);
    cy.get('input[type="password"]').type(TEST_USER.password);
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/dashboard', { timeout: 10000 });
    cy.log('✅ Login exitoso');

    // Ir a proveedores
    cy.visit('/proveedores');
    cy.url().should('include', '/proveedores');

    // Esperar que cargue la página
    cy.contains('Servicios de tu boda', { timeout: 10000 }).should('be.visible');

    // Buscar un proveedor (hacer búsqueda)
    cy.log('🔍 Buscando proveedores...');
    cy.get('input[type="search"]').first().type('fotografia');
    cy.contains('button', 'Buscar').click();

    // Esperar resultados
    cy.wait(3000);

    // Verificar que hay tarjetas de proveedores
    cy.get('[data-testid="supplier-card"]', { timeout: 10000 })
      .should('exist')
      .and('have.length.greaterThan', 0);

    cy.log('✅ Tarjetas de proveedores encontradas');

    // Verificar que el botón "Solicitar Presupuesto" existe
    cy.contains('button', 'Solicitar Presupuesto')
      .should('be.visible')
      .then(($btn) => {
        cy.log('✅ Botón "Solicitar Presupuesto" encontrado');

        // Verificar que tiene el icono correcto
        expect($btn.text()).to.include('💰');

        // Verificar estilos (debe ser morado/purple)
        cy.wrap($btn).should('have.class', 'bg-purple-600');
      });
  });

  /**
   * PASO 2: Verificar que el modal de solicitud se abre correctamente
   */
  it('✅ PASO 2: Modal de solicitud se abre al hacer click', () => {
    // Login
    cy.visit('/login');
    cy.get('input[type="email"]').type(TEST_USER.email);
    cy.get('input[type="password"]').type(TEST_USER.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard', { timeout: 10000 });

    // Ir a proveedores y buscar
    cy.visit('/proveedores');
    cy.get('input[type="search"]').first().type('fotografia');
    cy.contains('button', 'Buscar').click();
    cy.wait(3000);

    // Click en "Solicitar Presupuesto"
    cy.log('🖱️ Haciendo click en "Solicitar Presupuesto"...');
    cy.contains('button', 'Solicitar Presupuesto').first().click();

    // Verificar que el modal se abre
    cy.contains('Solicitar Presupuesto', { timeout: 5000 }).should('be.visible');
    cy.log('✅ Modal de solicitud abierto');

    // Verificar campos del formulario
    cy.log('🔍 Verificando campos del formulario...');

    // Campos básicos
    cy.contains('label', 'Fecha del evento').should('be.visible');
    cy.contains('label', 'Número de invitados').should('be.visible');

    // Campos específicos (varían por categoría)
    // Verificar que hay al menos un campo de entrada
    cy.get('input[type="number"]').should('have.length.greaterThan', 0);
    cy.get('textarea').should('exist');

    cy.log('✅ Formulario completo visible');

    // Verificar botones de acción
    cy.contains('button', 'Enviar').should('be.visible');
    cy.contains('button', 'Cancelar').should('be.visible');
  });

  /**
   * PASO 3: Verificar que la sección "Mis Solicitudes" está visible
   */
  it('✅ PASO 3: Sección "Mis Solicitudes de Presupuesto" visible', () => {
    // Login
    cy.visit('/login');
    cy.get('input[type="email"]').type(TEST_USER.email);
    cy.get('input[type="password"]').type(TEST_USER.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard', { timeout: 10000 });

    // Ir a proveedores
    cy.visit('/proveedores');

    // Verificar que la sección existe
    cy.log('🔍 Buscando sección "Mis Solicitudes de Presupuesto"...');
    cy.contains('Mis Solicitudes de Presupuesto', { timeout: 10000 }).should('be.visible');

    cy.log('✅ Sección de solicitudes visible');

    // Verificar elementos de la sección
    cy.contains('Compara y gestiona los presupuestos').should('be.visible');

    // Verificar que tiene el header correcto
    cy.get('h2').contains('Mis Solicitudes de Presupuesto').should('exist');

    cy.log('✅ Header y descripción correctos');
  });

  /**
   * PASO 4: Simular solicitud de presupuesto (mock)
   */
  it('✅ PASO 4: Completar y enviar solicitud de presupuesto', () => {
    // Login
    cy.visit('/login');
    cy.get('input[type="email"]').type(TEST_USER.email);
    cy.get('input[type="password"]').type(TEST_USER.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard', { timeout: 10000 });

    // Interceptar llamada al backend
    cy.intercept('POST', '**/api/suppliers/*/quote-requests', {
      statusCode: 201,
      body: {
        success: true,
        requestId: 'test-request-123',
        message: 'Solicitud enviada correctamente',
      },
    }).as('quoteRequest');

    // Ir a proveedores y buscar
    cy.visit('/proveedores');
    cy.get('input[type="search"]').first().type('fotografia');
    cy.contains('button', 'Buscar').click();
    cy.wait(3000);

    // Abrir modal
    cy.contains('button', 'Solicitar Presupuesto').first().click();
    cy.wait(1000);

    // Completar formulario
    cy.log('📝 Completando formulario...');

    // Fecha del evento (si existe)
    cy.get('input[type="date"]').first().type('2025-12-31');

    // Número de invitados
    cy.get('input[type="number"]').first().clear().type('150');

    // Mensaje adicional
    cy.get('textarea').first().type('Test E2E: Solicitud de presupuesto para fotografía');

    cy.log('✅ Formulario completado');

    // Enviar solicitud
    cy.log('📤 Enviando solicitud...');
    cy.contains('button', 'Enviar').click();

    // Verificar que se hizo la llamada
    cy.wait('@quoteRequest', { timeout: 10000 });

    // Verificar toast de éxito
    cy.contains('éxito', { timeout: 5000 }).should('be.visible');
    cy.log('✅ Solicitud enviada correctamente');

    // Verificar que el modal se cierra
    cy.contains('Solicitar Presupuesto').should('not.exist');
  });

  /**
   * PASO 5: Verificar estructura de datos del tracker
   */
  it('✅ PASO 5: QuoteRequestsTracker estructura de datos', () => {
    // Login
    cy.visit('/login');
    cy.get('input[type="email"]').type(TEST_USER.email);
    cy.get('input[type="password"]').type(TEST_USER.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard', { timeout: 10000 });

    // Interceptar llamada para obtener solicitudes
    cy.intercept('GET', '**/api/quote-requests**', {
      statusCode: 200,
      body: {
        requests: [
          {
            id: 'req-1',
            categoryKey: 'fotografia',
            categoryName: 'Fotografía',
            supplierId: 'sup-1',
            supplierName: 'Studio Pro',
            status: 'quoted',
            quotes: [
              {
                id: 'quote-1',
                price: 2320,
                terms: { deposit: 30 },
              },
              {
                id: 'quote-2',
                price: 2700,
                terms: { deposit: 50 },
              },
            ],
          },
        ],
      },
    }).as('getRequests');

    // Ir a proveedores
    cy.visit('/proveedores');

    // Esperar que cargue las solicitudes
    cy.wait('@getRequests', { timeout: 10000 });

    // Verificar que muestra la categoría
    cy.log('🔍 Verificando categorías con solicitudes...');
    cy.contains('Fotografía').should('be.visible');

    // Verificar contador de respuestas
    cy.contains('2 respuestas', { timeout: 5000 }).should('be.visible');

    // Verificar botón de comparar
    cy.contains('button', 'Comparar').should('be.visible');

    cy.log('✅ Estructura de tracker correcta');
  });

  /**
   * PASO 6: Verificar que el comparador se abre
   */
  it('✅ PASO 6: QuoteComparator se abre correctamente', () => {
    // Login
    cy.visit('/login');
    cy.get('input[type="email"]').type(TEST_USER.email);
    cy.get('input[type="password"]').type(TEST_USER.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard', { timeout: 10000 });

    // Interceptar llamada
    cy.intercept('GET', '**/api/quote-requests**', {
      statusCode: 200,
      body: {
        requests: [
          {
            id: 'req-1',
            categoryKey: 'fotografia',
            categoryName: 'Fotografía',
            supplierId: 'sup-1',
            supplierName: 'Studio Pro',
            status: 'quoted',
            quotes: [
              {
                id: 'quote-1',
                supplierId: 'sup-1',
                supplierName: 'Studio Pro',
                price: 2320,
                terms: { deposit: 30 },
                score: 92,
              },
              {
                id: 'quote-2',
                supplierId: 'sup-2',
                supplierName: 'Foto Arte',
                price: 2700,
                terms: { deposit: 50 },
                score: 87,
              },
            ],
          },
        ],
      },
    }).as('getRequests');

    cy.visit('/proveedores');
    cy.wait('@getRequests');

    // Click en "Comparar"
    cy.log('🖱️ Abriendo comparador...');
    cy.contains('button', 'Comparar').first().click();

    // Verificar que el comparador se abre
    cy.contains('Comparar Presupuestos', { timeout: 5000 }).should('be.visible');
    cy.log('✅ Comparador abierto');

    // Verificar que muestra los presupuestos
    cy.contains('Studio Pro').should('be.visible');
    cy.contains('Foto Arte').should('be.visible');

    // Verificar precios
    cy.contains('2.320€').should('be.visible');
    cy.contains('2.700€').should('be.visible');

    // Verificar scores
    cy.contains('92/100').should('be.visible');
    cy.contains('87/100').should('be.visible');

    // Verificar botones de selección
    cy.contains('button', 'Seleccionar').should('have.length', 2);

    cy.log('✅ Comparador funcional con datos correctos');
  });

  /**
   * PASO 7: Verificar selección y asignación de proveedor
   */
  it('✅ PASO 7: Seleccionar presupuesto y asignar proveedor', () => {
    // Login
    cy.visit('/login');
    cy.get('input[type="email"]').type(TEST_USER.email);
    cy.get('input[type="password"]').type(TEST_USER.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard', { timeout: 10000 });

    // Interceptar llamadas
    cy.intercept('GET', '**/api/quote-requests**', {
      statusCode: 200,
      body: {
        requests: [
          {
            id: 'req-1',
            categoryKey: 'fotografia',
            categoryName: 'Fotografía',
            supplierId: 'sup-1',
            supplierName: 'Studio Pro',
            status: 'quoted',
            quotes: [
              {
                id: 'quote-1',
                supplierId: 'sup-1',
                supplierName: 'Studio Pro',
                supplierCategory: 'fotografia',
                price: 2320,
                terms: { deposit: 30 },
                score: 92,
              },
            ],
          },
        ],
      },
    }).as('getRequests');

    // Interceptar asignación de proveedor
    cy.intercept('POST', '**/api/weddings/*/services/assign', {
      statusCode: 200,
      body: {
        success: true,
        serviceId: 'fotografia',
      },
    }).as('assignSupplier');

    cy.visit('/proveedores');
    cy.wait('@getRequests');

    // Abrir comparador
    cy.contains('button', 'Comparar').first().click();
    cy.wait(1000);

    // Seleccionar primer presupuesto
    cy.log('🖱️ Seleccionando presupuesto...');
    cy.contains('button', 'Seleccionar').first().click();

    // Verificar modal de confirmación
    cy.contains('Confirmar', { timeout: 5000 }).should('be.visible');

    // Confirmar selección
    cy.contains('button', 'Confirmar').click();

    // Verificar que se hizo la llamada
    cy.wait('@assignSupplier', { timeout: 10000 });

    // Verificar toast de éxito
    cy.contains('contratado', { timeout: 5000 }).should('be.visible');
    cy.log('✅ Proveedor asignado correctamente');
  });

  /**
   * PASO 8: Verificar que WeddingServiceCard se actualiza
   */
  it('✅ PASO 8: WeddingServiceCard se actualiza tras asignación', () => {
    // Login
    cy.visit('/login');
    cy.get('input[type="email"]').type(TEST_USER.email);
    cy.get('input[type="password"]').type(TEST_USER.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard', { timeout: 10000 });

    // Interceptar servicios de la boda con proveedor asignado
    cy.intercept('GET', '**/api/weddings/*/services', {
      statusCode: 200,
      body: {
        services: [
          {
            id: 'fotografia',
            name: 'Fotografía',
            status: 'contratado',
            supplier: {
              id: 'sup-1',
              name: 'Studio Pro',
              price: 2320,
              contact: {
                phone: '+34 600 123 456',
                email: 'info@studiopro.com',
              },
            },
            quote: {
              price: 2320,
              terms: { deposit: 30 },
            },
          },
        ],
      },
    }).as('getServices');

    cy.visit('/proveedores');
    cy.wait('@getServices');

    // Verificar que la tarjeta muestra "Confirmado"
    cy.log('🔍 Verificando tarjeta actualizada...');
    cy.contains('[data-testid="wedding-service-card"]', 'Fotografía')
      .should('be.visible')
      .within(() => {
        // Verificar estado confirmado
        cy.contains('Confirmado').should('be.visible');

        // Verificar nombre del proveedor
        cy.contains('Studio Pro').should('be.visible');

        // Verificar precio
        cy.contains('2.320€').should('be.visible');

        // Verificar adelanto
        cy.contains('30%').should('be.visible');

        // Verificar botones de contacto
        cy.contains('button', 'WhatsApp').should('exist');
        cy.contains('button', 'Email').should('exist');
      });

    cy.log('✅ Tarjeta actualizada correctamente con proveedor contratado');
  });

  /**
   * PASO 9: Test de integración completo
   */
  it('🎯 PASO 9: Flujo completo end-to-end', () => {
    // Login
    cy.visit('/login');
    cy.get('input[type="email"]').type(TEST_USER.email);
    cy.get('input[type="password"]').type(TEST_USER.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard', { timeout: 10000 });

    cy.log('📋 FLUJO COMPLETO: Solicitar → Comparar → Asignar → Verificar');

    // PASO A: Buscar proveedor
    cy.log('1️⃣ Buscando proveedores...');
    cy.visit('/proveedores');
    cy.get('input[type="search"]').first().type('fotografia');
    cy.contains('button', 'Buscar').click();
    cy.wait(3000);

    // PASO B: Verificar botón de solicitud
    cy.log('2️⃣ Verificando botón "Solicitar Presupuesto"...');
    cy.contains('button', 'Solicitar Presupuesto').should('be.visible');

    // PASO C: Verificar sección de solicitudes
    cy.log('3️⃣ Verificando sección "Mis Solicitudes"...');
    cy.contains('Mis Solicitudes de Presupuesto').should('be.visible');

    // PASO D: Verificar que todo está integrado
    cy.log('4️⃣ Verificando integración completa...');

    // Componentes principales visibles
    const componentsToCheck = [
      'Solicitar Presupuesto', // Botón en tarjetas
      'Mis Solicitudes', // Tracker
      'Servicios de tu boda', // Overview
    ];

    componentsToCheck.forEach((component) => {
      cy.contains(component).should('exist');
    });

    cy.log('✅ FLUJO COMPLETO INTEGRADO Y FUNCIONAL');
  });

  /**
   * PASO 10: Verificar manejo de errores
   */
  it('⚠️ PASO 10: Manejo de errores en asignación', () => {
    // Login
    cy.visit('/login');
    cy.get('input[type="email"]').type(TEST_USER.email);
    cy.get('input[type="password"]').type(TEST_USER.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard', { timeout: 10000 });

    // Simular error en asignación
    cy.intercept('POST', '**/api/weddings/*/services/assign', {
      statusCode: 500,
      body: {
        error: 'Error al asignar proveedor',
      },
    }).as('assignSupplierError');

    // Interceptar requests
    cy.intercept('GET', '**/api/quote-requests**', {
      statusCode: 200,
      body: {
        requests: [
          {
            id: 'req-1',
            categoryKey: 'fotografia',
            quotes: [
              {
                id: 'quote-1',
                supplierId: 'sup-1',
                supplierName: 'Studio Pro',
                price: 2320,
              },
            ],
          },
        ],
      },
    });

    cy.visit('/proveedores');
    cy.wait(2000);

    // Intentar asignar
    cy.contains('button', 'Comparar').first().click();
    cy.wait(1000);
    cy.contains('button', 'Seleccionar').first().click();
    cy.wait(500);
    cy.contains('button', 'Confirmar').click();

    // Verificar toast de error
    cy.contains('Error', { timeout: 5000 }).should('be.visible');
    cy.log('✅ Manejo de errores funcional');
  });
});
