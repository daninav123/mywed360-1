import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebaseConfig';
import { toast } from 'react-toastify';
import { Upload, X, Loader2 } from 'lucide-react';

/**
 * Componente reutilizable para subir imágenes a Firebase Storage
 */
export const ImageUploader = ({
  currentImageUrl = null,
  storagePath,
  onUploadSuccess,
  onDelete,
  label = 'Imagen',
  maxSizeMB = 5,
  aspectRatio = null,
  accept = 'image/*',
}) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      toast.error(`La imagen no puede superar ${maxSizeMB}MB (actual: ${sizeMB.toFixed(1)}MB)`);
      return;
    }

    try {
      setUploading(true);

      // Crear referencia única
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const extension = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomStr}.${extension}`;
      const storageRef = ref(storage, `${storagePath}/${fileName}`);

      // Subir archivo
      await uploadBytes(storageRef, file);

      // Obtener URL
      const downloadURL = await getDownloadURL(storageRef);

      // Callback de éxito
      if (onUploadSuccess) {
        await onUploadSuccess(downloadURL, fileName);
      }

      toast.success('Imagen subida correctamente');
    } catch (error) {
      console.error('Error al subir imagen:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDelete = async () => {
    if (!currentImageUrl) return;

    const confirmDelete = window.confirm('¿Estás seguro de eliminar esta imagen?');
    if (!confirmDelete) return;

    try {
      setDeleting(true);

      // Intentar eliminar de Storage (puede fallar si la URL es externa)
      try {
        const imageRef = ref(storage, currentImageUrl);
        await deleteObject(imageRef);
      } catch (storageError) {
        console.warn('No se pudo eliminar de Storage (puede ser URL externa):', storageError);
      }

      // Callback de eliminación
      if (onDelete) {
        await onDelete();
      }

      toast.success('Imagen eliminada');
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      toast.error('Error al eliminar la imagen');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {/* Vista previa */}
      {currentImageUrl && (
        <div className="relative inline-block">
          <img
            src={currentImageUrl}
            alt={label}
            className={`max-w-full h-auto rounded-lg border-2 border-gray-200 ${
              aspectRatio === '16:9'
                ? 'max-h-48'
                : aspectRatio === 'square'
                  ? 'w-48 h-48 object-cover'
                  : 'max-h-64'
            }`}
          />
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Input de archivo */}
      <div className="flex items-center gap-3">
        <label className="cursor-pointer">
          <div
            className={`
            flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed
            transition-colors
            ${
              uploading
                ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                : 'bg-white border-blue-300 hover:border-blue-500 hover:bg-blue-50'
            }
          `}
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">Subiendo...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">
                  {currentImageUrl ? 'Cambiar imagen' : 'Subir imagen'}
                </span>
              </>
            )}
          </div>
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {!currentImageUrl && <span className="text-xs text-gray-500">Máx. {maxSizeMB}MB</span>}
      </div>

      {/* Hint sobre ratio */}
      {aspectRatio && (
        <p className="text-xs text-gray-500">
          💡 Recomendado: {aspectRatio === '16:9' ? 'Horizontal (1920x1080)' : 'Cuadrada (1:1)'}
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
