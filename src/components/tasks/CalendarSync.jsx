import React, { useState } from 'react';
import { Button, Spinner } from '../../components/ui';
import { Calendar } from 'lucide-react';
import { get as apiGet } from '../../services/apiClient';

// Calendario: Suscripción iCal/ICS sin OAuth ni API de Google
const CalendarSync = () => {
  const [feed, setFeed] = useState(null);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [error, setError] = useState(null);
  const [showWebcalHelp, setShowWebcalHelp] = useState(false);

  const handleGetFeed = async () => {
    try {
      setLoadingFeed(true);
      setError(null);
      const res = await apiGet('/api/calendar/token', { auth: true });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Debes iniciar sesión para generar tu enlace de calendario');
        }
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

  const handleWebcalSubscribe = (e) => {
    if (!feed) return;
    e.preventDefault();
    setShowWebcalHelp(false);
    const url = feed.webcalUrl || String(feed.feedUrl || '').replace(/^https?:\/\//, 'webcal://');
    try {
      // Intentar abrir el esquema webcal
      window.location.assign(url);
    } catch (_) {}
    // Si no se lanza ningún gestor, mostramos ayuda tras un pequeño retraso
    window.setTimeout(() => setShowWebcalHelp(true), 1500);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 my-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold flex items-center">
          <Calendar size={20} className="mr-2 text-blue-500" />
          Añadir a tu Calendario
        </h3>
        <Button size="xs" variant="secondary" onClick={handleGetFeed} disabled={loadingFeed}>
          {feed ? 'Actualizar enlace' : 'Obtener enlace'}
          {loadingFeed && <Spinner size="sm" className="ml-2" />}
        </Button>
      </div>
      {error && (
        <div className="text-sm text-red-600 mb-2">{error}</div>
      )}
      {!feed ? (
        <p className="text-xs text-gray-600">Pulsa “Obtener enlace” para suscribirte mediante iCal/ICS sin permisos adicionales.</p>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <a
              className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
              href={feed.webcalUrl}
              onClick={handleWebcalSubscribe}
              title="Suscribirse (Apple Calendar, iOS, macOS, Outlook)"
            >
              Suscribirse (Apple/Outlook)
            </a>
            <a
              className="px-3 py-1 rounded bg-green-600 text-white text-sm"
              href={`https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(feed.feedUrl)}`}
              target="_blank" rel="noreferrer"
            >
              Añadir a Google Calendar
            </a>
            <button
              className="px-3 py-1 rounded border text-sm"
              onClick={() => navigator.clipboard.writeText(feed.feedUrl)}
            >
              Copiar URL de suscripción
            </button>
            <a
              className="px-3 py-1 rounded border text-sm"
              href={feed.feedUrl}
              target="_blank" rel="noreferrer"
            >
              Abrir versión HTTPS (descarga)
            </a>
          </div>
          {showWebcalHelp && (
            <div className="text-xs text-gray-700 bg-yellow-50 border border-yellow-200 rounded p-2">
              <div className="font-medium mb-1">¿No se abrió tu app de calendario?</div>
              <ul className="list-disc ml-4 space-y-1">
                <li>Google Calendar (web): usa el botón “Añadir a Google Calendar”.</li>
                <li>Apple/Outlook/otros: copia la “URL de suscripción” y añade un calendario por URL en tu app.</li>
                <li>Como alternativa, usa “Abrir versión HTTPS (descarga)” para importar una instantánea (.ics).</li>
              </ul>
              <div className="mt-2"><button className="underline" onClick={() => setShowWebcalHelp(false)}>Ocultar ayuda</button></div>
            </div>
          )}
          <div className="text-xs text-gray-500">
            Si el botón “Suscribirse” no se abre, copia la “URL de suscripción” y pégala en tu app de calendario en “Añadir calendario por URL”. En Google Calendar funciona con ese enlace.
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarSync;
