import { CheckCircle, Circle, Trash2, Plus, Music2, Users } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Modal from '../../components/Modal';
import PageWrapper from '../../components/PageWrapper';
import { Card } from '../../components/ui';
import { Button } from '../../components/ui';
import { useWedding } from '../../context/WeddingContext';
import { useProveedores } from '../../hooks/useProveedores';
import useSpecialMoments from '../../hooks/useSpecialMoments';
import CeremonyChecklist from '../../components/protocolo/CeremonyChecklist';

export default function Checklist() {
  const { activeWedding } = useWedding();
  const [showAddModal, setShowAddModal] = useState(false);

  // Proveedores
  const { providers, loadProviders, loading: providersLoading } = useProveedores();
  useEffect(() => {
    try {
      loadProviders?.();
    } catch {}
  }, [loadProviders]);

  // Momentos especiales
  const { moments } = useSpecialMoments();
  const momentsStats = useMemo(() => {
    const blocks = Object.values(moments || {});
    const total = blocks.reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
    const withSong = blocks.reduce(
      (acc, arr) =>
        acc + (Array.isArray(arr) ? arr.filter((m) => (m.song || '').trim()).length : 0),
      0
    );
    return { total, withSong };
  }, [moments]);

  // Checkpoints manuales (localStorage por boda)
  const MANUAL_LS_KEY = useMemo(
    () => `mywed360_manual_checkpoints_${activeWedding || 'general'}`,
    [activeWedding]
  );
  const [manualChecks, setManualChecks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(MANUAL_LS_KEY) || '[]');
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(MANUAL_LS_KEY, JSON.stringify(manualChecks || []));
    } catch {}
  }, [MANUAL_LS_KEY, manualChecks]);
  useEffect(() => {
    if (!Array.isArray(manualChecks) || manualChecks.length) return;
    setManualChecks([
      {
        id: Date.now(),
        title: 'Regalos para momentos especiales preparados',
        notes: '',
        done: false,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modal Crear
  const [newCheckpoint, setNewCheckpoint] = useState({ title: '', notes: '' });
  const addManualCheckpoint = () => {
    const title = (newCheckpoint.title || '').trim();
    if (!title) return;
    setManualChecks((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      { id: Date.now(), title, notes: (newCheckpoint.notes || '').trim(), done: false },
    ]);
    setNewCheckpoint({ title: '', notes: '' });
    setShowAddModal(false);
  };

  const AddCheckpointModal = () => (
    <Modal open={showAddModal} title="Añadir checkpoint" onClose={() => setShowAddModal(false)}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del checkpoint
          </label>
          <input
            type="text"
            value={newCheckpoint.title}
            onChange={(e) => setNewCheckpoint((c) => ({ ...c, title: e.target.value }))}
            placeholder="Ej: Regalos preparados para los momentos especiales"
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
          <textarea
            value={newCheckpoint.notes}
            onChange={(e) => setNewCheckpoint((c) => ({ ...c, notes: e.target.value }))}
            placeholder="Detalles o recordatorios"
            className="w-full p-2 border rounded"
            rows="2"
          ></textarea>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            onClick={() => setShowAddModal(false)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800"
          >
            Cancelar
          </Button>
          <Button onClick={addManualCheckpoint} disabled={!newCheckpoint.title.trim()}>
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );

  return (
    <PageWrapper title="Checklist de última hora">
      <CeremonyChecklist />

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-gray-600">Resumen rápido de lo imprescindible a última hora.</p>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowAddModal(true)} leftIcon={<Plus size={16} />}>
              Añadir checkpoint
            </Button>
          </div>
        </div>

        {/* Resumen clave */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {/* Proveedores */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-blue-600" />
                <div className="font-medium">Proveedores</div>
              </div>
              <Link to="/proveedores" className="text-sm text-blue-600 underline">
                Ver
              </Link>
            </div>
            <div className="mt-2 text-sm text-gray-700">
              {providersLoading ? (
                <span>Cargando…</span>
              ) : (
                (() => {
                  const total = providers?.length || 0;
                  const confirmed = (providers || []).filter(
                    (p) => String(p.status || '').toLowerCase() === 'confirmado'
                  ).length;
                  const pending = Math.max(0, total - confirmed);
                  return (
                    <div className="space-y-1">
                      <div>
                        <span className="font-semibold">Confirmados:</span> {confirmed}/{total}
                      </div>
                      {pending > 0 && <div className="text-amber-600">Pendientes: {pending}</div>}
                    </div>
                  );
                })()
              )}
            </div>
          </Card>

          {/* Música momentos especiales */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music2 size={18} className="text-purple-600" />
                <div className="font-medium">Momentos (música)</div>
              </div>
              <Link to="/protocolo/momentos-especiales" className="text-sm text-blue-600 underline">
                Ver
              </Link>
            </div>
            <div className="mt-2 text-sm text-gray-700">
              <div>
                <span className="font-semibold">Canciones asignadas:</span> {momentsStats.withSong}/
                {momentsStats.total}
              </div>
              {momentsStats.total > 0 && momentsStats.withSong < momentsStats.total && (
                <div className="text-amber-600">
                  Faltan por asignar: {momentsStats.total - momentsStats.withSong}
                </div>
              )}
              {momentsStats.total === 0 && (
                <div className="text-gray-500">Sin momentos configurados</div>
              )}
            </div>
          </Card>

          {/* Checkpoints manuales */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Checkpoints manuales</div>
            </div>
            <div className="mt-2">
              {!Array.isArray(manualChecks) || manualChecks.length === 0 ? (
                <div className="text-sm text-gray-500">
                  Añade checkpoints con el botón “Añadir checkpoint”.
                </div>
              ) : (
                <ul className="space-y-2">
                  {manualChecks.map((item) => (
                    <li
                      key={item.id}
                      className={`p-2 border rounded flex items-start gap-2 ${item.done ? 'bg-gray-50' : 'bg-white'}`}
                    >
                      <button
                        className={`mt-0.5 ${item.done ? 'text-green-600' : 'text-gray-400 hover:text-blue-500'}`}
                        onClick={() =>
                          setManualChecks((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i))
                          )
                        }
                        title={item.done ? 'Marcar pendiente' : 'Marcar listo'}
                      >
                        {item.done ? <CheckCircle size={18} /> : <Circle size={18} />}
                      </button>
                      <div className="flex-1">
                        <div
                          className={`text-sm ${item.done ? 'line-through text-gray-500' : 'text-gray-800'}`}
                        >
                          {item.title}
                        </div>
                        {item.notes && (
                          <div className="text-xs text-gray-500 mt-0.5">{item.notes}</div>
                        )}
                      </div>
                      <button
                        className="p-1 text-gray-500 hover:text-red-600"
                        title="Eliminar"
                        onClick={() =>
                          setManualChecks((prev) => prev.filter((i) => i.id !== item.id))
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>

        {/* Modal para añadir checkpoint */}
        <AddCheckpointModal />
      </div>
    </PageWrapper>
  );
}
