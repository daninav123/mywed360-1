# 🐛 DEBUG: Tarjetas no se actualizan al guardar en modal

## 🎯 PROBLEMA REPORTADO

"Cuando guardo algún cambio hecho en el botón que sirve para configurar los servicios, no se actualiza el cambio en las tarjetas hasta que no recargo la página"

## 🔍 ANÁLISIS DEL CÓDIGO ACTUAL

### 1. Hook useWeddingCategories (src/hooks/useWeddingCategories.js)

```javascript
// Líneas 62-88
const updateActiveCategories = async (categories) => {
  // ...
  await updateDoc(weddingRef, {
    activeCategories: categories,
    updatedAt: new Date().toISOString(),
  });

  // ⚠️ CRÍTICO: Crear una NUEVA referencia del array
  setActiveCategories([...categories]);
  console.log('   ✅ Estado actualizado en hook (nueva referencia del array)');
};

// Líneas 138-143
const isCategoryActive = useCallback(
  (categoryId) => {
    return activeCategories.includes(categoryId);
  },
  [activeCategories] // ← DEPENDENCIA CORRECTA
);
```

✅ **CORRECTO:** Crea nueva referencia del array
✅ **CORRECTO:** isCategoryActive depende de activeCategories

---

### 2. WeddingServicesOverview (src/components/wedding/WeddingServicesOverview.jsx)

```javascript
// Líneas 22
const { isCategoryActive, activeCategories, loading: loadingCategories } = useWeddingCategories();

// Líneas 28-50
const activeServices = useMemo(() => {
  console.log('🔄 [WeddingServicesOverview] Recalculando servicios activos...');
  console.log('   activeCategories:', activeCategories);

  const allServices = SUPPLIER_CATEGORIES.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    isActive: isCategoryActive(cat.id),
  }));

  const active = allServices.filter((s) => s.isActive);

  console.log('   ✅ Servicios activos:', active.length);
  return active;
}, [activeCategories, isCategoryActive]); // ← DEPENDENCIAS CORRECTAS
```

✅ **CORRECTO:** useMemo depende de activeCategories y isCategoryActive

---

## 🐛 POSIBLES CAUSAS

### Causa 1: useWeddingCategories no recarga después de updateDoc ❌

**Problema:** Después de actualizar Firestore, el estado local se actualiza, pero ¿se vuelve a leer de Firestore?

**Verificación necesaria:**

- ¿Hay un listener onSnapshot que reaccione al cambio?
- ¿O solo se actualiza el estado local?

---

### Causa 2: El contexto no se propaga correctamente ❌

**Problema:** El hook useWeddingCategories NO usa contexto, solo hooks locales.

**ESTO ES EL PROBLEMA:**
Cada componente que llama `useWeddingCategories()` tiene su PROPIA instancia del estado.

```javascript
// En ManageServicesModal:
const { toggleCategory } = useWeddingCategories(); // ← Estado A

// En WeddingServicesOverview:
const { isCategoryActive, activeCategories } = useWeddingCategories(); // ← Estado B (diferente!)
```

**❌ Cuando ManageServicesModal actualiza Estado A, WeddingServicesOverview NO se entera porque tiene Estado B**

---

## 🎯 SOLUCIÓN

Necesitamos convertir `useWeddingCategories` en un contexto compartido.

### Opción 1: Crear WeddingCategoriesContext (RECOMENDADO)

```javascript
// src/context/WeddingCategoriesContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const WeddingCategoriesContext = createContext();

export function WeddingCategoriesProvider({ children }) {
  const [activeCategories, setActiveCategories] = useState([]);
  // ... todo el código de useWeddingCategories aquí

  return (
    <WeddingCategoriesContext.Provider value={{ activeCategories, ... }}>
      {children}
    </WeddingCategoriesContext.Provider>
  );
}

export function useWeddingCategories() {
  const context = useContext(WeddingCategoriesContext);
  if (!context) {
    throw new Error('useWeddingCategories debe usarse dentro de WeddingCategoriesProvider');
  }
  return context;
}
```

**Beneficio:** Estado compartido entre TODOS los componentes

---

### Opción 2: Recargar después de cerrar modal (RÁPIDO PERO SUCIO)

```javascript
// ManageServicesModal.jsx
const handleClose = () => {
  // Forzar recarga del componente padre
  window.dispatchEvent(new CustomEvent('weddingCategoriesUpdated'));
  onClose();
};
```

```javascript
// WeddingServicesOverview.jsx
useEffect(() => {
  const handleUpdate = () => {
    // Forzar recarga
    setForceUpdate((prev) => prev + 1);
  };

  window.addEventListener('weddingCategoriesUpdated', handleUpdate);
  return () => window.removeEventListener('weddingCategoriesUpdated', handleUpdate);
}, []);
```

---

### Opción 3: Usar onSnapshot en lugar de getDoc (MEDIO)

```javascript
// useWeddingCategories.js - loadActiveCategories
useEffect(() => {
  if (!user?.uid || !activeWedding) return;

  const weddingRef = doc(db, 'users', user.uid, 'weddings', activeWedding);

  // ✅ USAR ONSNAPSHOT en lugar de getDoc
  const unsubscribe = onSnapshot(weddingRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      setActiveCategories(data.activeCategories || DEFAULT_CATEGORIES);
    }
  });

  return () => unsubscribe();
}, [user?.uid, activeWedding]);
```

**Beneficio:** Actualización automática cuando cambia Firestore

---

## 🚀 RECOMENDACIÓN

**Implementar Opción 3 (onSnapshot) primero** porque:

- ✅ Solución limpia
- ✅ Ya usas Firestore
- ✅ Actualización en tiempo real
- ✅ No requiere contexto adicional
- ✅ 10 minutos de implementación

**Si no funciona, entonces Opción 1 (Contexto)** porque:

- ✅ Solución robusta
- ✅ Estado compartido garantizado
- ✅ 30 minutos de implementación

---

## 📝 PLAN DE ACCIÓN

1. ✅ Agregar console.logs para confirmar el diagnóstico
2. ✅ Implementar onSnapshot en useWeddingCategories
3. ✅ Verificar que activeCategories cambia en ambos componentes
4. ✅ Si funciona → Commit
5. ❌ Si NO funciona → Implementar Contexto
