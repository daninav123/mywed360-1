import React, { useEffect, useState } from 'react';

import EmailRecommendationService from '../../services/EmailRecommendationService';
import { sendMail } from '../../services/emailService';
import { uploadEmailAttachments } from '../../services/storageUploadService';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

export default function ComposeModal({ onClose, from, initial = {}, userId = null }) {
  const [to, setTo] = useState(initial.to || '');
  const [subject, setSubject] = useState(initial.subject || '');
  const [body, setBody] = useState(initial.body || '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [attachments, setAttachments] = useState([]); // [{file, filename, size}]

  const recService = new EmailRecommendationService();
  const [subjectSuggestions, setSubjectSuggestions] = useState([]);
  useEffect(() => {
    try {
      const recs = recService.generateRecommendations();
      const patterns = recs?.subjectLineRecommendations?.recommendedPatterns || [];
      setSubjectSuggestions(patterns.slice(0, 3));
    } catch {}
  }, []);

  const handleFiles = (files) => {
    try {
      const arr = Array.from(files || []).map((f) => ({ file: f, filename: f.name, size: f.size }));
      setAttachments((prev) => [...prev, ...arr]);
    } catch {}
  };
  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      const uploaded =
        attachments && attachments.length
          ? await uploadEmailAttachments(
              attachments.map((a) => a.file).filter(Boolean),
              userId || 'anon'
            )
          : [];
      await sendMail({ to, subject, body, attachments: uploaded.length ? uploaded : attachments });
      onClose();
    } catch (err) {
      console.error('Error enviando correo:', err);
      setError(String(err?.message || err) || 'No se pudo enviar el correo');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto p-4">
      <div className="w-full max-w-xl rounded-lg bg-white shadow-lg max-h-[90vh] flex flex-col">
        <div className="p-6 pb-4">
          <h2 className="text-lg font-semibold">Nuevo correo</h2>
        </div>

        <div className="px-6 space-y-4 flex-1 overflow-y-auto">
          <input
            type="email"
            placeholder="Para"
            className="w-full rounded border px-3 py-2 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <input
            type="text"
            placeholder="Asunto"
            className="w-full rounded border px-3 py-2 text-sm"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          {subjectSuggestions.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
              {subjectSuggestions.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded"
                  onClick={() => setSubject(sug)}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}
          <textarea
            rows="8"
            placeholder="Escribe tu mensaje..."
            className="w-full rounded border px-3 py-2 text-sm"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          {error && (
            <Alert variant="error" className="text-sm">
              {error}
            </Alert>
          )}
          <div>
            <div className="mb-2 text-sm font-medium text-gray-700">Adjuntos</div>
            <input type="file" multiple onChange={(e) => handleFiles(e.target.files)} />
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachments.map((a, i) => (
                  <div
                    key={`${a.filename}-${i}`}
                    className="flex items-center justify-between rounded border px-2 py-1 text-xs"
                  >
                    <span className="truncate">
                      {a.filename} ({Math.round((a.size || 0) / 1024)} KB)
                    </span>
                    <button className="text-red-600" onClick={() => removeAttachment(i)}>
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="p-6 pt-4 mt-2 border-t flex justify-end gap-2 bg-white sticky bottom-0">
          <Button onClick={onClose} disabled={sending} variant="ghost">
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={sending || !to} variant="primary">
            {sending ? <Spinner size="sm" /> : 'Enviar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
