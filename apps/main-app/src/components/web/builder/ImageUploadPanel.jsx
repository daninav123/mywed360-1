import React, { useState } from 'react';

/**
 * ImageUploadPanel - Panel para subir imágenes
 */
const ImageUploadPanel = ({ onImageUpload, isLoading = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFiles(files);
    }
  };

  const handleChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFiles(files);
    }
  };

  const handleFiles = async (files) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten imágenes');
        continue;
      }

      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede superar 5MB');
        continue;
      }

      // Simular progreso
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + Math.random() * 30;
        });
      }, 200);

      // Convertir a base64 (para demo)
      const reader = new FileReader();
      reader.onload = (e) => {
        clearInterval(interval);
        setUploadProgress(100);

        // Llamar callback
        if (onImageUpload) {
          onImageUpload({
            url: e.target.result,
            name: file.name,
            size: file.size,
            type: file.type,
          });
        }

        // Reset
        setTimeout(() => {
          setUploadProgress(0);
        }, 1000);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">📸 Subir Imágenes</h3>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-3 border-dashed rounded-lg p-8 text-center
          transition-all cursor-pointer
          ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-500'
          }
        `}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          disabled={isLoading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {uploadProgress > 0 && uploadProgress < 100 ? (
          <div>
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-gray-700 font-semibold mb-3">Subiendo...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">{Math.round(uploadProgress)}%</p>
          </div>
        ) : uploadProgress === 100 ? (
          <div>
            <div className="text-4xl mb-3">✅</div>
            <p className="text-green-600 font-semibold">¡Imagen subida!</p>
          </div>
        ) : (
          <div>
            <div className="text-5xl mb-3">🖼️</div>
            <p className="text-gray-700 font-semibold mb-2">Arrastra imágenes aquí o haz click</p>
            <p className="text-sm text-gray-600">Formatos: JPG, PNG, GIF (máx 5MB)</p>
          </div>
        )}
      </div>

      {/* Información */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
        <p className="font-semibold mb-2">💡 Consejos:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Usa imágenes de alta calidad (mínimo 1200x800px)</li>
          <li>Formatos recomendados: JPG o PNG</li>
          <li>Tamaño máximo: 5MB por imagen</li>
          <li>Puedes subir múltiples imágenes a la vez</li>
        </ul>
      </div>

      {/* Opciones de URL */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="font-semibold text-gray-900 mb-4">🔗 O usa una URL directa</p>
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://ejemplo.com/imagen.jpg"
            className="
              flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg
              focus:border-blue-500 focus:outline-none
            "
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.target.value) {
                onImageUpload?.({
                  url: e.target.value,
                  name: 'URL Image',
                  type: 'url',
                });
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={(e) => {
              const input = e.target.previousElementSibling;
              if (input.value) {
                onImageUpload?.({
                  url: input.value,
                  name: 'URL Image',
                  type: 'url',
                });
                input.value = '';
              }
            }}
            className="
              px-6 py-2 bg-blue-500 text-white rounded-lg
              hover:bg-blue-600 transition-colors font-semibold
            "
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadPanel;
