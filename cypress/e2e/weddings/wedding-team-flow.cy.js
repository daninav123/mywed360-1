/// <reference types="cypress" />

// Tests E2E para las dos variantes de invitacion de planners descritas en el flujo 10.

describe('Flujo 10 - Gestion de equipo (planner marketplace y codigo externo)', () => {
  const harnessPath = '/test/wedding-team';

  const stubPlanners = [
    {
      id: 'planner-clara',
      name: 'Clara Planner',
      city: 'Madrid',
      rating: 4.9,
      weddingsActive: 1,
      tags: ['boho', 'mar'],
      email: 'clara.planner@lovenda.cy',
    },
    {
      id: 'planner-ana',
      name: 'Ana Rivera',
      city: 'Valencia',
      rating: 4.7,
      weddingsActive: 2,
      tags: ['classic', 'romantico'],
      email: 'ana.rivera@lovenda.cy',
    },
  ];

  beforeEach(() => {
    cy.visit(harnessPath, {
      onBeforeLoad(win) {
        win.localStorage.clear();
        win.__TEAM_STUB__ = { planners: stubPlanners };
      },
    });
    cy.closeDiagnostic();
  });

  it('permite invitar a un planner desde el marketplace interno', () => {
    cy.get('[data-testid="wedding-team-modal"]').should('be.visible');
    cy.get('[data-testid="marketplace-grid"] [data-testid="planner-card"]').should(
      'have.length.at.least',
      1,
    );

    cy.get('[data-testid="planner-card"]').first().within(() => {
      cy.get('[data-testid="invite-planner"]').click();
    });

    cy.get('[data-testid="invite-feedback"]')
      .should('be.visible')
      .and('contain', 'invitacion enviada a');

    cy.window().then((win) => {
      const stored = win.localStorage.getItem('maloveapp_team_invites');
      expect(stored, 'invitaciones almacenadas').to.be.a('string');
      const invites = JSON.parse(stored);
      expect(invites).to.have.length(1);
      expect(invites[0]).to.include({
        plannerId: stubPlanners[0].id,
        plannerEmail: stubPlanners[0].email,
        source: 'marketplace',
      });
      expect(invites[0].weddingId).to.equal('w-harness');
    });
  });

  it('genera y persiste un codigo para planners externos', () => {
    cy.get('[data-testid="wedding-team-modal"]').should('be.visible');
    cy.contains('button', 'codigo para planner externo').click();

    cy.get('[data-testid="generate-code"]').click();
    cy.get('[data-testid="generated-code"]')
      .should('be.visible')
      .invoke('text')
      .then((codeText) => {
        expect(codeText).to.match(/^INV-[A-Z0-9]{4}$/);
      });

    cy.window().then((win) => {
      const stored = win.localStorage.getItem('maloveapp_team_codes');
      expect(stored, 'codigos almacenados').to.be.a('string');
      const codes = JSON.parse(stored);
      expect(codes).to.have.property('w-harness');
      expect(codes['w-harness']).to.include({ role: 'planner' });
      expect(codes['w-harness'].code).to.match(/^INV-[A-Z0-9]{4}$/);
    });
  });
});
