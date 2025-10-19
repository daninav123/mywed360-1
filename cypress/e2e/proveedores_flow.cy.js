/// <reference types="cypress" />

describe('Flujo 5 - Proveedores con IA (E2E)', () => {
  beforeEach(() => {
    cy.visit('/test/proveedores-flow');
    cy.get('[data-cy="proveedores-flow-harness"]').should('exist');
  });

  it('recorre matriz, shortlist, pipeline y contratos siguiendo la UX documentada', () => {
    // Abrir matriz de necesidades y lanzar búsqueda IA desde allí
    cy.get('[data-cy="action-matriz"]').click();
    cy.get('[data-cy="needs-modal"]').within(() => {
      cy.contains('Catering').should('exist');
      cy.contains('Música').should('exist');
      cy.contains('button', 'Buscar').first().click();
    });

    // Drawer IA: generar proveedor sugerido y guardarlo
    cy.get('.fixed.inset-0').should('exist').within(() => {
      cy.get('input[placeholder="Ej: Fotografía Madrid 2000€"]')
        .clear()
        .type('Florista Barcelona 2500');
      cy.contains('button', 'Buscar').click();
      cy.contains('Floristería Prisma').should('be.visible');
      cy.contains('button', 'Guardar proveedor').click();
    });

    // Completar formulario y guardar nuevo proveedor
    cy.get('[data-cy="modal-proveedor"]').should('be.visible');
    cy.get('[data-cy="modal-proveedor"] input#presupuesto').clear().type('3200');
    cy.get('[data-cy="modal-proveedor"]').within(() => {
      cy.contains('button', 'Guardar').click();
    });
    cy.get('[data-cy="modal-proveedor"]').should('not.exist');

    // Reabrir matriz y verificar que el servicio se añadió
    cy.get('[data-cy="action-matriz"]').click();
    cy.get('[data-cy="needs-modal"]').contains('Flores').should('exist');
    cy.get('button[aria-label="Cerrar"]').click();

    // Shortlist: favorito, indicador y detalle
    cy.get('[data-cy="tab-vistos"]').click();
    cy.get('[data-cy="vistos-item-prov-ai"]').within(() => {
      cy.contains('Floristería Prisma').should('exist');
      cy.get('[data-cy="vistos-unread"]').should('exist');
      cy.get('[data-cy="vistos-favorite"]').click().should('contain', '★');
      cy.get('[data-cy="vistos-open"]').click();
    });

    // Detalle del proveedor: registrar comunicación y cerrar
    cy.get('[data-cy="detalle-proveedor"]').within(() => {
      cy.contains('Floristería Prisma').should('exist');
      cy.contains('button', 'Nueva entrada').click();
      cy.contains('Comunicación registrada durante la prueba').should('exist');
      cy.contains('button', 'Cerrar').click();
    });

    cy.get('[data-cy="vistos-item-prov-ai"]').within(() => {
      cy.get('[data-cy="vistos-unread"]').should('not.exist');
    });

    // Pipeline: mover proveedor a presupuesto y luego a contratado
    cy.get('[data-cy="tab-pipeline"]').click();
    cy.contains('[data-cy="pipeline-kanban"] article', 'Floristería Prisma')
      .within(() => {
        cy.contains('button', 'Presupuesto').click();
      });

    cy.contains('[data-cy="pipeline-kanban"] article', 'Floristería Prisma')
      .within(() => {
        cy.contains('button', '✓').click();
      });

    cy.contains('[data-cy="pipeline-section"] .text-sm.font-semibold', 'Contratado')
      .parent()
      .within(() => {
        cy.contains('article', 'Floristería Prisma').should('exist');
      });

    // Resumen de contratos actualizado
    cy.get('[data-cy="tab-contratos"]').click();
    cy.get('[data-cy="contratos-total"]').should('have.text', '1');
    cy.get('[data-cy="contratos-servicios"]').should('contain', '4');

    // El proveedor contratado se retira de la shortlist
    cy.get('[data-cy="tab-vistos"]').click();
    cy.get('[data-cy="vistos-item-prov-ai"]').should('not.exist');
  });
});
