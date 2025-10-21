/// <reference types="cypress" />

/**
 * E2E: Lectura básica de un email en la bandeja unificada
 * - Pre-carga correos en localStorage para evitar dependencias de backend/Firestore
 * - Abre la bandeja, lista correos, entra al detalle y valida elementos clave
 */

describe('Email - lectura básica', () => {
  const seedMails = () => ([
    {
      id: 'mail_1',
      from: 'proveedor@example.com',
      to: 'usuario@mywed360.com',
      subject: 'Presupuesto de fotografía',
      body: '<p>Adjuntamos propuesta de presupuesto.</p>',
      folder: 'inbox',
      date: new Date().toISOString(),
      read: false,
      attachments: [],
    },
    {
      id: 'mail_2',
      from: 'invitado@example.com',
      to: 'usuario@mywed360.com',
      subject: 'Confirmación de asistencia',
      body: '<p>Confirmamos asistencia (2 personas).</p>',
      folder: 'inbox',
      date: new Date(Date.now() - 3600_000).toISOString(),
      read: true,
      attachments: [],
    },
  ]);

  const seedAuth = () => ({
    myWed360Email: 'usuario@mywed360.com',
    email: 'usuario@mywed360.com',
    userId: 'e2e-user',
  });

  beforeEach(() => {
    // Interceptar llamada de emails para devolver nuestros mails seed
    cy.intercept('GET', '**/api/email/**', {
      statusCode: 200,
      body: {
        success: true,
        data: seedMails()
      }
    }).as('getEmails');
    
    cy.loginToLovenda('usuario@mywed360.com', 'password123');
  });

  it('Lista correos y abre un email mostrando el detalle', () => {
    cy.visit('/email');

    // Esperar a que cargue
    cy.wait('@getEmails', { timeout: 10000 });
    
    // Título de bandeja
    cy.get('[data-testid="email-title"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain.text', 'Recibidos');

    // Lista con elementos (puede tardar en cargar)
    cy.get('[data-testid="email-list"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="email-list-item"]', { timeout: 5000 })
      .should('have.length.at.least', 1);

    // Abrir el primer correo
    cy.get('[data-testid="email-list-item"]').first().click();

    // Esperar a que cargue el detalle
    cy.wait(1000);

    // Validar que aparece el botón "Responder" del detalle
    cy.contains('button', /Responder|Reply/i, { timeout: 5000 }).should('be.visible');

    // Validar que se muestra el asunto en el detalle
    cy.contains('Presupuesto de fotografía', { timeout: 5000 }).should('be.visible');
  });
});
