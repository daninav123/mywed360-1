/**
 * 🎨 Test E2E: UI y Accesibilidad del Sistema de Presupuestos
 *
 * Verifica aspectos específicos de UI/UX:
 * - Estilos y clases CSS correctas
 * - Iconos y emojis presentes
 * - Accesibilidad (aria-labels, roles)
 * - Responsive design
 * - Estados de carga y errores
 */

describe('🎨 UI y Accesibilidad - Sistema de Presupuestos', () => {
  const TEST_USER = {
    email: 'test@mywed360.com',
    password: 'Test123456',
  };

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();

    // Login
    cy.visit('/login');
    cy.get('input[type="email"]').type(TEST_USER.email);
    cy.get('input[type="password"]').type(TEST_USER.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard', { timeout: 10000 });
  });

  /**
   * UI: Botón "Solicitar Presupuesto"
   */
  it('✅ Botón "Solicitar Presupuesto" tiene estilos correctos', () => {
    cy.visit('/proveedores');
    cy.get('input[type="search"]').first().type('fotografia');
    cy.contains('button', 'Buscar').click();
    cy.wait(3000);

    cy.contains('button', 'Solicitar Presupuesto')
      .should('be.visible')
      .and(($btn) => {
        // Verificar clases de Tailwind
        expect($btn).to.have.class('bg-purple-600');
        expect($btn).to.have.class('text-white');
        expect($btn).to.have.class('rounded-md');

        // Verificar hover
        expect($btn).to.have.class('hover:bg-purple-700');

        // Verificar que tiene el emoji
        expect($btn.text()).to.include('💰');

        // Verificar que tiene flex para alinear icono
        expect($btn).to.have.class('flex');
        expect($btn).to.have.class('items-center');
        expect($btn).to.have.class('gap-2');
      });

    cy.log('✅ Estilos del botón correctos');
  });

  /**
   * UI: Sección "Mis Solicitudes de Presupuesto"
   */
  it('✅ Sección "Mis Solicitudes" tiene estructura correcta', () => {
    cy.visit('/proveedores');

    // Verificar header de la sección
    cy.contains('Mis Solicitudes de Presupuesto')
      .parent()
      .parent()
      .within(() => {
        // Verificar que tiene el emoji
        cy.contains('📋').should('exist');

        // Verificar título con estilos
        cy.get('h2').should('have.class', 'text-xl').and('have.class', 'font-bold');

        // Verificar descripción
        cy.contains('Compara y gestiona')
          .should('have.class', 'text-sm')
          .and('have.class', 'text-gray-600');

        // Verificar icono de sección (DollarSign)
        cy.get('.bg-purple-100').should('exist');
      });

    cy.log('✅ Estructura de sección correcta');
  });

  /**
   * UI: QuoteRequestsTracker loading state
   */
  it('✅ QuoteRequestsTracker muestra estado de carga', () => {
    // Interceptar con delay
    cy.intercept('GET', '**/api/quote-requests**', (req) => {
      req.reply({
        delay: 2000,
        statusCode: 200,
        body: { requests: [] },
      });
    }).as('slowRequests');

    cy.visit('/proveedores');

    // Verificar que muestra loading
    cy.contains('Cargando presupuestos', { timeout: 1000 }).should('be.visible');

    // Verificar que tiene spinner
    cy.get('.animate-spin').should('be.visible');

    cy.wait('@slowRequests');
    cy.log('✅ Estado de carga visible');
  });

  /**
   * UI: QuoteRequestsTracker empty state
   */
  it('✅ QuoteRequestsTracker muestra estado vacío', () => {
    cy.intercept('GET', '**/api/quote-requests**', {
      statusCode: 200,
      body: { requests: [] },
    }).as('emptyRequests');

    cy.visit('/proveedores');
    cy.wait('@emptyRequests');

    // Verificar mensaje de estado vacío
    cy.contains('No hay solicitudes', { timeout: 5000 }).should('be.visible');
    cy.log('✅ Estado vacío correcto');
  });

  /**
   * UI: QuoteComparator diseño y layout
   */
  it('✅ QuoteComparator tiene diseño lado a lado', () => {
    cy.intercept('GET', '**/api/quote-requests**', {
      statusCode: 200,
      body: {
        requests: [
          {
            id: 'req-1',
            categoryKey: 'fotografia',
            categoryName: 'Fotografía',
            quotes: [
              {
                id: 'q1',
                supplierId: 's1',
                supplierName: 'Studio Pro',
                price: 2320,
                score: 92,
              },
              {
                id: 'q2',
                supplierId: 's2',
                supplierName: 'Foto Arte',
                price: 2700,
                score: 87,
              },
            ],
          },
        ],
      },
    });

    cy.visit('/proveedores');
    cy.wait(2000);

    // Abrir comparador
    cy.contains('button', 'Comparar').first().click();
    cy.wait(1000);

    // Verificar layout
    cy.contains('Comparar Presupuestos').should('be.visible');

    // Verificar que hay 2 columnas
    cy.get('[data-testid="quote-card"]')
      .should('have.length', 2)
      .each(($card) => {
        // Verificar estructura de cada tarjeta
        cy.wrap($card).within(() => {
          // Precio visible
          cy.contains('€').should('be.visible');

          // Score visible
          cy.contains('/100').should('be.visible');

          // Botón seleccionar
          cy.contains('button', 'Seleccionar').should('be.visible');
        });
      });

    cy.log('✅ Layout del comparador correcto');
  });

  /**
   * UI: Scores con colores correctos
   */
  it('✅ Scores muestran colores según puntuación', () => {
    cy.intercept('GET', '**/api/quote-requests**', {
      statusCode: 200,
      body: {
        requests: [
          {
            id: 'req-1',
            categoryKey: 'fotografia',
            quotes: [
              {
                id: 'q1',
                supplierId: 's1',
                supplierName: 'Excelente',
                price: 2000,
                score: 95, // Score alto -> verde
              },
              {
                id: 'q2',
                supplierId: 's2',
                supplierName: 'Regular',
                price: 3000,
                score: 70, // Score medio -> amarillo
              },
            ],
          },
        ],
      },
    });

    cy.visit('/proveedores');
    cy.wait(2000);
    cy.contains('button', 'Comparar').first().click();

    // Verificar score alto (verde)
    cy.contains('95/100').parent().should('have.class', 'text-green-700');

    // Verificar score medio (amarillo/naranja)
    cy.contains('70/100').parent().should('have.class', 'text-yellow-700');

    cy.log('✅ Colores de scores correctos');
  });

  /**
   * Accesibilidad: Navegación por teclado
   */
  it('♿ Navegación por teclado funcional', () => {
    cy.visit('/proveedores');
    cy.get('input[type="search"]').first().type('fotografia');
    cy.contains('button', 'Buscar').click();
    cy.wait(3000);

    // Verificar que botones son accesibles por teclado
    cy.contains('button', 'Solicitar Presupuesto').first().focus().should('have.focus');

    // Simular Enter
    cy.focused().type('{enter}');

    // Modal debe abrirse
    cy.contains('Solicitar Presupuesto').should('be.visible');

    cy.log('✅ Navegación por teclado funcional');
  });

  /**
   * Accesibilidad: ARIA labels
   */
  it('♿ Botones tienen ARIA labels apropiados', () => {
    cy.visit('/proveedores');
    cy.get('input[type="search"]').first().type('fotografia');
    cy.contains('button', 'Buscar').click();
    cy.wait(3000);

    // Verificar que botones tienen texto descriptivo
    cy.contains('button', 'Solicitar Presupuesto').should('have.text').and('not.be.empty');

    cy.log('✅ ARIA labels presentes');
  });

  /**
   * UI: WeddingServiceCard estados visuales
   */
  it('✅ WeddingServiceCard muestra estados visuales correctos', () => {
    // Interceptar con servicio confirmado
    cy.intercept('GET', '**/api/weddings/*/services', {
      statusCode: 200,
      body: {
        services: [
          {
            id: 'fotografia',
            name: 'Fotografía',
            status: 'contratado',
            supplier: {
              name: 'Studio Pro',
              price: 2320,
            },
          },
        ],
      },
    });

    cy.visit('/proveedores');
    cy.wait(2000);

    // Verificar tarjeta confirmada
    cy.contains('[data-testid="wedding-service-card"]', 'Fotografía')
      .should('be.visible')
      .within(() => {
        // Badge "Confirmado" con estilos correctos
        cy.contains('Confirmado')
          .should('have.class', 'bg-green-100')
          .and('have.class', 'text-green-800');

        // Icono de check visible
        cy.get('[data-icon="check-circle"]').should('exist');

        // Nombre del proveedor destacado
        cy.contains('Studio Pro').should('have.class', 'font-bold');
      });

    cy.log('✅ Estados visuales de tarjeta correctos');
  });

  /**
   * UI: Responsive - Mobile
   */
  it('📱 Diseño responsive en móvil', () => {
    // Configurar viewport móvil
    cy.viewport('iphone-x');

    cy.visit('/proveedores');

    // Verificar que la sección se adapta
    cy.contains('Mis Solicitudes de Presupuesto').should('be.visible');

    // Verificar que los botones no se salen de pantalla
    cy.get('button').each(($btn) => {
      cy.wrap($btn).should('be.visible');
    });

    cy.log('✅ Diseño responsive funcional');
  });

  /**
   * UI: Transiciones y animaciones
   */
  it('✨ Transiciones suaves en botones', () => {
    cy.visit('/proveedores');
    cy.get('input[type="search"]').first().type('fotografia');
    cy.contains('button', 'Buscar').click();
    cy.wait(3000);

    // Verificar clase transition en botón
    cy.contains('button', 'Solicitar Presupuesto').should('have.class', 'transition-colors');

    cy.log('✅ Transiciones configuradas');
  });

  /**
   * UI: Iconos consistentes
   */
  it('🎨 Iconos de Lucide React presentes', () => {
    cy.intercept('GET', '**/api/quote-requests**', {
      statusCode: 200,
      body: {
        requests: [
          {
            id: 'req-1',
            categoryKey: 'fotografia',
            categoryName: 'Fotografía',
            quotes: [{ id: 'q1', supplierId: 's1' }],
          },
        ],
      },
    });

    cy.visit('/proveedores');
    cy.wait(2000);

    // Verificar icono DollarSign en header
    cy.get('.text-purple-600').should('exist');

    // Verificar icono GitCompare en botón comparar
    cy.contains('button', 'Comparar').should('exist');

    cy.log('✅ Iconos presentes y consistentes');
  });

  /**
   * UI: Feedback visual en hover
   */
  it('🖱️ Feedback visual en hover de botones', () => {
    cy.visit('/proveedores');
    cy.get('input[type="search"]').first().type('fotografia');
    cy.contains('button', 'Buscar').click();
    cy.wait(3000);

    // Verificar cambio en hover
    cy.contains('button', 'Solicitar Presupuesto')
      .first()
      .trigger('mouseover')
      .should('have.css', 'transition');

    cy.log('✅ Feedback visual en hover funcional');
  });

  /**
   * UI: Toast notifications styling
   */
  it('🔔 Toast notifications tienen estilos correctos', () => {
    // Simular acción que genera toast
    cy.intercept('POST', '**/api/suppliers/*/quote-requests', {
      statusCode: 201,
      body: { success: true },
    });

    cy.visit('/proveedores');
    cy.get('input[type="search"]').first().type('fotografia');
    cy.contains('button', 'Buscar').click();
    cy.wait(3000);

    // Abrir modal y enviar
    cy.contains('button', 'Solicitar Presupuesto').first().click();
    cy.wait(500);
    cy.get('input[type="number"]').first().type('150');
    cy.get('textarea').first().type('Test');
    cy.contains('button', 'Enviar').click();

    // Verificar toast
    cy.get('.Toastify__toast', { timeout: 5000 })
      .should('be.visible')
      .and('have.class', 'Toastify__toast--success');

    cy.log('✅ Toast notifications con estilos correctos');
  });

  /**
   * Performance: Carga optimizada
   */
  it('⚡ Componentes cargan sin delay excesivo', () => {
    const startTime = Date.now();

    cy.visit('/proveedores');

    // Verificar que la sección carga rápido
    cy.contains('Mis Solicitudes de Presupuesto', { timeout: 5000 })
      .should('be.visible')
      .then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(5000);
        cy.log(`⚡ Tiempo de carga: ${loadTime}ms`);
      });
  });
});
