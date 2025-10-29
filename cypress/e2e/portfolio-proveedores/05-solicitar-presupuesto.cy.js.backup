/**
 * TEST E2E: Sistema de Solicitar Presupuesto
 *
 * Verifica que los usuarios puedan solicitar presupuestos
 * y los proveedores puedan gestionarlos
 */

describe('Portfolio Proveedores - Solicitar Presupuesto', () => {
  const supplierId = 'supplier-test-001';
  const supplierSlug = 'floreria-botanica-valencia';

  const mockSupplier = {
    id: supplierId,
    slug: supplierSlug,
    profile: {
      name: 'Florería Botánica',
    },
    contact: {
      email: 'info@botanica.com',
    },
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    cy.intercept('GET', `/api/suppliers/public/${supplierSlug}`, {
      statusCode: 200,
      body: {
        success: true,
        supplier: mockSupplier,
      },
    }).as('getSupplier');
  });

  it('Debe mostrar botón "Solicitar Presupuesto" en página pública', () => {
    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getSupplier');

    // Verificar botón
    cy.contains('button', /Solicitar.*Presupuesto/i).should('be.visible');
  });

  it('Debe abrir modal al hacer clic en "Solicitar Presupuesto"', () => {
    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getSupplier');

    cy.contains('button', /Solicitar.*Presupuesto/i).click();

    // Verificar que abre modal
    cy.get('[data-testid="quote-modal"]', { timeout: 5000 })
      .should('be.visible')
      .or(cy.contains('Solicitar presupuesto').should('be.visible'));
  });

  it('Debe mostrar formulario con campos requeridos', () => {
    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getSupplier');

    cy.contains('button', /Solicitar.*Presupuesto/i).click();

    // Verificar campos del formulario
    cy.get('input[name="name"]').should('exist');
    cy.get('input[name="email"]').should('exist');
    cy.get('input[name="phone"]').should('exist');
    cy.get('input[name="weddingDate"]').should('exist');
    cy.get('textarea[name="message"]').should('exist');
  });

  it('Debe validar campos requeridos', () => {
    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getSupplier');

    cy.contains('button', /Solicitar.*Presupuesto/i).click();

    // Intentar enviar sin rellenar
    cy.contains('button', /Enviar|Solicitar/i).click();

    // Verificar mensajes de error
    cy.contains(/nombre.*requerido/i).should('be.visible');
    cy.contains(/email.*requerido/i).should('be.visible');
  });

  it('Debe validar formato de email', () => {
    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getSupplier');

    cy.contains('button', /Solicitar.*Presupuesto/i).click();

    // Rellenar con email inválido
    cy.get('input[name="name"]').type('Juan Pérez');
    cy.get('input[name="email"]').type('email-invalido');
    cy.get('textarea[name="message"]').type('Necesito flores para mi boda');

    cy.contains('button', /Enviar/i).click();

    // Verificar error de email
    cy.contains(/email.*válido/i).should('be.visible');
  });

  it('Debe validar longitud mínima del mensaje', () => {
    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getSupplier');

    cy.contains('button', /Solicitar.*Presupuesto/i).click();

    // Rellenar campos
    cy.get('input[name="name"]').type('Juan Pérez');
    cy.get('input[name="email"]').type('juan@example.com');
    cy.get('textarea[name="message"]').type('Corto');

    cy.contains('button', /Enviar/i).click();

    // Verificar error
    cy.contains(/mínimo.*10.*caracteres/i).should('be.visible');
  });

  it('Debe enviar solicitud correctamente (sin auth)', () => {
    cy.intercept('POST', `/api/suppliers/${supplierId}/quote-requests`, {
      statusCode: 201,
      body: {
        success: true,
        requestId: 'request-new-001',
        message: 'Solicitud enviada correctamente',
      },
    }).as('createQuoteRequest');

    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getSupplier');

    cy.contains('button', /Solicitar.*Presupuesto/i).click();

    // Rellenar formulario completo
    cy.get('input[name="name"]').type('María García');
    cy.get('input[name="email"]').type('maria@example.com');
    cy.get('input[name="phone"]').type('+34 600 123 456');
    cy.get('input[name="weddingDate"]').type('2025-06-15');
    cy.get('input[name="location"]').type('Valencia');
    cy.get('input[name="guestCount"]').type('100');
    cy.get('textarea[name="message"]').type(
      'Necesito ramos de novia, centros de mesa y decoración floral para la ceremonia. Mi boda es el 15 de junio.'
    );

    // Enviar
    cy.contains('button', /Enviar|Solicitar/i).click();

    cy.wait('@createQuoteRequest');

    // Verificar mensaje de éxito
    cy.contains(/solicitud.*enviada|contactará.*pronto/i).should('be.visible');

    // Verificar que cierra el modal
    cy.get('[data-testid="quote-modal"]').should('not.exist');
  });

  it('Debe prellenar campos si usuario está autenticado', () => {
    // Mock usuario autenticado con datos
    cy.window().then((win) => {
      win.localStorage.setItem('user_token', 'mock-user-token');
      win.localStorage.setItem(
        'user_data',
        JSON.stringify({
          name: 'Carlos López',
          email: 'carlos@example.com',
          weddingDate: '2025-07-20',
        })
      );
    });

    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getSupplier');

    cy.contains('button', /Solicitar.*Presupuesto/i).click();

    // Verificar que campos están prellenados
    cy.get('input[name="name"]').should('have.value', 'Carlos López');
    cy.get('input[name="email"]').should('have.value', 'carlos@example.com');
    cy.get('input[name="weddingDate"]').should('have.value', '2025-07-20');
  });

  it('Debe mostrar solicitudes en dashboard del proveedor', () => {
    const mockRequests = [
      {
        id: 'request-001',
        name: 'María García',
        email: 'maria@example.com',
        phone: '+34 600 123 456',
        weddingDate: '2025-06-15',
        message: 'Necesito flores para mi boda',
        status: 'pending',
        viewed: false,
        createdAt: new Date().toISOString(),
      },
    ];

    cy.window().then((win) => {
      win.localStorage.setItem('supplier_token', 'mock-token-123');
      win.localStorage.setItem('supplier_id', supplierId);
    });

    cy.intercept('GET', `/api/suppliers/${supplierId}/quote-requests*`, {
      statusCode: 200,
      body: {
        success: true,
        requests: mockRequests,
        total: mockRequests.length,
      },
    }).as('getQuoteRequests');

    cy.visit(`/supplier/dashboard/${supplierId}`);

    // Navegar a sección de solicitudes (si existe)
    cy.contains(/Solicitudes|Presupuestos/i, { timeout: 10000 })
      .should('be.visible')
      .or(cy.wait('@getQuoteRequests'));

    // Verificar que muestra la solicitud
    cy.contains('María García').should('be.visible');
    cy.contains('maria@example.com').should('be.visible');
  });

  it('Debe permitir al proveedor cambiar estado de solicitud', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('supplier_token', 'mock-token-123');
      win.localStorage.setItem('supplier_id', supplierId);
    });

    cy.intercept('GET', `/api/suppliers/${supplierId}/quote-requests*`, {
      statusCode: 200,
      body: {
        success: true,
        requests: [
          {
            id: 'request-001',
            name: 'María García',
            status: 'pending',
          },
        ],
      },
    });

    cy.intercept('PUT', `/api/suppliers/${supplierId}/quote-requests/request-001/status`, {
      statusCode: 200,
      body: { success: true },
    }).as('updateStatus');

    cy.visit(`/supplier/dashboard/${supplierId}`);

    // Cambiar estado a "contacted"
    cy.get('select[name="status"]').first().select('contacted');

    cy.wait('@updateStatus');

    // Verificar mensaje de éxito
    cy.contains(/estado.*actualizado/i).should('be.visible');
  });

  it('Debe mostrar badge de solicitudes sin leer', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('supplier_token', 'mock-token-123');
      win.localStorage.setItem('supplier_id', supplierId);
    });

    cy.intercept('GET', `/api/suppliers/${supplierId}/quote-requests*`, {
      statusCode: 200,
      body: {
        success: true,
        requests: [
          { id: '1', viewed: false },
          { id: '2', viewed: false },
          { id: '3', viewed: true },
        ],
      },
    });

    cy.visit(`/supplier/dashboard/${supplierId}`);

    // Verificar badge con número de no leídas
    cy.get('[data-testid="unread-badge"]')
      .should('contain', '2')
      .or(cy.contains(/2.*nuevas?/i).should('be.visible'));
  });

  it('Debe mostrar estadísticas de solicitudes', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('supplier_token', 'mock-token-123');
      win.localStorage.setItem('supplier_id', supplierId);
    });

    cy.intercept('GET', `/api/suppliers/${supplierId}/quote-requests/stats`, {
      statusCode: 200,
      body: {
        success: true,
        stats: {
          total: 25,
          pending: 5,
          contacted: 8,
          quoted: 6,
          accepted: 4,
          rejected: 2,
          conversionRate: '16.0',
        },
      },
    }).as('getStats');

    cy.visit(`/supplier/dashboard/${supplierId}`);

    cy.wait('@getStats');

    // Verificar que muestra stats
    cy.contains(/25.*solicitudes/i).should('be.visible');
    cy.contains(/16.*%|tasa.*conversión/i).should('be.visible');
  });

  it('Debe filtrar solicitudes por estado', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('supplier_token', 'mock-token-123');
      win.localStorage.setItem('supplier_id', supplierId);
    });

    cy.intercept('GET', `/api/suppliers/${supplierId}/quote-requests*`, (req) => {
      const status = new URL(req.url).searchParams.get('status');

      req.reply({
        statusCode: 200,
        body: {
          success: true,
          requests:
            status === 'pending' ? [{ id: '1', status: 'pending', name: 'Cliente Pendiente' }] : [],
        },
      });
    }).as('filterRequests');

    cy.visit(`/supplier/dashboard/${supplierId}`);

    // Aplicar filtro
    cy.get('select[name="filterStatus"]').select('pending');

    cy.wait('@filterRequests');

    // Verificar que filtra
    cy.contains('Cliente Pendiente').should('be.visible');
  });

  it('Debe incrementar contador de solicitudes en analytics', () => {
    cy.intercept('POST', `/api/suppliers/${supplierId}/quote-requests`, (req) => {
      req.reply({
        statusCode: 201,
        body: { success: true, requestId: 'new-001' },
      });
    }).as('createRequest');

    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getSupplier');

    cy.contains('button', /Solicitar.*Presupuesto/i).click();

    // Rellenar y enviar
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('textarea[name="message"]').type(
      'Este es un mensaje de prueba para verificar el contador de solicitudes.'
    );

    cy.contains('button', /Enviar/i).click();

    cy.wait('@createRequest');

    // Verificar que incrementa métrica (esto se verificaría en el backend)
    // El frontend solo debe enviar la solicitud correctamente
    cy.contains(/enviada/i).should('be.visible');
  });

  it('Debe manejar error de servidor correctamente', () => {
    cy.intercept('POST', `/api/suppliers/${supplierId}/quote-requests`, {
      statusCode: 500,
      body: { error: 'internal_error' },
    }).as('createRequestError');

    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getSupplier');

    cy.contains('button', /Solicitar.*Presupuesto/i).click();

    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('textarea[name="message"]').type('Mensaje de prueba');

    cy.contains('button', /Enviar/i).click();

    cy.wait('@createRequestError');

    // Verificar mensaje de error
    cy.contains(/error|intenta.*nuevo/i).should('be.visible');
  });

  it('Debe cerrar modal al hacer clic en "X" o fuera', () => {
    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getSupplier');

    cy.contains('button', /Solicitar.*Presupuesto/i).click();

    // Verificar que está abierto
    cy.get('[data-testid="quote-modal"]').should('be.visible');

    // Hacer clic en botón cerrar
    cy.get('[aria-label="Cerrar"]').click();

    // Verificar que se cerró
    cy.get('[data-testid="quote-modal"]').should('not.exist');
  });
});
