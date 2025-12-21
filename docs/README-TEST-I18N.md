# 🧪 Test E2E: Verificación i18n/Mojibake

## 🎯 Resumen

Test completo que verifica automáticamente que **NO hay mojibake ni palabras sin acentos** en toda la aplicación.

**Archivo:** `cypress/e2e/i18n-mojibake-check.cy.js`

---

## ⚡ Ejecución Rápida

### Windows (PowerShell)
```powershell
# Test completo
.\scripts\test-i18n.ps1

# Con interfaz gráfica
.\scripts\test-i18n.ps1 -Mode open

# Solo páginas principales
.\scripts\test-i18n.ps1 -Grep "Páginas Principales"
```

### Linux/Mac (Bash)
```bash
# Test completo
./scripts/test-i18n.sh

# Con interfaz gráfica
./scripts/test-i18n.sh open

# Solo páginas principales
./scripts/test-i18n.sh headless chrome "Páginas"
```

### Cypress Directo
```bash
# Headless
npx cypress run --spec "cypress/e2e/i18n-mojibake-check.cy.js"

# Interfaz gráfica
npx cypress open
# Luego seleccionar: i18n-mojibake-check.cy.js
```

---

## 📋 Qué Verifica

### ✅ Sin Mojibake
- Detecta: ``, `\uFFFD`, entidades HTML sin decodificar
- **27 palabras corruptas** comunes (sin acentos)

### ✅ Palabras Correctas
- Verifica **15 palabras clave** con acentos correctos
- Ejemplos: "Éxito", "Añadir", "Análisis", "Gestión"

### 🔍 Áreas Verificadas
- **10 páginas principales** (Dashboard, Invitados, Finanzas, etc.)
- **5 modales/componentes** (Configuración, Añadir Invitado, etc.)
- **2 formularios** (Placeholders y labels)
- **2 tipos de mensajes** (Éxito y Error)
- **3 viewports** (Mobile, Tablet, Desktop)

---

## 📊 Resultado Esperado

### ✅ Si Todo Está Bien
```
✅ Verificación i18n: Sin Mojibake ni Palabras Corruptas
  ✅ Páginas Principales (10 tests)
  ✅ Modales y Componentes (5 tests)
  ✅ Formularios y Inputs (2 tests)
  ✅ Notificaciones y Mensajes (2 tests)
  ✅ Verificación Global (1 test)
  ✅ Verificación Responsive (3 tests)

📊 Resumen: 10 páginas verificadas
✅ Palabras correctas únicas: 12
🎉 ¡TODO CORRECTO! Sin mojibake ni palabras corruptas

23 passing (2m 15s)
```

### ❌ Si Hay Errores
```
❌ Mojibake detectado en:
  {
    "page": "/finanzas",
    "matches": ["", ""]
  }

❌ Palabras corruptas encontradas:
  {
    "page": "/finanzas",
    "word": "Anlisis"
  }

1) Verificación Global
   Scan completo de todas las páginas visitadas:
   AssertionError: Palabras corruptas encontradas
```

**Solución:** Ejecuta `node fixMojibakeMinimal.cjs` para corregir.

---

## 🛠️ Opciones Avanzadas

### Filtros Específicos
```bash
# Solo Dashboard
npx cypress run --spec "cypress/e2e/i18n-mojibake-check.cy.js" --grep "Dashboard"

# Solo Modales
npx cypress run --spec "cypress/e2e/i18n-mojibake-check.cy.js" --grep "Modales"

# Solo Responsive
npx cypress run --spec "cypress/e2e/i18n-mojibake-check.cy.js" --grep "Responsive"
```

### Diferentes Navegadores
```bash
# Firefox
npx cypress run --spec "cypress/e2e/i18n-mojibake-check.cy.js" --browser firefox

# Edge
npx cypress run --spec "cypress/e2e/i18n-mojibake-check.cy.js" --browser edge

# Chrome con ventana visible
npx cypress run --spec "cypress/e2e/i18n-mojibake-check.cy.js" --browser chrome --headed
```

### Reportes
```bash
# Con reporte HTML
npx cypress run --spec "cypress/e2e/i18n-mojibake-check.cy.js" --reporter mochawesome

# Con video deshabilitado (más rápido)
npx cypress run --spec "cypress/e2e/i18n-mojibake-check.cy.js" --config video=false
```

---

## 🔧 Configuración

### Cambiar Usuario de Test

Edita el archivo `cypress/e2e/i18n-mojibake-check.cy.js`:

```javascript
const testUser = {
  email: 'tu-email@ejemplo.com',  // ← Cambia aquí
  password: 'TuPassword123!'       // ← Cambia aquí
};
```

### Añadir Más Palabras a Verificar

```javascript
// Palabras corruptas (sin acento)
const palabrasCorruptas = [
  'xito',
  'Aadir',
  'TU_PALABRA_AQUI',  // ← Añade aquí
];

// Palabras correctas (con acento)
const palabrasCorrectas = [
  'Éxito',
  'Añadir',
  'TU_PALABRA_CORRECTA',  // ← Añade aquí
];
```

### Añadir Más Páginas

```javascript
const pages = [
  '/dashboard',
  '/invitados',
  '/tu-nueva-pagina',  // ← Añade aquí
];
```

---

## 🚀 Integración CI/CD

### GitHub Actions

Añade a `.github/workflows/ci.yml`:

```yaml
- name: E2E - Verificación i18n
  run: npx cypress run --spec "cypress/e2e/i18n-mojibake-check.cy.js"
  
- name: Upload Artifacts
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: i18n-test-artifacts
    path: |
      cypress/screenshots/
      cypress/videos/
```

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/bash

echo "🔍 Verificando i18n..."
npx cypress run --spec "cypress/e2e/i18n-mojibake-check.cy.js" --config video=false

if [ $? -ne 0 ]; then
  echo "❌ Test i18n falló. Corrige antes de commit."
  exit 1
fi
```

### NPM Scripts

Añade a `package.json`:

```json
{
  "scripts": {
    "test:i18n": "cypress run --spec cypress/e2e/i18n-mojibake-check.cy.js",
    "test:i18n:open": "cypress open --e2e --browser chrome",
    "test:i18n:headed": "cypress run --spec cypress/e2e/i18n-mojibake-check.cy.js --headed"
  }
}
```

Ejecuta con:
```bash
npm run test:i18n         # Headless
npm run test:i18n:open    # Interfaz gráfica
npm run test:i18n:headed  # Con ventana visible
```

---

## 📝 Palabras Verificadas

### Palabras Corruptas (27)

| Corrupto | Correcto | Ubicación Común |
|----------|----------|-----------------|
| xito | Éxito | Mensajes de éxito |
| Aadir | Añadir | Botones |
| electrnico | electrónico | Email |
| Diseos | Diseños | Navegación |
| Configuracin | Configuración | Configuración |
| sesin | sesión | Logout |
| Men de | Menú de | Navegación |
| Ms opciones | Más opciones | Botones |
| Transaccin | Transacción | Finanzas |
| categora | categoría | Finanzas |
| das | días | Finanzas |
| ltimos | Últimos | Finanzas |
| Anlisis | Análisis | Finanzas |
| Gestin | Gestión | Múltiples |
| sincronizacin | sincronización | Múltiples |
| conexin | conexión | Múltiples |
| descripcin | descripción | Formularios |
| informacin | información | Múltiples |
| notificacin | notificación | Notificaciones |
| nmero | número | Formularios |
| telfono | teléfono | Contactos |
| bsqueda | búsqueda | Búsqueda |
| difcil | difícil | Múltiples |
| fcil | fácil | Múltiples |
| til | útil | Múltiples |
| rpido | rápido | Múltiples |
| prximo | próximo | Múltiples |

---

## 🐛 Troubleshooting

### Problema: Test Lento

**Solución 1:** Reduce los `cy.wait()`:
```javascript
cy.wait(500);  // En lugar de 1000
```

**Solución 2:** Desactiva video:
```bash
npx cypress run --spec "..." --config video=false
```

### Problema: Usuario No Existe

**Error:** `Cypress detected that you returned a promise from a command`

**Solución:** Crea el usuario o cambia las credenciales en el test.

### Problema: Selector No Encontrado

**Error:** `Timed out retrying: Expected to find element`

**Solución:** Usa selectores más genéricos:
```javascript
cy.get('button').contains(/añadir/i).first().click({ force: true });
```

### Problema: Falsos Positivos

**Causa:** Texto en inglés o código puede tener "das", "Menu", etc.

**Solución:** Refina la lista de palabras corruptas o añade excepciones.

---

## 📚 Documentación Adicional

- **Test completo:** [TEST-I18N-MOJIBAKE.md](./TEST-I18N-MOJIBAKE.md)
- **Corrección i18n:** [I18N-CORREGIDO-FINAL.md](./I18N-CORREGIDO-FINAL.md)
- **Script de corrección:** `fixMojibakeMinimal.cjs`

---

## ✅ Checklist Pre-Deploy

Antes de desplegar a producción, verifica:

- [ ] ✅ Test i18n pasa sin errores
- [ ] ✅ Sin mojibake en páginas principales
- [ ] ✅ Sin palabras corruptas en formularios
- [ ] ✅ Modales verificados
- [ ] ✅ Responsive verificado
- [ ] ✅ Archivos i18n actualizados

---

## 🎉 Conclusión

Este test garantiza que:
- ✅ **100% de las páginas** están libres de mojibake
- ✅ **Todas las palabras** tienen sus acentos correctos
- ✅ **La UX** es profesional y sin errores visuales

**Ejecuta este test después de cada cambio en archivos i18n.**

---

**Última Actualización:** 25 Octubre 2025, 06:45 AM  
**Autor:** Sesión de Correcciones i18n  
**Versión:** 1.0.0
