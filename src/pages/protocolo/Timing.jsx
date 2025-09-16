import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui';
import { Button } from '../../components/ui';
import { useWedding } from '../../context/WeddingContext';
import useSpecialMoments from '../../hooks/useSpecialMoments';
import { db } from '../../firebaseConfig';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const Timing = () => {
  const { activeWedding } = useWedding();
  const { moments: specialMoments, addMoment, updateMoment, removeMoment, reorderMoment, moveMoment, duplicateMoment } = useSpecialMoments();
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWedding) return;
    setLoading(true);
    const ref = doc(db, 'weddings', activeWedding);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() || {};
      const t = Array.isArray(data?.timing) ? data.timing : [];
      setTimeline(t);
      setLoading(false);
    });
    return () => unsub();
  }, [activeWedding]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'on-time':
        return 'bg-green-100 text-green-800';
      case 'slightly-delayed':
        return 'bg-blue-100 text-blue-800';
      case 'delayed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'on-time':
        return 'A tiempo';
      case 'slightly-delayed':
        return 'Ligero retraso';
      case 'delayed':
        return 'Retrasado';
      default:
        return 'Sin estado';
    }
  };

  const mapBlockIdToMomentsKey = (blockId) => {
    if (!blockId) return '';
    // Normalizar ids entre timing ('coctel') y momentos ('coctail')
    if (String(blockId).toLowerCase() === 'coctel') return 'coctail';
    return String(blockId).toLowerCase();
  };

  const persistTimeline = async (next) => {
    try {
      if (!activeWedding) return;
      await setDoc(doc(db, 'weddings', activeWedding), { timing: next }, { merge: true });
      setTimeline(next);
    } catch (e) {
      console.error('No se pudo guardar el timing:', e);
    }
  };

  const updateTimingMoment = (blockId, momentId, newTime) => {
    const next = timeline.map((block) => {
      if (block.id !== blockId) return block;
      const moments = Array.isArray(block.moments) ? block.moments : [];
      return {
        ...block,
        moments: moments.map((m) => (m.id === momentId ? { ...m, time: newTime } : m)),
      };
    });
    persistTimeline(next);
  };

  const addMomentToBlock = (blockId) => {
    const next = timeline.map((block) => {
      if (block.id !== blockId) return block;
      const moments = Array.isArray(block.moments) ? block.moments : [];
      const newMoment = {
        id: Date.now(),
        name: `Nuevo momento ${moments.length + 1}`,
        time: '',
        duration: '',
        status: 'on-time',
      };
      return { ...block, moments: [...moments, newMoment] };
    });
    persistTimeline(next);
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Cargando timing...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Timing de la Boda</h1>
        <Button onClick={() => {
          const name = prompt('Nombre del nuevo bloque (ej. Bienvenida)');
          if (!name) return;
          const start = prompt('Hora de inicio (HH:MM)');
          if (start == null) return;
          const end = prompt('Hora de fin (HH:MM)');
          if (end == null) return;
          const slug = String(name).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
          const id = slug || `bloque-${Date.now()}`;
          const next = [...timeline, { id, name, startTime: start, endTime: end, status: 'on-time', moments: [] }];
          persistTimeline(next);
        }}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Añadir Bloque
        </Button>
      </div>

      <Card className="p-4">
        <p className="text-gray-600">
          Organiza la línea de tiempo de tu boda. Este cronograma se genera automáticamente a partir del tutorial
          inicial y puedes ajustarlo aquí.
        </p>
      </Card>

      {timeline.length === 0 ? (
        <Card className="p-4">
          <p className="text-gray-600">Aún no hay bloques de timing. Completa el tutorial inicial o crea los bloques manualmente.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {timeline.map((block) => (
            <Card key={block.id || block.name} className="overflow-hidden">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-medium">{block.name}</h3>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(block.status)}`}>
                    {getStatusLabel(block.status)}
                  </span>
                  <button
                    className="text-sm text-gray-600 hover:underline"
                    onClick={() => {
                      const newStart = prompt('Nueva hora de inicio (HH:MM):', block.startTime || '');
                      if (newStart == null) return;
                      const newEnd = prompt('Nueva hora de fin (HH:MM):', block.endTime || '');
                      if (newEnd == null) return;
                      const next = timeline.map((b) => (b.id === block.id ? { ...b, startTime: newStart, endTime: newEnd } : b));
                      persistTimeline(next);
                    }}
                    title="Editar horas del bloque"
                  >
                    {block.startTime} - {block.endTime}
                  </button>
                </div>
              </div>

              {(() => {
                const key = mapBlockIdToMomentsKey(block.id);
                const list = Array.isArray(specialMoments[key]) ? specialMoments[key] : [];
                if (list.length === 0) {
                  return <div className="px-6 py-3 text-sm text-gray-600">Sin momentos definidos para este bloque.</div>;
                }
                return (
                <div className="divide-y">
                  {list.map((m, idx) => (
                    <div key={m.id} className="p-4 hover:bg-gray-50 transition-colors"
                      draggable
                      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('id', String(m.id)); }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { const draggedId = Number(e.dataTransfer.getData('id')); if (draggedId && draggedId !== m.id) { moveMoment(key, draggedId, idx); } }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor('on-time').split(' ')[0]}`}></div>
                            <input
                              className="font-medium bg-transparent border-b border-dashed focus:outline-none"
                              value={m.title || ''}
                              onChange={(e) => updateMoment(key, m.id, { title: e.target.value })}
                              placeholder="Título del momento"
                            />
                          </div>
                          <div className="ml-6 mt-1 text-sm text-gray-600">
                            <span className="inline-block mr-4">
                              <span className="font-medium">Hora:</span>{' '}
                              <input
                                className="w-20 bg-transparent border-b border-dashed focus:outline-none"
                                placeholder="hh:mm"
                                value={m.time || ''}
                                onChange={(e) => updateMoment(key, m.id, { time: e.target.value })}
                              />
                            </span>
                            <span className="inline-block">
                              <span className="font-medium">Duración:</span>{' '}
                              <input
                                className="w-24 bg-transparent border-b border-dashed focus:outline-none"
                                placeholder="ej. 10 min"
                                value={m.duration || ''}
                                onChange={(e) => updateMoment(key, m.id, { duration: e.target.value })}
                              />
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="text-xs px-2 py-1 bg-gray-100 rounded disabled:opacity-50" disabled={idx===0} onClick={() => reorderMoment(key, m.id, 'up')}>▲</button>
                          <button className="text-xs px-2 py-1 bg-gray-100 rounded disabled:opacity-50" disabled={idx===list.length-1} onClick={() => reorderMoment(key, m.id, 'down')}>▼</button>
                          <button className="p-1 text-red-600 hover:text-red-800" title="Eliminar" onClick={() => removeMoment(key, m.id)}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                );
              })()}

              <div className="px-6 py-3 bg-gray-50 flex justify-between items-center">
                <button
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                  onClick={() => {
                    if (!confirm(`Eliminar bloque "${block.name}"?`)) return;
                    const next = timeline.filter((b) => b.id !== block.id);
                    persistTimeline(next);
                  }}
                >
                  Eliminar bloque
                </button>
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium" onClick={() => {
                  const key = mapBlockIdToMomentsKey(block.id);
                  const current = Array.isArray(specialMoments[key]) ? specialMoments[key] : [];
                  const nextOrder = (current.length || 0) + 1;
                  addMoment(key, { order: nextOrder, title: `Nuevo momento ${nextOrder}`, time: '' });
                }}>
                  + Añadir momento
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-4 bg-blue-50">
        <div className="space-y-2">
          <h3 className="font-medium text-blue-800 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Consejo de planificación
          </h3>
          <p className="text-sm text-blue-700">
            Asegúrate de incluir tiempos de transición entre eventos. Como regla general, añade un 10-15% de tiempo extra a cada bloque para imprevistos.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Timing;
