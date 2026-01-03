import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import { useWeddingDataContext } from '../../../context/WeddingDataContext';
import { uploadImage } from '../../../services/imageUploadService';

/**
 * CraftPhotoGallerySection - Photo Gallery adaptado para Craft.js
 */
export const CraftPhotoGallerySection = ({ titulo, foto1, foto2, foto3, foto4, foto5, foto6 }) => {
  const weddingData = useWeddingDataContext();
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  // Usar fotos individuales si existen, sino usar galería de weddingData
  const fotosIndividuales = [foto1, foto2, foto3, foto4, foto5, foto6].filter(Boolean);
  const fotosGaleria = weddingData?.gallery || [];
  const fotos = fotosIndividuales.length > 0 ? fotosIndividuales : fotosGaleria;

  return (
    <section
      ref={(ref) => connect(drag(ref))}
      className={`
        py-16 px-4
        ${selected ? 'ring-4 ring-blue-500' : ''}
      `}
      style={{ backgroundColor: 'var(--color-fondo)' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Título */}
        <h2
          className="text-4xl font-bold mb-12 text-center"
          style={{
            fontFamily: 'var(--fuente-titulo)',
            color: 'var(--color-primario)',
          }}
        >
          {titulo}
        </h2>

        {/* Galería */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fotos.length > 0 ? (
            fotos.map((foto, idx) => (
              <div
                key={idx}
                className="
                  aspect-square bg-gray-200 rounded-lg overflow-hidden
                  shadow-md hover:shadow-lg transition-shadow
                  cursor-pointer
                "
              >
                <img
                  src={foto}
                  alt={`Foto ${idx + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">📸</div>
              <p>Añade fotos en el panel de la derecha</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/**
 * Settings para CraftPhotoGallerySection
 */
export const CraftPhotoGallerySettings = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  const [uploading, setUploading] = useState({});

  const handleFileUpload = async (num, file) => {
    if (!file) return;

    try {
      setUploading((prev) => ({ ...prev, [num]: true }));

      // Subir a Firebase Storage
      const url = await uploadImage(file, 'web-galleries');

      // Actualizar prop con la URL
      setProp((props) => (props[`foto${num}`] = url));

      setUploading((prev) => ({ ...prev, [num]: false }));
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      alert('Error al subir la imagen: ' + error.message);
      setUploading((prev) => ({ ...prev, [num]: false }));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Título</label>
        <input
          type="text"
          value={props.titulo}
          onChange={(e) => setProp((props) => (props.titulo = e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold text-gray-900 mb-3">📸 Fotos de la Galería</h4>
        <p className="text-xs text-gray-500 mb-3">
          💡 Añade hasta 6 fotos. Sube archivos o pega URLs directamente.
        </p>

        {[1, 2, 3, 4, 5, 6].map((num) => (
          <div key={num} className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-xs font-medium text-gray-700 mb-2">Foto {num}</label>

            {/* Botón de subida */}
            <div className="mb-2">
              <input
                type="file"
                accept="image/*"
                id={`file-upload-${num}`}
                className="hidden"
                onChange={(e) => handleFileUpload(num, e.target.files[0])}
                disabled={uploading[num]}
              />
              <label
                htmlFor={`file-upload-${num}`}
                className={`
                  inline-block px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all
                  ${
                    uploading[num]
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }
                `}
              >
                {uploading[num] ? '⏳ Subiendo...' : '📤 Subir Imagen'}
              </label>
            </div>

            {/* Input de URL manual */}
            <div className="text-xs text-gray-500 mb-1">o pega una URL:</div>
            <input
              type="url"
              value={props[`foto${num}`] || ''}
              onChange={(e) => setProp((props) => (props[`foto${num}`] = e.target.value))}
              placeholder="https://ejemplo.com/foto.jpg"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Preview */}
            {props[`foto${num}`] && (
              <div className="mt-2 relative">
                <img
                  src={props[`foto${num}`]}
                  alt={`Preview ${num}`}
                  className="w-full h-24 object-cover rounded border border-gray-300"
                  onError={(e) => {
                    e.target.src =
                      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23ddd"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Error</text></svg>';
                  }}
                />
                <button
                  onClick={() => setProp((props) => (props[`foto${num}`] = null))}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-xs"
                  title="Eliminar foto"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
        <strong>💡 Tip:</strong> Las imágenes subidas se guardan en Firebase Storage. Tamaño máximo:
        5MB. Formatos soportados: JPG, PNG, GIF, WebP.
      </div>
    </div>
  );
};

// Configuración de Craft.js
CraftPhotoGallerySection.craft = {
  props: {
    titulo: '📸 Nuestra Galería',
    foto1: null,
    foto2: null,
    foto3: null,
    foto4: null,
    foto5: null,
    foto6: null,
  },
  related: {
    settings: CraftPhotoGallerySettings,
  },
  displayName: 'Photo Gallery Section',
};
