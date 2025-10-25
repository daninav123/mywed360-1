/// <reference types='cypress' />

describe('Email Stats metrics cards', () => {
  beforeEach(() => {
    cy.loginToLovenda('metrics-user@maloveapp.com');

    cy.window().then((win) => {
      const profileRaw = win.localStorage.getItem('MaLoveApp_user_profile');
      const profile = profileRaw ? JSON.parse(profileRaw) : {};
      const userId = profile?.id || profile?.uid || 'cypress-email-metrics';
      const mockStats = {
        lastUpdated: new Date().toISOString(),
        emailCounts: {
          total: 150,
          unread: 12,
        },
        contactAnalysis: {
          totalContacts: 25,
          topContacts: [],
        },
        responseMetrics: {
          responseRate: 0.78,
          formattedAvgResponseTime: '2 horas',
        },
        activityMetrics: {
          today: 8,
          thisWeek: 45,
          dailyGraph: [],
        },
        opens: 320,
        clicks: 45,
      };

      win.localStorage.setItem(maloveapp_email_stats_, JSON.stringify(mockStats));
      win.__EMAIL_STATS_MOCK__ = {
        stats: mockStats,
        daily: [
          { date: '2025-10-10', sent: 5, received: 3, opens: 10, clicks: 4 },
          { date: '2025-10-11', sent: 4, received: 2, opens: 8, clicks: 3 },
        ],
      };
    });

    cy.intercept('GET', '**/firestore.googleapis.com/**', { statusCode: 200, body: {} });
    cy.intercept('POST', '**/firestore.googleapis.com/**', { statusCode: 200, body: {} });

    cy.visit('/email/stats');
  });

  it('renderiza cada tarjeta de métricas con los valores esperados', () => {
    cy.get('[data-testid="email-stats-total"]').within(() => {
      cy.contains('Correos');
      cy.contains('150');
      cy.contains('12 sin leer');
    });

    cy.get('[data-testid="email-stats-contacts"]').within(() => {
      cy.contains('Contactos');
      cy.contains('25');
      cy.contains('Proveedores únicos');
    });

    cy.get('[data-testid="email-stats-response"]').within(() => {
      cy.contains('Tasa de respuesta');
      cy.contains('78%');
      cy.contains('Tiempo medio de respuesta: 2 horas');
    });

    cy.get('[data-testid="email-stats-activity"]').within(() => {
      cy.contains('Actividad');
      cy.contains('8');
      cy.contains('45 esta semana');
    });

    cy.get('[data-testid="email-stats-opens"]').within(() => {
      cy.contains('Aperturas');
      cy.contains('320');
    });

    cy.get('[data-testid="email-stats-clicks"]').within(() => {
      cy.contains('Clics');
      cy.contains('45');
    });
  });
});
