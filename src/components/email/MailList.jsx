import React, { useEffect, useRef, useState } from 'react';

import Avatar from './Avatar';
import { getEmailTagsDetails } from '../../services/tagService';
import { useTranslations } from '../../hooks/useTranslations';

const formatDateShort = (d) => {
  const { t } = useTranslations();

  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  const now = new Date();
  const sameDay = dt.toDateString() === now.toDateString();
  if (sameDay) return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return dt.toLocaleDateString();
};

export default function MailList({
  emails,
  onSelect,
  selected,
  loading = false,
  emptyMessage = 'No hay correos',
  onToggleRead = () => {},
  onDelete = () => {},
  folders = [],
  onMoveToFolder = () => {},
  userId = null,
  selectedIds = new Set(),
  onToggleSelect = () => {},
  hasMore = false,
  loadingMore = false,
  onLoadMore = null,
}) {
  const [visible, setVisible] = useState(30);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [tick, setTick] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener('maloveapp-email-tags', h);
    return () => window.removeEventListener('maloveapp-email-tags', h);
  }, []);

  useEffect(() => {
    if (!hasMore || typeof onLoadMore !== 'function') return;
    const el = bottomRef.current;
    if (!el) return;
    let pending = false;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries && entries[0];
        if (e && e.isIntersecting && !pending) {
          pending = true;
          Promise.resolve(onLoadMore()).finally(() => {
            pending = false;
          });
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );
    io.observe(el);
    return () => {
      try {
        io.disconnect();
      } catch {}
    };
  }, [hasMore, onLoadMore]);

  const dateGroupLabel = (d) => {
    if (!d) return 'Sin fecha';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return 'Sin fecha';
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffMs = startOfToday - new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7 && diffDays > 1) return 'Esta semana';
    return dt.toLocaleDateString();
  };

  const renderSkeleton = (i) => (
    <div key={`sk-${i}`} className="border-b p-3 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-3 w-3/5 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-4/5 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );

  const items =
    loading && emails.length === 0
      ? Array.from({ length: 8 }).map((_, i) => renderSkeleton(i))
      : emails.map((mail, idx) => (
          <div key={`wrap-${mail.id}`}>
            {(idx === 0 || dateGroupLabel(emails[idx - 1].date) !== dateGroupLabel(mail.date)) && (
              <div
                key={`hdr-${dateGroupLabel(mail.date)}-${idx}`}
                className="bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600"
              >
                {dateGroupLabel(mail.date)}
              </div>
            )}
            <div
              key={mail.id}
              onClick={() => onSelect(mail)}
              data-testid="email-list-item"
              className={`group relative cursor-pointer border-b p-3 transition-colors ${selected && selected.id === mail.id ? 'bg-blue-50' : mail.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/20 hover:bg-blue-50/40'}`}
            >
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selectedIds.has(mail.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleSelect(mail.id);
                  }}
                />
                <Avatar email={mail.from || mail.sender} unread={!mail.read} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`truncate ${!mail.read ? 'font-semibold' : ''}`}>
                      {mail.subject || '(Sin asunto)'}
                    </div>
                    <div className="shrink-0 text-xs text-gray-500">
                      {formatDateShort(mail.date)}
                    </div>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                    <span className="truncate">{mail.sender || mail.from}</span>
                    {Array.isArray(mail.attachments) && mail.attachments.length > 0 && (
                      <span title="Adjuntos">??</span>
                    )}
                  </div>
                  {/* Estado de entrega/lectura */}
                  <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px]">
                    {(() => {
                      try {
                        const failed = Boolean(
                          mail.failedAt ||
                            (mail.lastEvent && String(mail.lastEvent).toLowerCase() === 'failed')
                        );
                        const delivered = Boolean(
                          mail.deliveredAt ||
                            (mail.lastEvent && String(mail.lastEvent).toLowerCase() === 'delivered')
                        );
                        const openCount = Number(mail.openCount || 0);
                        const clickCount = Number(mail.clickCount || 0);
                        const badges = [];
                        if (failed)
                          badges.push(
                            <span
                              key="b-f"
                              className="rounded bg-red-50 px-1.5 py-0.5 text-red-600 border border-red-200"
                            >
                              Fallo
                            </span>
                          );
                        if (delivered && !failed)
                          badges.push(
                            <span
                              key="b-d"
                              className="rounded bg-green-50 px-1.5 py-0.5 text-green-700 border border-green-200"
                            >
                              Entregado
                            </span>
                          );
                        if (openCount > 0)
                          badges.push(
                            <span
                              key="b-o"
                              className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700 border border-blue-200"
                            >
                              Abierto {openCount}
                            </span>
                          );
                        if (clickCount > 0)
                          badges.push(
                            <span
                              key="b-c"
                              className="rounded bg-purple-50 px-1.5 py-0.5 text-purple-700 border border-purple-200"
                            >
                              Clicks {clickCount}
                            </span>
                          );
                        return badges.length ? badges : null;
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                  {(() => {
                    try {
                      const tds = userId ? getEmailTagsDetails(userId, mail.id) : [];
                      return tds && tds.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {tds.slice(0, 3).map((t) => (
                            <span
                              key={t.id}
                              className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
                            >
                              #{t.name}
                            </span>
                          ))}
                        </div>
                      ) : null;
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              </div>
              {/* Acciones rápidas al hover */}
              <div className="absolute right-2 top-2 hidden gap-1 sm:flex sm:opacity-0 sm:transition-opacity sm:duration-150 sm:group-hover:opacity-100">
                <button
                  title={mail.read ? {t('common.marcar_leido')} : {t('common.marcar_leido')}}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleRead(mail);
                  }}
                  className="rounded border bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
                >
                  {mail.read ? {t('common.leido')} : 'Leer'}
                </button>
                <button
                  title="Eliminar"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(mail);
                  }}
                  className="rounded border bg-white px-2 py-1 text-[11px] text-red-600 hover:bg-red-50"
                >
                  Borrar
                </button>
              </div>
              {/* Menú móvil */}
              {menuOpenId === mail.id && (
                <div className="absolute right-2 top-8 z-10 w-32 rounded border bg-white shadow">
                  <button
                    className="block w-full px-3 py-2 text-left text-xs hover:bg-gray-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(null);
                      onToggleRead(mail);
                    }}
                  >
                    {mail.read ? {t('common.marcar_leido')} : {t('common.marcar_leido')}}
                  </button>
                  {folders.length > 0 && (
                    <div className="border-top">
                      {folders.map((f) => (
                        <button
                          key={f.id}
                          className="block w-full px-3 py-2 text-left text-xs hover:bg-gray-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(null);
                            onMoveToFolder(mail, f.id);
                          }}
                        >
                          Mover a: {f.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    className="block w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(null);
                      onDelete(mail);
                    }}
                  >
                    Borrar
                  </button>
                </div>
              )}
            </div>
          </div>
        ));

  return (
    <div className="h-full overflow-y-auto" data-testid="email-list">
      {items.length > 0 ? items : <div className="p-4 text-sm text-gray-500">{emptyMessage}</div>}
      <div ref={bottomRef} className="h-1" />
    </div>
  );
}

