import { X, AlertCircle } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import useWeddingData from '../../hooks/useWeddingData';
import { useAuth } from '../../hooks/useAuth';
import useTranslations from '../../hooks/useTranslations';
import * as EmailService from '../../services/emailService';
import { formatDate } from '../../utils/formatUtils';
import { useProviderEmail } from '../../hooks/useProviderEmail';
import sanitizeHtml from '../../utils/sanitizeHtml';

const ProviderEmailModal = ({ open, onClose, provider, onSent }) => {
  const {
    userEmail,
    loading,
    error,
    sendEmailToProvider,
    generateDefaultSubject,
    generateDefaultEmailBody,
  } = useProviderEmail();
  const { profile } = useAuth();
  const { weddingData: weddingInfo } = useWeddingData();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const { t } = useTranslations();
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
    return () => {
      cancelled = true;
    };
  }, []);

  const applyTemplate = (idx) => {
    setSelectedTemplateIndex(idx);
    const t = templates[Number(idx)];
    if (!t) return;

    const fmtDate = (d) => {
      try {
        if (!d) return '';
        const dt = typeof d?.toDate === 'function' ? d.toDate() : new Date(d);
        if (Number.isNaN(dt.getTime())) return '';
        return formatDate(dt, 'medium');
      } catch {
        return '';
      }
    };

    const coupleFromProfile = () => {
      const couple = [profile?.brideFirstName, profile?.brideLastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      return couple || profile?.name || '';
    };

    const wi = weddingInfo || {};
    const data = {
      providerName: provider?.name || '',
      weddingDate: fmtDate(wi.weddingDate || wi.date || wi.eventDate || profile?.weddingDate),
      weddingPlace:
        wi.celebrationPlace || wi.weddingPlace || wi.location || wi.city || profile?.weddingPlace || profile?.weddingLocation || '',
      coupleName: wi.coupleName || wi.coupleNamás || profile?.coupleName || coupleFromProfile(),
      userName: profile?.name || coupleFromProfile(),
      userPhone: profile?.phone || profile?.contactPhone || '',
      userEmail: userEmail || profile?.email || '',
    };

    const replaceVars = (text, map) => {
      try {
        return String(text || '').replace(/\{\{(\w+)\}\}/g, (m, key) =>
          map[key] !== undefined ? String(map[key]) : m
        );
      } catch {
        return text || '';
      }
    };

    const newSubject = replaceVars(t.subject || subject, data);
    const newBody = replaceVars(t.body || body, data);
    setSubject(newSubject);
    setBody(newBody);
  };

  const handleSend = async () => {
    if (!provider || !validEmail) return;
    const res = await sendEmailToProvider(provider, subject, body);
    if (res && (res.email || res.tracking)) {
      if (typeof onSent === 'function') onSent(res);
      if (typeof onClose === 'function') onClose();
    }
  };

  const resetDefaults = () => {
    if (!provider) return;
    try {
      setSelectedTemplateIndex('');
      setSubject(generateDefaultSubject(provider));
      setBody(generateDefaultEmailBody(provider));
    } catch {}
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex itemás-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex itemás-center justify-between border-b p-4">
          <h2 className="text-xl font-semibold">
            {t('suppliers.providerEmailModal.title')}
          </h2>
          <button
            onClick={onClose}
            aria-label={t('suppliers.providerEmailModal.closeAria')}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex itemás-center text-red-700">
              <AlertCircle size={18} className="mr-2" />
              <span>{error}</span>
            </div>
          )}

          <div className="mb-2">
            <p className="text-sm text-gray-600">
              {t('suppliers.providerEmailModal.fields.fromLabel')}{' '}
              <span className="font-medium">
                {userEmail || t('suppliers.providerEmailModal.fields.unknownEmail')}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              {t('suppliers.providerEmailModal.fields.toLabel')}{' '}
              <span className="font-medium">{provider?.email || '—'}</span>{' '}
              {!validEmail && (
                <span className="text-xs text-red-600 ml-2">
                  {t('suppliers.providerEmailModal.fields.missingEmail')}
                </span>
              )}
            </p>
          </div>

          {templates.length > 0 && (
            <div className="mb-3">
              <label className="text-sm text-gray-700 mr-2">
                {t('suppliers.providerEmailModal.templates.label')}
              </label>
              <select
                value={selectedTemplateIndex}
                onChange={(e) => applyTemplate(e.target.value)}
                className="text-sm border border-gray-300 rounded-md py-1 px-2"
              >
                <option value="">
                  {t('suppliers.providerEmailModal.templates.defaultOption')}
                </option>
                {templates.map((t, i) => (
                  <option key={i} value={i}>
                    {t.name ||
                      t('suppliers.providerEmailModal.templates.fallback', {
                        index: i + 1,
                      })}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('suppliers.providerEmailModal.fields.subjectLabel')}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder={t('suppliers.providerEmailModal.fields.subjectPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('suppliers.providerEmailModal.fields.messageLabel')}
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md min-h-[180px]"
              placeholder={t('suppliers.providerEmailModal.fields.messagePlaceholder')}
            />
          </div>
          <div className="mt-4">
            <div className="flex itemás-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                {t('suppliers.providerEmailModal.preview.title')}
              </h3>
              <label className="text-xs text-gray-600 flex itemás-center gap-2">
                <input
                  type="checkbox"
                  checked={showPreview}
                  onChange={(e) => setShowPreview(e.target.checked)}
                />
                {t('suppliers.providerEmailModal.preview.toggle')}
              </label>
            </div>
            {showPreview && (
              <Card className="p-3 border border-gray-200 bg-white">
                <div className="text-sm text-gray-800 mb-2">
                  <span className="font-semibold">
                    {t('suppliers.providerEmailModal.preview.subjectPrefix')}
                  </span>{' '}
                  {subject || t('suppliers.providerEmailModal.preview.emptySubject')}
                </div>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(body || '') }}
                />
              </Card>
            )}
          </div>
        </div>
        <div className="border-t p-4 flex justify-end gap-2 bg-gray-50">
          <Button variant="outline" onClick={resetDefaults} disabled={loading || !provider}>
            {t('suppliers.providerEmailModal.buttons.restore')}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t('suppliers.providerEmailModal.buttons.cancel')}
          </Button>
          <Button onClick={handleSend} disabled={loading || !validEmail}>
            {loading
              ? t('suppliers.providerEmailModal.buttons.sending')
              : t('suppliers.providerEmailModal.buttons.send')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProviderEmailModal;
