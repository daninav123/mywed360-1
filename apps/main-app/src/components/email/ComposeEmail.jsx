import { AlertCircle, Paperclip } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth.jsx';
import * as EmailService from '../../services/emailService';
import { uploadEmailAttachments } from '../../services/storageUploadService';
import { safeRender } from '../../utils/promiseSafeRenderer';
import sanitizeHtml from '../../utils/sanitizeHtml';
import Button from '../Button';
import Card from '../ui/Card';
import useTranslations from '../../hooks/useTranslations';

/**
 * Página de composición de correo electrónico pensada para las rutas
 * /compose y /compose/:action/:id usadas en los tests E2E.
 * Incluye los placeholders exactos ('Para:' y 'Asunto:') y el elemento
 * con data-testid="email-body-editor" que esperan los tests.
 */
const ComposeEmail = () => {
  const { t, tVars } = useTranslations();
  const tEmail = (key, options = {}) => t(`email.${key}`, { ns: 'email', ...options });
  const tEmailVars = (key, variables = {}) =>
    tVars(`email.${key}`, { ns: 'email', ...variables });
  const [sentSuccess, setSentSuccess] = useState(false);
  const navigate = useNavigate();
  const { action, id } = useParams();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();

  // Estado del formulario
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const rawQuickReplies = tEmail('compose.quickReplies.options', {
    returnObjects: true,
  });
  const quickReplies = Array.isArray(rawQuickReplies) ? rawQuickReplies.filter(Boolean) : [];

  // Inicializar desde query params (mailto:, atajos, etc.) y cargar borrador si aplica
  React.useEffect(() => {
    const qpTo = searchParams.get('to');
    const qpSubject = searchParams.get('subject');
    const qpBody = searchParams.get('body');
    const qpUrl = searchParams.get('url');
    const qpCc = searchParams.get('cc');
    const qpBcc = searchParams.get('bcc');

    if (qpTo && !to) setTo(qpTo);
    if (qpSubject && !subject) setSubject(qpSubject);
    if ((qpBody || qpUrl) && !body) {
      const combined = [qpBody, qpUrl].filter(Boolean).join('\n');
      if (combined) setBody(combined);
    }
    if (qpCc && !cc) setCc(qpCc);
    if (qpBcc && !bcc) setBcc(qpBcc);

    // Placeholder: cargar borrador si action === 'edit' y id existe
    // (Implementación futura)
  }, [action, id, searchParams]);

  // Cargar archivos compartidos desde Web Share Target (IndexedDB)
  React.useEffect(() => {
    const shareId = searchParams.get('shareId');
    if (!shareId) return;
    let cancelled = false;

    const loadShared = async () => {
      try {
        const db = await new Promise((resolve, reject) => {
          const req = indexedDB.open('maloveapp-share-target', 1);
          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains('shares')) {
              db.createObjectStore('shares', { keyPath: 'id' });
            }
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        const tx = db.transaction('shares', 'readwrite');
        const store = tx.objectStore('shares');
        const record = await new Promise((resolve, reject) => {
          const getReq = store.get(shareId);
          getReq.onsuccess = () => resolve(getReq.result);
          getReq.onerror = () => reject(getReq.error);
        });
        // limpiar registro tras leer
        try {
          store.delete(shareId);
        } catch {}
        db.close();
        if (cancelled || !record || !Array.isArray(record.files)) return;
        const files = record.files.map(
          (f) => new File([f.blob], f.name, { type: f.type, lastModified: f.lastModified })
        );
        setAttachments((prev) => [...prev, ...files]);
      } catch (e) {
        // console.warn('[ComposeEmail] Failed to load shared files', e);
      }
    };

    loadShared();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validar tamaño máximo 10MB cada archivo
    const invalid = files.filter((f) => f.size > 10 * 1024 * 1024);
    if (invalid.length > 0) {
      setError(
        tEmailVars('composer.errors.invalidAttachments', {
          maxSize: '10MB',
          names: invalid.map((f) => f.name).join(', '),
        })
      );
      return;
    }

    setAttachments((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const validate = () => {
    if (!to) {
      setError(tEmail('composer.errors.missingRecipient'));
      return false;
    }
    if (!subject) {
      setError(tEmail('composer.errors.missingSubject'));
      return false;
    }
    return true;
  };

  const handleSend = async () => {
    setError('');
    if (!validate()) return;

    setSending(true);
    try {
      const uploaded =
        attachments && attachments.length
          ? await uploadEmailAttachments(attachments, (profile && profile.id) || 'anon')
          : [];
      await EmailService.sendMail({
        to,
        cc,
        bcc,
        subject,
        body,
        attachments: uploaded.length ? uploaded : attachments,
      });
      // Mostrar mensaje de éxito
      setSentSuccess(true);
      // Redirigir tras breve demora
      setTimeout(() => navigate('/'), 500);
    } catch (err) {
      // console.error('[ComposeEmail] Failed to send email:', err);
      setError(
        tEmailVars('composer.errors.sendFailedWithDetails', {
          details: err?.message || '',
        })
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card className="flex flex-col">
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{tEmail('compose.header.title')}</h2>
        </div>
        <div className="p-4 space-y-4">
          {safeRender(error, '') && (
            <div className="flex items-center text-red-700 bg-red-50 border border-red-200 p-3 rounded-md">
              <AlertCircle size={18} className="mr-2" />
              <span>{safeRender(error, '')}</span>
            </div>
          )}

          {/* Campo Para */}
          <div>
            <input
              type="text"
              placeholder={tEmail('compose.fields.to.placeholder')}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              disabled={sending}
              data-testid="recipient-input"
              aria-label={tEmail('compose.fields.to.aria')}
            />
          </div>

          {/* Campo Asunto */}
          <div>
            <input
              type="text"
              placeholder={tEmail('compose.fields.subject.placeholder')}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              disabled={sending}
              data-testid="subject-input"
              aria-label={tEmail('compose.fields.subject.aria')}
            />
          </div>

          {/* CC/BCC toggle */}
          <div
            className="text-sm text-blue-600 cursor-pointer select-none"
            onClick={() => setShowCcBcc((v) => !v)}
          >
            {showCcBcc
              ? tEmail('compose.toggle.hideCcBcc')
              : tEmail('compose.toggle.showCcBcc')}
          </div>
          {showCcBcc && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder={tEmail('compose.fields.cc.placeholder')}
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
                disabled={sending}
                aria-label={tEmail('compose.fields.cc.aria')}
              />
              <input
                type="text"
                placeholder={tEmail('compose.fields.bcc.placeholder')}
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
                disabled={sending}
                aria-label={tEmail('compose.fields.bcc.aria')}
              />
            </div>
          )}

          {/* Editor de cuerpo */}
          <div>
            <div
              data-testid="email-body-editor"
              contentEditable
              className="w-full min-h-[120px] border border-gray-300 rounded-md p-2 focus:outline-none"
              onInput={(e) => setBody(e.currentTarget.innerHTML)}
              suppressContentEditableWarning
              dangerouslySetInnerHTML={body ? { __html: sanitizeHtml(body) } : undefined}
            />
            {/* Respuestas sugeridas */}
            <div className="mt-2 flex flex-wrap gap-2">
              {quickReplies.map((qr, i) => (
                <button
                  key={i}
                  type="button"
                  className="text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-50"
                  onClick={() => {
                    const br = body && body.trim() ? '<br/><br/>' : '';
                    setBody((prev) => (prev || '') + br + qr);
                  }}
                  aria-label={tEmailVars('compose.quickReplies.ariaLabel', {
                    index: i + 1,
                  })}
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>

          {/* Adjuntos */}
          <div>
            <label
              className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
              aria-label={tEmail('composer.attachments.addFile')}
            >
              <Paperclip size={16} className="mr-1" /> {tEmail('composer.attachments.addFile')}
              <input type="file" className="hidden" multiple onChange={handleFileUpload} />
            </label>
            {attachments.length > 0 && (
              <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
                {attachments.map((file, idx) => (
                  <li key={idx}>{file.name}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <Button onClick={handleSend} disabled={sending} data-testid="send-button">
            {sending ? tEmail('composer.buttons.sending') : tEmail('composer.buttons.send')}
          </Button>
        </div>
        {sentSuccess && (
          <div
            data-testid="success-message"
            className="text-green-700 bg-green-50 border border-green-200 p-2 rounded-md mt-2"
          >
            {tEmail('composer.success.sent')}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ComposeEmail;
