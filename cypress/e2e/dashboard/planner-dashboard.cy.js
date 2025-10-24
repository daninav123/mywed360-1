const plannerProfile = {
  id: 'planner-e2e',
  uid: 'planner-e2e',
  email: 'planner.e2e@test.com',
  name: 'Planner E2E',
  role: 'planner',
};

const plannerWeddings = [
  {
    id: 'wed-1',
    name: 'Boda Rivera',
    weddingDate: '2026-05-10',
    location: 'Madrid',
    progress: 45,
    active: true,
    role: 'planner',
  },
  {
    id: 'wed-2',
    name: 'Boda Ortega',
    weddingDate: '2026-07-18',
    location: 'Barcelona',
    progress: 30,
    active: true,
    role: 'planner',
  },
];

const notificationsResponse = [
  {
    id: 'notif-1',
    message: 'Tarea crítica vencida',
    read: false,
    payload: { weddingId: 'wed-1', category: 'tasks', severity: 'high' },
  },
  {
    id: 'notif-2',
    message: 'Proveedor sin respuesta',
    read: false,
    payload: { weddingId: 'wed-1', category: 'providers', severity: 'medium' },
  },
  {
    id: 'notif-3',
    message: 'RSVP sin confirmar',
    read: false,
    payload: { weddingId: 'wed-2', category: 'rsvp', severity: 'medium' },
  },
];

const blogStub = [
  {
    id: 'blog-1',
    title: 'Tendencias de decoración 2026',
    url: 'https://blog.example.com/tendencias-2026',
    source: 'MaLoveApp Editorial',
  },
  {
    id: 'blog-2',
    title: 'Checklist de proveedores imprescindibles',
    url: 'https://blog.example.com/proveedores-imprescindibles',
    source: 'Wedding Pro Magazine',
  },
  {
    id: 'blog-3',
    title: 'Cómo optimizar la comunicación con la pareja',
    url: 'https://blog.example.com/comunicacion-pareja',
    source: 'Wedding Guru',
  },
];

const inspirationReply = (slug) => [
  {
    id: `img-${slug}`,
    url: `https://cdn.test/${slug}.jpg`,
    thumb: `https://cdn.test/${slug}-thumb.jpg`,
    description: `Inspiración ${slug}`,
  },
];

function configurePlannerSession({
  meetings = [],
  suppliers = [],
  weddings = plannerWeddings,
  activeWeddingId = plannerWeddings[0].id,
} = {}) {
  cy.loginToLovenda(plannerProfile.email);
  cy.window().then((win) => {
    try {
      win.localStorage.clear();
    } catch {}
    const profile = {
      ...plannerProfile,
      preferences: { theme: 'light', language: 'es' },
    };
    const token = `mock-token-${Date.now()}`;
    try {
      win.localStorage.setItem('mw360_auth_token', token);
    } catch {}
    win.__MOCK_WEDDING__ = {
      weddings,
      activeWedding: { id: activeWeddingId },
    };
    try {
      win.localStorage.setItem('MaLoveApp_user_profile', JSON.stringify(profile));
      win.localStorage.setItem('maloveapp_user', JSON.stringify(profile));
      win.localStorage.setItem('maloveapp_user', JSON.stringify(profile));
      win.localStorage.setItem('maloveapp_active_wedding', activeWeddingId || '');
      win.localStorage.setItem('maloveapp_active_wedding', activeWeddingId || '');
      win.localStorage.setItem('maloveapp_cached_weddings', JSON.stringify(weddings));
      win.localStorage.setItem('maloveapp_stub_weddings_enabled', 'true');
      win.localStorage.setItem(
        '__maloveapp_stub_weddings_store__',
        JSON.stringify({
          users: {
            [profile.uid]: {
              weddings,
              activeWeddingId: activeWeddingId || (weddings[0]?.id || ''),
            },
          },
        })
      );
      if (activeWeddingId) {
        win.localStorage.setItem(
          `maloveapp_${activeWeddingId}_meetings`,
          JSON.stringify(meetings)
        );
        win.localStorage.setItem(
          `maloveapp_${activeWeddingId}_suppliers`,
          JSON.stringify(suppliers)
        );
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('configurePlannerSession failed', error);
    }
  });
}

describe('PlannerDashboard', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/notifications**', {
      statusCode: 200,
      body: notificationsResponse,
    }).as('getNotifications');

    cy.intercept('POST', '**/api/instagram-wall', (req) => {
      const slug = req.body?.query || 'decoracion';
      req.reply({ statusCode: 200, body: inspirationReply(slug) });
    }).as('getWall');

    cy.intercept('POST', '**/api/instagram/wall', (req) => {
      const slug = req.body?.query || 'decoracion';
      req.reply({ statusCode: 200, body: inspirationReply(slug) });
    }).as('getWallLegacy');

    cy.intercept('GET', '**/api/wedding-news**', {
      statusCode: 200,
      body: blogStub,
    }).as('getWeddingNews');
  });

  it('shows planner metrics, inspiration and blog entries', () => {
    configurePlannerSession({
      meetings: [
        { id: 'meet-1', title: 'Visita finca', completed: false },
        { id: 'meet-2', title: 'Reunión catering', completed: true },
      ],
      suppliers: [{ id: 'sup-1' }, { id: 'sup-2' }, { id: 'sup-3' }],
    });

    cy.visit('/home');
    cy.closeDiagnostic();

    cy.wait('@getNotifications');
    cy.wait('@getWeddingNews');
    cy.wait('@getWall');

    cy.contains('Panel de Wedding Planner').should('be.visible');

    cy.get('[data-testid="planner-card-bodas-activas"]')
      .find('[data-testid="planner-card-bodas-activas-value"]')
      .should('have.text', '2');

    cy.get('[data-testid="planner-card-alertas"]')
      .find('[data-testid="planner-card-alertas-value"]')
      .should('have.text', '3');

    cy.get('[data-testid="planner-card-tareas"]')
      .find('[data-testid="planner-card-tareas-value"]')
      .should('have.text', '1');

    cy.get('[data-testid="planner-card-proveedores"]')
      .find('[data-testid="planner-card-proveedores-value"]')
      .should('have.text', '3');

    cy.contains('Inspiración reciente').should('be.visible');
    cy.get('section[aria-labelledby="planner-inspiration-heading"]')
      .find('button[aria-label^="Abrir "]')
      .should('have.length', 4);
    cy.get('section[aria-labelledby="planner-inspiration-heading"] [role="status"]').should(
      'not.exist'
    );

    cy.contains('Blogs destacados').should('be.visible');
    cy.get('section[aria-labelledby="planner-blog-heading"] li').should(
      'have.length',
      blogStub.length
    );
    cy.get('section[aria-labelledby="planner-blog-heading"] li')
      .first()
      .should('contain.text', blogStub[0].title)
      .find('a')
      .should('have.attr', 'href', blogStub[0].url);
  });

  it('shows empty state when planner has no weddings', () => {
    configurePlannerSession({
      weddings: [],
      activeWeddingId: '',
    });

    cy.visit('/home');
    cy.closeDiagnostic();

    cy.contains('Aún no tienes bodas vinculadas').should('be.visible');
    cy.contains('Ir a gestión de bodas').should('have.attr', 'href', '/bodas');
  });

  it('handles inspiration, blog and alert failures gracefully', () => {
    cy.intercept('GET', '**/api/notifications**', { statusCode: 500, body: {} }).as(
      'getNotificationsError'
    );
    cy.intercept('POST', '**/api/instagram-wall', { statusCode: 500, body: [] }).as(
      'getWallError'
    );
    cy.intercept('POST', '**/api/instagram/wall', { statusCode: 500, body: [] }).as(
      'getWallLegacyError'
    );
    cy.intercept('GET', '**/api/wedding-news**', { statusCode: 500, body: [] }).as(
      'getWeddingNewsError'
    );

    configurePlannerSession({
      meetings: [{ id: 'meet-1', completed: false }],
      suppliers: [{ id: 'sup-1' }],
    });

    cy.visit('/home');
    cy.closeDiagnostic();

    cy.wait('@getNotificationsError');
    cy.wait('@getWeddingNewsError');
    cy.wait('@getWallError');

    cy.get('[data-testid="planner-card-alertas"]')
      .find('[data-testid="planner-card-alertas-value"]')
      .should('have.text', '0');

    cy.contains('No se pudieron cargar las imágenes de inspiración.').should('be.visible');
    cy.contains('No se pudieron cargar las noticias del blog.').should('be.visible');
  });
});
