/// <reference types="Cypress" />

/**
 * Pruebas E2E para el bloque "Galería de inspiración" en la home.
 * Valida que:
 *  - Se solicitan las categorías esperadas al backend (decoración, cóctel, banquete, ceremonia, flores, vestidos, pasteles, fotografía).
 *  - Cada tarjeta del carrusel corresponde a la primera imagen de la categoría recibida.
 *  - El CTA "Inspiración para tu boda" navega a la vista completa.
 */

const CATEGORY_FIXTURES = [
  {
    slug: 'decoracion',
    label: 'Decoración',
    response: [
      {
        id: 'decoracion-pinterest',
        media_url: 'https://cdn.test/inspiration/decoracion-pinterest-main.jpg',
        description: 'Pinterest | Decoración principal',
        source: 'pinterest',
        tags: ['decoración', 'flores'],
      },
      {
        id: 'decoracion-instagram',
        media_url: 'https://cdn.test/inspiration/decoracion-instagram-alt.jpg',
        description: 'Instagram | Decoración alternativa',
        source: 'instagram',
        tags: ['decoración'],
      },
    ],
  },
  {
    slug: 'coctel',
    label: 'Cóctel',
    response: [
      {
        id: 'coctel-pinterest',
        media_url: 'https://cdn.test/inspiration/coctel-pinterest-main.jpg',
        description: 'Pinterest | Cóctel signature',
        source: 'pinterest',
        tags: ['cóctel'],
      },
      {
        id: 'coctel-instagram',
        media_url: 'https://cdn.test/inspiration/coctel-instagram-alt.jpg',
        description: 'Instagram | Barra de cóctel',
        source: 'instagram',
        tags: ['cóctel'],
      },
    ],
  },
  {
    slug: 'banquete',
    label: 'Banquete',
    response: [
      {
        id: 'banquete-pinterest',
        media_url: 'https://cdn.test/inspiration/banquete-pinterest-main.jpg',
        description: 'Pinterest | Banquete principal',
        source: 'pinterest',
        tags: ['banquete'],
      },
      {
        id: 'banquete-instagram',
        media_url: 'https://cdn.test/inspiration/banquete-instagram-alt.jpg',
        description: 'Instagram | Banquete alternativo',
        source: 'instagram',
        tags: ['banquete'],
      },
    ],
  },
  {
    slug: 'ceremonia',
    label: 'Ceremonia',
    response: [
      {
        id: 'ceremonia-pinterest',
        media_url: 'https://cdn.test/inspiration/ceremonia-pinterest-main.jpg',
        description: 'Pinterest | Ceremonia bajo luces',
        source: 'pinterest',
        tags: ['ceremonia'],
      },
      {
        id: 'ceremonia-instagram',
        media_url: 'https://cdn.test/inspiration/ceremonia-instagram-alt.jpg',
        description: 'Instagram | Ceremonia alternativa',
        source: 'instagram',
        tags: ['ceremonia'],
      },
    ],
  },
  {
    slug: 'flores',
    label: 'Flores',
    response: [
      {
        id: 'flores-pinterest',
        media_url: 'https://cdn.test/inspiration/flores-pinterest-main.jpg',
        description: 'Pinterest | Arreglo floral protagonista',
        source: 'pinterest',
        tags: ['flores'],
      },
      {
        id: 'flores-instagram',
        media_url: 'https://cdn.test/inspiration/flores-instagram-alt.jpg',
        description: 'Instagram | Bouquet alternativo',
        source: 'instagram',
        tags: ['flores'],
      },
    ],
  },
  {
    slug: 'vestido',
    label: 'Vestidos',
    response: [
      {
        id: 'vestido-pinterest',
        media_url: 'https://cdn.test/inspiration/vestido-pinterest-main.jpg',
        description: 'Pinterest | Vestido principal',
        source: 'pinterest',
        tags: ['vestido'],
      },
      {
        id: 'vestido-instagram',
        media_url: 'https://cdn.test/inspiration/vestido-instagram-alt.jpg',
        description: 'Instagram | Vestido alternativo',
        source: 'instagram',
        tags: ['vestido'],
      },
    ],
  },
  {
    slug: 'pastel',
    label: 'Pasteles',
    response: [
      {
        id: 'pastel-pinterest',
        media_url: 'https://cdn.test/inspiration/pastel-pinterest-main.jpg',
        description: 'Pinterest | Pastel principal',
        source: 'pinterest',
        tags: ['pastel'],
      },
      {
        id: 'pastel-instagram',
        media_url: 'https://cdn.test/inspiration/pastel-instagram-alt.jpg',
        description: 'Instagram | Pastel alternativo',
        source: 'instagram',
        tags: ['pastel'],
      },
    ],
  },
  {
    slug: 'fotografia',
    label: 'Fotografía',
    response: [
      {
        id: 'fotografia-pinterest',
        media_url: 'https://cdn.test/inspiration/fotografia-pinterest-main.jpg',
        description: 'Pinterest | Sesión fotográfica',
        source: 'pinterest',
        tags: ['fotografía'],
      },
      {
        id: 'fotografia-instagram',
        media_url: 'https://cdn.test/inspiration/fotografia-instagram-alt.jpg',
        description: 'Instagram | Sesión alternativa',
        source: 'instagram',
        tags: ['fotografía'],
      },
    ],
  },
];

const WALL_RESPONSES = CATEGORY_FIXTURES.reduce(
  (acc, { slug, response }) => ({ ...acc, [slug]: response }),
  {
    wedding: [
      {
        id: 'wedding-pinterest',
        media_url: 'https://cdn.test/inspiration/wedding-pinterest-main.jpg',
        description: 'Pinterest | General wedding mood',
        source: 'pinterest',
        tags: ['decoración', 'flores'],
      },
      {
        id: 'wedding-instagram',
        media_url: 'https://cdn.test/inspiration/wedding-instagram-alt.jpg',
        description: 'Instagram | General wedding highlight',
        source: 'instagram',
        tags: ['banquete'],
      },
    ],
  }
);

describe('Home - Galería de inspiración', () => {
  let requestedQueries;

  beforeEach(() => {
    requestedQueries = [];
    cy.window().then((win) => win.localStorage.clear());
    cy.loginToLovenda();

    const replyForQuery = (query = 'wedding', page = 1) => {
      const base = WALL_RESPONSES[query] || WALL_RESPONSES.wedding;
      // Asegurar IDs únicos si la vista pide varias páginas.
      return base.map((item, idx) => ({
        ...item,
        id: `${item.id}-p${page}-${idx}`,
      }));
    };

    cy.intercept('POST', '**/api/instagram-wall', (req) => {
      const { query, page } = req.body || {};
      if (query) {
        requestedQueries.push(query);
      }
      req.reply({
        statusCode: 200,
        body: replyForQuery(query, page || 1),
      });
    }).as('instagramWall');
  });

  it('muestra las categorías configuradas con la primera imagen de cada fuente', () => {
    cy.visit('/');

    // Esperar a que se hagan las peticiones de las cuatro categorías.
    CATEGORY_FIXTURES.forEach(() => cy.wait('@instagramWall'));

    cy.wrap(null).then(() => {
      CATEGORY_FIXTURES.forEach(({ slug }) => {
        expect(requestedQueries).to.include(slug);
      });
    });

    cy.contains('button', /Inspiraci/i)
      .closest('section')
      .as('gallerySection');

    cy.get('@gallerySection')
      .find('a.snap-start')
      .should('have.length', CATEGORY_FIXTURES.length)
      .each(($card, index) => {
        const { slug, label } = CATEGORY_FIXTURES[index];
        const expectedFirst = WALL_RESPONSES[slug][0].media_url;

        cy.wrap($card).find('p').invoke('text').should('eq', label);
        cy.wrap($card)
          .find('img')
          .invoke('attr', 'src')
          .then((src) => {
            const decoded = decodeURIComponent(src);
            expect(decoded).to.contain(expectedFirst);
          });
      });

    // CTA lleva a la vista completa de inspiración.
    cy.get('@gallerySection').find('button').first().click();
    cy.location('pathname').should('eq', '/inspiracion');
  });
});
