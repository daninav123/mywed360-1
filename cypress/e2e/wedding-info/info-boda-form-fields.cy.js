/**
 * Test E2E: Campos de Formulario en InfoBoda
 * Verifica entrada de datos y validaciones
 */

describe('InfoBoda - Campos de Formulario', () => {
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

  it('debe permitir ingresar nombre de la pareja', () => {
    cy.get('input[name="coupleName"]').clear().type('María y Juan');
    cy.get('input[name="coupleName"]').should('have.value', 'María y Juan');
  });

  it('debe permitir seleccionar fecha de boda', () => {
    cy.get('input[name="weddingDate"]').type('2026-06-15');
    cy.get('input[name="weddingDate"]').should('have.value', '2026-06-15');
  });

  it('debe mostrar número de invitados como solo lectura', () => {
    cy.get('input[name="numGuests"]').should('have.attr', 'readonly');
  });

  it('debe permitir seleccionar tipo de ceremonia', () => {
    cy.get('select[name="ceremonyType"]').select('civil');
    cy.get('select[name="ceremonyType"]').should('have.value', 'civil');
  });

  it('debe permitir ingresar lugares de celebración', () => {
    cy.get('input[name="celebrationPlace"]').type('Iglesia San Juan');
    cy.get('input[name="celebrationPlace"]').should('have.value', 'Iglesia San Juan');
    
    cy.get('input[name="banquetPlace"]').type('Hacienda Los Robles');
    cy.get('input[name="banquetPlace"]').should('have.value', 'Hacienda Los Robles');
  });

  it('debe permitir ingresar coordenadas GPS', () => {
    cy.get('input[name="ceremonyGPS"]').type('40.4168, -3.7038');
    cy.get('input[name="ceremonyGPS"]').should('have.value', '40.4168, -3.7038');
    
    cy.get('input[name="banquetGPS"]').type('40.5000, -3.8000');
    cy.get('input[name="banquetGPS"]').should('have.value', '40.5000, -3.8000');
  });

  it('debe permitir marcar checkboxes', () => {
    cy.get('input[name="samePlaceCeremonyReception"]').check();
    cy.get('input[name="samePlaceCeremonyReception"]').should('be.checked');
    
    cy.get('input[name="manyChildren"]').check();
    cy.get('input[name="manyChildren"]').should('be.checked');
  });

  it('debe permitir ingresar texto en textareas', () => {
    cy.get('textarea[name="story"]').type('Nos conocimos en la universidad...');
    cy.get('textarea[name="story"]').should('contain.value', 'Nos conocimos');
    
    cy.get('textarea[name="faqs"]').type('¿Hay parking?\nSí, parking gratuito');
    cy.get('textarea[name="faqs"]').should('contain.value', '¿Hay parking?');
  });

  it('debe permitir seleccionar tamaño de boda', () => {
    cy.get('select[name="weddingSize"]').select('mediana');
    cy.get('select[name="weddingSize"]').should('have.value', 'mediana');
  });

  it('debe permitir ingresar información de transporte', () => {
    cy.get('textarea[name="busInfo"]').type('Ida: 16:00 desde Plaza Mayor');
    cy.get('textarea[name="busInfo"]').should('contain.value', 'Plaza Mayor');
    
    cy.get('textarea[name="hotelInfo"]').type('Hotel Princesa: +34 91 xxx xxxx');
    cy.get('textarea[name="hotelInfo"]').should('contain.value', 'Hotel Princesa');
  });

  it('debe permitir ingresar hashtag y redes sociales', () => {
    cy.get('input[name="weddingHashtag"]').type('#MariaYJuan2026');
    cy.get('input[name="weddingHashtag"]').should('have.value', '#MariaYJuan2026');
    
    cy.get('input[name="instagramHandle"]').type('@bodademariajuan');
    cy.get('input[name="instagramHandle"]').should('have.value', '@bodademariajuan');
  });
});
