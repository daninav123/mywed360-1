/// <reference types="cypress" />

describe('Invitados — Mensajería y plantillas', () => {
  const messagingGuests = [
    {
      id: 'guest-ana',
      name: 'Ana Confirmada',
      email: 'ana@example.com',
      phone: '+34911111111',
      table: 'Mesa 1',
      companion: 1,
      status: 'confirmed',
      response: 'Sí',
      createdAt: '2025-08-01T10:00:00.000Z',
    },
    {
      id: 'guest-bruno',
      name: 'Bruno Pendiente',
      email: 'bruno@example.com',
      phone: '+34922222222',
      table: 'Mesa 2',
      companion: 0,
      status: 'pending',
      response: 'Pendiente',
      createdAt: '2025-08-02T10:00:00.000Z',
    },
    {
      id: 'guest-carla',
      name: 'Carla RSVP',
      email: 'carla@example.com',
      phone: '+34933333333',
      table: 'Mesa 3',
      companion: 2,
      status: 'pending',
      response: 'Pendiente',
      createdAt: '2025-08-03T10:00:00.000Z',
    },
  ];

  const interceptMessagingApis = () => {
    cy.intercept('GET', '**/api/whatsapp/provider-status', {
      statusCode: 200,
      body: { configured: true, provider: 'mock' },
    }).as('whatsProvider');

    cy.intercept('GET', '**/api/whatsapp/health', {
      statusCode: 200,
      body: { ok: true, success: true },
    }).as('whatsHealth');

    cy.intercept('GET', '**/api/whatsapp/metrics**', {
      statusCode: 200,
      body: { success: true, total: 5, rates: { deliveryRate: 0.8, readRate: 0.6 } },
    }).as('whatsMetrics');

    cy.intercept('POST', '**/api/whatsapp/send', {
      statusCode: 200,
      body: { success: true },
    }).as('apiWhatsSend');

    cy.intercept('POST', '**/api/whatsapp/send-batch', {
      statusCode: 200,
      body: { success: true, ok: 3, fail: 0 },
    }).as('apiWhatsBatch');

    cy.intercept('POST', '**/api/print/invitations', {
      statusCode: 200,
      body: { success: true, batchId: 'batch-123' },
    }).as('apiPrintBatch');
  };

  const visitGuestsPage = (guests = messagingGuests) => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear();
        win.localStorage.setItem('maloveapp_w1_guests', JSON.stringify(guests));
        win.localStorage.setItem('maloveapp_active_wedding', 'w1');
        win.localStorage.setItem('i18nextLng', 'es');
        win.__MOCK_WEDDING__ = {
          weddings: [
            {
              id: 'w1',
              name: 'Boda Cypress',
              coupleName: 'Pareja Cypress',
              weddingDate: '2026-05-15',
            },
          ],
          activeWedding: { id: 'w1', name: 'Boda Cypress' },
        };
      },
    });
    cy.loginToLovenda();
    cy.closeDiagnostic();
    cy.window().then((win) => {
      win.history.pushState({}, '', '/invitados');
      win.dispatchEvent(new win.PopStateEvent('popstate'));
    });
    cy.contains('Gestiona tu lista de invitados de forma eficiente', {
      timeout: 20000,
    }).should('be.visible');
  };

  const setupWindowStubs = () => {
    cy.window().then((win) => {
      cy.stub(win, 'alert')
        .as('alert')
        .callsFake(() => {});
      cy.stub(win, 'confirm')
        .as('confirm')
        .callsFake(() => true);
      cy.stub(win, 'open').as('windowOpen');
    });
  };

  beforeEach(() => {
    interceptMessagingApis();
  });

  it('permite enviar Save the Date personalizando la selección', () => {
    visitGuestsPage();
    setupWindowStubs();

    cy.contains('button', 'Enviar SAVE THE DATE').click();
    cy.wait('@whatsProvider');
    cy.wait('@whatsHealth');

    cy.contains('button', 'Aplicar a todos').click();
    cy.get('table textarea').first().should('contain', 'pareja1');

    cy.get('table input[type="checkbox"]').eq(1).uncheck({ force: true });
    cy.contains('button', /^Enviar a/).should('contain', 'Enviar a 2');
    cy.get('table input[type="checkbox"]').eq(1).check({ force: true });

    cy.contains('button', /^Enviar a/).click();
    cy.wait('@apiWhatsSend');
    cy.wait('@apiWhatsSend');
    cy.wait('@apiWhatsSend');

    cy.contains('Enviar SAVE THE DATE').should('be.visible');
  });

  it('gestiona invitaciones formales y pedidos de impresión', () => {
    visitGuestsPage();
    setupWindowStubs();

    cy.contains('button', 'Invitaciones masivas (API)').click();
    cy.get('textarea')
      .first()
      .clear()
      .type('Hola {guestName}, somos {coupleName} y esta es la invitación oficial.');
    cy.get('input[placeholder="https://..."]').type('https://example.com/invitacion.pdf');

    cy.contains('button', 'Enviar por WhatsApp').click();
    cy.wait('@apiWhatsBatch');
    cy.get('@alert').should('have.been.calledWithMatch', /Invitación enviada a/);
    cy.contains('Invitación formal').should('not.exist');

    cy.contains('button', 'Invitaciones masivas (API)').click();
    cy.get('input[placeholder="https://..."]').type('https://example.com/invitacion.pdf');
    cy.contains('button', 'Pedido envío postal').click();
    cy.wait('@apiPrintBatch');
    cy.get('@alert').should('have.been.calledWithMatch', /Pedido de impresión/);
  });

  it('habilita acciones desde el modal individual, lote manual y edición de plantilla', () => {
    visitGuestsPage();
    setupWindowStubs();

    cy.contains('button', 'Editar mensaje (API)').click();
    cy.get('textarea').first().clear().type('Hola {guestName}, te esperamos pronto.');
    cy.contains('button', /(Guardar|app\.save)/i).click();
    cy.get('@confirm').should('have.been.called');
    cy.get('@alert').should('have.been.calledWithMatch', /Plantilla actualizada/);

    cy.get('button[title="Invitar por WhatsApp"]').first().click();
    cy.wait('@whatsProvider');
    cy.wait('@whatsHealth');

    cy.contains('button', 'Enviar a este invitado').click();
    cy.get('@windowOpen').should('have.been.called');

    cy.contains('button', 'Número de la app').click();
    cy.contains('button', 'Ver métricas').click();
    cy.wait('@whatsMetrics');
    cy.contains('Total: 5').should('be.visible');

    cy.contains('button', 'Enviar a este invitado').click();
    cy.wait('@apiWhatsSend');

    cy.contains('button', 'Másivo: pendientes').click();
    cy.wait('@apiWhatsBatch');
    cy.get('@alert').should('have.been.calledWithMatch', /Invitación enviada/);

    cy.contains('button', 'Cerrar').click();
    cy.contains('Enviar por WhatsApp').should('not.exist');

    cy.contains('button', 'Lote manual (API)').click();
    cy.contains('button', /^Enviar a/).should('contain', 'Enviar a 3');

    cy.get('div[role="dialog"] input[type="checkbox"]').eq(1).uncheck({ force: true });
    cy.contains('button', /^Enviar a/).click();
    cy.contains('Selecciona al menos un invitado').should('be.visible');

    cy.get('div[role="dialog"] input[type="checkbox"]').eq(1).check({ force: true });
    cy.contains('button', /^Enviar a/).click();
    cy.get('@alert').should('have.been.calledWithMatch', /Lote creado con/);
    cy.contains('Enviar invitaciones por WhatsApp').should('not.exist');
  });
});
