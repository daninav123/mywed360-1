/// <reference types="Cypress" />

// Flujos 11A–11D: Momentos especiales, timing, checklist y documentación legal

const mockProfile = {
  uid: 'owner-protocolo-e2e',
  role: 'owner',
  email: 'owner.protocolo@lovenda.test',
  emailVerified: true,
};

const mockSpecialMoments = {
  ceremonia: [
    {
      id: 'm1',
      order: 1,
      title: 'Entrada de la pareja',
      song: 'A Thousand Years - Christina Perri',
      time: '17:00',
      duration: '5 min',
    },
  ],
  coctel: [],
  banquete: [],
  disco: [],
};

const mockManualChecklist = [
  {
    id: 1,
    title: 'Confirmar llegada del celebrante',
    notes: 'Llamar 2 días antes',
    done: false,
  },
];

const prepareSession = (visitUrl) => {
  cy.visit(visitUrl, {
    onBeforeLoad(win) {
      win.localStorage.clear();
      win.localStorage.setItem('MaLoveApp_user_profile', JSON.stringify(mockProfile));
      win.localStorage.setItem('maloveapp_active_wedding', 'w-proto');
      win.localStorage.setItem('maloveapp_active_wedding', 'w-proto');
      win.localStorage.setItem('mywed360SpecialMoments', JSON.stringify(mockSpecialMoments));
      win.localStorage.setItem('maloveapp_manual_checkpoints_w-proto', JSON.stringify(mockManualChecklist));
      win.__MOCK_WEDDING__ = {
        weddings: [{ id: 'w-proto', name: 'Boda Protocolaria', location: 'Valencia' }],
        activeWedding: { id: 'w-proto' },
      };
    },
  });
  cy.closeDiagnostic();
};

describe('Flujos 11A–11D - Protocolo y Ceremonias', () => {
  beforeEach(() => {
    Cypress.env('STUB_FIRESTORE', true);
  });

  it('renderiza Momentos Especiales con datos persistidos', () => {
    prepareSession('/protocolo/momentos-especiales');
    cy.contains('Momentos especiales', { timeout: 15000 }).should('be.visible');
    cy.contains('Entrada de la pareja').should('be.visible');
    cy.contains('A Thousand Years').should('be.visible');
  });

  it('muestra el timeline del día B con bloques por defecto', () => {
    prepareSession('/protocolo/timing');
    cy.contains('Timeline del día B', { timeout: 15000 }).should('be.visible');
    cy.contains('Ceremonia').should('be.visible');
    cy.contains('Añadir momento').should('be.visible');
  });

  it('presenta la checklist de última hora y permite ver checkpoints', () => {
    prepareSession('/protocolo/checklist');
    cy.contains('Checklist de última hora', { timeout: 15000 }).should('be.visible');
    cy.contains('Confirmar llegada del celebrante').should('be.visible');
  });

  it('abre la guía de documentos legales', () => {
    prepareSession('/protocolo/documentos');
    cy.contains('Documentos legales', { timeout: 15000 }).should('be.visible');
    cy.contains('Generar documento').should('exist');
  });
});
