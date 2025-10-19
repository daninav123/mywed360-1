const stubRemoved = (name) => {
  throw new Error(`[Cypress ${name}] Helper retirado: ya no se permiten stubs. Actualiza la prueba para preparar datos reales.`);
};

Cypress.Commands.add('loginAsStubUser', () => stubRemoved('loginAsStubUser'));
Cypress.Commands.add('logoutStubUser', () => stubRemoved('logoutStubUser'));
Cypress.Commands.add('mockWeddingSwitch', () => stubRemoved('mockWeddingSwitch'));
