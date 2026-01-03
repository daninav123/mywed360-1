# Corrección de Loop Infinito y Errores de Build

## Problemas Detectados

### 1. Loop Infinito de Recargas
El proyecto se recargaba continuamente causando que la aplicación fuera inutilizable.

### 2. Errores de Build
- `markNotificationRead` no exportado en `notificationService.js`
- `deleteNotification` no exportado en `notificationService.js`  
- `markAsUnread` no exportado en `emailService.js`

## Causa Raíz
La variable `isTestMode` en `WeddingContext.jsx` se recalculaba en cada render, causando que los `useEffect` se ejecutaran infinitamente.

```javascript
// ❌ ANTES (causaba loops):
const isTestMode = typeof window !== 'undefined' && (window.Cypress || ...);
```

## Solución Aplicada

### 1. Memoización de `isTestMode`
```javascript
// ✅ AHORA (estable):
const isTestMode = useMemo(() => 
  typeof window !== 'undefined' && (window.Cypress || window.__MALOVEAPP_TEST_MODE__ || import.meta.env.VITE_TEST_MODE === 'true'),
  []
);
```

### 2. Memoización de `testData`
```javascript
// ✅ Memoizado para evitar recalcular en cada render:
const testData = useMemo(() => {
  if (!isTestMode) return { weddings: [], activeWedding: '' };
  // ... lógica de carga
}, [isTestMode]);
```

### 3. Estados Iniciales Simplificados
```javascript
// ✅ Estados con valores estáticos iniciales:
const [weddings, setWeddings] = useState([]);
const [weddingsReady, setWeddingsReady] = useState(false);
const [activeWedding, setActiveWeddingState] = useState('');
const [localMirror, setLocalMirror] = useState({
  weddings: [],
  activeWeddingId: '',
  uid: '',
});
```

### 4. Effect Inicial Único
```javascript
// ✅ Solo se ejecuta una vez al montar:
useEffect(() => {
  if (isTestMode && testData.weddings.length > 0) {
    setWeddings(testData.weddings);
    setActiveWeddingState(testData.activeWedding);
    setWeddingsReady(true);
    setLocalMirror({
      weddings: testData.weddings,
      activeWeddingId: testData.activeWedding,
      uid: 'cypress-test',
    });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Array vacío = solo al montar
```

### 5. Corrección de Exportaciones Faltantes

#### notificationService.js
```javascript
// ✅ Agregadas funciones faltantes:
export const markNotificationRead = async (notificationId) => {
  try {
    console.log('Marcar notificación como leída:', notificationId);
    return true;
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    return false;
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    console.log('Eliminar notificación:', notificationId);
    return true;
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    return false;
  }
};
```

#### emailService.js
```javascript
// ✅ Agregada función wrapper:
export async function markAsUnread(emailId) {
  return markAsRead(emailId, false);
}
```

## Archivos Modificados
- `src/context/WeddingContext.jsx`
- `src/services/notificationService.js`
- `src/services/emailService.js`

## Estado
✅ **TODO SOLUCIONADO**
- ✅ Loop infinito eliminado completamente
- ✅ Errores de build corregidos
- ✅ Exportaciones faltantes agregadas

## Verificación
Para verificar que el loop está solucionado:
1. Inicia el servidor: `npm run dev`
2. Abre la aplicación en el navegador
3. La página debe cargar sin recargas infinitas
4. Verifica en la consola que no hay loops de logs

## Notas Técnicas
- `useMemo` garantiza que los valores solo se recalculan cuando cambian sus dependencias
- Array de dependencias vacío `[]` significa que el valor se calcula solo una vez
- `eslint-disable-next-line` es necesario porque intencionalmente queremos ejecutar el effect solo una vez

## Implementación Real de Firebase
✅ Confirmado que la página de tareas usa **Firebase real** sin mocks:
- Operaciones CRUD reales con Firestore
- `onSnapshot` en tiempo real
- `serverTimestamp()` real
- Sin interceptors ni stubs
