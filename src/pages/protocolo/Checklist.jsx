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
import useTranslations from '../../hooks/useTranslations';
import CeremonyChecklist from '../../components/protocolo/CeremonyChecklist';

export default function Checklist() {
  const { t } = useTranslations();
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
      title: t('common.protocol.checklist.manualDefaults.specialGifts'),
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

  const statusLabels = useMemo(
    () => ({
      [ITEM_STATUS.PENDING]: t('common.protocol.checklist.statuses.pending'),
      [ITEM_STATUS.IN_PROGRESS]: t('common.protocol.checklist.statuses.in-progress'),
      [ITEM_STATUS.DONE]: t('common.protocol.checklist.statuses.done'),
    }),
    [ITEM_STATUS, t]
  );

  const categoryLabels = useMemo(
    () => ({
      documentation: t('common.protocol.checklist.categories.documentation'),
      providers: t('common.protocol.checklist.categories.providers'),
      ceremony: t('common.protocol.checklist.categories.ceremony'),
      contingency: t('common.protocol.checklist.categories.contingency'),
      personal: t('common.protocol.checklist.categories.personal'),
      technical: t('common.protocol.checklist.categories.technical'),
    }),
    [t]
  );

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
      const statusLabel = statusLabels[status] || status;
      toast.success(
        t('common.protocol.checklist.toasts.statusUpdated', {
          label: item.label,
          status: statusLabel,
        })
      );
    }
  }, [setItemStatus, items, statusLabels, t]);

  // Añadir nuevo ítem personalizado
  const handleAddCustomItem = useCallback(() => {
    const { label, category, dueDate } = newItemData;

    if (!label.trim()) {
      toast.error(t('common.protocol.checklist.toasts.missingName'));
      return;
    }

    try {
      const newItem = addCustomItem(label, category, dueDate || null);
      toast.success(
        t('common.protocol.checklist.toasts.customAdded', {
          label,
        })
      );
      setShowAddModal(false);
      setNewItemData({ label: '', category: CATEGORIES.PERSONAL, dueDate: '' });
    } catch (error) {
      toast.error(error.message);
    }
  }, [newItemData, addCustomItem, CATEGORIES, t]);

  // Eliminar �tem personalizado
  const handleRemoveCustomItem = useCallback((itemId) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (confirm(t('common.protocol.checklist.prompts.deleteCustom', { label: item.label }))) {
      try {
        removeCustomItem(itemId);
        toast.success(t('common.protocol.checklist.toasts.customRemoved'));
      } catch (error) {
        toast.error(error.message);
      }
    }
  }, [items, removeCustomItem, t]);

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
    toast.success(t('common.protocol.checklist.toasts.exported'));
  }, [items, summary, readiness, activeWedding, t]);

  // Importar checklist
  const handleImport = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.items || !Array.isArray(data.items)) {
          throw new Error(t('common.protocol.checklist.toasts.importFormat'));
        }

        // Importar solo �tems personalizados
        const customItems = data.items.filter(item => item.custom);
        customItems.forEach(item => {
          try {
            addCustomItem(item.label, item.category, item.dueDate);
          } catch (error) {
            console.warn(t('common.protocol.checklist.import.warn', { label: item.label }));
          }
        });

        toast.success(
          t('common.protocol.checklist.toasts.imported', { count: customItems.length })
        );
      } catch (error) {
        toast.error(t('common.protocol.checklist.toasts.importError'));
      }
    };
    reader.readAsText(file);
  }, [addCustomItem, t]);

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
  const renderCategoryLabel = useCallback(
    (category) => categoryLabels[category] || category,
    [categoryLabels]
  );

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
                  {t('common.protocol.checklist.badges.critical')}
                </Badge>
              )}
              {item.custom && (
                <Badge type="info" size="sm">
                  {t('common.protocol.checklist.badges.custom')}
                </Badge>
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
                {t('common.protocol.checklist.labels.due')} {formatDate(item.dueDate, 'short')}
                {isOverdue && (
                  <span className="text-red-600 ml-2">
                    {t('common.protocol.checklist.labels.overdue')}
                  </span>
                )}
              </div>
            )}

            {/* Notas */}
            {isEditing ? (
              <textarea
                className="w-full mt-2 p-2 border rounded text-sm"
                placeholder={t('common.protocol.checklist.labels.notesPlaceholder')}
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
                <div className="text-xs text-gray-500 mb-1">
                  {t('common.protocol.checklist.labels.documents')}
                </div>
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
              title={t('common.protocol.checklist.tooltips.markCritical')}
            >
              <Flag size={16} />
            </button>
            <button
              onClick={() => setEditingItem(isEditing ? null : item.id)}
              className="p-1 text-gray-400 hover:text-blue-600"
              title={
                isEditing
                  ? t('common.protocol.checklist.tooltips.save')
                  : t('common.protocol.checklist.tooltips.edit')
              }
            >
              {isEditing ? <CheckCircle size={16} /> : <Edit2 size={16} />}
            </button>
            {item.custom && (
              <button
                onClick={() => handleRemoveCustomItem(item.id)}
                className="p-1 text-gray-400 hover:text-red-600"
                title={t('common.protocol.checklist.tooltips.delete')}
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
    t,
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
    <Modal
      open={showAddModal}
      title={t('common.protocol.checklist.addModal.title')}
      onClose={() => setShowAddModal(false)}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('common.protocol.checklist.addModal.nameLabel')}
          </label>
          <input
            type="text"
            value={newCheckpoint.title}
            onChange={(e) => setNewCheckpoint((c) => ({ ...c, title: e.target.value }))}
            placeholder={t('common.protocol.checklist.addModal.namePlaceholder')}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('common.protocol.checklist.addModal.notesLabel')}
          </label>
          <textarea
            value={newCheckpoint.notes}
            onChange={(e) => setNewCheckpoint((c) => ({ ...c, notes: e.target.value }))}
            placeholder={t('common.protocol.checklist.addModal.notesPlaceholder')}
            className="w-full p-2 border rounded"
            rows="2"
          ></textarea>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            onClick={() => setShowAddModal(false)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800"
          >
            {t('common.app.cancel')}
          </Button>
          <Button onClick={addManualCheckpoint} disabled={!newCheckpoint.title.trim()}>
            {t('common.app.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );

  return (
    <PageWrapper title={t('common.protocol.checklist.title')}>
      <CeremonyChecklist />

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-gray-600">{t('common.protocol.checklist.description')}</p>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowAddModal(true)} leftIcon={<Plus size={16} />}>
              {t('common.protocol.checklist.buttons.addCheckpoint')}
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
                <div className="font-medium">
                  {t('common.protocol.checklist.providersCard.title')}
                </div>
              </div>
              <Link to="/proveedores" className="text-sm text-blue-600 underline">
                {t('common.protocol.checklist.buttons.view')}
              </Link>
            </div>
            <div className="mt-2 text-sm text-gray-700">
              {providersLoading ? (
                <span>{t('common.app.loading')}</span>
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
                        <span className="font-semibold">
                          {t('common.protocol.checklist.providersCard.confirmed')}
                        </span>{' '}
                        {confirmed}/{total}
                      </div>
                      {pending > 0 && (
                        <div className="text-amber-600">
                          {t('common.protocol.checklist.providersCard.pending', { count: pending })}
                        </div>
                      )}
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
                <div className="font-medium">
                  {t('common.protocol.checklist.momentsCard.title')}
                </div>
              </div>
              <Link to="/protocolo/momentos-especiales" className="text-sm text-blue-600 underline">
                {t('common.protocol.checklist.buttons.view')}
              </Link>
            </div>
            <div className="mt-2 text-sm text-gray-700">
              <div>
                <span className="font-semibold">
                  {t('common.protocol.checklist.momentsCard.assigned')}
                </span>{' '}
                {momentsStats.withSong}/
                {momentsStats.total}
              </div>
              {momentsStats.total > 0 && momentsStats.withSong < momentsStats.total && (
                <div className="text-amber-600">
                  {t('common.protocol.checklist.momentsCard.missing', {
                    count: momentsStats.total - momentsStats.withSong,
                  })}
                </div>
              )}
              {momentsStats.total === 0 && (
                <div className="text-gray-500">
                  {t('common.protocol.checklist.momentsCard.empty')}
                </div>
              )}
            </div>
          </Card>

          {/* Checkpoints manuales */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">
                {t('common.protocol.checklist.labels.manualTitle')}
              </div>
            </div>
            <div className="mt-2">
              {!Array.isArray(manualChecks) || manualChecks.length === 0 ? (
                <div className="text-sm text-gray-500">
                  {t('common.protocol.checklist.manual.empty', {
                    button: t('common.protocol.checklist.buttons.addCheckpoint'),
                  })}
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
                        title={
                          item.done
                            ? t('common.protocol.checklist.manual.togglePending')
                            : t('common.protocol.checklist.manual.toggleDone')
                        }
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
                        title={t('common.protocol.checklist.manual.removeTooltip')}
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
