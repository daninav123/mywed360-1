import React, { useCallback, useState } from 'react';
import { toast } from 'react-toastify';

/**
 * DownloadBundle
 * Genera enlaces de descarga para las fotos aprobadas.
 */
export default function DownloadBundle({
  fetchLinks,
  className = '',
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('approved');

  const handleGenerate = useCallback(async () => {
    if (typeof fetchLinks !== 'function') return;
    setIsLoading(true);
    try {
      const links = await fetchLinks({ status: statusFilter });
      setItems(Array.isArray(links) ? links : []);
      toast.success(`Se generaron ${links?.length || 0} enlaces de descarga`);
    } catch (error) {
      // console.error('DownloadBundle error', error);
      toast.error('No se pudieron generar los enlaces de descarga');
    } finally {
      setIsLoading(false);
    }
  }, [fetchLinks, statusFilter]);

  const handleCopyList = useCallback(() => {
    if (!items.length) return;
    const text = items.map((item) => item.url).join('\n');
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success('Lista copiada al portapapeles'))
      .catch(() => toast.error('No se pudo copiar la lista'));
  }, [items]);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-4 ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Descargar momentos</h3>
          <p className="text-sm text-gray-500">
            Genera enlaces directos para descargar las fotos seleccionadas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700"
          >
            <option value="approved">Aprobadas</option>
            <option value="pending">Pendientes</option>
            <option value="rejected">Rechazadas</option>
            <option value="">Todas</option>
          </select>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium shadow hover:bg-blue-700 transition disabled:opacity-60"
          >
            {isLoading ? 'Generando…' : 'Generar enlaces'}
          </button>
        </div>
      </div>

      {items.length ? (
        <div className="border border-gray-100 rounded-md divide-y divide-gray-100 max-h-64 overflow-auto">
          {items.map((item) => (
            <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-sm">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-700 truncate">{item.filename || item.id}</p>
                <p className="text-xs text-gray-400">
                  {item.scene || 'Sin escena'} · {item.status || '—'}
                </p>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 text-xs hover:underline"
              >
                Abrir
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-gray-200 rounded-md p-6 text-center text-sm text-gray-500">
          Genera enlaces para listar las fotos disponibles.
        </div>
      )}

      <div className="flex items-center justify-end mt-3">
        <button
          type="button"
          onClick={handleCopyList}
          disabled={!items.length}
          className="text-xs px-3 py-2 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Copiar lista
        </button>
      </div>
    </div>
  );
}
