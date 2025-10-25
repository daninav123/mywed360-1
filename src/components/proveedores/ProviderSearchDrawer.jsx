import { X, Search } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslations } from '../../hooks/useTranslations';

export default function ProviderSearchDrawer({

 open, onClose, onBuscar, onGuardar, resultado, cargando }) {
  const { t } = useTranslations();

  const [query, setQuery] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-[420px] bg-white border-l shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="font-medium">Búsqueda IA de proveedores</div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" title="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="p-3 border-b flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (typeof onBuscar === 'function') onBuscar(query);
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('common.fotografia_madrid_2000')}
              className="w-full pl-8 pr-3 py-2 border rounded text-sm"
            />
          </div>
          <button type="submit" className="px-3 py-2 text-sm border rounded hover:bg-gray-50">Buscar</button>
        </form>

        <div className="p-3 flex-1 overflow-y-auto">
          {cargando && <div className="text-sm text-gray-500">Buscando…</div>}
          {!cargando && !resultado && <div className="text-sm text-gray-500">Introduce una consulta y pulsa Buscar.</div>}
          {!cargando && resultado && (
            <div className="space-y-2">
              <div className="text-lg font-semibold">{resultado.nombre}</div>
              <div className="text-sm text-gray-600">{resultado.servicio} • {resultado.ubicacion}</div>
              {resultado.descripcion && <p className="text-sm text-gray-700">{resultado.descripcion}</p>}
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {resultado.web && <a className="px-2 py-1 border rounded hover:bg-gray-50" href={resultado.web} target="_blank" rel="noreferrer">Web</a>}
                {resultado.email && <span className="px-2 py-1 border rounded">{resultado.email}</span>}
                {resultado.telefono && <span className="px-2 py-1 border rounded">{resultado.telefono}</span>}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t flex items-center justify-end gap-2">
          <button className="px-3 py-2 text-sm border rounded hover:bg-gray-50" onClick={onClose}>Cerrar</button>
          <button
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={!resultado}
            onClick={() => typeof onGuardar === 'function' && onGuardar(resultado)}
          >
            Guardar proveedor
          </button>
        </div>
      </div>
    </div>
  );
}
