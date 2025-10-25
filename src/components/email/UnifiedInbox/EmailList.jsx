import {
  Trash,
  AlertCircle,
  Star as StarIcon,
  Sparkles,
  Paperclip,
  Tag as TagIcon,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { get as apiGet } from '../../../services/apiClient';

import { safeRender, safeMap } from '../../../utils/promiseSafeRenderer';

const IS_CYPRESS = typeof window !== 'undefined' && typeof window.Cypress !== 'undefined';
const apiOptions = (extra = {}) => ({
  ...(extra || {}),
  auth: IS_CYPRESS ? false : extra?.auth ?? true,
  silent: extra?.silent ?? true,
});

/**
 * Renderiza la lista de correos con controles básicos y estados enriquecidos.
 *
 * @param {Object} props
 * @param {Array} props.emails
 * @param {boolean} props.loading
 * @param {string|null} props.error
 * @param {string|null} props.selectedEmailId
 * @param {Function} props.onSelectEmail
 * @param {Function} props.onDeleteEmail
 * @param {string} props.currentFolder
 * @param {Function} props.onToggleImportant
 * @param {Function} props.folderNameResolver
 * @param {'comfortable'|'compact'} [props.density]
 */
const EmailList = ({
  emails,
  loading,
  error,
  selectedEmailId,
  onSelectEmail,
  onDeleteEmail,
  currentFolder,
  onToggleImportant,
  folderNameResolver,
  density = 'comfortable',
}) => {
  const [selectedEmailIds, setSelectedEmailIds] = useState([]);

  useEffect(() => {
    if (!Array.isArray(emails) || emails.length === 0) {
      setSelectedEmailIds([]);
      return;
    }
    const validIds = new Set(
      safeMap(emails, (mail) => safeRender(mail?.id, '')).filter(Boolean)
    );
    setSelectedEmailIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [emails]);

  const densityConfig =
    density === 'compact'
      ? {
          itemPadding: 'px-4 py-2.5',
          subject: 'text-sm',
          snippet: 'text-xs text-muted',
          meta: 'text-xs text-muted',
          gap: 'gap-3',
          tag: 'text-[10px]',
        }
      : {
          itemPadding: 'px-5 py-3.5',
          subject: 'text-base',
          snippet: 'text-sm text-muted',
          meta: 'text-xs text-muted',
          gap: 'gap-4',
          tag: 'text-[11px]',
        };

  const extractSnippet = (mail) => {
    const base = safeRender(mail?.preview, '') || safeRender(mail?.body, '');
    if (typeof base !== 'string' || !base) return '';
    const plain = base.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!plain) return '';
    const limit = density === 'compact' ? 90 : 140;
    return plain.length > limit ? `${plain.slice(0, limit)}...` : plain;
  };

  const handleToggleSelect = (emailId, event) => {
    if (event) {
      event.stopPropagation();
    }
    setSelectedEmailIds((prev) =>
      prev.includes(emailId) ? prev.filter((id) => id !== emailId) : [...prev, emailId]
    );
  };

  const handleSelectAll = () => {
    if (!Array.isArray(emails) || emails.length === 0) {
      setSelectedEmailIds([]);
      return;
    }
    if (selectedEmailIds.length === emails.length) {
      setSelectedEmailIds([]);
      return;
    }
    const allIds = safeMap(emails, (mail) => safeRender(mail?.id, '')).filter(Boolean);
    setSelectedEmailIds(allIds);
  };

  const handleDeleteSelected = () => {
    if (typeof onDeleteEmail !== 'function') {
      setSelectedEmailIds([]);
      return;
    }
    selectedEmailIds.forEach((id) =>
      onDeleteEmail(id, { permanent: currentFolder === 'trash' })
    );
    setSelectedEmailIds([]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
      });
    }

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  const StatusMessage = ({ icon, title, description, className = '', dataTestId }) => (
    <div
      className={`flex flex-col items-center justify-center px-6 py-16 text-center ${className}`}
      data-testid={dataTestId}
    >
      {icon}
      <p className="mt-4 text-sm font-medium text-body">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-xs text-muted">{description}</p>
      ) : null}
    </div>
  );

  const totalEmails = Array.isArray(emails) ? emails.length : 0;
  const skeletonLength = density === 'compact' ? 8 : 5;
  const skeletonItems = Array.from({ length: skeletonLength }, (_, index) => (
    <div
      key={`email-skeleton-${index}`}
      className={`animate-pulse rounded-lg bg-gray-50 ${densityConfig.itemPadding}`}
    >
      <div className="h-3 w-1/3 rounded bg-gray-200" />
      <div className="mt-3 h-3 w-2/3 rounded bg-gray-200" />
    </div>
  ));

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-soft px-4 py-2 text-xs text-muted">
        {totalEmails > 0 ? (
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedEmailIds.length === totalEmails}
                onChange={handleSelectAll}
                className="rounded"
              />
              <span>Seleccionar todo</span>
            </label>
            <div className="flex items-center gap-2">
              {selectedEmailIds.length > 0 && (
                <span className="hidden text-xs text-muted sm:inline">
                  {selectedEmailIds.length} seleccionados
                </span>
              )}
              <button
                type="button"
                disabled={selectedEmailIds.length === 0}
                onClick={handleDeleteSelected}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  selectedEmailIds.length === 0
                    ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                <Trash size={14} />
                <span className="hidden sm:inline">Eliminar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted">
            <span className="text-xs">Sin emails que seleccionar</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="space-y-2 px-4 py-6">{skeletonItems}</div>
        ) : error ? (
          <StatusMessage
            icon={<AlertCircle size={32} className="text-red-500" />}
            title={error}
            description="Intenta actualizar la bandeja o revisa tu conexión."
            className="text-red-600"
            dataTestId="email-error-message"
          />
        ) : totalEmails === 0 ? (
          <StatusMessage
            icon={<Sparkles size={32} className="text-primary" />}
            title="No hay emails en esta carpeta"
            description="Redacta un nuevo mensaje o cambia de carpeta para seguir trabajando."
            className="text-muted"
            dataTestId="empty-folder-message"
          />
        ) : (
          <div className="divide-y divide-gray-100" data-testid="email-list">
            {safeMap(emails, (item) => item).map((email) => {
              const emailId = safeRender(email?.id, '');
              if (!emailId) return null;
              const isActive = selectedEmailId === emailId;
              const hasUnread = !safeRender(email?.read, false);
              const senderValue =
                currentFolder === 'sent' ? safeRender(email?.to, '') : safeRender(email?.from, '');
              const subject = safeRender(email?.subject, '(Sin asunto)');
              const snippet = extractSnippet(email);
              const tags = Array.isArray(email?._classificationTags)
                ? email._classificationTags.filter(Boolean)
                : [];
              const classificationPreview = tags.slice(0, 2);
              const remainingTags = Math.max(0, tags.length - classificationPreview.length);
              const hasAttachments =
                Array.isArray(email?.attachments) && email.attachments.length > 0;
              const suggestedLabel = safeRender(email?._suggestedFolderLabel, null);
              const hasSuggestion = Boolean(email?._hasSuggestion && suggestedLabel);
              const trashMeta = email?.trashMeta || {};
              const previousFolderId =
                trashMeta.previousFolder || trashMeta.restoredTo || null;
              const originalFolderName =
                currentFolder === 'trash' && typeof folderNameResolver === 'function'
                  ? folderNameResolver(previousFolderId)
                  : null;

              return (
                <div
                  key={emailId}
                  onClick={() => onSelectEmail(emailId)}
                  className={`group cursor-pointer border-l-4 ${densityConfig.itemPadding} transition-colors ${
                    isActive
                      ? 'border-blue-500 bg-blue-50/80'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                  data-testid="email-list-item"
                >
                  <div className={`flex items-start ${densityConfig.gap}`}>
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={selectedEmailIds.includes(emailId)}
                        onChange={(event) => handleToggleSelect(emailId, event)}
                        className="rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span
                          className={`truncate font-medium ${
                            hasUnread ? 'text-body' : 'text-body/80'
                          }`}
                          title={senderValue}
                        >
                          {senderValue || 'Remitente desconocido'}
                        </span>
                        {originalFolderName && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600">
                            {originalFolderName}
                          </span>
                        )}
                        {hasSuggestion && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                            <Sparkles size={12} />
                            {suggestedLabel}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`min-w-0 truncate ${densityConfig.subject} ${
                            hasUnread ? 'font-semibold text-body' : 'text-body'
                          }`}
                          title={subject}
                        >
                          {subject}
                        </span>
                        <InsightsBadge id={emailId} />
                        {hasAttachments && (
                          <Paperclip size={14} className="text-muted" aria-hidden="true" />
                        )}
                      </div>

                      {snippet && (
                        <p className={`truncate ${densityConfig.snippet}`} title={snippet}>
                          {snippet}
                        </p>
                      )}

                      {classificationPreview.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          {classificationPreview.map((tag) => (
                            <span
                              key={`${emailId}-tag-${tag}`}
                              className={`inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 ${densityConfig.tag} font-medium text-gray-600`}
                            >
                              <TagIcon size={10} />
                              {tag}
                            </span>
                          ))}
                          {remainingTags > 0 && (
                            <span className={`${densityConfig.tag} text-muted`}>
                              +{remainingTags}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                      <span className={densityConfig.meta}>{formatDate(email?.date)}</span>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          if (typeof onToggleImportant === 'function') {
                            onToggleImportant(emailId, !safeRender(email?.important, false));
                          }
                        }}
                        className={`rounded-full p-1.5 transition ${
                          safeRender(email?.important, false)
                            ? 'text-yellow-500'
                            : 'text-gray-300 hover:text-gray-400'
                        }`}
                        aria-label={
                          safeRender(email?.important, false)
                            ? 'Marcar como no importante'
                            : 'Marcar como importante'
                        }
                      >
                        <StarIcon
                          size={16}
                          className={safeRender(email?.important, false) ? 'fill-yellow-500' : ''}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

function InsightsBadge({ id }) {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        if (!id) return;
        const res = await apiGet(
          `/api/email-insights/${encodeURIComponent(id)}`,
          apiOptions({ silent: true })
        );
        if (!res.ok) return;
        const json = await res.json();
        if (ignore) return;
        const t = (json?.tasks?.length || 0) + (json?.meetings?.length || 0) + (json?.budgets?.length || 0) + (json?.contracts?.length || 0);
        setTotal(t);
      } catch {}
    })();
    return () => { ignore = true; };
  }, [id]);
  if (total <= 0) return null;
  return (
    <span
      title={`Acciones IA: ${total}`}
      className="ml-2 inline-flex items-center rounded-full bg-violet-100 text-violet-700 px-2 py-px text-[10px] font-semibold"
    >
      IA {total}
    </span>
  );
}

export default EmailList;


