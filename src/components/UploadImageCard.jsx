import React, { useState, useRef } from 'react';
import Card from './ui/Card';
import { Trash2, UploadCloud } from 'lucide-react';

/**
 * Componente reutilizable para subir y previsualizar una imagen.
 * Props:
 * - title: string -> título mostrado arriba
 * - storageKey: string -> clave para persistir en localStorage
 */
export default function UploadImageCard({ title, storageKey }) {
  const [imageData, setImageData] = useState(() => localStorage.getItem(storageKey) || null);
  const fileRef = useRef();

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target.result;
      setImageData(base64);
      localStorage.setItem(storageKey, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setImageData(null);
    localStorage.removeItem(storageKey);
  };

  return (
    <Card className="p-4 space-y-4 flex flex-col items-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      {imageData ? (
        <>
          <img src={imageData} alt={title} className="max-h-40 object-contain border rounded" />
          <button onClick={handleRemove} className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded">
            <Trash2 size={16} /> Eliminar
          </button>
        </>
      ) : (
        <>
          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            onChange={handleChange}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded"
          >
            <UploadCloud size={18} /> Subir imagen
          </button>
        </>
      )}
    </Card>
  );
}
