/// <reference types="Cypress" />

describe('Tests de Storage', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('puede escribir en localStorage', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('test_key', 'test_value');
      expect(win.localStorage.getItem('test_key')).to.equal('test_value');
    });
  });

  it('puede limpiar localStorage', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('test_key', 'test_value');
      win.localStorage.clear();
      expect(win.localStorage.getItem('test_key')).to.be.null;
    });
  });

  it('puede escribir en sessionStorage', () => {
    cy.window().then((win) => {
      win.sessionStorage.setItem('test_key', 'test_value');
      expect(win.sessionStorage.getItem('test_key')).to.equal('test_value');
    });
  });

  it('puede usar JSON en localStorage', () => {
    cy.window().then((win) => {
      const obj = { name: 'test', value: 123 };
      win.localStorage.setItem('test_json', JSON.stringify(obj));
      const retrieved = JSON.parse(win.localStorage.getItem('test_json'));
      expect(retrieved.name).to.equal('test');
      expect(retrieved.value).to.equal(123);
    });
  });

  it('mantiene datos entre navegaciones', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('persist_test', 'value1');
    });
    cy.reload();
    cy.window().then((win) => {
      expect(win.localStorage.getItem('persist_test')).to.equal('value1');
    });
  });

  it('puede manejar cookies', () => {
    cy.setCookie('test_cookie', 'cookie_value');
    cy.getCookie('test_cookie').should('have.property', 'value', 'cookie_value');
  });

  it('puede limpiar cookies', () => {
    cy.setCookie('test_cookie', 'cookie_value');
    cy.clearCookie('test_cookie');
    cy.getCookie('test_cookie').should('not.exist');
  });
});
