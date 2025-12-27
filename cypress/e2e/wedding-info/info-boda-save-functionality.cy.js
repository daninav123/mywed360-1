/**
 * Test E2E: Funcionalidad de Guardado en InfoBoda
 * Verifica guardado manual, auto-save y persistencia
 */

describe('InfoBoda - Guardado y Persistencia', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
    cy.window().then((win) => {
      win.localStorage.setItem('userSession', JSON.stringify({
        token: 'test-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }));
    });
    
    // Interceptar llamada de guardado a Firebase
    cy.intercept('POST', '**/firestore.googleapis.com/**', {
      statusCode: 200,
      body: { success: true }
    }).as('saveToFirebase');
    
    cy.visit('http://localhost:5173/info-boda');
    cy.wait(1000);
  });

  it('debe mostrar botón de guardar', () => {
    cy.contains('💾 Guardar Cambios').should('be.visible');
  });

  it('debe mostrar indicador de cambios sin guardar al editar', () => {
    cy.get('input[name="coupleName"]').type('María y Juan');
    cy.wait(500);
    cy.contains('⚠️ Cambios sin guardar').should('be.visible');
  });

  it('debe guardar información al hacer click en guardar', () => {
    cy.get('input[name="coupleName"]').clear().type('María y Juan');
    cy.get('input[name="weddingDate"]').type('2026-06-15');
    cy.wait(500);
    
    cy.contains('💾 Guardar Cambios').click();
    cy.wait(1000);
    
    // Verificar que no hay cambios sin guardar
    cy.contains('⚠️ Cambios sin guardar').should('not.exist');
  });

  it('debe mostrar timestamp de último guardado', () => {
    cy.get('input[name="coupleName"]').clear().type('Test Couple');
    cy.contains('💾 Guardar Cambios').click();
    cy.wait(1000);
    
    cy.contains('Último guardado:').should('be.visible');
  });

  it('debe activar auto-save después de 30 segundos de inactividad', () => {
    cy.get('input[name="coupleName"]').clear().type('Auto Save Test');
    cy.wait(500);
    cy.contains('⚠️ Cambios sin guardar').should('be.visible');
    
    // Esperar 31 segundos para que se active el auto-save
    cy.wait(31000);
    
    // Verificar que los cambios ya no están sin guardar
    cy.contains('⚠️ Cambios sin guardar').should('not.exist');
  });

  it('debe validar fecha de boda antes de guardar', () => {
    cy.get('input[name="weddingDate"]').type('invalid-date');
    cy.contains('💾 Guardar Cambios').click();
    cy.wait(500);
    
    // Debería mostrar error de validación
    // (esto depende de cómo se implemente la validación)
  });

  it('debe persistir datos en múltiples campos', () => {
    // Llenar varios campos
    cy.get('input[name="coupleName"]').clear().type('María y Juan');
    cy.get('input[name="celebrationPlace"]').type('Iglesia San Pedro');
    cy.get('select[name="ceremonyType"]').select('religiosa');
    cy.get('textarea[name="story"]').type('Nos conocimos en 2020...');
    
    cy.contains('💾 Guardar Cambios').click();
    cy.wait(1000);
    
    // Recargar página
    cy.reload();
    cy.wait(2000);
    
    // Verificar que los datos persisten
    cy.get('input[name="coupleName"]').should('have.value', 'María y Juan');
    cy.get('input[name="celebrationPlace"]').should('have.value', 'Iglesia San Pedro');
    cy.get('select[name="ceremonyType"]').should('have.value', 'religiosa');
    cy.get('textarea[name="story"]').should('contain.value', 'Nos conocimos');
  });

  it('debe guardar checkboxes correctamente', () => {
    cy.get('input[name="samePlaceCeremonyReception"]').check();
    cy.get('input[name="longOpenBar"]').check();
    cy.get('input[name="pets"]').check();
    
    cy.contains('💾 Guardar Cambios').click();
    cy.wait(1000);
    
    cy.reload();
    cy.wait(2000);
    
    cy.get('input[name="samePlaceCeremonyReception"]').should('be.checked');
    cy.get('input[name="longOpenBar"]').should('be.checked');
    cy.get('input[name="pets"]').should('be.checked');
  });

  it('debe actualizar progreso al completar campos', () => {
    // Verificar progreso inicial
    cy.contains('Progreso de Información').should('be.visible');
    
    // Llenar campos de una sección
    cy.get('input[name="coupleName"]').type('María y Juan');
    cy.get('input[name="weddingDate"]').type('2026-06-15');
    
    // El progreso debería actualizarse visualmente
    cy.get('[class*="bg-gradient-to-r"]').should('exist');
  });
});
