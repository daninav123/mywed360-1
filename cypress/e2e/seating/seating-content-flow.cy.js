/// <reference types="Cypress" />

// Flujo 4: Plan de asientos y biblioteca de contenidos (inspiración, ideas, blog, documentos)

describe('Flujo 4 - Plan de asientos y contenidos', () => {
  beforeEach(() => {
    Cypress.env('STUB_FIRESTORE', true);
    cy.window().then((win) => {
      win.localStorage.clear();
    });
    cy.loginToLovenda('owner.seating@lovenda.test');
    cy.window().then((win) => {
      const profileRaw = win.localStorage.getItem('MaLoveApp_user_profile');
      const profile = profileRaw ? JSON.parse(profileRaw) : {};
      const ownerProfile = {
        ...profile,
        uid: 'owner-seating-e2e',
        role: 'owner',
        emailVerified: true,
      };
      win.localStorage.setItem('MaLoveApp_user_profile', JSON.stringify(ownerProfile));
      win.localStorage.setItem('maloveapp_active_wedding', 'w1');
      win.localStorage.setItem('maloveapp_active_wedding', 'w1');
      win.__MOCK_WEDDING__ = {
        weddings: [{ id: 'w1', name: 'Boda Cypress', location: 'Madrid', weddingDate: '2026-06-15' }],
        activeWedding: { id: 'w1', name: 'Boda Cypress' },
      };
    });
  });

  it('permite alternar pestañas del plan de asientos', () => {
    cy.visit('/plan-asientos');
    cy.closeDiagnostic();

    cy.contains('Ceremonia', { timeout: 15000 }).should('be.visible');
    cy.contains('Banquete').click();
    cy.contains('Banquete').should('have.class', /bg-blue-50/);
    cy.contains('Ceremonia').click();
    cy.contains('Ceremonia').should('have.class', /bg-blue-50/);
  });

  it('navega por la biblioteca de contenido asociada', () => {
    cy.visit('/inspiracion');
    cy.closeDiagnostic();
    cy.contains('Inspiración', { timeout: 15000 }).should('be.visible');

    cy.visit('/ideas');
    cy.contains('Ideas', { timeout: 10000 }).should('be.visible');

    cy.visit('/blog');
    cy.contains('Blog', { timeout: 10000 }).should('be.visible');

    cy.visit('/protocolo/documentos');
    cy.contains(/Documentos/i, { timeout: 10000 }).should('be.visible');
  });
});
