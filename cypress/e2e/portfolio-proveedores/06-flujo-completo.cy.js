/**
 * TEST E2E: Flujo Completo Portfolio de Proveedores
 *
 * Test de integración que verifica el flujo completo:
 * 1. Proveedor sube fotos
 * 2. Usuario visita página pública
 * 3. Usuario solicita presupuesto
 * 4. Usuario deja reseña
 * 5. Proveedor gestiona solicitud y responde reseña
 */

describe('Portfolio Proveedores - Flujo Completo E2E', () => {
  const supplierId = 'supplier-test-001';
  const supplierSlug = 'floreria-botanica-valencia';
  const userId = 'user-test-001';

  before(() => {
    cy.log('🧪 Iniciando flujo completo de Portfolio de Proveedores');
  });

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('FLUJO COMPLETO: Desde subir foto hasta recibir reseña', () => {
    // ===========================================
    // PASO 1: PROVEEDOR SUBE FOTO AL PORTFOLIO
    // ===========================================
    cy.log('📸 PASO 1: Proveedor sube foto al portfolio');

    cy.window().then((win) => {
      win.localStorage.setItem('supplier_token', 'mock-token-123');
      win.localStorage.setItem('supplier_id', supplierId);
    });

    cy.intercept('GET', `/api/supplier-dashboard/portfolio`, {
      statusCode: 200,
      body: {
        success: true,
        photos: [],
        stats: { total: 0, cover: 0, featured: 0 },
      },
    }).as('getPortfolio');

    cy.intercept('POST', `/api/supplier-dashboard/portfolio`, {
      statusCode: 201,
      body: {
        success: true,
        photoId: 'photo-new-001',
        photo: {
          id: 'photo-new-001',
          title: 'Ramo de novia elegante',
          category: 'bodas',
          original: 'https://via.placeholder.com/800x600',
        },
      },
    }).as('uploadPhoto');

    cy.visit(`/supplier/dashboard/${supplierId}/portfolio`);
    cy.wait('@getPortfolio');

    // Abrir modal de subida
    cy.contains('button', /Añadir Foto/i, { timeout: 10000 }).click();

    // Subir imagen
    cy.fixture('test-image.jpg', 'base64').then((fileContent) => {
      const blob = Cypress.Blob.base64StringToBlob(fileContent, 'image/jpeg');
      const file = new File([blob], 'ramo-elegante.jpg', { type: 'image/jpeg' });

      cy.get('input[type="file"]').then((input) => {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input[0].files = dataTransfer.files;
        input[0].dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    // Rellenar datos de la foto
    cy.get('input[name="title"]').type('Ramo de novia elegante');
    cy.get('textarea[name="description"]').type('Ramo clásico con rosas blancas y follaje verde');
    cy.get('select[name="category"]').select('bodas');
    cy.get('input[type="checkbox"][name="featured"]').check();

    // Subir foto
    cy.contains('button', /Subir|Guardar/i).click();
    cy.wait('@uploadPhoto', { timeout: 15000 });

    cy.contains(/foto.*subida|éxito/i).should('be.visible');

    // ===========================================
    // PASO 2: USUARIO VISITA PÁGINA PÚBLICA
    // ===========================================
    cy.log('👤 PASO 2: Usuario visita página pública del proveedor');

    cy.clearLocalStorage(); // Quitar auth de proveedor

    cy.intercept('GET', `/api/suppliers/public/${supplierSlug}`, {
      statusCode: 200,
      body: {
        success: true,
        supplier: {
          id: supplierId,
          slug: supplierSlug,
          profile: {
            name: 'Florería Botánica',
            description: 'Expertos en arreglos florales',
          },
          category: 'flores',
          location: {
            city: 'Valencia',
          },
          contact: {
            email: 'info@botanica.com',
            phone: '+34 600 123 456',
          },
          rating: 4.8,
          reviewCount: 15,
        },
        portfolio: [
          {
            id: 'photo-new-001',
            title: 'Ramo de novia elegante',
            category: 'bodas',
            original: 'https://via.placeholder.com/800x600',
            featured: true,
          },
        ],
      },
    }).as('getSupplierPublic');

    cy.intercept('GET', `/api/suppliers/${supplierId}/reviews*`, {
      statusCode: 200,
      body: {
        success: true,
        reviews: [],
        stats: {
          total: 0,
          averageRating: 0,
        },
      },
    }).as('getReviews');

    cy.visit(`/proveedor/${supplierSlug}`);
    cy.wait('@getSupplierPublic');

    // Verificar que muestra el nombre y portfolio
    cy.contains('Florería Botánica').should('be.visible');
    cy.contains('Ramo de novia elegante').should('be.visible');
    cy.contains('Destacada').should('be.visible'); // Badge de featured

    // ===========================================
    // PASO 3: USUARIO SOLICITA PRESUPUESTO
    // ===========================================
    cy.log('💰 PASO 3: Usuario solicita presupuesto');

    cy.intercept('POST', `/api/suppliers/${supplierId}/quote-requests`, {
      statusCode: 201,
      body: {
        success: true,
        requestId: 'request-001',
        message: 'Solicitud enviada correctamente',
      },
    }).as('createQuoteRequest');

    cy.contains('button', /Solicitar.*Presupuesto/i).click();

    // Rellenar formulario
    cy.get('input[name="name"]').type('Ana Martínez');
    cy.get('input[name="email"]').type('ana@example.com');
    cy.get('input[name="phone"]').type('+34 600 987 654');
    cy.get('input[name="weddingDate"]').type('2025-08-20');
    cy.get('input[name="location"]').type('Valencia');
    cy.get('input[name="guestCount"]').type('150');
    cy.get('textarea[name="message"]').type(
      'Hola, me encanta vuestro trabajo. Necesito ramos para damas de honor y decoración floral completa para una boda el 20 de agosto.'
    );

    cy.contains('button', /Enviar.*Solicitud|Solicitar/i).click();
    cy.wait('@createQuoteRequest');

    cy.contains(/solicitud.*enviada|contactará/i).should('be.visible');

    // ===========================================
    // PASO 4: USUARIO DEJA RESEÑA
    // ===========================================
    cy.log('⭐ PASO 4: Usuario deja reseña');

    cy.window().then((win) => {
      win.localStorage.setItem('user_token', 'mock-user-token');
      win.localStorage.setItem('user_id', userId);
    });

    cy.intercept('POST', `/api/suppliers/${supplierId}/reviews`, {
      statusCode: 201,
      body: {
        success: true,
        reviewId: 'review-001',
      },
    }).as('createReview');

    // Scroll a sección de reseñas
    cy.contains('Reseñas').scrollIntoView();

    cy.contains('button', /Escribir.*Reseña/i).click();

    // Seleccionar 5 estrellas
    cy.get('[data-testid="star-rating"]').within(() => {
      cy.get('button').eq(4).click();
    });

    // Escribir reseña
    cy.get('textarea[name="comment"]').type(
      '¡Excelente servicio! Las flores fueron perfectas y llegaron justo a tiempo. El equipo fue muy profesional y atento. Totalmente recomendado para bodas.'
    );

    cy.contains('button', /Publicar|Enviar.*Reseña/i).click();
    cy.wait('@createReview');

    cy.contains(/reseña.*enviada|pendiente.*aprobación/i).should('be.visible');

    // ===========================================
    // PASO 5: PROVEEDOR GESTIONA TODO
    // ===========================================
    cy.log('👨‍💼 PASO 5: Proveedor gestiona solicitud y responde reseña');

    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.localStorage.setItem('supplier_token', 'mock-token-123');
      win.localStorage.setItem('supplier_id', supplierId);
    });

    // A) Ver solicitud de presupuesto
    cy.intercept('GET', `/api/suppliers/${supplierId}/quote-requests*`, {
      statusCode: 200,
      body: {
        success: true,
        requests: [
          {
            id: 'request-001',
            name: 'Ana Martínez',
            email: 'ana@example.com',
            phone: '+34 600 987 654',
            weddingDate: '2025-08-20',
            message: 'Hola, me encanta vuestro trabajo...',
            status: 'pending',
            viewed: false,
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
      },
    }).as('getQuoteRequests');

    cy.intercept('PUT', `/api/suppliers/${supplierId}/quote-requests/request-001/status`, {
      statusCode: 200,
      body: { success: true },
    }).as('updateQuoteStatus');

    cy.visit(`/supplier/dashboard/${supplierId}`);

    // Verificar que ve la solicitud
    cy.contains('Ana Martínez', { timeout: 10000 }).should('be.visible');

    // Cambiar estado a "contacted"
    cy.get('select[name="status"]').first().select('contacted');
    cy.wait('@updateQuoteStatus');

    // B) Responder a reseña
    cy.intercept('GET', `/api/suppliers/${supplierId}/reviews*`, {
      statusCode: 200,
      body: {
        success: true,
        reviews: [
          {
            id: 'review-001',
            userId: userId,
            userName: 'Ana Martínez',
            rating: 5,
            comment: '¡Excelente servicio! Las flores fueron perfectas...',
            status: 'approved',
            createdAt: { seconds: Date.now() / 1000 },
            supplierResponse: null,
          },
        ],
      },
    }).as('getSupplierReviews');

    cy.intercept('PUT', `/api/suppliers/${supplierId}/reviews/review-001/respond`, {
      statusCode: 200,
      body: { success: true },
    }).as('respondReview');

    // Navegar a reseñas (si hay página específica)
    cy.visit(`/supplier/dashboard/${supplierId}`);

    // Responder reseña
    cy.contains('button', /Responder/i)
      .first()
      .click();
    cy.get('textarea[name="response"]').type(
      '¡Muchísimas gracias Ana! Fue un placer trabajar en tu boda. Nos alegra que todo saliera perfecto.'
    );
    cy.contains('button', /Enviar.*Respuesta|Publicar/i).click();
    cy.wait('@respondReview');

    cy.contains(/respuesta.*publicada/i).should('be.visible');

    // ===========================================
    // VERIFICACIÓN FINAL
    // ===========================================
    cy.log('✅ VERIFICACIÓN FINAL: Todo el flujo completado');

    cy.clearLocalStorage();

    // Volver a página pública y verificar que todo está actualizado
    cy.intercept('GET', `/api/suppliers/public/${supplierSlug}`, {
      statusCode: 200,
      body: {
        success: true,
        supplier: {
          id: supplierId,
          slug: supplierSlug,
          profile: { name: 'Florería Botánica' },
          rating: 5.0, // Actualizado con la nueva reseña
          reviewCount: 1,
        },
        portfolio: [
          {
            id: 'photo-new-001',
            title: 'Ramo de novia elegante',
            featured: true,
          },
        ],
      },
    });

    cy.intercept('GET', `/api/suppliers/${supplierId}/reviews*`, {
      statusCode: 200,
      body: {
        success: true,
        reviews: [
          {
            id: 'review-001',
            userName: 'Ana Martínez',
            rating: 5,
            comment: '¡Excelente servicio!...',
            status: 'approved',
            supplierResponse: '¡Muchísimas gracias Ana!...',
          },
        ],
        stats: {
          total: 1,
          averageRating: 5.0,
        },
      },
    });

    cy.visit(`/proveedor/${supplierSlug}`);

    // Verificaciones finales
    cy.contains('Florería Botánica').should('be.visible');
    cy.contains('Ramo de novia elegante').should('be.visible');
    cy.contains('5.0').should('be.visible'); // Rating actualizado
    cy.contains('Ana Martínez').should('be.visible'); // Reseña visible
    cy.contains('¡Muchísimas gracias Ana!').should('be.visible'); // Respuesta visible

    cy.log('🎉 ¡Flujo completo verificado exitosamente!');
  });
});
