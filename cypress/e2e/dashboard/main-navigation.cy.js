/// <reference types="Cypress" />

/**
 * Flujo 22 – Navegación / panel general.
 * Referencia: docs/flujos-especificos/flujo-22-dashboard-navegacion.md
 *
 * TODO: implementar assertions reales (breadcrumbs, elementos críticos, fallback states).
 */
describe('Dashboard · navegación principal', () => {
  beforeEach(() => {
    cy.loginToLovenda();
    cy.visit('/home');
  });

  it.skip('permite recorrer las secciones principales desde la barra inferior', () => {
    // TODO: click home/tasks/finance/more y validar breadcrumb/landing.
  });

  it.skip('muestra elementos críticos del panel (widgets, banners, CTA)', () => {
    // TODO: snapshot de widgets cuando existan data-testid estables.
  });
});

