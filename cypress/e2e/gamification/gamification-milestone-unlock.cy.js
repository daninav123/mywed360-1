/// <reference types="Cypress" />

/**
 * Flujo 17 – Gamificación y progreso.
 * Cobertura E2E: contrato de `GET /api/gamification/achievements`.
 * Verifica que el backend expone un array de logros (vacío o con datos) accesible para otros módulos.
 */
describe('Gamificación · API achievements', () => {
  const weddingId = 'e2e-gamification-award';
  const uid = 'mock-gamification-user';
  const email = 'gamification-achievements@lovenda.test';
  const authHeaders = {
    Authorization: `Bearer mock-${uid}-${email}`,
  };

  before(function () {
    if (!Cypress.env('BACKEND_BASE_URL')) {
      cy.log('BACKEND_BASE_URL no definido. Se omite suite de achievements.');
      this.skip();
    }
  });

  it('devuelve una lista de logros con el esquema esperado', () => {
    cy.request({
      method: 'GET',
      url: `/api/gamification/achievements?weddingId=${encodeURIComponent(
        weddingId
      )}&uid=${encodeURIComponent(uid)}`,
      headers: authHeaders,
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body).to.have.property('success', true);
      expect(body.achievements).to.be.an('array');

      body.achievements.forEach((achievement) => {
        expect(achievement).to.be.an('object');
        expect(achievement).to.have.any.keys('id', 'name');
        if (achievement.description) {
          expect(achievement.description).to.be.a('string');
        }
        if (achievement.unlockedAt) {
          expect(achievement.unlockedAt).to.be.a('string');
        }
      });
    });
  });
});
