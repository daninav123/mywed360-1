# Tests E2E de Internacionalización (i18n)

Esta carpeta contiene tests end-to-end completos para verificar que el sistema de internacionalización funciona correctamente en todo el proyecto.

## 📋 Suite de Tests

### 00-smoke-test-i18n.cy.js

**Tests básicos de verificación**

- Configuración de i18next
- Idiomas disponibles
- Selector de idioma
- Cambio básico de idioma
- Persistencia básica
- Modo debug
- Comandos Cypress personalizados

**Ejecutar**: `npm run cy:run -- --spec "cypress/e2e/i18n/00-smoke-test-i18n.cy.js"`

### 01-language-selector.cy.js

**Tests del componente LanguageSelector**

- Visibilidad del selector
- Apertura/cierre del dropdown
- Tecla ESC para cerrar
- Checkmark en idioma actual
- Cambio de idioma mediante clic
- Persistencia en localStorage
- Responsividad móvil

**Ejecutar**: `npm run cy:run -- --spec "cypress/e2e/i18n/01-language-selector.cy.js"`

### 02-multi-language-navigation.cy.js

**Tests de navegación multi-idioma**

- Verificación en español, inglés y francés
- Cambio dinámico de contenido
- Persistencia entre páginas
- Compatibilidad de navegadores
- Diferentes viewports

**Ejecutar**: `npm run cy:run -- --spec "cypress/e2e/i18n/02-multi-language-navigation.cy.js"`

### 03-debug-mode.cy.js

**Tests del modo debug i18n**

- Activación del modo debug
- Panel de debug visual
- Detección de claves faltantes
- Exportación de claves
- Funciones globales de debug
- Salida del modo debug

**Ejecutar**: `npm run cy:run -- --spec "cypress/e2e/i18n/03-debug-mode.cy.js"`

### 04-language-persistence.cy.js

**Tests de persistencia de idioma**

- Almacenamiento en localStorage
- Persistencia entre páginas
- Persistencia después de recargas
- Sincronización entre tabs
- Recuperación de errores
- Cambios múltiples de idioma

**Ejecutar**: `npm run cy:run -- --spec "cypress/e2e/i18n/04-language-persistence.cy.js"`

### 05-translation-coverage.cy.js

**Tests de cobertura de traducciones**

- Verificación por página
- Detección de claves faltantes
- Detección de texto hardcodeado
- Consistencia entre idiomas
- Exportación de reportes
- Métricas de cobertura

**Ejecutar**: `npm run cy:run -- --spec "cypress/e2e/i18n/05-translation-coverage.cy.js"`

---

## 🚀 Ejecución de Tests

### Todos los tests de i18n

```bash
npm run cy:run -- --spec "cypress/e2e/i18n/**/*.cy.js"
```

### Con interfaz gráfica

```bash
npm run cy:open
# Luego seleccionar la carpeta i18n
```

### Un test específico

```bash
npm run cy:run -- --spec "cypress/e2e/i18n/00-smoke-test-i18n.cy.js"
```

### En modo headless (CI)

```bash
npm run test:e2e:i18n
```

---

## 🛠️ Comandos Cypress Personalizados

Los siguientes comandos están disponibles en todos los tests:

### `cy.changeLanguage(languageCode)`

Cambia el idioma usando el selector de idioma de la UI.

```javascript
cy.changeLanguage('en');
```

### `cy.setLanguageProgrammatically(languageCode)`

Cambia el idioma programáticamente desde la consola.

```javascript
cy.setLanguageProgrammatically('fr');
```

### `cy.verifyCurrentLanguage(expectedLanguage)`

Verifica que el idioma actual es el esperado.

```javascript
cy.verifyCurrentLanguage('es');
```

### `cy.shouldNotContainI18nKey(selector)`

Verifica que un elemento no contiene una clave i18n visible.

```javascript
cy.get('button').shouldNotContainI18nKey();
```

### `cy.enableI18nDebugMode()`

Activa el modo debug de i18n.

```javascript
cy.enableI18nDebugMode();
```

### `cy.getMissingI18nKeys()`

Obtiene las claves faltantes detectadas.

```javascript
cy.getMissingI18nKeys().then((keys) => {
  cy.log('Claves faltantes:', keys);
});
```

### `cy.resetI18nMissingKeys()`

Limpia el log de claves faltantes.

```javascript
cy.resetI18nMissingKeys();
```

---

## 📊 Cobertura de Idiomas

Los tests verifican los siguientes idiomas:

| Idioma     | Código      | Prioridad | Estado Tests |
| ---------- | ----------- | --------- | ------------ |
| Español    | `es`        | 🔴 Alta   | ✅ Completo  |
| Inglés     | `en`        | 🔴 Alta   | ✅ Completo  |
| Francés    | `fr`        | 🔴 Alta   | ✅ Completo  |
| Alemán     | `de`        | 🟡 Media  | ✅ Completo  |
| Italiano   | `it`        | 🟡 Media  | ✅ Completo  |
| Portugués  | `pt`        | 🟡 Media  | ✅ Completo  |
| Modo Debug | `en-x-i18n` | -         | ✅ Completo  |

---

## 🎯 Qué Verifica Cada Suite

### ✅ Funcionalidad Básica

- [ ] Sistema i18n está configurado
- [ ] Selector de idioma visible
- [ ] Cambio de idioma funciona
- [ ] Idioma persiste en localStorage

### ✅ UI/UX

- [ ] Dropdown se abre/cierra correctamente
- [ ] Tecla ESC cierra el dropdown
- [ ] Checkmark muestra idioma actual
- [ ] Responsive en móvil

### ✅ Persistencia

- [ ] Idioma persiste en localStorage
- [ ] Idioma persiste entre páginas
- [ ] Idioma persiste después de recargas
- [ ] Maneja localStorage corrupto

### ✅ Modo Debug

- [ ] Modo debug se activa
- [ ] Panel de debug aparece
- [ ] Detecta claves faltantes
- [ ] Exporta reporte JSON
- [ ] Funciones globales disponibles

### ✅ Cobertura

- [ ] Páginas críticas traducidas
- [ ] Sin texto hardcodeado
- [ ] Sin claves visibles en producción
- [ ] Estructura consistente entre idiomas

---

## 📝 Convenciones de Testing

### Estructura de Tests

```javascript
describe('Funcionalidad principal', () => {
  beforeEach(() => {
    // Setup común
    cy.visit('/');
    cy.wait(1000);
  });

  describe('Sub-funcionalidad', () => {
    it('Debe hacer algo específico', () => {
      // Test específico
    });
  });
});
```

### Waits Recomendados

- Después de cambiar idioma: `cy.wait(500)`
- Después de cargar página: `cy.wait(1000)`
- Después de abrir dropdown: `cy.wait(300)`
- Entre cambios rápidos: `cy.wait(100)`

### Manejo de Errores

```javascript
cy.visit('/', { failOnStatusCode: false });
cy.get('body').then(($body) => {
  if ($body.find('.selector').length > 0) {
    // Hacer algo
  }
});
```

---

## 🐛 Debugging

### Ver logs de i18n en consola

```javascript
cy.window().then((win) => {
  console.log('Idioma actual:', win.__I18N_INSTANCE__.language);
  console.log('Claves faltantes:', win.__I18N_MISSING_KEYS__);
});
```

### Capturar screenshots en fallos

Los tests automáticamente capturan screenshots en:
`cypress/screenshots/i18n/`

### Ver videos de ejecución

Los videos se guardan en:
`cypress/videos/i18n/`

---

## 📈 Métricas de Éxito

Para considerar que el sistema i18n está funcionando correctamente:

- ✅ **100%** de smoke tests pasando
- ✅ **95%+** de tests de selector pasando
- ✅ **90%+** de tests de navegación pasando
- ✅ **100%** de tests de persistencia pasando
- ✅ **95%+** de tests de modo debug pasando
- ✅ **Menos de 50** claves faltantes en idiomas principales

---

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
- name: Run i18n E2E Tests
  run: npm run test:e2e:i18n
```

### Reporte de Resultados

Los tests generan reportes en formato JUnit:
`cypress/results/i18n-*.xml`

---

## 📚 Recursos

- [Documentación i18n del proyecto](../../../docs/i18n-debug-guide.md)
- [Cypress Documentation](https://docs.cypress.io)
- [i18next Documentation](https://www.i18next.com/)
- [React i18next](https://react.i18next.com/)

---

**Última actualización**: 2025-01-02  
**Versión**: 1.0.0  
**Mantenedor**: Daniel Navarro Campos
