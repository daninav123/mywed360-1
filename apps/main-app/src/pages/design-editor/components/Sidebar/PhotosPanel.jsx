import React, { useRef } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

export default function PhotosPanel({ onAdd }) {
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      onAdd({
        type: 'image',
        url: event.target.result,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">Fotos</h3>
        <p className="text-xs text-gray-600">
          Sube tus propias fotos para personalizar el diseño
        </p>
      </div>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-3 hover:border-blue-500 hover:bg-blue-50 transition-all group"
      >
        <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-600" />
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900">Subir foto</div>
          <div className="text-xs text-gray-500">PNG, JPG hasta 10MB</div>
        </div>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-600 mb-2">Sugerencias</div>
        <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
          <li>Usa imágenes de alta resolución (300 DPI)</li>
          <li>Formatos recomendados: PNG o JPG</li>
          <li>Asegúrate de tener derechos de uso</li>
        </ul>
      </div>
    </div>
  );
}
