# 🎨 Migración de Unsplash a Imágenes Generadas por IA

## ✅ Estado Actual

**Infraestructura Completa:**
- ✅ Estructura de carpetas creada en `/public/assets/`
- ✅ Scripts de migración listos
- ✅ Sistema de mapeo inteligente para ciudades
- ✅ Catálogo completo de imágenes necesarias

**Total referencias Unsplash:** 1323 en 161 archivos

---

## 📋 Proceso de Migración

### Paso 1: Generar Imágenes con IA

Consulta el catálogo completo en `docs/AI_IMAGES_CATALOG.md` con todos los prompts necesarios.

**Resumen de imágenes a generar:**
- **17 imágenes** de servicios (fotografia, video, catering, etc.)
- **15 imágenes** florales (PNG transparente)
- **8 imágenes** de fondos/texturas
- **20 imágenes** de ciudades base
- **4 imágenes** para landing pages

**Total: ~60 imágenes únicas**

#### Herramientas Recomendadas

1. **DALL-E 3** (vía ChatGPT Plus o API OpenAI)
   - Mejor para imágenes realistas de bodas
   - Comercialmente seguro

2. **Midjourney** 
   - Excelente para ilustraciones florales
   - Estilo artístico

3. **Stable Diffusion** (gratuito)
   - Control total
   - Requiere más ajustes

4. **Adobe Firefly**
   - Comercialmente seguro
   - Integrado en Adobe

#### Configuración Recomendada

```
Dimensiones: 
- Servicios/Landing: 1200x800px (3:2)
- Florales: 600x600px (transparente PNG)
- Fondos: 1200x1200px (cuadrado)
- Ciudades: 1200x800px (3:2)

Formato: WebP (mejor compresión) o PNG (florales con transparencia)
Calidad: Alta, mínimo 1200px lado largo
Estilo: Elegante, romántico, profesional, bodas
```

### Paso 2: Organizar Imágenes Generadas

Coloca las imágenes en las carpetas correspondientes:

```
/public/assets/
├── services/
│   ├── fotografia.webp
│   ├── video.webp
│   ├── catering.webp
│   ├── flores.webp
│   ├── decoracion.webp
│   ├── planner.webp
│   ├── musica.webp
│   ├── pastel.webp
│   ├── maquillaje.webp
│   ├── peluqueria.webp
│   ├── invitaciones.webp
│   ├── iluminacion.webp
│   ├── mobiliario.webp
│   ├── transporte.webp
│   ├── viajes.webp
│   ├── joyeria.webp
│   └── default.webp
│
├── florals/
│   ├── rose-spray.png (transparente)
│   ├── peony-cluster.png (transparente)
│   ├── olive-branch-watercolor.png (transparente)
│   ├── wreath-greenery.png (transparente)
│   └── ... (ver catálogo completo)
│
├── backgrounds/
│   ├── texture-paper.webp
│   ├── texture-linen.webp
│   ├── texture-canvas.webp
│   ├── texture-kraft.webp
│   ├── watercolor-blush.webp
│   ├── watercolor-sage.webp
│   ├── watercolor-blue.webp
│   └── watercolor-neutral.webp
│
├── cities/
│   ├── es-madrid.webp
│   ├── es-barcelona.webp
│   ├── es-valencia.webp
│   ├── mx-cdmx.webp
│   ├── generic-beach.webp
│   ├── generic-modern.webp
│   └── ... (20 imágenes total)
│
└── landing/
    ├── hero-wedding-celebration.webp
    ├── couple-planning.webp
    ├── demo-decoration.webp
    ├── demo-ceremony.webp
    └── demo-flowers.webp
```

### Paso 3: Ejecutar Scripts de Migración

Una vez tengas las imágenes generadas:

```bash
# 1. Actualizar archivos de servicios, florales y backgrounds
node scripts/migrate-unsplash-to-local.js

# 2. Actualizar cities.json y blog-posts.json
node scripts/update-cities-and-blog-images.js

# 3. Verificar cambios
git status
git diff
```

### Paso 4: Optimización (Opcional)

Optimiza las imágenes para web:

```bash
# Instalar herramienta de optimización
npm install -g sharp-cli

# Optimizar todas las webp
find public/assets -name "*.webp" -exec sharp -i {} -o {}.optimized.webp --webp quality=85 \;

# O usar imagemin
npm install -g imagemin-cli imagemin-webp
imagemin public/assets/**/*.webp --plugin=webp --out-dir=public/assets/
```

---

## 🔧 Scripts Disponibles

### `migrate-unsplash-to-local.js`
Reemplaza URLs de Unsplash en archivos JS/JSX con rutas locales.

**Archivos procesados:**
- `apps/*/src/utils/providerImages.js` (3 archivos)
- `apps/main-app/src/pages/design-editor/data/floralIllustrations.js`
- `apps/main-app/src/pages/design-editor/data/backgrounds.js`
- `apps/main-app/src/pages/Landing2.jsx`
- `apps/*/src/services/wallService.js` (3 archivos)
- `apps/*/src/services/inspirationService.js` (3 archivos)

### `update-cities-and-blog-images.js`
Actualiza imágenes en JSON de ciudades y blog posts.

### `generate-city-mappings.js`
Genera mapeo inteligente de ciudades a imágenes (ya ejecutado automáticamente).

---

## ⚠️ Notas Importantes

### Licencias y Derechos

✅ **Ventajas de usar IA:**
- Sin problemas de copyright
- Contenido 100% original
- Uso comercial permitido (verifica TOS de tu generador IA)

### Fallbacks

El código incluye fallbacks para manejar imágenes faltantes:
- Si una imagen no existe, usará una por defecto
- Las rutas están diseñadas para no romper la app

### Testing

Después de migrar, prueba:

```bash
# Verificar que no hay errores 404 en consola
npm run dev

# Revisar páginas clave:
# - Landing page
# - Listado de proveedores
# - Editor de invitaciones
# - Blog posts
```

---

## 📊 Estimación de Costos IA

### DALL-E 3 (OpenAI)
- **Precio:** ~$0.04 por imagen (1024x1024)
- **60 imágenes:** ~$2.40
- **Calidad:** Excelente, comercialmente seguro

### Midjourney
- **Precio:** $10/mes plan básico (200 generaciones)
- **60 imágenes:** Incluido en suscripción
- **Calidad:** Excelente para arte e ilustraciones

### Stable Diffusion (Local)
- **Precio:** Gratis
- **Requisitos:** GPU potente (VRAM 8GB+)
- **Tiempo:** Más manual pero flexible

---

## 🎯 Checklist de Migración

- [ ] Generar 17 imágenes de servicios
- [ ] Generar 15 imágenes florales (PNG transparente)
- [ ] Generar 8 fondos/texturas
- [ ] Generar 20 imágenes de ciudades
- [ ] Generar 4 imágenes landing
- [ ] Colocar imágenes en `/public/assets/`
- [ ] Ejecutar `migrate-unsplash-to-local.js`
- [ ] Ejecutar `update-cities-and-blog-images.js`
- [ ] Probar en desarrollo
- [ ] Optimizar imágenes
- [ ] Commit y push
- [ ] Verificar en producción

---

## 🚀 Beneficios Post-Migración

✅ **Cero dependencias externas**  
✅ **Sin riesgo legal de copyright**  
✅ **Mejor performance** (sin CDN externo)  
✅ **Offline-first** (PWA ready)  
✅ **Control total** sobre assets  
✅ **Branding coherente**  

---

## 🆘 Solución de Problemas

### Error: Imagen no se muestra
```bash
# Verificar que existe
ls -lh public/assets/services/fotografia.webp

# Verificar permisos
chmod 644 public/assets/**/*
```

### Error 404 en desarrollo
```bash
# Reiniciar dev server
npm run dev
```

### Imágenes muy pesadas
```bash
# Optimizar con sharp
npm install sharp
node -e "require('sharp')('input.webp').webp({quality:80}).toFile('output.webp')"
```

---

**¿Listo para empezar?** 🎨

Consulta `docs/AI_IMAGES_CATALOG.md` para los prompts específicos de cada imagen.
