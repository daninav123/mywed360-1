# 🧪 Test E2E: Sistema de Analytics de Búsquedas

**Archivo:** `cypress/e2e/proveedores_search_analytics.cy.js`  
**Estado:** ✅ Implementado  
**Objetivo:** Verificar que el sistema de captura de búsquedas funciona correctamente

---

## 🎯 QUÉ VERIFICA EL TEST

### **1. Captura básica de búsquedas**
✅ Las búsquedas se guardan en `searchAnalytics`  
✅ Keywords se extraen correctamente  
✅ Stop words se filtran  
✅ Metadata se captura completa

### **2. No afecta flujo normal**
✅ Búsquedas funcionan aunque falle analytics  
✅ Tiempo de respuesta aceptable (<5s)  
✅ Sin bloqueos ni errores

### **3. Datos completos**
✅ Filtros de presupuesto capturados  
✅ Timestamps correctos  
✅ user_id y wedding_id asociados  
✅ Flags (has_budget, has_location)

### **4. Múltiples búsquedas**
✅ Acumula búsquedas de diferentes usuarios  
✅ Detecta patrones de keywords comunes  
✅ Base para nodos dinámicos futuros

---

## 🚀 EJECUTAR EL TEST

### **Prerequisitos:**

1. **Backend corriendo:**
```bash
cd backend
npm run dev
# Debe estar en http://localhost:4004
```

2. **Firebase configurado:**
```bash
# Verificar que existe:
backend/serviceAccountKey.json
```

3. **Variables de entorno:**
```bash
# En .env o .env.local
TAVILY_API_KEY=tvly-xxx...
```

---

### **Ejecutar el test:**

```bash
# Solo este test
npx cypress run --spec "cypress/e2e/proveedores_search_analytics.cy.js"

# Con interfaz gráfica
npx cypress open
# Luego seleccionar proveedores_search_analytics.cy.js
```

---

## 📊 ESCENARIOS DE PRUEBA

### **Test 1: Captura simple**

```javascript
Búsqueda: "fotógrafo con drone vintage"
         ↓
Verifica en Firestore:
  - query: "fotógrafo con drone vintage"
  - service: "fotografia"
  - keywords: ["fotografo", "drone", "vintage"]
  - user_id: "test_user_e2e"
  - processing_status: "captured" o "completed"
```

**Resultado esperado:**
```
✅ Búsqueda capturada correctamente en Firestore
📄 ID documento: XYZ123
```

---

### **Test 2: Extracción de keywords**

```javascript
Búsqueda: "catering vegano ecológico para boda"
         ↓
Verifica keywords:
  - ✅ "vegano" (relevante)
  - ✅ "ecologico" (relevante)
  - ✅ "catering" (relevante)
  - ❌ "para" (stop word, filtrado)
  - ❌ "boda" (puede estar según contexto)
```

**Resultado esperado:**
```
✅ Keywords extraídos correctamente
🏷️ Keywords encontrados: vegano, ecologico, catering
```

---

### **Test 3: Filtrado de stop words**

```javascript
Búsqueda: "el fotógrafo para la boda con flores"
         ↓
Stop words filtrados:
  - ❌ "el"
  - ❌ "para"
  - ❌ "la"
  - ❌ "con"

Keywords relevantes:
  - ✅ "fotografo"
  - ✅ "boda"
  - ✅ "flores"
```

**Resultado esperado:**
```
✅ Stop words filtrados correctamente
🏷️ Keywords relevantes: fotografo, boda, flores
```

---

### **Test 4: No afecta búsqueda**

```javascript
Búsqueda SIN user_id ni wedding_id
         ↓
Verifica:
  - ✅ Búsqueda funciona igual
  - ✅ Devuelve proveedores
  - ✅ Status 200
  - ✅ Tiempo < 5 segundos
```

**Resultado esperado:**
```
✅ Búsqueda funciona sin user_id/wedding_id
📊 5 proveedores encontrados
⏱️ Tiempo de respuesta: 1200ms
```

---

### **Test 5: Filtros de presupuesto**

```javascript
Búsqueda con filtros:
  - budget: 5000
  - minBudget: 3000
  - maxBudget: 7000
  - guestCount: 120
         ↓
Verifica en Firestore:
  - filters.budget === 5000
  - filters.minBudget === 3000
  - has_budget === true
  - has_location === true
```

**Resultado esperado:**
```
✅ Filtros capturados correctamente
```

---

### **Test 6: Múltiples usuarios**

```javascript
3 usuarios diferentes buscan:
  - user_1: "fotógrafo con drone"
  - user_2: "fotos aéreas boda"
  - user_3: "fotografía desde drone"
         ↓
Verifica en Firestore:
  - 3 documentos creados
  - 3 user_id diferentes
  - Keyword "drone" aparece en todos
```

**Resultado esperado:**
```
✅ Múltiples búsquedas capturadas
👥 3 usuarios diferentes
📊 Patrón detectado: "drone" en 3/3 búsquedas
💡 Candidato para nodo dinámico
```

---

## 🗄️ ESTRUCTURA EN FIRESTORE

### **Colección: `searchAnalytics`**

Después de ejecutar el test, verás documentos como:

```javascript
{
  id: "auto_generated_id",
  timestamp: Timestamp(2025-10-28 03:45:00),
  
  // Input
  query: "fotógrafo con drone vintage",
  service: "fotografia",
  location: "Valencia",
  
  // Análisis
  keywords: [
    {
      word: "fotografo",
      position: 0,
      length: 9,
      source: "query"
    },
    {
      word: "drone",
      position: 1,
      length: 5,
      source: "query"
    },
    {
      word: "vintage",
      position: 2,
      length: 7,
      source: "query"
    }
  ],
  keyword_count: 3,
  
  // Contexto
  user_id: "test_user_e2e",
  wedding_id: "test_wedding_e2e",
  
  // Flags
  has_budget: true,
  has_location: true,
  
  // Resultados
  results_count: 5,
  results_breakdown: {
    registered: 1,
    cached: 0,
    internet: 4
  },
  
  // Metadata
  version: "1.0",
  processing_status: "captured"
}
```

---

## 🧹 LIMPIEZA DE DATOS

El test limpia automáticamente los datos de prueba al finalizar:

```javascript
after(() => {
  // Elimina documentos con user_id de test
  cy.task('firebase:deleteWhere', {
    collection: 'searchAnalytics',
    where: [['user_id', 'in', [...usuarios_de_test]]]
  });
});
```

---

## 📈 SALIDA ESPERADA

### **Ejecución exitosa:**

```bash
  Sistema de Analytics de Búsquedas - Nodos Dinámicos

    1. Captura básica de búsquedas
      ✓ debe capturar una búsqueda simple en searchAnalytics (2500ms)
      ✓ debe extraer keywords correctamente (2200ms)
      ✓ debe filtrar stop words correctamente (2100ms)

    2. No afecta flujo normal de búsqueda
      ✓ debe devolver resultados incluso si falla el analytics (1800ms)
      ✓ debe tener tiempo de respuesta aceptable (1500ms)

    3. Datos de búsqueda completos
      ✓ debe capturar filtros de presupuesto (2300ms)
      ✓ debe incluir timestamp correcto (2000ms)

    4. Múltiples búsquedas y patrones
      ✓ debe acumular búsquedas de diferentes usuarios (3500ms)
      ✓ debe detectar keywords comunes en múltiples búsquedas (3800ms)

    5. Limpieza de datos de test
      ✓ limpia datos correctamente (500ms)

  10 passing (22s)
```

---

## ⚠️ POSIBLES ERRORES

### **Error: Firebase no inicializado**

```bash
Firebase no inicializado
```

**Solución:**
```bash
# Verificar que existe el archivo
ls backend/serviceAccountKey.json

# Si no existe, descargarlo desde Firebase Console
# Project Settings > Service Accounts > Generate new private key
```

---

### **Error: Backend no responde**

```bash
Error: connect ECONNREFUSED 127.0.0.1:4004
```

**Solución:**
```bash
# Iniciar backend
cd backend
npm run dev

# Verificar que está corriendo
curl http://localhost:4004/health
```

---

### **Error: TAVILY_API_KEY no configurada**

```bash
⚠️ TAVILY_API_KEY no configurada
```

**Solución:**
```bash
# En .env
TAVILY_API_KEY=tvly-tu-clave-aqui
```

**Nota:** El test seguirá funcionando, solo no buscará en internet.

---

## 🔍 VERIFICACIÓN MANUAL EN FIRESTORE

1. **Ir a Firebase Console:**
   - https://console.firebase.google.com

2. **Firestore Database:**
   - Collections
   - `searchAnalytics`

3. **Buscar documentos de test:**
   - Filtrar por `user_id == "test_user_e2e"`
   - Ordenar por `timestamp desc`

4. **Verificar estructura:**
   - ✅ Tiene `keywords` array
   - ✅ Tiene `timestamp` correcto
   - ✅ Tiene `processing_status`
   - ✅ Tiene `version: "1.0"`

---

## 📚 ARCHIVOS RELACIONADOS

**Test:**
- `cypress/e2e/proveedores_search_analytics.cy.js` - Test principal

**Backend:**
- `backend/services/searchAnalyticsService.js` - Servicio de captura
- `backend/routes/suppliers-hybrid.js` - Integración en búsqueda

**Config:**
- `cypress.config.js` - Tareas de Firebase

**Docs:**
- `docs/proveedores/NODOS-DINAMICOS.md` - Documentación completa del sistema

---

## 🎯 PRÓXIMOS TESTS

### **Fase 2: Candidatos**
- Test de acumulación de keywords
- Test de detección de umbrales
- Test de creación de candidatos

### **Fase 3: Nodos Dinámicos**
- Test de creación automática
- Test de aplicación a proveedores
- Test de matching con nodos

---

**El test verifica que la Fase 1 está 100% funcional** ✅
