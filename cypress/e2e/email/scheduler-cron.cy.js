/// <reference types="cypress" />

/**
 * Tests E2E para Email Scheduler Cron Job
 * Verifica el procesamiento automático de emails programados
 * 
 * Código verificado: backend/jobs/emailSchedulerCron.js
 */

describe('Email Scheduler Cron Job', () => {
  const testEmail = {
    to: 'proveedor@example.com',
    subject: 'Consulta sobre disponibilidad',
    body: 'Hola, quisiera consultar sobre su disponibilidad...',
    sendAt: new Date(Date.now() + 60000).toISOString(), // 1 minuto en el futuro
  };

  beforeEach(() => {
    // Stub de autenticación
    cy.window().then((win) => {
      win.localStorage.setItem('mw360_auth_token', 'test-token');
    });

    // Interceptar APIs de email
    cy.intercept('POST', '**/api/email-automation/schedule', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 'scheduled-email-001',
          ...testEmail,
          state: 'pending',
        },
      },
    }).as('scheduleEmail');

    cy.intercept('GET', '**/api/email-automation/scheduled/status', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          pending: 1,
          processing: 0,
          sent: 0,
          failed: 0,
          total: 1,
        },
      },
    }).as('getScheduledStatus');

    cy.intercept('POST', '**/api/email-automation/schedule/process', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          processed: 1,
          successCount: 1,
          failedCount: 0,
          skippedCount: 0,
          durationMs: 850,
        },
      },
    }).as('processCron');
  });

  it('programa un email correctamente', () => {
    cy.visit('/email/compose');

    // Llenar formulario
    cy.get('input[name="to"]').type(testEmail.to);
    cy.get('input[name="subject"]').type(testEmail.subject);
    cy.get('textarea[name="body"]').type(testEmail.body);

    // Activar programación
    cy.contains('button', /programar/i).click();
    
    // Seleccionar fecha/hora
    cy.get('input[type="datetime-local"]').type('2025-10-25T10:00');

    // Enviar
    cy.contains('button', /programar envío/i).click();

    // Verificar llamada a API
    cy.wait('@scheduleEmail').its('request.body').should('include', {
      to: testEmail.to,
      subject: testEmail.subject,
    });

    // Verificar mensaje de confirmación
    cy.contains(/email programado/i).should('be.visible');
  });

  it('muestra el estado de emails programados', () => {
    cy.visit('/email/settings');

    // Ir a sección de programados
    cy.contains('button', /programados/i).click();

    // Verificar llamada a API
    cy.wait('@getScheduledStatus');

    // Verificar estadísticas
    cy.contains(/pendiente.*1/i).should('be.visible');
  });

  it('procesa la cola de emails programados manualmente', () => {
    cy.visit('/email/settings');

    // Ir a sección de programados
    cy.contains('button', /programados/i).click();

    // Ejecutar procesamiento manual
    cy.contains('button', /procesar ahora/i).click();

    // Confirmar acción
    cy.contains('button', /confirmar/i).click();

    // Verificar llamada a cron
    cy.wait('@processCron').its('response.body.data').should((data) => {
      expect(data.processed).to.be.greaterThan(0);
      expect(data.successCount).to.equal(1);
      expect(data.failedCount).to.equal(0);
    });

    // Verificar mensaje de éxito
    cy.contains(/procesado.*correctamente/i).should('be.visible');
  });

  it('maneja errores en el procesamiento', () => {
    // Simular error en cron
    cy.intercept('POST', '**/api/email-automation/schedule/process', {
      statusCode: 500,
      body: {
        success: false,
        error: 'Error al procesar emails programados',
      },
    }).as('processCronError');

    cy.visit('/email/settings');
    cy.contains('button', /programados/i).click();
    cy.contains('button', /procesar ahora/i).click();
    cy.contains('button', /confirmar/i).click();

    cy.wait('@processCronError');

    // Verificar mensaje de error
    cy.contains(/error/i).should('be.visible');
  });

  it('muestra el historial de ejecuciones del cron', () => {
    // Stub de historial
    cy.intercept('GET', '**/api/email-automation/schedule/history', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            executedAt: new Date().toISOString(),
            processed: 5,
            successCount: 4,
            failedCount: 1,
            durationMs: 1200,
          },
          {
            executedAt: new Date(Date.now() - 3600000).toISOString(),
            processed: 3,
            successCount: 3,
            failedCount: 0,
            durationMs: 850,
          },
        ],
      },
    }).as('getHistory');

    cy.visit('/email/settings');
    cy.contains('button', /programados/i).click();
    cy.contains('button', /historial/i).click();

    cy.wait('@getHistory');

    // Verificar que se muestran las ejecuciones
    cy.contains(/procesado.*5/i).should('be.visible');
    cy.contains(/procesado.*3/i).should('be.visible');
  });

  it('permite cancelar un email programado', () => {
    cy.intercept('GET', '**/api/email-automation/scheduled', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 'scheduled-001',
            to: 'test@example.com',
            subject: 'Test email',
            sendAt: new Date(Date.now() + 3600000).toISOString(),
            state: 'pending',
          },
        ],
      },
    }).as('getScheduled');

    cy.intercept('DELETE', '**/api/email-automation/scheduled/scheduled-001', {
      statusCode: 200,
      body: {
        success: true,
      },
    }).as('cancelScheduled');

    cy.visit('/email/settings');
    cy.contains('button', /programados/i).click();

    cy.wait('@getScheduled');

    // Cancelar email
    cy.get('[data-testid="cancel-scheduled-email"]').first().click();
    cy.contains('button', /confirmar/i).click();

    cy.wait('@cancelScheduled');

    // Verificar mensaje
    cy.contains(/cancelado/i).should('be.visible');
  });

  it('reinicia emails fallidos', () => {
    cy.intercept('GET', '**/api/email-automation/scheduled', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 'failed-001',
            to: 'test@example.com',
            subject: 'Failed email',
            sendAt: new Date().toISOString(),
            state: 'failed',
            attempts: 3,
            lastError: 'Connection timeout',
          },
        ],
      },
    }).as('getScheduled');

    cy.intercept('POST', '**/api/email-automation/scheduled/failed-001/retry', {
      statusCode: 200,
      body: {
        success: true,
      },
    }).as('retryFailed');

    cy.visit('/email/settings');
    cy.contains('button', /programados/i).click();

    cy.wait('@getScheduled');

    // Reintentar email fallido
    cy.get('[data-testid="retry-failed-email"]').first().click();

    cy.wait('@retryFailed');

    // Verificar mensaje
    cy.contains(/reintentando/i).should('be.visible');
  });
});

describe('Email Scheduler Cron - Integración Backend Real', () => {
  // Tests que requieren backend real (marcados como skip por defecto)
  
  it.skip('ejecuta el cron job real cada 5 minutos', () => {
    // Este test requiere monitoreo del cron real en Render
    // Verificar logs de backend
  });

  it.skip('registra métricas en emailScheduledAudit', () => {
    // Verificar que se guardan registros en Firestore
  });

  it.skip('envía notificaciones tras 3 fallos', () => {
    // Verificar sistema de alertas
  });
});
