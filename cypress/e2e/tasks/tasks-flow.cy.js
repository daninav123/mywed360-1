/**
 * Test E2E: Gestión de Tareas
 * Verifica checklist y subtareas
 */

describe('Flujo de Gestión de Tareas', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
    cy.window().then((win) => {
      win.localStorage.setItem('userSession', JSON.stringify({
        token: 'test-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }));
    });
  });

  it('debe mostrar checklist de tareas', () => {
    cy.visit('http://localhost:5173/tasks');
    cy.contains('Tareas', { timeout: 10000 }).should('be.visible');
  });

  it('debe crear nueva tarea', () => {
    cy.visit('http://localhost:5173/tasks');
    cy.wait(1000);
    
    cy.contains('Nueva tarea', { matchCase: false }).click();
    cy.get('input[name="title"]').type('Reservar fotógrafo');
    cy.get('textarea[name="description"]').type('Contactar con fotógrafos recomendados');
    cy.get('input[name="dueDate"]').type('2026-01-15');
    cy.contains('Guardar').click();
    
    cy.contains('Reservar fotógrafo', { timeout: 5000 }).should('be.visible');
  });

  it('debe marcar tarea como completada', () => {
    cy.visit('http://localhost:5173/tasks');
    cy.wait(1000);
    
    cy.get('[data-testid="task-checkbox"]').first().check();
    cy.get('[data-testid="task-completed"]').should('exist');
  });

  it('debe crear subtareas', () => {
    cy.visit('http://localhost:5173/tasks');
    cy.wait(1000);
    
    cy.get('[data-testid="task-item"]').first().click();
    cy.contains('Agregar subtarea').click();
    
    cy.get('input[name="subtaskTitle"]').type('Revisar portfolio');
    cy.contains('Añadir').click();
    
    cy.contains('Revisar portfolio').should('be.visible');
  });

  it('debe filtrar tareas por estado', () => {
    cy.visit('http://localhost:5173/tasks');
    cy.wait(1000);
    
    cy.get('select[name="filter"]').select('pending');
    cy.wait(500);
    
    cy.get('[data-status="pending"]').should('exist');
  });

  it('debe ordenar tareas por fecha', () => {
    cy.visit('http://localhost:5173/tasks');
    cy.wait(1000);
    
    cy.contains('Ordenar por fecha').click();
    cy.get('[data-testid="task-item"]').first().should('exist');
  });

  it('debe eliminar tarea', () => {
    cy.visit('http://localhost:5173/tasks');
    cy.wait(1000);
    
    cy.get('[data-testid="delete-task"]').first().click();
    cy.contains('Confirmar').click();
    
    cy.contains('eliminada', { matchCase: false, timeout: 5000 }).should('be.visible');
  });
});
