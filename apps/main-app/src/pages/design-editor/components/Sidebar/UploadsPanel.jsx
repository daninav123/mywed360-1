import React from 'react';
import { FolderOpen } from 'lucide-react';

export default function UploadsPanel({ onAdd }) {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold " className="text-body">Mis Subidas</h3>
        <p className="text-xs " className="text-secondary">
          Tus elementos y fotos guardados
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FolderOpen className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-sm  mb-2" className="text-muted">Aún no has subido nada</p>
        <p className="text-xs " className="text-muted">
          Los elementos que subas aparecerán aquí
        </p>
      </div>
    </div>
  );
}
