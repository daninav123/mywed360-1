import React, { useMemo, useState } from 'react';
import { useEffect, useCallback } from 'react';
import { db } from '../../firebaseConfig';
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { X, Edit3, CalendarPlus, Trash2, CheckCircle2, Circle, MessageSquare } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import * as notificationService from '../../services/notificationService';

const fmtDateTimeLocal = (d) => {
  try {
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = dt.getFullYear();
    const mm = pad(dt.getMonth() + 1);
    const dd = pad(dt.getDate());
    const hh = pad(dt.getHours());
    const mi = pad(dt.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  } catch {
    return '';
  }
};

const toDate = (v, fallback) => {
  try {
    if (!v) return fallback || null;
    if (v instanceof Date) return v;
    if (typeof v?.toDate === 'function') return v.toDate();
    const d = new Date(v);
    return isNaN(d.getTime()) ? (fallback || null) : d;
  } catch {
    return fallback || null;
  }
};

const MENTION_REGEX = /@([^\s@]+)/g;

const formatRelativeComment = (value) => {
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.round(diffMs / 60000);
    if (minutes <= 0) return 'hace instantes';
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `hace ${hours} h`;
    const days = Math.round(hours / 24);
    if (days < 7) return `hace ${days} d`;
    return date.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '';
  }
};

export default function TaskSidePanel({
  isOpen,
  onClose,
  weddingId,
  parent,
  subtasks = [],
}) {
  const { currentUser, userProfile } = useAuth();
  const userId = currentUser?.uid || userProfile?.id || 'anon';
  const userName = userProfile?.name || currentUser?.displayName || 'Colaborador';

  const [editingParentStart, setEditingParentStart] = useState(false);
  const [parentStartValue, setParentStartValue] = useState(() => fmtDateTimeLocal(toDate(parent?.start)));
  const [editingParentEnd, setEditingParentEnd] = useState(false);
  const [parentEndValue, setParentEndValue] = useState(() => fmtDateTimeLocal(toDate(parent?.end)));

  const [newSubTitle, setNewSubTitle] = useState('');

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  const parentLabel = useMemo(() => parent?.title || parent?.name || 'tarea', [parent?.title, parent?.name]);
  const parentStartDate = useMemo(() => toDate(parent?.start), [parent?.start]);
  const parentEndDate = useMemo(() => toDate(parent?.end), [parent?.end]);

  const formatDisplayDate = useCallback((value) => {
    try {
      if (!value || !(value instanceof Date) || Number.isNaN(value.getTime())) return '';
      return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
    } catch {
      return value?.toLocaleString?.() || '';
    }
  }, []);

  const renderNoDateBadge = useCallback(
    (label = 'Sin fecha programada') => (
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
        {label}
      </span>
    ),
    []
  );

  useEffect(() => {
    setParentStartValue(fmtDateTimeLocal(toDate(parent?.start)));
    setParentEndValue(fmtDateTimeLocal(toDate(parent?.end)));
    setEditingParentStart(false);
    setEditingParentEnd(false);
  }, [parent?.id]);

  useEffect(() => {
    if (!isOpen || !weddingId || !parent?.id || !db) {
      setComments([]);
      setLoadingComments(false);
      return undefined;
    }
    setLoadingComments(true);
    setCommentError('');
    const commentsRef = collection(db, 'weddings', weddingId, 'tasks', parent.id, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const next = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() || {};
            const createdAt =
              data.createdAt && typeof data.createdAt.toDate === 'function'
                ? data.createdAt.toDate()
                : data.createdAt
                  ? new Date(data.createdAt)
                  : null;
            return {
              id: docSnap.id,
              body: data.body || '',
              mentions: Array.isArray(data.mentions) ? data.mentions : [],
              authorId: data.authorId || '',
              authorName: data.authorName || 'Equipo',
              createdAt,
            };
          });
          setComments(next);
        } catch (error) {
          // console.error('Error procesando comentarios de tarea:', error);
          setComments([]);
          setCommentError('No se pudieron procesar los comentarios.');
        } finally {
          setLoadingComments(false);
        }
      },
      (error) => {
        // console.error('Error cargando comentarios de tarea:', error);
        setComments([]);
        setLoadingComments(false);
        setCommentError('No se pudieron cargar los comentarios.');
      }
    );
    return () => unsubscribe();
  }, [isOpen, weddingId, parent?.id, db]);

  useEffect(() => {
    if (!isOpen) {
      setCommentDraft('');
      setCommentError('');
    }
  }, [isOpen, parent?.id]);

  const sortedSubs = useMemo(() => {
    const list = Array.isArray(subtasks) ? subtasks.slice() : [];
    list.sort((a, b) => {
      const aDone = a?.done ? 1 : 0;
      const bDone = b?.done ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      const aTitle = String(a?.title || a?.name || '').toLowerCase();
      const bTitle = String(b?.title || b?.name || '').toLowerCase();
      return aTitle.localeCompare(bTitle);
    });
    return list;
  }, [subtasks]);

  const updateParentStart = async () => {
    try {
      if (!weddingId || !parent?.id) return;
      const dt = new Date(parentStartValue);
      if (isNaN(dt.getTime())) return;
      await updateDoc(doc(db, 'weddings', weddingId, 'tasks', parent.id), {
        start: dt,
        updatedAt: serverTimestamp(),
      });
      setEditingParentStart(false);
    } catch (e) {
      // console.error('Error actualizando inicio de tarea padre:', e);
    }
  };

  const updateParentEnd = async () => {
    try {
      if (!weddingId || !parent?.id) return;
      const dt = new Date(parentEndValue);
      if (isNaN(dt.getTime())) return;
      await updateDoc(doc(db, 'weddings', weddingId, 'tasks', parent.id), {
        end: dt,
        updatedAt: serverTimestamp(),
      });
      setEditingParentEnd(false);
    } catch (e) {
      // console.error('Error actualizando fin de tarea padre:', e);
    }
  };

  const toggleSubDone = async (sub) => {
    try {
      const ref = doc(db, 'weddings', weddingId, 'tasks', parent.id, 'subtasks', sub.id);
      await updateDoc(ref, {
        done: !sub.done,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      // console.error('Error alternando done en subtarea:', e);
    }
  };

  const addSubtask = async () => {
    try {
      if (!newSubTitle.trim()) return;
      const payload = {
        title: newSubTitle.trim(),
        name: newSubTitle.trim(),
        progress: 0,
        done: false,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'weddings', weddingId, 'tasks', parent.id, 'subtasks'), payload);
      setNewSubTitle('');
    } catch (e) {
      // console.error('Error creando subtarea:', e);
    }
  };

  const removeSubtask = async (sub) => {
    try {
      await deleteDoc(doc(db, 'weddings', weddingId, 'tasks', parent.id, 'subtasks', sub.id));
    } catch (e) {
      // console.error('Error eliminando subtarea:', e);
    }
  };

  const renderCommentBody = useCallback((body) => {
    if (!body) return null;
    const nodes = [];
    const regex = new RegExp(MENTION_REGEX.source, 'g');
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(body)) !== null) {
      if (match.index > lastIndex) nodes.push(body.slice(lastIndex, match.index));
      nodes.push({ mention: match[1], text: match[0] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < body.length) nodes.push(body.slice(lastIndex));
    return nodes.map((node, idx) =>
      typeof node === 'string' ? (
        <React.Fragment key={`txt-${idx}`}>{node}</React.Fragment>
      ) : (
        <span key={`men-${idx}`} className="text-indigo-600 font-medium">
          {node.text}
        </span>
      )
    );
  }, []);

  const handleSubmitComment = useCallback(async () => {
    const body = commentDraft.trim();
    if (!body || !weddingId || !parent?.id) return;
    setSendingComment(true);
    setCommentError('');
    try {
      const regex = new RegExp(MENTION_REGEX.source, 'g');
      const mentions = [];
      let match;
      while ((match = regex.exec(body)) !== null) {
        const mention = match[1]?.trim();
        if (mention) mentions.push(mention);
      }
      const uniqueMentions = Array.from(new Set(mentions));
      const commentsRef = collection(db, 'weddings', weddingId, 'tasks', parent.id, 'comments');
      await addDoc(commentsRef, {
        body,
        mentions: uniqueMentions,
        authorId: userId,
        authorName: userName,
        createdAt: serverTimestamp(),
      });
      setCommentDraft('');
      const recipients =
        uniqueMentions.length > 0
          ? uniqueMentions
          : Array.isArray(parent?.assignees)
            ? parent.assignees.filter(Boolean)
            : [];
      try {
        await notificationService.addNotification({
          type: uniqueMentions.length ? 'warning' : 'info',
          message:
            uniqueMentions.length > 0
              ? `Nuevo comentario en ${parentLabel} con menciones a ${uniqueMentions.join(', ')}`
              : `Nuevo comentario en ${parentLabel}`,
          action: 'viewTask',
          trackingId: parent?.id || undefined,
          weddingId,
          category: 'tasks',
          severity: uniqueMentions.length ? 'medium' : 'low',
          source: 'task_comment',
          payload: {
            weddingId,
            taskId: parent?.id || null,
            mentions: uniqueMentions,
            kind: 'task_comment',
          },
        });
      } catch (error) {
        // console.warn('No se pudo registrar la notificacion remota del comentario', error);
      }

      notificationService.showNotification({
        title: 'Comentario agregado',
        message:
          recipients.length > 0
            ? `Notificaremos a: ${recipients.join(', ')}`
            : 'El comentario queda registrado para el equipo',
        type: 'success',
      });
    } catch (error) {
      setCommentError('No se pudo guardar tu comentario. Intentalo de nuevo.');
    } finally {
      setSendingComment(false);
    }
  }, [commentDraft, weddingId, parent?.id, userId, userName, parent?.assignees, parentLabel]);

  const handleDeleteComment = useCallback(
    async (commentId) => {
      if (!commentId || !weddingId || !parent?.id) return;
      try {
        await deleteDoc(doc(db, 'weddings', weddingId, 'tasks', parent.id, 'comments', commentId));
      } catch (error) {
        // console.error('Error eliminando comentario de tarea:', error);
        setCommentError('No se pudo eliminar el comentario.');
      }
    },
    [weddingId, parent?.id]
  );

  const handleCommentKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        handleSubmitComment();
      }
    },
    [handleSubmitComment]
  );

  if (!isOpen || !parent?.id) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1" onClick={onClose} aria-hidden />
      <aside className="w-full sm:w-[420px] h-full bg-white shadow-2xl border-l border-gray-200 p-4 overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{parent?.title || parent?.name || 'Tarea'}</h3>
            <p className="text-sm text-gray-500">Tarea padre " {parent?.category || 'OTROS'}</p>
          </div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose} aria-label="Cerrar panel">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">Inicio</div>
          <div className="flex items-center gap-2">
            {!editingParentStart ? (
              <>
                {parentStartDate ? (
                  <span className="text-gray-800">{formatDisplayDate(parentStartDate)}</span>
                ) : (
                  renderNoDateBadge()
                )}
                <button
                  className="p-1 rounded hover:bg-gray-100"
                  onClick={() => setEditingParentStart(true)}
                  title="Editar inicio"
                >
                  <Edit3 size={16} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  className="border rounded px-2 py-1 text-sm"
                  value={parentStartValue}
                  onChange={(e) => setParentStartValue(e.target.value)}
                />
                <button className="px-2 py-1 text-sm bg-blue-600 text-white rounded" onClick={updateParentStart}>Guardar</button>
                <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={() => setEditingParentStart(false)}>Cancelar</button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">Fin</div>
          <div className="flex items-center gap-2">
            {!editingParentEnd ? (
              <>
                {parentEndDate ? (
                  <span className="text-gray-800">{formatDisplayDate(parentEndDate)}</span>
                ) : (
                  renderNoDateBadge()
                )}
                <button
                  className="p-1 rounded hover:bg-gray-100"
                  onClick={() => setEditingParentEnd(true)}
                  title="Editar fin"
                >
                  <Edit3 size={16} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  className="border rounded px-2 py-1 text-sm"
                  value={parentEndValue}
                  onChange={(e) => setParentEndValue(e.target.value)}
                />
                <button className="px-2 py-1 text-sm bg-blue-600 text-white rounded" onClick={updateParentEnd}>Guardar</button>
                <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={() => setEditingParentEnd(false)}>Cancelar</button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Subtareas</h4>
            <div className="text-xs text-gray-500">{sortedSubs.length} items</div>
          </div>
          <ul className="space-y-2">
            {sortedSubs.map((s) => (
              <li key={s.id} className="border rounded p-2 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      className="p-1 rounded hover:bg-gray-100"
                      onClick={() => toggleSubDone(s)}
                      title={s.done ? 'Marcar como pendiente' : 'Marcar como hecha'}
                    >
                      {s.done ? <CheckCircle2 size={16} className="text-green-600" /> : <Circle size={16} className="text-gray-400" />}
                    </button>
                    <div>
                      <div className="text-sm font-medium">{s.title || s.name || 'Subtarea'}</div>
                      {s.desc && (
                        <div className="mt-1 text-xs text-gray-600">{s.desc}</div>
                      )}
                      {s.assignee && (
                        <div className="mt-1 text-xs text-gray-500">Responsable: {s.assignee}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-70">
                    <button className="p-1 rounded hover:bg-gray-100" onClick={() => removeSubtask(s)} title="Eliminar subtarea">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {sortedSubs.length === 0 && (
              <li className="text-sm text-gray-500">No hay subtareas.</li>
            )}
          </ul>
        </div>

        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-2">
            <CalendarPlus size={18} />
            <span className="text-sm font-medium">Agregar subtarea</span>
          </div>
          <div className="space-y-2">
            <input
              placeholder="Titulo de la subtarea"
              className="w-full border rounded px-2 py-1 text-sm"
              value={newSubTitle}
              onChange={(e) => setNewSubTitle(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={addSubtask}
                disabled={!newSubTitle.trim()}
              >
                Agregar
              </button>
              <button
                type="button"
                className="px-3 py-1.5 bg-gray-100 text-sm rounded"
                onClick={() => setNewSubTitle('')}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
        <div className="border-t mt-6 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-indigo-500" />
              <h4 className="font-medium">Comentarios</h4>
            </div>
            <span className="text-xs text-gray-500">{comments.length}</span>
          </div>

          {commentError && (
            <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
              {commentError}
            </div>
          )}

          {loadingComments ? (
            <p className="text-sm text-gray-500 mb-3">Cargando comentarios...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-500 mb-3">
              Aun no hay comentarios en este bloque. Usa @ para mencionar responsables.
            </p>
          ) : (
            <ul className="space-y-3 mb-4 max-h-56 overflow-y-auto pr-1">
              {comments.map((comment) => (
                <li key={comment.id} className="border border-gray-200 rounded-md px-3 py-2 shadow-sm bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {comment.authorName || 'Equipo'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatRelativeComment(comment.createdAt)}
                      </div>
                    </div>
                    {comment.authorId === userId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar comentario"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap mt-2 leading-relaxed">
                    {renderCommentBody(comment.body)}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2">
            <textarea
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Escribe un comentario... Usa @ para mencionar a alguien"
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              onKeyDown={handleCommentKeyDown}
              disabled={sendingComment}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Ctrl/Cmd + Enter para enviar</span>
              <button
                type="button"
                onClick={handleSubmitComment}
                disabled={sendingComment || !commentDraft.trim()}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sendingComment ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
