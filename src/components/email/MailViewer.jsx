import React from 'react';

import { auth } from '../../lib/firebase';
import { updateMailTags } from '../../services/emailService';
import {
  addTagToEmail,
  removeTagFromEmail,
  getEmailTagsDetails,
  getUserTags,
} from '../../services/tagService';
import sanitizeHtml from '../../utils/sanitizeHtml';
import EmailInsights from '../EmailInsights';
import Button from '../ui/Button';

export default function MailViewer({
  mail,
  onMarkRead,
  onDelete,
  onCompose,
  folders = [],
  onMoveToFolder = () => {},
  userId = null,
}) {
  const replyInitial = () => ({
    to: mail.from || mail.sender || '',
    subject: mail.subject ? `Re: ${mail.subject}` : 'Re: (Sin asunto)',
    body: `\n\n----- Mensaje original -----\n${(mail.body || '').toString()}`,
  });
  const forwardInitial = () => ({
    to: '',
    subject: mail.subject ? `Fwd: ${mail.subject}` : 'Fwd: (Sin asunto)',
    body: `\n\n----- Mensaje reenviado -----\n${(mail.body || '').toString()}`,
  });

  const downloadAttachment = async (att, i = 0) => {
    try {
      let url = att && (att.url || att.link);
      const name = (att && (att.filename || att.name)) || `adjunto-${i + 1}`;
      if (!url && att && att.file) url = URL.createObjectURL(att.file);
      if (!url) return;

      const isApi =
        typeof url === 'string' && (url.startsWith('/api/') || url.includes('/api/mail/'));
      if (isApi) {
        try {
          const base =
            (import.meta && import.meta.env && import.meta.env.VITE_BACKEND_BASE_URL) || '';
          const toFull = (path) =>
            path.startsWith('http')
              ? path
              : base
                ? `${base}${path.startsWith('/') ? '' : '/'}${path}`
                : path;
          const urlInfo = url;
          const m = url.match(/^(.*\/api\/mail\/[^/]+\/attachments\/[^/]+)(?:\/?|$)/);
          if (m) {
            const signedEndpoint = `${m[1]}/url`;
            const token =
              auth && auth.currentUser && auth.currentUser.getIdToken
                ? await auth.currentUser.getIdToken()
                : null;
            const resSigned = await fetch(toFull(signedEndpoint), {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (resSigned.ok) {
              const json = await resSigned.json();
              if (json && json.url) {
                const a = document.createElement('a');
                a.href = json.url;
                a.download = name;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                  try {
                    a.remove();
                  } catch {}
                }, 0);
                return;
              }
            }
          }
          {
            const full = toFull(urlInfo);
            const token =
              auth && auth.currentUser && auth.currentUser.getIdToken
                ? await auth.currentUser.getIdToken()
                : null;
            const res = await fetch(full, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              try {
                a.remove();
              } catch {}
              try {
                URL.revokeObjectURL(blobUrl);
              } catch {}
            }, 0);
            return;
          }
        } catch (fetchErr) {
          console.error('Descarga autenticada falló', fetchErr);
        }
      }

      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          a.remove();
        } catch {}
        if (att && att.file && url && url.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(url);
          } catch {}
        }
      }, 0);
    } catch (e) {
      console.error('No se pudo descargar adjunto', e);
    }
  };

  const handleMark = () => {
    onMarkRead && onMarkRead(mail);
  };
  const handleDelete = () => {
    if (onDelete && window.confirm('¿Borrar este correo?')) {
      onDelete(mail);
    }
  };

  return (
    <div className="prose max-w-none">
      <div className="flex items-center justify-between mb-4">
        <h2 className="m-0">{mail.subject || '(Sin asunto)'}</h2>
        <div className="flex gap-2">
          {folders && folders.length > 0 && (
            <div className="flex items-center gap-2" data-testid="folder-menu">
              <select
                className="border rounded px-2 py-1 text-xs"
                onChange={(e) => {
                  const fid = e.target.value;
                  if (fid) onMoveToFolder(mail, fid);
                }}
                defaultValue=""
                data-testid="move-to-folder-button"
              >
                <option value="">Mover a carpeta…</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id} data-testid="folder-menu-item">
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-1">
            <select
              className="border rounded px-2 py-1 text-xs"
              defaultValue=""
              onChange={async (e) => {
                const tid = e.target.value;
                if (!tid) return;
                try {
                  addTagToEmail(userId || '', mail.id, tid);
                  try {
                    await updateMailTags(mail.id, { add: [tid] });
                  } catch {}
                  window.dispatchEvent(new Event('mywed360-email-tags'));
                } catch (_) {}
                e.target.value = '';
              }}
            >
              <option value="">Añadir etiqueta…</option>
              {getUserTags(userId || '').map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <Button size="sm" variant="ghost" onClick={() => onCompose && onCompose(replyInitial())}>
            Responder
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onCompose && onCompose(forwardInitial())}
          >
            Reenviar
          </Button>
          {!mail.read && (
            <Button size="sm" onClick={handleMark}>
              Marcar leído
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={handleDelete}>
            Borrar
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-2">
        De: {mail.sender || mail.from} - Para: {mail.recipient || mail.to}
      </p>
      {(() => {
        try {
          const tds = getEmailTagsDetails(userId || '', mail.id);
          return tds.length ? (
            <div className="mb-3 flex flex-wrap gap-1">
              {tds.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-700"
                >
                  #{t.name}
                  <button
                    title="Quitar"
                    onClick={() => {
                      try {
                        removeTagFromEmail(userId || '', mail.id, t.id);
                        window.dispatchEvent(new Event('mywed360-email-tags'));
                      } catch (_) {}
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null;
        } catch {
          return null;
        }
      })()}

      {Array.isArray(mail.attachments) && mail.attachments.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">
              Adjuntos ({mail.attachments.length})
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                try {
                  mail.attachments.forEach((att, i) => downloadAttachment(att, i));
                } catch (e) {
                  console.error('Descarga múltiple falló', e);
                }
              }}
            >
              Descargar todo
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {mail.attachments.map((att, i) => (
              <button
                key={(att.id || att.filename || att.name || 'att') + i}
                onClick={() => downloadAttachment(att, i)}
                className="rounded border p-2 text-left hover:bg-gray-50"
              >
                <div className="text-xs text-gray-500 truncate">
                  {att.filename || att.name || `Adjunto ${i + 1}`}
                </div>
                <div className="text-[11px] text-blue-600">Descargar</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(mail.body || 'Sin contenido.') }} />
      <EmailInsights mailId={mail.id} userId={userId} email={mail} />
    </div>
  );
}

