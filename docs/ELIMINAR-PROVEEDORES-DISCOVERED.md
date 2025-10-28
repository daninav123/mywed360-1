# ⚠️ ELIMINACIÓN DE PROVEEDORES "DISCOVERED" - IMPLICACIONES LEGALES

## 🚨 CRÍTICO: Por qué debemos eliminarlos

**Riesgo legal:** Almacenar datos scraped de internet sin consentimiento explícito puede tener implicaciones legales negativas según GDPR y leyes de protección de datos.

**Solución:** Los proveedores encontrados en internet se devuelven en la respuesta pero **NO se guardan en la base de datos**.

---

## ✅ CAMBIOS REALIZADOS EN EL CÓDIGO

### **1. Eliminado guardado automático** (backend/routes/suppliers-hybrid.js)

**Antes (50+ líneas de código):**

```javascript
// ===== 3.5. GUARDAR RESULTADOS DE INTERNET EN FIRESTORE =====
if (internetResults.length > 0) {
  const batch = db.batch();
  for (const supplier of internetResults) {
    const supplierId = `discovered_${urlHash}_${Date.now()}`;
    const supplierData = {
      ...supplier,
      status: 'discovered', // ❌ RIESGO LEGAL
      autoDiscovered: true,
    };
    batch.set(docRef, supplierData, { merge: true });
  }
  await batch.commit();
}
```

**Ahora:**

```javascript
// ⚠️ REMOVED: NO GUARDAR PROVEEDORES DISCOVERED EN FIRESTORE
// Motivo: Implicaciones legales - no debemos almacenar datos scraped
// Los proveedores de internet solo se devuelven en la respuesta, NO se guardan en BD
```

---

### **2. Cambio de Status**

| Antes                  | Ahora                     | Guardado en BD |
| ---------------------- | ------------------------- | -------------- |
| `status: 'discovered'` | `status: 'internet-only'` | ❌ NO          |
| Se guardaba en BD      | Solo en respuesta         | ❌ NO          |

---

### **3. Filtro actualizado**

```javascript
// Antes: Permitía "discovered"
const isValid = status === 'active' || status === 'discovered';

// Ahora: NO permite "discovered"
const isValid = status === 'active' || status === 'cached';
```

---

## 🗑️ CÓMO ELIMINAR PROVEEDORES "DISCOVERED" EXISTENTES

### **Opción 1: Desde la Consola de Firebase (RECOMENDADO)**

1. **Ir a Firebase Console**

   ```
   https://console.firebase.google.com/
   ```

2. **Seleccionar proyecto:** `lovenda-98c77`

3. **Ir a Firestore Database**
   - En el menú lateral: **Firestore Database**

4. **Buscar colección `suppliers`**

5. **Filtrar por `status == "discovered"`**
   - Usa la interfaz de consultas de Firebase

6. **Eliminar documentos**
   - Selecciona todos los documentos
   - Click en **Delete**
   - Confirmar eliminación

**⚠️ ADVERTENCIA:** Firebase Console tiene límite de ~50 documentos por operación. Si hay muchos, usar Opción 2 o repetir varias veces.

---

### **Opción 2: Script Automático (Requiere configuración)**

#### **Paso 1: Configurar credenciales**

```bash
# Opción A: Usar gcloud
gcloud auth application-default login

# Opción B: Variable de entorno
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

#### **Paso 2: Ejecutar script**

```bash
cd backend
node scripts/deleteDiscoveredSuppliers.js
```

**Output esperado:**

```
🗑️  INICIANDO ELIMINACIÓN DE PROVEEDORES "DISCOVERED"...

📊 Encontrados 127 proveedores con status "discovered"

   🗑️  Eliminando: discovered_abc123_1234567890
      Nombre: Fotógrafo Juan Pérez
      Fuente: bodas-net
      URL: https://bodas.net/fotografos/juan-perez

   🗑️  Eliminando: discovered_def456_1234567891
      Nombre: Catering Eventos S.L.
      Fuente: tavily-realtime
      URL: https://catering-eventos.com

   ✅ Lote de 50 eliminado (Total: 50/127)
   ✅ Lote de 50 eliminado (Total: 100/127)
   ✅ Último lote de 27 eliminado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ COMPLETADO: 127 proveedores "discovered" eliminados
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ VERIFICADO: No quedan proveedores "discovered" en la base de datos
```

---

### **Opción 3: Query manual en Firebase CLI**

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Ejecutar en consola interactiva
firebase firestore:delete --recursive \
  --project lovenda-98c77 \
  --collection suppliers \
  --where "status==discovered"
```

---

## 📊 VERIFICAR QUE NO QUEDAN PROVEEDORES "DISCOVERED"

### **Desde Firebase Console:**

1. Ir a **Firestore Database**
2. Colección: `suppliers`
3. Filtrar: `status == "discovered"`
4. **Resultado esperado:** 0 documentos

### **Desde el código:**

```javascript
// En cualquier archivo backend que use Firestore
const snapshot = await db.collection('suppliers').where('status', '==', 'discovered').get();

console.log(`Proveedores "discovered" encontrados: ${snapshot.size}`);
// Esperado: 0
```

---

## 🛡️ PROTECCIÓN FUTURA

### **1. El código ya NO guarda proveedores discovered**

✅ Sección de guardado ELIMINADA
✅ Status cambiado a `internet-only` (solo respuesta)
✅ Filtro actualizado para rechazar `discovered`

### **2. Comportamiento nuevo:**

**Antes:**

```
Usuario busca "fotógrafo madrid"
  ↓
Backend busca en Tavily
  ↓
Resultados se GUARDAN en Firestore ❌
  ↓
Se devuelven al usuario
```

**Ahora:**

```
Usuario busca "fotógrafo madrid"
  ↓
Backend busca en Tavily
  ↓
Resultados solo en MEMORIA ✅
  ↓
Se devuelven al usuario
  ↓
NO se guardan en BD ✅
```

---

## ❓ FAQ

### **¿Por qué es un problema legal?**

Scraping de datos personales (nombres, emails, teléfonos) de sitios web y almacenarlos sin consentimiento viola:

- **GDPR** (Regulación General de Protección de Datos UE)
- **Ley Orgánica de Protección de Datos (LOPD)** en España
- Términos de servicio de los sitios scrapeados

### **¿Y si los datos son públicos?**

Incluso datos públicos requieren base legal para ser almacenados. El consentimiento explícito es necesario.

### **¿Qué pasa con los datos "cached"?**

Los proveedores con `status: 'cached'` son diferentes:

- Vienen de caché temporal de Tavily (ya procesados)
- NO son scraped directamente por nosotros
- Tienen TTL (Time To Live) corto
- **Se eliminan automáticamente** después de X días

### **¿Los usuarios ven menos resultados ahora?**

❌ NO. Los resultados de internet se siguen mostrando.
✅ La diferencia es que NO se guardan en la BD.

---

## 📝 RESUMEN DE SEGURIDAD

| Aspecto                   | Estado                  | Riesgo                  |
| ------------------------- | ----------------------- | ----------------------- |
| **Guardado automático**   | ✅ Eliminado            | ✅ Sin riesgo           |
| **Status "discovered"**   | ✅ No se usa            | ✅ Sin riesgo           |
| **Proveedores en BD**     | ⏳ Pendiente eliminar   | ⚠️ Eliminar manualmente |
| **Resultados en memoria** | ✅ Solo respuesta       | ✅ Sin riesgo           |
| **Filtro actualizado**    | ✅ Rechaza "discovered" | ✅ Sin riesgo           |

---

## ✅ CHECKLIST DE LIMPIEZA

- [ ] **Código actualizado** (✅ Ya hecho - commit `8388e953`)
- [ ] **Push a GitHub** (✅ Ya hecho)
- [ ] **Eliminar proveedores existentes** (⏳ Pendiente - usar Opción 1, 2 o 3)
- [ ] **Verificar eliminación** (⏳ Pendiente - ver sección "Verificar")
- [ ] **Documentar en equipo** (⏳ Pendiente - compartir este documento)

---

## 🚀 SIGUIENTE PASO INMEDIATO

**ELIMINAR MANUALMENTE desde Firebase Console:**

1. https://console.firebase.google.com/project/lovenda-98c77/firestore
2. Colección: `suppliers`
3. Filtrar: `status == "discovered"`
4. Seleccionar todos → Delete
5. Verificar: 0 resultados

---

**Fecha:** 28 de octubre de 2025  
**Prioridad:** 🚨 CRÍTICA  
**Acción requerida:** INMEDIATA
