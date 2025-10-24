/// <reference types="cypress" />

describe('Invitados — Gestión básica', () => {
  const baseGuests = [
    {
      id: 'guest-ana',
      name: 'Ana Confirmada',
      email: 'ana@example.com',
      phone: '+34911111111',
      table: 'Mesa 1',
      companion: 1,
      status: 'confirmed',
      response: 'Sí',
      dietaryRestrictions: 'Sin gluten',
      notes: 'Llega con antelación',
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
  ];

  const interceptCommonApis = () => {
    cy.intercept('POST', '**/api/whatsapp/send', {
      statusCode: 200,
      body: { success: true },
    }).as('apiWhatsSend');

    cy.intercept('POST', '**/api/whatsapp/send-batch', {
      statusCode: 200,
      body: { success: true, ok: 2, fail: 0 },
    }).as('apiWhatsBatch');

    cy.intercept('POST', '**/api/whatsapp/schedule', {
      statusCode: 200,
      body: { success: true },
    }).as('apiWhatsSchedule');

    cy.intercept('POST', '**/api/guests/**/rsvp-link', {
      statusCode: 200,
      body: { link: 'https://lovenda.test/rsvp/mock' },
    }).as('apiRsvpLink');
  };

  const visitGuestsPage = (guests = baseGuests) => {
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

  const setupWindowStubs = (opts = {}) => {
    cy.window().then((win) => {
      const promptStub = cy
        .stub(win, 'prompt')
        .callsFake((message) => {
          if (opts.promptMap && message in opts.promptMap) {
            return opts.promptMap[message];
          }
          if (/Asignar nueva mesa/.test(message)) return 'Mesa VIP';
          if (/Fecha y hora/.test(message)) return '2025-09-10 10:00';
          return '';
        })
        .as('prompt');

      if (opts.overridePrompt) {
        promptStub.callsFake(opts.overridePrompt);
      }

      cy.stub(win, 'alert')
        .as('alert')
        .callsFake(() => {});
      cy.stub(win, 'confirm')
        .as('confirm')
        .callsFake((message) => {
          if (opts.confirmMap && message in opts.confirmMap) {
            return opts.confirmMap[message];
          }
          return true;
        });
      cy.stub(win, 'open').as('windowOpen');
    });
  };

  beforeEach(() => {
    interceptCommonApis();
  });

  it('crea, edita, filtra y cambia el estado de invitados individuales', () => {
    visitGuestsPage();
    setupWindowStubs();

    cy.contains('button', /(añadir|guests\.addGuest)/i).click();
    cy.get('input[placeholder="Nombre completo del invitado"]').type('Carlos Prueba');
    cy.get('input[placeholder="correo@ejemplo.com"]').type('c.prueba@example.com');
    cy.get('input[placeholder="+34 123 456 789"]').type('+34933333333');
    cy.get('input[placeholder="Dirección completa (opcional)"]').type('Calle Jardín 10');
    cy.get('input[placeholder="0"]').clear().type('1');
    cy.get('input[placeholder="Número o nombre de mesa"]').type('Mesa Jardín');
    cy.get('textarea[placeholder="Alergias, intolerancias o preferencias alimentarias..."]').type(
      'Sin frutos secos'
    );
    cy.contains('button', /(guardar|app\.save)/i).click();

    cy.contains('td, div', 'Carlos Prueba', { timeout: 10000 }).should('be.visible');

    cy.contains('tr', 'Carlos Prueba')
      .within(() => {
        cy.get('button[title="Editar invitado"]').click();
      })
      .should('exist');

    cy.get('input[placeholder="correo@ejemplo.com"]').clear().type('carlos.actualizado@example.com');
    cy.get('input[placeholder="Número o nombre de mesa"]').clear().type('Mesa Principal');
    cy.contains('button', /(guardar|app\.save)/i).click();

    cy.contains('tr', 'Carlos Prueba').should('contain', 'Mesa Principal');

    cy.contains('tr', 'Carlos Prueba').within(() => {
      cy.contains('button', /pendiente/i).click();
      cy.contains('button', /confirmado/i).should('be.visible').click();
      cy.contains('button', /rechazad/i).should('be.visible');
    });

    cy.get('input[placeholder="Buscar por nombre, email o teléfono..."]').type('Ana');
    cy.contains('td', 'Ana Confirmada').should('be.visible');
    cy.contains('td', 'Carlos Prueba').should('not.exist');
    cy.get('input[placeholder="Buscar por nombre, email o teléfono..."]').clear();

    cy.get('select').first().select(/Confirmado|guests\.status\.confirmed/i);
    cy.contains('td', 'Ana Confirmada').should('be.visible');
    cy.contains('td', 'Bruno Pendiente').should('not.exist');
    cy.get('select').first().select('Todos los estados');

    cy.get('input[placeholder="Filtrar por mesa..."]').type('Mesa 2');
    cy.contains('td', 'Bruno Pendiente').should('be.visible');
    cy.contains('td', 'Ana Confirmada').should('not.exist');
    cy.get('input[placeholder="Filtrar por mesa..."]').clear();
  });

  it('ejecuta acciones masivas, programa envíos y elimina invitados', () => {
    const extendedGuests = [
      ...baseGuests,
      {
        id: 'guest-carla',
        name: 'Carla RSVP',
        email: 'carla@example.com',
        phone: '+34944444444',
        table: 'Mesa 3',
        companion: 2,
        status: 'pending',
        response: 'Pendiente',
        createdAt: '2025-08-03T10:00:00.000Z',
      },
    ];

    visitGuestsPage(extendedGuests);
    setupWindowStubs();

    ['Ana Confirmada', 'Bruno Pendiente', 'Carla RSVP'].forEach((name) => {
      cy.contains('tr', name)
        .find('input[type="checkbox"]')
        .check({ force: true });
    });

    cy.contains('button', /(Reasignar mesa|guests\.reassignTable)/i).click();
    cy.get('@prompt').should('have.been.calledWithMatch', /Asignar nueva mesa/);
    cy.get('@alert').should('have.been.calledWithMatch', /Mesa asignada/);
    cy.contains('tr', 'Ana Confirmada').within(() => {
      cy.contains('td', 'Mesa VIP').should('exist');
    });
    cy.contains('tr', 'Carla RSVP').within(() => {
      cy.contains('td', 'Mesa VIP').should('exist');
    });

    cy.contains('button', 'Programar seleccionados').click();
    cy.get('@prompt').should('have.been.calledWithMatch', /Fecha y hora/);
    cy.wait('@apiRsvpLink');
    cy.wait('@apiRsvpLink');
    cy.wait('@apiRsvpLink');
    cy.wait('@apiWhatsSchedule');

    cy.contains('button', 'Enviar seleccionados (API)').click();
    cy.wait('@apiWhatsBatch');
    cy.get('@alert').should('have.been.calledWithMatch', /Envío completado/);

    cy.contains('tr', 'Bruno Pendiente')
      .find('button[title="Eliminar invitado"]')
      .click();
    cy.get('@confirm').should('have.been.called');

    cy.contains('tr', 'Bruno Pendiente').should('not.exist');
  });
});
