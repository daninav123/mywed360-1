import { collection, addDoc, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useWedding } from '../../context/WeddingContext';
import { db } from '../../firebaseConfig';
import useActiveWeddingInfo from '../../hooks/useActiveWeddingInfo';
import { formatDate } from '../../utils/formatUtils';
import useRFQTemplates from '../../hooks/useRFQTemplates';
import { post as apiPost } from '../../services/apiClient';
import Modal from '../Modal';
import Button from '../ui/Button';
import useTranslations from '../../hooks/useTranslations';

const REMINDER_OPTIONS = [3, 7, 14];

export default function RFQModal({
  open,
  onClose,
  providers = [],
  defaultSubject,
  defaultBody = '',
  onSent = () => {},
}) {
  const { t } = useTranslations();
  const { activeWedding } = useWedding();
  const localizedDefaults = useMemo(
    () => ({
      subject: defaultSubject || t('suppliers.rfqModal.defaults.subject'),
      body: defaultBody || t('suppliers.rfqModal.defaults.body'),
    }),
    [defaultSubject, defaultBody, t]
  );
  const [subject, setSubject] = useState(localizedDefaults.subject);
  const [body, setBody] = useState(localizedDefaults.body);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [autoReminderDays, setAutoReminderDays] = useState([3]);

  const targets = useMemo(() => providers.filter((p) => !!p?.email), [providers]);
  const previewTarget = targets[0] || providers[0] || null;
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

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setSubject(localizedDefaults.subject);
    setBody(localizedDefaults.body);
    setAutoReminderDays([3]);
    setAttachments([]);
    setTplId('');
    setTplName('');
    setTplService(inferredService || '');
    setActiveField('body');
  }, [open, localizedDefaults.subject, localizedDefaults.body, inferredService]);

  const toggleReminder = (day) => {
    setAutoReminderDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const remindersActive = autoReminderDays.length > 0;
  const missingEmails = Math.max(0, (providers?.length || 0) - (targets?.length || 0));

  const variables = useMemo(() => {
    const wi = weddingInfo || {};
    const couple = wi.coupleNames || wi.couple || wi.novios || '';
    const place = wi.celebrationPlace || wi.place || wi.location || wi.city || '';
    const dateVal = wi.date || wi.eventDate || wi.fecha || '';
    const dateStr = (() => {
      try {
        const d = typeof dateVal?.toDate === 'function' ? dateVal.toDate() : new Date(dateVal);
        if (Number.isNaN(d.getTime())) return t('suppliers.rfqModal.defaults.unknownDate');
        return formatDate(d, 'medium');
      } catch {
        return t('suppliers.rfqModal.defaults.unknownDate');
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
      let followupsCreated = 0;
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
          let success = res.ok;
          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            errors.push({ id: p.id, email: p.email, err: json?.message || res.statusText });
            success = false;
          }
          // Log RFQ en Firestore (best-effort) y programar recordatorios
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
                status: success ? 'sent' : 'failed',
                reminders: remindersActive ? autoReminderDays : [],
              });
              if (success) {
                const sref = doc(db, 'weddings', activeWedding, 'suppliers', p.id);
                await updateDoc(sref, { lastRFQAt: serverTimestamp() });
                if (remindersActive) {
                  for (const day of autoReminderDays) {
                    const scheduleDate = Timestamp.fromDate(
                      new Date(Date.now() + day * 24 * 60 * 60 * 1000)
                    );
                    const followupsCol = collection(
                      db,
                      'weddings',
                      activeWedding,
                      'suppliers',
                      p.id,
                      'rfqFollowups'
                    );
                    await addDoc(followupsCol, {
                      subject: compiledSubject,
                      email: p.email,
                      scheduledFor: scheduleDate,
                      status: 'scheduled',
                      createdAt: serverTimestamp(),
                      dayOffset: day,
                      auto: true,
                    });
                    followupsCreated += 1;
                  }
                }
              }
            }
          } catch {}
        } catch (e) {
          errors.push({ id: p.id, email: p.email, err: e?.message || String(e) });
        }
      }
      const outcome = {
        ok: errors.length === 0,
        errors,
        sentCount: targets.length - errors.length,
        reminders: remindersActive ? autoReminderDays.slice() : [],
        remindersCreated: followupsCreated,
      };
      setResult(outcome);
      try {
        onSent?.(outcome);
      } catch {}
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
      name: tplName || t('suppliers.rfqModal.templates.defaultName'),
      service: tplService || '',
      subject,
      body,
    });
    setTplId(id);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('suppliers.rfqModal.title', { count: targets.length })}
    >
      <div className="space-y-4">
        {missingEmails > 0 && (
          <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {t('suppliers.rfqModal.missingEmails', { count: missingEmails })}
          </div>
        )}
        {/* Templates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t('suppliers.rfqModal.templates.label')}
            </label>
            <select
              className="border rounded p-2 w-full"
              value={tplId}
              onChange={(e) => applyTemplate(e.target.value)}
            >
              <option value="">
                {t('suppliers.rfqModal.templates.placeholder')}
              </option>
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
            <label className="block text-xs text-gray-500 mb-1">
              {t('suppliers.rfqModal.templates.nameLabel')}
            </label>
            <input
              className="border rounded p-2 w-full"
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              placeholder={t('suppliers.rfqModal.templates.namePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t('suppliers.rfqModal.templates.serviceLabel')}
            </label>
            <input
              className="border rounded p-2 w-full"
              value={tplService}
              onChange={(e) => setTplService(e.target.value)}
              placeholder={t('suppliers.rfqModal.templates.servicePlaceholder')}
            />
          </div>
          <div className="md:col-span-3 flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={saveCurrentAsTemplate}>
              {t('suppliers.rfqModal.templates.save')}
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
                {t('suppliers.rfqModal.templates.delete')}
              </Button>
            )}
          </div>
        </div>
        {providers.length > 0 && targets.length !== providers.length && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded">
            {t('suppliers.rfqModal.missingEmails', {
              count: providers.length - targets.length,
            })}
          </p>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('suppliers.rfqModal.subjectLabel')}
          </label>
          <input
            ref={subjectRef}
            onFocus={() => setActiveField('subject')}
            className="w-full border rounded p-2"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('suppliers.rfqModal.messageLabel')}
          </label>
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
            <p className="text-xs text-gray-500 mb-1">
              {t('suppliers.rfqModal.variablesLabel')}
            </p>
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
                  title={t('suppliers.rfqModal.variablesInsert')}
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
            <div className="mt-3 border border-indigo-100 bg-indigo-50/50 rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-indigo-700">
                  {t('suppliers.rfqModal.reminders.title')}
                </p>
                {remindersActive ? (
                  <button
                    type="button"
                    className="text-[11px] text-indigo-600 hover:underline"
                    onClick={() => setAutoReminderDays([])}
                  >
                    {t('suppliers.rfqModal.reminders.clear')}
                  </button>
                ) : (
                  <span className="text-[11px] text-indigo-500">
                    {t('suppliers.rfqModal.reminders.none')}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {REMINDER_OPTIONS.map((day) => {
                  const active = autoReminderDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleReminder(day)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-100'
                    }`}
                  >
                    {t('suppliers.rfqModal.reminders.add', { day })}
                  </button>
                );
              })}
              </div>
              <p className="text-[11px] text-indigo-600 mt-2">
                {remindersActive
                  ? t('suppliers.rfqModal.reminders.summary', {
                      days: autoReminderDays.join(', '),
                    })
                  : t('suppliers.rfqModal.reminders.disabled')}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">
              {t('suppliers.rfqModal.attachments.title')}
            </p>
            <div className="space-y-2">
              {attachments.map((a, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    className="border rounded p-1 flex-1"
                    placeholder={t('suppliers.rfqModal.attachments.namePlaceholder')}
                    value={a.name || ''}
                    onChange={(e) => {
                      const next = attachments.slice();
                      next[idx] = { ...next[idx], name: e.target.value };
                      setAttachments(next);
                    }}
                  />
                  <input
                    className="border rounded p-1 flex-1"
                    placeholder={t('suppliers.rfqModal.attachments.urlPlaceholder')}
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
                    {t('suppliers.rfqModal.attachments.remove')}
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAttachments([...attachments, { name: '', url: '' }])}
                >
                  {t('suppliers.rfqModal.attachments.add')}
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
                      // console.warn(
                        t('suppliers.rfqModal.errors.upload', {
                          message: e?.message || e,
                        })
                      );
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
                  {uploading
                    ? t('suppliers.rfqModal.attachments.uploading')
                    : t('suppliers.rfqModal.attachments.upload')}
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* Vista previa */}
        <div className="border rounded p-3 bg-gray-50">
          <p className="text-xs text-gray-500 mb-1">
            {t('suppliers.rfqModal.preview.title')}
          </p>
          <p className="font-medium">
            {t('suppliers.rfqModal.preview.subject')}{' '}
            {previewTarget ? interpolate(subject, previewTarget) : subject}
          </p>
          <div className="whitespace-pre-wrap text-sm mt-1">
            {previewTarget ? interpolate(body, previewTarget) : body}
          </div>
        </div>
        {result && (
          <div
            className={`text-sm ${result.ok ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'} border p-2 rounded`}
          >
            {result.ok ? (
              <>
                {t('suppliers.rfqModal.result.success', {
                  count: result.sentCount,
                })}
                {result.remindersCreated > 0 && result.reminders?.length ? (
                  <span className="block text-xs mt-1 text-green-700">
                    {t('suppliers.rfqModal.result.reminders', {
                      days: result.reminders.join(', '),
                    })}
                  </span>
                ) : null}
              </>
            ) : (
              <>
                {t('suppliers.rfqModal.result.failure', {
                  count: result.errors.length,
                })}
                <ul className="list-disc ml-5">
                  {result.errors.map((e, i) => (
                    <li key={i}>
                      {e.email}: {e.err}
                    </li>
                  ))}
                </ul>
                {result.sentCount > 0 && (
                  <p className="mt-2 text-xs text-red-700">
                    {t('suppliers.rfqModal.result.failureSummary', {
                      sentCount: result.sentCount,
                      reminders: result.remindersCreated,
                    })}
                  </p>
                )}
              </>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('suppliers.rfqModal.buttons.close')}
          </Button>
          <Button onClick={handleSend} disabled={sending || targets.length === 0}>
            {sending
              ? t('suppliers.rfqModal.buttons.sending')
              : t('suppliers.rfqModal.buttons.send')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
