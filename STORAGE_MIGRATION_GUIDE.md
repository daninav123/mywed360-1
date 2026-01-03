# 📦 Guía de Migración Firebase Storage → MinIO/S3

**Fecha:** 2026-01-02  
**Estado:** Pendiente  
**Impacto:** Medio - Solo afecta upload de portfolio de proveedores

---

## 🎯 Objetivo

Migrar el almacenamiento de archivos de **Firebase Storage** a **MinIO** (compatible S3) o **AWS S3** para:
- Eliminar completamente la dependencia de Firebase
- Reducir costos de almacenamiento
- Tener control total de los archivos
- Aprovechar infraestructura local/propia

---

## 📊 Archivos que Usan Firebase Storage

### 1. **supplier-dashboard.js** (Portfolio Upload)
**Líneas:** ~714-838  
**Uso:** Subir fotos de portfolio de proveedores

```javascript
// Código actual (Firebase Storage):
const bucket = admin.storage().bucket(bucketName);
const file = bucket.file(storagePath);
await file.save(req.file.buffer, { metadata: { contentType: req.file.mimetype } });
await file.makePublic();
const downloadURL = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
```

**Estado:** Temporalmente deshabilitado (retorna 501)

### 2. **mail/attachments.js** (Email Attachments)
**Uso:** Gestión de adjuntos de emails

**Estado:** Pendiente revisión

### 3. **mailgun-inbound.js** (Inbound Email Processing)
**Uso:** Procesar emails entrantes con adjuntos

**Estado:** Pendiente revisión

---

## 🚀 Opciones de Migración

### **Opción A: MinIO (Recomendado para desarrollo)**

**Ventajas:**
- ✅ Compatible S3 (mismo API que AWS)
- ✅ Auto-hospedado (sin costos cloud)
- ✅ Fácil de configurar con Docker
- ✅ Perfecto para desarrollo local

**Instalación:**
```bash
# Docker Compose
docker run -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=admin" \
  -e "MINIO_ROOT_PASSWORD=miniopassword" \
  minio/minio server /data --console-address ":9001"
```

**Configuración en .env:**
```env
STORAGE_TYPE=minio
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=miniopassword
MINIO_BUCKET=mywed360-uploads
MINIO_USE_SSL=false
```

### **Opción B: AWS S3 (Recomendado para producción)**

**Ventajas:**
- ✅ Altamente escalable
- ✅ CDN integrado (CloudFront)
- ✅ Backups automáticos
- ✅ Lifecycle policies

**Costos aproximados:**
- Storage: $0.023/GB/mes
- Transfer: $0.09/GB out
- Requests: $0.005/1000 requests

**Configuración en .env:**
```env
STORAGE_TYPE=s3
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=mywed360-uploads
```

### **Opción C: Cloudflare R2 (Económico)**

**Ventajas:**
- ✅ Compatible S3
- ✅ Sin costos de egress (transferencia out)
- ✅ Muy económico ($0.015/GB/mes)

---

## 🔧 Implementación Sugerida

### **1. Crear servicio de Storage (`backend/services/storageService.js`):**

```javascript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'minio';

class StorageService {
  constructor() {
    if (STORAGE_TYPE === 'minio' || STORAGE_TYPE === 's3') {
      this.client = new S3Client({
        endpoint: process.env.MINIO_ENDPOINT 
          ? `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`
          : undefined,
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.MINIO_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.MINIO_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY,
        },
        forcePathStyle: STORAGE_TYPE === 'minio', // MinIO requires path-style
      });
      this.bucket = process.env.MINIO_BUCKET || process.env.S3_BUCKET;
    }
  }

  async uploadFile(buffer, path, contentType) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    });
    
    await this.client.send(command);
    
    // Construir URL pública
    if (STORAGE_TYPE === 'minio') {
      return `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${this.bucket}/${path}`;
    } else {
      return `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${path}`;
    }
  }

  async deleteFile(path) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });
    await this.client.send(command);
  }

  async getSignedUrl(path, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });
    return await getSignedUrl(this.client, command, { expiresIn });
  }
}

export const storageService = new StorageService();
```

### **2. Actualizar `supplier-dashboard.js`:**

```javascript
import { storageService } from '../services/storageService.js';

// POST /portfolio/upload
router.post('/portfolio/upload', requireSupplierAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'no_file_uploaded' });
    }

    const { title = '', description = '', category, tags = '[]', featured = 'false', isCover = 'false' } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'category_required' });
    }

    // Generar path único
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = req.file.originalname.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${extension}`;
    const storagePath = `suppliers/${req.supplier.id}/portfolio/${fileName}`;

    // Subir a MinIO/S3
    const downloadURL = await storageService.uploadFile(
      req.file.buffer,
      storagePath,
      req.file.mimetype
    );

    // Resto del código igual...
    const photoData = {
      title,
      description,
      category,
      original: downloadURL,
      thumbnails: {
        small: downloadURL,
        medium: downloadURL,
        large: downloadURL,
      },
      storagePath,
      views: 0,
      likes: 0,
    };

    const photo = await prisma.supplierPortfolio.create({
      data: {
        supplierId: req.supplier.id,
        ...photoData,
      },
    });

    return res.json({ success: true, photoId: photo.id, photo });
  } catch (error) {
    logger.error('Error uploading portfolio photo:', error);
    return res.status(500).json({ error: 'upload_failed', message: error.message });
  }
});
```

### **3. Instalar dependencias:**

```bash
cd backend
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## 📋 Checklist de Migración

### **Preparación:**
- [ ] Decidir entre MinIO (dev) o S3 (prod)
- [ ] Configurar servidor MinIO o cuenta AWS
- [ ] Crear bucket y configurar permisos
- [ ] Actualizar `.env` con credenciales

### **Código:**
- [ ] Crear `services/storageService.js`
- [ ] Actualizar `supplier-dashboard.js` upload endpoint
- [ ] Actualizar `mail/attachments.js` (si aplica)
- [ ] Actualizar `mailgun-inbound.js` (si aplica)
- [ ] Remover imports de `admin.storage()`

### **Testing:**
- [ ] Probar upload de portfolio
- [ ] Verificar URLs públicas funcionan
- [ ] Probar delete de fotos
- [ ] Verificar thumbnails (si se generan)

### **Migración de datos existentes (opcional):**
- [ ] Script para copiar fotos de Firebase Storage a MinIO/S3
- [ ] Actualizar URLs en base de datos PostgreSQL

---

## ⏱️ Tiempo Estimado

- **Setup MinIO:** 30 minutos
- **Implementar storageService:** 1 hora
- **Actualizar endpoints:** 1-2 horas
- **Testing:** 30 minutos
- **Migración datos existentes:** 2-4 horas (opcional)

**Total: ~3-5 horas** (sin migración de datos existentes)

---

## 🎯 Estado Actual

**Portfolio Upload:**
- ✅ Endpoint existe
- ⚠️ Temporalmente deshabilitado (retorna 501)
- ❌ Requiere Firebase Storage (no disponible)

**Workaround temporal:**
- Usar endpoint legacy que acepta URLs externas
- Subir imágenes manualmente a servicio externo (Imgur, etc.)
- Proporcionar URL en el request

**Endpoint legacy disponible:**
```javascript
POST /api/supplier-dashboard/portfolio
Body: {
  title: "Foto de boda",
  description: "...",
  category: "bodas",
  original: "https://external-url.com/image.jpg",
  thumbnails: { small: "...", medium: "...", large: "..." }
}
```

---

## 📞 Ayuda

Si necesitas ayuda con la migración:
1. Revisar ejemplos de código arriba
2. Consultar documentación oficial de MinIO/S3
3. El código de `storageService.js` está listo para copiar/pegar

**MinIO Docs:** https://min.io/docs/minio/linux/developers/javascript/API.html  
**AWS S3 SDK:** https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/
