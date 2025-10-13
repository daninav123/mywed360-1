/// <reference types="Cypress" />

const WEDDING_ID = 'cypress-wedding';

const seedBanquetState = (win) => {
  win.localStorage.clear();
  win.localStorage.setItem('mywed360_active_wedding', WEDDING_ID);
  win.localStorage.setItem('lovenda_active_wedding', WEDDING_ID);
  const banquetState = {
    config: { width: 1800, height: 1200 },
    areas: [
      {
        type: 'boundary',
        points: [
          { x: 0, y: 0 },
          { x: 800, y: 0 },
          { x: 800, y: 500 },
          { x: 0, y: 500 },
        ],
      },
      {
        type: 'door',
        points: [
          { x: 180, y: 0 },
          { x: 220, y: 0 },
          { x: 220, y: -40 },
          { x: 180, y: -40 },
        ],
      },
      {
        type: 'obstacle',
        points: [
          { x: 400, y: 200 },
          { x: 460, y: 200 },
          { x: 460, y: 260 },
          { x: 400, y: 260 },
        ],
      },
    ],
  };
  win.localStorage.setItem(
    `seatingPlan:${WEDDING_ID}:banquet`,
    JSON.stringify(banquetState)
  );
};

describe('Seating plan · paneles de UI', () => {
  beforeEach(() => {
    cy.loginToLovenda('seating.panels@lovenda.test');
  });

  it('muestra la leyenda de áreas en la biblioteca', () => {
    cy.visit('/invitados/seating', {
      onBeforeLoad: (win) => {
        seedBanquetState(win);
      },
    });
    cy.closeDiagnostic();
    cy.contains('Banquete').click();

    cy.contains('Áreas dibujadas', { timeout: 10000 }).should('be.visible');
    cy.contains('Perímetro')
      .closest('div')
      .next('span')
      .should('contain', '1');
    cy.contains('Puertas')
      .closest('div')
      .next('span')
      .should('contain', '1');
    cy.contains('Obstáculos')
      .closest('div')
      .next('span')
      .should('contain', '1');
  });

  it('permite alternar vistas y guiar invitados desde el cajón', () => {
    cy.visit('/invitados/seating', {
      onBeforeLoad: (win) => {
        seedBanquetState(win);
      },
    });
    cy.closeDiagnostic();
    cy.contains('Banquete').click();

    cy.contains('Redonda').click();
    cy.contains('button', /^Pendientes/).first().click();

    cy.contains('Selecciona una mesa para habilitar la asignación rápida.').should(
      'be.visible'
    );
    cy.contains('+1').should('exist');

    cy.contains('button', 'Tarjetas').click();
    cy.contains('button', 'Lista').should('be.visible');

    cy.contains('button', 'Guiar').first().click();
    cy.contains('Invitado guiado').should('contain', 'Invitado E2E');

    cy.get('[data-testid^="table-item-"]').first().click();
    cy.contains('Asignar a:').should('contain', 'Mesa');

    cy.contains('button', 'Asignar')
      .first()
      .should('not.be.disabled')
      .click();

    cy.contains('Invitados pendientes')
      .siblings('span')
      .should('contain', '(5)');
  });

  it('persiste los toggles del lienzo entre recargas', () => {
    cy.visit('/invitados/seating', {
      onBeforeLoad: (win) => {
        seedBanquetState(win);
      },
    });
    cy.closeDiagnostic();
    cy.contains('Banquete').click();

    cy.contains('Redonda').click();
    cy.contains('button', 'Números de asiento').click();
    cy.contains('button', 'Ocultar mesas').click();

    cy.window().then((win) => {
      const prefsRaw = win.localStorage.getItem(
        `seatingPlan:${WEDDING_ID}:ui-prefs`
      );
      const prefs = prefsRaw ? JSON.parse(prefsRaw) : {};
      expect(prefs.showSeatNumbers).to.be.true;
      expect(prefs.showTables).to.be.false;
    });

    cy.reload();
    cy.closeDiagnostic();
    cy.contains('Banquete').click();

    cy.contains('button', 'Números de asiento').should('have.class', 'text-blue-700');
    cy.contains('button', 'Mostrar mesas').should('exist');
  });
});
