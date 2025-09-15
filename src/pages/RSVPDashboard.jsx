import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { post as apiPost } from '../services/apiClient';
import { useWedding } from '../context/WeddingContext';
import { evaluateTrigger } from '../services/AutomationRulesService';
import { addNotification } from '../services/notificationService';

export default function RSVPDashboard() {
  const { activeWedding } = useWedding();
  const [stats, setStats] = useState(null);
  const [pendingGuests, setPendingGuests] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!activeWedding) return;
    const ref = doc(db, 'weddings', activeWedding, 'rsvp', 'stats');
    const unsub = onSnapshot(ref, (snap) => {
      setStats(snap.exists() ? snap.data() : null);
    });
    return unsub;
  }, [activeWedding]);

  // Cargar lista de pendientes (mejor en vivo con onSnapshot)
  useEffect(() => {
    if (!activeWedding) return;
    setLoadingPending(true);
    const q = query(collection(db, 'weddings', activeWedding, 'guests'));
    const unsub = onSnapshot(q, (snap) => {
      try {
        const items = [];
        snap.forEach(d => {
          const g = d.data() || {};
          const s = String(g.status || '').toLowerCase();
          const isPending = (!s || s === 'pending') && !(s === 'confirmed' || s === 'accepted') && !(s === 'declined' || s === 'rejected');
          if (isPending) items.push({ id: d.id, ...g });
        });
        setPendingGuests(items);
      } finally {
        setLoadingPending(false);
      }
    }, () => setLoadingPending(false));
    return () => unsub();
  }, [activeWedding]);

  // Evaluación discreta de reglas de automatización para RSVP (sin cambios visuales)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!activeWedding) return;
        if (!stats || !stats.deadline) return;
        const resp = await evaluateTrigger(activeWedding, { type: 'rsvp_deadline', deadline: stats.deadline });
        const actions = Array.isArray(resp?.actions) ? resp.actions : [];
        for (const a of actions) {
          if (cancelled) break;
          if (a.type === 'send_notification' && a.template === 'rsvp_reminder') {
            // Crear notificación persistente (no altera diseño)
            await addNotification({
              type: 'info',
              message: 'Recordatorio RSVP: la fecha límite está próxima',
              action: 'viewRSVP'
            });
          }
        }
      } catch (_) {
        // best-effort
      }
    })();
    return () => { cancelled = true; };
  }, [activeWedding, stats?.deadline]);

  if (!activeWedding) {
    return <div className="p-6">Selecciona una boda para ver el dashboard de RSVP.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard de RSVP</h1>
      {!stats ? (
        <div className="text-gray-600">Sin datos de respuestas todavía.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="border rounded p-4 bg-white">
              <div className="text-sm text-gray-500">Invitaciones</div>
              <div className="text-2xl font-bold">{stats.totalInvitations || 0}</div>
            </div>
            <div className="border rounded p-4 bg-white">
              <div className="text-sm text-gray-500">Respuestas</div>
              <div className="text-2xl font-bold">{stats.totalResponses || 0}</div>
            </div>
            <div className="border rounded p-4 bg-white">
              <div className="text-sm text-gray-500">Asistentes Confirmados</div>
              <div className="text-2xl font-bold">{stats.confirmedAttendees || 0}</div>
            </div>
            <div className="border rounded p-4 bg-white">
              <div className="text-sm text-gray-500">Rechazadas</div>
              <div className="text-2xl font-bold">{stats.declinedInvitations || 0}</div>
            </div>
            <div className="border rounded p-4 bg-white">
              <div className="text-sm text-gray-500">Pendientes</div>
              <div className="text-2xl font-bold">{stats.pendingResponses || 0}</div>
            </div>
          </div>

          {stats.dietaryRestrictions && (
            <div className="border rounded p-4 bg-white">
              <h2 className="font-semibold mb-3">Restricciones dietéticas</h2>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Vegetarianos: {stats.dietaryRestrictions.vegetarian || 0}</li>
                <li>Veganos: {stats.dietaryRestrictions.vegan || 0}</li>
                <li>Sin gluten: {stats.dietaryRestrictions.glutenFree || 0}</li>
                <li>Intolerantes a lactosa: {stats.dietaryRestrictions.lactoseIntolerant || 0}</li>
              </ul>
            </div>
          )}

          {/* Pendientes y Recordatorios */}
          <div className="border rounded p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Pendientes de responder</h2>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 border rounded text-sm"
                  disabled={!activeWedding || sending}
                  onClick={async () => {
                    if (!activeWedding) return;
                    setSending(true);
                    try {
                      const res = await apiPost('/api/rsvp/reminders', { weddingId: activeWedding, dryRun: true }, { auth: true });
                      const json = await res.json().catch(()=>({}));
                      alert(`Simulación: candidatos=${json.attempted || 0}, enviados=${json.sent || 0}, omitidos=${json.skipped || 0}`);
                    } catch (e) {
                      alert('Error simulando recordatorios');
                    } finally { setSending(false); }
                  }}
                >Simular recordatorios</button>
                <button
                  className="px-3 py-1 border rounded bg-blue-600 text-white text-sm"
                  disabled={!activeWedding || sending}
                  onClick={async () => {
                    if (!activeWedding) return;
                    const ok = window.confirm('¿Enviar recordatorios por email a pendientes?');
                    if (!ok) return;
                    setSending(true);
                    try {
                      const res = await apiPost('/api/rsvp/reminders', { weddingId: activeWedding, dryRun: false }, { auth: true });
                      const json = await res.json().catch(()=>({}));
                      alert(`Envío: candidatos=${json.attempted || 0}, enviados=${json.sent || 0}, omitidos=${json.skipped || 0}`);
                    } catch (e) {
                      alert('Error enviando recordatorios');
                    } finally { setSending(false); }
                  }}
                >Enviar recordatorios</button>
              </div>
            </div>
            {loadingPending ? (
              <div className="text-gray-600">Cargando pendientes…</div>
            ) : pendingGuests.length === 0 ? (
              <div className="text-gray-600">Sin pendientes ahora mismo.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Nombre</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Teléfono</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingGuests.map(g => (
                      <tr key={g.id} className="border-t">
                        <td className="px-3 py-2">{g.name || '-'}</td>
                        <td className="px-3 py-2">{g.email || '-'}</td>
                        <td className="px-3 py-2">{g.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
