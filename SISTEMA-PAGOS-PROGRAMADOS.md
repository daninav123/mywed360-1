# 📅 Sistema de Pagos Programados - Contabilidad de Bodas

## **Descripción General**

Sistema completo de planificación de pagos para gestionar la contabilidad de proveedores de bodas. Permite definir planes de pago (ej: 25% reserva, 50% un mes antes, 25% día de la boda), sincronizarlos automáticamente con Finanzas y recibir alertas de saldo insuficiente.

⚠️ **IMPORTANTE**: Este NO es un sistema de procesamiento de pagos. Es una herramienta de **contabilidad y planificación** para llevar el control de cuándo y cuánto debes pagar a cada proveedor.

---

## **✨ Características Implementadas**

### **1. Editor de Plan de Pagos**
- 📝 Interfaz intuitiva para definir cuotas de pago
- 🎯 Plantillas predefinidas (Estándar 25-50-25, Fraccionado 50-50, Pago único, Personalizado)
- 💰 Cálculo automático de porcentajes y montos
- 📆 Fechas automáticas basadas en la fecha de la boda
- ✅ Validación en tiempo real (suma debe ser 100%)

### **2. Integración con Proveedores**
- 🔗 Botón "Definir plan de pagos" en formulario de proveedor
- 💾 Guardado automático en el documento del proveedor
- 📊 Resumen visual del plan (número de cuotas y total)

### **3. Sincronización con Finanzas**
- 🔄 Los planes de pago se reflejan automáticamente como transacciones programadas
- 📈 Visibilidad completa en página de Finanzas
- 🔔 Alertas inteligentes de saldo insuficiente

### **4. Alertas de Saldo**
- ⚠️ Detecta cuándo no tendrás saldo suficiente para un pago futuro
- 📅 Muestra pagos próximos (90 días por defecto)
- 💡 Recomendaciones y desglose detallado
- 🎨 Colores y severidad según urgencia

---

## **📦 Archivos Creados/Modificados**

### **Nuevos Componentes**

#### `PaymentScheduleEditor.jsx`
```
/apps/main-app/src/components/proveedores/PaymentScheduleEditor.jsx
```
**Propósito**: Modal para definir plan de pagos de un proveedor

**Props:**
- `totalAmount` (number): Monto total del servicio
- `schedule` (Array): Plan de pagos actual (para edición)
- `weddingDate` (Date|string): Fecha de la boda (para calcular fechas automáticas)
- `onSave` (Function): Callback al guardar → `(schedule) => void`
- `onCancel` (Function): Callback al cancelar

**Plantillas incluidas:**
- **Estándar (25-50-25)**: Reserva, un mes antes, día de la boda
- **Fraccionado (50-50)**: Reserva y día de la boda
- **Pago único (100%)**: Una sola fecha
- **Personalizado**: Define tus propias cuotas

#### `UpcomingPaymentsAlert.jsx`
```
/apps/main-app/src/components/finance/UpcomingPaymentsAlert.jsx
```
**Propósito**: Muestra alertas de pagos próximos y déficit de saldo

**Props:**
- `transactions` (Array): Array de transacciones
- `currentBalance` (number): Saldo actual disponible
- `daysLookahead` (number): Días hacia adelante para calcular (default: 90)

**Lógica:**
- Filtra gastos pendientes con `dueDate` futuro
- Simula balance día a día
- Detecta déficits de saldo
- Agrupa pagos por fecha
- Calcula días hasta vencimiento

### **Nuevo Servicio**

#### `paymentScheduleService.js`
```
/apps/main-app/src/services/paymentScheduleService.js
```
**Funciones exportadas:**

```javascript
// Genera transacciones desde plan de pagos
generateTransactionsFromSchedule(provider)

// Sincroniza plan con transacciones existentes
syncPaymentScheduleWithTransactions(provider, transactions, { addTransaction, updateTransaction, deleteTransaction })

// Calcula alertas de saldo insuficiente
calculateBalanceAlerts(transactions, currentBalance, daysLookahead)

// Obtiene el próximo pago de un proveedor
getNextPayment(provider)

// Calcula total pendiente/pagado
getTotalPending(provider)
getTotalPaid(provider)
```

### **Archivos Modificados**

#### `ProveedorForm.jsx`
- ✅ Import de `PaymentScheduleEditor`
- ✅ Estado `paymentSchedule` en formData
- ✅ Estado `showPaymentScheduleEditor` para modal
- ✅ Botón "Definir plan" / "Editar plan"
- ✅ Resumen visual del plan (cuotas programadas y total)
- ✅ Guardado de `paymentSchedule` en `onSubmit`

#### `Finance.jsx`
- ✅ Import de `UpcomingPaymentsAlert`
- ✅ Renderizado del componente después de KPIs
- ✅ Paso de `transactions`, `available` (saldo), y `daysLookahead`

#### `useProveedores.jsx`
- ✅ Import de `syncPaymentScheduleWithTransactions`
- ✅ Logging cuando se crea proveedor con plan de pagos

---

## **🔄 Flujo de Trabajo Completo**

### **Paso 1: Definir Proveedor con Plan de Pagos**

1. Usuario va a **Proveedores** → **Nuevo proveedor**
2. Rellena datos básicos (nombre, servicio, presupuesto asignado)
3. Click en **"Definir plan"** en sección "Plan de pagos"
4. Se abre modal `PaymentScheduleEditor`

### **Paso 2: Configurar Plan de Pagos**

**Opción A: Usar Plantilla**
1. Seleccionar plantilla (ej: Estándar 25-50-25)
2. Fechas se calculan automáticamente si hay fecha de boda
3. Ajustar si es necesario

**Opción B: Personalizar**
1. Seleccionar "Personalizado"
2. Añadir cuotas con botón "Añadir cuota"
3. Para cada cuota definir:
   - Descripción (ej: "Reserva", "Pago final")
   - Porcentaje o Monto (se calculan entre sí)
   - Fecha de pago
4. Verificar que suma total = 100%
5. Click "Guardar plan de pagos"

### **Paso 3: Guardar Proveedor**

1. Click "Crear proveedor"
2. El proveedor se guarda con estructura:

```javascript
{
  id: "prov-123",
  name: "Espacio La Huerta",
  service: "Espacio",
  assignedBudget: 10000,
  paymentSchedule: [
    {
      id: "inst-1",
      percentage: 25,
      amount: 2500,
      dueDate: "2025-01-15",
      description: "Reserva",
      status: "pending"
    },
    {
      id: "inst-2",
      percentage: 50,
      amount: 5000,
      dueDate: "2025-06-01",
      description: "Un mes antes",
      status: "pending"
    },
    {
      id: "inst-3",
      percentage: 25,
      amount: 2500,
      dueDate: "2025-07-01",
      description: "Día de la boda",
      status: "pending"
    }
  ]
}
```

### **Paso 4: Sincronización Automática (Futuro)**

> **NOTA**: La sincronización completa con transacciones aún no está implementada automáticamente. 
> Requiere integración adicional en el hook `useProveedores` para llamar a `syncPaymentScheduleWithTransactions` cuando se guarda un proveedor.

**Flujo previsto:**
1. Cuando se guarda/actualiza proveedor con `paymentSchedule`
2. Se llama a `syncPaymentScheduleWithTransactions`
3. Se crean/actualizan transacciones en Finanzas:

```javascript
{
  type: 'expense',
  amount: 2500,
  status: 'pending',
  category: 'Espacio',
  provider: 'Espacio La Huerta',
  concept: 'Espacio La Huerta - Reserva',
  dueDate: '2025-01-15',
  source: 'payment_schedule',
  meta: {
    providerId: 'prov-123',
    installmentId: 'inst-1'
  }
}
```

### **Paso 5: Visualización en Finanzas**

1. Usuario va a **Finanzas**
2. Ve alertas en la parte superior:

**Si hay saldo insuficiente:**
```
⚠️ Alerta de saldo insuficiente

No tendrás saldo suficiente para cubrir los siguientes pagos programados:

┌─────────────────────────────────────┐
│ 15 ene 2025 • En 30 días           │
│ Déficit: -500€                      │
│                                     │
│ Saldo disponible: 2,000€            │
│ Total necesario: 2,500€             │
│                                     │
│ Pagos programados:                  │
│ • Espacio La Huerta     2,500€      │
└─────────────────────────────────────┘

💡 Recomendación: Asegúrate de tener fondos...
```

**Si hay saldo suficiente:**
```
📅 Pagos programados próximos

Tienes 3 pagos programados en los próximos 90 días.

┌─────────────────────────────────────┐
│ Espacio La Huerta                   │
│ 15 ene 2025 • En 30 días   2,500€  │
└─────────────────────────────────────┘
...

Total a pagar: 10,000€
```

---

## **💾 Estructura de Datos**

### **Provider Document (Firestore)**

```javascript
{
  // Campos existentes
  id: string,
  name: string,
  service: string,
  assignedBudget: number,
  status: string,
  contact: string,
  email: string,
  phone: string,
  
  // NUEVO: Plan de pagos
  paymentSchedule: [
    {
      id: string,              // Único por cuota
      percentage: number,       // 0-100
      amount: number,          // Calculado: (percentage/100) * assignedBudget
      dueDate: string,         // ISO date: "2025-01-15"
      description: string,      // "Reserva", "Pago final", etc.
      status: string,          // "pending" | "paid" | "overdue"
      paidDate?: string,       // ISO date cuando se marca como pagado
      transactionId?: string   // Link a transaction en Finanzas
    }
  ]
}
```

### **Transaction Document (Firestore)**

```javascript
{
  // Campos existentes
  type: "expense" | "income",
  amount: number,
  status: "pending" | "paid" | "overdue" | "canceled",
  category: string,
  provider: string,
  concept: string,
  date: string,              // Fecha real de pago
  dueDate: string,           // IMPORTANTE: Fecha programada
  paidAmount: number,
  
  // NUEVO: Metadatos de plan de pagos
  source: "payment_schedule" | "manual" | "bank",
  meta: {
    providerId?: string,      // Link al proveedor
    installmentId?: string,   // Link a la cuota específica
    source: "payment_schedule"
  }
}
```

---

## **🔧 Próximos Pasos Recomendados**

### **1. Sincronización Automática Completa**

Actualmente la sincronización está preparada pero no conectada automáticamente. Para completarla:

**En `useProveedores.jsx`:**
```javascript
import useFinance from './useFinance';

// Dentro del hook
const { 
  transactions, 
  addTransaction, 
  updateTransaction, 
  deleteTransaction 
} = useFinance();

// Modificar addProvider y updateProvider
const addProvider = useCallback(async (providerData) => {
  // ... código existente ...
  
  // Después de guardar el proveedor
  if (newProvider.paymentSchedule?.length > 0) {
    await syncPaymentScheduleWithTransactions(
      newProvider,
      transactions,
      { addTransaction, updateTransaction, deleteTransaction }
    );
  }
  
  return newProvider;
}, [transactions, addTransaction, updateTransaction, deleteTransaction]);
```

### **2. Marcar Pagos como Realizados**

Crear flujo para actualizar el estado de una cuota cuando se paga:

```javascript
// En servicio o componente de Proveedores
const markInstallmentAsPaid = async (providerId, installmentId, paidDate) => {
  // 1. Actualizar provider.paymentSchedule[x].status = 'paid'
  // 2. Actualizar transaction correspondiente
  // 3. Actualizar provider.paymentSchedule[x].paidDate
};
```

### **3. Dashboard de Pagos**

Crear vista consolidada en Proveedores o Finanzas:
- Todos los pagos próximos de todos los proveedores
- Filtros por fecha, proveedor, estado
- Timeline visual de pagos

### **4. Notificaciones**

Implementar sistema de recordatorios:
- X días antes del vencimiento
- Día del vencimiento
- Si hay saldo insuficiente

### **5. Reportes**

Exportación de plan de pagos completo:
- PDF con calendario de pagos
- Excel con desglose por proveedor
- Compartir con pareja/familia

---

## **🧪 Cómo Probar el Sistema**

### **Test 1: Crear Proveedor con Plan de Pagos**

1. Ir a **Proveedores** → **Nuevo proveedor**
2. Rellenar:
   - Nombre: "Catering Deluxe"
   - Servicio: "Catering"
   - Presupuesto: 8000
3. Click "Definir plan"
4. Seleccionar plantilla "Estándar (25-50-25)"
5. Verificar:
   - Cuota 1: 2000€ (25%)
   - Cuota 2: 4000€ (50%)
   - Cuota 3: 2000€ (25%)
   - Total: 8000€ ✅
6. Ajustar fechas si es necesario
7. Guardar plan
8. Crear proveedor

### **Test 2: Verificar en Firestore**

Abrir Firebase Console → Firestore:
```
weddings/{weddingId}/suppliers/{providerId}
```

Debe contener campo `paymentSchedule` con array de 3 cuotas.

### **Test 3: Ver Alertas en Finanzas**

1. Ir a **Finanzas**
2. Verificar sección de alertas (debajo de KPIs)
3. Si saldo disponible < próximo pago → Ver alerta roja
4. Si saldo suficiente → Ver lista de pagos próximos

### **Test 4: Editar Plan de Pagos**

1. Editar proveedor existente
2. Click "Editar plan"
3. Añadir/eliminar cuotas
4. Modificar fechas/montos
5. Guardar cambios
6. Verificar que se actualiza correctamente

---

## **📚 Referencia de Plantillas**

### **Plantilla Estándar (25-50-25)**
```
✅ Uso: Espacios, catering, fotografía
📅 Fechas:
  - 25% → Fecha libre (reserva)
  - 50% → 30 días antes de la boda
  - 25% → Día de la boda
```

### **Plantilla Fraccionado (50-50)**
```
✅ Uso: Servicios simples, proveedores pequeños
📅 Fechas:
  - 50% → Fecha libre (reserva)
  - 50% → Día de la boda
```

### **Plantilla Pago Único (100%)**
```
✅ Uso: Servicios pequeños, pagos adelantados
📅 Fechas:
  - 100% → Fecha libre
```

### **Plantilla Personalizada**
```
✅ Uso: Casos especiales, múltiples cuotas
📅 Fechas: Las que definas
💡 Ejemplos:
  - 20-30-30-20 (4 cuotas trimestrales)
  - 10-20-30-40 (escalonado)
  - 33-33-34 (3 tercios)
```

---

## **🎯 Beneficios del Sistema**

### **Para los Usuarios**
- ✅ Claridad sobre cuándo pagar a cada proveedor
- ✅ Alertas proactivas si falta saldo
- ✅ Visión completa del flujo de caja
- ✅ Menos estrés financiero
- ✅ Mejor planificación

### **Para el Equipo de Desarrollo**
- ✅ Código modular y reutilizable
- ✅ Separación de responsabilidades clara
- ✅ Fácil de extender con nuevas funcionalidades
- ✅ Buena documentación
- ✅ Preparado para sincronización completa

---

## **❓ Preguntas Frecuentes**

### **¿Los pagos se procesan automáticamente?**
❌ **NO**. Este es un sistema de **contabilidad y planificación**, no procesa pagos reales. Solo te ayuda a llevar el control de cuándo y cuánto debes pagar.

### **¿Se sincronizan automáticamente los planes con Finanzas?**
⚠️ **Parcialmente**. La infraestructura está lista pero falta conectar el último paso. Actualmente:
- ✅ Se guarda el plan en el proveedor
- ✅ Se muestran alertas en Finanzas
- ⏳ Falta: Crear transacciones automáticamente

### **¿Puedo editar un plan de pagos después de crearlo?**
✅ **SÍ**. Edita el proveedor y click "Editar plan".

### **¿Qué pasa si cambio la fecha de la boda?**
⚠️ Las fechas calculadas automáticamente (ej: "30 días antes") se basan en la fecha de boda al momento de crear el plan. Si cambias la fecha de la boda después, debes editar manualmente el plan de pagos.

### **¿Puedo tener diferentes planes para diferentes proveedores?**
✅ **SÍ**. Cada proveedor tiene su propio plan independiente.

### **¿Las alertas consideran ingresos futuros?**
⚠️ Actualmente NO. Solo consideran el saldo actual disponible. Una mejora futura podría incluir ingresos programados en el cálculo.

---

## **🐛 Problemas Conocidos**

### **1. Sincronización Manual**
**Problema**: Las transacciones no se crean automáticamente al guardar un plan de pagos.  
**Workaround**: Crear transacciones manualmente en Finanzas con `dueDate`.  
**Solución**: Implementar el paso faltante en `useProveedores` (ver sección "Próximos Pasos").

### **2. Actualización de Fechas**
**Problema**: Si cambias la fecha de la boda, las fechas del plan no se actualizan automáticamente.  
**Workaround**: Editar manualmente el plan de cada proveedor.  
**Solución Futura**: Sistema de recalcular fechas basado en nueva fecha de boda.

### **3. Estados de Pago**
**Problema**: No hay flujo implementado para marcar una cuota como "pagada".  
**Workaround**: Cambiar el estado manualmente editando el proveedor.  
**Solución**: Implementar `markInstallmentAsPaid` (ver sección "Próximos Pasos").

---

## **📞 Soporte**

Para dudas o mejoras sobre el sistema de pagos programados:
1. Revisa esta documentación
2. Consulta el código fuente comentado
3. Verifica los ejemplos de uso
4. Contacta al equipo de desarrollo

---

**Versión**: 1.0.0  
**Fecha**: Diciembre 2024  
**Estado**: ✅ Implementación base completada - Sincronización pendiente
