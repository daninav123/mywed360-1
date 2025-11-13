import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import useTranslations from '../hooks/useTranslations';
import { useWedding } from '../context/WeddingContext';
import { db } from '../firebaseConfig';
import { post as apiPost } from '../services/apiClient';
import { evaluateTrigger } from '../services/AutomationRulesService';
import { addNotification } from '../services/notificationService';

const formatTimestamp = (value) => {
  if (!value) return '';
  try {
    if (typeof value.toDate === 'function') {
      return value.toDate().toLocaleString();
    }
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
};

const percentageOf = (count, total) => {
  if (!total || total <= 0) return 0;
  return Math.round((count / total) * 100);
};

export default function RSVPDashboard() {
  const { token } = useParams();
  const { t } = useTranslations();
  const { activeWedding } = useWedding();
  const [stats, setStats] = useState(null);
  const [pendingGuests, setPendingGuests] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [sending, setSending] = useState(false);
  const [reminderLog, setReminderLog] = useState([]);

  useEffect(() => {
    if (!activeWedding) return;
    const ref = doc(db, 'weddings', activeWedding, 'rsvp', 'stats');
    const unsub = onSnapshot(ref, (snap) => {
      setStats(snap.exists() ?snap.data() : null);
    });
    return unsub;
  }, [activeWedding]);

  // Cargar lista de pendientes (mejor en vivo con onSnapshot)
  useEffect(() => {
    if (!activeWedding) return;
    setLoadingPending(true);
    const q = query(collection(db, 'weddings', activeWedding, 'guests'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        try {
          const items = [];
          snap.forEach((d) => {
            const g = d.data() || {};
            const s = String(g.status || '').toLowerCase();
            const isPending =
              (!s || s === 'pending') &&
              !(s === 'confirmed' || s === 'accepted') &&
              !(s === 'declined' || s === 'rejected');
            if (isPending) items.push({ id: d.id, ...g });
          });
          setPendingGuests(items);
        } finally {
          setLoadingPending(false);
        }
      },
      () => setLoadingPending(false)
    );
    return () => unsub();
  }, [activeWedding]);

  useEffect(() => {
    if (!activeWedding) return;
    try {
      const logsQuery = query(
        collection(db, 'weddings', activeWedding, 'rsvpLogs'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const unsub = onSnapshot(
        logsQuery,
        (snap) => {
          const entries = [];
          snap.forEach((docSnap) => {
            entries.push({ id: docSnap.id, ...(docSnap.data() || {}) });
          });
          setReminderLog(entries);
        },
        () => setReminderLog([])
      );
      return () => unsub();
    } catch (error) {
      // console.warn('[RSVPDashboard] reminderLog listener error', error);
    }
  }, [activeWedding]);

  // Evaluación discreta de reglas de automatización para RSVP (sin cambios visuales)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!activeWedding) return;
        if (!stats || !stats.deadline) return;
        const resp = await evaluateTrigger(activeWedding, {
          type: 'rsvp_deadline',
          deadline: stats.deadline,
        });
        const actions = Array.isArray(resp?.actions) ?resp.actions : [];
        for (const a of actions) {
          if (cancelled) break;
          if (a.type === 'send_notification' && a.template === 'rsvp_reminder') {
            // Crear notificación persistente (no altera diseño)
            await addNotification({
              type: 'info',
              message: 'Recordatorio RSVP: la fecha límite está próxima',
              action: 'viewRSVP',
              weddingId: activeWedding,
              category: 'rsvp',
              severity: 'medium',
              source: 'rsvp_dashboard',
              payload: {
                weddingId: activeWedding,
                kind: 'rsvp_deadline',
              },
            });
          }
        }
      } catch (_) {
        // best-effort
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeWedding, stats?.deadline]);

  const computedMetrics = React.useMemo(() => {
    if (!stats) {
      return {
        totalInvites: 0,
        responseRate: 0,
        confirmRate: 0,
        declineRate: 0,
        pendingRate: 0,
        avgMinutes: null,
      };
    }
    const totalInvites = stats.totalInvitations || 0;
    const totalResponses = stats.totalResponses || 0;
    const confirmed = stats.confirmedAttendees || 0;
    const declined = stats.declinedInvitations || 0;
    const responseRate = percentageOf(totalResponses, totalInvites);
    return {
      totalInvites,
      responseRate,
      confirmRate: percentageOf(confirmed, totalInvites),
      declineRate: percentageOf(declined, totalInvites),
      pendingRate: Math.max(0, 100 - responseRate),
      avgMinutes: stats.averageResponseMinutes ?? null,
    };
  }, [stats]);

  const channelBreakdown = React.useMemo(() => {
    if (!stats) return [];
    const channels = stats.responsesByChannel || stats.responsesBySource || null;
    if (!channels || typeof channels !== 'object') return [];
    return Object.entries(channels)
      .map(([channel, value]) => {
        const count =
          typeof value === 'number'
            ? value
            : value?.count ?? value?.total ?? value?.responses ?? 0;
        return {
          channel,
          count,
          rate: percentageOf(count, computedMetrics.totalInvites),
        };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [computedMetrics.totalInvites, stats]);

  const timelineData = React.useMemo(() => {
    const rawTimeline = Array.isArray(stats?.responseTimeline)
      ? stats.responseTimeline
      : Array.isArray(stats?.timeline)
      ? stats.timeline
      : [];
    return rawTimeline.slice(-7).map((entry, idx) => {
      const confirmed =
        entry.confirmed ??
        entry.accepted ??
        entry.confirmedCount ??
        entry.totalConfirmed ??
        0;
      const declines =
        entry.declined ??
        entry.rejected ??
        entry.declinedCount ??
        entry.totalDeclined ??
        0;
      const responses =
        entry.responses ??
        entry.totalResponses ??
        entry.total ??
        confirmed + declines;
      const label =
        entry.label ||
        entry.dateLabel ||
        entry.day ||
        entry.date ||
        `Día ${Math.max(1, rawTimeline.length - 6 + idx)}`;
      return {
        label,
        confirmed,
        responses,
        confirmedRate: percentageOf(confirmed, responses || computedMetrics.totalInvites),
      };
    });
  }, [computedMetrics.totalInvites, stats]);

  if (!activeWedding) {
    return <div className="p-6">Selecciona una boda para ver el dashboard de RSVP.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard de RSVP</h1>
      {!stats ?(
        <div className="text-gray-600">Sin datos de respuestas todavía.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="border rounded p-4 bg-surface">
              <div className="text-sm text-gray-500">Invitaciones</div>
              <div className="text-2xl font-bold">{stats.totalInvitations || 0}</div>
            </div>
            <div className="border rounded p-4 bg-surface">
              <div className="text-sm text-gray-500">Respuestas</div>
              <div className="text-2xl font-bold">{stats.totalResponses || 0}</div>
            </div>
            <div className="border rounded p-4 bg-surface">
              <div className="text-sm text-gray-500">Asistentes Confirmados</div>
              <div className="text-2xl font-bold">{stats.confirmedAttendees || 0}</div>
            </div>
            <div className="border rounded p-4 bg-surface">
              <div className="text-sm text-gray-500">Rechazadas</div>
              <div className="text-2xl font-bold">{stats.declinedInvitations || 0}</div>
            </div>
            <div className="border rounded p-4 bg-surface">
              <div className="text-sm text-gray-500">Pendientes</div>
              <div className="text-2xl font-bold">{stats.pendingResponses || 0}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="border rounded p-4 bg-surface">
              <h2 className="font-semibold mb-2">Embudo de respuestas</h2>
              <p className="text-sm text-gray-600">
                Tasa de respuesta:{' '}
                <span className="font-semibold text-gray-900">
                  {computedMetrics.responseRate}%
                </span>
              </p>
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${Math.min(computedMetrics.responseRate, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Confirmados {computedMetrics.confirmRate}%</span>
                <span>Pendientes {computedMetrics.pendingRate}%</span>
                <span>Rechazos {computedMetrics.declineRate}%</span>
              </div>
              {computedMetrics.avgMinutes != null && (
                <p className="text-xs text-gray-500 mt-3">
                  Tiempo medio de respuesta: {Math.round(computedMetrics.avgMinutes)} min
                </p>
              )}
            </div>

            <div className="border rounded p-4 bg-surface lg:col-span-2">
              <h2 className="font-semibold mb-2">Evolución últimos días</h2>
              {timelineData.length === 0 ? (
                <div className="text-sm text-gray-600">
                  Aún no hay suficientes datos históricos.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-3">
                  {timelineData.map((point) => (
                    <div key={point.label} className="flex flex-col items-center">
                      <div className="w-full h-24 bg-gray-100 rounded relative overflow-hidden">
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-green-500"
                          style={{ height: `${Math.min(point.confirmedRate, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-center">{point.label}</div>
                      <div className="text-xs font-medium text-gray-700">
                        {point.confirmed} confirmados
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border rounded p-4 bg-surface">
              <h2 className="font-semibold mb-2">Canales principales</h2>
              {channelBreakdown.length === 0 ? (
                <div className="text-sm text-gray-600">Sin datos por canal todavía.</div>
              ) : (
                <ul className="space-y-1 text-sm">
                  {channelBreakdown.map((item) => (
                    <li key={item.channel} className="flex justify-between">
                      <span className="capitalize text-gray-600">{item.channel}</span>
                      <span className="font-medium text-gray-900">
                        {item.count} ({item.rate}%)
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {stats.dietaryRestrictions && (
            <div className="border rounded p-4 bg-surface">
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
          <div className="border rounded p-4 bg-surface">
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
                      const res = await apiPost(
                        '/api/rsvp/reminders',
                        { weddingId: activeWedding, dryRun: true },
                        { auth: true }
                      );
                      const json = await res.json().catch(() => ({}));
                      toast.info(
                        t('rsvp.reminderSimulation', {
                          attempted: json.attempted || 0,
                          sent: json.sent || 0,
                          skipped: json.skipped || 0
                        })
                      );
                    } catch (e) {
                      toast.error(t('rsvp.reminderSimulationError'));
                    } finally {
                      setSending(false);
                    }
                  }}
                >
                  Simular recordatorios
                </button>
                <button
                  className="px-3 py-1 border rounded bg-blue-600 text-white text-sm"
                  disabled={!activeWedding || sending}
                  onClick={async () => {
                    if (!activeWedding) return;
                    const ok = window.confirm('¿Enviar recordatorios por email a pendientes?');
                    if (!ok) return;
                    setSending(true);
                    try {
                      const res = await apiPost(
                        '/api/rsvp/reminders',
                        { weddingId: activeWedding, dryRun: false },
                        { auth: true }
                      );
                      const json = await res.json().catch(() => ({}));
                      toast.success(
                        t('rsvp.reminderSent', {
                          attempted: json.attempted || 0,
                          sent: json.sent || 0,
                          skipped: json.skipped || 0
                        })
                      );
                    } catch (e) {
                      toast.error(t('rsvp.reminderSendError'));
                    } finally {
                      setSending(false);
                    }
                  }}
                >
                  Enviar recordatorios
                </button>
              </div>
            </div>
            {loadingPending ?(
              <div className="text-gray-600">Cargando pendientes…</div>
            ) : pendingGuests.length === 0 ?(
              <div className="text-gray-600">Sin pendientes ahora mismo.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Nombre</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Teléfono</th>
                      <th className="px-3 py-2 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingGuests.map((g) => (
                      <tr key={g.id} className="border-t">
                        <td className="px-3 py-2">{g.name || '-'}</td>
                        <td className="px-3 py-2">{g.email || '-'}</td>
                        <td className="px-3 py-2">{g.phone || '-'}</td>
                        <td className="px-3 py-2">
                          <button
                            className="px-2 py-1 border rounded"
                            onClick={async () => {
                              try {
                                const res = await apiPost(
                                  `/api/guests/${activeWedding}/id/${g.id}/rsvp-link`,
                                  {},
                                  { auth: true }
                                );
                                const json = await res.json().catch(() => ({}));
                                const link =
                                  json.link || `${window.location.origin}/rsvp/${json.token}`;
                                await navigator.clipboard.writeText(link);
                                toast.success(t('rsvp.linkCopied'));
                              } catch (e) {
                                // console.error(e);
                                toast.error(t('rsvp.linkCopyError'));
                              }
                            }}
                          >
                            Copiar link
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {reminderLog.length > 0 && (
              <div className="mt-4 border-t pt-3">
                <h3 className="text-sm font-semibold mb-2">Actividad reciente</h3>
                <ul className="space-y-1 text-sm">
                  {reminderLog.map((log) => {
                    const label = log.type || log.channel || log.kind || 'Recordatorio';
                    const count =
                      log.sent ?? log.success ?? log.count ?? log.attempted ?? log.total ?? 0;
                    return (
                      <li key={log.id} className="flex justify-between gap-2">
                        <span>
                          {label}{count ? ` · ${count}` : ''}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
