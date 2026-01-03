# Sistema de Dependencias entre Subtareas

## 📋 Objetivo

Implementar un sistema que permita definir **dependencias** entre subtareas, de modo que algunas tareas no puedan iniciarse hasta que otras se completen.

## 🎯 Casos de Uso

1. **Dependencias Simples**: "Contratar fotógrafo" debe completarse antes de "Reunión con fotógrafo"
2. **Dependencias Múltiples**: "Enviar invitaciones" requiere que se completen "Diseñar invitación" Y "Lista de invitados final"
3. **Cadenas**: Tarea A → Tarea B → Tarea C
4. **Bloqueos Visuales**: Mostrar en UI que una tarea está bloqueada

## 🔧 Estructura de Datos

### Esquema JSON de Subtarea con Dependencias

```json
{
  "title": "Reunión con fotógrafo",
  "startPct": 0.4,
  "endPct": 0.5,
  "priority": "high",
  "category": "FOTOGRAFÍA",
  "tags": [],
  "checklist": [],
  "dependsOn": [
    {
      "blockIndex": 0,
      "itemIndex": 2,
      "blockName": "Pre-boda",
      "itemTitle": "Contratar fotógrafo"
    }
  ]
}
```

### Campos Nuevos

- **`dependsOn`**: Array de objetos con referencias a otras subtareas
  - `blockIndex`: Índice del bloque padre
  - `itemIndex`: Índice de la subtarea dentro del bloque
  - `blockName`: Nombre legible del bloque (para UI)
  - `itemTitle`: Título legible de la tarea (para UI)

## 🎨 Interfaz de Usuario

### 1. Modal de Edición de Dependencias

```jsx
<button onClick={() => setShowDependenciesModal(true)}>
  🔗 Gestionar Dependencias ({task.dependsOn?.length || 0})
</button>
```

### 2. Selector de Tareas Disponibles

- Lista todas las tareas de todos los bloques
- Permite seleccionar múltiples dependencias
- Previene ciclos (tarea no puede depender de sí misma ni crear ciclos)
- Muestra advertencia si la dependencia crea conflictos temporales

### 3. Indicador Visual

```jsx
{task.dependsOn?.length > 0 && (
  <div className="flex items-center gap-1 text-xs text-orange-600">
    <span>🔒</span>
    <span>Depende de {task.dependsOn.length} tarea(s)</span>
  </div>
)}
```

## 📐 Validaciones

### Backend

1. **Prevención de Ciclos**:
   ```javascript
   function detectCycle(tasks, currentTask, visitedSet) {
     if (visitedSet.has(currentTask.id)) return true;
     visitedSet.add(currentTask.id);
     
     for (const dep of currentTask.dependsOn || []) {
       const depTask = findTask(tasks, dep);
       if (detectCycle(tasks, depTask, new Set(visitedSet))) {
         return true;
       }
     }
     return false;
   }
   ```

2. **Validación de Referencias**:
   - Verificar que blockIndex e itemIndex existen
   - Verificar que no hay referencias a tareas eliminadas

3. **Validación Temporal**:
   - La tarea dependiente debe empezar después de que termine la tarea requerida
   - `taskB.startPct >= taskA.endPct`

### Frontend

- Mostrar warning si las fechas no son coherentes
- Permitir ignorar warning (admin puede forzarlo)
- Deshabilitar checkbox de tareas que crearían ciclo

## 💻 Implementación Propuesta

### 1. Modificar `handleAddSubtask` en AdminTaskTemplates.jsx

```javascript
const handleAddSubtask = () => {
  // ... código existente ...
  
  block.items.push({
    title: newSubtask.title,
    startPct: parseFloat(newSubtask.startPct) / 100,
    endPct: parseFloat(newSubtask.endPct) / 100,
    priority: newSubtask.priority,
    category: block.admin?.category || 'OTROS',
    tags: [],
    checklist: [],
    dependsOn: [] // Nuevo campo
  });
};
```

### 2. Crear Componente de Gestión de Dependencias

```javascript
const DependenciesModal = ({ task, allTasks, onSave, onClose }) => {
  const [selectedDeps, setSelectedDeps] = useState(task.dependsOn || []);
  
  const toggleDependency = (dep) => {
    // Lógica para añadir/quitar dependencias
  };
  
  return (
    <div className="modal">
      <h3>Gestionar Dependencias</h3>
      <div className="task-list">
        {allTasks.map(t => (
          <label key={t.id}>
            <input 
              type="checkbox"
              checked={isDependency(t)}
              onChange={() => toggleDependency(t)}
            />
            {t.blockName} → {t.itemTitle}
          </label>
        ))}
      </div>
      <button onClick={() => onSave(selectedDeps)}>Guardar</button>
    </div>
  );
};
```

### 3. Backend: Validar en `saveTaskTemplateDraft`

```javascript
// backend/routes/admin-dashboard.js
router.post('/task-templates/draft', async (req, res) => {
  const { blocks } = req.body;
  
  // Validar dependencias
  const validation = validateDependencies(blocks);
  if (!validation.valid) {
    return res.status(400).json({ 
      error: 'Dependencias inválidas', 
      details: validation.errors 
    });
  }
  
  // ... resto del código ...
});

function validateDependencies(blocks) {
  const errors = [];
  const allTasks = flattenTasks(blocks);
  
  for (const task of allTasks) {
    // Verificar referencias válidas
    for (const dep of task.dependsOn || []) {
      const depTask = findTask(allTasks, dep);
      if (!depTask) {
        errors.push(`Tarea "${task.title}" depende de tarea inexistente`);
      }
    }
    
    // Detectar ciclos
    if (hasCycle(task, allTasks)) {
      errors.push(`Ciclo detectado en dependencias de "${task.title}"`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}
```

## 🚀 Roadmap de Implementación

### Fase 1: Backend (1-2h)
- [ ] Añadir campo `dependsOn` al esquema
- [ ] Implementar función `validateDependencies`
- [ ] Implementar detección de ciclos
- [ ] Añadir endpoint para obtener grafo de dependencias

### Fase 2: Frontend - Básico (2-3h)
- [ ] Añadir campo `dependsOn` en `handleAddSubtask`
- [ ] Mostrar indicador visual de dependencias
- [ ] Crear modal simple de gestión
- [ ] Permitir añadir/quitar dependencias

### Fase 3: Frontend - Avanzado (2-3h)
- [ ] Validación en tiempo real (prevenir ciclos)
- [ ] Warnings de conflictos temporales
- [ ] Visualización de grafo de dependencias
- [ ] Auto-ordenar tareas por dependencias

### Fase 4: Runtime (1-2h)
- [ ] Lógica en frontend usuario para bloquear tareas
- [ ] Desbloquear automáticamente al completar dependencia
- [ ] Notificaciones "Ahora puedes hacer X"
- [ ] Progreso visual con dependencias

## 📊 Visualización de Grafo (Opcional)

Usar biblioteca como `react-flow` o `vis-network` para mostrar:

```
┌──────────────┐
│ Elegir venue │
└──────┬───────┘
       │
       ↓
┌──────────────┐     ┌────────────────┐
│ Reservar     │ ──→ │ Pagar depósito │
└──────────────┘     └────────────────┘
```

## 🎯 Beneficios

1. **Claridad**: Usuarios ven orden lógico de tareas
2. **Prevención de errores**: No hacen tareas en orden incorrecto
3. **Gamificación**: Desbloquear tareas = progreso satisfactorio
4. **Planificación**: Admin define flujo óptimo

## 🔍 Ejemplo Real

```json
{
  "name": "Pre-boda",
  "items": [
    {
      "title": "Elegir fotógrafo",
      "dependsOn": []
    },
    {
      "title": "Contratar fotógrafo",
      "dependsOn": [
        { "blockIndex": 0, "itemIndex": 0, "blockName": "Pre-boda", "itemTitle": "Elegir fotógrafo" }
      ]
    },
    {
      "title": "Sesión de fotos pre-boda",
      "dependsOn": [
        { "blockIndex": 0, "itemIndex": 1, "blockName": "Pre-boda", "itemTitle": "Contratar fotógrafo" }
      ]
    }
  ]
}
```

---

**¿Quieres que implemente esto ahora?** 

Puedo empezar por:
1. ✅ Añadir campo `dependsOn` al esquema
2. ✅ Crear modal básico de gestión de dependencias
3. ✅ Añadir indicadores visuales
4. ⏳ Validación backend (fase siguiente)
