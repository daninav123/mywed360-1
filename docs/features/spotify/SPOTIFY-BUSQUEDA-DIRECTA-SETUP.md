# 🎵 Búsqueda Directa en Spotify - Configuración

**Fecha:** 1 de Diciembre de 2025  
**Estado:** ✅ Implementado - Requiere Configuración de API

---

## ✨ **Lo Que Se Ha Implementado**

### **Backend**

✅ **SpotifyService** - Autenticación y búsqueda en Spotify API
✅ **Rutas de API** - `/api/spotify/search` y `/api/spotify/track/:id`
✅ **Client Credentials Flow** - Autenticación automática sin login de usuario

### **Frontend**

✅ **Búsqueda directa** - Modal busca en Spotify automáticamente
✅ **Sin copiar/pegar** - Simplemente escribe y busca
✅ **Resultados completos** - Artwork, artista, álbum, etc.

---

## 🔧 **Configuración Requerida**

### **Paso 1: Crear App en Spotify**

1. Ve a: https://developer.spotify.com/dashboard
2. **Login** con tu cuenta de Spotify
3. Click en **"Create app"**
4. Completa el formulario:
   ```
   App name: MyWed360 Music Search
   App description: Búsqueda de canciones para bodas
   Website: http://localhost:5173
   Redirect URI: http://localhost:4004/api/spotify/callback
   ```
5. Acepta los términos
6. Click **"Save"**

### **Paso 2: Obtener Credenciales**

1. En el dashboard de tu app, verás:
   - **Client ID** (público)
   - **Client Secret** (privado) - Click "Show client secret"
2. **Copia ambos valores**

### **Paso 3: Configurar Backend**

Edita `/backend/.env`:

```env
# Spotify API (para búsqueda de canciones)
SPOTIFY_CLIENT_ID=tu_client_id_aqui
SPOTIFY_CLIENT_SECRET=tu_client_secret_aqui
SPOTIFY_REDIRECT_URI=http://localhost:4004/api/spotify/callback
```

**Ejemplo:**

```env
SPOTIFY_CLIENT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
SPOTIFY_CLIENT_SECRET=q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
SPOTIFY_REDIRECT_URI=http://localhost:4004/api/spotify/callback
```

### **Paso 4: Reiniciar Backend**

```bash
cd /Users/dani/MaLoveApp\ 2/MaLove.App_windows
npm run dev:all
```

O solo el backend:

```bash
cd backend
npm run dev
```

---

## 🎯 **Cómo Funciona**

### **Flujo de Búsqueda:**

```
Usuario escribe → Frontend → Backend → Spotify API → Resultados
```

1. **Usuario escribe** "Perfect Ed Sheeran"
2. **Frontend** hace request a `/api/spotify/search?q=Perfect%20Ed%20Sheeran`
3. **Backend:**
   - Obtiene token de Spotify (Client Credentials)
   - Busca en Spotify API
   - Transforma resultados a nuestro formato
   - Devuelve JSON
4. **Frontend** muestra resultados con:
   - Artwork
   - Título
   - Artista
   - Álbum
   - Preview de 30s
   - Enlace de Spotify completo

---

## 📋 **Archivos Creados/Modificados**

### **Backend:**

1. `backend/services/spotifyService.js` - Servicio de Spotify API
2. `backend/routes/spotify.js` - Rutas de búsqueda agregadas
3. `backend/.env` - Credenciales de Spotify

### **Frontend:**

1. `apps/main-app/src/components/momentos/CleanSongPicker.jsx` - Búsqueda en Spotify

---

## 🔍 **Endpoints Disponibles**

### **GET /api/spotify/search**

Buscar canciones en Spotify

**Parámetros:**

- `q` (string) - Término de búsqueda
- `limit` (number, opcional) - Máximo 50, default 20

**Ejemplo:**

```
GET http://localhost:4004/api/spotify/search?q=Perfect%20Ed%20Sheeran&limit=10
```

**Respuesta:**

```json
{
  "ok": true,
  "tracks": [
    {
      "id": "0tgVpDi06FyKpA1z0VMD4v",
      "title": "Perfect",
      "artist": "Ed Sheeran",
      "album": "÷ (Deluxe)",
      "previewUrl": "https://p.scdn.co/mp3-preview/...",
      "trackUrl": "https://open.spotify.com/track/0tgVpDi06FyKpA1z0VMD4v",
      "artwork": "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
      "duration": 263133,
      "source": "spotify"
    }
  ]
}
```

### **GET /api/spotify/track/:id**

Obtener información de una canción específica

**Ejemplo:**

```
GET http://localhost:4004/api/spotify/track/0tgVpDi06FyKpA1z0VMD4v
```

---

## ✅ **Verificación**

### **Test Manual:**

1. Asegúrate que el backend está corriendo
2. Abre: http://localhost:5173/musica-boda
3. Click "Elegir canción"
4. Escribe "Perfect Ed Sheeran"
5. Click "Buscar"

**Resultado esperado:**

- Lista de canciones de Spotify
- Con artwork, artista, álbum
- Preview de 30s
- Botón "Seleccionar"

### **Test de API Directa:**

```bash
curl "http://localhost:4004/api/spotify/search?q=Perfect%20Ed%20Sheeran&limit=5"
```

**Debe devolver** JSON con array de tracks.

---

## 🔒 **Seguridad**

### **Client Credentials Flow**

- ✅ No requiere login de usuario
- ✅ Solo búsqueda (lectura pública)
- ✅ Client Secret en backend (nunca en frontend)
- ✅ Token se renueva automáticamente

### **Scope de Permisos**

El Client Credentials Flow solo permite:

- ✅ Buscar canciones públicas
- ✅ Obtener info de canciones públicas
- ❌ No puede acceder a datos del usuario
- ❌ No puede modificar playlists

---

## 📊 **Límites de Spotify API**

- **Rate Limit:** ~180 requests por minuto
- **Búsqueda:** Máximo 50 resultados por request
- **Token:** Expira en 1 hora (renovación automática)

---

## 🐛 **Troubleshooting**

### **Error: "No se pudo autenticar con Spotify"**

- Verifica que `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET` estén configurados
- Verifica que las credenciales sean correctas

### **Error: "invalid_client"**

- El Client Secret es incorrecto
- Copia de nuevo desde Spotify Dashboard

### **Error: CORS**

- El backend debe estar en `http://localhost:4004`
- El frontend debe estar en `http://localhost:5173`

### **Sin resultados al buscar**

- Verifica que el backend esté corriendo
- Abre DevTools (F12) y revisa errores en Network
- Verifica que la URL sea correcta

---

## 🎉 **Ventajas de Esta Implementación**

| Característica                  | Estado |
| ------------------------------- | ------ |
| Búsqueda directa                | ✅     |
| Sin copiar/pegar enlaces        | ✅     |
| Player completo de Spotify      | ✅     |
| Control de tiempos inicio/final | ✅     |
| Artwork HD                      | ✅     |
| Info completa (artista/álbum)   | ✅     |
| Preview de 30s                  | ✅     |
| Sin login de usuario            | ✅     |

---

## 📝 **Próximos Pasos Opcionales**

### **Mejoras Futuras:**

1. **Caché de búsquedas** - Guardar resultados populares
2. **Búsqueda por género** - Filtros adicionales
3. **Recomendaciones** - Canciones similares
4. **Búsqueda por BPM** - Para tempo específico
5. **Playlist completa** - Exportar todas las canciones

---

## ✅ **Checklist de Setup**

- [ ] Crear app en Spotify Dashboard
- [ ] Copiar Client ID
- [ ] Copiar Client Secret
- [ ] Agregar credenciales a `backend/.env`
- [ ] Reiniciar backend
- [ ] Probar búsqueda desde la app
- [ ] Verificar que aparecen resultados de Spotify
- [ ] Seleccionar una canción
- [ ] Verificar que aparece el player de Spotify completo

---

**Una vez configurado, la búsqueda será 100% automática y directa en Spotify** 🎵
