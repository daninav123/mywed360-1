# 🎵 Autenticación de Spotify Cross-Platform

**Sistema de autenticación que funciona en Web y Móvil**

---

## 🏗️ **Arquitectura**

```
Usuario (Web/Móvil)
     ↓
Firebase Auth (Token JWT)
     ↓
Backend verifica token
     ↓
Firestore: spotifyTokens/{uid}
     ↓
Spotify API
```

---

## 🔑 **Componentes Clave**

### **1. Firebase Auth**

- Usuario autenticado en la app (Web/Móvil)
- Token JWT compartido entre plataformas
- UID único por usuario

### **2. Firestore Collection: `spotifyTokens`**

```
spotifyTokens/{uid}/
  ├── access_token: "BQC..."
  ├── refresh_token: "AQBD..."
  ├── expires_at: 1733045678000
  ├── profile: {
  │     display_name: "Juan Pérez"
  │     email: "juan@example.com"
  │     id: "spotify_user_id"
  │   }
  └── updatedAt: Timestamp
```

### **3. Backend Routes**

- `GET /api/spotify/login` - Iniciar OAuth
- `GET /api/spotify/callback` - Recibir código
- `GET /api/spotify/status` - Verificar estado
- `POST /api/spotify/logout` - Cerrar sesión

---

## 📱 **Flujo de Autenticación**

### **Primera Vez (Web):**

```
1. Usuario hace login en la app → Firebase Auth
2. Click "Conectar con Spotify"
3. Redirect a Spotify OAuth
4. Usuario acepta permisos
5. Callback → Guardar token en Firestore con uid
6. Redirect de vuelta a la app
7. ✅ Conectado
```

### **Primera Vez (Móvil):**

```
1. Usuario hace login en la app → Firebase Auth (mismo uid)
2. Click "Conectar con Spotify"
3. Abrir Spotify OAuth en WebView/navegador
4. Usuario acepta permisos
5. Callback → Guardar token en Firestore con uid
6. Redirect de vuelta a la app
7. ✅ Conectado
```

### **Verificación Automática (Cualquier Plataforma):**

```
1. App carga
2. Firebase Auth → Obtener uid
3. Backend: Verificar si existe spotifyTokens/{uid}
4. Si existe y no expiró → ✅ Conectado
5. Si no existe → ⚠️ No conectado
```

---

## 🔄 **Sincronización Cross-Platform**

### **Escenario 1: Login en Web, luego Móvil**

```
Web:
  Usuario → Login Firebase (uid: abc123)
  Usuario → Conectar Spotify
  Firestore: spotifyTokens/abc123 = {token, profile}

Móvil:
  Usuario → Login Firebase (mismo uid: abc123)
  App verifica: spotifyTokens/abc123 existe
  ✅ Automáticamente conectado a Spotify
```

### **Escenario 2: Login en Móvil, luego Web**

```
Móvil:
  Usuario → Login Firebase (uid: abc123)
  Usuario → Conectar Spotify
  Firestore: spotifyTokens/abc123 = {token, profile}

Web:
  Usuario → Login Firebase (mismo uid: abc123)
  App verifica: spotifyTokens/abc123 existe
  ✅ Automáticamente conectado a Spotify
```

---

## 🔐 **Seguridad**

### **Tokens**

- ✅ Token de Spotify guardado en Firestore (backend)
- ✅ Token de Firebase Auth enviado en cada request
- ✅ Middleware verifica autenticación
- ❌ Nunca exponer tokens en localStorage del cliente

### **Permisos**

```javascript
const scopes = [
  'user-read-email', // Email del usuario
  'user-read-private', // Info privada
  'streaming', // Reproducir canciones
  'user-read-playback-state', // Estado de reproducción
  'user-modify-playback-state', // Controlar reproducción
];
```

---

## 📡 **Endpoints API**

### **GET /api/spotify/status**

Verificar si el usuario tiene Spotify conectado

**Request:**

```http
GET /api/spotify/status
Authorization: Bearer {firebase_token}
```

**Response (Conectado):**

```json
{
  "ok": true,
  "connected": true,
  "profile": {
    "display_name": "Juan Pérez",
    "email": "juan@example.com",
    "id": "spotify_user_id",
    "images": [...]
  }
}
```

**Response (No Conectado):**

```json
{
  "ok": true,
  "connected": false
}
```

### **GET /api/spotify/login**

Iniciar flujo de OAuth

**Request:**

```http
GET /api/spotify/login?return={url_to_return}
Authorization: Bearer {firebase_token}
```

**Response:**

```http
302 Redirect to Spotify OAuth
```

### **POST /api/spotify/logout**

Cerrar sesión de Spotify

**Request:**

```http
POST /api/spotify/logout
Authorization: Bearer {firebase_token}
```

**Response:**

```json
{
  "ok": true,
  "message": "Sesión cerrada"
}
```

---

## 💾 **Estructura de Datos**

### **Firestore: `spotifyTokens/{uid}`**

```javascript
{
  access_token: string,      // Token de acceso de Spotify
  refresh_token: string,     // Token para renovar
  expires_at: number,        // Timestamp de expiración
  scope: string,             // Permisos concedidos
  token_type: "Bearer",      // Tipo de token
  profile: {                 // Info del usuario de Spotify
    display_name: string,
    email: string,
    id: string,
    images: array
  },
  updatedAt: Timestamp       // Última actualización
}
```

---

## 🔄 **Renovación de Tokens**

Los tokens de Spotify expiran cada hora. El backend debe renovarlos automáticamente:

```javascript
// TODO: Implementar en el backend
async function refreshSpotifyToken(uid) {
  const tokenDoc = await firestore.collection('spotifyTokens').doc(uid).get();
  const { refresh_token } = tokenDoc.data();

  // Llamar a Spotify API con refresh_token
  const newToken = await spotifyAPI.refreshToken(refresh_token);

  // Actualizar en Firestore
  await tokenDoc.ref.update({
    access_token: newToken.access_token,
    expires_at: Date.now() + newToken.expires_in * 1000,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
```

---

## 🎯 **Ventajas de Este Sistema**

✅ **Cross-Platform** - Funciona en Web y Móvil
✅ **Un Solo Login** - Conectar Spotify una vez, disponible en todos lados
✅ **Seguro** - Tokens en backend, no en cliente
✅ **Escalable** - Basado en Firebase Auth (millones de usuarios)
✅ **Persistente** - Sesión se mantiene entre reinicios
✅ **Sin Cookies** - Usa JWT de Firebase (compatible con apps nativas)

---

## 📱 **Implementación en Móvil (React Native)**

```javascript
import auth from '@react-native-firebase/auth';

// Obtener token de Firebase
const user = auth().currentUser;
const token = await user.getIdToken();

// Verificar estado de Spotify
const response = await fetch('https://api.malove.app/api/spotify/status', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();
console.log('Spotify conectado:', data.connected);
```

---

## 🚀 **Estado Actual**

✅ Backend implementado
✅ Frontend Web implementado
✅ Firestore estructura creada
✅ Firebase Auth integrado
⏳ Renovación automática de tokens (pendiente)
⏳ Testing en móvil (pendiente)

---

## 🎵 **Resultado Final**

El usuario hace login en Spotify **una sola vez** y puede:

- 🌐 Escuchar canciones completas en la **web**
- 📱 Escuchar canciones completas en la **app móvil**
- 💻 Mismo usuario, misma experiencia
- 🔄 Sin necesidad de reconectar en cada dispositivo

---

**¡Cross-platform music authentication hecho fácil!** 🎉
