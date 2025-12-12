# 🎵 Spotify Web Playback - Reproducción con Tu Cuenta

**Objetivo:** Permitir que todos los usuarios escuchen canciones completas usando tu cuenta de Spotify Premium.

---

## 📋 **Requisitos**

✅ **Cuenta de Spotify Premium** (obligatorio para Web Playback SDK)
✅ **Credenciales ya configuradas** (las que ya tienes)

---

## 🔧 **Configuración Necesaria**

### **Paso 1: Actualizar Scopes en Spotify Dashboard**

1. Ve a: https://developer.spotify.com/dashboard
2. Click en tu app "prueba 2"
3. Click "Edit Settings"
4. En **Redirect URIs**, agrega:
   ```
   http://localhost:5173/spotify-callback
   http://localhost:4004/api/spotify/callback
   ```
5. Click "Save"

### **Paso 2: Configurar Scopes Adicionales**

En el código del backend, necesitamos solicitar estos permisos:

- `streaming` - Reproducir canciones
- `user-read-email` - Email del usuario
- `user-read-private` - Info privada
- `user-read-playback-state` - Estado de reproducción
- `user-modify-playback-state` - Controlar reproducción

---

## 🎵 **Cómo Funciona**

1. **Tú (admin) haces login** en Spotify desde la app
2. **Se guarda tu token de acceso** en el servidor
3. **Todos los usuarios** usan ese token para reproducir canciones
4. **Canciones completas** para todos sin necesidad de login

---

## ⚠️ **Limitaciones**

- Solo funciona con **Spotify Premium**
- El token expira cada hora (se renueva automáticamente)
- Solo puede reproducir en **1 dispositivo a la vez**
- Si tú estás escuchando en otro dispositivo, se pausa

---

## 🚀 **Alternativa Simple (Recomendada)**

En lugar de implementar Web Playback SDK (complejo), hay una opción más simple:

### **Usar el Player Embebido Grande**

El player embebido que ya implementamos:

- ✅ Reproduce canciones completas si el usuario tiene Spotify
- ✅ Botón para abrir en Spotify App
- ✅ Más simple y sin complicaciones
- ✅ No requiere tu cuenta Premium

**Ventajas:**

- Cada usuario usa su propia cuenta de Spotify (Free o Premium)
- No hay límite de dispositivos
- Más fácil de mantener

**¿Qué prefieres?**

1. **Opción A:** Implementar Web Playback SDK con tu cuenta Premium (complejo pero centralizado)
2. **Opción B:** Mantener el player actual + mejorar UX para que los usuarios sepan que necesitan Spotify (simple)

---

## 💡 **Recomendación**

Para una app de bodas, **recomiendo Opción B** porque:

- Los novios probablemente tienen Spotify
- Es más confiable (no depende de un solo token)
- Evita problemas de concurrencia
- Más fácil de mantener

Puedo mejorar la UX para guiar a los usuarios a:

1. Hacer login en Spotify
2. Usar el botón "Abrir en Spotify App"
3. Agregar un tutorial visual

**¿Qué prefieres implementar?** 🎧
