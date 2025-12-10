# 🎵 Guía: Reproducción Completa de Canciones con Control de Tiempos

**Fecha:** 1 de Diciembre de 2025  
**Estado:** ✅ Completamente Implementado

---

## ✨ **Funcionalidades Disponibles**

### **1. Reproducción Completa (Spotify)**

- ✅ Player de Spotify embebido
- ✅ Canción completa (no solo 30 segundos)
- ✅ Controles de play/pause/volumen
- ✅ Barra de progreso

### **2. Control de Tiempos de Reproducción**

- ✅ Definir punto de inicio (ej: `0:30`)
- ✅ Definir punto final (ej: `3:45`)
- ✅ Dejar vacío para canción completa
- ✅ Guardado automático

---

## 🎯 **Cómo Usar**

### **Paso 1: Agregar una Canción**

#### **Opción A: Pegar Enlace de Spotify (Recomendado)**

1. Abre Spotify (web o app)
2. Busca la canción que quieres
3. Click en "Compartir" → "Copiar enlace de canción"
4. En MyWed360:
   - Click en "Elegir canción"
   - **Pega el enlace** en el campo verde
   - ¡Listo! La canción se agrega automáticamente

**Resultado:**

- ✅ Player de Spotify completo
- ✅ Controles de tiempo disponibles

#### **Opción B: Buscar en iTunes**

1. Click en "Elegir canción"
2. Busca la canción en el buscador
3. Click "Seleccionar"

**Resultado:**

- ⚠️ Solo preview de 30 segundos
- ❌ Sin controles de tiempo

---

### **Paso 2: Configurar Tiempos (Solo con Spotify)**

Una vez agregada una canción de Spotify:

1. Verás el **Player de Spotify embebido**
2. Debajo del player, click en **"Mostrar tiempos de reproducción"**
3. Configura:

**Inicio:**

```
Formato: M:SS
Ejemplos:
- 0:00  → Desde el principio
- 0:30  → Empezar a los 30 segundos
- 1:15  → Empezar al minuto 1:15
```

**Final:**

```
Formato: M:SS o vacío
Ejemplos:
- (vacío) → Canción completa
- 3:45     → Terminar a los 3:45
- 2:30     → Terminar a los 2:30
```

4. Los cambios se **guardan automáticamente** ✓

---

## 📖 **Ejemplos de Uso**

### **Ejemplo 1: Entrada de la Novia (Canon in D)**

```
URL Spotify: https://open.spotify.com/track/0by7Y7l8HR...
Inicio: 0:00
Final: 4:30
Duración efectiva: 4:30 minutos
```

### **Ejemplo 2: Primer Baile (Perfect - Ed Sheeran)**

```
URL Spotify: https://open.spotify.com/track/0tgVpDi06...
Inicio: 0:20 (saltar intro)
Final: 3:45 (antes del último coro)
Duración efectiva: 3:25 minutos
```

### **Ejemplo 3: Corte de Pastel (Sugar - Maroon 5)**

```
URL Spotify: https://open.spotify.com/track/3JvKfv...
Inicio: 1:10 (empezar en el coro)
Final: 1:50 (solo 40 segundos)
Duración efectiva: 0:40 segundos
```

### **Ejemplo 4: Fiesta (Uptown Funk)**

```
URL Spotify: https://open.spotify.com/track/32OlwWu...
Inicio: 0:00
Final: (vacío - canción completa)
Duración efectiva: 4:31 minutos (completa)
```

---

## 🆚 **Comparación: Spotify vs iTunes**

| Característica       | Spotify     | iTunes             |
| -------------------- | ----------- | ------------------ |
| Duración             | ✅ Completa | ⚠️ 30 segundos     |
| Player embebido      | ✅ Sí       | ❌ Solo audio HTML |
| Control de inicio    | ✅ Sí       | ❌ No              |
| Control de final     | ✅ Sí       | ❌ No              |
| Portada visible      | ✅ Sí       | ✅ Sí              |
| Controles de volumen | ✅ Sí       | ⚠️ Básicos         |

**Recomendación:** Siempre usa Spotify para mejor experiencia.

---

## 🎨 **Interfaz Visual**

### **Sin canción:**

```
┌────────────────────────────────┐
│  Entrada de la Novia           │
│                                │
│  [🎵 Elegir canción]           │
│  Busca en Spotify o iTunes     │
│                                │
│  🕐 Hora: [18:30]              │
└────────────────────────────────┘
```

### **Con Spotify:**

```
┌────────────────────────────────┐
│  Entrada de la Novia           │
│                                │
│  ┌────────────────────────┐   │
│  │ [Portada]              │   │
│  │ Canon in D - Pachelbel │   │
│  │ [Cambiar canción]      │   │
│  │                        │   │
│  │ 🎵 SPOTIFY PLAYER      │   │
│  │ ▶️ ━━━●━━━━ 🔊        │   │
│  │                        │   │
│  │ ⚙️ Mostrar tiempos     │   │
│  └────────────────────────┘   │
│                                │
│  🕐 Hora: [18:30]              │
└────────────────────────────────┘
```

### **Con Spotify + Tiempos expandidos:**

```
┌────────────────────────────────┐
│  🎵 SPOTIFY PLAYER             │
│  ▶️ ━━━●━━━━ 🔊               │
│                                │
│  ⚙️ Ocultar tiempos            │
│  ┌──────────────────────────┐ │
│  │ Inicio: [0:00]           │ │
│  │ Ej: 0:30 para 30s        │ │
│  │                          │ │
│  │ Final: [3:45]            │ │
│  │ Ej: 3:45 o vacío         │ │
│  │                          │ │
│  │ 💡 Reproduce solo la     │ │
│  │ parte que necesitas      │ │
│  └──────────────────────────┘ │
└────────────────────────────────┘
```

---

## 🔄 **Flujo Completo**

```
1. Click "Elegir canción"
   ↓
2. OPCIÓN A: Pegar enlace Spotify
   - Pega: https://open.spotify.com/track/...
   - ✅ Canción agregada con player completo
   ↓
   OPCIÓN B: Buscar en iTunes
   - Busca y selecciona
   - ⚠️ Solo preview de 30s
   ↓
3. Si es Spotify:
   - Reproduce la canción completa
   - Click "Mostrar tiempos de reproducción"
   - Configura inicio/final
   - Guarda automáticamente ✓
   ↓
4. Configura hora del momento
   ↓
5. ✅ Momento completo
```

---

## 💾 **Datos Guardados**

Todo se guarda automáticamente en:

### **LocalStorage:**

```javascript
{
  "ceremonia": [
    {
      "id": 1,
      "title": "Entrada Novia",
      "songCandidates": [{
        "id": "3QRG...",
        "title": "Canon in D",
        "trackUrl": "https://open.spotify.com/track/...",
        "source": "spotify"
      }],
      "selectedSongId": "3QRG...",
      "songStartTime": "0:00",
      "songEndTime": "3:45",
      "time": "18:30"
    }
  ]
}
```

### **Firestore:**

```
weddings/{id}/specialMoments/main
- Misma estructura
- Sincronización automática
```

---

## ❓ **Preguntas Frecuentes**

### **¿Puedo cambiar de iTunes a Spotify después?**

Sí, click en "Cambiar canción" y pega el enlace de Spotify.

### **¿Los tiempos se aplican solo al preview o a la reproducción real?**

Son solo como referencia para el DJ/proveedor. El player de Spotify reproduce completo, pero tú defines qué parte usar en el evento.

### **¿Puedo tener múltiples canciones candidatas?**

Sí, pero por ahora solo una se puede configurar con tiempos. Las demás son opciones para comparar.

### **¿Qué pasa si no pongo tiempo final?**

La canción se reproduce completa desde el inicio configurado.

### **¿Cómo consigo el enlace de Spotify?**

1. Abre Spotify (web o app)
2. Busca la canción
3. Click en "..." o "Compartir"
4. "Copiar enlace de canción"

---

## 🎯 **Ruta de Acceso**

La nueva interfaz limpia está en:

```
http://localhost:5173/musica-boda
```

O desde el menú:

```
Protocolo → Música para tu Boda
```

---

## ✅ **Checklist de Uso**

- [ ] Abrir la página `/musica-boda`
- [ ] Seleccionar un bloque (Ceremonia, Cóctel, etc.)
- [ ] Para cada momento:
  - [ ] Click "Elegir canción"
  - [ ] Pegar enlace de Spotify en el campo verde
  - [ ] Verificar que aparece el player de Spotify
  - [ ] Click "Mostrar tiempos de reproducción"
  - [ ] Configurar inicio (ej: `0:00`)
  - [ ] Configurar final (ej: `3:45`) o dejar vacío
  - [ ] Configurar hora del momento
- [ ] Verificar que el bloque muestra 100% completado

---

## 🎉 **Resultado Final**

Tendrás:

- ✅ Todas las canciones con player completo de Spotify
- ✅ Tiempos de inicio/final configurados
- ✅ Timeline visual mostrando progreso
- ✅ Listo para compartir con proveedores/DJ

---

**¡Disfruta de tu playlist perfecta para la boda!** 🎵💍
