/**
 * TEST E2E: Sistema de Reseñas
 *
 * Verifica que los usuarios puedan dejar reseñas
 * y los proveedores puedan responder
 */

describe('Portfolio Proveedores - Sistema de Reseñas', () => {
  const supplierId = 'supplier-test-001';
  const supplierSlug = 'floreria-botanica-valencia';

  const mockReviews = [
    {
      id: 'review-001',
      userId: 'user-123',
      userName: 'María García',
      rating: 5,
      comment: 'Excelente servicio, las flores fueron preciosas y llegaron a tiempo.',
      status: 'approved',
      createdAt: { seconds: Date.now() / 1000 },
      helpful: 12,
      supplierResponse: 'Muchas gracias por tu comentario, fue un placer trabajar contigo.',
      supplierResponseAt: { seconds: Date.now() / 1000 },
    },
    {
      id: 'review-002',
      userId: 'user-456',
      userName: 'Juan López',
      rating: 4,
      comment: 'Muy buen trabajo, aunque hubo un pequeño retraso en la entrega.',
      status: 'approved',
      createdAt: { seconds: Date.now() / 1000 - 86400 },
      helpful: 5,
      supplierResponse: null,
    },
  ];

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    // Interceptar GET reseñas
    cy.intercept('GET', `/api/suppliers/${supplierId}/reviews*`, {
      statusCode: 200,
      body: {
        success: true,
        reviews: mockReviews,
        stats: {
          total: mockReviews.length,
          averageRating: 4.5,
          ratingDistribution: {
            5: 1,
            4: 1,
            3: 0,
            2: 0,
            1: 0,
          },
        },
      },
    }).as('getReviews');
  });

  it('Debe mostrar las reseñas en la página pública', () => {
    cy.intercept('GET', `/api/suppliers/public/${supplierSlug}`, {
      statusCode: 200,
      body: {
        success: true,
        supplier: {
          id: supplierId,
          slug: supplierSlug,
          profile: { name: 'Florería Botánica' },
        },
      },
    });

    cy.visit(`/proveedor/${supplierSlug}`);

    // Verificar sección de reseñas
    cy.contains('Reseñas', { timeout: 10000 }).should('be.visible');

    // Verificar que muestra el rating promedio
    cy.contains('4.5').should('be.visible');

    // Verificar que muestra número de reseñas
    cy.contains(/\d+ reseñas?/i).should('be.visible');
  });

  it('Debe mostrar estrellas para cada reseña', () => {
    cy.intercept('GET', `/api/suppliers/public/${supplierSlug}`, {
      statusCode: 200,
      body: { success: true, supplier: { id: supplierId, slug: supplierSlug } },
    });

    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getReviews');

    // Verificar estrellas (usando SVG o elementos de Lucide)
    cy.get('[data-testid="review-stars"]')
      .should('have.length.at.least', mockReviews.length)
      .or(cy.get('svg[data-icon="star"]').should('exist'));
  });

  it('Debe permitir escribir una nueva reseña (usuario autenticado)', () => {
    // Mock usuario autenticado
    cy.window().then((win) => {
      win.localStorage.setItem('user_token', 'mock-user-token');
      win.localStorage.setItem('user_id', 'user-789');
    });

    cy.intercept('POST', `/api/suppliers/${supplierId}/reviews`, {
      statusCode: 201,
      body: {
        success: true,
        reviewId: 'review-new-001',
      },
    }).as('createReview');

    cy.intercept('GET', `/api/suppliers/public/${supplierSlug}`, {
      statusCode: 200,
      body: { success: true, supplier: { id: supplierId, slug: supplierSlug } },
    });

    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getReviews');

    // Hacer clic en "Escribir Reseña"
    cy.contains('button', /Escribir.*Reseña|Dejar.*opinión/i).click();

    // Seleccionar rating (5 estrellas)
    cy.get('[data-testid="star-rating"]').within(() => {
      cy.get('button').eq(4).click(); // Quinta estrella
    });

    // Escribir comentario
    cy.get('textarea[name="comment"]').type(
      'Esta es una reseña de prueba. El servicio fue excelente y superó mis expectativas.'
    );

    // Enviar reseña
    cy.contains('button', /Publicar|Enviar/i).click();

    cy.wait('@createReview');

    // Verificar mensaje de éxito
    cy.contains(/reseña.*enviada|pendiente.*aprobación/i).should('be.visible');
  });

  it('Debe validar longitud mínima del comentario', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('user_token', 'mock-user-token');
      win.localStorage.setItem('user_id', 'user-789');
    });

    cy.intercept('GET', `/api/suppliers/public/${supplierSlug}`, {
      statusCode: 200,
      body: { success: true, supplier: { id: supplierId, slug: supplierSlug } },
    });

    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getReviews');

    cy.contains('button', /Escribir.*Reseña/i).click();

    // Seleccionar rating
    cy.get('[data-testid="star-rating"]').within(() => {
      cy.get('button').eq(4).click();
    });

    // Escribir comentario corto
    cy.get('textarea[name="comment"]').type('Corto');

    // Intentar enviar
    cy.contains('button', /Publicar/i).click();

    // Verificar mensaje de error
    cy.contains(/mínimo.*10.*caracteres/i).should('be.visible');
  });

  it('Debe requerir autenticación para escribir reseña', () => {
    cy.intercept('GET', `/api/suppliers/public/${supplierSlug}`, {
      statusCode: 200,
      body: { success: true, supplier: { id: supplierId, slug: supplierSlug } },
    });

    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getReviews');

    // Sin autenticación
    cy.contains('button', /Escribir.*Reseña/i).click();

    // Verificar que pide login
    cy.contains(/inicia.*sesión|regístrate/i, { timeout: 5000 })
      .should('be.visible')
      .or(cy.url().should('include', '/login'));
  });

  it('Debe mostrar respuesta del proveedor', () => {
    cy.intercept('GET', `/api/suppliers/public/${supplierSlug}`, {
      statusCode: 200,
      body: { success: true, supplier: { id: supplierId, slug: supplierSlug } },
    });

    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getReviews');

    // Verificar que la primera reseña tiene respuesta
    cy.contains('Respuesta del proveedor').should('be.visible');
    cy.contains(mockReviews[0].supplierResponse).should('be.visible');
  });

  it('Debe permitir al proveedor responder a una reseña', () => {
    // Mock proveedor autenticado
    cy.window().then((win) => {
      win.localStorage.setItem('supplier_token', 'mock-token-123');
      win.localStorage.setItem('supplier_id', supplierId);
    });

    cy.intercept('PUT', `/api/suppliers/${supplierId}/reviews/review-002/respond`, {
      statusCode: 200,
      body: { success: true },
    }).as('respondReview');

    cy.visit(`/supplier/dashboard/${supplierId}`);

    // Navegar a reseñas (o implementar página específica)
    // Aquí asumimos que hay una sección de reseñas en el dashboard

    // Hacer clic en "Responder"
    cy.contains('button', /Responder/i)
      .first()
      .click();

    // Escribir respuesta
    cy.get('textarea[name="response"]').type(
      'Gracias por tu feedback, hemos mejorado nuestros tiempos de entrega.'
    );

    // Enviar respuesta
    cy.contains('button', /Enviar|Publicar/i).click();

    cy.wait('@respondReview');

    // Verificar mensaje de éxito
    cy.contains(/respuesta.*publicada/i).should('be.visible');
  });

  it('Debe permitir marcar reseña como útil', () => {
    cy.intercept('POST', `/api/suppliers/${supplierId}/reviews/review-001/helpful`, {
      statusCode: 200,
      body: { success: true },
    }).as('markHelpful');

    cy.intercept('GET', `/api/suppliers/public/${supplierSlug}`, {
      statusCode: 200,
      body: { success: true, supplier: { id: supplierId, slug: supplierSlug } },
    });

    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getReviews');

    // Hacer clic en "Útil"
    cy.contains('button', /Útil/i).first().click();

    cy.wait('@markHelpful');

    // Verificar que incrementa el contador
    cy.contains(/13|Útil.*13/).should('be.visible');
  });

  it('Debe permitir reportar reseña inapropiada', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('user_token', 'mock-user-token');
      win.localStorage.setItem('user_id', 'user-789');
    });

    cy.intercept('POST', `/api/suppliers/${supplierId}/reviews/review-001/report`, {
      statusCode: 200,
      body: { success: true },
    }).as('reportReview');

    cy.intercept('GET', `/api/suppliers/public/${supplierSlug}`, {
      statusCode: 200,
      body: { success: true, supplier: { id: supplierId, slug: supplierSlug } },
    });

    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getReviews');

    // Abrir menú o botón reportar
    cy.get('[aria-label*="Reportar"]').first().click();

    // Escribir razón
    cy.get('textarea[name="reason"]').type('Contenido inapropiado y ofensivo.');

    // Enviar reporte
    cy.contains('button', /Reportar|Enviar/i).click();

    cy.wait('@reportReview');

    // Verificar mensaje de éxito
    cy.contains(/reportada|revisada/i).should('be.visible');
  });

  it('Debe mostrar distribución de ratings', () => {
    cy.intercept('GET', `/api/suppliers/public/${supplierSlug}`, {
      statusCode: 200,
      body: { success: true, supplier: { id: supplierId, slug: supplierSlug } },
    });

    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getReviews');

    // Verificar barras de distribución
    cy.get('[data-testid="rating-distribution"]')
      .should('exist')
      .or(cy.contains('5 estrellas').should('be.visible'));
  });

  it('Debe ordenar reseñas por fecha o rating', () => {
    cy.intercept('GET', `/api/suppliers/public/${supplierSlug}`, {
      statusCode: 200,
      body: { success: true, supplier: { id: supplierId, slug: supplierSlug } },
    });

    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getReviews');

    // Verificar selector de orden
    cy.get('select[name="orderBy"]')
      .should('exist')
      .or(cy.contains('button', /Ordenar|Filtrar/i).should('exist'));
  });

  it('Debe prevenir reseñas duplicadas del mismo usuario', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('user_token', 'mock-user-token');
      win.localStorage.setItem('user_id', 'user-123'); // Mismo usuario de review-001
    });

    cy.intercept('POST', `/api/suppliers/${supplierId}/reviews`, {
      statusCode: 409,
      body: {
        error: 'already_reviewed',
        message: 'Ya has dejado una reseña para este proveedor',
      },
    }).as('createDuplicateReview');

    cy.intercept('GET', `/api/suppliers/public/${supplierSlug}`, {
      statusCode: 200,
      body: { success: true, supplier: { id: supplierId, slug: supplierSlug } },
    });

    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getReviews');

    cy.contains('button', /Escribir.*Reseña/i).click();

    cy.get('[data-testid="star-rating"]').within(() => {
      cy.get('button').eq(4).click();
    });

    cy.get('textarea[name="comment"]').type('Esta es una segunda reseña del mismo usuario.');

    cy.contains('button', /Publicar/i).click();

    cy.wait('@createDuplicateReview');

    // Verificar mensaje de error
    cy.contains(/ya.*dejado.*reseña/i).should('be.visible');
  });
});
