/// <reference types="cypress" />

describe('Composer inteligente y automatizaciones de email', () => {
  beforeEach(() => {
    cy.loginToLovenda('usuario.test@lovenda.com', 'password');
  });

  const stubEmptyMailApi = () => {
    cy.intercept('GET', '**/api/mail**', (req) => {
      if (req.url.includes('/api/mail/page')) {
        req.reply({ statusCode: 200, body: { items: [], nextCursor: null } });
      } else {
        req.reply({ statusCode: 200, body: [] });
      }
    }).as('mailApi');
  };

  it('permite redactar un correo con IA', () => {
    cy.intercept('GET', '**/api/email/templates', {
      statusCode: 200,
      body: [
        {
          id: 'smart-template-1',
          name: 'Plantilla IA',
          category: 'ia',
          subject: 'Consulta IA',
          body: 'Mensaje IA',
        },
      ],
    }).as('loadTemplates');

    cy.intercept('POST', '**/api/mail', {
      statusCode: 200,
      body: { success: true, id: 'sent-1' },
    }).as('sendMail');

    stubEmptyMailApi();
    cy.navigateToEmailInbox();
    cy.wait('@mailApi');

    cy.get('[data-testid="compose-button-ai"]').click();
    cy.get('[data-testid="smart-composer-modal"]').should('be.visible');

    cy.get('[data-testid="smart-recipient"]').clear().type('proveedor@example.com');
    cy.get('[data-testid="smart-subject"]').clear().type('Presupuesto fotografía');
    cy.get('[data-testid="smart-body"]').clear().type('Nos interesa coordinar una reunión.');

    cy.contains('button', 'Enviar').click();
    cy.wait('@sendMail');
    cy.get('[data-testid="smart-composer-modal"]').should('not.exist');
  });

  it('abre el asistente de calendario desde el detalle del email', () => {
    cy.intercept('POST', '**/api/email/calendar-event', {
      statusCode: 200,
      body: { success: true },
    }).as('calendarEvent');

    const mail = {
      id: 'mail-1',
      subject: 'Reunión con proveedor',
      from: 'contacto@proveedor.com',
      to: 'usuario.test@lovenda.com',
      body: 'Confirmamos la reunión el 15/10/2025 a las 17:00 en Madrid.',
      read: false,
      date: new Date().toISOString(),
    };

    cy.intercept('GET', '**/api/mail**', (req) => {
      if (req.url.includes('/api/mail/page')) {
        req.reply({ statusCode: 200, body: { items: [mail], nextCursor: null } });
      } else {
        req.reply({ statusCode: 200, body: [mail] });
      }
    }).as('mailApiDetail');

    cy.navigateToEmailInbox();
    cy.wait('@mailApiDetail');

    cy.get('[data-testid="email-list"] [role="row"]').first().click();
    cy.contains('button', 'Agendar evento').click();
    cy.get('[data-testid="calendar-integration"]').should('be.visible');
    cy.get('[data-testid="calendar-save"]').click();
    cy.wait('@calendarEvent');
  });

  it('muestra el widget de feedback y envía reseña', () => {
    cy.intercept('POST', '**/api/email-feedback', {
      statusCode: 200,
      body: { success: true },
    }).as('submitFeedback');

    stubEmptyMailApi();
    cy.navigateToEmailInbox();
    cy.wait('@mailApi');

    cy.get('[data-testid="feedback-toggle"]').click();

    cy.get('[data-testid="feedback-form-inner"]').within(() => {
      cy.contains('button', '4').click();
      cy.contains('Siguiente').click();
      cy.contains('Fácil de usar').click();
      cy.contains('Siguiente').click();
      cy.get('textarea[name="improvement"]').type('Todo perfecto');
      cy.contains('Enviar feedback').click();
    });

    cy.wait('@submitFeedback');
    cy.get('[data-testid="feedback-thanks"]').should('be.visible');
  });
});
