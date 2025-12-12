# 🐛 DEBUG: Por qué no se ven invitados en las mesas

## Problemas Identificados:

### 1. ✅ Loop Infinito - ARREGLADO

- **Archivo:** `ConfettiCelebration.jsx`
- **Causa:** `onComplete` en dependencias del useEffect
- **Fix:** Removido de dependencias

### 2. ⚠️ Contador 0/10 en todas las mesas

**Causa:** Los invitados no tienen `tableId` asignado.

**Cómo verificarlo:**

1. Abre la consola del navegador (F12)
2. Ejecuta este código:

```javascript
// Ver estado de invitados
const guests = window.guestsList || [];
console.log('Total invitados:', guests.length);
console.log('Con tableId:', guests.filter((g) => g.tableId).length);
console.log('Con table:', guests.filter((g) => g.table).length);

// Ver primeros 5 invitados
guests.slice(0, 5).forEach((g) => {
  console.log({
    nombre: g.name || g.nombre,
    tableId: g.tableId,
    table: g.table,
  });
});
```

**Soluciones posibles:**

#### A. Si generaste mesas automáticamente:

El generador de layouts debe asignar `tableId` a cada invitado.

Verifica en:

- `useSeatingPlan.js` → función `autoAssignGuests`
- `seatingLayoutGenerator.js` → después de crear mesas

#### B. Si arrastraste invitados manualmente:

El drag & drop debe actualizar `tableId`.

Verifica en:

- `TableItem.jsx` línea 101 → `onAssignGuest`

#### C. Solución rápida (temporal):

Puedes asignar invitados manualmente en consola:

```javascript
// TEMPORAL: Asignar primeros 10 invitados a mesa 1
const assignToTable1 = async () => {
  const guests = window.guestsList || [];
  const first10 = guests.slice(0, 10);

  // Aquí necesitarías llamar a la función de tu contexto
  // para actualizar en Firebase
};
```

## Próximos pasos:

1. ✅ Recargar página (el loop infinito ya está arreglado)
2. 🔍 Ejecutar comandos de debug en consola
3. 📝 Reportar qué muestra la consola
4. 🔧 Arreglar la asignación de tableId
