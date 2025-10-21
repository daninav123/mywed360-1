# ✅ Fase 2: Validaciones Backend - IMPLEMENTADA

## 📋 Resumen

Se ha implementado exitosamente el sistema completo de validaciones backend para dependencias entre subtareas, con detección de errores críticos y advertencias informativas.

---

## 🔧 Funciones Backend Implementadas

### 1. **`flattenTasks(blocks)`**
- Convierte estructura de bloques anidados en lista plana de tareas
- Preserva índices de bloque e ítem para referencias
- Extrae información de dependencias

### 2. **`findTask(tasks, dep)`**
- Busca una tarea específica por sus índices
- Usado para verificar referencias de dependencias

### 3. **`detectCycle(tasks, currentTask, visited)`**
- Algoritmo de detección de ciclos usando DFS (Depth-First Search)
- Usa conjunto `visited` para detectar ciclos
- **Previene:** A → B → C → A

### 4. **`validateDependencies(blocks)`**
Función principal de validación que retorna:
```javascript
{
  valid: boolean,        // true si no hay errores críticos
  errors: string[],      // Errores que impiden guardar/publicar
  warnings: string[]     // Advertencias informativas
}
```

---

## ✅ Validaciones Implementadas

### **Errores Críticos (Bloquean operación):**

1. **Referencias Inválidas**
   ```
   ❌ "Contratar fotógrafo" depende de una tarea inexistente
   ```
   - Detecta dependencias a tareas que no existen
   - Evita referencias rotas

2. **Ciclos de Dependencias**
   ```
   ❌ Ciclo detectado: A → B → C → A
   ```
   - Usa algoritmo DFS para detectar ciclos
   - Previene deadlocks lógicos

3. **Auto-dependencias**
   ```
   ❌ La tarea no puede depender de sí misma
   ```
   - Validación trivial pero necesaria

### **Advertencias (No bloquean):**

4. **Conflictos Temporales**
   ```
   ⚠️ "Contratar fotógrafo" empieza antes de que termine 
      "Elegir fotógrafo". Considera ajustar: Tarea empieza 
      en 30%, dependencia termina en 50%
   ```
   - Detecta cuando una tarea empieza antes que su dependencia
   - Permite flexibilidad (el admin puede tener razones válidas)

---

## 🔌 Endpoints Actualizados

### **POST `/api/admin/dashboard/task-templates`**

**Cambios:**
- ✅ Valida dependencias antes de guardar
- ✅ Retorna warnings informativos
- ❌ Bloquea si hay errores críticos

**Respuesta exitosa con warnings:**
```json
{
  "id": "template_123",
  "template": { ... },
  "validation": {
    "warnings": [
      "Tarea X empieza antes que termine su dependencia Y..."
    ]
  }
}
```

**Respuesta con errores:**
```json
{
  "error": "invalid_dependencies",
  "details": [
    "Ciclo detectado en dependencias de 'Contratar fotógrafo'",
    "Tarea X depende de tarea inexistente"
  ],
  "warnings": []
}
```

### **POST `/api/admin/dashboard/task-templates/:id/publish`**

**Cambios:**
- ✅ Valida dependencias antes de publicar
- ❌ **Bloquea publicación si hay errores**
- ✅ Permite publicar con warnings (informativo)

**Respuesta con errores (no publica):**
```json
{
  "error": "cannot_publish_invalid_dependencies",
  "details": [
    "Ciclo detectado...",
    "Referencias inválidas..."
  ],
  "warnings": []
}
```

---

## 🎨 Frontend: Manejo de Validación

### **Estado Nuevo:**
```javascript
const [validationWarnings, setValidationWarnings] = useState([]);
```

### **Manejo de Errores:**

1. **En `handleSaveDraft`:**
```javascript
catch (saveError) {
  if (saveError?.response?.data?.error === 'invalid_dependencies') {
    const details = saveError.response.data.details || [];
    setError(`Errores de dependencias:\n${details.join('\n')}`);
    setValidationWarnings(saveError.response.data.warnings || []);
  }
}
```

2. **En `handlePublish`:**
```javascript
catch (publishError) {
  if (publishError?.response?.data?.error === 'cannot_publish_invalid_dependencies') {
    setError(`No se puede publicar: Errores de dependencias...`);
    setValidationWarnings(warnings);
  }
}
```

### **Componente Visual de Warnings:**

```jsx
{validationWarnings.length > 0 && (
  <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs">
    <div className="font-semibold text-orange-900 mb-2">
      ⚠️ Advertencias de Validación:
    </div>
    <ul className="space-y-1 text-orange-800">
      {validationWarnings.map((warning, idx) => (
        <li key={idx} className="flex items-start gap-2">
          <span className="text-orange-600">•</span>
          <span>{warning}</span>
        </li>
      ))}
    </ul>
    <div className="mt-2 text-xs text-orange-700">
      Estas advertencias no impiden guardar/publicar, pero deberías revisarlas.
    </div>
  </div>
)}
```

---

## 📊 Ejemplo de Flujo Completo

### **Escenario 1: Ciclo Detectado**

1. Admin crea tareas:
   - A depende de B
   - B depende de C
   - C depende de A ❌

2. Al guardar:
   ```
   ❌ ERROR: Ciclo detectado en dependencias de "Tarea A"
   ```

3. No se guarda hasta corregir

### **Escenario 2: Conflicto Temporal**

1. Admin crea tareas:
   - "Elegir venue" (0% - 20%)
   - "Reservar venue" (10% - 30%) - Depende de "Elegir venue"

2. Al guardar:
   ```
   ✅ Guardado correctamente
   ⚠️ Warning: "Reservar venue" empieza en 10%, pero su dependencia
       "Elegir venue" termina en 20%. Considera ajustar las fechas.
   ```

3. Se guarda con warning visible

### **Escenario 3: Referencia Inválida**

1. Admin elimina "Tarea B"
2. "Tarea C" aún depende de "Tarea B" ❌

3. Al guardar:
   ```
   ❌ ERROR: "Tarea C" depende de una tarea inexistente
   ```

---

## 🧪 Testing Recomendado

### **Test 1: Ciclo Simple**
```javascript
// A → B → A
blocks: [
  {
    items: [
      { title: "A", dependsOn: [{ blockIndex: 0, itemIndex: 1 }] },
      { title: "B", dependsOn: [{ blockIndex: 0, itemIndex: 0 }] }
    ]
  }
]
// Esperado: ERROR de ciclo
```

### **Test 2: Referencia Inválida**
```javascript
blocks: [
  {
    items: [
      { title: "A", dependsOn: [{ blockIndex: 99, itemIndex: 99 }] }
    ]
  }
]
// Esperado: ERROR de referencia inexistente
```

### **Test 3: Warning Temporal**
```javascript
blocks: [
  {
    items: [
      { title: "A", startPct: 0.5, endPct: 0.8, dependsOn: [] },
      { title: "B", startPct: 0.6, endPct: 0.9, dependsOn: [{ blockIndex: 0, itemIndex: 0 }] }
    ]
  }
]
// Esperado: WARNING (B empieza antes de que termine A)
```

---

## 📈 Beneficios Implementados

1. ✅ **Integridad de Datos**: No se pueden guardar dependencias inválidas
2. ✅ **Prevención de Deadlocks**: Detección de ciclos evita bloqueos lógicos
3. ✅ **Feedback Inmediato**: Errores y warnings claros para el admin
4. ✅ **Flexibilidad**: Warnings no bloquean (el admin decide)
5. ✅ **Auditabilidad**: Logs detallados de validaciones

---

## 🚀 Próximos Pasos (Fase 3)

- [ ] Runtime en frontend usuario (bloquear tareas con deps incompletas)
- [ ] Desbloqueo automático al completar prerequisito
- [ ] Notificaciones "Ahora puedes hacer X"
- [ ] Visualización de grafo de dependencias
- [ ] Métricas: % de tareas bloqueadas por dependencias

---

## 📝 Commits

- **Backend:** Funciones de validación (`flattenTasks`, `detectCycle`, `validateDependencies`)
- **Backend:** Endpoints actualizados con validación
- **Frontend:** Manejo de errores y warnings
- **Frontend:** Componente visual de advertencias

**Commit:** `9de72b33` - feat: implementar validaciones backend de dependencias (Fase 2)

---

## 🎯 Conclusión

La Fase 2 está completa y funcionando. El sistema ahora valida todas las dependencias en el backend antes de permitir guardar o publicar plantillas, asegurando la integridad de los datos y previniendo errores lógicos.

🔒 **Ninguna plantilla con dependencias inválidas puede ser publicada.**
⚠️ **Advertencias informativas ayudan al admin a optimizar las dependencias.**
