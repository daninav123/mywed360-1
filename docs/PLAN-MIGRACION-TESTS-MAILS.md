# 🧪 PLAN DE MIGRACIÓN: TESTS E2E DE MAILS

**Fecha:** 23 de Octubre de 2025  
**Estado:** 🔴 PENDIENTE  
**Prioridad:** ALTA

---

## 📊 SITUACIÓN ACTUAL

### Estado de Tests E2E (Total: 105)
- ✅ **Pasando:** 27/105 (26%)
- ❌ **Fallando:** 78/105 (74%)

### Tests de Email Específicos (Total: 10)
- ❌ **Fallando:** 10/10 (100%)
- **Causa principal:** Apuntan a componentes legacy, no a UnifiedInbox

---

## 🎯 OBJETIVO

Migrar los 10 tests E2E de email para que:
1. Usen componente **UnifiedInbox** (no EmailInbox legacy)
2. Usen **data-testids actualizados**
3. **Pasen correctamente** (0 fallos)

**Meta:** 10/10 tests pasando (100%)

---

## 📋 INVENTARIO DE TESTS A MIGRAR

### Grupo 1: Tests Críticos (Prioridad ALTA) - 4 tests

| # | Archivo | Estado | Componente Actual | Componente Correcto | ETA |
|---|---------|--------|-------------------|---------------------|-----|
| 1 | `send-email.cy.js` | ❌ | EmailComposer legacy | UnifiedInbox + ComposeModal | 2h |
| 2 | `read-email.cy.js` | ❌ | EmailInbox legacy | InboxContainer | 1.5h |
| 3 | `folders-management.cy.js` | ❌ | EmailInbox + FolderSelectionModal | InboxContainer + CustomFolders | 3h |
| 4 | `send-email-validation.cy.js` | ❌ | EmailComposer | ComposeModal | 1h |

**Total Grupo 1:** ~7.5 horas

---

### Grupo 2: Tests Importantes (Prioridad MEDIA) - 3 tests

| # | Archivo | Estado | Componente Actual | Componente Correcto | ETA |
|---|---------|--------|-------------------|---------------------|-----|
| 5 | `read-email-list.cy.js` | ❌ | EmailInbox | InboxContainer + EmailList | 1.5h |
| 6 | `read-email-open.cy.js` | ❌ | EmailDetail legacy | InboxContainer + EmailDetail | 1h |
| 7 | `read-email-attachments.cy.js` | ❌ | EmailDetail | EmailDetail (UnifiedInbox) | 1h |

**Total Grupo 2:** ~3.5 horas

---

### Grupo 3: Tests Avanzados (Prioridad BAJA) - 3 tests

| # | Archivo | Estado | Componente Actual | Componente Correcto | ETA |
|---|---------|--------|-------------------|---------------------|-----|
| 8 | `tags-filters.cy.js` | ❌ | EmailInbox | InboxContainer + filtros | 2h |
| 9 | `smart-composer.cy.js` | ❌ | SmartEmailComposer | SmartEmailComposer (validar) | 1.5h |
| 10 | `ai-provider-email.cy.js` | ❌ | ProviderSearchModal | ProviderSearchModal (validar) | 1.5h |

**Total Grupo 3:** ~5 horas

---

**TOTAL ESTIMADO:** 16 horas de trabajo

---

## 🔧 CAMBIOS REQUERIDOS POR TEST

### 1. send-email.cy.js

**Selectores a cambiar:**

```javascript
// ❌ ANTES (Legacy)
cy.get('[data-testid="email-composer"]')
cy.get('[data-testid="recipient-input"]')
cy.get('[data-testid="subject-input"]')
cy.get('[data-testid="body-editor"]')
cy.get('[data-testid="send-button"]')

// ✅ DESPUÉS (UnifiedInbox)
cy.visit('/email') // InboxContainer
cy.get('[data-testid="compose-button"]').click() // Abre ComposeModal
cy.get('[data-testid="email-composer"]') // Ahora es ComposeModal
cy.get('[data-testid="recipient-input"]')
cy.get('[data-testid="subject-input"]')
cy.get('[data-testid="body-editor"]')
cy.get('[data-testid="send-button"]')
cy.get('[data-testid="success-message"]')
```

**Cambios adicionales:**
- Esperar a que InboxContainer cargue
- Verificar que el email aparece en "Enviados"

---

### 2. read-email.cy.js

**Selectores a cambiar:**

```javascript
// ❌ ANTES (Legacy)
cy.visit('/email/inbox')
cy.get('[data-testid="email-list"]')
cy.get('[data-testid="email-list-item"]').first().click()

// ✅ DESPUÉS (UnifiedInbox)
cy.visit('/email') // InboxContainer por defecto es inbox
cy.get('[data-testid="email-list"]') // Ahora es EmailList de UnifiedInbox
cy.get('[data-testid="email-list-item"]').first().click()
cy.get('[data-testid="email-detail"]') // EmailDetail dentro de InboxContainer
```

**Cambios adicionales:**
- Validar que sidebar muestra "Bandeja de entrada" activo
- Verificar contadores de no leídos

---

### 3. folders-management.cy.js

**Selectores a cambiar:**

```javascript
// ❌ ANTES (Legacy)
cy.get('[data-testid="folder-item"][data-folder="sent"]')
cy.get('[data-testid="new-folder-button"]')
cy.get('[data-testid="folder-name-input"]')
cy.get('[data-testid="save-folder-button"]')

// ✅ DESPUÉS (UnifiedInbox)
cy.visit('/email')
cy.get('[data-testid="folders-sidebar"]')
cy.get('[data-testid="folder-item"][data-folder="inbox"]') // Verificar inbox activo
cy.get('[data-testid="folder-item"][data-folder="sent"]').click() // Cambiar a enviados

// Crear carpeta personalizada
cy.get('[data-testid="manage-folders-button"]').click() // Abre ManageFoldersModal
cy.get('[data-testid="new-folder-button"]').click()
cy.get('[data-testid="folder-name-input"]').type('Trabajo')
cy.get('[data-testid="save-folder-button"]').click()

// Mover email a carpeta
cy.get('[data-testid="email-list-item"]').first().click()
cy.get('[data-testid="move-to-folder-button"]').click()
cy.get('[data-testid="folder-menu"]')
cy.get('[data-testid="folder-menu-item"][data-folder="custom:trabajo"]').click()
```

**Cambios adicionales:**
- Validar que la carpeta aparece en sidebar
- Verificar que el email se movió correctamente
- Test de eliminar carpeta personalizada
- Test de vaciar papelera

---

### 4. send-email-validation.cy.js

**Selectores a cambiar:**

```javascript
// ❌ ANTES (Legacy)
cy.get('[data-testid="send-button"]').click()
cy.get('[data-testid="error-message"]').should('contain', 'Destinatario es obligatorio')

// ✅ DESPUÉS (UnifiedInbox)
cy.visit('/email')
cy.get('[data-testid="compose-button"]').click()

// Test: enviar sin destinatario
cy.get('[data-testid="send-button"]').click()
cy.get('[data-testid="error-message"]').should('be.visible')
cy.get('[data-testid="error-message"]').should('contain', 'Destinatario')

// Test: enviar sin asunto
cy.get('[data-testid="recipient-input"]').type('test@example.com')
cy.get('[data-testid="send-button"]').click()
cy.get('[data-testid="error-message"]').should('contain', 'asunto')

// Test: enviar sin cuerpo
cy.get('[data-testid="subject-input"]').type('Test')
cy.get('[data-testid="send-button"]').click()
cy.get('[data-testid="error-message"]').should('contain', 'contenido')
```

---

### 5-7. Tests de Lectura (read-email-*.cy.js)

**Patrón común:**

```javascript
// Setup
cy.visit('/email')
cy.get('[data-testid="folders-sidebar"]').should('be.visible')

// Navegar a carpeta
cy.get('[data-testid="folder-item"][data-folder="inbox"]').click()

// Esperar carga
cy.get('[data-testid="email-list"]').should('be.visible')

// Seleccionar email
cy.get('[data-testid="email-list-item"]').first().click()

// Validar detalle
cy.get('[data-testid="email-detail"]').should('be.visible')
```

---

### 8-10. Tests Avanzados

**Requieren validación adicional:**
- Verificar que IA está configurada (VITE_ENABLE_AI_*)
- Verificar que backend responde
- Mocks para OpenAI si es necesario

---

## 📦 COMPONENTES Y DATA-TESTIDS

### InboxContainer.jsx (Bandeja principal)

```jsx
<div data-testid="inbox-container">
  <aside data-testid="folders-sidebar">
    <div data-testid="folder-item" data-folder="inbox" />
    <div data-testid="folder-item" data-folder="sent" />
    <div data-testid="folder-item" data-folder="trash" />
    <div data-testid="folder-item" data-folder="custom:trabajo" />
    
    <button data-testid="manage-folders-button" />
    <button data-testid="empty-trash-button" /> {/* Solo visible en trash */}
  </aside>
  
  <main>
    <header data-testid="inbox-header">
      <input data-testid="email-search-input" />
      <button data-testid="compose-button" />
      <button data-testid="compose-button-ai" />
    </header>
    
    <EmailList data-testid="email-list" />
    <EmailDetail data-testid="email-detail" />
  </main>
</div>
```

### EmailList.jsx

```jsx
<div data-testid="email-list">
  <div data-testid="email-list-item" /> {/* Múltiples */}
  <p data-testid="empty-folder-message" /> {/* Si no hay emails */}
</div>
```

### EmailDetail.jsx (dentro de InboxContainer)

```jsx
<div data-testid="email-detail">
  <button data-testid="move-to-folder-button" />
  <button data-testid="delete-email-button" />
  <button data-testid="restore-email-button" /> {/* Solo en trash */}
  <button data-testid="delete-forever-button" /> {/* Solo en trash */}
</div>
```

### ComposeModal.jsx

```jsx
<div data-testid="email-composer">
  <input data-testid="recipient-input" />
  <input data-testid="subject-input" />
  <textarea data-testid="body-editor" />
  <button data-testid="send-button" />
  <button data-testid="cancel-button" />
  <div data-testid="success-message" />
  <div data-testid="error-message" />
</div>
```

### CustomFolders.jsx / ManageFoldersModal.jsx

```jsx
<div data-testid="folders-manager-modal">
  <button data-testid="new-folder-button" />
  
  <div data-testid="folder-row"> {/* Múltiples */}
    <input data-testid="folder-name-input" />
    <button data-testid="save-folder-button" />
    <button data-testid="delete-folder-button" />
  </div>
  
  <button data-testid="confirm-delete-button" />
  <button data-testid="close-modal-button" />
</div>
```

---

## 🚀 PLAN DE EJECUCIÓN

### Fase 1: Preparación (1 día)
- [ ] Revisar que todos los data-testids existen en componentes
- [ ] Crear entorno de test con datos mock consistentes
- [ ] Configurar backend de test o mocks

### Fase 2: Migración Grupo 1 (2 días)
- [ ] Migrar send-email.cy.js (2h)
- [ ] Migrar read-email.cy.js (1.5h)
- [ ] Migrar folders-management.cy.js (3h)
- [ ] Migrar send-email-validation.cy.js (1h)
- [ ] **Validar:** 4/4 tests pasando

### Fase 3: Migración Grupo 2 (1 día)
- [ ] Migrar read-email-list.cy.js (1.5h)
- [ ] Migrar read-email-open.cy.js (1h)
- [ ] Migrar read-email-attachments.cy.js (1h)
- [ ] **Validar:** 7/10 tests pasando

### Fase 4: Migración Grupo 3 (1-2 días)
- [ ] Migrar tags-filters.cy.js (2h)
- [ ] Migrar smart-composer.cy.js (1.5h)
- [ ] Migrar ai-provider-email.cy.js (1.5h)
- [ ] **Validar:** 10/10 tests pasando ✅

### Fase 5: Integración y CI (0.5 días)
- [ ] Ejecutar suite completa
- [ ] Integrar en pipeline CI/CD
- [ ] Actualizar documentación
- [ ] Actualizar roadmap con nuevas métricas

---

## ✅ CRITERIOS DE ÉXITO

1. **10/10 tests de email pasando** (100%)
2. **0 tests fallando** en suite de email
3. **Tiempo de ejecución** < 5 minutos
4. **Cobertura** de flujos principales: envío, lectura, carpetas, validación
5. **CI/CD** ejecuta tests automáticamente en PRs

---

## 📊 MÉTRICAS ESPERADAS

### Antes de Migración
- Tests de email: 0/10 pasando (0%)
- Tests totales: 27/105 pasando (26%)

### Después de Migración
- Tests de email: 10/10 pasando (100%) ✅
- Tests totales: 37/105 pasando (35%)

**Mejora:** +10 tests, +9% cobertura total

---

## 🛠️ COMANDOS ÚTILES

```bash
# Ejecutar solo tests de email
npm run cypress:run -- --spec "cypress/e2e/email/**/*.cy.js"

# Ejecutar un test específico
npm run cypress:run -- --spec "cypress/e2e/email/send-email.cy.js"

# Modo interactivo (desarrollo)
npm run cypress:open

# Ver resultados
cat cypress/results/*.xml | grep -E "(pass|fail)"
```

---

## 📚 REFERENCIAS

- `docs/EMAIL_SYSTEM_FIX.md` - data-testids agregados
- `docs/flujos-especificos/flujo-7-comunicacion-emails.md` - Especificación funcional
- `src/components/email/UnifiedInbox/` - Componentes actuales
- `cypress/e2e/email/` - Tests a migrar

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. ✅ Crear este documento
2. ⏳ Revisar data-testids en componentes UnifiedInbox
3. ⏳ Preparar datos mock para tests
4. ⏳ Empezar migración Grupo 1 (tests críticos)

---

**Última actualización:** 23 de Octubre de 2025, 5:25am  
**Responsable:** QA Squad  
**Próxima revisión:** Tras completar Fase 2
