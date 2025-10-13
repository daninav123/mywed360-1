/// <reference types="Cypress" />

/**
 * Flujo 17 – Gamificación y progreso.
 * Cobertura E2E alineada con la especificación vigente:
 *   - Persistencia del progreso ocurre en backend, sin UI.
 *   - Se valida que `POST /api/gamification/award` actualiza el total expuesto por `GET /stats`.
 */
describe('Gamificación · API award & stats', () => {
  const weddingId = 'e2e-gamification-award';
  const uid = 'mock-gamification-user';
  const email = 'gamification-award@lovenda.test';
  const authHeaders = {
    Authorization: `Bearer mock-${uid}-${email}`,
  };

  before(function () {
    if (!Cypress.env('BACKEND_BASE_URL')) {
      cy.log('BACKEND_BASE_URL no definido. Se omite suite de API de gamificación.');
      this.skip();
    }
  });

  it('otorga puntos y refleja el total en /stats', function () {
    const awardBody = {
      weddingId,
      uid,
      eventType: 'complete_task',
      meta: {
        source: 'cypress-award-flow17',
        issuedAt: Date.now(),
      },
    };

    cy.request({
      method: 'POST',
      url: '/api/gamification/award',
      headers: authHeaders,
      body: awardBody,
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body).to.have.property('success', true);
      expect(body.result).to.include.keys('totalPoints', 'level', 'levelName', 'added');

      const expectedTotal = body.result.totalPoints;

      cy.request({
        method: 'GET',
        url: `/api/gamification/stats?weddingId=${encodeURIComponent(
          weddingId
        )}&uid=${encodeURIComponent(uid)}`,
        headers: authHeaders,
      }).then(({ status: statsStatus, body: statsBody }) => {
        expect(statsStatus).to.eq(200);
        expect(statsBody).to.have.property('success', true);
        expect(statsBody.stats).to.include.keys('totalPoints', 'level', 'levelName');
        expect(statsBody.stats.totalPoints).to.eq(expectedTotal);

        cy.request({
          method: 'GET',
          url: `/api/gamification/events?weddingId=${encodeURIComponent(
            weddingId
          )}&uid=${encodeURIComponent(uid)}&limit=5`,
          headers: authHeaders,
        }).then(({ status: eventsStatus, body: eventsBody }) => {
          expect(eventsStatus).to.eq(200);
          expect(eventsBody).to.have.property('success', true);
          expect(eventsBody.events).to.be.an('array');

          const storedEvent = eventsBody.events.find(
            (event) => event.eventType === 'complete_task'
          );

          expect(
            storedEvent,
            'el evento otorgado debe registrarse en gamificationEvents'
          ).to.exist;
          expect(storedEvent.totalPointsAfter).to.eq(expectedTotal);
        });
      });
    });
  });
});
