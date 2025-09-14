import React, { useEffect, useState } from 'react';
import { getMetrics } from '../../services/whatsappService';

export default function WhatsAppMetrics({ weddingId = '', from = '', to = '', groupBy = 'day' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getMetrics({ weddingId, from, to, groupBy });
        if (!ignore) setData(res);
      } catch (e) {
        if (!ignore) setError(e?.message || 'error');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [weddingId, from, to, groupBy]);

  if (loading) return <div className="p-4 text-sm text-gray-600">Cargando métricas…</div>;
  if (error) return <div className="p-4 text-sm text-red-600">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h3 className="font-semibold mb-2 text-sm">Métricas WhatsApp</h3>
      <div className="text-xs text-gray-700 space-y-1">
        <div>Total: {data.total || 0}</div>
        <div>Entrega: {Math.round(((data.rates?.deliveryRate) || 0) * 100)}%</div>
        <div>Lectura: {Math.round(((data.rates?.readRate) || 0) * 100)}%</div>
      </div>
      {Array.isArray(data.series) && data.series.length > 0 && (
        <div className="mt-3 overflow-auto">
          <table className="min-w-[420px] text-xs">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="px-2 py-1">Día</th>
                <th className="px-2 py-1">Total</th>
                <th className="px-2 py-1">Enviados</th>
                <th className="px-2 py-1">Entregados</th>
                <th className="px-2 py-1">Leídos</th>
                <th className="px-2 py-1">Errores</th>
              </tr>
            </thead>
            <tbody>
              {data.series.map((d) => (
                <tr key={d.day} className="odd:bg-white even:bg-gray-100">
                  <td className="px-2 py-1">{d.day}</td>
                  <td className="px-2 py-1">{d.total || 0}</td>
                  <td className="px-2 py-1">{d.sent || 0}</td>
                  <td className="px-2 py-1">{d.delivered || 0}</td>
                  <td className="px-2 py-1">{d.read || 0}</td>
                  <td className="px-2 py-1">{(d.failed || 0) + (d.error || 0) + (d.undelivered || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

