# 🎵 Controles de Tiempo para Reproducción de Canciones

**Fecha:** 1 de Diciembre de 2025  
**Estado:** ✅ Implementado

---

## 🎯 Funcionalidades Implementadas

### **1. Reproducción Completa de Spotify**

✅ **Player de Spotify Embebido**

- Reproduce la canción completa (no solo 30 segundos)
- Control total de reproducción
- Volumen ajustable
- Barra de progreso
- Artwork del álbum

**Cómo funciona:**

1. Busca la canción en iTunes
2. Click en "Buscar en Spotify"
3. Se abre Spotify Web
4. Copia el enlace de la canción (ej: `https://open.spotify.com/track/3QRGYDFFUTc5fGcJBOkc7O`)
5. Vuelve al modal y pega el enlace al seleccionar la canción
6. ¡El player de Spotify aparece automáticamente!

---

### **2. Controles de Inicio y Final de Canción**

✅ **Definir Punto de Inicio**

- Campo: `Inicio (minutos:segundos)`
- Formato: `M:SS` (ej: `0:30` para 30 segundos)
- Por defecto: `0:00` (inicio de la canción)
- Ejemplo de uso: Empezar en el coro

✅ **Definir Punto Final**

- Campo: `Final (minutos:segundos)`
- Formato: `M:SS` (ej: `3:45` para 3:45 minutos)
- Por defecto: Vacío (reproduce hasta el final)
- Ejemplo de uso: Terminar antes del fade out

---

## 🎨 Interfaz de Usuario

### **Vista de Tarjeta con Canción Seleccionada:**

```
┌────────────────────────────────────────────┐
│  Entrada de la Novia                       │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ 🎨 [Portada]                         │ │
│  │ Canon in D - Pachelbel               │ │
│  │ [Cambiar canción]                    │ │
│  │                                      │ │
│  │ 🎵 SPOTIFY PLAYER                    │ │
│  │ ▶️ ━━━━●━━━━━━━ 🔊                  │ │
│  │                                      │ │
│  │ ⚙️ [Mostrar tiempos de reproducción] │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  🕐 Hora: [18:30]                          │
└────────────────────────────────────────────┘
```

### **Con Controles de Tiempo Expandidos:**

```
┌────────────────────────────────────────────┐
│  🎵 SPOTIFY PLAYER                         │
│  ▶️ ━━━━●━━━━━━━ 🔊                       │
│                                            │
│  ⚙️ Ocultar tiempos de reproducción       │
│  ┌────────────────────────────────────┐   │
│  │ Inicio (minutos:segundos)          │   │
│  │ [0:00]                             │   │
│  │ Ej: 0:30 para empezar a los 30s    │   │
│  │                                    │   │
│  │ Final (minutos:segundos)           │   │
│  │ [3:45]                             │   │
│  │ Ej: 3:45 para terminar a los 3:45  │   │
│  │                                    │   │
│  │ 💡 Tip: Usa estos tiempos para    │   │
│  │ reproducir solo la parte que       │   │
│  │ necesitas de la canción            │   │
│  └────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

---

## 🔧 Implementación Técnica

### **Campos en el Modelo de Datos:**

```javascript
moment: {
  id: 1,
  title: "Entrada Novia",
  songCandidates: [...],
  selectedSongId: "song-123",
  // NUEVOS CAMPOS
  songStartTime: "0:00",    // Tiempo de inicio
  songEndTime: "3:45",      // Tiempo de final (opcional)
}
```

### **Componentes Actualizados:**

1. **SimpleMomentCard.jsx**
   - Agregado estado `showTimingSettings`
   - Nuevos campos de input para inicio/final
   - Botón toggle para mostrar/ocultar controles
   - PropTypes actualizados

2. **MomentosEspecialesSimple.jsx**
   - Nuevo handler `handleSongTimingChange`
   - Integrado en el componente SimpleMomentCard
   - Guarda automáticamente en el momento

3. **useSpecialMoments.js**
   - Compatible con los nuevos campos
   - Persistencia en localStorage y Firestore

---

## 📋 Casos de Uso

### **Caso 1: Entrada de la Novia**

```
Canción: Canon in D - Pachelbel
Inicio: 0:00 (desde el principio)
Final: 4:30 (antes del final completo)
Duración efectiva: 4:30 minutos
```

### **Caso 2: Primer Baile**

```
Canción: Perfect - Ed Sheeran
Inicio: 0:20 (saltar intro instrumental)
Final: 3:45 (antes del último coro)
Duración efectiva: 3:25 minutos
```

### **Caso 3: Salida de la Ceremonia**

```
Canción: Signed, Sealed, Delivered - Stevie Wonder
Inicio: 0:00 (desde el principio)
Final: (vacío - canción completa)
Duración efectiva: 2:40 minutos (completa)
```

### **Caso 4: Corte de Pastel**

```
Canción: Sugar - Maroon 5
Inicio: 1:10 (empezar en el coro)
Final: 1:50 (solo 40 segundos de coro)
Duración efectiva: 0:40 segundos
```

---

## ✅ Validación de Formato

### **Formatos Aceptados:**

- ✅ `0:00` - Inicio
- ✅ `0:30` - 30 segundos
- ✅ `1:15` - 1 minuto 15 segundos
- ✅ `3:45` - 3 minutos 45 segundos
- ✅ (vacío) - Hasta el final

### **Formatos NO Válidos:**

- ❌ `30` - Falta el formato de minutos
- ❌ `1:5` - Falta el 0 en segundos (debería ser `1:05`)
- ❌ `90` - Usa minutos (debería ser `1:30`)

**Nota:** La validación se puede agregar en el futuro para evitar errores de formato.

---

## 🎯 Flujo de Usuario

### **Para configurar tiempos de reproducción:**

1. **Selecciona una canción** con Spotify
2. **Reproduce la canción** en el player embebido
3. **Identifica los tiempos** que quieres usar
4. **Click en "Mostrar tiempos de reproducción"**
5. **Ingresa inicio** (ej: `0:30`)
6. **Ingresa final** (ej: `3:45`) o deja vacío para canción completa
7. **Los tiempos se guardan automáticamente**

---

## 🚀 Próximas Mejoras Sugeridas

### **Validación de Formato**

```javascript
const validateTime = (time) => {
  const regex = /^([0-9]+):([0-5][0-9])$/;
  return regex.test(time);
};
```

### **Preview Visual de Tiempos**

```
├─────────┼────────┼─────────┤
0:00    1:30     3:45     5:20
        ↑         ↑
      Inicio    Final
```

### **Conversión Automática**

```
Usuario escribe: "90"
Sistema convierte: "1:30"

Usuario escribe: "2:5"
Sistema convierte: "2:05"
```

### **Sugerencias Inteligentes**

- "Empezar en el coro" → Detectar automáticamente
- "Usar intro musical" → Primeros 30s
- "Solo el estribillo" → Detectar sección más popular

---

## 💾 Persistencia de Datos

Los tiempos se guardan automáticamente en:

### **LocalStorage:**

```javascript
{
  "MaLove.AppSpecialMoments": {
    "blocks": [...],
    "moments": {
      "ceremonia": [
        {
          "id": 1,
          "title": "Entrada Novia",
          "songStartTime": "0:00",
          "songEndTime": "3:45"
        }
      ]
    }
  }
}
```

### **Firestore:**

```
weddings/{weddingId}/specialMoments/main
{
  moments: {
    ceremonia: [
      {
        songStartTime: "0:00",
        songEndTime: "3:45"
      }
    ]
  }
}
```

---

## 📱 Responsive

Los controles de tiempo funcionan perfectamente en:

- ✅ Desktop (inputs lado a lado)
- ✅ Tablet (inputs apilados)
- ✅ Móvil (inputs full width)

---

## 🎨 Diseño UX

### **Progressive Disclosure:**

- Los controles están ocultos por defecto
- Solo se muestran al hacer click
- Reduce saturación visual
- Usuarios avanzados pueden acceder fácilmente

### **Feedback Visual:**

- Input con borde azul en focus
- Placeholder con ejemplo claro
- Helper text explicativo
- Tip destacado en azul

### **Accesibilidad:**

- Labels claros
- Placeholders descriptivos
- Ejemplos de formato
- Helper text adicional

---

## ✨ Resumen

Se ha implementado un **sistema completo de control de tiempos** para la reproducción de canciones:

- ✅ Reproducción completa vía Spotify
- ✅ Control de punto de inicio
- ✅ Control de punto final
- ✅ Interfaz limpia y minimalista
- ✅ Progressive disclosure (oculto por defecto)
- ✅ Guardado automático
- ✅ Responsive design

**Beneficios:**

- 🎵 Reproducir solo las partes importantes
- ⏱️ Control preciso de duración
- 🎯 Evitar intros/outros innecesarios
- 💍 Personalización total del soundtrack de la boda

---

**Implementado por:** Cascade AI  
**Fecha:** 1 Diciembre 2025  
**Estado:** ✅ Listo para usar  
**Ruta:** `/musica-boda` o `/protocolo/musica-limpia`
