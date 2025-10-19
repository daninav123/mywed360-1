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

  it('Lista correos y abre un email mostrando el detalle', () => {
    cy.visit('/email', {
      onBeforeLoad: (win) => {
        try {
          win.localStorage.setItem('mywed360_mails', JSON.stringify(seedMails()));
          win.localStorage.setItem('mywed360.email.init', JSON.stringify({ t: Date.now(), ...seedAuth() }));
        } catch {}
      },
    });

    // Título de bandeja
    cy.get('[data-testid="email-title"]').should('be.visible').and('contain.text', 'Recibidos');

    // Lista con elementos
    cy.get('[data-testid="email-list"]').should('be.visible');
    cy.get('[data-testid="email-list-item"]').should('have.length.at.least', 1);

    // Abrir el primer correo
    cy.get('[data-testid="email-list-item"]').first().click();

    // Validar que aparece el botón "Responder" del detalle
    cy.contains('button', 'Responder').should('be.visible');

    // Validar que se muestra el asunto en el detalle
    cy.contains('Presupuesto de fotografía').should('be.visible');
  });
});
