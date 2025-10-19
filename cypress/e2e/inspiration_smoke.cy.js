/// <reference types="Cypress" />

const IMG_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

const WALL_ITEMS = [
  {
    id: 'img-flores-1',
    media_url: IMG_PLACEHOLDER,
    thumb: IMG_PLACEHOLDER,
    tags: ['flores'],
  },
  {
    id: 'img-decoracion-1',
    media_url: IMG_PLACEHOLDER,
    thumb: IMG_PLACEHOLDER,
    tags: ['decoracion'],
  },
  {
    id: 'img-flores-2',
    media_url: IMG_PLACEHOLDER,
    thumb: IMG_PLACEHOLDER,
    tags: ['flores', 'decoracion'],
  },
];

function stubWallEndpoint() {
  const handler = (req) => {
    req.reply({
      statusCode: 200,
      body: WALL_ITEMS,
    });
  };
  cy.intercept('POST', '**/api/instagram-wall', handler).as('fetchWall');
  cy.intercept('POST', '**/api/instagram/wall', handler);
}

function stubIntersectionObserver(win) {
  class FakeObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    disconnect() {}
    unobserve() {}
  }
  win.IntersectionObserver = FakeObserver;
}

describe('Inspiración · favoritos y filtros', () => {
  beforeEach(() => {
    Cypress.env('STUB_FIRESTORE', true);
    stubWallEndpoint();
    cy.loginToLovenda();
    cy.visit('/inspiracion', {
      onBeforeLoad: (win) => {
        stubIntersectionObserver(win);
      },
    });
    cy.wait('@fetchWall');
  });

  it('guarda un elemento en favoritos y lo mantiene tras recargar', () => {
    cy.get('button[aria-label*="favoritos"]').first().click();

    cy.window().then((win) => {
      const key = Object.keys(win.localStorage).find((k) =>
        k.startsWith('inspirationFavorites')
      );
      expect(key, 'clave de favoritos').to.exist;
      const stored = JSON.parse(win.localStorage.getItem(key) || '[]');
      expect(stored.map((item) => item.id)).to.include('img-flores-1');
    });

    cy.reload({ onBeforeLoad: (win) => stubIntersectionObserver(win) });
    cy.wait('@fetchWall');

    cy.get('button[aria-label*="Quitar"]').should('have.length.at.least', 1);
  });

  it('filtra por etiqueta mostrando solo los elementos correspondientes', () => {
    cy.get('[data-testid="inspiration-tag-flores"]').click();
    cy.get('img[aria-label*="Inspiraci"]').should('have.length', 2);

    cy.get('[data-testid="inspiration-tag-decoracion"]').click();
    cy.get('img[aria-label*="Inspiraci"]').should('have.length', 2);

    cy.get('img[aria-label*="decoracion"]').each(($img) => {
      const label = $img.attr('aria-label') || '';
      expect(label.toLowerCase()).to.contain('decoracion');
    });
  });
});
