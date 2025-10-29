/**
 * Cloud Function para generar thumbnails automáticamente
 * cuando se sube una imagen al portfolio de un proveedor
 *
 * Trigger: Storage onFinalize
 * Path: suppliers/{supplierId}/portfolio/{fileName}
 *
 * Genera 3 tamaños:
 * - small: 150px
 * - medium: 400px
 * - large: 800px
 *
 * Convierte a WebP para optimización
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const sharp = require('sharp');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

const storage = new Storage();
const db = admin.firestore();

// Configuración de tamaños
const THUMBNAIL_SIZES = {
  small: 150,
  medium: 400,
  large: 800,
};

exports.generatePortfolioThumbnails = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name; // suppliers/{supplierId}/portfolio/{fileName}
  const contentType = object.contentType;
  const bucketName = object.bucket;

  // Verificar que es una imagen del portfolio
  if (!filePath.includes('/portfolio/')) {
    console.log('No es una imagen de portfolio, ignorando');
    return null;
  }

  // Verificar que es una imagen
  if (!contentType || !contentType.startsWith('image/')) {
    console.log('No es una imagen, ignorando');
    return null;
  }

  // Evitar bucles infinitos (no procesar thumbnails)
  if (filePath.includes('_thumb_')) {
    console.log('Es un thumbnail, ignorando');
    return null;
  }

  // Extraer información del path
  const pathParts = filePath.split('/');
  if (pathParts.length < 4) {
    console.log('Path inválido:', filePath);
    return null;
  }

  const supplierId = pathParts[1];
  const fileName = pathParts[pathParts.length - 1];
  const fileDir = path.dirname(filePath);
  const fileExtension = path.extname(fileName);
  const fileNameWithoutExt = path.basename(fileName, fileExtension);

  console.log(`Generando thumbnails para: ${filePath}`);
  console.log(`Proveedor: ${supplierId}`);

  const bucket = storage.bucket(bucketName);
  const tempFilePath = path.join(os.tmpdir(), fileName);

  try {
    // Descargar imagen original
    await bucket.file(filePath).download({ destination: tempFilePath });
    console.log('Imagen descargada a:', tempFilePath);

    const thumbnailUrls = {};

    // Generar cada tamaño de thumbnail
    for (const [sizeName, width] of Object.entries(THUMBNAIL_SIZES)) {
      const thumbFileName = `${fileNameWithoutExt}_thumb_${sizeName}.webp`;
      const thumbFilePath = `${fileDir}/${thumbFileName}`;
      const tempThumbPath = path.join(os.tmpdir(), thumbFileName);

      // Generar thumbnail con Sharp (convertir a WebP)
      await sharp(tempFilePath)
        .resize(width, width, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toFile(tempThumbPath);

      console.log(`Thumbnail ${sizeName} generado: ${tempThumbPath}`);

      // Subir thumbnail a Storage
      await bucket.upload(tempThumbPath, {
        destination: thumbFilePath,
        metadata: {
          contentType: 'image/webp',
          metadata: {
            originalFile: filePath,
            thumbnailSize: sizeName,
            generatedAt: new Date().toISOString(),
          },
        },
      });

      // Hacer público el thumbnail
      await bucket.file(thumbFilePath).makePublic();

      // Obtener URL pública
      thumbnailUrls[sizeName] = `https://storage.googleapis.com/${bucketName}/${thumbFilePath}`;

      console.log(`Thumbnail ${sizeName} subido: ${thumbnailUrls[sizeName]}`);

      // Limpiar archivo temporal del thumbnail
      await fs.unlink(tempThumbPath);
    }

    // Limpiar archivo temporal original
    await fs.unlink(tempFilePath);

    // Actualizar documento en Firestore
    // Buscar el documento de portfolio que tiene esta imagen
    const portfolioQuery = await db
      .collection('suppliers')
      .doc(supplierId)
      .collection('portfolio')
      .where('original', '==', `https://storage.googleapis.com/${bucketName}/${filePath}`)
      .limit(1)
      .get();

    if (!portfolioQuery.empty) {
      const photoDoc = portfolioQuery.docs[0];
      await photoDoc.ref.update({
        thumbnails: thumbnailUrls,
        thumbnailsGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Documento actualizado en Firestore: ${photoDoc.id}`);
    } else {
      console.warn('No se encontró documento en Firestore para actualizar');
    }

    console.log('✅ Thumbnails generados exitosamente');
    return {
      success: true,
      thumbnails: thumbnailUrls,
    };
  } catch (error) {
    console.error('❌ Error generando thumbnails:', error);
    throw error;
  }
});
