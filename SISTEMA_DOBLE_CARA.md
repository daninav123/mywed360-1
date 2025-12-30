# 🎴 Sistema de Invitaciones de Doble Cara

**Fecha**: 27 Diciembre 2025 - 21:00  
**Estado**: ✅ Implementado

---

## 📋 Cambio Importante

### ❌ Antes: Cara Única
```javascript
{
  id: 'template-1',
  name: 'Template Simple',
  canvas: {
    width: 1050,
    height: 1485,
    backgroundColor: '#FFF',
    objects: [...]
  }
}
```

### ✅ Ahora: Doble Cara
```javascript
{
  id: 'template-1',
  name: 'Template Moderno',
  sides: {
    front: {
      width: 1050,
      height: 1485,
      backgroundColor: '#FFF',
      objects: [...] // Diseño principal
    },
    back: {
      width: 1050,
      height: 1485,
      backgroundColor: '#F5F5F5',
      objects: [...] // Detalles, mapa, RSVP
    }
  }
}
```

---

## 🎨 5 Templates Modernos Creados

### 1. **Eucalipto Minimalista** 🌿
**Estilo**: Neutral Greenery (Tendencia 2025)

**Anverso**:
- Ramas de eucalipto decorativas
- Nombres elegantes con espaciado amplio
- Tipografía Cormorant + Lato
- Colores verde salvia (#8B9B84)
- Marco fino superior e inferior

**Reverso**:
- Cronograma detallado
- Dress code
- Sección RSVP
- Placeholder para QR code
- Hashtag de la boda
- Fondo verde suave (#F8FAF7)

---

### 2. **Florales Holandeses Oscuros** 🌺
**Estilo**: Dutch Florals (Inspirado en pinturas s.XVII)

**Anverso**:
- Fondo negro dramático (#1A1D24)
- Flores oscuras simuladas (rosas, peonías)
- Texto dorado elegante (#E8D7A5, #D4AF37)
- Marco dorado fino
- Muy sofisticado y formal

**Reverso**:
- Mismo fondo oscuro
- Detalles de ceremonia y banquete
- Dress code: Black Tie
- RSVP formal
- Ornamentos dorados

---

### 3. **Lazos Rosa Preppy** 🎀
**Estilo**: Bows & Ribbons (Tendencia romántica 2025)

**Anverso**:
- Lazo grande decorativo superior
- Monograma en círculo
- Nombres en Playfair italic
- Rosa empolvado (#E8B4C4, #F4C2D0)
- Marco con línea de lazo inferior

**Reverso**:
- Orden del día completo
- Dress code con sugerencias de color
- Mensaje especial sobre regalos
- "Tu presencia es nuestro mejor regalo"
- Contribución viaje de novios

---

### 4. **Old Money con Escudo** 💎
**Estilo**: Old Money Aesthetic (Lujo discreto)

**Anverso**:
- Doble marco (verde bosque + verde salvia)
- Escudo/Crest con iniciales
- Texto formal: "JUNTO A SUS FAMILIAS"
- Nombres en Playfair Display
- Fecha en caja beige (#E8E3D8)
- Muy formal y tradicional

**Reverso**:
- Mismos bordes elegantes
- Ceremonia religiosa detallada
- Recepción: cocktail, banquete, baile
- Etiqueta: traje formal requerido
- Mensaje refinado sobre obsequios
- Fondo crema (#F8F5F0)

---

### 5. **Sunset Vibrante** 🌅
**Estilo**: Bold Colors (Tendencia maximalista 2025)

**Anverso**:
- Bloques de color vibrantes:
  - Rosa (#FF6B9D)
  - Naranja (#FFB84D)
  - Púrpura (#A78BFA)
  - Turquesa (#60D9BE)
- Círculo blanco central con info
- Tipografía Montserrat bold
- Muy moderno y atrevido

**Reverso**:
- Franjas de color laterales
- Secciones con acentos de color
- Ceremonia (naranja)
- Fiesta (púrpura)
- Dress code (turquesa)
- RSVP con fondo rosa suave
- Hashtag púrpura

---

## 🔧 Características Técnicas

### Sistema de Procesamiento

```javascript
processDoubleSidedTemplate(template, weddingData, side)
```

**Parámetros**:
- `template`: Template con estructura `sides`
- `weddingData`: Datos reales de la boda
- `side`: 'front' o 'back'

**Retorna**: Template procesado con una sola cara lista para canvas

### Marcadores Soportados

```javascript
{{coupleName}}      // "Ana & Pedro"
{{bride}}           // "Ana"
{{groom}}           // "Pedro"
{{brideInitial}}    // "A"
{{groomInitial}}    // "P"
{{formattedDate}}   // "15 de Junio 2024"
{{schedule}}        // "18:00"
{{ceremonyPlace}}   // "Iglesia San Juan"
{{ceremonyAddress}} // "Madrid, España"
{{banquetPlace}}    // "Finca Los Olivos"
{{hashtag}}         // "#AnaYPedro2024"
{{rsvpDate}}        // "1 de Mayo 2024"
```

---

## 🎯 Interfaz de Usuario

### Selector Anverso/Reverso

```jsx
<div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
  <button onClick={() => setSelectedSide('front')}>
    📄 Anverso
  </button>
  <button onClick={() => setSelectedSide('back')}>
    📋 Reverso
  </button>
</div>
```

**Funcionalidad**:
- Toggle entre anverso y reverso
- Preview en tiempo real
- Auto-relleno con datos reales
- Visual feedback activo

---

## 📊 Estadísticas

```
Templates totales:    43
├─ Modernos 2025:     5 (doble cara) = 10 diseños
├─ Bonitos:          10 (cara única)
└─ Antiguos:         28 (cara única)

Tendencias cubiertas: 5
✅ Neutral Greenery
✅ Dutch Florals
✅ Bows & Ribbons
✅ Old Money Aesthetic
✅ Bold Colors
```

---

## 🎨 Contenido Típico del Reverso

### 1. **Cronograma/Orden del Día**
```
18:00 - Ceremonia
19:30 - Cóctel de bienvenida
21:00 - Banquete
23:00 - Baile
02:00 - Fin de la celebración
```

### 2. **Detalles de Lugares**
- Nombre completo del lugar
- Dirección detallada
- Coordenadas GPS (opcional)
- Indicaciones de llegada

### 3. **Dress Code**
- Formal / Semi-formal / Etiqueta
- Sugerencias de colores
- Notas especiales

### 4. **RSVP**
- Fecha límite confirmación
- Método de confirmación
- Contacto

### 5. **Información Adicional**
- Transporte organizado
- Hoteles recomendados
- Parking disponible
- Hashtag de la boda
- QR code para más info

### 6. **Mensajes Especiales**
- Sobre regalos
- Niños (permitidos o no)
- Mascotas
- Alergias alimentarias

---

## 💡 Ventajas del Sistema Doble Cara

### Para el Usuario
1. **Más información** sin saturar el diseño
2. **Organización clara** (anverso=invitación, reverso=detalles)
3. **Profesional** como invitaciones reales
4. **Flexibilidad** de diseño independiente

### Para el Diseño
1. **Libertad creativa** en cada cara
2. **Coherencia visual** entre ambas caras
3. **Jerarquía clara** de información
4. **Espacio para QR codes** y elementos interactivos

---

## 🚀 Uso en el Editor

### Paso 1: Seleccionar Template
- Navegar a "Plantillas"
- Ver templates modernos primero

### Paso 2: Elegir Cara
- Click en "📄 Anverso" o "📋 Reverso"
- Preview actualiza automáticamente

### Paso 3: Personalizar
- Datos ya auto-rellenados
- Editar textos si necesario
- Ajustar colores y fuentes

### Paso 4: Exportar
- Exportar anverso como PDF
- Exportar reverso como PDF
- Imprimir en imprenta (doble cara)

---

## 📈 Próximas Mejoras

### Más Templates
- [ ] 5 templates adicionales doble cara
- [ ] Save the Date (doble cara)
- [ ] Menú de boda (doble cara)
- [ ] Programa de ceremonia

### Funcionalidades
- [ ] Vista previa lado a lado
- [ ] Exportar ambas caras en un solo PDF
- [ ] Plantilla para sobres
- [ ] Sistema de capas entre caras

### Optimizaciones
- [ ] Lazy loading de templates
- [ ] Cache de procesamiento
- [ ] Thumbnails generados

---

## ✅ Checklist de Implementación

```
✅ Crear estructura sides (front/back)
✅ Diseñar 5 templates modernos
✅ Función processDoubleSidedTemplate
✅ Selector UI anverso/reverso
✅ Integrar en TemplatesPanel
✅ Auto-relleno con datos reales
✅ Sistema de marcadores
✅ Documentación completa
```

---

## 🎓 Guía de Diseño

### Anverso (Front)
**Objetivo**: Impacto visual + Información esencial

**Incluir**:
- Nombres de la pareja
- Fecha de la boda
- Hora de inicio
- Lugar principal
- Diseño atractivo y memorable

**Evitar**:
- Demasiado texto
- Información detallada
- Múltiples direcciones

### Reverso (Back)
**Objetivo**: Información práctica + Detalles

**Incluir**:
- Cronograma completo
- Direcciones detalladas
- Dress code
- RSVP con fecha límite
- Contacto
- QR code
- Hashtag
- Notas especiales

**Evitar**:
- Diseño recargado
- Competir con el anverso
- Información redundante

---

**Resultado Final**: Sistema profesional de invitaciones de doble cara con auto-relleno de datos reales, basado en tendencias 2025 y diseños de alta calidad.
