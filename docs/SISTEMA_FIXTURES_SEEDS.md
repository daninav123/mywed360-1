# 🧪 Sistema de Fixtures y Seeds - Documentación Completa

**Fecha:** 28 Diciembre 2025  
**Estado:** ✅ Implementado y funcional  
**Objetivo:** Resolver ~50 tests E2E inestables mediante datos deterministas

---

## 📋 Problema Resuelto

**Antes:**
- Tests E2E fallando por datos inconsistentes
- Seeds generando datos aleatorios
- Imposible reproducir fallos
- ~50 tests inestables

**Después:**
- Datos 100% deterministas y reproducibles
- IDs predecibles para debugging
- Tests estables y confiables
- Fixtures reutilizables

---

## 🏗️ Arquitectura

```
cypress/fixtures/          # Datos deterministas JSON
├── README.md             # Guía de uso
├── users.json           # 5 usuarios de test
├── weddings.json        # 3 bodas de prueba
├── guests.json          # 10 invitados
├── seating.json         # 4 mesas + asignaciones
├── finance.json         # Transacciones y pagos
├── tasks.json           # 8 tareas + checklist
└── suppliers.json       # 5 proveedores + cotizaciones

scripts/
├── fixtureLoader.js     # Cargador de fixtures
├── seedFromFixtures.js  # Seed determinista principal
├── cleanupTestData.js   # Limpieza de datos test
└── seedAllForTests.js   # Script maestro existente
```

---

## 🚀 Uso Rápido

### 1. Seed inicial (primera vez o reset completo)

```bash
npm run test:reset
```

Esto ejecuta:
1. Limpia todos los datos de test
2. Carga fixtures
3. Crea usuarios, bodas, invitados, etc.

### 2. Seed sin limpiar (actualizar datos)

```bash
npm run seed:fixtures
```

### 3. Solo limpiar datos de test

```bash
npm run test:cleanup
```

### 4. Seed con limpieza previa

```bash
npm run seed:fixtures:clean
```

---

## 📊 Datos Disponibles

### Usuarios (5)

| Email | Password | Rol | UID |
|-------|----------|-----|-----|
| planner@test.maloveapp.com | test123456 | planner | test-user-planner-001 |
| owner@test.maloveapp.com | test123456 | owner | test-user-owner-001 |
| assistant@test.maloveapp.com | test123456 | assistant | test-user-assistant-001 |
| supplier@test.maloveapp.com | test123456 | supplier | test-user-supplier-001 |
| admin@test.maloveapp.com | test123456 | admin | test-user-admin-001 |

### Bodas (3)

- **test-wedding-001:** "Boda Ana y Luis" (120 invitados, €25k presupuesto)
- **test-wedding-002:** "Boda María y Carlos" (80 invitados, €18k presupuesto)
- **test-wedding-minimal:** "Boda Mínima Test" (10 invitados, €5k presupuesto)

### Invitados (10 para wedding-001)

- test-guest-001 a test-guest-010
- Con estados variados: confirmed, pending, declined
- Restricciones dietéticas: vegetarian, vegan, gluten-free, lactose-free
- Asignados a 4 mesas diferentes

### Seating Plan

- 4 mesas configuradas (Mesa Presidencial + Mesa 1-3)
- 9 asignaciones de invitados
- Layouts: rectangular (presidencial) y round (resto)

### Finanzas

- Budget: €25,000 distribuido en 7 categorías
- 5 transacciones (3 pagadas, 1 pendiente, 1 ingreso)
- 2 pagos programados con plazos

### Tareas

- 8 tareas con estados variados (completed, in_progress, pending)
- Categorías: VENUE, CATERING, PHOTOGRAPHY, etc.
- Checklist de ceremonia y recepción

### Proveedores

- 5 proveedores en diferentes categorías
- 2 solicitudes de cotización (pending y responded)
- Rating 4.5-4.9 estrellas

---

## 💻 Uso en Tests E2E (Cypress)

### Cargar fixtures en un test

```javascript
describe('Test de Invitados', () => {
  beforeEach(() => {
    // Cargar fixtures
    cy.fixture('users.json').as('users');
    cy.fixture('guests.json').as('guests');
  });

  it('puede ver lista de invitados', function() {
    // Usar datos del fixture
    const planner = this.users.planner;
    const guests = this.guests.guests;
    
    // Login con credenciales deterministas
    cy.login(planner.email, planner.password);
    
    // Verificar datos esperados
    cy.visit('/invitados');
    cy.contains(guests[0].name).should('be.visible');
  });
});
```

### Acceso a IDs predecibles

```javascript
it('edita un invitado específico', () => {
  const guestId = 'test-guest-001'; // ID predecible
  cy.visit(`/invitados/${guestId}/edit`);
  cy.get('[data-testid="guest-name"]').should('have.value', 'Ana García López');
});
```

---

## 🔧 Uso en Scripts de Seed

### Cargar un fixture específico

```javascript
import { loadFixture } from './fixtureLoader.js';

const users = loadFixture('users.json');
const planner = users.planner;

console.log(planner.email); // planner@test.maloveapp.com
```

### Cargar todos los fixtures

```javascript
import { loadAllFixtures } from './fixtureLoader.js';

const fixtures = loadAllFixtures();

console.log(fixtures.users.planner.email);
console.log(fixtures.weddings.wedding001.name);
console.log(fixtures.guests.guests[0].name);
```

### Validar estructura de fixture

```javascript
import { validateFixture } from './fixtureLoader.js';

const users = loadFixture('users.json');
const isValid = validateFixture(users, ['planner', 'owner', 'assistant']);

if (!isValid) {
  console.error('Fixture inválido');
}
```

---

## 🎯 Convenciones de Naming

### IDs Deterministas

Todos los IDs siguen patrones predecibles:

- **Usuarios:** `test-user-{rol}-{número}` (ej: `test-user-planner-001`)
- **Bodas:** `test-wedding-{número}` (ej: `test-wedding-001`)
- **Invitados:** `test-guest-{número}` (ej: `test-guest-001`)
- **Mesas:** `test-table-{número}` (ej: `test-table-001`)
- **Proveedores:** `test-supplier-{número}` (ej: `test-supplier-001`)
- **Transacciones:** `test-txn-{número}` (ej: `test-txn-001`)
- **Tareas:** `test-task-{número}` (ej: `test-task-001`)

### Emails de Test

Todos los emails usan el dominio: `@test.maloveapp.com`

Nunca confundir con emails reales o de staging.

### Passwords

Todos los usuarios de test usan: `test123456`

⚠️ **NUNCA usar en producción**

---

## 🔍 Debugging

### Ver datos cargados

```bash
# Ver todos los fixtures disponibles
ls -la cypress/fixtures/

# Ver contenido de un fixture
cat cypress/fixtures/users.json | jq '.'
```

### Verificar datos en Firebase

Después de ejecutar el seed, verificar en Firebase Console:

1. **Authentication:** Buscar usuarios con `@test.maloveapp.com`
2. **Firestore → users:** Buscar documentos con `email` que contenga `@test`
3. **Firestore → weddings:** Buscar documentos con ID `test-wedding-*`

### Logs del seed

```bash
# Ejecutar seed con output completo
node scripts/seedFromFixtures.js --cleanup

# Ver resumen de lo creado
# El script muestra:
# - Usuarios creados
# - Bodas creadas
# - Invitados por boda
# - Transacciones
# - Etc.
```

---

## ⚠️ Importante

### Seguridad

1. **Nunca en producción:** Estos datos son SOLO para tests
2. **Emails falsos:** `@test.maloveapp.com` no es un dominio real
3. **Passwords débiles:** `test123456` es inseguro a propósito
4. **Limpiar después:** Usar `test:cleanup` después de tests locales

### Mantenimiento

1. **Actualizar fixtures:** Editar archivos JSON en `cypress/fixtures/`
2. **Nuevos campos:** Añadir a fixtures y al seed script
3. **Versionado:** Los fixtures están en Git para mantener consistencia
4. **Sincronización:** Si cambias estructura en fixtures, actualizar `seedFromFixtures.js`

### CI/CD

```yaml
# En tu pipeline de CI/CD
jobs:
  e2e-tests:
    steps:
      - name: Setup test data
        run: npm run test:reset
      
      - name: Run E2E tests
        run: npm run cypress:run
      
      - name: Cleanup
        run: npm run test:cleanup
```

---

## 🆘 Troubleshooting

### Error: "No se encontró archivo de service account"

**Solución:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccount.json"
# O colocar el archivo en la raíz del proyecto
```

### Error: "auth/uid-already-exists"

**Solución:**
```bash
# Limpiar datos existentes primero
npm run test:cleanup
# Luego volver a seed
npm run seed:fixtures
```

### Tests siguen fallando con fixtures

**Verificar:**
1. ¿Se ejecutó el seed antes de los tests?
2. ¿Los IDs en los tests coinciden con los fixtures?
3. ¿Firebase tiene los datos? (verificar en Console)
4. ¿Las reglas de Firestore permiten lectura/escritura?

### Fixtures no se cargan en Cypress

**Solución:**
```javascript
// Asegúrate de usar cy.fixture() en beforeEach
beforeEach(() => {
  cy.fixture('users.json').as('users');
});

// Y acceder con this.alias
it('test', function() {
  console.log(this.users); // ✅ Correcto
  // NO: cy.fixture() dentro del it()
});
```

---

## 📈 Próximos Pasos

### Fixtures adicionales a crear

- [ ] `emails.json` - Emails de prueba para inbox
- [ ] `protocols.json` - Datos de protocolo y ceremonias
- [ ] `designs.json` - Diseños de invitaciones
- [ ] `documents.json` - Documentos legales

### Mejoras futuras

- [ ] Generador de fixtures (faker.js)
- [ ] Fixtures parametrizados (variables)
- [ ] Snapshot testing con fixtures
- [ ] Fixtures compartidos entre proyectos

---

## 📚 Referencias

- **Fixtures README:** `cypress/fixtures/README.md`
- **Fixture Loader:** `scripts/fixtureLoader.js`
- **Seed Script:** `scripts/seedFromFixtures.js`
- **Cleanup Script:** `scripts/cleanupTestData.js`

---

**Última actualización:** 28 Diciembre 2025  
**Autor:** Sistema de Tests E2E  
**Estado:** ✅ Producción
