import React, { useEffect, useMemo, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useProviderEmail } from '../../hooks/useProviderEmail';
import * as EmailService from '../../services/EmailService';

const ProviderEmailModal = ({ open, onClose, provider, onSent }) => {
  const { userEmail, loading, error, sendEmailToProvider, generateDefaultSubject, generateDefaultEmailBody } = useProviderEmail();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState('');
  const validEmail = useMemo(() => /.+@.+\..+/.test(provider?.email || ''), [provider]);

  useEffect(() => {
    if (open && provider) {
      setSubject(generateDefaultSubject(provider));
      setBody(generateDefaultEmailBody(provider));
    }
  }, [open, provider, generateDefaultSubject, generateDefaultEmailBody]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const list = await EmailService.getEmailTemplates?.();
        if (!cancelled && Array.isArray(list)) setTemplates(list);
      } catch {}
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const applyTemplate = (idx) => {
    setSelectedTemplateIndex(idx);
    const t = templates[Number(idx)];
    if (!t) return;
    setSubject(t.subject || subject);
    setBody(t.body || body);
  };

  const handleSend = async () => {
    if (!provider || !validEmail) return;
    const res = await sendEmailToProvider(provider, subject, body);
    if (res && (res.email || res.tracking)) {
      if (typeof onSent === 'function') onSent(res);
      if (typeof onClose === 'function') onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-semibold">Contactar proveedor</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
              <AlertCircle size={18} className="mr-2" />
              <span>{error}</span>
            </div>
          )}

          <div className="mb-2">
            <p className="text-sm text-gray-600">De: <span className="font-medium">{userEmail || '...'}</span></p>
            <p className="text-sm text-gray-600">Para: <span className="font-medium">{provider?.email || '—'}</span> {(!validEmail) && <span className="text-xs text-red-600 ml-2">Añade un email al proveedor</span>}</p>
          </div>

          {templates.length > 0 && (
            <div className="mb-3">
              <label className="text-sm text-gray-700 mr-2">Plantillas:</label>
              <select value={selectedTemplateIndex} onChange={(e) => applyTemplate(e.target.value)} className="text-sm border border-gray-300 rounded-md py-1 px-2">
                <option value="">Seleccionar</option>
                {templates.map((t, i) => (<option key={i} value={i}>{t.name || `Plantilla ${i+1}`}</option>))}
              </select>
            </div>
          )}

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" placeholder="Asunto" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md min-h-[180px]" placeholder="Escribe tu mensaje..." />
          </div>
        </div>
        <div className="border-t p-4 flex justify-end gap-2 bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSend} disabled={loading || !validEmail}>{loading ? 'Enviando...' : 'Enviar'}</Button>
        </div>
      </Card>
    </div>
  );
};

export default ProviderEmailModal;

