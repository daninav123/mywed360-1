import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

import { get as apiGet } from '../../services/apiClient';
import { getAdminFetchOptions } from '../../services/adminSession';
import { useTranslations } from '../../hooks/useTranslations';

const buildAdminApiOptions = (extra = {
  const { t } = useTranslations();
}) =>
  getAdminFetchOptions({ auth: false, silent: true, ...extra });

function UsersWithErrorsTable({ timeframe = 'day' }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const endpoint = import.meta.env.VITE_METRICS_ENDPOINT || '/api/admin/metrics';
        const res = await apiGet(
          `${endpoint}/errors/by-user?timeframe=${timeframe}`,
          buildAdminApiOptions({ silent: true })
        );
        if (!mounted) return;
        if (res?.ok) {
          const json = await res.json();
          setItems(json.items || []);
          setErr('');
        } else {
          setErr('No disponible');
        }
      } catch {
        if (mounted) setErr('No disponible');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [timeframe]);

  if (loading) return <div className="text-sm text-gray-500">Cargando usuarios...</div>;
  if (err) return <div className="text-sm text-red-600">{err}</div>;

  return (
    <div className="overflow-auto max-h-80 border rounded">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left py-2 px-3">Usuario</th>
            <th className="text-right py-2 px-3">Errores</th>
            <th className="text-left py-2 px-3">Fuentes</th>
            <th className="text-left py-2 px-3">Último</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r, i) => (
            <tr key={i} className="border-b">
              <td className="py-2 px-3">{r.user?.email || r.user?.uid || 'unknown'}</td>
              <td className="py-2 px-3 text-right">{r.count}</td>
              <td className="py-2 px-3">{(r.sources || []).join(', ')}</td>
              <td className="py-2 px-3">{new Date(r.lastTimestamp || Date.now()).toLocaleString()}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td className="py-2 px-3" colSpan={4}>Sin usuarios con errores recientes</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ErrorRateChart({ timeframe = 'day' }) {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const endpoint = import.meta.env.VITE_METRICS_ENDPOINT || '/api/admin/metrics';
        const res = await apiGet(
          `${endpoint}/errors?timeframe=${timeframe}&limit=2000`,
          buildAdminApiOptions({ silent: true })
        );
        if (!mounted) return;
        if (res?.ok) {
          const json = await res.json();
          setErrors(json.items || []);
        } else {
          setErrors([]);
        }
      } catch { setErrors([]); }
      finally { if (mounted) setLoading(false); }
    };
    load();
    return () => { mounted = false; };
  }, [timeframe]);

  const series = useMemo(() => {
    const byMin = new Map();
    for (const e of errors) {
      const ts = Number(e.timestamp || Date.now());
      const min = Math.floor(ts / 60000) * 60000;
      byMin.set(min, (byMin.get(min) || 0) + 1);
    }
    return Array.from(byMin.entries()).sort((a,b)=>a[0]-b[0]).map(([t,c])=>({ date: new Date(t).toLocaleTimeString(), count: c }));
  }, [errors]);

  if (loading) return <div className="text-sm text-gray-500">Cargando errores...</div>;
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#ef4444" name="Errores/min" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AdminHealth() {
  const [timeframe, setTimeframe] = useState('day');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Salud del Sistema</h2>
        <div className="flex gap-2">
          {['day','week','month'].map(tf => (
            <button key={tf} onClick={() => setTimeframe(tf)} className={`px-3 py-1 rounded text-sm ${timeframe===tf? 'bg-indigo-600 text-white':'bg-gray-200'}`}>
              {tf==='day'?{t('common.dia')}:tf==='week'?'Semana':'Mes'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Errores por minuto</h3>
        <ErrorRateChart timeframe={timeframe} />
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Usuarios con errores recientes</h3>
        <UsersWithErrorsTable timeframe={timeframe} />
      </div>
    </div>
  );
}
