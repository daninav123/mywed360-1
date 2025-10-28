# 🗑️ ELIMINAR PROVEEDORES "DISCOVERED" - INSTRUCCIONES URGENTES

## 📍 MÉTODO: Firebase Console (5 minutos)

### **PASO 1: Abrir Firebase Console**

Haz clic en este enlace:

```
https://console.firebase.google.com/project/lovenda-98c77/firestore/databases/-default-/data/~2Fsuppliers
```

O manualmente:

1. Ve a: https://console.firebase.google.com/
2. Selecciona proyecto: **lovenda-98c77**
3. En menú lateral: **Firestore Database**
4. Click en pestaña: **Data**
5. Click en colección: **suppliers**

---

### **PASO 2: Crear filtro para "discovered"**

En la parte superior de la tabla, verás opciones de filtro:

1. **Click en "Add filter" (Añadir filtro)**
2. **Campo:** `status`
3. **Operador:** `==`
4. **Valor:** `discovered`
5. **Click en "Apply" (Aplicar)**

Ahora solo verás documentos con `status: "discovered"`

---

### **PASO 3: Seleccionar todos**

1. **Marca el checkbox** en el encabezado de la tabla (arriba a la izquierda)
   - Esto selecciona todos los documentos visibles (máximo 50 por página)

---

### **PASO 4: Eliminar**

1. **Click en el icono de papelera** 🗑️ (Delete) en la barra de herramientas
2. **Confirma** la eliminación en el diálogo

---

### **PASO 5: Repetir si hay más de 50**

Firebase Console muestra máximo 50 documentos por página.

Si después de eliminar **aún ves más documentos**:

- Repite PASO 3 y PASO 4
- Continúa hasta que **no aparezcan más resultados**

---

### **PASO 6: Verificar que están eliminados**

1. **Quita el filtro** (click en la X del filtro)
2. **Vuelve a aplicar el filtro** `status == "discovered"`
3. **Resultado esperado:** "No documents found" o "0 documentos"

---

## ✅ ALTERNATIVA: Eliminar uno por uno (si son pocos)

Si hay menos de 10 proveedores:

1. Con el filtro aplicado
2. Haz click en cada documento
3. En el panel lateral, click en ⋮ (tres puntos)
4. Selecciona "Delete document"
5. Confirma

---

## 📊 ¿Cuántos hay que eliminar?

Para saber cuántos proveedores "discovered" tienes:

1. Aplica el filtro `status == "discovered"`
2. Mira el contador en la parte inferior: "X of Y documents"

---

## ⚠️ IMPORTANTE

**NO elimines proveedores con:**

- `status: "active"` ✅ Estos son legítimos
- `status: "cached"` ✅ Estos son temporales de caché

**SÍ elimina:**

- `status: "discovered"` ❌ Estos son scraped y tienen riesgo legal

---

## 🎯 RESUMEN RÁPIDO

```
1. Abrir: https://console.firebase.google.com/project/lovenda-98c77/firestore
2. Ir a: suppliers (colección)
3. Filtro: status == "discovered"
4. Seleccionar todos (checkbox)
5. Eliminar (papelera 🗑️)
6. Repetir hasta 0 documentos
7. Verificar: filtro muestra 0 resultados
```

---

## ❓ Si tienes problemas

**No encuentro la colección "suppliers":**

- Asegúrate de estar en el proyecto correcto: `lovenda-98c77`
- La colección aparece en el listado de la izquierda

**No aparece el botón "Add filter":**

- Busca el icono de embudo 🔍
- O usa la barra de búsqueda en la parte superior

**El filtro no funciona:**

- Asegúrate de escribir exactamente: `discovered` (minúsculas, sin espacios)

---

## ✅ Una vez eliminados

1. Los proveedores de internet **seguirán apareciendo** en las búsquedas
2. Simplemente **NO se guardan** en la base de datos
3. **Sin riesgo legal** ✅
