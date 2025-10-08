/// <reference types="cypress" />

describe('Flujo 5 - Proveedores con IA (E2E)', () => {
  beforeEach(() => {
    cy.visit('/test/proveedores-flow');
    cy.get('[data-cy="proveedores-flow-harness"]').should('exist');
  });

  it('recorre planificación, shortlist, pipeline y contratación de proveedores', () => {
    // Necesidades: tablero resume servicios actuales
    cy.get('[data-cy="services-board-section"]').within(() => {
      cy.contains('Catering').should('exist');
      cy.contains('Música').should('exist');
      cy.get('button').contains('Buscar').first().click();
    });

    // Búsqueda IA: generar proveedor y abrir formulario
    cy.get('.fixed.inset-0').should('exist').within(() => {
      cy.get('input[placeholder="Ej: Fotografía Madrid 2000€"]').clear().type('Florista Barcelona 2500');
      cy.contains('button', 'Buscar').click();
      cy.contains('Floristería Prisma').should('be.visible');
      cy.contains('button', 'Guardar proveedor').click();
    });

    // Completar formulario y guardar nuevo proveedor
    cy.contains('Nuevo proveedor').should('be.visible');
    cy.get('input#presupuesto').clear().type('3200');
    cy.contains('button', 'Guardar').click();
    cy.contains('Nuevo proveedor').should('not.exist');

    // El servicio añadido aparece en el tablero
    cy.get('[data-cy="services-board-section"]').contains('Flores').should('exist');

    // Shortlist: verificar favorito, indicador y detalle
    cy.get('[data-cy="tab-vistos"]').click();
    cy.get('[data-cy="vistos-item-prov-ai"]').within(() => {
      cy.contains('Floristería Prisma').should('exist');
      cy.get('[data-cy="vistos-unread"]').should('exist');
      cy.get('[data-cy="vistos-favorite"]').click().should('contain', '★');
      cy.get('[data-cy="vistos-open"]').click();
    });

    // Detalle del proveedor, registrar comunicación y cerrar
    cy.get('[data-cy="detalle-proveedor"]').within(() => {
      cy.contains('Floristería Prisma').should('exist');
      cy.contains('button', 'Nueva entrada').click();
      cy.contains('Comunicación registrada durante la prueba').should('exist');
      cy.contains('button', 'Cerrar').click();
    });

    cy.get('[data-cy="vistos-item-prov-ai"]').within(() => {
      cy.get('[data-cy="vistos-unread"]').should('not.exist');
    });

    // Pipeline: mover proveedor hasta contratado
    cy.get('[data-cy="tab-pipeline"]').click();
    cy.contains('[data-cy="pipeline-section"] .font-semibold', 'Floristería Prisma')
      .parent()
      .within(() => {
        cy.contains('button', '→').click();
      });

    cy.contains('[data-cy="pipeline-section"] .font-semibold', 'Floristería Prisma')
      .parent()
      .within(() => {
        cy.contains('button', '✓').click();
      });

    // Verificar que está en la columna de contratados
    cy.contains('[data-cy="pipeline-section"] .text-sm.font-semibold', 'Contratado')
      .parent()
      .within(() => {
        cy.get('.p-2').contains('Floristería Prisma').should('exist');
      });

    // Resumen de contratos actualizado
    cy.get('[data-cy="tab-contratos"]').click();
    cy.get('[data-cy="contratos-total"]').should('have.text', '1');
    cy.get('[data-cy="contratos-servicios"]').should('contain.text', '4');

    // El proveedor contratado sale de la shortlist
    cy.get('[data-cy="tab-vistos"]').click();
    cy.get('[data-cy="vistos-item-prov-ai"]').should('not.exist');
  });
});
