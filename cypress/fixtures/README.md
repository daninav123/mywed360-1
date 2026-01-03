# 🧪 Fixtures para Tests E2E

Sistema de fixtures deterministas para garantizar tests estables y reproducibles.

## 📁 Estructura

```
fixtures/
├── README.md              # Esta guía
├── users.json            # Usuarios de prueba
├── weddings.json         # Bodas de prueba
├── guests.json           # Invitados deterministas
├── seating.json          # Configuración seating plan
├── finance.json          # Datos financieros
├── tasks.json            # Tareas y checklist
├── suppliers.json        # Proveedores
├── emails.json           # Emails de prueba
└── protocols.json        # Protocolo y ceremonias
```

## 🎯 Principios

1. **Determinismo:** Los datos siempre generan el mismo resultado
2. **Aislamiento:** Cada test puede usar su propio conjunto de datos
3. **Limpieza:** Los datos se pueden resetear fácilmente
4. **Completitud:** Fixtures cubren todos los casos de uso comunes

## 📖 Uso en Tests

### Cargar fixtures en Cypress

```javascript
// En tu test
describe('Mi test', () => {
  beforeEach(() => {
    cy.fixture('users.json').as('users');
    cy.fixture('weddings.json').as('weddings');
  });

  it('usa datos de fixture', function() {
    const testUser = this.users.planner;
    cy.login(testUser.email, testUser.password);
  });
});
```

### Cargar fixtures en scripts de seed

```javascript
import { loadFixture } from './fixtureLoader.js';

const users = await loadFixture('users.json');
const planner = users.planner;
// Usar datos...
```

## 🔑 IDs Estables

Todos los fixtures usan IDs predecibles:

- **Usuarios:** `test-user-planner-001`, `test-user-owner-001`, etc.
- **Bodas:** `test-wedding-001`, `test-wedding-002`, etc.
- **Invitados:** `test-guest-001`, `test-guest-002`, etc.

## 🧹 Limpieza

Para limpiar datos de test:

```bash
# Limpiar todos los datos de test
npm run test:cleanup

# Limpiar y recrear fixtures
npm run test:reset
```

## ⚠️ Importante

- **NO usar en producción:** Estos datos son solo para tests
- **Passwords de test:** Todos usan `test123456` (nunca en producción)
- **Emails de test:** Todos usan `@test.maloveapp.com`
- **IDs únicos:** Siempre con prefijo `test-`
