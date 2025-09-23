import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import React, { useMemo, useRef, useState } from 'react';

import { useWedding } from '../../context/WeddingContext';
import { db } from '../../firebaseConfig';
import useActiveWeddingInfo from '../../hooks/useActiveWeddingInfo';
import useRFQTemplates from '../../hooks/useRFQTemplates';
import { post as apiPost } from '../../services/apiClient';
import Modal from '../Modal';
import Button from '../ui/Button';

export default function RFQModal({
  open,
  onClose,
  providers = [],
  defaultSubject = 'Solicitud de presupuesto',
  defaultBody = '',
}) {
  const { activeWedding } = useWedding();
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(
    defaultBody ||
      'Hola,\n\nNos gustaría recibir un presupuesto detallado para nuestro evento. Por favor, incluye condiciones, logística y extras.\n\nGracias.'
  );
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const targets = useMemo(() => providers.filter((p) => !!p?.email), [providers]);
  const inferredService = providers.find((p) => p?.service)?.service || '';

  // Templates
  const { templates, saveTemplate, removeTemplate } = useRFQTemplates();
  const [tplId, setTplId] = useState('');
  const [tplName, setTplName] = useState('');
  const [tplService, setTplService] = useState(inferredService || '');
  const { info: weddingInfo } = useActiveWeddingInfo();
  const [attachments, setAttachments] = useState([]); // { name, url }
  const subjectRef = useRef(null);
  const bodyRef = useRef(null);
  const [activeField, setActiveField] = useState('body');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const variables = useMemo(() => {
    const wi = weddingInfo || {};
    const couple = wi.coupleNames || wi.couple || wi.novios || '';
    const place = wi.celebrationPlace || wi.place || wi.location || wi.city || '';
    const dateVal = wi.date || wi.eventDate || wi.fecha || '';
    const dateStr = (() => {
      try {
        const d = typeof dateVal?.toDate === 'function' ? dateVal.toDate() : new Date(dateVal);
        return d.toLocaleDateString('es-ES');
      } catch {
        return String(dateVal || '');
      }
    })();
    return {
      '{boda_nombre}': wi.name || wi.title || '',
      '{novios}': couple,
      '{fecha_evento}': dateStr,
      '{lugar}': place,
      '{wedding_id}': activeWedding || '',
      '{servicio}': tplService || inferredService || '',
      '{invitados}': wi.guestsTotal || wi.guestCount || wi.aforo || wi.invitados || '',
      '{presupuesto}': wi.budget || wi.presupuesto || '',
      '{hora_evento}': wi.time || wi.eventTime || wi.hora || '',
      '{organizador}': wi.plannerName || wi.organizer || wi.ownerName || '',
      '{lugar_direccion}': wi.venueAddress || wi.address || '',
    };
  }, [weddingInfo, activeWedding, tplService, inferredService]);

  function interpolate(text, provider) {
    let out = String(text || '');
    const provVars = {
      '{proveedor_nombre}': provider?.name || '',
      '{proveedor_servicio}': provider?.service || '',
    };
    for (const [k, v] of Object.entries({ ...variables, ...provVars })) {
      out = out.split(k).join(v || '');
    }
    return out;
  }

  const handleSend = async () => {
    if (!targets.length) return;
    setSending(true);
    setResult(null);
    try {
      const errors = [];
      for (const p of targets) {
        try {
          const compiledSubject = interpolate(subject, p);
          const compiledBody = interpolate(body, p);
          const res = await apiPost(
            '/api/mail',
            {
              to: p.email,
              subject: compiledSubject,
              body: compiledBody,
              attachments: attachments.map((a) => ({ filename: a.name || a.filename, url: a.url })),
            },
            { auth: true }
          );
          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            errors.push({ id: p.id, email: p.email, err: json?.message || res.statusText });
          }
          // Log RFQ in Firestore (best-effort)
          try {
            if (activeWedding && p.id && !String(p.id).startsWith('web-')) {
              const col = collection(
                db,
                'weddings',
                activeWedding,
                'suppliers',
                p.id,
                'rfqHistory'
              );
              await addDoc(col, {
                subject: compiledSubject,
                body: compiledBody,
                email: p.email,
                attachments: attachments,
                sentAt: serverTimestamp(),
              });
              // update supplier lastRFQAt
              const sref = doc(db, 'weddings', activeWedding, 'suppliers', p.id);
              await updateDoc(sref, { lastRFQAt: serverTimestamp() });
            }
          } catch {}
        } catch (e) {
          errors.push({ id: p.id, email: p.email, err: e?.message || String(e) });
        }
      }
      setResult({ ok: errors.length === 0, errors });
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (id) => {
    setTplId(id);
    const t = templates.find((x) => x.id === id);
    if (t) {
      setSubject(t.subject || '');
      setBody(t.body || '');
      setTplName(t.name || '');
      setTplService(t.service || '');
    }
  };

  const saveCurrentAsTemplate = async () => {
    const id = await saveTemplate({
      id: tplId || undefined,
      name: tplName || 'RFQ',
      service: tplService || '',
      subject,
      body,
    });
    setTplId(id);
  };

  return (
    <Modal open={open} onClose={onClose} title={`Solicitar presupuesto (${targets.length})`}>
      <div className="space-y-4">
        {/* Templates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Plantillas</label>
            <select
              className="border rounded p-2 w-full"
              value={tplId}
              onChange={(e) => applyTemplate(e.target.value)}
            >
              <option value="">Seleccionar plantilla</option>
              {templates
                .filter((t) => !tplService || !t.service || t.service === tplService)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.service ? ` (${t.service})` : ''}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nombre plantilla</label>
            <input
              className="border rounded p-2 w-full"
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              placeholder="Ej. RFQ Fotografía"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Servicio</label>
            <input
              className="border rounded p-2 w-full"
              value={tplService}
              onChange={(e) => setTplService(e.target.value)}
              placeholder="Ej. Música"
            />
          </div>
          <div className="md:col-span-3 flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={saveCurrentAsTemplate}>
              Guardar plantilla
            </Button>
            {tplId && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await removeTemplate(tplId);
                  setTplId('');
                }}
              >
                Eliminar plantilla
              </Button>
            )}
          </div>
        </div>
        {providers.length > 0 && targets.length !== providers.length && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded">
            {providers.length - targets.length} proveedor(es) no tienen email y serán omitidos.
          </p>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Asunto</label>
          <input
            ref={subjectRef}
            onFocus={() => setActiveField('subject')}
            className="w-full border rounded p-2"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mensaje</label>
          <textarea
            ref={bodyRef}
            onFocus={() => setActiveField('body')}
            className="w-full border rounded p-2"
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        {/* Variables y adjuntos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Variables</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(variables).map((v) => (
                <button
                  key={v}
                  type="button"
                  className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => {
                    const token = v;
                    if (activeField === 'subject') {
                      const el = subjectRef.current;
                      if (el) {
                        const start = el.selectionStart || subject.length;
                        const s = subject.slice(0, start) + token + subject.slice(start);
                        setSubject(s);
                        setTimeout(() => {
                          el.focus();
                          el.selectionStart = el.selectionEnd = start + token.length;
                        }, 0);
                      }
                    } else {
                      const el = bodyRef.current;
                      if (el) {
                        const start = el.selectionStart || body.length;
                        const s = body.slice(0, start) + token + body.slice(start);
                        setBody(s);
                        setTimeout(() => {
                          el.focus();
                          el.selectionStart = el.selectionEnd = start + token.length;
                        }, 0);
                      }
                    }
                  }}
                  title="Insertar variable"
                >
                  {v}
                </button>
              ))}
              {/* proveedor-specific tokens */}
              {['{proveedor_nombre}', '{proveedor_servicio}'].map((v) => (
                <span key={v} className="text-xs px-2 py-1 bg-gray-100 rounded">
                  {v}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Adjuntos (URL)</p>
            <div className="space-y-2">
              {attachments.map((a, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    className="border rounded p-1 flex-1"
                    placeholder="Nombre"
                    value={a.name || ''}
                    onChange={(e) => {
                      const next = attachments.slice();
                      next[idx] = { ...next[idx], name: e.target.value };
                      setAttachments(next);
                    }}
                  />
                  <input
                    className="border rounded p-1 flex-1"
                    placeholder="https://..."
                    value={a.url || ''}
                    onChange={(e) => {
                      const next = attachments.slice();
                      next[idx] = { ...next[idx], url: e.target.value };
                      setAttachments(next);
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                  >
                    Quitar
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAttachments([...attachments, { name: '', url: '' }])}
                >
                  Añadir URL
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length || !activeWedding) return;
                    setUploading(true);
                    try {
                      const storage = getStorage();
                      const uploaded = [];
                      for (const f of files) {
                        const path = `weddings/${activeWedding}/rfq-attachments/${Date.now()}_${encodeURIComponent(f.name)}`;
                        const ref = sRef(storage, path);
                        await uploadBytes(ref, f);
                        const url = await getDownloadURL(ref);
                        uploaded.push({ name: f.name, url });
                      }
                      setAttachments((prev) => [...prev, ...uploaded]);
                    } catch (e) {
                      console.warn('Error subiendo archivo(s):', e?.message || e);
                    } finally {
                      setUploading(false);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!activeWedding || uploading}
                >
                  {uploading ? 'Subiendo…' : 'Subir archivo'}
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* Vista previa */}
        <div className="border rounded p-3 bg-gray-50">
          <p className="text-xs text-gray-500 mb-1">Vista previa</p>
          <p className="font-medium">Asunto: {interpolate(subject, targets[0])}</p>
          <div className="whitespace-pre-wrap text-sm mt-1">{interpolate(body, targets[0])}</div>
        </div>
        {result && (
          <div
            className={`text-sm ${result.ok ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'} border p-2 rounded`}
          >
            {result.ok ? (
              'Enviado correctamente.'
            ) : (
              <>
                Fallos: {result.errors.length}
                <ul className="list-disc ml-5">
                  {result.errors.map((e, i) => (
                    <li key={i}>
                      {e.email}: {e.err}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={handleSend} disabled={sending || targets.length === 0}>
            {sending ? 'Enviando…' : 'Enviar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
