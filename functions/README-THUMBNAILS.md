# 📸 Cloud Function: Generación Automática de Thumbnails

## 🎯 Descripción

Esta Cloud Function genera automáticamente thumbnails optimizados cuando un proveedor sube una foto a su portfolio.

**Trigger:** `Storage onFinalize`  
**Path:** `suppliers/{supplierId}/portfolio/{fileName}`

## ⚙️ Configuración

### 1. Instalar Dependencias

```bash
cd functions
npm install
```

Dependencias nuevas añadidas:

- `sharp@^0.33.2` - Procesamiento de imágenes
- `@google-cloud/storage@^7.7.0` - Cliente de Storage

### 2. Desplegar la Cloud Function

```bash
# Desde la raíz del proyecto
firebase deploy --only functions:generatePortfolioThumbnails
```

O desplegar todas las functions:

```bash
firebase deploy --only functions
```

### 3. Verificar Despliegue

```bash
firebase functions:log --only generatePortfolioThumbnails
```

## 📐 Tamaños de Thumbnails Generados

| Tamaño     | Ancho | Uso                           |
| ---------- | ----- | ----------------------------- |
| **small**  | 150px | Miniaturas, previews pequeños |
| **medium** | 400px | Cards, grid de portfolio      |
| **large**  | 800px | Lightbox, vista detallada     |

Todos los thumbnails se convierten a **WebP** con calidad 85% para optimizar tamaño y rendimiento.

## 🔄 Flujo de Trabajo

1. **Proveedor sube foto** → `PhotoUploadModal.jsx`
2. **Frontend sube a Storage** → `suppliers/{id}/portfolio/imagen.jpg`
3. **Trigger automático** → Cloud Function detecta nueva imagen
4. **Generar thumbnails**:
   - Descargar imagen original
   - Crear 3 tamaños (small, medium, large)
   - Convertir a WebP
   - Subir thumbnails a Storage
5. **Actualizar Firestore** → Añade URLs de thumbnails al documento

## 📁 Estructura de Archivos en Storage

```
suppliers/
  └── {supplierId}/
      └── portfolio/
          ├── 1704567890_abc123.jpg              # Original
          ├── 1704567890_abc123_thumb_small.webp  # 150px
          ├── 1704567890_abc123_thumb_medium.webp # 400px
          └── 1704567890_abc123_thumb_large.webp  # 800px
```

## 🗄️ Estructura en Firestore

```javascript
// suppliers/{supplierId}/portfolio/{photoId}
{
  title: "Boda de María y Juan",
  category: "bodas",
  original: "https://storage.googleapis.com/.../original.jpg",
  thumbnails: {
    small: "https://storage.googleapis.com/.../thumb_small.webp",
    medium: "https://storage.googleapis.com/.../thumb_medium.webp",
    large: "https://storage.googleapis.com/.../thumb_large.webp"
  },
  thumbnailsGeneratedAt: Timestamp,
  uploadedAt: Timestamp,
  views: 0,
  likes: 0
}
```

## ⚠️ Limitaciones y Consideraciones

### Costos

- **Storage:** ~$0.026/GB/mes
- **Cloud Functions:** Primera invocación gratis, luego $0.40/millón
- **Egress:** Descarga de imágenes originales

### Límites

- **Timeout:** 60 segundos (configurable)
- **Memoria:** 256MB (configurable)
- **Tamaño máximo imagen:** Depende de la memoria asignada

### Prevención de Bucles Infinitos

La función ignora archivos que contienen `_thumb_` en el nombre para evitar procesar thumbnails recursivamente.

## 🐛 Debug y Troubleshooting

### Ver Logs en Tiempo Real

```bash
firebase functions:log --only generatePortfolioThumbnails --lines=100
```

### Probar Localmente (Emuladores)

```bash
firebase emulators:start --only functions,storage
```

### Errores Comunes

**Error: "Module sharp not found"**

```bash
cd functions && npm install sharp --save
```

**Error: "Permission denied"**

- Verificar que la service account tiene permisos de Storage Admin
- IAM & Admin → Service Accounts → Permisos

**Thumbnails no se generan**

- Verificar que el archivo está en `suppliers/*/portfolio/*`
- Ver logs: `firebase functions:log`
- Verificar que no es un thumbnail (`_thumb_`)

## 📊 Monitoreo

### Métricas en Firebase Console

1. Ir a **Functions** en Firebase Console
2. Seleccionar `generatePortfolioThumbnails`
3. Ver:
   - Invocaciones
   - Tiempo de ejecución
   - Errores
   - Memoria utilizada

### Alertas Recomendadas

- Error rate > 5% en 5 minutos
- Duración > 30 segundos
- Memoria > 80%

## 🚀 Optimizaciones Futuras

- [ ] Cache de imágenes procesadas
- [ ] Soporte para más formatos (AVIF)
- [ ] Generación lazy de thumbnails bajo demanda
- [ ] Watermark automático
- [ ] Detección de contenido inapropiado
- [ ] Comprimir original si es muy grande

## 📝 Testing

Para testear manualmente:

1. Subir una foto desde el dashboard del proveedor
2. Esperar 5-10 segundos
3. Ver logs: `firebase functions:log`
4. Verificar en Storage que se crearon los 3 thumbnails
5. Verificar en Firestore que se actualizó el documento

## 🔗 Referencias

- [Sharp Documentation](https://sharp.pixelplumbingco.uk/)
- [Firebase Storage Triggers](https://firebase.google.com/docs/functions/gcp-storage-events)
- [Google Cloud Storage Client](https://cloud.google.com/nodejs/docs/reference/storage/latest)

---

**Creado:** 29 Oct 2025  
**Última actualización:** 29 Oct 2025
