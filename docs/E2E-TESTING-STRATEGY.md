# Estrategia de Testing E2E - MaLove.App

## 🎯 Objetivo

Convertir todos los tests E2E de mocks/stubs a tests que usen **integración real** con:
- ✅ Firebase Auth (autenticación real)
- ✅ Firestore (datos reales en entorno de test)
- ✅ Backend API (http://localhost:4004)
- ✅ Mailgun (dominio mg.malove.app)
- ✅ OpenAI (API real con límites)

## 📋 Plan de Migración

### **Fase 1: Infraestructura Base** ✅

#### 1.1 Comandos Cypress Actualizados
- [x] `loginToLovenda()` - Login con Firebase Auth real
- [x] `createTestUser()` - Crear usuario real en Firebase
- [x] `createTestWedding()` - Crear boda real en Firestore
- [x] `cleanupTestData()` - Limpiar datos de test después de cada suite

#### 1.2 Hooks de Setup/Teardown
- [x] `before()` - Crear usuario y boda de test
- [x] `after()` - Limpiar datos de test
- [x] `beforeEach()` - Login automático
- [x] `afterEach()` - Captura de screenshots en fallos

### **Fase 2: Tests por Módulo**

#### 2.1 Autenticación (Auth) 🔄
**Archivos:**
- `auth/auth-flow.cy.js`
- `auth/flow1-signup.cy.js`
- `auth/flow1-password-reset.cy.js`
- `auth/flow1-social-login.cy.js`
- `auth/flow1-verify-email.cy.js`
- `critical/auth.cy.js`

**Cambios necesarios:**
- Usar Firebase Auth real (`signInWithEmailAndPassword`)
- Crear usuarios reales con `createUserWithEmailAndPassword`
- Verificar tokens JWT reales
- Test de reset password con emails reales

#### 2.2 Dashboard y Navegación 🔄
**Archivos:**
- `dashboard/main-navigation.cy.js`
- `dashboard/global-search-shortcuts.cy.js`
- `dashboard/diagnostic-panel.cy.js`
- `dashboard/planner-dashboard.cy.js`
- `critical/dashboard.cy.js`

**Cambios necesarios:**
- Verificar carga real de datos desde Firestore
- Test de navegación entre módulos reales
- Verificar estado de bodas reales
- Test de búsqueda con datos reales

#### 2.3 Invitados (Guests) 🔄
**Archivos:**
- `critical/guests.cy.js`
- `guests/*.cy.js`

**Cambios necesarios:**
- CRUD de invitados en Firestore
- Verificar permisos reales
- Test de importación CSV con datos reales
- Test de filtros y búsqueda

#### 2.4 Email 🔄
**Archivos:**
- `email/send-email.cy.js`
- `email/read-email.cy.js`
- `email/folders-management.cy.js`
- `email/ai-provider-email.cy.js`
- `email/smart-composer.cy.js`
- `email/tags-filters.cy.js`
- `email_inbox_smoke.cy.js`

**Cambios necesarios:**
- Envío real de emails via backend API
- Verificar emails en Mailgun
- Test de carpetas con localStorage real
- Test de AI composer con OpenAI real (limitado)

#### 2.5 Blog 🔄
**Archivos:**
- `blog/blog-listing.cy.js`
- `blog/blog-article.cy.js`
- `blog/blog-subscription.cy.js`
- `blog/blog-debug.cy.js`

**Cambios necesarios:**
- Cargar artículos reales desde Firestore
- Test de suscripción con emails reales
- Verificar SEO meta tags

#### 2.6 Contratos (Contracts) 🔄
**Archivos:**
- `contracts/contracts-flow.cy.js`

**Cambios necesarios:**
- CRUD de contratos en Firestore
- Verificar permisos de usuario
- Test de firma digital

#### 2.7 Finanzas (Finance) 🔄
**Archivos:**
- `finance/finance-advisor-chat.cy.js`

**Cambios necesarios:**
- Test de chat con AI real
- Verificar cálculos de presupuesto
- Test de categorías de gastos

#### 2.8 Seating Plan 🔄
**Archivos:**
- `seating/*.cy.js`

**Cambios necesarios:**
- Test de disposición de mesas con datos reales
- Drag & drop de invitados
- Validaciones de capacidad

#### 2.9 Admin 🔄
**Archivos:**
- `admin/admin-flow.cy.js`

**Cambios necesarios:**
- Login como admin real
- Test de gestión de usuarios
- Test de configuración global

#### 2.10 Otros Módulos 🔄
**Archivos:**
- `budget_flow.cy.js`
- `compose_quick_replies.cy.js`
- `account/role-upgrade-flow.cy.js`
- `assistant/chat-fallback-context.cy.js`

### **Fase 3: Configuración de Entorno**

#### 3.1 Variables de Entorno para Tests
```bash
# .env.test
CYPRESS_BASE_URL=http://localhost:5173
CYPRESS_BACKEND_URL=http://localhost:4004
CYPRESS_USE_REAL_FIREBASE=true
CYPRESS_FIREBASE_PROJECT_ID=maloveapp-98c77
CYPRESS_TEST_USER_EMAIL=cypress-test@malove.app
CYPRESS_TEST_USER_PASSWORD=TestPassword123!
```

#### 3.2 Firestore Test Environment
- Usar colección separada: `test_users`, `test_weddings`, `test_guests`
- Limpiar datos automáticamente después de cada suite
- Usar índices específicos para tests

#### 3.3 Rate Limiting para APIs Externas
- **OpenAI**: Máximo 5 llamadas por suite de tests
- **Mailgun**: Usar email de test `cypress-test@mg.malove.app`
- **Firebase**: Sin límite (proyecto propio)

## 🔧 Comandos Cypress Mejorados

### `cy.loginToLovenda(email, password)`
```javascript
Cypress.Commands.add('loginToLovenda', (email, password) => {
  cy.visit('/login');
  
  // Usar Firebase Auth real
  cy.window().then(async (win) => {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const auth = win.firebaseAuth; // Auth instance del app
    
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email || 'cypress-test@malove.app',
      password || 'TestPassword123!'
    );
    
    // Esperar a que el token se guarde
    cy.wait(1000);
    cy.url().should('not.include', '/login');
  });
});
```

### `cy.createTestWedding(data)`
```javascript
Cypress.Commands.add('createTestWedding', (data = {}) => {
  return cy.window().then(async (win) => {
    const { collection, addDoc } = await import('firebase/firestore');
    const db = win.firebaseDb;
    const auth = win.firebaseAuth;
    const userId = auth.currentUser.uid;
    
    const weddingData = {
      name: data.name || 'Boda Test Cypress',
      date: data.date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      venue: data.venue || 'Lugar Test',
      ownerIds: [userId],
      plannerIds: data.plannerIds || [],
      assistantIds: data.assistantIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      ...data
    };
    
    const docRef = await addDoc(
      collection(db, 'users', userId, 'weddings'),
      weddingData
    );
    
    return { id: docRef.id, ...weddingData };
  });
});
```

### `cy.cleanupTestData()`
```javascript
Cypress.Commands.add('cleanupTestData', () => {
  return cy.window().then(async (win) => {
    const auth = win.firebaseAuth;
    const db = win.firebaseDb;
    
    if (!auth.currentUser) return;
    
    const userId = auth.currentUser.uid;
    
    // Eliminar bodas de test
    const weddingsRef = collection(db, 'users', userId, 'weddings');
    const snapshot = await getDocs(weddingsRef);
    
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    // Logout
    await signOut(auth);
  });
});
```

## 📊 Métricas de Éxito

### Antes (Mocks)
- ❌ Tests no detectan bugs reales
- ❌ No validan integración entre módulos
- ❌ No prueban APIs externas
- ⚠️ 74% de tests fallando

### Después (Integración Real)
- ✅ Tests detectan bugs de integración
- ✅ Validan flujo completo de usuario
- ✅ Prueban APIs reales (con límites)
- 🎯 Objetivo: 90%+ tests pasando

## 🚀 Ejecución

### Tests Completos
```bash
npm run test:e2e
```

### Tests por Módulo
```bash
npm run test:e2e:auth
npm run test:e2e:email
npm run test:e2e:guests
```

### Tests Críticos (Smoke)
```bash
npm run test:e2e:critical
```

## 📝 Checklist de Migración

- [ ] Fase 1: Infraestructura Base
  - [ ] Actualizar comandos Cypress
  - [ ] Configurar Firebase para tests
  - [ ] Crear hooks de setup/teardown
  
- [ ] Fase 2: Migrar tests por módulo
  - [ ] Auth (5 archivos)
  - [ ] Dashboard (4 archivos)
  - [ ] Guests (múltiples)
  - [ ] Email (12 archivos)
  - [ ] Blog (4 archivos)
  - [ ] Contracts (1 archivo)
  - [ ] Finance (1 archivo)
  - [ ] Seating (múltiples)
  - [ ] Admin (1 archivo)
  - [ ] Otros (4 archivos)
  
- [ ] Fase 3: Configuración y Optimización
  - [ ] Variables de entorno
  - [ ] Rate limiting
  - [ ] CI/CD integration
  
## 🔗 Referencias

- [Documentación Cypress](https://docs.cypress.io)
- [Firebase Auth Testing](https://firebase.google.com/docs/auth/web/start)
- [Firestore Testing](https://firebase.google.com/docs/firestore/quickstart)
