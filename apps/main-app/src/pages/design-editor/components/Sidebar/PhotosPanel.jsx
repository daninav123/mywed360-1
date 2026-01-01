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
        <h3 className="text-sm font-semibold " style={{ color: 'var(--color-text)' }}>Fotos</h3>
        <p className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>
          Sube tus propias fotos para personalizar el diseño
        </p>
      </div>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full aspect-square border-2 border-dashed  rounded-lg flex flex-col items-center justify-center gap-3 hover:border-blue-500 hover:bg-blue-50 transition-all group" style={{ borderColor: 'var(--color-border)' }}
      >
        <Upload className="w-8 h-8  group-hover:" style={{ color: 'var(--color-primary)' }} style={{ color: 'var(--color-muted)' }} />
        <div className="text-center">
          <div className="text-sm font-medium " style={{ color: 'var(--color-text)' }}>Subir foto</div>
          <div className="text-xs " style={{ color: 'var(--color-muted)' }}>PNG, JPG hasta 10MB</div>
        </div>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="pt-4 border-t " style={{ borderColor: 'var(--color-border)' }}>
        <div className="text-xs  mb-2" style={{ color: 'var(--color-text-secondary)' }}>Sugerencias</div>
        <ul className="text-xs  space-y-1 list-disc list-inside" style={{ color: 'var(--color-muted)' }}>
          <li>Usa imágenes de alta resolución (300 DPI)</li>
          <li>Formatos recomendados: PNG o JPG</li>
          <li>Asegúrate de tener derechos de uso</li>
        </ul>
      </div>
    </div>
  );
}
