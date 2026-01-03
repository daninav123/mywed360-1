# TEST DE PERSISTENCIA DE CUSTOM OPTIONS

## Problema Identificado

El estado local `customOptions` en `SupplierCategorySpecs.jsx` **no se sincronizaba** con los cambios en `specs.customOptions` que venían del padre (ej: al cargar desde Firestore).

### Causa Raíz

```javascript
// ANTES (❌ INCORRECTO):
const [customOptions, setCustomOptions] = useState(specs.customOptions || []);
// Problema: Solo se inicializa una vez, no se actualiza cuando specs cambia
```

### Solución Aplicada

```javascript
// DESPUÉS (✅ CORRECTO):
const [customOptions, setCustomOptions] = useState(specs.customOptions || []);

// Añadido useEffect para sincronizar:
React.useEffect(() => {
  if (specs.customOptions && JSON.stringify(specs.customOptions) !== JSON.stringify(customOptions)) {
    setCustomOptions(specs.customOptions);
  }
}, [specs.customOptions]);
```

## Flujo Completo de Persistencia

### 1. Usuario Añade Opción
- Usuario escribe "Fotos polaroid" y presiona Enter
- Se ejecuta `addCustomOption()`
- Se actualiza estado local: `setCustomOptions([...customOptions, "Fotos polaroid"])`
- Se llama a `updateField('customOptions', newOptions)`
- `updateField` actualiza `supplierRequirements` en el estado del padre (InfoBoda)

### 2. Auto-guardado
- El cambio en `supplierRequirements` marca `hasUnsavedChanges = true` (useEffect en InfoBoda)
- Después de 30 segundos, se ejecuta `saveWeddingInfo()`
- Se guarda en Firestore con `updateDoc`:
  ```javascript
  supplierRequirements: {
    fotografia: {
      customOptions: ["Fotos polaroid"],
      specs: { ... },
      required: [],
      desired: []
    }
  }
  ```

### 3. Al Recargar Página
- Se ejecuta `loadWeddingInfo()` en InfoBoda
- Se lee `supplierRequirements` desde Firestore
- Se hace `setSupplierRequirements(wedSnap.data().supplierRequirements)`
- **NUEVO**: El useEffect en SupplierCategorySpecs detecta el cambio y actualiza el estado local
- Las opciones personalizadas aparecen correctamente

## Test Manual

### Paso 1: Añadir Opción
1. Abrir app en `http://localhost:5173`
2. Ir a **Info Boda > Proveedores**
3. Seleccionar **Fotografía**
4. En "Añadir opción especial personalizada" escribir: **"Test de persistencia"**
5. Presionar **Enter**
6. Verificar que aparece en la lista con checkbox

### Paso 2: Guardar
- Esperar 30 segundos (auto-guardado)
- O hacer click en botón **"Guardar cambios"**
- Verificar mensaje: **"✓ Guardado exitosamente"**

### Paso 3: Recargar
1. Presionar **F5** o **Ctrl+R** / **Cmd+R**
2. Ir a **Info Boda > Proveedores > Fotografía**
3. **✅ VERIFICAR**: La opción "Test de persistencia" debe aparecer

### Paso 4: Verificar en Firestore (Opcional)
1. Abrir Firebase Console
2. Firestore > `weddings` > tu documento
3. Verificar que existe:
   ```
   supplierRequirements.fotografia.customOptions: ["Test de persistencia"]
   ```

## Diagnóstico si Falla

Si después de estos cambios sigue fallando, ejecutar:

```bash
# 1. Obtener tu weddingId
# En navegador F12 > Console:
localStorage.getItem('weddingId')

# 2. Ejecutar script de diagnóstico
node scripts/debug-custom-options.js <TU_WEDDING_ID>
```

El script mostrará:
- ✅ Si `supplierRequirements` existe en Firestore
- 📂 Qué categorías tienen datos guardados
- ✨ Cuántas customOptions hay en cada categoría
- 🕐 Cuándo fue la última actualización
- 📄 Estructura completa de datos

## Cambios Realizados

### 1. `apps/main-app/src/components/wedding/SupplierCategorySpecs.jsx`
- ✅ Añadido useEffect para sincronizar customOptions con specs

### 2. `apps/main-app/src/pages/InfoBoda.jsx`
- ✅ Añadido useEffect para marcar hasUnsavedChanges cuando cambia supplierRequirements
- ✅ Añadida carga de supplierRequirements desde Firestore en loadWeddingInfo()
- ✅ Añadido supplierRequirements a dependencias del auto-guardado

### 3. `scripts/debug-custom-options.js`
- ✅ Script de diagnóstico para verificar datos en Firestore

## Estado Actual

- ✅ Guardado: Funciona correctamente
- ✅ Carga: Corregido (faltaba sincronización de estado local)
- ✅ Auto-guardado: Activado (30 segundos)
- ✅ Detección de cambios: Funciona

**AHORA DEBERÍA FUNCIONAR CORRECTAMENTE**
