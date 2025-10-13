/// <reference types="Cypress" />

/**
 * Batería de pruebas E2E para el área de administración.
 * Las pruebas se dejan en estado `skip` hasta que la interfaz correspondiente exista
 * con los data-testid definidos en la especificación (flujo 0).
 */

describe('Admin - Login', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('permite iniciar sesión con credenciales válidas y MFA opcional', () => {
    cy.visit('/admin/login');
    cy.get('[data-testid="admin-login-email"]').type('admin@lovenda.com');
    cy.get('[data-testid="admin-login-password"]').type('AdminPass123!');
    cy.get('[data-testid="admin-login-submit"]').click();
    cy.get('[data-testid="admin-mfa-input"]').type('123456');
    cy.get('[data-testid="admin-mfa-submit"]').click();
    cy.url().should('include', '/admin/dashboard');
    cy.get('[data-testid="admin-dashboard"]').should('exist');
  });

  it('muestra error cuando las credenciales son incorrectas', () => {
    cy.visit('/admin/login');
    cy.get('[data-testid="admin-login-email"]').type('admin@lovenda.com');
    cy.get('[data-testid="admin-login-password"]').type('bad-password');
    cy.get('[data-testid="admin-login-submit"]').click();
    cy.get('[data-testid="admin-login-error"]').should('contain', 'Email o contraseña no válidos');
  });

  it('bloquea el acceso a usuarios sin rol admin', () => {
    cy.visit('/admin/login');
    cy.get('[data-testid="admin-login-email"]').type('owner@lovenda.com');
    cy.get('[data-testid="admin-login-password"]').type('OwnerPass123!');
    cy.get('[data-testid="admin-login-submit"]').click();
    cy.get('[data-testid="admin-login-error"]').should('contain', 'Tu cuenta no dispone de acceso administrador');
  });

  it('limita los intentos de login y muestra el mensaje de bloqueo', () => {
    cy.visit('/admin/login');
    for (let i = 0; i < 5; i += 1) {
      cy.get('[data-testid="admin-login-email"]').clear().type('admin@lovenda.com');
      cy.get('[data-testid="admin-login-password"]').clear().type(`WrongPass${i}!`);
      cy.get('[data-testid="admin-login-submit"]').click();
    }
    cy.get('[data-testid="admin-login-error"]').should('contain', 'Se han superado los intentos permitidos');
  });
});

describe('Admin - Dashboard', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/admin/dashboard');
  });

  it('muestra los KPIs principales con sus variaciones', () => {
    cy.get('[data-testid="admin-kpi-active-users"]').should('exist');
    cy.get('[data-testid="admin-kpi-new-weddings"]').should('exist');
    cy.get('[data-testid="admin-kpi-conversion"]').should('exist');
    cy.get('[data-testid="admin-kpi-estimated-revenue"]').should('exist');
  });

  it('presenta el estado de los servicios externos', () => {
    cy.get('[data-testid="service-health-firebase"]').should('exist');
    cy.get('[data-testid="service-health-mailgun"]').should('exist');
    cy.get('[data-testid="service-health-whatsapp"]').should('exist');
    cy.get('[data-testid="service-health-openai"]').should('exist');
  });

  it('permite marcar alertas como resueltas', () => {
    cy.get('[data-testid="admin-alert-item"]').first().as('alert');
    cy.get('@alert').find('[data-testid="admin-alert-resolve"]').click();
    cy.get('[data-testid="admin-alert-resolve-modal"]').should('be.visible');
    cy.get('[data-testid="admin-alert-resolve-notes"]').type('Incidente monitorizado, servicio restablecido.');
    cy.get('[data-testid="admin-alert-resolve-confirm"]').click();
    cy.get('@alert').should('have.attr', 'data-status', 'resolved');
  });

  it('gestiona la lista de tareas administrativas', () => {
    cy.get('[data-testid="admin-task-add"]').click();
    cy.get('[data-testid="admin-task-modal"]').should('be.visible');
    cy.get('[data-testid="admin-task-title"]').type('Revisar reportes semanales');
    cy.get('[data-testid="admin-task-submit"]').click();
    cy.get('[data-testid="admin-task-item"]').contains('Revisar reportes semanales').should('exist');
  });
});

describe('Admin - Métricas y reportes', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/admin/metrics');
  });

  it('permite seleccionar rangos de fechas y exportar datos', () => {
    cy.get('[data-testid="metrics-range-selector"]').select('30');
    cy.get('[data-testid="metrics-export-csv"]').click();
    cy.get('[data-testid="metrics-export-json"]').click();
  });

  it('muestra el funnel de conversión con valores absolutos y porcentajes', () => {
    cy.get('[data-testid="metrics-funnel"]').within(() => {
      cy.contains('Visitantes').should('exist');
      cy.contains('Registrados').should('exist');
      cy.contains('Bodas activas').should('exist');
    });
  });

  it('genera reportes bajo demanda', () => {
    cy.visit('/admin/reports');
    cy.get('[data-testid="admin-report-generate"]').click();
    cy.get('[data-testid="admin-report-template"]').select('Métricas globales');
    cy.get('[data-testid="admin-report-recipients"]').type('direccion@lovenda.com');
    cy.get('[data-testid="admin-report-submit"]').click();
  });
});

describe('Admin - Portfolio y usuarios', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('filtra el portfolio por estado y fecha', () => {
    cy.visit('/admin/portfolio');
    cy.get('[data-testid="portfolio-filter-status"]').select('active');
    cy.get('[data-testid="portfolio-filter-date-from"]').type('2025-01-01');
    cy.get('[data-testid="portfolio-filter-date-to"]').type('2025-12-31');
    cy.get('[data-testid="portfolio-filter-apply"]').click();
    cy.get('[data-testid="portfolio-table"]').should('contain', 'active');
  });

  it('abre el detalle de una boda y permite generar reporte PDF', () => {
    cy.visit('/admin/portfolio');
    cy.get('[data-testid="portfolio-row"]').first().within(() => {
      cy.get('[data-testid="portfolio-view-detail"]').click();
    });
    cy.get('[data-testid="portfolio-detail-modal"]').should('be.visible');
    cy.get('[data-testid="portfolio-export-pdf"]').click();
  });

  it('gestion de usuarios: suspender y reactivar', () => {
    cy.visit('/admin/users');
    cy.get('[data-testid="admin-user-row"]').first().within(() => {
      cy.get('[data-testid="admin-user-suspend"]').click();
    });
    cy.get('[data-testid="admin-user-suspend-modal"]').should('be.visible');
    cy.get('[data-testid="admin-user-suspend-reason"]').type('Incumplimiento de términos');
    cy.get('[data-testid="admin-user-suspend-confirm"]').click();
    cy.get('[data-testid="admin-user-row"]').first().should('have.attr', 'data-status', 'disabled');
  });
});

describe('Admin - Integraciones y configuración', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('muestra incidentes de integraciones y permite reintentar conexión', () => {
    cy.visit('/admin/integrations');
    cy.get('[data-testid="integration-card-mailgun"]').should('exist');
    cy.get('[data-testid="integration-incidents-table"]').should('exist');
    cy.get('[data-testid="integration-retry-button"]').first().click();
    cy.get('[data-testid="integration-retry-confirm"]').click();
  });

  it('gestiona feature flags y rotación de secretos', () => {
    cy.visit('/admin/settings');
    cy.get('[data-testid="feature-flag-toggle"]').first().click();
    cy.get('[data-testid="feature-flag-confirm"]').click();
    cy.get('[data-testid="secret-rotate-button"]').first().click();
    cy.get('[data-testid="secret-rotate-modal"]').within(() => {
      cy.get('[data-testid="secret-rotate-step-next"]').click();
      cy.get('[data-testid="secret-rotate-step-next"]').click();
      cy.get('[data-testid="secret-rotate-confirm"]').click();
    });
  });

  it('permite editar plantillas globales de email', () => {
    cy.visit('/admin/settings');
    cy.get('[data-testid="template-editor-select"]').select('email-welcome');
    cy.get('[data-testid="template-editor-content"]').clear().type('Bienvenida Lovenda {nombre}');
    cy.get('[data-testid="template-editor-preview"]').should('contain', 'Bienvenida Lovenda');
    cy.get('[data-testid="template-editor-save"]').click();
  });
});

describe('Admin - Alertas, broadcast y auditoría', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('gestiona alertas críticas desde la sección específica', () => {
    cy.visit('/admin/alerts');
    cy.get('[data-testid="admin-alert-item"]').first().click();
    cy.get('[data-testid="admin-alert-detail"]').should('be.visible');
    cy.get('[data-testid="admin-alert-resolve"]').click();
    cy.get('[data-testid="admin-alert-resolve-notes"]').type('Revisado por soporte, incidente cerrado.');
    cy.get('[data-testid="admin-alert-resolve-confirm"]').click();
  });

  it('crea y programa un broadcast', () => {
    cy.visit('/admin/broadcast');
    cy.get('[data-testid="broadcast-tab-email"]').click();
    cy.get('[data-testid="broadcast-subject"]').type('Mantenimiento programado');
    cy.get('[data-testid="broadcast-content"]').type('El sistema estará en mantenimiento el próximo sábado a las 10:00.');
    cy.get('[data-testid="broadcast-segment"]').select('Todos');
    cy.get('[data-testid="broadcast-schedule-toggle"]').click();
    cy.get('[data-testid="broadcast-schedule-date"]').type('2025-10-15');
    cy.get('[data-testid="broadcast-schedule-time"]').type('10:00');
    cy.get('[data-testid="broadcast-confirm"]').click();
  });

  it('filtra y exporta el histórico de auditoría', () => {
    cy.visit('/admin/audit');
    cy.get('[data-testid="audit-filter-action"]').select('FLAG_UPDATE');
    cy.get('[data-testid="audit-filter-apply"]').click();
    cy.get('[data-testid="audit-table"]').should('contain', 'FLAG_UPDATE');
    cy.get('[data-testid="audit-export-csv"]').click();
    cy.get('[data-testid="audit-export-json"]').click();
  });
});

describe('Admin - Support y sesión', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('visualiza métricas de tickets y NPS', () => {
    cy.visit('/admin/support');
    cy.get('[data-testid="support-kpi-tickets-open"]').should('exist');
    cy.get('[data-testid="support-nps-chart"]').should('exist');
    cy.get('[data-testid="support-ticket-row"]').first().click();
    cy.get('[data-testid="support-ticket-detail"]').should('be.visible');
  });

  it('finaliza la sesión correctamente', () => {
    cy.visit('/admin/dashboard');
    cy.get('[data-testid="admin-logout-button"]').click();
    cy.url().should('include', '/admin/login');
    cy.get('[data-testid="admin-login-email"]').should('exist');
  });
});
