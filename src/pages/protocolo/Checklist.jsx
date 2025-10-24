import {
  CheckCircle,
  Circle,
  Clock,
  Trash2,
  Plus,
  Music2,
  Users,
  FileText,
  AlertCircle,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit2,
  X,
  Shield,
  Settings,
  Download,
  Upload,
  CheckSquare,
  Square,
  Flag,
} from 'lucide-react';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import Modal from '../../components/Modal';
import PageWrapper from '../../components/PageWrapper';
import { Card } from '../../components/ui';
import { Button } from '../../components/ui';
import Badge from '../../components/ui/Badge';
import { useWedding } from '../../context/WeddingContext';
import { formatDate } from '../../utils/formatUtils';
import { useProveedores } from '../../hooks/useProveedores';
import useSpecialMoments from '../../hooks/useSpecialMoments';
import useChecklist from '../../hooks/useChecklist';
import CeremonyChecklist from '../../components/protocolo/CeremonyChecklist';

export default function Checklist() {
  const { activeWedding } = useWedding();
  
  // Hook del checklist
  const {
    items,
    documents,
    loading,
    syncInProgress,
    updateItem,
    addCustomItem,
    removeCustomItem,
    setItemStatus,
    setItemNotes,
    setItemDueDate,
    toggleItemCritical,
    getItemDocuments,
    getChecklistSummary,
    validateReadiness,
    CATEGORIES,
    ITEM_STATUS,
    STATUS_COLORS,
    MAX_CUSTOM_ITEMS,
  } = useChecklist();

  // Estados locales
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showSummaryPanel, setShowSummaryPanel] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [manualChecks, setManualChecks] = useState(() => [
    {
      id: 'manual-check-1',
      title: 'Regalos para momentos especiales preparados',
      notes: '',
      done: false,
    },
  ]);

  // Datos del nuevo �tem
  const [newItemData, setNewItemData] = useState({
    label: '',
    category: CATEGORIES.PERSONAL,
    dueDate: '',
  });

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

  // Resumen del checklist
  const summary = useMemo(() => getChecklistSummary(), [getChecklistSummary]);
  const readiness = useMemo(() => validateReadiness(), [validateReadiness]);

  // Filtrar �tems
  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Filtro por estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    // Filtro por categor�a
    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory);
    }

    // B�squeda por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.label.toLowerCase().includes(term) ||
        (item.notes && item.notes.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [items, filterStatus, filterCategory, searchTerm]);

  // Agrupar �tems por categor�a
  const groupedItems = useMemo(() => {
    const groups = {};
    Object.values(CATEGORIES).forEach(cat => {
      groups[cat] = filteredItems.filter(item => item.category === cat);
    });
    return groups;
  }, [filteredItems, CATEGORIES]);

  // Manejar cambio de estado de �tem
  const handleStatusChange = useCallback((itemId, status) => {
    setItemStatus(itemId, status);
    
    const item = items.find(i => i.id === itemId);
    if (item) {
      const statusText = {
        [ITEM_STATUS.PENDING]: 'pendiente',
        [ITEM_STATUS.IN_PROGRESS]: 'en progreso',
        [ITEM_STATUS.DONE]: 'completado',
      };
      toast.success(`"${item.label}" marcado como ${statusText[status]}`);
    }
  }, [setItemStatus, items, ITEM_STATUS]);

  // A�adir nuevo �tem personalizado
  const handleAddCustomItem = useCallback(() => {
    const { label, category, dueDate } = newItemData;

    if (!label.trim()) {
      toast.error('Ingresa un nombre para el �tem');
      return;
    }

    try {
      const newItem = addCustomItem(label, category, dueDate || null);
      toast.success(`�tem "${label}" a�adido`);
      setShowAddModal(false);
      setNewItemData({ label: '', category: CATEGORIES.PERSONAL, dueDate: '' });
    } catch (error) {
      toast.error(error.message);
    }
  }, [newItemData, addCustomItem, CATEGORIES]);

  // Eliminar �tem personalizado
  const handleRemoveCustomItem = useCallback((itemId) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (confirm(`�Eliminar "${item.label}"?`)) {
      try {
        removeCustomItem(itemId);
        toast.success('�tem eliminado');
      } catch (error) {
        toast.error(error.message);
      }
    }
  }, [items, removeCustomItem]);

  // Exportar checklist
  const handleExport = useCallback(() => {
    const data = {
      date: new Date().toISOString(),
      wedding: activeWedding,
      items: items,
      summary: summary,
      readiness: readiness,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checklist_${activeWedding}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Checklist exportado');
  }, [items, summary, readiness, activeWedding]);

  // Importar checklist
  const handleImport = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.items || !Array.isArray(data.items)) {
          throw new Error('Formato de archivo inv�lido');
        }

        // Importar solo �tems personalizados
        const customItems = data.items.filter(item => item.custom);
        customItems.forEach(item => {
          try {
            addCustomItem(item.label, item.category, item.dueDate);
          } catch (error) {
            console.warn(`No se pudo importar: ${item.label}`);
          }
        });

        toast.success(`${customItems.length} �tems personalizados importados`);
      } catch (error) {
        toast.error('Error al importar el archivo');
      }
    };
    reader.readAsText(file);
  }, [addCustomItem]);

  // Renderizar badge de estado
  const renderStatusBadge = useCallback((status) => {
    const config = {
      [ITEM_STATUS.PENDING]: { icon: Circle, color: 'text-gray-400' },
      [ITEM_STATUS.IN_PROGRESS]: { icon: Clock, color: 'text-yellow-500' },
      [ITEM_STATUS.DONE]: { icon: CheckCircle, color: 'text-green-500' },
    };

    const { icon: Icon, color } = config[status] || config[ITEM_STATUS.PENDING];
    return <Icon className={color} size={20} />;
  }, [ITEM_STATUS]);

  // Renderizar categor�a
  const renderCategoryLabel = useCallback((category) => {
    const labels = {
      [CATEGORIES.DOCUMENTATION]: 'Documentaci�n',
      [CATEGORIES.PROVIDERS]: 'Proveedores',
      [CATEGORIES.CEREMONY]: 'Ceremonia',
      [CATEGORIES.CONTINGENCY]: 'Contingencia',
      [CATEGORIES.PERSONAL]: 'Personal',
      [CATEGORIES.TECHNICAL]: 'T�cnico',
    };
    return labels[category] || category;
  }, [CATEGORIES]);

  // Renderizar �tem del checklist
  const renderChecklistItem = useCallback((item) => {
    const isEditing = editingItem === item.id;
    const itemDocs = getItemDocuments(item.id);
    const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && item.status !== ITEM_STATUS.DONE;

    return (
      <div
        key={item.id}
        className={`p-3 rounded-lg border transition-all ${
          item.status === ITEM_STATUS.DONE ? 'bg-green-50 border-green-200' :
          isOverdue ? 'bg-red-50 border-red-200' :
          'bg-white border-gray-200'
        } hover:shadow-md`}
      >
        <div className="flex items-start gap-3">
          {/* Estado */}
          <button
            onClick={() => {
              const nextStatus = 
                item.status === ITEM_STATUS.PENDING ? ITEM_STATUS.IN_PROGRESS :
                item.status === ITEM_STATUS.IN_PROGRESS ? ITEM_STATUS.DONE :
                ITEM_STATUS.PENDING;
              handleStatusChange(item.id, nextStatus);
            }}
            className="mt-1 flex-shrink-0"
          >
            {renderStatusBadge(item.status)}
          </button>

          {/* Contenido */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${
                item.status === ITEM_STATUS.DONE ? 'line-through text-gray-500' : ''
              }`}>
                {item.label}
              </span>
              {item.critical && (
                <Badge type="error" size="sm">
                  <Shield size={12} className="inline mr-1" />
                  Cr�tico
                </Badge>
              )}
              {item.custom && (
                <Badge type="info" size="sm">Personalizado</Badge>
              )}
              {itemDocs.length > 0 && (
                <Badge type="success" size="sm">
                  <FileText size={12} className="inline mr-1" />
                  {itemDocs.length}
                </Badge>
              )}
            </div>

            {/* Fecha l�mite */}
            {item.dueDate && (
              <div className="text-sm text-gray-600 mt-1">
                <Calendar size={14} className="inline mr-1" />
                Vence: {formatDate(item.dueDate, 'short')}
                {isOverdue && <span className="text-red-600 ml-2">�Vencido!</span>}
              </div>
            )}

            {/* Notas */}
            {isEditing ? (
              <textarea
                className="w-full mt-2 p-2 border rounded text-sm"
                placeholder="A�adir notas..."
                value={item.notes || ''}
                onChange={(e) => setItemNotes(item.id, e.target.value)}
                rows={2}
              />
            ) : (
              item.notes && (
                <div className="text-sm text-gray-600 mt-1">
                  {item.notes}
                </div>
              )
            )}

            {/* Documentos relacionados */}
            {itemDocs.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Documentos:</div>
                <div className="flex flex-wrap gap-1">
                  {itemDocs.map(doc => (
                    <span key={doc.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {doc.name || doc.type}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleItemCritical(item.id)}
              className={`p-1 ${item.critical ? 'text-red-500' : 'text-gray-400'} hover:text-red-600`}
              title="Marcar como cr�tico"
            >
              <Flag size={16} />
            </button>
            <button
              onClick={() => setEditingItem(isEditing ? null : item.id)}
              className="p-1 text-gray-400 hover:text-blue-600"
              title={isEditing ? 'Guardar' : 'Editar'}
            >
              {isEditing ? <CheckCircle size={16} /> : <Edit2 size={16} />}
            </button>
            {item.custom && (
              <button
                onClick={() => handleRemoveCustomItem(item.id)}
                className="p-1 text-gray-400 hover:text-red-600"
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }, [
    editingItem,
    getItemDocuments,
    handleStatusChange,
    handleRemoveCustomItem,
    renderStatusBadge,
    setItemNotes,
    toggleItemCritical,
    ITEM_STATUS,
  ]);

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
    <Modal open={showAddModal} title="A�adir checkpoint" onClose={() => setShowAddModal(false)}>
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
    <PageWrapper title="Checklist de �ltima hora">
      <CeremonyChecklist />

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-gray-600">Resumen r�pido de lo imprescindible a �ltima hora.</p>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowAddModal(true)} leftIcon={<Plus size={16} />}>
              A�adir checkpoint
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
                <span>Cargando&</span>
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

          {/* M�sica momentos especiales */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music2 size={18} className="text-purple-600" />
                <div className="font-medium">Momentos (m�sica)</div>
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
                  A�ade checkpoints con el bot�n A�adir checkpoint.
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

        {/* Modal para a�adir checkpoint */}
        <AddCheckpointModal />
      </div>
    </PageWrapper>
  );
}
