/// <reference types="Cypress" />

/**
 * Flujo 18 – Generador de documentos legales.
 * Objetivo: validar requeridos (nombre, fecha, localidad) y retroalimentación.
 *
 * TODO: implementar cuando el formulario exponga validaciones visibles.
 *       Actualmente el componente no marca `required` ni muestra mensajes.
 */
describe('Documentos legales · validaciones de datos', () => {
  beforeEach(() => {
    cy.loginToLovenda();
    cy.visit('/protocolo/documentos');
  });

  it.skip('bloquea la generación si faltan campos obligatorios', () => {
    // TODO: esperar mensajes de error / estados inválidos.
  });
});

