# 🔍 Test E2E: Diagnóstico de Tarjetas de Servicios

## 📋 Descripción

Este test reproduce el problema donde las tarjetas de servicios **NO aparecen ni desaparecen** cuando se activan/desactivan servicios desde el modal "Gestionar servicios".

---

## 🚀 Cómo ejecutar el test

### Prerequisitos

1. **Frontend corriendo en puerto 5173:**

   ```bash
   npm run dev
   ```

2. **Backend corriendo en puerto 4004:**

   ```bash
   cd backend
   npm start
   ```

3. **Usuario de prueba en Firebase:**
   - Email: `test@mywed360.com`
   - Password: `Test123456`
   - Debe tener una boda activa

---

### Opción 1: Ejecutar en modo interactivo (recomendado)

```bash
npx cypress open
```

1. Selecciona "E2E Testing"
2. Elige el navegador (Chrome recomendado)
3. Click en `tarjetas-servicios.cy.js`
4. Observa cada paso en tiempo real

---

### Opción 2: Ejecutar en modo headless

```bash
npx cypress run --spec "cypress/e2e/wedding-services/tarjetas-servicios.cy.js"
```

---

## 📊 Qué verifica el test

### ✅ PASO 1: Login y navegación

- Login con usuario de prueba
- Navega a `/proveedores`

### 📊 PASO 2: Contar tarjetas iniciales

- Cuenta cuántas tarjetas hay al inicio
- Verifica que hay al menos 1 tarjeta

### 🎯 PASO 3: Verificar estado del modal

- Abre el modal "Gestionar servicios"
- Cuenta servicios activos (borde morado)

### ❌ PASO 4: DESACTIVAR servicio

- Desactiva el primer servicio activo
- **CRÍTICO:** Verifica que la tarjeta **DESAPARECE**
- Espera: `tarjetas_después = tarjetas_antes - 1`

### ✅ PASO 5: ACTIVAR servicio

- Activa el primer servicio inactivo
- **CRÍTICO:** Verifica que la tarjeta **APARECE**
- Espera: `tarjetas_después = tarjetas_antes + 1`

### 🐛 PASO 6: Capturar logs

- Captura logs de consola durante el proceso
- Muestra logs con `activeCategories` y `Servicios activos`

---

## 🔍 Diagnóstico de fallos

### Si el test FALLA en PASO 4 o 5:

**Significa que las tarjetas NO se actualizan correctamente.**

#### Logs a revisar:

1. **En la salida de Cypress:**

   ```
   Expected 3 to equal 4
   ```

   → Indica que las tarjetas no cambiaron

2. **En la consola del navegador:**
   - Busca: `📊 [WeddingServicesOverview] Servicios activos:`
   - Busca: `👁️ [WeddingServicesOverview] activeCategories CAMBIÓ:`
   - Si NO ves estos logs → El componente NO se está re-renderizando

3. **En los screenshots:**
   - Cypress guarda screenshots automáticos en `cypress/screenshots/`
   - Revisa el estado antes/después del cambio

---

## 📁 Archivos relacionados

- **Test:** `cypress/e2e/wedding-services/tarjetas-servicios.cy.js`
- **Componente:** `src/components/wedding/WeddingServicesOverview.jsx`
- **Hook:** `src/hooks/useWeddingCategories.js`
- **Modal:** `src/components/wedding/ManageServicesModal.jsx`
- **Card:** `src/components/wedding/WeddingServiceCard.jsx`

---

## 🎯 Resultado esperado

Si todo funciona correctamente, verás:

```
✅ PASO 1: Login y navegación a /proveedores - PASS
✅ PASO 2: Contar tarjetas iniciales - PASS
✅ PASO 3: Abrir modal y verificar estado - PASS
✅ PASO 4: DESACTIVAR un servicio - PASS
   📊 Tarjetas ANTES: 5
   📊 Tarjetas DESPUÉS: 4
   📊 Diferencia: 1
✅ PASO 5: ACTIVAR un servicio - PASS
   📊 Tarjetas ANTES: 4
   📊 Tarjetas DESPUÉS: 5
   📊 Diferencia: 1
✅ PASO 6: DIAGNÓSTICO: Capturar logs - PASS
```

---

## 🆘 Solución de problemas

### Error: "Cannot find test user"

```bash
# Crear usuario de prueba en Firebase Console:
Email: test@mywed360.com
Password: Test123456
```

### Error: "Timed out retrying"

- Verifica que el frontend esté corriendo en puerto 5173
- Verifica que el backend esté corriendo en puerto 4004

### Error: "No tarjetas encontradas"

- El usuario debe tener al menos 1 servicio activo
- Ve a `/proveedores` manualmente y verifica

---

## 📝 Notas

- El test usa selectores CSS: `.border-purple-600` (activo) y `.border-gray-200` (inactivo)
- Los toasts se verifican para confirmar que la acción se ejecutó
- Se usa `cy.wait(1000)` para dar tiempo al re-render

---

**Última actualización:** 30 Oct 2025, 5:10pm
