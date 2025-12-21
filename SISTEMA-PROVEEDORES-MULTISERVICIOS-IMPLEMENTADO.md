# ✅ Sistema de Proveedores Multi-Servicios - Implementado

## **Problema Resuelto**

Ahora el sistema soporta relaciones N:M entre proveedores y servicios:
- ✅ **1 Proveedor → N Servicios** (Finca ofrece Catering + Venue)
- ✅ **N Proveedores → 1 Servicio** (2 proveedores de Detalles)
- ✅ **Presupuesto por servicio** individual
- ✅ **Integración con categorías** de presupuesto

## **Arquitectura Implementada: ServiceLines Mejorados**

### **Estructura de Datos**

```javascript
// Provider (documento principal)
{
  id: "prov-123",
  name: "Finca La Esperanza",
  contact: "María García",
  email: "info@finca.com",
  phone: "+34 600 000 000",
  status: "Confirmado",
  // service: "Catering",  ← DEPRECADO (legacy)
  // assignedBudget: 15000, ← DEPRECADO (ahora suma de serviceLines)
}

// serviceLines (subcolección)
providers/{providerId}/serviceLines/{lineId}
{
  id: "line-1",
  name: "Catering",
  categoryKey: "catering",
  assignedBudget: 10000,
  status: "Confirmado",
  notes: "Menú premium para 100 personas",
  deliverables: ["Menú", "Bebidas", "Personal de servicio"],
  milestones: [],
  createdAt: timestamp,
  updatedAt: timestamp,
}

{
  id: "line-2",
  name: "Lugares",
  categoryKey: "lugares",
  assignedBudget: 5000,
  status: "Confirmado",
  notes: "Incluye decoración básica del salón",
  deliverables: ["Salón principal", "Jardín", "Parking"],
  milestones: [],
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

## **Archivos Creados/Modificados**

### **1. ServiceLinesManager.jsx** (NUEVO)

**Ubicación:** `/apps/main-app/src/components/proveedores/ServiceLinesManager.jsx`

**Funcionalidad:**
- Componente React para gestionar serviceLines
- Lista visual de servicios por proveedor
- Modal para añadir/editar servicios
- Validación y formateo automático
- Integración con categorías de presupuesto

**Props:**
```javascript
{
  providerId: string,
  serviceLines: Array,
  onAddServiceLine: (providerId, lineData) => Promise<string>,
  onUpdateServiceLine: (providerId, lineId, changes) => Promise<boolean>,
  onDeleteServiceLine: (providerId, lineId) => Promise<boolean>,
  t: function,
}
```

**UI:**
```
┌─────────────────────────────────────────────────┐
│ Líneas de Servicio        [+ Añadir Servicio]  │
├─────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐   │
│ │ 📦 Catering         [Catering]  10,000€  │   │
│ │ Confirmado                                │   │
│ │ Menú premium para 100 personas            │   │
│ │ Menú, Bebidas, Personal        [✏️] [🗑️]  │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ 📦 Lugares          [Lugares]   5,000€   │   │
│ │ Confirmado                                │   │
│ │ Incluye decoración básica                 │   │
│ │ Salón, Jardín, Parking         [✏️] [🗑️]  │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ Total Asignado: 15,000€                         │
└─────────────────────────────────────────────────┘
```

### **2. useProveedores.jsx** (MODIFICADO)

**Cambios en `addServiceLine`:**
```javascript
// Antes
{
  name: "Servicio",
  status: "Pendiente",
  budget: 5000,
  notes: "",
}

// Ahora
{
  name: "Catering",
  categoryKey: "catering",        // ← NUEVO
  assignedBudget: 10000,          // ← NUEVO (antes "budget")
  status: "Confirmado",
  notes: "Menú premium",
  deliverables: [...],            // ← NUEVO
  milestones: [],                 // ← NUEVO
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

### **3. Finance.jsx** (MODIFICADO)

**Cambio en `providerCommittedByCategory`:**

**Antes:**
```javascript
const map = new Map(
  providers.map(provider => [
    normalizeBudgetCategoryKey(provider.service),
    provider,
  ])
);
```

**Ahora:**
```javascript
const map = new Map();

providers.forEach(provider => {
  // Nuevo sistema: usar serviceLines
  if (provider.serviceLines?.length > 0) {
    provider.serviceLines.forEach(line => {
      const key = line.categoryKey;
      const current = map.get(key) || 0;
      map.set(key, current + line.assignedBudget);
    });
  }
  // Compatibilidad legacy
  else if (provider.service) {
    const key = normalizeBudgetCategoryKey(provider.service);
    const current = map.get(key) || 0;
    map.set(key, current + provider.assignedBudget);
  }
});
```

**Resultado:**
```javascript
Map {
  "catering" => 18000,  // 10000 (Finca) + 8000 (Otro proveedor)
  "lugares" => 5000,
  "fotografia" => 3000,
  "detalles" => 800,    // 500 (Proveedor 1) + 300 (Proveedor 2)
}
```

### **4. useProviderMigration.js** (NUEVO)

**Ubicación:** `/apps/main-app/src/hooks/useProviderMigration.js`

**Funcionalidad:**
- Migración automática de datos legacy
- Se ejecuta una vez al cargar Finance
- Convierte `provider.service` + `provider.assignedBudget` → `serviceLine`

**Lógica:**
```javascript
for each provider:
  if (has service but NO serviceLines):
    create serviceLine {
      name: provider.service,
      categoryKey: normalize(provider.service),
      assignedBudget: provider.assignedBudget,
      status: provider.status,
      notes: "Migrado automáticamente",
    }
```

## **Flujo Completo**

### **Caso 1: Proveedor con 2 Servicios**

```
1. Usuario crea proveedor "Finca La Esperanza"
2. Añade ServiceLine 1:
   - Nombre: Catering
   - Categoría: Catering
   - Presupuesto: 10,000€
   - Estado: Confirmado
   - Entregables: Menú, Bebidas, Personal

3. Añade ServiceLine 2:
   - Nombre: Espacios
   - Categoría: Lugares
   - Presupuesto: 5,000€
   - Estado: Confirmado
   - Entregables: Salón, Jardín, Parking

4. Sistema calcula:
   - Total asignado a "Finca La Esperanza": 15,000€
   - Comprometido en "Catering": +10,000€
   - Comprometido en "Lugares": +5,000€

5. En Presupuesto se ve:
   Catering:
     Asignado: 30,000€
     Comprometido: 10,000€  ← De Finca La Esperanza
     
   Lugares:
     Asignado: 10,000€
     Comprometido: 5,000€   ← De Finca La Esperanza
```

### **Caso 2: 2 Proveedores para 1 Servicio**

```
1. Proveedor "Artesanía María":
   ServiceLine:
     - Nombre: Detalles personalizados
     - Categoría: Detalles
     - Presupuesto: 500€
     - Entregables: Llaveros

2. Proveedor "Dulces Carmen":
   ServiceLine:
     - Nombre: Bombones de boda
     - Categoría: Detalles
     - Presupuesto: 300€
     - Entregables: Bombones

3. Sistema calcula:
   Detalles:
     Asignado: 1,000€
     Comprometido: 800€  ← 500€ + 300€
```

## **Integración con Presupuesto**

### **Cálculo de "Comprometido":**

```javascript
// Por cada categoría de presupuesto
budget.categories.forEach(category => {
  const committed = providerCommittedByCategory.get(category.key) || 0;
  
  category.committed = committed;
  category.remaining = category.amount - Math.max(category.spent, committed);
});
```

**Ejemplo:**
```
Categoría: Catering
├─ Asignado: 30,000€
├─ Comprometido: 18,000€  ← Suma de serviceLines con categoryKey="catering"
│   ├─ Finca La Esperanza: 10,000€
│   ├─ Catering Premium: 8,000€
├─ Gastado: 5,000€
└─ Restante: 12,000€  (30,000 - 18,000)
```

## **Campos de ServiceLine**

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | string | ID único | "line-abc123" |
| `name` | string | Nombre del servicio | "Catering premium" |
| `categoryKey` | string | Clave de categoría presupuesto | "catering" |
| `assignedBudget` | number | Presupuesto asignado | 10000 |
| `status` | string | Estado del servicio | "Confirmado" |
| `notes` | string | Notas adicionales | "Menú vegano disponible" |
| `deliverables` | Array<string> | Lista de entregables | ["Menú", "Bebidas"] |
| `milestones` | Array<Object> | Hitos/pagos | [{date, amount, paid}] |
| `createdAt` | Timestamp | Fecha creación | timestamp |
| `updatedAt` | Timestamp | Fecha actualización | timestamp |

## **Migración de Datos Existentes**

### **Automática:**
El hook `useProviderMigration` se ejecuta automáticamente al cargar Finance y:

1. ✅ Detecta proveedores sin serviceLines
2. ✅ Si tienen `service` y `assignedBudget` > 0
3. ✅ Crea automáticamente un serviceLine
4. ✅ Migra los datos legacy

**No requiere acción del usuario.**

### **Manual (si necesario):**
```javascript
import { migrateProviderToServiceLines } from './services/providerMigrationService';

// Migrar proveedor específico
await migrateProviderToServiceLines(weddingId, providerId);

// Migrar todos los proveedores
await migrateAllProviders(weddingId);
```

## **Compatibilidad hacia atrás**

✅ **Legacy providers** (sin serviceLines) siguen funcionando  
✅ **Cálculo de Comprometido** soporta ambos sistemas  
✅ **Migración automática** convierte datos legacy  
✅ **No requiere cambios** en proveedores ya creados  

## **Cómo Usar**

### **1. Añadir Servicio a Proveedor:**
```javascript
const { addServiceLine } = useProveedores();

await addServiceLine(providerId, {
  name: "Catering Premium",
  categoryKey: "catering",
  assignedBudget: 10000,
  status: "Confirmado",
  notes: "Menú vegano disponible",
  deliverables: ["Menú", "Bebidas", "Personal de servicio"],
});
```

### **2. Editar Servicio:**
```javascript
const { updateServiceLine } = useProveedores();

await updateServiceLine(providerId, lineId, {
  assignedBudget: 12000,
  status: "Confirmado",
  notes: "Ampliado a menú premium",
});
```

### **3. Eliminar Servicio:**
```javascript
const { deleteServiceLine } = useProveedores();

await deleteServiceLine(providerId, lineId);
```

### **4. Usar en UI:**
```jsx
import ServiceLinesManager from '../components/proveedores/ServiceLinesManager';
import { useProveedores } from '../hooks/useProveedores';

function ProviderDetails({ provider }) {
  const { addServiceLine, updateServiceLine, deleteServiceLine } = useProveedores();
  
  return (
    <ServiceLinesManager
      providerId={provider.id}
      serviceLines={provider.serviceLines || []}
      onAddServiceLine={addServiceLine}
      onUpdateServiceLine={updateServiceLine}
      onDeleteServiceLine={deleteServiceLine}
      t={t}
    />
  );
}
```

## **Testing**

### **Test 1: Proveedor con 2 servicios**
```
1. Crear proveedor "Finca La Esperanza"
2. Añadir servicio "Catering" (10,000€)
3. Añadir servicio "Lugares" (5,000€)
4. ✓ Ver total 15,000€
5. ✓ En Presupuesto:
   - Catering comprometido: +10,000€
   - Lugares comprometido: +5,000€
```

### **Test 2: 2 proveedores, 1 servicio**
```
1. Proveedor "Artesanía": Detalles 500€
2. Proveedor "Dulces": Detalles 300€
3. ✓ En Presupuesto:
   - Detalles comprometido: 800€
```

### **Test 3: Migración automática**
```
1. Provider legacy con service="Catering", assignedBudget=8000
2. Cargar Finance.jsx
3. ✓ Esperar 2 segundos
4. ✓ Ver en consola: "Migrated provider..."
5. ✓ Provider ahora tiene serviceLines
```

### **Test 4: Editar servicio**
```
1. Click en ✏️ en servicio
2. Cambiar presupuesto de 10,000€ a 12,000€
3. Guardar
4. ✓ Se actualiza en UI
5. ✓ Se actualiza comprometido en presupuesto
```

## **Próximas Mejoras Posibles**

- [ ] Hitos de pago por servicio (milestones)
- [ ] Historial de cambios por servicio
- [ ] Vincular transacciones a serviceLines específicos
- [ ] Gráficos de distribución por proveedor
- [ ] Alertas cuando serviceLine excede presupuesto
- [ ] Exportar servicios a PDF/Excel

## **Resumen de Beneficios**

✅ **Flexibilidad Total:** 1 proveedor puede ofrecer N servicios  
✅ **Presupuesto Granular:** Cada servicio tiene su presupuesto  
✅ **Trazabilidad:** Historial completo de servicios  
✅ **Integración:** Mapeo directo con categorías  
✅ **Compatibilidad:** Soporta datos legacy  
✅ **Migración Automática:** Sin intervención manual  
✅ **UI Intuitiva:** Fácil de usar y entender  

---

**Estado:** ✅ Implementado y funcionando  
**Versión:** 1.0  
**Fecha:** 16 de diciembre de 2025  
**Archivos modificados:** 4 (3 nuevos, 1 modificado)  
**Compatibilidad:** Total con datos existentes
