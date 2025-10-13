/// <reference types="cypress" />

describe('Invitados — Importaciones y resumen RSVP', () => {
  let demoFixture = [];

  before(() => {
    cy.fixture('guests-demo.json').then((data) => {
      demoFixture = data;
    });
  });

  const importBaseGuests = [
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
      phone: '',
      table: '',
      companion: 0,
      status: 'pending',
      response: 'Pendiente',
      createdAt: '2025-08-02T10:00:00.000Z',
    },
  ];

  const summaryGuests = [
    {
      id: 'guest-1',
      name: 'Lucía Confirmada',
      email: 'lucia@example.com',
      phone: '+34960000001',
      table: 'Mesa 5',
      companion: 1,
      status: 'confirmed',
      response: 'Sí',
    },
    {
      id: 'guest-2',
      name: 'Mario Confirmado',
      email: 'mario@example.com',
      phone: '+34960000002',
      table: 'Mesa 6',
      companion: 0,
      status: 'confirmed',
      response: 'Sí',
      dietaryRestrictions: 'Vegano',
    },
    {
      id: 'guest-3',
      name: 'Paula Pendiente',
      email: 'paula@example.com',
      phone: '',
      table: 'Mesa 7',
      companion: 0,
      status: 'pending',
      response: 'Pendiente',
    },
    {
      id: 'guest-4',
      name: 'Diego Rechazado',
      email: 'diego@example.com',
      phone: '+34960000003',
      table: '',
      companion: 0,
      status: 'declined',
      response: 'No',
    },
  ];

  const visitGuestsPage = (guests) => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear();
        win.localStorage.setItem('mywed360_w1_guests', JSON.stringify(guests));
        win.localStorage.setItem('mywed360_active_wedding', 'w1');
        win.localStorage.setItem('i18nextLng', 'es');
        win.__GUESTS_TEST_API__ = {
          reset() {},
          logWhatsApp() {},
          logEmail() {},
          logEvent() {},
          getMessages() {
            return [];
          },
          getEmails() {
            return [];
          },
          getEvents() {
            return [];
          },
          async loadFixture(name) {
            if (name === 'guests-demo.json') {
              return JSON.parse(JSON.stringify(demoFixture));
            }
            return [];
          },
        };
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
      const toast = {
        info: cy.stub().as('toastInfo'),
        success: cy.stub().as('toastSuccess'),
        warning: cy.stub().as('toastWarning'),
        error: cy.stub().as('toastError'),
      };
      win.toast = toast;
      win.history.pushState({}, '', '/invitados');
      win.dispatchEvent(new win.PopStateEvent('popstate'));
    });
    cy.contains('Gestiona tu lista de invitados de forma eficiente', {
      timeout: 20000,
    }).should('be.visible');
    cy.window().then((win) => {
      win.localStorage.setItem('mywed360_w1_guests', JSON.stringify(guests));
      win.dispatchEvent(new Event('mywed360-w1-guests'));
    });
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

  it('importa invitados desde CSV deduplicando por email/teléfono', () => {
    visitGuestsPage(importBaseGuests);
    setupWindowStubs();

    cy.contains('Ana Confirmada', { timeout: 10000 }).should('be.visible');

    cy.get('[data-testid="guest-add-manual"]').click();
    cy.contains('button', 'Desde contactos').click();
    cy.get('input[placeholder="Ej. 5"]').type('VIP');
    cy.get('[data-testid="guest-import-csv"]').click();
    cy.get('input[type="file"]')
      .first()
      .selectFile('cypress/fixtures/guests-import.csv', { force: true });

    cy.contains('button', /^Importar/).click();
    cy.get('@toastSuccess').should('have.been.calledWithMatch', /duplicados omitidos/i);
    cy.contains('Sofía CSV', { timeout: 10000 }).should('exist');
  });

  it('realiza alta masiva validando duplicados y mantiene la lista coherente', () => {
    visitGuestsPage(importBaseGuests);
    setupWindowStubs();

    cy.get('[data-testid="guest-open-bulk"]').click();
    cy.get('table input').eq(0).type('Laura Bulk');
    cy.get('table input').eq(1).type('laura.bulk@example.com');
    cy.get('table input').eq(2).type('+34912345678');
    cy.get('table input').eq(3).type('2');
    cy.get('table input').eq(4).type('Mesa Bulk');

    cy.contains('button', 'Añadir fila').click();
    cy.get('table input').eq(5).type('Ana Duplicada');
    cy.get('table input').eq(6).type('ana@example.com');
    cy.get('table input').eq(7).type('+34911111111');
    cy.get('table input').eq(8).type('0');
    cy.get('table input').eq(9).type('Mesa 1');

    cy.contains('button', /^Guardar$/i).click();
    cy.get('@toastSuccess').should('have.been.calledWithMatch', /invitad[oa]s a.+didos/i);
    cy.contains('Laura Bulk', { timeout: 10000 }).should('exist');
    cy.contains('td', 'Ana Confirmada').should('have.length', 1);
  });

  it('presenta el resumen de RSVP con métricas y soporta impresión', () => {
    visitGuestsPage(summaryGuests);
    setupWindowStubs();

    cy.contains('button', 'Resumen RSVP').click();
    cy.contains('Resumen RSVP').should('be.visible');
    cy.contains('Lucía Confirmada', { timeout: 10000 }).should('be.visible');

    cy.contains('div', 'Total invitados').siblings('div').first().should('contain', '4');

    cy.contains('div', 'Confirmados').siblings('div').first().should('contain', '2');

    cy.contains('div', 'Pendientes').siblings('div').first().should('contain', '1');

    cy.contains('div', 'Rechazados').siblings('div').first().should('contain', '1');

    cy.contains('td', 'Lucía Confirmada').should('exist');
    cy.contains('td', 'Mesa 5').should('exist');

    cy.contains('button', 'Imprimir / PDF').click();
    cy.get('@windowOpen').should('have.been.called');

    cy.contains('button', 'Cerrar').click();
    cy.contains('Resumen RSVP').should('not.exist');
  });
});
