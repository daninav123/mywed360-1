import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar } from 'lucide-react';
import { get as apiGet } from '../../services/apiClient';
import { useWedding } from '../../context/WeddingContext';

// Calendario: Suscripción iCal/ICS sin OAuth ni API de Google
const CalendarSync = () => {
  const [feed, setFeed] = useState(null);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const { activeWedding } = useWedding();

  const handleGetFeed = async () => {
    try {
      setLoadingFeed(true);
      setError(null);
      const qs = activeWedding ? `?weddingId=${encodeURIComponent(activeWedding)}` : '';
      const res = await apiGet(`/api/calendar/token${qs}`, { auth: true });
      if (!res.ok) {
        if (res.status === 401) throw new Error('Debes iniciar sesión para generar tu enlace de calendario');
        const txt = await res.text().catch(() => '');
        throw new Error(`No se pudo obtener el enlace (${res.status}). ${txt || ''}`.trim());
      }
      const data = await res.json();
      if (data?.ok) setFeed(data);
    } catch (e) {
      console.error('calendar token error', e);
      setError(e?.message || 'No se pudo obtener el enlace. Inténtalo de nuevo.');
      setFeed(null);
    } finally {
      setLoadingFeed(false);
    }
  };

  const webcalUrl = feed?.webcalUrl || (feed?.feedUrl ? feed.feedUrl.replace(/^https?:\/\//, 'webcal://') : '');
  const googleUrl = feed?.feedUrl ? `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(feed.feedUrl)}` : '';

  const Modal = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-lg w-full max-w-md p-6 shadow-lg" onClick={(e)=>e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-3">Añadir a tu Calendario</h3>
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        {loadingFeed && !feed ? (
          <div className="text-sm text-gray-600">Preparando tu enlace de suscripción...</div>
        ) : (
          <div className="space-y-3">
            <a className="block w-full text-center px-4 py-2 rounded bg-blue-600 text-white" href={webcalUrl} onClick={()=>setOpen(false)}>
              Suscribirse (Apple/Outlook)
            </a>
            <a className="block w-full text-center px-4 py-2 rounded bg-green-600 text-white" href={googleUrl} target="_blank" rel="noreferrer" onClick={()=>setOpen(false)}>
              Añadir a Google Calendar
            </a>
            {feed?.feedUrl && (
              <div className="text-xs text-gray-700 border rounded p-2 break-all">
                <div className="font-medium mb-1">URL de suscripción (ICS)</div>
                <div className="mb-2">{feed.feedUrl}</div>
                <button className="px-3 py-1 rounded border text-xs" onClick={() => navigator.clipboard.writeText(feed.feedUrl)}>Copiar URL</button>
              </div>
            )}
            <div className="text-xs text-gray-500">Tras suscribirte, las actualizaciones pueden tardar unos minutos según la app.</div>
          </div>
        )}
        <div className="mt-4 text-right">
          <button className="px-3 py-1 rounded bg-gray-200" onClick={()=>setOpen(false)}>Cerrar</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="my-2">
      <button
        className="inline-flex items-center px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 border"
        onClick={async () => { if (!feed) await handleGetFeed(); setOpen(true); }}
        disabled={loadingFeed}
      >
        <Calendar size={18} className="mr-2 text-blue-600" /> Añadir a tu Calendario
      </button>
      {open && (typeof document !== 'undefined' ? createPortal(<Modal />, document.body) : <Modal />)}
    </div>
  );
};

export default CalendarSync;
