/// <reference types="Cypress" />

// Flujo 7: Presupuesto y Finanzas
// - Crear transacción (modo local, sin boda activa)
// - Filtrar transacciones
// - Añadir categoría de presupuesto

describe('Flujo 7 - Finanzas (transacciones y presupuesto)', () => {
  beforeEach(() => {
    cy.window().then((win) => win.localStorage.clear());
    cy.loginToLovenda();
    // Forzar modo local (sin boda activa) para usar LocalStorage y evitar Firestore
    cy.window().then((win) => win.localStorage.removeItem('lovenda_active_wedding'));
  });

  it('crea una transacción y la visualiza en la lista', () => {
    cy.visit('/finance');

    // Ir a la pestaña de transacciones
    cy.contains('button,div', 'Transacciones').click();

    // Crear nueva transacción
    cy.contains('button', 'Nueva Transacción').click();
    cy.get('input[placeholder*="concepto" i]').type('Pago catering');
    cy.get('input[type="number"]').clear().type('2500');
    // la fecha viene por defecto; escoger categoría
    cy.get('select').last().select('Catering');
    cy.contains('button', 'Crear Transacción').click();

    // Verificar que aparece en la tabla
    cy.contains('td,div', 'Pago catering', { timeout: 8000 }).should('exist');

    // Filtrar por categoría y tipo
    cy.get('select').contains('Todos los tipos').select('Gastos');
    cy.get('select').contains('Todas las categorías').select('Catering');
    cy.contains('td,div', 'Pago catering').should('exist');
  });

  it('añade una categoría al presupuesto y se lista', () => {
    cy.visit('/finance');

    // Ir a la pestaña de presupuesto
    cy.contains('button,div', 'Presupuesto').click();

    cy.contains('button', 'Nueva Categoría').click();
    cy.get('input[placeholder*="Ej:"]').first().type('DJ');
    cy.get('input[type="number"]').last().clear().type('1200');
    cy.contains('button', 'Crear Categoría').click();

    cy.contains('h4,div', 'DJ', { timeout: 8000 }).should('exist');
  });
});

