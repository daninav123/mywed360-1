/**
 * Interceptores globales para tests E2E
 * Configuran mocks para todas las APIs externas
 */

export function setupGlobalInterceptors() {
  // Firebase Auth
  cy.intercept('POST', '**identitytoolkit.googleapis.com/**', {
    statusCode: 200,
    body: {
      idToken: 'mock-firebase-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: '3600',
      localId: 'mock-user-id',
      email: 'test@maloveapp.com',
    },
  });

  // Firestore
  cy.intercept('POST', '**firestore.googleapis.com/**', {
    statusCode: 200,
    body: {
      documents: [],
      nextPageToken: null,
    },
  });

  cy.intercept('GET', '**firestore.googleapis.com/**', {
    statusCode: 200,
    body: {
      documents: [],
    },
  });

  // Backend API
  cy.intercept('GET', '**/api/**', (req) => {
    // Log para debug
    console.log('API intercepted:', req.url);
    
    // Respuestas por defecto según endpoint
    if (req.url.includes('/api/weddings')) {
      req.reply({
        statusCode: 200,
        body: {
          weddings: [{
            id: 'test-wedding-1',
            name: 'Boda Test',
            date: new Date().toISOString(),
            venue: 'Lugar Test',
            guestCount: 100,
          }],
        },
      });
    } else if (req.url.includes('/api/guests')) {
      req.reply({
        statusCode: 200,
        body: {
          guests: [],
          total: 0,
        },
      });
    } else if (req.url.includes('/api/user')) {
      req.reply({
        statusCode: 200,
        body: {
          id: 'cypress-user',
          email: 'test@maloveapp.com',
          role: 'owner',
        },
      });
    } else {
      // Respuesta genérica
      req.reply({
        statusCode: 200,
        body: { success: true },
      });
    }
  });

  cy.intercept('POST', '**/api/**', {
    statusCode: 200,
    body: { success: true },
  });

  cy.intercept('PUT', '**/api/**', {
    statusCode: 200,
    body: { success: true },
  });

  cy.intercept('DELETE', '**/api/**', {
    statusCode: 200,
    body: { success: true },
  });

  // Imágenes y assets externos
  cy.intercept('GET', '**unsplash.com/**', {
    statusCode: 200,
    headers: {
      'content-type': 'image/jpeg',
    },
    body: '',
  });

  cy.intercept('GET', '**cloudinary.com/**', {
    statusCode: 200,
    headers: {
      'content-type': 'image/jpeg',
    },
    body: '',
  });

  // Google Maps
  cy.intercept('GET', '**maps.googleapis.com/**', {
    statusCode: 200,
    body: { results: [] },
  });

  // Stripe
  cy.intercept('POST', '**stripe.com/**', {
    statusCode: 200,
    body: {
      id: 'mock-payment-intent',
      status: 'succeeded',
    },
  });

  // Removed aliases for POST, PUT and DELETE intercepts
}

/**
 * Setup interceptors específicos para admin
 */
export function setupAdminInterceptors() {
  cy.intercept('POST', '**/api/admin/login', {
    statusCode: 200,
    body: {
      success: true,
      token: 'mock-admin-token',
      user: {
        id: 'admin-1',
        email: 'admin@maloveapp.com',
        role: 'admin',
      },
    },
  });

  cy.intercept('GET', '**/api/admin/metrics', {
    statusCode: 200,
    body: {
      users: 1000,
      weddings: 500,
      revenue: 50000,
      growth: 15,
    },
  });
}

/**
 * Setup interceptors para blog
 */
export function setupBlogInterceptors() {
  cy.intercept('GET', '**/api/blog/posts', {
    statusCode: 200,
    body: {
      posts: [
        {
          id: '1',
          title: 'Post de Prueba',
          content: 'Contenido del post',
          author: 'Autor Test',
          date: new Date().toISOString(),
        },
      ],
      total: 1,
    },
  });

  cy.intercept('GET', '**/api/wedding-news*', {
    statusCode: 200,
    body: {
      articles: [
        {
          id: '1',
          title: 'Noticia de Prueba',
          excerpt: 'Resumen de la noticia',
          date: new Date().toISOString(),
        },
      ],
    },
  });
}

/**
 * Setup interceptors para seating
 */
export function setupSeatingInterceptors() {
  cy.intercept('GET', '**/api/seating/**', {
    statusCode: 200,
    body: {
      tables: [],
      guests: [],
      layout: {
        type: 'rectangular',
        dimensions: { width: 10, height: 10 },
      },
    },
  });

  cy.intercept('POST', '**/api/seating/save', {
    statusCode: 200,
    body: { success: true, id: 'seating-1' },
  });
}

/**
 * Setup interceptors para emails
 */
export function setupEmailInterceptors() {
  cy.intercept('GET', '**/api/emails/**', {
    statusCode: 200,
    body: {
      emails: [],
      total: 0,
    },
  });

  cy.intercept('POST', '**/api/emails/send', {
    statusCode: 200,
    body: {
      success: true,
      messageId: 'mock-message-id',
    },
  });
}

/**
 * Setup todos los interceptors necesarios para tests
 */
export function setupAllInterceptors() {
  setupGlobalInterceptors();
  setupAdminInterceptors();
  setupBlogInterceptors();
  setupSeatingInterceptors();
  setupEmailInterceptors();
}
