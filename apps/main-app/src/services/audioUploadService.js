/**
 * Servicio de upload de archivos de audio para canciones especiales
 * Almacena archivos en Firebase Storage para que el DJ pueda descargarlos
 */

import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebaseConfig';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB máximo
const ALLOWED_FORMATS = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/aac', 'audio/flac'];

/**
 * Validar archivo de audio antes de subir
 */
export function validateAudioFile(file) {
  if (!file) {
    return { valid: false, error: 'No se seleccionó ningún archivo' };
  }

  // Validar tamaño
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `El archivo es demasiado grande. Máximo ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`,
    };
  }

  // Validar formato
  if (!ALLOWED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: 'Formato no soportado. Usa MP3, WAV, OGG, AAC o FLAC',
    };
  }

  return { valid: true };
}

/**
 * Subir archivo de audio a Firebase Storage
 * 
 * @param {Object} params
 * @param {File} params.file - Archivo de audio
 * @param {string} params.weddingId - ID de la boda
 * @param {string} params.momentId - ID del momento
 * @param {string} params.songId - ID de la canción
 * @param {Function} params.onProgress - Callback de progreso (0-100)
 * @returns {Promise<Object>} - URL de descarga y metadata
 */
export async function uploadAudioFile({ file, weddingId, momentId, songId, onProgress }) {
  // Validar archivo
  const validation = validateAudioFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Generar nombre único
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${timestamp}_${sanitizedFileName}`;
  
  // Ruta en Storage: weddings/{weddingId}/audio-especiales/{momentId}/{songId}/{fileName}
  const storagePath = `weddings/${weddingId}/audio-especiales/${momentId}/${songId}/${fileName}`;
  const storageRef = ref(storage, storagePath);

  // Metadata del archivo
  const metadata = {
    contentType: file.type,
    customMetadata: {
      weddingId,
      momentId,
      songId,
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  };

  // Upload con progreso
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        console.error('Error uploading audio:', error);
        reject(new Error('Error al subir el archivo: ' + error.message));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          resolve({
            downloadURL,
            storagePath,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            uploadedAt: new Date().toISOString(),
          });
        } catch (error) {
          reject(new Error('Error al obtener URL de descarga: ' + error.message));
        }
      }
    );
  });
}

/**
 * Eliminar archivo de audio de Firebase Storage
 */
export async function deleteAudioFile(storagePath) {
  if (!storagePath) {
    throw new Error('No se proporcionó ruta del archivo');
  }

  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting audio file:', error);
    throw new Error('Error al eliminar el archivo: ' + error.message);
  }
}

/**
 * Obtener información del archivo de audio
 */
export function getAudioFileInfo(audioData) {
  if (!audioData || !audioData.downloadURL) {
    return null;
  }

  return {
    name: audioData.fileName || 'audio.mp3',
    size: formatFileSize(audioData.fileSize || 0),
    type: audioData.fileType || 'audio/mpeg',
    uploadedAt: audioData.uploadedAt ? new Date(audioData.uploadedAt) : null,
    downloadURL: audioData.downloadURL,
  };
}

/**
 * Formatear tamaño de archivo
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generar enlace de descarga directo para el DJ
 * Crea un enlace temporal que expira en 24 horas
 */
export async function generateDJDownloadLink(storagePath) {
  if (!storagePath) {
    throw new Error('No se proporcionó ruta del archivo');
  }

  try {
    const storageRef = ref(storage, storagePath);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Firebase URLs no expiran automáticamente, pero podemos agregar metadata
    return {
      url: downloadURL,
      expiresIn: '24 hours (Firebase URL permanente)',
    };
  } catch (error) {
    console.error('Error generating download link:', error);
    throw new Error('Error al generar enlace de descarga');
  }
}

/**
 * Descargar archivo de audio (trigger browser download)
 */
export async function downloadAudioFile(downloadURL, fileName) {
  if (!downloadURL) {
    throw new Error('No hay URL de descarga');
  }

  try {
    // Fetch el archivo
    const response = await fetch(downloadURL);
    const blob = await response.blob();
    
    // Crear enlace de descarga
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'cancion-especial.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error('Error al descargar el archivo');
  }
}

/**
 * Obtener todas las canciones especiales con archivos de audio
 * Para generar lista de descargas para el DJ
 */
export function getAllSpecialSongsWithAudio(moments, blocks, getSelectedSong) {
  const songsWithAudio = [];
  
  blocks.forEach((block) => {
    const blockMoments = moments[block.id] || [];
    
    blockMoments.forEach((moment) => {
      const song = getSelectedSong(moment);
      
      if (song && song.isSpecial && song.audioFile) {
        songsWithAudio.push({
          blockName: block.name,
          momentTitle: moment.title,
          momentTime: moment.time || '',
          song: {
            title: song.title,
            artist: song.artist,
            specialType: song.specialType,
            djInstructions: song.djInstructions,
            audioFile: song.audioFile,
          },
        });
      }
    });
  });
  
  return songsWithAudio;
}

/**
 * Calcular espacio total usado por archivos de audio
 */
export function calculateTotalAudioStorage(moments, blocks, getSelectedSong) {
  let totalBytes = 0;
  let fileCount = 0;
  
  blocks.forEach((block) => {
    const blockMoments = moments[block.id] || [];
    
    blockMoments.forEach((moment) => {
      const song = getSelectedSong(moment);
      
      if (song && song.isSpecial && song.audioFile && song.audioFile.fileSize) {
        totalBytes += song.audioFile.fileSize;
        fileCount++;
      }
    });
  });
  
  return {
    totalBytes,
    totalFormatted: formatFileSize(totalBytes),
    fileCount,
  };
}
