# 📋 TAREAS PENDIENTES - PÁGINA WEB DE BODAS

## ✅ COMPLETADO

### Fase 1: Campos de Datos e Integración Básica

- ✅ 9 campos nuevos añadidos al perfil (story, menu, dressCode, faqs, etc.)
- ✅ Componentes Craft.js conectados a `weddingData`:
  - ✅ CraftStorySection → `weddingData.historia.texto`
  - ✅ CraftMenuSection → `weddingData.menu.descripcion`
  - ✅ CraftFAQSection → `weddingData.faqs`
  - ✅ CraftDressCodeSection → `weddingData.codigoVestimenta`
  - ✅ CraftTravelInfoSection → `weddingData.viaje`
  - ✅ CraftGiftRegistrySection → `weddingData.regalos`
  - ✅ CraftLocationMapSection → `weddingData.ceremonia.direccion`
  - ✅ CraftRSVPSection → `weddingData.rsvp.fechaLimite`
  - ✅ CraftHeroSection → `weddingData.pareja` + countdown
  - ✅ CraftEventInfoSection → `weddingData.ceremonia` + `recepcion`
- ✅ Página InfoBoda separada del Perfil
- ✅ Input component soporta textarea
- ✅ useWeddingData actualizado con estructura completa

---

## 🔨 PENDIENTE - ALTA PRIORIDAD

### 1. Settings Panels Faltantes

**Componentes sin panel de configuración:**

- ⏳ CraftMenuSection - Necesita settings
- ⏳ CraftFAQSection - Necesita settings
- ⏳ CraftDressCodeSection - Necesita settings
- ⏳ CraftTravelInfoSection - Necesita settings
- ⏳ CraftGiftRegistrySection - Necesita settings
- ⏳ CraftLocationMapSection - Necesita settings
- ⏳ CraftRSVPSection - Necesita settings
- ⏳ CraftTestimonialsSection - Necesita settings

**Con settings:**

- ✅ CraftHeroSection
- ✅ CraftCountdownSection
- ✅ CraftEventInfoSection
- ✅ CraftStorySection
- ✅ CraftPhotoGallerySection

---

### 2. Sistema de Gestión de Imágenes

**Actual:** Algunas imágenes hardcodeadas o props manuales

**Necesario:**

- ⏳ **Upload de foto de portada** (Hero Section)
  - Desde InfoBoda o directamente en el editor
  - Almacenar en `/web-hero-images/{weddingId}/{timestamp}.jpg`
- ⏳ **Galería de fotos principal**
  - Interfaz de upload múltiple
  - Gestión de galería (ordenar, eliminar)
  - Almacenar en `/web-galleries/{weddingId}/`
- ⏳ **Fotos en Story Section**
  - 4 fotos para la historia de la pareja
  - Upload individual o desde galería existente
- ⏳ **Optimización de imágenes**
  - Compresión automática
  - Generación de thumbnails
  - Lazy loading

**Archivos a modificar:**

- `InfoBoda.jsx` - Añadir sección de fotos
- `CraftPhotoGallerySection.jsx` - Conectar a Firebase Storage
- `CraftHeroSection.jsx` - Upload de imagen de fondo
- `storage.rules` - Nuevas reglas para `/web-hero-images/`

---

### 3. Sistema de Publicación Real

**Actual:** Preview funcional pero sin dominio público real

**Necesario:**

- ⏳ **Slug único por boda**
  - Generar slug desde nombre de pareja
  - Validar unicidad en Firestore
  - Guardar en `weddings/{weddingId}/webConfig.slug`
- ⏳ **URL pública funcional**
  - Ruta: `/web/{slug}` (ya existe parcialmente)
  - Cargar datos de la boda desde slug
  - SEO friendly
- ⏳ **Botón "Publicar" vs "Guardar Borrador"**
  - Estado: `draft`, `published`, `unpublished`
  - Vista previa privada
  - Publicación pública
- ⏳ **Compartir URL**
  - Copiar enlace
  - Código QR
  - Compartir en redes sociales

**Archivos a crear/modificar:**

- `InfoBoda.jsx` - Campo slug + botón publicar
- `PublicWeb.jsx` - Mejorar carga desde slug
- `WebBuilderPageCraft.jsx` - Estado publicación
- Firestore: `weddings/{id}/webConfig` → `{ slug, isPublished, publishedAt }`

---

### 4. RSVP Funcional Completo

**Actual:** Formulario demo, no guarda confirmaciones

**Necesario:**

- ⏳ **Base de datos de RSVPs**
  - Firestore: `rsvps/{weddingId}/guests/{guestId}`
  - Campos: nombre, email, asistencia (sí/no), acompañantes, alergias, mensaje
- ⏳ **Formulario público funcional**
  - Validación de datos
  - Envío a Firestore
  - Email de confirmación
- ⏳ **Dashboard de confirmaciones**
  - Ver lista de confirmados
  - Estadísticas (% confirmación)
  - Exportar a CSV
  - Integrar con lista de invitados existente
- ⏳ **Recordatorios automáticos**
  - Email X días antes de la fecha límite
  - Para invitados sin confirmar

**Archivos a crear/modificar:**

- `PublicRSVP.jsx` - Formulario completo funcional
- `RSVPDashboard.jsx` - Mejorar con datos reales
- `CraftRSVPSection.jsx` - Enlace al formulario real
- Firestore: Nueva colección `rsvps`

---

### 5. Campos Avanzados en InfoBoda

**Faltantes para funcionalidad completa:**

- ⏳ **Coordenadas GPS para el mapa**
  - Ceremonia: lat, lng
  - Recepción: lat, lng
  - Autocompletar con Google Places API
- ⏳ **Enlaces a tiendas de regalos**
  - Lista de enlaces + descripción
  - Código de lista/descuento
- ⏳ **Testimonios**
  - Array de: { nombre, relacion, texto, foto }
  - Gestión desde InfoBoda
- ⏳ **Horarios detallados**
  - Timeline del día: { hora, evento, descripción }
  - Mostrar en componente dedicado

**Archivos a modificar:**

- `InfoBoda.jsx` - Nuevos campos
- `useWeddingData.js` - Ampliar estructura
- Componentes Craft.js respectivos

---

## 🎨 PENDIENTE - MEDIA PRIORIDAD

### 6. Personalización Avanzada de Tema

**Actual:** Variables CSS básicas

**Mejorar:**

- ⏳ **Selector de fuentes**
  - Google Fonts integration
  - Preview en tiempo real
- ⏳ **Paleta de colores visual**
  - Color picker para cada variable
  - Presets temáticos (Romántico, Moderno, Vintage)
- ⏳ **Animaciones configurables**
  - Efectos de entrada
  - Transiciones entre secciones
- ⏳ **Música de fondo** (opcional)
  - Upload o URL de Spotify/YouTube
  - Control de volumen
  - Autoplay (con advertencia)

**Archivos a modificar:**

- `GlobalStylesPanel.jsx` - Ampliar controles
- `themes.js` - Añadir más temas predefinidos

---

### 7. SEO y Compartir en Redes

**Actual:** Sin meta tags optimizados

**Necesario:**

- ⏳ **Meta tags dinámicos**
  - Title: "Boda de {nombres} - {fecha}"
  - Description personalizada
  - Open Graph tags
  - Twitter Cards
- ⏳ **Imagen de preview social**
  - Generar automáticamente
  - O subir custom
- ⏳ **Favicon personalizado**
  - Upload desde InfoBoda
  - Generación de múltiples tamaños

**Archivos a crear/modificar:**

- `PublicWeb.jsx` - Helmet con meta tags dinámicos
- `InfoBoda.jsx` - Campos SEO
- Función para generar og:image

---

### 8. Responsive y Accesibilidad

**Verificar:**

- ⏳ **Mobile-first testing**
  - Todos los componentes en móvil
  - Menú hamburguesa si es necesario
  - Touch gestures en galería
- ⏳ **Accesibilidad (A11y)**
  - Contraste de colores
  - Alt text en imágenes
  - Navegación por teclado
  - Screen readers
  - ARIA labels

**Testing necesario:**

- Lighthouse audit
- VoiceOver/NVDA testing
- Cross-browser (Safari, Firefox, Chrome)

---

### 9. Analytics y Estadísticas

**Opcional pero útil:**

- ⏳ **Google Analytics integration**
  - Visitas a la web
  - Tiempo en página
  - Dispositivos más usados
- ⏳ **Dashboard interno**
  - Vistas únicas
  - Clicks en RSVP
  - Engagement por sección

---

## 🚀 PENDIENTE - BAJA PRIORIDAD

### 10. Funcionalidades Extra

- ⏳ **Modo offline/PWA**
  - Service Worker
  - Cache de assets
  - Instalable como app
- ⏳ **Cuenta regresiva en vivo**
  - Actualización en tiempo real
  - Compartir countdown
- ⏳ **Galería de invitados**
  - Subida de fotos por invitados
  - Moderación por los novios
- ⏳ **Streaming en vivo**
  - Integración con YouTube/Vimeo
  - Para invitados remotos
- ⏳ **Libro de firmas digital**
  - Mensajes de invitados
  - Visible en la web
- ⏳ **Exportar a PDF**
  - Invitación imprimible
  - Programa del día

---

## 📊 PRIORIZACIÓN RECOMENDADA

### Sprint 1 (Urgente - 2-3 días)

1. ✅ Settings panels para componentes faltantes
2. ✅ Sistema básico de upload de imágenes (Hero + Galería)
3. ✅ Slug único + publicación básica

### Sprint 2 (Importante - 3-4 días)

4. ✅ RSVP funcional completo
5. ✅ Coordenadas GPS + mapa real
6. ✅ SEO básico (meta tags)

### Sprint 3 (Mejoras - 2-3 días)

7. ✅ Campos avanzados (testimonios, timeline)
8. ✅ Responsive testing completo
9. ✅ Personalización avanzada de tema

### Sprint 4 (Nice to have - indefinido)

10. ✅ Funcionalidades extra según demanda

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

**Para tener una web publicable mínima viable:**

1. **Settings panels** → Permitir editar todo desde el editor
2. **Upload de imágenes** → Hero + Galería básica
3. **Sistema de publicación** → Slug + URL pública
4. **RSVP funcional** → Guardar confirmaciones reales

**Después de estos 4 puntos, la web será 100% funcional y publicable.**

---

## 📝 NOTAS TÉCNICAS

### Estructura Firebase necesaria:

```javascript
weddings/{weddingId}/
  webConfig: {
    slug: "maria-y-juan-2025",
    isPublished: true,
    publishedAt: timestamp,
    heroImage: "url",
    seoTitle: "...",
    seoDescription: "..."
  },
  weddingInfo: { ... }, // Ya existe
  gallery: [
    { url, caption, order }
  ],
  testimonials: [
    { nombre, relacion, texto, foto }
  ]

rsvps/{weddingId}/guests/{guestId}:
  {
    nombre: "...",
    email: "...",
    asistencia: true/false,
    acompañantes: 2,
    alergias: "...",
    mensaje: "...",
    confirmedAt: timestamp
  }
```

### Storage paths necesarios:

- `/web-hero-images/{weddingId}/hero.jpg`
- `/web-galleries/{weddingId}/{imageId}.jpg`
- `/web-testimonials/{weddingId}/{personId}.jpg`

---

**Última actualización:** 2 Dic 2024
