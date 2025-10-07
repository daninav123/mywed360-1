import React, { useMemo, useState } from 'react';
import { db } from '../../firebaseConfig';
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { X, Edit3, CalendarPlus, Trash2, CheckCircle2, Circle } from 'lucide-react';

const fmtDateTimeLocal = (d) => {
  try {
    const dt = d instanceof Date ?d : new Date(d);
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
    return isNaN(d.getTime()) ?(fallback || null) : d;
  } catch {
    return fallback || null;
  }
};

export default function TaskSidePanel({
  isOpen,
  onClose,
  weddingId,
  parent,
  subtasks = [],
}) {
  const [editingParentStart, setEditingParentStart] = useState(false);
  const [parentStartValue, setParentStartValue] = useState(() => fmtDateTimeLocal(toDate(parent?.start)));
  const [editingParentEnd, setEditingParentEnd] = useState(false);
  const [parentEndValue, setParentEndValue] = useState(() => fmtDateTimeLocal(toDate(parent?.end)));

  const [newSubTitle, setNewSubTitle] = useState('');
  const [newSubStart, setNewSubStart] = useState('');
  const [newSubEnd, setNewSubEnd] = useState('');

  React.useEffect(() => {
    setParentStartValue(fmtDateTimeLocal(toDate(parent?.start)));
    setParentEndValue(fmtDateTimeLocal(toDate(parent?.end)));
    setEditingParentStart(false);
    setEditingParentEnd(false);
  }, [parent?.id]);

  const sortedSubs = useMemo(() => {
    const list = Array.isArray(subtasks) ?subtasks.slice() : [];
    list.sort((a, b) => (toDate(a.start)?.getTime() || 0) - (toDate(b.start)?.getTime() || 0));
    return list;
  }, [subtasks]);

  if (!isOpen) return null;

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
      console.error('Error actualizando inicio de tarea padre:', e);
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
      console.error('Error actualizando fin de tarea padre:', e);
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
      console.error('Error alternando done en subtarea:', e);
    }
  };

  const updateSubStart = async (sub, newVal) => {
    try {
      const dt = new Date(newVal);
      if (isNaN(dt.getTime())) return;
      const ref = doc(db, 'weddings', weddingId, 'tasks', parent.id, 'subtasks', sub.id);
      await updateDoc(ref, { start: dt, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error('Error actualizando inicio de subtarea:', e);
    }
  };

  const updateSubEnd = async (sub, newVal) => {
    try {
      const dt = new Date(newVal);
      if (isNaN(dt.getTime())) return;
      const ref = doc(db, 'weddings', weddingId, 'tasks', parent.id, 'subtasks', sub.id);
      await updateDoc(ref, { end: dt, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error('Error actualizando fin de subtarea:', e);
    }
  };

  const addSubtask = async () => {
    try {
      if (!newSubTitle.trim()) return;
      const start = newSubStart ?new Date(newSubStart) : new Date();
      const end = newSubEnd ?new Date(newSubEnd) : new Date(start.getTime() + 60*60*1000);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
      await addDoc(collection(db, 'weddings', weddingId, 'tasks', parent.id, 'subtasks'), {
        title: newSubTitle.trim(),
        name: newSubTitle.trim(),
        start,
        end,
        progress: 0,
        done: false,
        createdAt: serverTimestamp(),
      });
      setNewSubTitle('');
      setNewSubStart('');
      setNewSubEnd('');
    } catch (e) {
      console.error('Error creando subtarea:', e);
    }
  };

  const removeSubtask = async (sub) => {
    try {
      await deleteDoc(doc(db, 'weddings', weddingId, 'tasks', parent.id, 'subtasks', sub.id));
    } catch (e) {
      console.error('Error eliminando subtarea:', e);
    }
  };

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
            {!editingParentStart ?(
              <>
                <span className="text-gray-800">{toDate(parent?.start)?.toLocaleString() || ''}</span>
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
            {!editingParentEnd ?(
              <>
                <span className="text-gray-800">{toDate(parent?.end)?.toLocaleString() || ''}</span>
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
            <div className="text-xs text-gray-500">{sortedSubs.length} ?tems</div>
          </div>
          <ul className="space-y-2">
            {sortedSubs.map((s) => (
              <li key={s.id} className="border rounded p-2 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      className="p-1 rounded hover:bg-gray-100"
                      onClick={() => toggleSubDone(s)}
                      title={s.done ?'Marcar como pendiente' : 'Marcar como hecha'}
                    >
                      {s.done ?<CheckCircle2 size={16} className="text-green-600" /> : <Circle size={16} className="text-gray-400" />}
                    </button>
                    <div>
                      <div className="text-sm font-medium">{s.title || s.name || 'Subtarea'}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                        <span>Inicio:</span>
                        <input
                          type="datetime-local"
                          className="border rounded px-1 py-0.5"
                          value={fmtDateTimeLocal(toDate(s.start))}
                          onChange={(e) => updateSubStart(s, e.target.value)}
                          title="Editar inicio"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                        <span>Fin:</span>
                        <input
                          type="datetime-local"
                          className="border rounded px-1 py-0.5"
                          value={fmtDateTimeLocal(toDate(s.end))}
                          onChange={(e) => updateSubEnd(s, e.target.value)}
                          title="Editar fin"
                        />
                      </div>
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
            <span className="text-sm font-medium">A?adir subtarea</span>
          </div>
          <div className="space-y-2">
            <input
              placeholder="T?tulo de la subtarea"
              className="w-full border rounded px-2 py-1 text-sm"
              value={newSubTitle}
              onChange={(e) => setNewSubTitle(e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Inicio</label>
                <input type="datetime-local" className="w-full border rounded px-2 py-1 text-sm" value={newSubStart} onChange={(e) => setNewSubStart(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fin</label>
                <input type="datetime-local" className="w-full border rounded px-2 py-1 text-sm" value={newSubEnd} onChange={(e) => setNewSubEnd(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded" onClick={addSubtask}>A?adir</button>
              <button className="px-3 py-1.5 bg-gray-100 text-sm rounded" onClick={() => { setNewSubTitle(''); setNewSubStart(''); setNewSubEnd(''); }}>Limpiar</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

