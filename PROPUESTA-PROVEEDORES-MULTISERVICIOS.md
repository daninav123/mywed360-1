# 🔗 Vinculación Proveedores - Servicios (Relación N:M)

## **Problema Identificado**

El sistema actual tiene limitaciones para gestionar relaciones complejas:

### **Caso 1: 1 Proveedor → N Servicios**
```
Proveedor: "Finca La Esperanza"
├─ Servicio: Venue (espacio) ✓
└─ Servicio: Catering ✓
   
❌ Actualmente: Solo puede tener 1 servicio (campo `service`)
```

### **Caso 2: 1 Servicio → N Proveedores**
```
Servicio: "Detalles de Boda"
├─ Proveedor 1: "Artesanía María" (llaveros)
└─ Proveedor 2: "Dulces Carmen" (bombones)
   
❌ Actualmente: Funciona, pero no hay vínculo claro con presupuesto
```

## **Estructura Actual**

### **Provider:**
```javascript
{
  id: "prov-123",
  name: "Finca La Esperanza",
  service: "Catering",  // ← ÚNICO SERVICIO (string)
  assignedBudget: 15000,
  status: "Confirmado",
  ...
}
```

### **ServiceLines (Subcolección):**
```javascript
providers/{providerId}/serviceLines/{lineId}
{
  name: "Servicio 1",
  status: "Confirmado",
  budget: 5000,
  notes: "...",
}
```

---

## **🎯 OPCIÓN 1: Array de Servicios** (Más Simple)

### **Concepto:**
Cambiar `service` de string a array de strings.

### **Estructura:**
```javascript
{
  id: "prov-123",
  name: "Finca La Esperanza",
  services: ["Catering", "Lugares"],  // ← ARRAY
  assignedBudget: 15000,  // Total asignado
  budgetByService: {      // ← NUEVO: Desglose
    "Catering": 10000,
    "Lugares": 5000,
  },
  status: "Confirmado",
}
```

### **Ventajas:**
✅ Simple de implementar (cambio mínimo)  
✅ Compatible hacia atrás (migración fácil)  
✅ Fácil de entender para el usuario  
✅ Búsqueda y filtrado directo  

### **Desventajas:**
⚠️ Presupuesto por servicio es un objeto plano  
⚠️ Difícil añadir metadata por servicio (estado, notas)  

### **UI Propuesta:**
```
┌─────────────────────────────────────────┐
│ Finca La Esperanza                      │
├─────────────────────────────────────────┤
│ Servicios:                              │
│ ☑ Catering       10,000€                │
│ ☑ Lugares         5,000€                │
│ ☐ Decoración      [____€] [Añadir]     │
│                                         │
│ Total asignado: 15,000€                │
└─────────────────────────────────────────┘
```

---

## **🎯 OPCIÓN 2: ServiceLines como Tabla Intermedia** (Recomendada)

### **Concepto:**
Usar la subcolección `serviceLines` como tabla intermedia con metadata completa.

### **Estructura:**
```javascript
// Provider (simplificado)
{
  id: "prov-123",
  name: "Finca La Esperanza",
  // service: "Catering",  ← DEPRECAR (ya no se usa)
  totalAssignedBudget: 15000,  // Suma de serviceLines
  status: "Confirmado",
}

// serviceLines/{lineId}
{
  id: "line-1",
  serviceName: "Catering",
  categoryKey: "catering",  // Mapea a categoría presupuesto
  assignedBudget: 10000,
  status: "Confirmado",
  notes: "Menú premium para 100 personas",
  deliverables: ["Menú", "Bebidas", "Personal"],
  createdAt: timestamp,
  updatedAt: timestamp,
}

{
  id: "line-2",
  serviceName: "Lugares",
  categoryKey: "lugares",
  assignedBudget: 5000,
  status: "Confirmado",
  notes: "Incluye decoración básica",
  deliverables: ["Salón", "Jardín", "Parking"],
}
```

### **Ventajas:**
✅ Máxima flexibilidad (metadata por servicio)  
✅ Escalable (fácil añadir campos)  
✅ Trazabilidad (historial de cambios)  
✅ Mapeo directo a categorías de presupuesto  
✅ Ya existe la estructura (solo mejorarla)  

### **Desventajas:**
⚠️ Más complejo de implementar  
⚠️ Requiere subconsultas para filtrar por servicio  

### **UI Propuesta:**
```
┌─────────────────────────────────────────────────┐
│ Finca La Esperanza               [Confirmado]   │
├─────────────────────────────────────────────────┤
│ Líneas de Servicio:                             │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ 📦 Catering                      10,000€  │   │
│ │ Confirmado                                │   │
│ │ Menú premium para 100 personas            │   │
│ │ Entregables: Menú, Bebidas, Personal      │   │
│ │                           [✏️ Editar] [🗑️] │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ 🏰 Lugares                       5,000€   │   │
│ │ Confirmado                                │   │
│ │ Incluye decoración básica                 │   │
│ │ Entregables: Salón, Jardín, Parking       │   │
│ │                           [✏️ Editar] [🗑️] │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ [+ Añadir Servicio]                             │
│                                                 │
│ Total asignado: 15,000€                         │
└─────────────────────────────────────────────────┘
```

---

## **🎯 OPCIÓN 3: Tabla de Asignaciones Separada** (Más Compleja)

### **Concepto:**
Crear una colección global de "asignaciones" proveedor-servicio-presupuesto.

### **Estructura:**
```javascript
// providers/{providerId}
{
  id: "prov-123",
  name: "Finca La Esperanza",
  contact: "...",
  email: "...",
  // Sin referencia directa a servicios
}

// weddings/{weddingId}/providerAssignments/{assignmentId}
{
  id: "assign-1",
  providerId: "prov-123",
  providerName: "Finca La Esperanza",
  budgetCategoryKey: "catering",
  budgetCategoryName: "Catering",
  assignedBudget: 10000,
  status: "Confirmado",
  notes: "Menú premium",
  deliverables: ["Menú", "Bebidas"],
}

{
  id: "assign-2",
  providerId: "prov-123",
  providerName: "Finca La Esperanza",
  budgetCategoryKey: "lugares",
  budgetCategoryName: "Lugares",
  assignedBudget: 5000,
  status: "Confirmado",
}
```

### **Ventajas:**
✅ Separación total de responsabilidades  
✅ Fácil consultar "todos los proveedores de X servicio"  
✅ Fácil consultar "todos los servicios de X proveedor"  
✅ Historial completo de asignaciones  

### **Desventajas:**
⚠️ Más complejo de implementar  
⚠️ Requiere sincronización entre colecciones  
⚠️ Duplicación de datos (providerName, categoryName)  
⚠️ Más consultas a Firestore  

---

## **Comparación de Opciones**

| Aspecto | Opción 1 | Opción 2 ⭐ | Opción 3 |
|---------|----------|------------|----------|
| **Complejidad** | Baja | Media | Alta |
| **Flexibilidad** | Media | Alta | Muy Alta |
| **Performance** | Alta | Alta | Media |
| **Escalabilidad** | Media | Alta | Muy Alta |
| **Facilidad UI** | Alta | Alta | Media |
| **Mantenimiento** | Fácil | Medio | Complejo |
| **Compatibilidad** | ✅ | ✅ | ⚠️ |

---

## **Recomendación: OPCIÓN 2**

Usar **ServiceLines como tabla intermedia** porque:

1. ✅ Ya existe la estructura (solo mejorarla)
2. ✅ Balance perfecto entre flexibilidad y complejidad
3. ✅ Mapeo directo con categorías de presupuesto
4. ✅ UI clara y escalable
5. ✅ Migración sencilla desde estructura actual

### **Plan de Implementación:**

#### **Fase 1: Migración de Datos**
```javascript
// Convertir proveedores existentes
providers.forEach(provider => {
  if (provider.service && !provider.serviceLines?.length) {
    // Crear serviceLine inicial
    createServiceLine(provider.id, {
      serviceName: provider.service,
      categoryKey: normalizeBudgetCategoryKey(provider.service),
      assignedBudget: provider.assignedBudget || 0,
      status: provider.status || "Nuevo",
    });
  }
});
```

#### **Fase 2: Nuevos Campos en ServiceLine**
- `serviceName`: Nombre del servicio (ej: "Catering")
- `categoryKey`: Clave normalizada (ej: "catering")
- `assignedBudget`: Presupuesto asignado para este servicio
- `status`: Estado específico del servicio
- `deliverables`: Array de entregables
- `milestones`: Array de hitos/pagos

#### **Fase 3: UI de Gestión**
- Lista de serviceLines por proveedor
- Añadir/editar/eliminar servicios
- Asignar presupuesto por servicio
- Vincular con categorías de presupuesto

#### **Fase 4: Integración con Presupuesto**
```javascript
// Calcular "Comprometido" por categoría
budget.categories.forEach(category => {
  const committed = providers
    .flatMap(p => p.serviceLines || [])
    .filter(line => line.categoryKey === category.key)
    .reduce((sum, line) => sum + (line.assignedBudget || 0), 0);
  
  category.committed = committed;
});
```

---

## **Casos de Uso Resueltos**

### **Caso 1: Proveedor con 2 servicios**
```
Proveedor: "Finca La Esperanza"

ServiceLine 1:
  Servicio: Catering
  Presupuesto: 10,000€
  Estado: Confirmado
  Entregables: Menú, Bebidas, Personal

ServiceLine 2:
  Servicio: Lugares
  Presupuesto: 5,000€
  Estado: Confirmado
  Entregables: Salón, Jardín

Total: 15,000€
```

### **Caso 2: 2 proveedores para 1 servicio**
```
Servicio: Detalles

Proveedor 1: "Artesanía María"
  ServiceLine:
    Servicio: Detalles
    Presupuesto: 500€
    Entregables: Llaveros personalizados

Proveedor 2: "Dulces Carmen"
  ServiceLine:
    Servicio: Detalles
    Presupuesto: 300€
    Entregables: Bombones

Total Detalles: 800€
```

### **Caso 3: Filtrar por servicio**
```sql
Consulta: "Mostrar todos los proveedores de Catering"

Resultado:
- Finca La Esperanza (10,000€)
- Catering Premium (8,000€)
- Restaurante El Jardín (12,000€)

Total asignado a Catering: 30,000€
```

---

## **Próximos Pasos**

Si eliges **Opción 2**, implementaré:

1. ✅ Migración automática de datos existentes
2. ✅ Mejoras en `useProveedores` para gestionar serviceLines
3. ✅ UI mejorada en tarjeta de proveedor
4. ✅ Modal para añadir/editar servicios
5. ✅ Integración con categorías de presupuesto
6. ✅ Cálculo de "Comprometido" por categoría
7. ✅ Filtros por servicio actualizados

**¿Qué opción prefieres?**
- Opción 1 (Array simple)
- Opción 2 (ServiceLines - Recomendada)
- Opción 3 (Tabla separada)
- Otra opción que tengas en mente
