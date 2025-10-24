# FLUJO DE AUTENTICACIÓN Y ACCESO A FIREBASE - MALOVEAPP

## 📋 RESUMEN EJECUTIVO

Este documento especifica el flujo completo de autenticación y acceso a Firebase para la aplicación MaLoveApp, incluyendo la estructura de datos, permisos de Firestore, y la gestión de contextos de React.

## 🔐 1. FLUJO DE AUTENTICACIÓN

### 1.1 Inicialización de Firebase Auth

```javascript
// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'maloveapp',
  authDomain: 'mywed360.firebaseapp.com',
  // ... resto de configuración
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 1.2 Contexto de Autenticación (useAuth)

**Archivo:** `src/hooks/useAuth.jsx`

**Flujo:**
1. **Inicialización**: `onAuthStateChanged` escucha cambios en Firebase Auth
2. **Estado del usuario**: Mantiene `currentUser` y `userProfile` en el contexto
3. **Persistencia**: Guarda perfil en localStorage para acceso rápido
4. **Servicios**: Registra contexto en emailService y notificationService

```javascript
// Flujo de autenticación
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      // Usuario autenticado
      setCurrentUser(firebaseUser);
      loadUserProfile(firebaseUser.uid);
    } else {
      // Usuario no autenticado
      setCurrentUser(null);
      setUserProfile(null);
    }
    setLoading(false);
  });
  return unsubscribe;
}, []);
```

## 🏗️ 2. ESTRUCTURA DE DATOS FIRESTORE

### 2.1 Colecciones Principales

```
firestore/
├── users/{userId}                    # Perfil del usuario
│   └── weddings/{weddingId}         # Subcolección: bodas del usuario
├── weddings/{weddingId}             # Datos principales de la boda
│   ├── guests/{guestId}             # Subcolección: invitados
│   ├── suppliers/{supplierId}       # Subcolección: proveedores
│   ├── tasks/{taskId}               # Subcolección: tareas
│   └── finance/{financeId}          # Subcolección: finanzas
├── onboarding/{userId}              # Datos de onboarding
└── config/{configId}                # Configuración global
```

### 2.2 Documento de Usuario

```javascript
// users/{userId}
{
  uid:  – user123 – ,
  email:  – usuario@example.com – ,
  displayName:  – Nombre Usuario – ,
  photoURL:  – https://... – ,
  createdAt: timestamp,
  updatedAt: timestamp,
  preferences: {
    language:  – es – ,
    notifications: true
  }
}
```

### 2.3 Subcolección de Bodas del Usuario

```javascript
// users/{userId}/weddings/{weddingId}
{
  id:  – wedding123 – ,
  name:  – Mi Boda – ,
  roles: [ – owner – ], // o [ – planner – ], [ – assistant – ]
  updatedAt: timestamp
}
```

### 2.4 Documento Principal de Boda

```javascript
// weddings/{weddingId}
{
  id:  – wedding123 – ,
  name:  – Boda de Juan y María – ,
  date: timestamp,
  ownerIds: [ – user123 – ],
  plannerIds: [ – planner456 – ],
  assistantIds: [ – assistant789 – ],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 🔒 3. REGLAS DE SEGURIDAD FIRESTORE

### 3.1 Reglas para Usuarios

```javascript
// Acceso a perfil de usuario
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
  
  // Subcolección de bodas del usuario
  match /weddings/{weddingId} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
}
```

### 3.2 Reglas para Bodas

```javascript
// Acceso a boda principal
match /weddings/{weddingId} {
  // Lectura: propietarios, planners y asistentes
  allow read: if request.auth != null && (
    (resource.data.ownerIds != null && request.auth.uid in resource.data.ownerIds) ||
    (resource.data.plannerIds != null && request.auth.uid in resource.data.plannerIds) ||
    (resource.data.assistantIds != null && request.auth.uid in resource.data.assistantIds)
  );
  
  // Escritura: propietarios y planners
  allow update: if isOwnerOrPlanner(weddingId);
  allow create: if request.auth != null && (
    (request.resource.data.ownerIds != null && request.auth.uid in request.resource.data.ownerIds) ||
    (request.resource.data.plannerIds != null && request.auth.uid in request.resource.data.plannerIds)
  );
}

// Subcolecciones de la boda (invitados, proveedores, etc.)
match /weddings/{weddingId}/{document=**} {
  allow read: if isCollaborator(weddingId);
  allow write: if isOwnerOrPlanner(weddingId);
}
```

## 🔄 4. FLUJO DE CARGA DE CONTEXTOS

### 4.1 Orden de Inicialización

```
1. App.jsx
   ├── AuthProvider (useAuth)
   │   └── onAuthStateChanged → setCurrentUser
   ├── UserProvider (UserContext)
   │   └── Carga perfil desde users/{uid}
   └── WeddingProvider (WeddingContext)
       └── Carga bodas desde users/{uid}/weddings
```

### 4.2 WeddingContext - Flujo de Carga

**Archivo:** `src/context/WeddingContext.jsx`

```javascript
// Flujo de carga de bodas
useEffect(() => {
  async function listenWeddings() {
    if (!currentUser) {
      setWeddings([]);
      return;
    }
    
    try {
      // 1. Cargar desde subcolección del usuario
      const userWeddingsCol = collection(db, 'users', currentUser.uid, 'weddings');
      const snapshot = await getDocs(userWeddingsCol);
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // 2. Actualizar estado
      setWeddings(list);
      
      // 3. Seleccionar boda activa si no hay una
      if (!activeWedding && list.length) {
        setActiveWeddingState(list[0].id);
      }
    } catch (error) {
      console.error('[WeddingContext] Error cargando bodas:', error);
      setWeddings([]);
    }
  }
  
  listenWeddings();
}, [currentUser]);
```

## 📊 5. GESTIÓN DE INVITADOS

### 5.1 Hook useGuests

**Archivo:** `src/hooks/useGuests.js`

```javascript
// Flujo de carga de invitados
const useGuests = () => {
  const { activeWedding } = useWedding();
  
  // Usar useWeddingCollection para manejar la subcolección
  const {
    data: guests,
    addItem,
    updateItem,
    deleteItem,
    loading
  } = useWeddingCollection('guests', activeWedding);
  
  return {
    guests,
    addGuest: addItem,
    updateGuest: updateItem,
    deleteGuest: deleteItem,
    isLoading: loading
  };
};
```

### 5.2 Hook useWeddingCollection

**Archivo:** `src/hooks/useWeddingCollection.js`

```javascript
// Gestión de subcolecciones de boda
const useWeddingCollection = (collectionName, weddingId) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!weddingId || !auth.currentUser) {
      setData([]);
      setLoading(false);
      return;
    }
    
    const loadCollection = async () => {
      try {
        const colRef = collection(db, 'weddings', weddingId, collectionName);
        const snapshot = await getDocs(colRef);
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setData(items);
      } catch (error) {
        console.error(`Error cargando ${collectionName}:`, error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadCollection();
  }, [weddingId, collectionName]);
  
  return { data, loading };
};
```

## 🚨 6. TROUBLESHOOTING - ERRORES COMUNES

### 6.1  – Missing or insufficient permissions – 

**Causa:** Usuario no tiene permisos para acceder a la colección/documento
**Solución:**
1. Verificar que el usuario esté autenticado: `auth.currentUser !== null`
2. Verificar que el usuario esté en los arrays de permisos de la boda
3. Usar subcolección `users/{uid}/weddings` en lugar de consultas por roles

### 6.2  – FirebaseError: Permission denied – 

**Causa:** Reglas de Firestore bloquean el acceso
**Solución:**
1. Verificar reglas en `firestore.rules`
2. Asegurar que el usuario esté incluido en `ownerIds`, `plannerIds` o `assistantIds`
3. Para desarrollo, usar reglas más permisivas temporalmente

### 6.3  – No authenticated user – 

**Causa:** Usuario no está autenticado en Firebase Auth
**Solución:**
1. Verificar que `onAuthStateChanged` se ejecute correctamente
2. Usar login manual: `signInWithEmailAndPassword(auth, email, password)`
3. Verificar configuración de Firebase en `firebaseConfig.js`

### 6.4  – Cannot read properties of undefined – 

**Causa:** Contextos no están inicializados o hooks se ejecutan antes de tiempo
**Solución:**
1. Usar valores por defecto en hooks: `const { currentUser = null } = useAuth()`
2. Verificar orden de providers en `App.jsx`
3. Añadir guards: `if (!currentUser) return;`

## 🔧 7. CONFIGURACIÓN DE DESARROLLO

### 7.1 Variables de Entorno

```bash
# .env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id
```

### 7.2 Login Manual para Desarrollo

```javascript
// Botón de login manual en componentes de desarrollo
const handleManualLogin = async () => {
  try {
    await signInWithEmailAndPassword(auth, 'test@example.com', 'password123');
    console.log('Login manual exitoso');
  } catch (error) {
    console.error('Login manual falló:', error);
  }
};
```

## 📝 8. CHECKLIST DE VERIFICACIÓN

### 8.1 Autenticación
- [ ] Firebase Auth inicializado correctamente
- [ ] `onAuthStateChanged` configurado en useAuth
- [ ] Usuario autenticado: `auth.currentUser !== null`
- [ ] Perfil de usuario cargado en contexto

### 8.2 Contextos
- [ ] AuthProvider envuelve la aplicación
- [ ] WeddingProvider recibe currentUser correctamente
- [ ] activeWedding se establece automáticamente
- [ ] Bodas se cargan desde `users/{uid}/weddings`

### 8.3 Permisos
- [ ] Reglas de Firestore permiten acceso a subcolección de usuario
- [ ] Usuario incluido en arrays de permisos de boda
- [ ] Subcolecciones accesibles con permisos correctos

### 8.4 Datos
- [ ] Estructura de datos coherente en Firestore
- [ ] Subcolección `users/{uid}/weddings` existe y tiene datos
- [ ] Boda principal en `weddings/{weddingId}` accesible
- [ ] Invitados en `weddings/{weddingId}/guests` cargables

## 🎯 9. FLUJO COMPLETO PASO A PASO

### Paso 1: Inicialización de la App
```
App.jsx → AuthProvider → onAuthStateChanged → setCurrentUser
```

### Paso 2: Carga de Perfil
```
UserProvider → users/{uid} → setUserProfile
```

### Paso 3: Carga de Bodas
```
WeddingProvider → users/{uid}/weddings → setWeddings → setActiveWedding
```

### Paso 4: Carga de Invitados
```
Invitados.jsx → useGuests → useWeddingCollection → weddings/{weddingId}/guests
```

### Paso 5: Operaciones CRUD
```
addGuest → addDoc(collection(db, 'weddings', weddingId, 'guests'), data)
updateGuest → updateDoc(doc(db, 'weddings', weddingId, 'guests', guestId), data)
deleteGuest → deleteDoc(doc(db, 'weddings', weddingId, 'guests', guestId))
```

---

**Última actualización:** 2025-09-03  
**Versión:** 1.0  
**Autor:** Sistema MaLoveApp

