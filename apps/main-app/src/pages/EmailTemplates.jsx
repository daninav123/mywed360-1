import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserContext } from '../context/UserContext';
import { listEmailTemplates, saveEmailTemplate } from '../services/emailTemplatesService';
export default function EmailTemplatesPage() {
  const { t } = useTranslation('pages');
  const { user } = useUserContext();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ id: '', name: '', subject: '', body: '', category: 'custom' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await listEmailTemplates(user);
      const list = res?.templates || [];
      setItems(list);
    } catch (_) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const onEdit = (tpl) => setForm({ id: tpl.id, name: tpl.name, subject: tpl.subject, body: tpl.body, category: tpl.category || 'custom' });
  const onNew = () => setForm({ id: '', name: '', subject: '', body: '', category: 'custom' });
  const onSave = async () => {
    setSaving(true); setMsg('');
    try {
      await saveEmailTemplate(user, form);
      setMsg('Plantilla guardada');
      await load();
    } catch (e) {
      setMsg('Error al guardar');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-4">{t('emailTemplates.loading', 'Loading templates...')}</div>;

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">{t('emailTemplates.title')}</h2>
          <button className="text-sm " style={{ color: 'var(--color-primary)' }} onClick={onNew}>{t('emailTemplates.add')}</button>
        </div>
        <ul className="divide-y border rounded">
          {items.map(t => (
            <li key={t.id} className="p-2 cursor-pointer hover:" style={{ backgroundColor: 'var(--color-bg)' }} onClick={()=>onEdit(t)}>
              <div className="font-medium">{t.name}</div>
              <div className="text-sm " style={{ color: 'var(--color-text-secondary)' }}>{t.subject}</div>
              <div className="text-xs " style={{ color: 'var(--color-muted)' }}>{t.category || t.owner}</div>
            </li>
          ))}
          {items.length === 0 && <li className="p-2 text-sm " style={{ color: 'var(--color-muted)' }}>Sin plantillas</li>}
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">{form.id ? t('app.edit', 'Edit') : t('app.add', 'New')} {t('emailTemplates.title')}</h2>
        <div className="space-y-2">
          <input className="w-full border rounded px-2 py-1" placeholder={t('emailTemplates.name')} value={form.name} onChange={(e)=>setForm({ ...form, name: e.target.value })} />
          <input className="w-full border rounded px-2 py-1" placeholder={t('emailTemplates.subject')} value={form.subject} onChange={(e)=>setForm({ ...form, subject: e.target.value })} />
          <textarea className="w-full border rounded px-2 py-1 h-40" placeholder={t('emailTemplates.body')} value={form.body} onChange={(e)=>setForm({ ...form, body: e.target.value })} />
          <div>
            <button className="px-3 py-1  text-white rounded" style={{ backgroundColor: 'var(--color-primary)' }} onClick={onSave} disabled={saving}>{saving ? t('app.saving') : t('emailTemplates.save')}</button>
            {msg && <span className="ml-3 text-sm " style={{ color: 'var(--color-text-secondary)' }}>{msg}</span>}
          </div>
        </div>
      </div>
    </div>
      
    
  );
}


