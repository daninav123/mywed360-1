# 🎵 Sistema Híbrido de Exportación de Música

## Problema Resuelto

**Desafío**: ¿Cómo exportar canciones a Spotify cuando algunas son versiones especiales (remixes, edits, mashups) que **NO están disponibles en Spotify**?

**Solución**: Sistema híbrido que separa canciones de Spotify de canciones especiales, con dos formatos de exportación complementarios:

1. **Playlist de Spotify** - Solo canciones disponibles
2. **PDF completo para DJ** - TODAS las canciones con instrucciones detalladas

---

## 🎯 Características Principales

### 1. Canciones de Spotify (Normal)

- ✅ Se exportan directamente a playlist de Spotify
- ✅ Reproducción instantánea con Spotify Web Player
- ✅ Preview de 30 segundos sin login
- ✅ Track completo con Spotify Premium

### 2. Canciones Especiales/Custom

- 🔥 **NO se exportan a Spotify** (no están disponibles)
- ✅ Se incluyen en PDF con instrucciones detalladas para el DJ
- ✅ Tipos soportados:
  - **Remix**: Versión remezclada oficial o no oficial
  - **Edit**: Versión editada (intro/outro custom, duración ajustada)
  - **Mashup**: Combinación de 2+ canciones
  - **Live**: Versión en vivo/concierto
  - **Versión especial**: Versiones específicas (acústica, sinfónica, etc.)
  - **Custom**: Cualquier otra versión especial

### 3. Campos para Canciones Especiales

```javascript
{
  isSpecial: true,
  specialType: 'remix', // remix | edit | mashup | live | version_especial | custom
  djInstructions: 'Buscar remix oficial de David Guetta 2021, versión extendida de 5 min',
  referenceUrl: 'https://youtube.com/watch?v=abc123', // YouTube, SoundCloud, etc.
  duration: 300, // Duración en segundos (opcional)
}
```

---

## 📦 Estructura de Archivos

### Servicios

```
src/services/
├── spotifyExportService.js    # Exportación a Spotify (solo disponibles)
└── djDocumentService.js        # Generación de PDF completo con jsPDF
```

### Componentes

```
src/components/momentos/
├── ExportActionsBar.jsx        # Barra con botones de exportación y estadísticas
├── SpecialSongModal.jsx        # Modal para marcar/configurar canción especial
└── SimpleMomentCard.jsx        # Card de momento con badge de canción especial
```

### Hook Actualizado

```
src/hooks/
└── useSpecialMoments.js        # + updateSongSpecialStatus() + getExportStats()
```

---

## 🚀 Flujo de Uso

### Para el Usuario (Novios)

#### 1. Seleccionar Canciones Normales

```
1. Expandir momento ("Entrada Novia")
2. Click en "Buscar canción"
3. Buscar en Spotify y seleccionar
4. Marcar como "Definitiva" cuando estén seguros
```

#### 2. Marcar Canción como Especial

```
1. Expandir momento con canción seleccionada
2. Click en "Marcar especial" (botón naranja)
3. Activar checkbox "Esta es una canción especial"
4. Seleccionar tipo (Remix, Edit, etc.)
5. Escribir instrucciones DETALLADAS para el DJ:
   Ejemplo: "Buscar el remix de Avicii de 2019, versión extendida
   de 6 minutos. Importante: debe tener intro larga de piano"
6. Añadir URL de referencia (YouTube/SoundCloud)
7. Guardar
```

#### 3. Exportar para el DJ

**Opción A: Playlist de Spotify** (solo canciones normales)

```
1. Click en "Exportar a Spotify"
2. Se crea/abre playlist con canciones disponibles
3. ⚠️ Las canciones especiales NO se incluyen
```

**Opción B: PDF Completo para DJ** (recomendado)

```
1. Click en "PDF para DJ (Completo)"
2. Se genera PDF profesional con:
   - Portada con nombres y fecha
   - Estadísticas globales
   - Canciones por bloque (Ceremonia, Cóctel, etc.)
   - Canciones especiales destacadas en ROJO
   - Instrucciones específicas por canción
   - Links de Spotify + URLs de referencia
   - Página de instrucciones generales
3. Compartir PDF con el DJ
```

**Opción C: Lista Simple** (.txt)

```
1. Click en "Lista Simple (.txt)"
2. Descarga archivo de texto con todas las canciones
3. Formato simple para copiar/pegar
```

### Para el DJ

#### Canciones de Spotify

- Acceder a la playlist compartida
- Reproducir directamente desde Spotify
- No requiere búsqueda manual

#### Canciones Especiales (marcadas en PDF)

1. Identificar canciones marcadas en ROJO
2. Leer instrucciones específicas
3. Reproducir URL de referencia para escuchar versión exacta
4. Buscar/descargar versión antes del evento
5. Tener canciones listas en software DJ (Traktor, Serato, etc.)

---

## 💻 Código de Ejemplo

### Marcar Canción como Especial

```javascript
// En el componente
const handleSaveSpecialSong = (specialData) => {
  updateSongSpecialStatus(blockId, momentId, songId, {
    isSpecial: true,
    specialType: 'remix',
    djInstructions: 'Buscar remix de Avicii 2019, versión 6 min',
    referenceUrl: 'https://youtube.com/watch?v=abc',
    duration: 360,
  });
};
```

### Exportar a Spotify

```javascript
const result = await exportToSpotifyPlaylist({
  playlistName: 'Boda María y Juan',
  moments: allMoments,
  getSelectedSong,
  blockName: 'Completa',
});

console.log(result);
// {
//   success: true,
//   spotifySongs: [...],      // Canciones exportadas
//   specialSongs: [...],      // Canciones NO exportadas (especiales)
//   missingSongs: [...],      // Sin canción asignada
//   message: '15 canciones exportadas • 3 especiales (requiere PDF)'
// }
```

### Generar PDF para DJ

```javascript
await generateDJDocument({
  blocks,
  moments,
  getSelectedSong,
  weddingInfo: {
    coupleName: 'María y Juan',
    weddingDate: '2026-06-15',
    contact: '+34 600 000 000',
  },
});
// Se descarga: DJ-Playlist-Maria-y-Juan.pdf
```

---

## 📊 Estadísticas de Exportación

El componente `ExportActionsBar` muestra:

```
┌─────────────────────────────────────┐
│ Exportar Música                     │
├─────────────────────────────────────┤
│ Total: 25                           │
│ En Spotify: 22 ✅                   │
│ Especiales: 3 🔥                    │
│ Definitivas: 20 ⭐                  │
└─────────────────────────────────────┘

⚠️ Tienes 3 canciones especiales
Estas canciones NO se exportarán a Spotify.
Genera el PDF para DJ con todas las instrucciones.
```

---

## 🎨 UI/UX Implementado

### Badge de Canción Especial

```jsx
{
  selectedSong.isSpecial && (
    <div className="bg-gradient-to-r from-orange-100 to-red-100 border border-orange-300">
      🔥 ESPECIAL - Remix Instrucciones: Buscar versión de 2021...
    </div>
  );
}
```

### Botón de Configuración

```jsx
<Button
  className={selectedSong.isSpecial ? 'border-orange-400 text-orange-700' : 'border-gray-300'}
>
  <Settings size={14} />
  {selectedSong.isSpecial ? 'Editar especial' : 'Marcar especial'}
</Button>
```

---

## 🧪 Tests E2E

### Suite 1: Exportación (`momentos-export-spotify.cy.js`)

- ✅ Barra de exportación visible
- ✅ Estadísticas mostradas correctamente
- ✅ Botones de exportación funcionales
- ✅ Navegación entre bloques
- ✅ Progreso por bloque

### Suite 2: Canciones Especiales (`momentos-special-songs.cy.js`)

- ✅ Modal de configuración
- ✅ Marcar/desmarcar como especial
- ✅ Campos requeridos (tipo, instrucciones)
- ✅ URL de referencia
- ✅ Badge visual después de marcar
- ✅ Warning en exportación

---

## 🔒 Validaciones

### Al Exportar a Spotify

```javascript
if (spotifySongs.length === 0) {
  return {
    success: false,
    error: 'No hay canciones de Spotify para exportar',
  };
}
```

### Canciones Especiales

```javascript
// Campos requeridos si isSpecial = true
- specialType: required
- djInstructions: required (mínimo 10 caracteres)
- referenceUrl: optional pero recomendado
```

---

## 📱 Integración Futura con Spotify API

### OAuth Flow (Pendiente)

```javascript
// 1. Autenticación
initiateSpotifyAuth();

// 2. Crear playlist
const playlist = await fetch('https://api.spotify.com/v1/users/{user_id}/playlists', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    name: 'Boda María y Juan',
    description: 'Creada desde MaLoveApp',
    public: false,
  }),
});

// 3. Añadir tracks
await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
  method: 'POST',
  body: JSON.stringify({
    uris: spotifyTrackURIs,
  }),
});
```

---

## 🎯 Casos de Uso Reales

### Caso 1: Boda con Remix Específico

```
Momento: Primer Baile
Canción: "Perfect" - Ed Sheeran
Especial: ✅ Remix
Tipo: Remix
Instrucciones: "Versión remix de Tiësto 2021, 4:30 min.
               IMPORTANTE: No la versión radio edit de 3 min"
Referencia: https://youtube.com/watch?v=xyz
```

### Caso 2: Entrada con Mashup

```
Momento: Entrada Novios
Canción: "Here Comes The Sun / Signed, Sealed, Delivered"
Especial: ✅ Mashup
Tipo: Mashup
Instrucciones: "Mashup custom de DJ Earworm 2020.
               Transición debe ser suave a los 2:15"
Referencia: https://soundcloud.com/dj-earworm/mashup-wedding
```

### Caso 3: Edit Personalizado

```
Momento: Último tema
Canción: "Don't Stop Believin'" - Journey
Especial: ✅ Edit
Tipo: Edit
Instrucciones: "Empezar directamente en el coro (1:20),
               sin intro de piano. Fade out a las 4:00"
```

---

## 📋 Checklist de Implementación

### Completado ✅

- [x] Extender modelo de datos con campos especiales
- [x] Servicio de exportación a Spotify
- [x] Servicio de generación de PDF
- [x] Modal de configuración de canción especial
- [x] Barra de exportación con estadísticas
- [x] Badge visual en SimpleMomentCard
- [x] Botón de configuración especial
- [x] Integración en MomentosEspecialesSimple
- [x] Tests E2E (2 suites, ~20 tests)
- [x] Documentación completa

### Pendiente (Opcional) 🔜

- [ ] OAuth completo con Spotify API
- [ ] Preview de playlist antes de exportar
- [ ] Biblioteca de canciones especiales populares
- [ ] Compartir PDF por email/WhatsApp
- [ ] Template de PDF personalizable
- [ ] Estadísticas de canciones más usadas

---

## 🎉 Resumen

**Problema Solucionado**: Canciones especiales que no están en Spotify

**Solución**: Sistema híbrido inteligente que:

1. Exporta canciones normales a Spotify ✅
2. Genera PDF profesional con canciones especiales 🔥
3. Proporciona instrucciones detalladas al DJ 📋

**Resultado**: El DJ tiene:

- Playlist de Spotify lista para usar
- Documento completo con todas las canciones especiales
- Instrucciones específicas por canción
- Enlaces de referencia para escuchar versiones exactas

**Beneficio para los Novios**: Control total sobre la música de su boda, incluyendo versiones específicas que realmente quieren, no solo lo que Spotify tiene disponible.
