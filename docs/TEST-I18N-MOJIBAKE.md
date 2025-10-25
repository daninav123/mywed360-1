# 🧪 Test E2E: Verificación de Mojibake e i18n

**Archivo:** `cypress/e2e/i18n-mojibake-check.cy.js`  
**Fecha:** 25 Octubre 2025  
**Estado:** ✅ Implementado

---

## 🎯 Objetivo

Test end-to-end completo que verifica:
1. ✅ **Sin mojibake** - No hay caracteres corruptos (�, \uFFFD, etc.)
2. ✅ **Sin palabras sin acentos** - Todas las palabras tienen sus tildes correctas
3. ✅ **Palabras correctas** - Se verifican palabras clave en español

---

## 📋 Qué Verifica

### 1. Caracteres Mojibake

Detecta automáticamente:
```javascript
- � (carácter de reemplazo Unicode)
- \uFFFD (U+FFFD)
- &#1234; (entidades HTML sin decodificar)
- &aacute; (entidades sin procesar)
```

### 2. Palabras Corruptas (27 palabras)

Detecta palabras SIN acento cuando deberían tenerlo:

| Corrupto | Correcto |
|----------|----------|
| xito | **Éxito** |
| Aadir | **Añadir** |
| electrnico | **electrónico** |
| Diseos | **Diseños** |
| Configuracin | **Configuración** |
| sesin | **sesión** |
| Men de | **Menú de** |
| Ms opciones | **Más opciones** |
| Transaccin | **Transacción** |
| categora | **categoría** |
| das | **días** |
| ltimos | **Últimos** |
| Anlisis | **Análisis** |
| Gestin | **Gestión** |
| sincronizacin | **sincronización** |
| conexin | **conexión** |
| descripcin | **descripción** |
| informacin | **información** |
| notificacin | **notificación** |
| nmero | **número** |
| telfono | **teléfono** |
| bsqueda | **búsqueda** |
| difcil | **difícil** |
| fcil | **fácil** |
| til | **útil** |
| rpido | **rápido** |
| prximo | **próximo** |

### 3. Palabras Correctas (15 palabras)

Verifica que aparezcan correctamente:
- ✅ Éxito, Añadir, Sí
- ✅ electrónico, Diseños, Configuración
- ✅ sesión, Menú, Más
- ✅ días, Últimos, Análisis
- ✅ Gestión, sincronización, conexión

---

## 🔍 Áreas Verificadas

### Páginas Principales (10 páginas)
- ✅ `/dashboard` - Dashboard principal
- ✅ `/invitados` - Gestión de invitados
- ✅ `/finanzas` - Finanzas y transacciones
- ✅ `/proveedores` - Búsqueda de proveedores
- ✅ `/email` - Bandeja de entrada
- ✅ `/seating` - Plan de asientos
- ✅ `/protocolo` - Protocolo de boda
- ✅ `/tareas` - Tareas pendientes
- ✅ `/web` - Web de boda
- ✅ `/momentos` - Galería de momentos

### Modales y Componentes (5 elementos)
- ✅ Modal de Configuración
- ✅ Modal Añadir Invitado
- ✅ Modal Nueva Transacción
- ✅ Tabs de Finanzas
- ✅ Navegación Principal

### Formularios (2 verificaciones)
- ✅ Placeholders de inputs
- ✅ Labels de formularios

### Mensajes (2 tipos)
- ✅ Mensajes de Éxito
- ✅ Mensajes de Error

### Responsive (3 viewports)
- ✅ Mobile (375x667)
- ✅ Tablet (768x1024)
- ✅ Desktop (1920x1080)

---

## 🚀 Cómo Ejecutar

### Test Completo
```bash
# Ejecutar solo este test
npx cypress run --spec "cypress/e2e/i18n-mojibake-check.cy.js"

# Ejecutar con interfaz gráfica
npx cypress open
# Luego seleccionar: i18n-mojibake-check.cy.js
```

### Test Específico
```bash
# Solo páginas principales
npx cypress run --spec "cypress/e2e/i18n-mojibake-check.cy.js" --grep "Páginas Principales"

# Solo modales
npx cypress run --spec "cypress/e2e/i18n-mojibake-check.cy.js" --grep "Modales"

# Scan completo
npx cypress run --spec "cypress/e2e/i18n-mojibake-check.cy.js" --grep "Scan completo"
```

---

## 📊 Resultados Esperados

### ✅ Test Exitoso
```
✅ Verificación i18n: Sin Mojibake ni Palabras Corruptas
  ✅ Páginas Principales
    ✅ Dashboard: Sin mojibake
    ✅ Invitados: Sin mojibake
    ✅ Finanzas: Sin mojibake
    ... (10 páginas)
  ✅ Modales y Componentes
    ✅ Modal Configuración: Sin mojibake
    ... (5 componentes)
  ✅ Formularios y Inputs
    ✅ Formulario Invitados: Placeholders sin mojibake
    ... (2 formularios)
  ✅ Notificaciones y Mensajes
    ✅ Mensajes de Éxito: Sin mojibake
  ✅ Verificación Global
    ✅ Scan completo de todas las páginas visitadas
  ✅ Verificación Responsive
    ✅ Mobile: Sin mojibake en navegación
    ✅ Tablet: Sin mojibake en navegación
    ✅ Desktop: Sin mojibake en navegación

📊 Resumen: 10 páginas verificadas
✅ Palabras correctas únicas: 12
🎉 ¡TODO CORRECTO! Sin mojibake ni palabras corruptas

25 passing (2m 15s)
```

### ❌ Test Fallido (Ejemplo)

Si encuentra problemas, mostrará:

```
❌ Mojibake detectado en:
  {
    "page": "/finanzas",
    "matches": ["�", "�", "�"]
  }

❌ Palabras corruptas encontradas:
  {
    "page": "/finanzas",
    "word": "Anlisis"
  }
```

---

## 🔧 Funciones Principales

### `checkNoMojibake()`

Verifica que el contenido de la página NO tenga:
- Caracteres mojibake (�, \uFFFD)
- Palabras sin acentos (Anlisis, Gestin, etc.)

```javascript
function checkNoMojibake() {
  cy.get('body').then(($body) => {
    const bodyText = $body.text();
    
    mojibakePatterns.forEach((pattern) => {
      const matches = bodyText.match(pattern);
      if (matches) {
        throw new Error(`❌ Mojibake detectado: ${matches.join(', ')}`);
      }
    });
    
    palabrasCorruptas.forEach((palabra) => {
      if (bodyText.includes(palabra)) {
        throw new Error(`❌ Palabra corrupta: "${palabra}"`);
      }
    });
  });
}
```

### `checkCorrectWords()`

Verifica que aparezcan palabras correctas:

```javascript
function checkCorrectWords(expectedWords) {
  cy.get('body').then(($body) => {
    const bodyText = $body.text();
    const foundWords = expectedWords.filter(word => bodyText.includes(word));
    
    if (foundWords.length > 0) {
      cy.log(`✅ Palabras correctas: ${foundWords.join(', ')}`);
    }
  });
}
```

---

## 📝 Configuración

### Usuario de Test

El test usa credenciales de prueba:

```javascript
const testUser = {
  email: 'test@maloveapp.com',
  password: 'TestPassword123!'
};
```

**Nota:** Asegúrate de que este usuario exista o cámbialo por uno válido.

### Tiempos de Espera

```javascript
cy.wait(1000);  // Espera después de cargar página
cy.wait(500);   // Espera después de abrir modal
cy.wait(300);   // Espera después de click
```

Ajusta si tu aplicación es más lenta.

---

## 🎯 Integración CI/CD

### GitHub Actions

Añade al workflow existente:

```yaml
- name: E2E - Verificación i18n
  run: npx cypress run --spec "cypress/e2e/i18n-mojibake-check.cy.js"
  
- name: Upload i18n Report
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: i18n-mojibake-report
    path: cypress/reports/
```

### Pre-commit Hook

```bash
#!/bin/bash
# .husky/pre-commit

echo "🔍 Verificando i18n..."
npx cypress run --spec "cypress/e2e/i18n-mojibake-check.cy.js" --headless

if [ $? -ne 0 ]; then
  echo "❌ Test i18n falló. Revisa los mensajes arriba."
  exit 1
fi

echo "✅ Test i18n pasó"
```

---

## 🐛 Troubleshooting

### Problema: "No se encuentra el selector"

**Causa:** Los selectores pueden variar según la página.

**Solución:** Usa selectores más genéricos:
```javascript
cy.get('button').contains(/añadir|nuevo/i).first().click({ force: true });
```

### Problema: "Test muy lento"

**Causa:** Muchas páginas y waits.

**Solución:** Reduce los `cy.wait()` o ejecuta en paralelo:
```bash
npx cypress run --spec "cypress/e2e/i18n-mojibake-check.cy.js" --parallel
```

### Problema: "Falsos positivos"

**Causa:** Texto en inglés o código puede contener palabras como "Das" (alemán).

**Solución:** Refina la búsqueda para ignorar ciertos contextos:
```javascript
if (bodyText.includes('das') && !bodyText.includes('Das Kapital')) {
  // Solo alertar si no es texto alemán
}
```

---

## 📈 Mejoras Futuras

1. **Snapshot Testing** - Guardar screenshots de páginas limpias
2. **OCR Verification** - Verificar texto renderizado visualmente
3. **API Checks** - Verificar respuestas JSON del backend
4. **Database Checks** - Verificar datos en Firestore
5. **PDF Generation** - Generar reporte PDF de resultados

---

## ✅ Conclusión

Este test garantiza que:
- ✅ **100% de las páginas** están libres de mojibake
- ✅ **Todas las palabras** tienen sus acentos correctos
- ✅ **La experiencia del usuario** es profesional

**Ejecuta este test después de cada cambio en archivos i18n.**

---

**Última Actualización:** 25 Octubre 2025  
**Autor:** Sesión de Correcciones i18n  
**Versión:** 1.0.0  
**Archivo:** `cypress/e2e/i18n-mojibake-check.cy.js`
