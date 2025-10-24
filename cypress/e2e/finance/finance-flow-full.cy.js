/// <reference types="cypress" />

/**
 * E2E integral del Flujo 6 (Finanzas).
 * Cubre:
 *  - Configuración de categorías de presupuesto y silenciamiento de alertas.
 *  - Registro de transacciones manuales y desde sugerencias de email.
 *  - Validación de alertas, CTA bancaria y resumen financiero.
 *  - Configuración de aportaciones y verificación del resumen esperado.
 *  - Navegación por pestañas y análisis (gráficas).
 *
 * Se trabaja en modo "offline" (sin boda activa) para evitar dependencias externas.
 * Las APIs de email insights se stubbean con intercepts.
 */

const SUGGESTION_MAIL_ID = 'mail-finance-1';

describe('Flujo 6 - Finanzas completo', () => {
  beforeEach(() => {
    cy.window().then((win) => win.localStorage.clear());
    cy.loginToLovenda();
    // Eliminar boda activa para forzar modo local/offline
    cy.window().then((win) => {
      win.localStorage.removeItem('maloveapp_active_wedding');
      win.localStorage.removeItem('maloveapp_active_wedding');
    });

    // Stub de bandeja de entrada y análisis de pagos desde email
    cy.intercept('GET', '**/api/mail/page**', {
      statusCode: 200,
      body: {
        items: [
          {
            id: SUGGESTION_MAIL_ID,
            subject: 'Factura Catering Deluxe',
            date: '2025-05-15T10:00:00Z',
            from: 'facturacion@cateringdeluxe.test',
            to: 'usuario.test@maloveapp.com',
          },
        ],
      },
    }).as('mailPage');

    cy.intercept('GET', `**/api/email-insights/${SUGGESTION_MAIL_ID}**`, {
      statusCode: 200,
      body: {
        payments: [
          {
            amount: '1.200,00 €',
            currency: 'EUR',
            direction: 'outgoing',
            method: 'transfer',
          },
        ],
      },
    }).as('mailInsight');

    cy.intercept('POST', '**/api/email-insights/reanalyze/**', {
      statusCode: 200,
      body: { payments: [] },
    }).as('mailReanalyze');
  });

  it('configura presupuesto, registra transacciones, aporta ingresos y verifica análisis', () => {
    cy.visit('/finance');

    // Tabs principales visibles
    cy.contains('button', 'Transacciones').should('exist');
    cy.contains('button', 'Presupuesto').should('exist');
    cy.contains('button', 'Aportaciones').should('exist');
    cy.contains('button', 'Análisis').should('exist');

    // -------------------------------------------
    // Presupuesto: crear categorías base
    // -------------------------------------------
    cy.contains('button', 'Presupuesto').click();

    const createCategory = (name, amount) => {
      cy.contains('button', 'Nueva categoría', { matchCase: false }).click();
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[type="text"]').clear().type(name);
        cy.get('input[type="number"]').clear().type(String(amount));
        cy.contains('button', 'Crear Categoría', { matchCase: false }).click();
      });
      cy.contains('h4', name, { timeout: 8000 }).should('exist');
    };

    createCategory('Catering', 1000);
    createCategory('Flores', 500);

    // -------------------------------------------
    // Transacciones: sugerencias desde email
    // -------------------------------------------
    cy.contains('button', 'Transacciones').click();
    cy.wait('@mailPage');
    cy.wait('@mailInsight');

    // CTA de banca debe mostrarse por defecto
    cy.contains('Conecta tu banco para importar movimientos').should('be.visible');
    cy.contains('a', 'Conectar banco').should('have.attr', 'href', '/finance/bank-connect');

    // Registrar transacción desde sugerencia AI
    cy.contains('div', 'Sugerencias de pago desde emails').should('be.visible');
    cy.contains('button', 'Registrar').click();

    cy.get('[role="dialog"]').within(() => {
      // Confirmar categoría y datos clave
      cy.contains('label', 'Categoria', { matchCase: false })
        .parent()
        .find('select')
        .select('Catering');

      cy.contains('label', 'Fecha limite', { matchCase: false })
        .parent()
        .find('input[type="date"]')
        .clear()
        .type('2024-12-10');

      cy.contains('button', 'Crear Transacción', { matchCase: false }).click();
    });

    // Debe aparecer en la lista de transacciones desde email
    cy.contains('Transacciones registradas desde emails')
      .parent()
      .within(() => {
        cy.contains('Factura Catering Deluxe').should('exist');
        cy.contains('1.200,00').should('exist');
      });

    // -------------------------------------------
    // Transacciones: crear ingreso manual
    // -------------------------------------------
    cy.contains('button', 'Nueva Transacción', { matchCase: false }).click();
    cy.get('[role="dialog"]').within(() => {
      cy.get('input[type="radio"][value="income"]').check({ force: true });

      cy.contains('label', 'Concepto', { matchCase: false })
        .parent()
        .find('input')
        .clear()
        .type('Aportación familia');

      cy.contains('label', 'Proveedor', { matchCase: false })
        .parent()
        .find('input')
        .clear()
        .type('Familia Test');

      cy.contains('label', 'Monto', { matchCase: false })
        .parent()
        .find('input[type="number"]')
        .clear()
        .type('2000');

      cy.contains('label', 'Categoria', { matchCase: false })
        .parent()
        .find('select')
        .select('Aportacion familiar');

      cy.contains('label', 'Estado', { matchCase: false })
        .parent()
        .find('select')
        .select('Recibido');

      cy.contains('button', 'Crear Transacción', { matchCase: false }).click();
    });

    // -------------------------------------------
    // Aportaciones: configurar y guardar
    // -------------------------------------------
    cy.contains('button', 'Aportaciones').click();

    const fillNumber = (labelMatcher, value) => {
      cy.contains('label', labelMatcher)
        .parent()
        .find('input[type="number"]')
        .first()
        .clear()
        .type(String(value));
    };

    fillNumber(/Persona A \(€\)/i, 1000);
    fillNumber(/Persona B \(€\)/i, 500);
    fillNumber(/Persona A \(€\/mes\)/i, 200);
    fillNumber(/Persona B \(€\/mes\)/i, 150);
    fillNumber(/Total extras/i, 300);
    fillNumber(/Regalo estimado por invitado/i, 50);
    fillNumber(/Número de invitados/i, 80);

    cy.contains('button', 'Guardar Cambios').click();
    cy.contains('Tienes cambios sin guardar').should('not.exist');

    // Resumen debe reflejar total esperado
    cy.contains('Total Esperado')
      .parent()
      .should('contain', '6.150,00');

    // -------------------------------------------
    // Resumen: verificar alertas y métricas
    // -------------------------------------------
    cy.contains('button', 'Resumen').click();

    cy.contains('Alertas de Presupuesto')
      .parent()
      .within(() => {
        cy.contains('Catering').should('exist');
        cy.contains('120').should('exist'); // 120% usado
      });

    cy.contains('Ingresos Esperados')
      .closest('div')
      .should('contain', '6.150,00');

    // -------------------------------------------
    // Silenciar alertas para la categoría de Catering
    // -------------------------------------------
    cy.contains('button', 'Presupuesto').click();
    cy.contains('h4', 'Catering')
      .closest('div.p-6')
      .within(() => {
        cy.contains('label', 'Silenciar alertas', { matchCase: false })
          .find('input[type="checkbox"]')
          .check({ force: true });
      });

    cy.contains('button', 'Resumen').click();
    cy.contains('Alertas de Presupuesto').should('not.exist');

    // -------------------------------------------
    // Análisis: gráficas visibles y sin fallbacks
    // -------------------------------------------
    cy.contains('button', 'Análisis').click();
    cy.contains('Análisis Financiero', { timeout: 10000 }).should('be.visible');
    cy.get('svg.recharts-surface', { timeout: 10000 }).its('length').should('be.greaterThan', 0);
    cy.contains('No hay datos suficientes').should('not.exist');
  });
});
