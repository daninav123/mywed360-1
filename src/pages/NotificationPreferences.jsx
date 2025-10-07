import React, { useEffect, useState } from 'react';
import { useUserContext } from '../context/UserContext';
import { getNotificationPreferences, saveNotificationPreferences } from '../services/notificationPreferencesService';

export default function NotificationPreferences() {
  const { user } = useUserContext();
  const [channels, setChannels] = useState({ email: true, inapp: true, push: false });
  const [quietHours, setQuietHours] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getNotificationPreferences(user);
        if (!mounted) return;
        const prefs = res?.preferences || {};
        setChannels(prefs.channels || { email: true, inapp: true, push: false });
        setQuietHours(prefs.quietHours || { start: '', end: '' });
      } catch (_) {}
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [user]);

  const onToggle = (key) => setChannels((c) => ({ ...c, [key]: !c[key] }));
  const onSave = async () => {
    setSaving(true); setMsg('');
    try {
      const payload = { channels, quietHours: (quietHours.start && quietHours.end) ?quietHours : null };
      await saveNotificationPreferences(user, payload);
      setMsg('Preferencias guardadas');
    } catch (e) {
      setMsg('Error al guardar preferencias');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-4">Cargando preferencias&</div>;

  return (
    <div className="max-w-xl p-4 space-y-4">
      <h1 className="text-xl font-semibold">Preferencias de notificaci?n</h1>
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={channels.email} onChange={() => onToggle('email')} />
          Email
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={channels.inapp} onChange={() => onToggle('inapp')} />
          Inapp
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={channels.push} onChange={() => onToggle('push')} />
          Push (opcional)
        </label>
      </div>
      <div className="space-y-1">
        <div className="font-medium">Horario de silencio (opcional)</div>
        <div className="flex items-center gap-2">
          <input className="border rounded px-2 py-1" placeholder="22:00" value={quietHours.start} onChange={(e)=>setQuietHours(v=>({...v, start:e.target.value}))} />
          <span>a</span>
          <input className="border rounded px-2 py-1" placeholder="07:00" value={quietHours.end} onChange={(e)=>setQuietHours(v=>({...v, end:e.target.value}))} />
        </div>
      </div>
      <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={onSave} disabled={saving}>{saving ?'Guardando&' : 'Guardar'}</button>
      {msg && <div className="text-sm text-gray-600">{msg}</div>}
    </div>
  );
}


