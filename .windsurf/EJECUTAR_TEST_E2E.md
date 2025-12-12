# 🧪 CÓMO EJECUTAR EL TEST E2E DE DIAGNÓSTICO

**Commit:** `6d73383c` ✅

---

## 🎯 **QUÉ HACE ESTE TEST**

Reproduce **exactamente** tu problema:

1. Abre el modal "Gestionar servicios"
2. Desactiva un servicio (ej: DJ)
3. **Verifica si la tarjeta desaparece** ← AQUÍ FALLA
4. Activa un servicio (ej: Tarta)
5. **Verifica si la tarjeta aparece** ← AQUÍ TAMBIÉN FALLA

---

## 📋 **PREREQUISITOS**

### 1. Verifica que tienes Cypress instalado

```powershell
# Verificar versión
npx cypress --version
```

Si no está instalado:

```powershell
npm install cypress --save-dev
```

---

### 2. Verifica que tienes usuario de prueba

**Email:** `test@malove.app`  
**Password:** `Test123456`

Si NO lo tienes:

1. Ve a Firebase Console
2. Authentication → Users → Add User
3. Email: test@malove.app
4. Password: Test123456
5. El usuario necesita **una boda creada**

---

### 3. Asegúrate que todo está corriendo

✅ **Frontend:** http://localhost:5173  
✅ **Backend:** http://localhost:4004

---

## 🚀 **OPCIÓN 1: Modo Interactivo (RECOMENDADO)**

Este modo te permite VER el test en acción, paso a paso:

```powershell
npm run cypress:open:tarjetas
```

**Pasos:**

1. Se abrirá Cypress Launchpad
2. Click en **"E2E Testing"**
3. Selecciona **Chrome** (recomendado)
4. Click en **"Start E2E Testing"**
5. Verás el archivo `tarjetas-servicios.cy.js`
6. **Click en el archivo**
7. 👀 **Observa el navegador ejecutando el test**

---

## 🎥 **OPCIÓN 2: Headless con Video**

Este modo ejecuta el test en background y graba video:

```powershell
npm run cypress:run:tarjetas
```

**Resultado:**

- Verás el output en terminal
- Video guardado en: `cypress/videos/`
- Screenshots en: `cypress/screenshots/` (solo si falla)

---

## 🔍 **QUÉ VAS A VER SI EL BUG EXISTE**

### ❌ **Test FALLARÁ en PASO 4 o 5:**

```
✅ PASO 1: Login y navegación - PASS
✅ PASO 2: Contar tarjetas iniciales - PASS
✅ PASO 3: Abrir modal - PASS
❌ PASO 4: DESACTIVAR un servicio - FAIL

AssertionError: expected 5 to equal 4
   Expected: 4 tarjetas (una menos)
   Actual: 5 tarjetas (no cambió)

   at Context.<anonymous> (tarjetas-servicios.cy.js:178:16)
```

**Esto confirma:** Las tarjetas NO se están actualizando.

---

## ✅ **QUÉ VAS A VER SI ESTÁ ARREGLADO**

```
✅ PASO 1: Login y navegación - PASS
✅ PASO 2: Contar tarjetas iniciales - PASS
✅ PASO 3: Abrir modal - PASS
✅ PASO 4: DESACTIVAR un servicio - PASS
   📊 Tarjetas ANTES: 5
   📊 Tarjetas DESPUÉS: 4
   📊 Diferencia: 1 ✅
✅ PASO 5: ACTIVAR un servicio - PASS
   📊 Tarjetas ANTES: 4
   📊 Tarjetas DESPUÉS: 5
   📊 Diferencia: 1 ✅
✅ PASO 6: Capturar logs - PASS

All tests passed! ✅
```

---

## 📊 **LOGS QUE VERÁS EN CONSOLA**

El test captura estos logs automáticamente:

```javascript
// Si el código funciona bien:
📊 [WeddingServicesOverview] Servicios activos: 4
   IDs activos: ["fotografia", "video", "catering", "musica"]

👁️ [WeddingServicesOverview] activeCategories CAMBIÓ: [...]

🔄 [WeddingServicesOverview] Recalculando weddingServices...
```

Si NO ves estos logs → El componente NO se está re-renderizando.

---

## 🆘 **TROUBLESHOOTING**

### Error: "Cannot find test user"

```powershell
# Crear usuario en Firebase Console:
# Authentication → Users → Add User
Email: test@malove.app
Password: Test123456
```

---

### Error: "Timed out waiting for element"

**Causa:** Frontend no está corriendo

**Solución:**

```powershell
# En terminal 1:
npm run dev

# Espera a que diga: "Local: http://localhost:5173"
```

---

### Error: "No tarjetas encontradas"

**Causa:** El usuario no tiene servicios activos

**Solución:**

1. Abre http://localhost:5173/proveedores
2. Login con test@malove.app
3. Click en "Gestionar servicios"
4. Activa al menos 2-3 servicios
5. Vuelve a ejecutar el test

---

### Ver el video si falla

```powershell
# El video está en:
explorer cypress\videos\wedding-services\tarjetas-servicios.cy.js.mp4
```

---

## 📸 **SCREENSHOTS AUTOMÁTICOS**

Si el test falla, Cypress guarda screenshots en:

```
cypress/screenshots/wedding-services/tarjetas-servicios.cy.js/
  - PASO 4 DESACTIVAR un servicio (failed).png
```

Abre la imagen para ver el estado exacto cuando falló.

---

## 🔬 **PASO 6: LOGS DE CONSOLA**

El último paso del test captura TODOS los logs de la consola del navegador.

Busca estos logs específicos:

- `📊 [WeddingServicesOverview] Servicios activos:`
- `👁️ [WeddingServicesOverview] activeCategories CAMBIÓ:`
- `🔄 [WeddingServicesOverview] Recalculando weddingServices...`

Si NO aparecen → El problema está en que React no detecta los cambios.

---

## 📋 **DESPUÉS DE EJECUTAR EL TEST**

**Si FALLA:**

1. Copia el output completo de la terminal
2. Copia los screenshots de `cypress/screenshots/`
3. Mira el video en `cypress/videos/`
4. Comparte esta info conmigo

**Si PASA:**

1. 🎉 ¡Está arreglado!
2. Prueba manualmente para confirmar
3. Done ✅

---

## 🎯 **EJECUTAR AHORA**

```powershell
# Opción más fácil - modo visual:
npm run cypress:open:tarjetas

# O si prefieres headless:
npm run cypress:run:tarjetas
```

---

## 📁 **ARCHIVOS DEL TEST**

- Test: `cypress/e2e/wedding-services/tarjetas-servicios.cy.js`
- README: `cypress/e2e/wedding-services/README.md`
- Config: `cypress.config.js`

---

**¿Listo para ejecutarlo?** Ejecuta uno de los comandos de arriba y comparte los resultados. 🧪
