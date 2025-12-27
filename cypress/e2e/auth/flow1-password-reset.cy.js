/**
 * Test E2E: Restablecimiento de Contraseña
 * Verifica solicitud y completado del reset
 */

describe('Flujo de Restablecimiento de Contraseña', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('debe mostrar formulario de reset desde login', () => {
    cy.visit('http://localhost:5173/login');
    cy.contains('¿Olvidaste tu contraseña?').click();
    cy.url().should('include', '/reset-password');
  });

  it('debe validar email en solicitud de reset', () => {
    cy.visit('http://localhost:5173/reset-password');
    cy.get('input[type="email"]').type('invalid-email');
    cy.contains('Enviar').click();
    
    cy.contains('email', { matchCase: false }).should('exist');
  });

  it('debe enviar solicitud de reset correctamente', () => {
    cy.intercept('POST', '**/auth/reset-password', {
      statusCode: 200,
      body: { success: true, message: 'Email enviado' }
    }).as('resetRequest');

    cy.visit('http://localhost:5173/reset-password');
    cy.get('input[type="email"]').type('user@example.com');
    cy.contains('Enviar').click();

    cy.wait('@resetRequest');
    cy.contains('correo enviado', { matchCase: false }).should('be.visible');
  });

  it('debe completar reset con token válido', () => {
    const resetToken = 'valid-reset-token';
    
    cy.intercept('POST', '**/auth/confirm-reset', {
      statusCode: 200,
      body: { success: true }
    }).as('confirmReset');

    cy.visit(`http://localhost:5173/reset-password?token=${resetToken}`);
    cy.get('input[type="password"]').first().type('NewSecurePass123!');
    cy.get('input[type="password"]').last().type('NewSecurePass123!');
    cy.contains('Restablecer').click();

    cy.wait('@confirmReset');
    cy.url().should('include', '/login');
    cy.contains('contraseña actualizada', { matchCase: false }).should('be.visible');
  });

  it('debe validar que las contraseñas coincidan', () => {
    cy.visit('http://localhost:5173/reset-password?token=test-token');
    cy.get('input[type="password"]').first().type('Password123!');
    cy.get('input[type="password"]').last().type('DifferentPass123!');
    cy.contains('Restablecer').click();
    
    cy.contains('coinciden', { matchCase: false }).should('be.visible');
  });
});
