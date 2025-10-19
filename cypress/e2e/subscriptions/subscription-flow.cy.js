/// <reference types="Cypress" />

describe('Suscripciones - flujo E2E', () => {
  beforeEach(() => {
    Cypress.env('STUB_FIRESTORE', true);
  });

  it('propaga plan premium entre ambos owners', () => {
    const scenario = {
      wedding: {
        id: 'w-premium-owner',
        name: 'Boda Premium Owner',
        tier: 'premium',
        purchaseId: 'purchase-premium-owner',
        status: 'active',
        ownerIds: ['owner-premium-1', 'owner-premium-2'],
      },
      owners: {
        primary: {
          uid: 'owner-premium-1',
          email: 'owner.premium1@lovenda.test',
          displayName: 'Owner Premium 1',
        },
        secondary: {
          uid: 'owner-premium-2',
          email: 'owner.premium2@lovenda.test',
          displayName: 'Owner Premium 2',
        },
      },
    };

    cy.visitWithSubscriptionScenario('/home', scenario, 'owner.primary');
    cy.closeDiagnostic();

    cy.assertSubscriptionState({
      role: 'owner',
      tier: 'premium',
      weddingTier: 'premium',
      purchaseId: 'purchase-premium-owner',
      readOnly: false,
    });
    cy.assertWeddingPurchaseState('purchase-premium-owner', {
      weddingId: 'w-premium-owner',
      tier: 'premium',
      consumed: false,
    });

    cy.switchSubscriptionScenarioUser('/home', 'owner.secondary');
    cy.closeDiagnostic();

    cy.assertSubscriptionState({
      role: 'owner',
      tier: 'premium',
      weddingTier: 'premium',
      purchaseId: 'purchase-premium-owner',
      readOnly: false,
    });
    cy.assertWeddingPurchaseState('purchase-premium-owner', {
      weddingId: 'w-premium-owner',
      tier: 'premium',
      consumed: false,
    });
  });

  it('marca una boda como solo lectura cuando la compra está consumida', () => {
    const scenario = {
      wedding: {
        id: 'w-premium-archived',
        name: 'Boda Archivo',
        tier: 'premium',
        purchaseId: 'purchase-premium-archived',
        status: 'archived',
        ownerIds: ['owner-archived-1', 'owner-archived-2'],
      },
      owners: {
        primary: {
          uid: 'owner-archived-1',
          email: 'owner.archived1@lovenda.test',
          displayName: 'Owner Archivado 1',
        },
        secondary: {
          uid: 'owner-archived-2',
          email: 'owner.archived2@lovenda.test',
          displayName: 'Owner Archivado 2',
        },
      },
    };

    cy.visitWithSubscriptionScenario('/home', scenario, 'owner.primary');
    cy.closeDiagnostic();

    cy.assertSubscriptionState({
      role: 'owner',
      tier: 'premium',
      weddingTier: 'premium',
      purchaseId: 'purchase-premium-archived',
      readOnly: true,
    });
    cy.assertWeddingPurchaseState('purchase-premium-archived', {
      weddingId: 'w-premium-archived',
      tier: 'premium',
      consumed: true,
    });
  });

  it('permite que un assistant herede el tier premium plus de la boda', () => {
    const scenario = {
      wedding: {
        id: 'w-premium-plus',
        name: 'Boda Premium Plus',
        tier: 'premium_plus',
        purchaseId: 'purchase-premium-plus',
        status: 'active',
        ownerIds: ['owner-plus'],
        assistantIds: ['assistant-plus'],
      },
      owners: {
        primary: {
          uid: 'owner-plus',
          email: 'owner.plus@lovenda.test',
          displayName: 'Owner Premium Plus',
        },
      },
      assistants: [
        {
          uid: 'assistant-plus',
          email: 'assistant.plus@lovenda.test',
          displayName: 'Assistant Premium Plus',
          weddingId: 'w-premium-plus',
        },
      ],
    };

    cy.visitWithSubscriptionScenario('/tasks', scenario, 'assistant.0');
    cy.closeDiagnostic();

    cy.assertSubscriptionState({
      role: 'assistant',
      tier: 'assistant',
      inheritedTier: 'premium_plus',
      weddingTier: 'premium_plus',
      purchaseId: 'purchase-premium-plus',
      readOnly: false,
    });
    cy.assertWeddingPurchaseState('purchase-premium-plus', {
      weddingId: 'w-premium-plus',
      tier: 'premium_plus',
      consumed: false,
    });
  });

  it('planner con plan Studio gestiona cinco bodas y refleja límite de plan', () => {
    const weddings = Array.from({ length: 5 }).map((_, idx) => {
      const index = idx + 1;
      return {
        id: `w-studio-${index}`,
        name: `Boda Studio ${index}`,
        tier: index === 5 ? 'premium_plus' : 'premium',
        purchaseId: `purchase-studio-${index}`,
        status: 'active',
        ownerIds: [`owner-studio-${index}`],
        plannerIds: ['planner-studio'],
      };
    });

    const plannerScenario = {
      weddings,
      owners: {
        primary: {
          uid: 'owner-studio-1',
          email: 'owner.studio1@lovenda.test',
          displayName: 'Owner Studio 1',
        },
      },
      planners: [
        {
          uid: 'planner-studio',
          email: 'planner.studio@lovenda.test',
          displayName: 'Planner Studio',
          tier: 'plan_studio',
          weddingIds: weddings.map((wedding) => wedding.id),
          activeWeddingId: 'w-studio-1',
        },
      ],
    };

    cy.visitWithSubscriptionScenario('/bodas', plannerScenario, 'planner.0');
    cy.closeDiagnostic();

    cy.assertSubscriptionState({
      role: 'planner',
      tier: 'plan_studio',
      weddingTier: 'premium',
      purchaseId: 'purchase-studio-1',
      readOnly: false,
      limit: 5,
    });

    weddings.forEach((wedding) => {
      cy.assertWeddingPurchaseState(wedding.purchaseId, {
        weddingId: wedding.id,
        tier: wedding.tier,
        consumed: false,
      });
    });

    cy.get('[data-testid="planner-wedding-card"]').should('have.length', weddings.length);
    weddings.forEach((wedding) => {
      cy.contains('[data-testid="planner-wedding-card"]', wedding.name).should('be.visible');
    });
  });
});
