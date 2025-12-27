/**
 * Test E2E: Validación de IBAN en InfoBoda
 * Verifica validación en tiempo real del campo IBAN
 */

describe('InfoBoda - Validación de IBAN', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
    cy.window().then((win) => {
      win.localStorage.setItem('userSession', JSON.stringify({
        token: 'test-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }));
    });
    cy.visit('http://localhost:5173/info-boda');
    cy.wait(1000);
  });

  it('debe mostrar el campo de IBAN', () => {
    cy.contains('Cuenta de regalos (IBAN)').should('be.visible');
    cy.get('input[name="giftAccount"]').should('be.visible');
  });

  it('debe aceptar IBAN español válido', () => {
    const validIBAN = 'ES9121000418450200051332';
    cy.get('input[name="giftAccount"]').type(validIBAN);
    
    cy.wait(500);
    cy.contains('✓').should('be.visible');
    cy.contains('IBAN válido - España').should('be.visible');
    cy.get('input[name="giftAccount"]').should('have.class', 'border-green-500');
  });

  it('debe rechazar IBAN con longitud incorrecta', () => {
    const invalidIBAN = 'ES91210004184502';
    cy.get('input[name="giftAccount"]').type(invalidIBAN);
    
    cy.wait(500);
    cy.contains('❌').should('be.visible');
    cy.contains('IBAN de España debe tener 24 caracteres').should('be.visible');
    cy.get('input[name="giftAccount"]').should('have.class', 'border-red-500');
  });

  it('debe rechazar IBAN con checksum inválido', () => {
    const invalidIBAN = 'ES9121000418450200051333';
    cy.get('input[name="giftAccount"]').type(invalidIBAN);
    
    cy.wait(500);
    cy.contains('❌').should('be.visible');
    cy.contains('dígitos de control incorrectos').should('be.visible');
  });

  it('debe rechazar IBAN con formato inválido', () => {
    const invalidIBAN = '1234567890ABCDEF';
    cy.get('input[name="giftAccount"]').type(invalidIBAN);
    
    cy.wait(500);
    cy.contains('❌').should('be.visible');
    cy.contains('Formato inválido').should('be.visible');
  });

  it('debe aceptar IBAN con espacios', () => {
    const validIBAN = 'ES91 2100 0418 4502 0005 1332';
    cy.get('input[name="giftAccount"]').type(validIBAN);
    
    cy.wait(500);
    cy.contains('✓').should('be.visible');
    cy.contains('IBAN válido - España').should('be.visible');
  });

  it('debe validar IBANs de diferentes países', () => {
    // Francia
    cy.get('input[name="giftAccount"]').clear().type('FR1420041010050500013M02606');
    cy.wait(500);
    cy.contains('IBAN válido - Francia').should('be.visible');
    
    // Alemania
    cy.get('input[name="giftAccount"]').clear().type('DE89370400440532013000');
    cy.wait(500);
    cy.contains('IBAN válido - Alemania').should('be.visible');
    
    // Italia
    cy.get('input[name="giftAccount"]').clear().type('IT60X0542811101000000123456');
    cy.wait(500);
    cy.contains('IBAN válido - Italia').should('be.visible');
  });

  it('debe mostrar mensaje informativo sobre uso del IBAN', () => {
    cy.contains('Este IBAN aparecerá en las invitaciones y en la web').should('be.visible');
  });

  it('debe limpiar error al borrar el campo', () => {
    cy.get('input[name="giftAccount"]').type('INVALID');
    cy.wait(500);
    cy.contains('❌').should('be.visible');
    
    cy.get('input[name="giftAccount"]').clear();
    cy.wait(500);
    cy.contains('❌').should('not.exist');
    cy.get('input[name="giftAccount"]').should('have.class', 'border-gray-300');
  });

  it('debe mantener estado de validación al navegar entre tabs', () => {
    const validIBAN = 'ES9121000418450200051332';
    cy.get('input[name="giftAccount"]').type(validIBAN);
    cy.wait(500);
    cy.contains('IBAN válido - España').should('be.visible');
    
    // Cambiar a otro tab
    cy.contains('🎭 Visión y Estilo').click();
    cy.wait(500);
    
    // Volver al tab de info
    cy.contains('📝 Información Básica').click();
    cy.wait(500);
    
    // Verificar que el IBAN sigue ahí y válido
    cy.get('input[name="giftAccount"]').should('have.value', validIBAN);
    cy.contains('IBAN válido - España').should('be.visible');
  });
});
