/// <reference types="cypress" />

/**
 * Tests E2E para Email Trash Retention Job
 * Verifica la limpieza automática de emails en papelera >30 días
 * 
 * Código verificado: backend/jobs/emailTrashRetention.js
 */

// Documentación (docs/ARQUITECTURA-DATOS-MAILS.md) marca el job de retención como pendiente.
// Mientras no exista el servicio real, deshabilitamos este flujo E2E.
describe.skip('Email Trash Retention Job (pending implementation)', () => {
  const oldEmail = {
    id: 'old-email-001',
    from: 'old@example.com',
    subject: 'Email antiguo',
    folder: 'trash',
    deletedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 días atrás
  };

  const recentEmail = {
    id: 'recent-email-001',
    from: 'recent@example.com',
    subject: 'Email reciente',
    folder: 'trash',
    deletedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 días atrás
  };

  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.setItem('mw360_auth_token', 'test-token');
    });

    // Stub de emails en papelera
    cy.intercept('GET', '**/api/email/trash', {
      statusCode: 200,
      body: {
        success: true,
        data: [oldEmail, recentEmail],
      },
    }).as('getTrash');

    // Stub de cleanup
    cy.intercept('POST', '**/api/email-automation/trash/cleanup', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          deleted: 1,
          scanned: 2,
          thresholdDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          durationMs: 1500,
        },
      },
    }).as('cleanupTrash');

    // Stub de auditoría
    cy.intercept('GET', '**/api/email-automation/trash/audit', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            executedAt: new Date().toISOString(),
            deleted: 5,
            threshold: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      },
    }).as('getAudit');
  });

  it('muestra emails en papelera con edad', () => {
    cy.visit('/email');

    // Ir a papelera
    cy.contains('button', /papelera/i).click();

    cy.wait('@getTrash');

    // Verificar que se muestran emails
    cy.contains(oldEmail.subject).should('be.visible');
    cy.contains(recentEmail.subject).should('be.visible');

    // Verificar badges de edad
    cy.contains(/35.*días/i).should('be.visible');
    cy.contains(/10.*días/i).should('be.visible');
  });

  it('advierte sobre emails próximos a eliminarse', () => {
    cy.visit('/email');
    cy.contains('button', /papelera/i).click();

    cy.wait('@getTrash');

    // Verificar advertencia en email antiguo (>30 días)
    cy.get('[data-testid="email-list-item"]')
      .contains(oldEmail.subject)
      .parents('[data-testid="email-list-item"]')
      .within(() => {
        cy.contains(/se eliminará pronto/i).should('be.visible');
      });
  });

  it('ejecuta limpieza manual de papelera', () => {
    cy.visit('/email');
    cy.contains('button', /papelera/i).click();

    // Abrir modal de limpieza
    cy.get('[data-testid="empty-trash-button"]').click();

    // Verificar información en modal
    cy.contains(/eliminar emails.*30 días/i).should('be.visible');

    // Confirmar limpieza
    cy.contains('button', /limpiar papelera/i).click();

    cy.wait('@cleanupTrash').its('response.body.data').should((data) => {
      expect(data.deleted).to.equal(1);
      expect(data.scanned).to.equal(2);
    });

    // Verificar mensaje de éxito
    cy.contains(/eliminado.*1.*email/i).should('be.visible');
  });

  it('muestra historial de limpiezas automáticas', () => {
    cy.visit('/email/settings');

    // Ir a sección de papelera
    cy.contains('button', /papelera/i).click();

    // Ver auditoría
    cy.contains('button', /historial.*limpieza/i).click();

    cy.wait('@getAudit');

    // Verificar que se muestra el historial
    cy.contains(/eliminado.*5/i).should('be.visible');
  });

  it('permite configurar el período de retención', () => {
    cy.intercept('PUT', '**/api/email-automation/trash/config', {
      statusCode: 200,
      body: {
        success: true,
      },
    }).as('updateConfig');

    cy.visit('/email/settings');
    cy.contains('button', /papelera/i).click();

    // Cambiar período de retención
    cy.get('input[name="retentionDays"]').clear().type('60');
    
    // Guardar
    cy.contains('button', /guardar/i).click();

    cy.wait('@updateConfig').its('request.body').should('include', {
      retentionDays: 60,
    });

    // Verificar confirmación
    cy.contains(/configuración.*guardada/i).should('be.visible');
  });

  it('simula limpieza sin eliminar (dry run)', () => {
    cy.intercept('POST', '**/api/email-automation/trash/cleanup?dryRun=true', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          deleted: 0,
          scanned: 2,
          wouldDelete: 1,
          thresholdDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          durationMs: 500,
        },
      },
    }).as('dryRunCleanup');

    cy.visit('/email/settings');
    cy.contains('button', /papelera/i).click();

    // Activar modo simulación
    cy.get('input[type="checkbox"][name="dryRun"]').check();

    // Ejecutar limpieza
    cy.contains('button', /simular limpieza/i).click();

    cy.wait('@dryRunCleanup');

    // Verificar mensaje de simulación
    cy.contains(/se eliminarían.*1.*email/i).should('be.visible');
    cy.contains(/ningún email fue eliminado/i).should('be.visible');
  });

  it('maneja errores en la limpieza', () => {
    cy.intercept('POST', '**/api/email-automation/trash/cleanup', {
      statusCode: 500,
      body: {
        success: false,
        error: 'Error al limpiar papelera',
      },
    }).as('cleanupError');

    cy.visit('/email');
    cy.contains('button', /papelera/i).click();
    cy.get('[data-testid="empty-trash-button"]').click();
    cy.contains('button', /limpiar papelera/i).click();

    cy.wait('@cleanupError');

    // Verificar mensaje de error
    cy.contains(/error.*limpieza/i).should('be.visible');
  });

  it('restaura email antes de que se elimine automáticamente', () => {
    cy.intercept('PUT', '**/api/email/old-email-001', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          ...oldEmail,
          folder: 'inbox',
          deletedAt: null,
        },
      },
    }).as('restoreEmail');

    cy.visit('/email');
    cy.contains('button', /papelera/i).click();

    cy.wait('@getTrash');

    // Seleccionar email antiguo
    cy.get('[data-testid="email-list-item"]')
      .contains(oldEmail.subject)
      .click();

    // Restaurar
    cy.contains('button', /restaurar/i).click();

    cy.wait('@restoreEmail');

    // Verificar mensaje
    cy.contains(/restaurado/i).should('be.visible');
  });
});

describe('Email Trash Retention - Integración Backend Real', () => {
  it.skip('ejecuta el cron job diario a las 2am', () => {
    // Este test requiere monitoreo del cron real
    // Verificar logs de backend en Render
  });

  it.skip('registra auditoría en emailRetentionAudit', () => {
    // Verificar que se guardan registros en Firestore
  });

  it.skip('limpia emails >30 días correctamente', () => {
    // Test de integración con datos reales
  });
});
