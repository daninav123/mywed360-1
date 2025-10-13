/// <reference types="Cypress" />

// Flujo 20: Inspiración Visual
// - Carga del muro con datos combinados (Pinterest + Instagram)
// - Marcar favorito y consultar pestaña de favoritos
// - Filtrar por etiqueta específica y abrir/cerrar el lightbox

describe('Flujo 20 - Inspiración Visual', () => {
  const WALL_RESPONSES = {
    wedding: [
      {
        id: 'wedding-pinterest',
        media_url: 'https://cdn.test/inspiration/wedding-pinterest-main.jpg',
        description: 'Pinterest | Idea general',
        source: 'pinterest',
        tags: ['decoración', 'flores'],
      },
      {
        id: 'wedding-instagram',
        media_url: 'https://cdn.test/inspiration/wedding-instagram-main.jpg',
        description: 'Instagram | Highlight general',
        source: 'instagram',
        tags: ['banquete'],
      },
    ],
    flores: [
      {
        id: 'flores-pinterest',
        media_url: 'https://cdn.test/inspiration/flores-pinterest-main.jpg',
        description: 'Pinterest | Flores protagonistas',
        source: 'pinterest',
        tags: ['flores'],
      },
      {
        id: 'flores-instagram',
        media_url: 'https://cdn.test/inspiration/flores-instagram-alt.jpg',
        description: 'Instagram | Flores secundarias',
        source: 'instagram',
        tags: ['flores'],
      },
    ],
  };

  const setupWallIntercept = () => {
    cy.intercept('POST', '**/api/instagram-wall', (req) => {
      const { query = 'wedding', page = 1 } = req.body || {};
      const base = WALL_RESPONSES[query] || WALL_RESPONSES.wedding;

      req.reply({
        statusCode: 200,
        body: base.map((item, idx) => ({
          ...item,
          id: `${item.id}-p${page}-${idx}`,
        })),
      });
    }).as('instagramWall');
  };

  beforeEach(() => {
    cy.window().then((win) => win.localStorage.clear());
    cy.loginToLovenda();
    setupWallIntercept();
  });

  it('gestiona favoritos, filtros y lightbox con fuentes mixtas', () => {
    cy.visit('/inspiracion');

    cy.wait('@instagramWall');

    cy.get('img[alt]', { timeout: 15000 }).should('have.length.at.least', 2);

    // Verifica que el feed muestra imágenes provenientes de Pinterest e Instagram.
    cy.get('img[alt]').should(($imgs) => {
      const sources = Array.from($imgs).map((img) => decodeURIComponent(img.src));
      expect(sources.some((src) => src.includes('pinterest'))).to.be.true;
      expect(sources.some((src) => src.includes('instagram'))).to.be.true;
    });

    // Marcar favorito en la primera tarjeta.
    cy.get('div.relative.group')
      .first()
      .within(() => {
        cy.get('button[aria-label="Añadir a favoritos"]').click({ force: true });
      });

    // Ir a favoritos y comprobar que aparece la imagen marcada.
    cy.get('[data-testid="inspiration-tag-favs"]').click();
    cy.get('img[alt]', { timeout: 10000 }).should('have.length.at.least', 1);

    // Volver a la vista general.
    cy.get('[data-testid="inspiration-tag-all"]').click();

    // Filtrar por etiqueta "flores" y comprobar que se usan los datos stub.
    cy.get('[data-testid="inspiration-tag-flores"]').click();
    cy.wait('@instagramWall');
    cy.get('img[alt]')
      .first()
      .invoke('attr', 'src')
      .then((src) => {
        const decoded = decodeURIComponent(src);
        expect(decoded).to.contain('flores-pinterest-main');
      });

    // Abrir el lightbox y cerrarlo.
    cy.get('img[alt]').first().click({ force: true });
    cy.get('div.fixed.inset-0').should('exist');
    cy.get('button[aria-label="Cerrar"]').click();
    cy.get('div.fixed.inset-0').should('not.exist');
  });
});
