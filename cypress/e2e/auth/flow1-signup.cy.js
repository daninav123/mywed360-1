/**
 * Test E2E: Registro de Usuario
 * Verifica alta por correo, validación de duplicados y redirección
 */

describe('Flujo de Registro', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('http://localhost:5173/signup');
  });

  it('debe mostrar formulario de registro', () => {
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.contains('Registrarse').should('be.visible');
  });

  it('debe validar campos requeridos', () => {
    cy.contains('Registrarse').click();
    cy.contains('requerido', { matchCase: false }).should('exist');
  });

  it('debe validar formato de email', () => {
    cy.get('input[type="email"]').type('invalid-email');
    cy.get('input[type="password"]').type('password123');
    cy.contains('Registrarse').click();
    
    cy.contains('email', { matchCase: false }).should('exist');
  });

  it('debe validar fortaleza de contraseña', () => {
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('123');
    
    cy.contains('débil', { matchCase: false }).should('exist');
  });

  it('debe redirigir a verificación de email tras registro exitoso', () => {
    cy.intercept('POST', '**/auth/register', {
      statusCode: 200,
      body: { success: true, requiresVerification: true }
    }).as('register');

    cy.get('input[type="email"]').type('newuser@example.com');
    cy.get('input[type="password"]').type('SecurePass123!');
    cy.contains('Registrarse').click();

    cy.wait('@register');
    cy.url().should('include', '/verify-email');
  });

  it('debe mostrar error si email ya existe', () => {
    cy.intercept('POST', '**/auth/register', {
      statusCode: 400,
      body: { error: 'Email ya registrado' }
    }).as('registerDuplicate');

    cy.get('input[type="email"]').type('existing@example.com');
    cy.get('input[type="password"]').type('SecurePass123!');
    cy.contains('Registrarse').click();

    cy.wait('@registerDuplicate');
    cy.contains('ya registrado', { matchCase: false }).should('be.visible');
  });
});
