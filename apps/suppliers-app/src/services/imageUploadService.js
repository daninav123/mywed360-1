import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

/**
 * Subir imagen a Firebase Storage
 * @param {File} file - Archivo de imagen
 * @param {string} path - Ruta donde guardar (ej: 'webs/webId/gallery')
 * @param {function} onProgress - Callback para progreso (opcional)
 * @returns {Promise<string>} URL de la imagen subida
 */
export const uploadImage = async (file, path, onProgress) => {
  try {
    // Validar que es una imagen
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen');
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('La imagen no puede superar 5MB');
    }

    // Generar nombre único
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${extension}`;

    // Crear referencia
    const storageRef = ref(storage, `${path}/${fileName}`);

    console.log('📤 Subiendo imagen:', fileName);

    // Subir archivo
    const snapshot = await uploadBytes(storageRef, file);
    console.log('✅ Imagen subida');

    // Obtener URL pública
    const url = await getDownloadURL(snapshot.ref);
    console.log('🔗 URL obtenida:', url);

    return url;
  } catch (error) {
    console.error('❌ Error subiendo imagen:', error);
    throw error;
  }
};

/**
 * Subir múltiples imágenes
 * @param {FileList|Array} files - Archivos a subir
 * @param {string} path - Ruta donde guardar
 * @param {function} onProgress - Callback para progreso de cada imagen
 * @returns {Promise<Array<string>>} Array de URLs
 */
export const uploadMultipleImages = async (files, path, onProgress) => {
  try {
    const fileArray = Array.from(files);
    const uploadPromises = fileArray.map((file, index) =>
      uploadImage(file, path, (progress) => {
        if (onProgress) {
          onProgress(index, progress);
        }
      })
    );

    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('❌ Error subiendo múltiples imágenes:', error);
    throw error;
  }
};

/**
 * Eliminar imagen de Storage
 * @param {string} url - URL de la imagen a eliminar
 */
export const deleteImage = async (url) => {
  try {
    // Extraer el path de la URL
    const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/';
    if (!url.startsWith(baseUrl)) {
      throw new Error('URL no válida de Firebase Storage');
    }

    // Crear referencia desde URL
    const imageRef = ref(storage, url);
    await deleteObject(imageRef);

    console.log('🗑️ Imagen eliminada');
  } catch (error) {
    console.error('❌ Error eliminando imagen:', error);
    throw error;
  }
};

/**
 * Comprimir imagen antes de subir (opcional)
 * @param {File} file - Archivo de imagen
 * @param {number} maxWidth - Ancho máximo
 * @param {number} maxHeight - Alto máximo
 * @param {number} quality - Calidad (0-1)
 * @returns {Promise<Blob>} Imagen comprimida
 */
export const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcular nuevas dimensiones manteniendo aspecto
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          file.type,
          quality
        );
      };

      img.onerror = reject;
    };

    reader.onerror = reject;
  });
};
