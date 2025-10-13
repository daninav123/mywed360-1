describe('Flujo 3 – Gestión de invitados', () => {
  let demoDataset;

  before(() => {
    cy.fixture('guests-demo.json').then((data) => {
      demoDataset = data;
    });
  });

  beforeEach(() => {
    cy.visit('/invitados');
    cy.window().then((win) => {
      win.toast = undefined;
      win.__GUESTS_TEST_API__ = {
        reset: () => {},
        logWhatsApp: () => true,
        logEmail: () => true,
        logEvent: () => true,
        getMessages: () => [],
        getEmails: () => [],
        getEvents: () => [],
        loadFixture: async () => JSON.parse(JSON.stringify(demoDataset || [])),
      };
    });
    cy.window().then((win) => {
      if (win.__GUESTS_TEST_API__?.reset) {
        win.__GUESTS_TEST_API__.reset();
      }
    });
  });

  it('carga dataset demo, filtra y registra un check-in', () => {
    const alerts = [];
    cy.on('window:alert', (text) => {
      alerts.push(text);
    });

    cy.get('[data-testid="guest-load-samples"]').click();
    cy.contains('Carla López', { timeout: 10000 }).should('be.visible');

    cy.get('[data-testid="guest-filter-rsvp"]').select('confirmed');
    cy.contains('Carla López').should('be.visible');
    cy.contains('Miguel Torres').should('not.exist');
    cy.get('[data-testid="guest-filter-rsvp"]').select('');

    cy.get('[data-testid="guest-open-checkin"]').click();
    cy.get('[data-testid="guest-checkin-input"]').type('DEMO1A');
    cy.contains('Carla López').should('be.visible');
    cy.contains('Marcar presente').click();
    cy.contains('Ya registrado').should('exist');
    cy.get('body').type('{esc}');

    cy.wrap(alerts).should('not.be.empty');
  });
});
