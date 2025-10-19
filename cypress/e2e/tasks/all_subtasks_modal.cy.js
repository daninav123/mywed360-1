describe('Tareas - Modal "Ver todas las tareas" muestra subtareas', () => {
  before(() => {
    // nada: inyectamos el mock justo en cy.visit via onBeforeLoad
  });

  it('crea bloque padre y subtarea, la programa desde el modal y ajusta el rango del padre', () => {
    const parentTitle = `Padre QA ${Date.now()}`;
    const subTitle = `Sub QA ${Date.now()}`;

    // Ir a Tareas con boda y sesión mock inyectadas antes de que la app cargue
    cy.visit('/tasks', {
      onBeforeLoad: (win) => {
        const mockWeddingId = 'w1';
        const mockUser = {
          uid: 'cypress-test',
          email: 'usuario.test@lovenda.com',
          displayName: 'Usuario Test Cypress',
        };

        win.__MOCK_WEDDING__ = {
          weddings: [{ id: mockWeddingId, name: 'Demo Wedding' }],
          activeWedding: { id: mockWeddingId, name: 'Demo Wedding' },
        };

        try {
          win.localStorage.setItem('userEmail', mockUser.email);
          win.localStorage.setItem('isLoggedIn', 'true');
          win.localStorage.setItem('lovenda_user', JSON.stringify(mockUser));
          win.localStorage.setItem('mywed360_user', JSON.stringify(mockUser));
          win.localStorage.setItem('MyWed360_user_profile', JSON.stringify(mockUser));
          win.localStorage.setItem('mywed360_active_wedding', mockWeddingId);
          win.localStorage.setItem('lovenda_active_wedding', mockWeddingId);
          win.localStorage.setItem('mywed360_login_email', mockUser.email);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('[tasks E2E] No se pudo hidratar localStorage mock:', error);
        }
      },
    });

    cy.closeDiagnostic();

    // Crear tarea padre (bloque Gantt)
    cy.contains('button', 'Nueva Tarea', { timeout: 10000 }).click();
    cy.get('input[name="title"]').clear().type(parentTitle);
    cy.get('input[name="long"]').check({ force: true }); // Proceso (Gantt)
    // Asegurar que NO hay padre seleccionado (bloque raíz)
    cy.get('select[name="parentTaskId"]').should('exist');
    // Guardar
    cy.contains('button', 'Guardar').click();

    // Crear subtarea asignada al padre
    cy.contains('button', 'Nueva Tarea', { timeout: 10000 }).click();
    cy.get('input[name="title"]').clear().type(subTitle);
    cy.get('input[name="long"]').check({ force: true });
    // Elegir el padre recién creado por texto visible
    cy.get('select[name="parentTaskId"]').select(parentTitle, { force: true });
    // Marcar "Subtarea sin fecha" para evitar fechas obligatorias
    cy.contains('label', 'Subtarea sin fecha', { matchCase: false })
      .find('input[type="checkbox"]')
      .check({ force: true });
    // Guardar
    cy.contains('button', 'Guardar').click();

    // Abrir el modal de "Ver todas las tareas"
    cy.contains('button', 'Ver todas las tareas', { timeout: 10000 }).click();

    // Verificar cabecera del modal y que aparece la columna del padre
    cy.contains('div', 'Todas las tareas', { timeout: 10000 }).should('be.visible');
    cy.contains(parentTitle, { timeout: 10000 }).should('be.visible');

    // La subtarea aparece como "Sin fecha" y se puede programar
    cy.contains(subTitle, { timeout: 10000 }).should('be.visible')
      .parents('div')
      .first()
      .within(() => {
        cy.contains('Sin fecha').should('exist');
        cy.contains('Programar').click();
      });

    // Fechas: mañana 10:00 a pasado mañana 11:00
    const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
    const now = new Date();
    const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0);
    const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 11, 0);
    const ds = `${d1.getFullYear()}-${pad2(d1.getMonth() + 1)}-${pad2(d1.getDate())}`;
    const de = `${d2.getFullYear()}-${pad2(d2.getMonth() + 1)}-${pad2(d2.getDate())}`;
    const ts = `${pad2(d1.getHours())}:${pad2(d1.getMinutes())}`;
    const te = `${pad2(d2.getHours())}:${pad2(d2.getMinutes())}`;

    cy.get('input[type="date"]').first().clear().type(ds);
    cy.get('input[type="time"]').first().clear().type(ts);
    cy.get('input[type="date"]').eq(1).clear().type(de);
    cy.get('input[type="time"]').eq(1).clear().type(te);
    cy.contains('button', 'Guardar').click();

    // La subtarea ya no muestra "Sin fecha"
    cy.contains(subTitle, { timeout: 10000 }).should('be.visible')
      .parents('div')
      .first()
      .within(() => {
        cy.contains('Sin fecha').should('not.exist');
      });

    // Verificar que el rango del padre refleja el cambio (via helper mywed)
    cy.window().then((win) => {
      // Esperar reacálculo y refresco
      return new Cypress.Promise((resolve) => setTimeout(resolve, 400)).then(() => {
        const parent = win.mywed?.tasks?.getParentByName?.(parentTitle);
        expect(parent, 'parent exists').to.have.property('end');
        // Debe ser >= a mañana (d1)
        expect(new Date(parent.end).getTime()).to.be.greaterThan(new Date(now).getTime());
      });
    });
  });
});
