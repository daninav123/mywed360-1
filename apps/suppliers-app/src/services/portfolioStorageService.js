import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebaseConfig';

/**
 * Sube una imagen al portfolio del proveedor en Firebase Storage
 * @param {File} file - Archivo de imagen
 * @param {string} supplierId - ID del proveedor
 * @param {Function} onProgress - Callback para progreso (opcional)
 * @returns {Promise<Object>} URLs de la imagen subida
 */
export async function uploadPortfolioImage(file, supplierId, onProgress) {
  if (!file || !supplierId) {
    throw new Error('File and supplierId are required');
  }

  // Validar tipo de archivo
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.');
  }

  // Validar tamaño (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File is too large. Maximum size is 5MB.');
  }

  try {
    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${extension}`;

    // Ruta en Storage: suppliers/{supplierId}/portfolio/{fileName}
    const storagePath = `suppliers/${supplierId}/portfolio/${fileName}`;
    const storageRef = ref(storage, storagePath);

    // Subir el archivo
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });

    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);

    // TODO: Generar thumbnails (esto se puede hacer con Cloud Functions o en el cliente)
    // Por ahora, usamos la misma URL para todos los tamaños
    return {
      original: downloadURL,
      thumbnails: {
        small: downloadURL,
        medium: downloadURL,
        large: downloadURL,
      },
      storagePath, // Guardar para poder eliminar después
    };
  } catch (error) {
    // console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Elimina una imagen del portfolio en Firebase Storage
 * @param {string} storagePath - Ruta de la imagen en Storage
 * @returns {Promise<void>}
 */
export async function deletePortfolioImage(storagePath) {
  if (!storagePath) {
    throw new Error('Storage path is required');
  }

  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error) {
    // Si el archivo no existe, no es un error crítico
    if (error.code === 'storage/object-not-found') {
      // console.warn('Image not found in storage, skipping deletion');
      return;
    }
    // console.error('Error deleting image:', error);
    throw error;
  }
}

/**
 * Comprime una imagen antes de subirla (opcional, para optimización)
 * @param {File} file - Archivo de imagen
 * @param {number} maxWidth - Ancho máximo
 * @param {number} quality - Calidad de compresión (0-1)
 * @returns {Promise<Blob>} Imagen comprimida
 */
export async function compressImage(file, maxWidth = 1920, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcular nuevas dimensiones
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
}
