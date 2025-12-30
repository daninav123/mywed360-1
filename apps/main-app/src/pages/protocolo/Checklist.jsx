import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Download,
  Edit2,
  Flag,
  Music2,
  Printer,
  Share2,
  Shield,
  Trash2,
  Upload,
  Users,
  FileText,
  Plus,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import CeremonyChecklist from '../../components/protocolo/CeremonyChecklist';
import Modal from '../../components/Modal';
import PageWrapper from '../../components/PageWrapper';
import { Button } from '../../components/ui';
import { Card } from '../../components/ui';
import Badge from '../../components/ui/Badge';
import { useWedding } from '../../context/WeddingContext';
import useChecklist from '../../hooks/useChecklist';
import { useProveedores } from '../../hooks/useProveedores';
import useSpecialMoments from '../../hooks/useSpecialMoments';
import useTranslations from '../../hooks/useTranslations';
import { formatDate } from '../../utils/formatUtils';

const MS_IN_MINUTE = 60 * 1000;
const MS_IN_HOUR = 60 * MS_IN_MINUTE;
const MS_IN_DAY = 24 * MS_IN_HOUR;

function parseWeddingDate(raw) {
  if (!raw) return null;
  if (typeof raw.toDate === 'function') {
    try {
      const asDate = raw.toDate();
      if (!Number.isNaN(asDate?.getTime())) return asDate;
    } catch {}
  }
  if (typeof raw.seconds === 'number' && typeof raw.nanoseconds === 'number') {
    const ms = raw.seconds * 1000 + Math.round(raw.nanoseconds / 1_000_000);
    const asDate = new Date(ms);
    if (!Number.isNaN(asDate.getTime())) return asDate;
  }
  const coerced = new Date(raw);
  if (!Number.isNaN(coerced.getTime())) return coerced;
  return null;
}

function computeCountdown(eventDate) {
  if (!eventDate) return null;
  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);
  const days = Math.floor(absMs / MS_IN_DAY);
  const hours = Math.floor((absMs % MS_IN_DAY) / MS_IN_HOUR);
  const minutes = Math.floor((absMs % MS_IN_HOUR) / MS_IN_MINUTE);

  return {
    isPast: diffMs < 0,
    days,
    hours,
    minutes,
  };
}

export default function Checklist() {
  const { t } = useTranslations();
  const translate = useCallback((key, defaultValue) => t(key, { defaultValue }), [t]);
  const { activeWedding, activeWeddingData } = useWedding();

  const {
    items,
    documents,
    loading,
    syncInProgress,
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
    MAX_CUSTOM_ITEMS,
  } = useChecklist();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemData, setNewItemData] = useState({
    label: '',
    category: null,
    dueDate: '',
  });
  const [manualChecks, setManualChecks] = useState(() => [
    {
      id: 'manual-check-1',
      title: t('protocol.checklist.manualDefaults.specialGifts'),
      notes: '',
      done: false,
    },
  ]);
  const [newCheckpoint, setNewCheckpoint] = useState({ title: '', notes: '' });
  const [expandedSections, setExpandedSections] = useState(() => new Set());
  const fileInputRef = useRef(null);

  const { providers, loadProviders, loading: providersLoading } = useProveedores();
  useEffect(() => {
    try {
      loadProviders?.();
    } catch {}
  }, [loadProviders]);

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

  const eventDate = useMemo(
    () =>
      parseWeddingDate(
        activeWeddingData?.eventDate ||
          activeWeddingData?.weddingDate ||
          activeWeddingData?.date ||
          activeWeddingData?.fecha
      ),
    [activeWeddingData]
  );
  const countdown = useMemo(() => computeCountdown(eventDate), [eventDate]);
  const summary = useMemo(() => getChecklistSummary(), [getChecklistSummary]);
  const readiness = useMemo(() => validateReadiness(), [validateReadiness]);

  const categoryLabels = useMemo(
    () => ({
      [CATEGORIES.DOCUMENTATION]: t('protocol.checklist.categories.documentation'),
      [CATEGORIES.PROVIDERS]: t('protocol.checklist.categories.providers'),
      [CATEGORIES.CEREMONY]: t('protocol.checklist.categories.ceremony'),
      [CATEGORIES.CONTINGENCY]: t('protocol.checklist.categories.contingency'),
      [CATEGORIES.PERSONAL]: t('protocol.checklist.categories.personal'),
      [CATEGORIES.TECHNICAL]: t('protocol.checklist.categories.technical'),
    }),
    [CATEGORIES, t]
  );

  const statusLabels = useMemo(
    () => ({
      [ITEM_STATUS.PENDING]: t('protocol.checklist.statuses.pending'),
      [ITEM_STATUS.IN_PROGRESS]: t('protocol.checklist.statuses.in-progress'),
      [ITEM_STATUS.DONE]: t('protocol.checklist.statuses.done'),
    }),
    [ITEM_STATUS, t]
  );

  const groupedItems = useMemo(() => {
    const groups = {};
    Object.values(CATEGORIES).forEach((cat) => {
      groups[cat] = [];
    });
    items.forEach((item) => {
      const key = groups[item.category] ? item.category : CATEGORIES.PERSONAL;
      groups[key].push(item);
    });
    return groups;
  }, [items, CATEGORIES]);

  const matchesSearch = useCallback(
    (item) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        item.label.toLowerCase().includes(term) ||
        (item.notes && item.notes.toLowerCase().includes(term))
      );
    },
    [searchTerm]
  );

  const toggleSection = useCallback((sectionKey) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionKey)) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      return next;
    });
  }, []);

  const handleStatusChange = useCallback(
    (itemId, status) => {
      setItemStatus(itemId, status);

      const item = items.find((i) => i.id === itemId);
      if (item) {
        const statusLabel = statusLabels[status] || status;
        toast.success(
          t('protocol.checklist.toasts.statusUpdated', {
            label: item.label,
            status: statusLabel,
          })
        );
      }
    },
    [items, setItemStatus, statusLabels, t]
  );

  const handleAddCustomItem = useCallback(() => {
    const { label, category, dueDate } = newItemData;

    if (!label.trim()) {
      toast.error(t('protocol.checklist.toasts.missingName'));
      return;
    }

    try {
      const selectedCategory = category || CATEGORIES.PERSONAL;
      const newItem = addCustomItem(label, selectedCategory, dueDate || null);
      toast.success(
        t('protocol.checklist.toasts.customAdded', {
          label,
        })
      );
      setShowAddModal(false);
      setNewItemData({ label: '', category: selectedCategory, dueDate: '' });
      setEditingItem(newItem.id);
    } catch (error) {
      toast.error(error.message);
    }
  }, [newItemData, addCustomItem, CATEGORIES, t]);

  const handleRemoveCustomItem = useCallback(
    (itemId) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      if (window.confirm(t('protocol.checklist.prompts.deleteCustom', { label: item.label }))) {
        try {
          removeCustomItem(itemId);
          toast.success(t('protocol.checklist.toasts.customRemoved'));
        } catch (error) {
          toast.error(error.message);
        }
      }
    },
    [items, removeCustomItem, t]
  );

  const handleDownloadSnapshot = useCallback(() => {
    const data = {
      generatedAt: new Date().toISOString(),
      wedding: activeWedding,
      items,
      documents,
      summary,
      readiness,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checklist_${activeWedding || 'lovenda'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('protocol.checklist.toasts.exported'));
  }, [activeWedding, documents, items, readiness, summary, t]);

  const handleImport = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!Array.isArray(data?.items)) {
            throw new Error('Invalid structure');
          }

          const customItems = data.items.filter((item) => item.custom);
          let imported = 0;
          customItems.forEach((item) => {
            try {
              addCustomItem(item.label, item.category || CATEGORIES.PERSONAL, item.dueDate || null);
              imported += 1;
            } catch (error) {
              // console.warn(error);
            }
          });

          toast.success(
            t('protocol.checklist.toasts.imported', {
              count: imported,
            })
          );
        } catch (error) {
          toast.error(t('protocol.checklist.toasts.importError'));
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    },
    [addCustomItem, CATEGORIES, t]
  );

  const handleShare = useCallback(() => {
    const completion = summary?.completionPercentage ?? 0;
    const readinessMessage = readiness.isReady
      ? translate('common.protocol.checklist.share.ready', 'Checklist completa')
      : translate('common.protocol.checklist.share.pending', 'Quedan pendientes críticos');
    const message = `${translate('common.protocol.checklist.share.header', 'Checklist Lovenda')} ${completion}% · ${readinessMessage}`;

    if (navigator.share) {
      navigator
        .share({
          title: translate('common.protocol.checklist.share.title', 'Checklist de boda'),
          text: message,
        })
        .catch(() => {});
      return;
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(message).then(
        () => toast.success(translate('common.protocol.checklist.share.copied', 'Checklist copiada al portapapeles')), 
        () => toast.error(translate('common.protocol.checklist.share.copyError', 'No se pudo copiar el texto'))
      );
      return;
    }

    toast.error(translate('common.protocol.checklist.share.unavailable', 'Función de compartir no disponible en este dispositivo'));
  }, [readiness, summary, translate]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const renderStatusBadge = useCallback(
    (status) => {
      const config = {
        [ITEM_STATUS.PENDING]: { icon: Circle, color: 'text-gray-400' },
        [ITEM_STATUS.IN_PROGRESS]: { icon: Clock, color: 'text-amber-500' },
        [ITEM_STATUS.DONE]: { icon: CheckCircle, color: 'text-emerald-600' },
      };

      const { icon: Icon, color } = config[status] || config[ITEM_STATUS.PENDING];
      return <Icon className={color} size={18} />;
    },
    [ITEM_STATUS]
  );

  const renderChecklistItem = useCallback(
    (item) => {
      const isEditing = editingItem === item.id;
      const itemDocs = getItemDocuments(item.id);
      const isOverdue =
        item.dueDate && new Date(item.dueDate) < new Date() && item.status !== ITEM_STATUS.DONE;

      return (
        <div
          key={item.id}
          className={`rounded-lg border p-4 transition-all ${
            item.status === ITEM_STATUS.DONE
              ? 'bg-emerald-50 border-emerald-200'
              : isOverdue
              ? 'bg-rose-50 border-rose-200'
              : 'bg-white border-gray-200 hover:shadow-sm'
          }`}
        >
          <div className="flex items-start gap-3">
            <button
              onClick={() => {
                const nextStatus =
                  item.status === ITEM_STATUS.PENDING
                    ? ITEM_STATUS.IN_PROGRESS
                    : item.status === ITEM_STATUS.IN_PROGRESS
                    ? ITEM_STATUS.DONE
                    : ITEM_STATUS.PENDING;
                handleStatusChange(item.id, nextStatus);
              }}
              className="mt-1 flex-shrink-0 rounded-full p-1 transition hover:bg-gray-100"
            >
              {renderStatusBadge(item.status)}
            </button>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    item.status === ITEM_STATUS.DONE ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {item.label}
                </span>
                {item.critical && (
                  <Badge type="error">
                    <Shield size={12} className="mr-1 inline" />
                    {t('protocol.checklist.badges.critical')}
                  </Badge>
                )}
                {item.custom && (
                  <Badge type="info">
                    {t('protocol.checklist.badges.custom')}
                  </Badge>
                )}
                {itemDocs.length > 0 && (
                  <Badge type="success">
                    <FileText size={12} className="mr-1 inline" />
                    {itemDocs.length}
                  </Badge>
                )}
              </div>

              {item.dueDate && (
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                  <Calendar size={13} />
                  <span>
                    {t('protocol.checklist.labels.due')} {formatDate(item.dueDate, 'short')}
                  </span>
                  {isOverdue && (
                    <span className="font-semibold text-rose-600">
                      {t('protocol.checklist.labels.overdue')}
                    </span>
                  )}
                </div>
              )}

              {isEditing ? (
                <div className="mt-3 space-y-3 text-sm">
                  <textarea
                    className="w-full rounded-md border p-2 text-sm"
                    placeholder={t('checklist.notesPlaceholder')}
                    value={item.notes || ''}
                    onChange={(e) => setItemNotes(item.id, e.target.value)}
                    rows={3}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs font-medium text-gray-600">
                      {t('protocol.checklist.labels.due')}
                    </label>
                    <input
                      type="date"
                      className="rounded border px-2 py-1 text-xs"
                      value={item.dueDate ? item.dueDate.slice(0, 10) : ''}
                      onChange={(e) => setItemDueDate(item.id, e.target.value || null)}
                    />
                    {item.dueDate && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setItemDueDate(item.id, null)}
                        className="text-xs text-gray-500 hover:text-rose-500"
                      >
                        {translate('common.protocol.checklist.labels.clearDue', 'Limpiar fecha')}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                item.notes && (
                  <p className="mt-2 text-sm text-gray-600">
                    {item.notes}
                  </p>
                )
              )}

              {itemDocs.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-medium text-gray-500">
                    {t('protocol.checklist.labels.documents')}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {itemDocs.map((doc) => (
                      <span key={doc.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                        {doc.name || doc.type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => toggleItemCritical(item.id)}
                className={`rounded p-1 transition ${
                  item.critical ? 'text-rose-500 hover:text-rose-600' : 'text-gray-400 hover:text-rose-500'
                }`}
                title={t('protocol.checklist.tooltips.markCritical')}
              >
                <Flag size={16} />
              </button>
              <button
                onClick={() => setEditingItem(isEditing ? null : item.id)}
                className="rounded p-1 text-gray-400 transition hover:text-blue-600"
                title={
                  isEditing
                    ? t('protocol.checklist.tooltips.save')
                    : t('protocol.checklist.tooltips.edit')
                }
              >
                {isEditing ? <CheckSquare size={16} /> : <Edit2 size={16} />}
              </button>
              {item.custom && (
                <button
                  onClick={() => handleRemoveCustomItem(item.id)}
                  className="rounded p-1 text-gray-400 transition hover:text-rose-600"
                  title={t('protocol.checklist.tooltips.delete')}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      );
    },
    [
      ITEM_STATUS,
      getItemDocuments,
      handleRemoveCustomItem,
      handleStatusChange,
      renderStatusBadge,
      setItemDueDate,
      setItemNotes,
      toggleItemCritical,
      editingItem,
      t,
      translate,
    ]
  );

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
      title={t('protocol.checklist.addModal.title')}
      onClose={() => setShowAddModal(false)}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('protocol.checklist.addModal.nameLabel')}
          </label>
          <input
            type="text"
            value={newCheckpoint.title}
            onChange={(e) => setNewCheckpoint((c) => ({ ...c, title: e.target.value }))}
            placeholder={t('protocol.checklist.addModal.namePlaceholder')}
            className="w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('protocol.checklist.addModal.notesLabel')}
          </label>
          <textarea
            value={newCheckpoint.notes}
            onChange={(e) => setNewCheckpoint((c) => ({ ...c, notes: e.target.value }))}
            placeholder={t('protocol.checklist.addModal.notesPlaceholder')}
            className="w-full rounded border px-3 py-2"
            rows={2}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            onClick={() => setShowAddModal(false)}
            variant="secondary"
          >
            {t('app.cancel')}
          </Button>
          <Button onClick={addManualCheckpoint} disabled={!newCheckpoint.title.trim()}>
            {t('app.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );

  const prioritySections = useMemo(
    () => [
      {
        key: CATEGORIES.PROVIDERS,
        title: categoryLabels[CATEGORIES.PROVIDERS],
        icon: Users,
        accent: 'border-blue-200',
        summary: providersLoading
          ? t('app.loading')
          : (() => {
              const total = providers?.length || 0;
              const confirmed = (providers || []).filter(
                (p) => String(p.status || '').toLowerCase() === 'confirmado'
              ).length;
              if (!total) return translate('common.protocol.checklist.providersCard.empty', 'Añade tus proveedores principales y márcalos cuando confirmen.');
              if (confirmed === total) {
                return translate('common.protocol.checklist.providersCard.allConfirmed', 'Todos los proveedores están confirmados.');
              }
              return translate('common.protocol.checklist.providersCard.pending', 'Aún quedan proveedores por confirmar.');
            })(),
      },
      {
        key: CATEGORIES.DOCUMENTATION,
        title: categoryLabels[CATEGORIES.DOCUMENTATION],
        icon: FileText,
        accent: 'border-amber-200',
        summary: translate('common.protocol.checklist.sections.documentation', 'Reúne documentos y permisos imprescindibles.'),
      },
      {
        key: CATEGORIES.CONTINGENCY,
        title: categoryLabels[CATEGORIES.CONTINGENCY],
        icon: Shield,
        accent: 'border-purple-200',
        summary: translate('common.protocol.checklist.sections.contingency', 'Valida planes B, contactos de emergencia y logística crítica.'),
      },
      {
        key: CATEGORIES.CEREMONY,
        title: categoryLabels[CATEGORIES.CEREMONY],
        icon: Music2,
        accent: 'border-emerald-200',
        summary:
          momentsStats.total > 0
            ? translate(
                'common.protocol.checklist.momentsCard.missing',
                'Revisa los momentos especiales y la música asignada.'
              )
            : translate('common.protocol.checklist.momentsCard.empty', 'Añade momentos clave y asigna música antes del ensayo general.'),
      },
    ],
    [CATEGORIES, categoryLabels, momentsStats, providers, providersLoading, t, translate]
  );

  const supportSections = useMemo(
    () => [
      {
        key: CATEGORIES.PERSONAL,
        title: categoryLabels[CATEGORIES.PERSONAL],
      },
      {
        key: CATEGORIES.TECHNICAL,
        title: categoryLabels[CATEGORIES.TECHNICAL],
      },
    ],
    [CATEGORIES, categoryLabels]
  );

  return (
    <PageWrapper title={t('protocol.checklist.title')}>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImport}
      />

      <AddCheckpointModal />

      <div className="space-y-6">
        <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {countdown ? (
                  <div
                    className={`flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium ${
                      countdown.isPast
                        ? 'bg-rose-100 text-rose-700'
                        : countdown.days <= 1
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <Clock size={16} />
                    {countdown.isPast
                      ? translate('common.protocol.checklist.countdown.past', 'El gran día ya pasó, revisa los cierres pendientes.')
                      : translate('common.protocol.checklist.countdown.future', 'Cuenta atrás al gran día') + ` · ${countdown.days}d ${countdown.hours}h`}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600">
                    <Clock size={16} />
                    {translate('common.protocol.checklist.countdown.missing', 'Añade la fecha del evento para ver la cuenta atrás.')}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar size={16} />
                  {eventDate ? formatDate(eventDate, 'long') : translate('common.protocol.checklist.labels.noDate', 'Sin fecha definida')}
                </div>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {readiness.isReady
                    ? translate('common.protocol.checklist.readiness.ready', 'Checklist completa y lista para el evento.')
                    : translate('common.protocol.checklist.readiness.pending', 'Revisa los puntos críticos antes de la boda.')}
                </p>
                <p className="text-sm text-gray-600">
                  {t('protocol.checklist.description')}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrint}
                startIcon={<Printer size={16} />}
              >
                {translate('common.protocol.checklist.buttons.print', 'Imprimir')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                startIcon={<Upload size={16} />}
                disabled={items.length >= MAX_CUSTOM_ITEMS}
              >
                {translate('common.protocol.checklist.buttons.import', 'Importar')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadSnapshot}
                startIcon={<Download size={16} />}
              >
                {translate('common.protocol.checklist.buttons.export', 'Descargar checklist')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleShare}
                startIcon={<Share2 size={16} />}
              >
                {translate('common.protocol.checklist.buttons.share', 'Compartir')}
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="text-emerald-500" size={18} />
              {translate('common.protocol.checklist.stats.completion', 'Completado:')} {summary.completionPercentage || 0}%
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertTriangle className="text-amber-500" size={18} />
              {translate('common.protocol.checklist.stats.critical', 'Críticos abiertos:')} {summary.criticalPending.length}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="text-rose-500" size={18} />
              {translate('common.protocol.checklist.stats.overdue', 'Atrasados:')} {summary.overdueItems.length}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={translate('common.protocol.checklist.labels.search', 'Buscar en el checklist')}
                className="w-64 rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-[color:var(--color-primary)] focus:outline-none"
              />
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <aside className="space-y-6 lg:sticky lg:top-24">
            <Card className="space-y-4 border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {translate('common.protocol.checklist.readiness.title', 'Estado del evento')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {readiness.isReady
                      ? translate(
                          'common.protocol.checklist.readiness.subtitleReady',
                          'Todo parece listo para el gran día.'
                        )
                      : translate(
                          'common.protocol.checklist.readiness.subtitlePending',
                          'Resuelve estos pendientes antes de la boda.'
                        )}
                  </p>
                </div>
                <Badge type={readiness.isReady ? 'success' : 'warning'}>
                  {readiness.isReady
                    ? translate('common.protocol.checklist.readiness.badgeReady', 'Listo')
                    : translate('common.protocol.checklist.readiness.badgePending', 'Pendiente')}
                </Badge>
              </div>
              {readiness?.issues?.length ? (
                <ul className="space-y-3">
                  {readiness.issues.map((issue, idx) => (
                    <li
                      key={`${issue.type}-${idx}`}
                      className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
                    >
                      <p className="font-medium">
                        {issue.message ||
                          translate(
                            'common.protocol.checklist.readiness.genericIssue',
                            'Hay elementos por revisar.'
                          )}
                      </p>
                      {Array.isArray(issue.items) && issue.items.length > 0 && (
                        <ul className="mt-1 list-inside list-disc space-y-1 text-[11px]">
                          {issue.items.slice(0, 3).map((item) => (
                            <li key={item.id}>{item.label}</li>
                          ))}
                          {issue.items.length > 3 && (
                            <li>
                              +{issue.items.length - 3} {translate('common.app.more', 'más')}
                            </li>
                          )}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-700">
                  {translate(
                    'common.protocol.checklist.readiness.allGood',
                    'Checklist completo y sin alertas.'
                  )}
                </div>
              )}
            </Card>

            <Card className="space-y-4 border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">
                  {translate('common.protocol.checklist.manual.title', 'Extras personales')}
                </p>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setShowAddModal(true)}
                  startIcon={<Plus size={14} />}
                >
                  {t('protocol.checklist.buttons.addCheckpoint')}
                </Button>
              </div>
              {manualChecks.length === 0 ? (
                <p className="text-xs text-gray-500">
                  {t('protocol.checklist.manual.empty', {
                    button: t('protocol.checklist.buttons.addCheckpoint'),
                  })}
                </p>
              ) : (
                <ul className="space-y-2">
                  {manualChecks.map((item) => (
                    <li
                      key={item.id}
                      className={`flex items-start gap-2 rounded-lg border p-2 text-xs ${
                        item.done ? 'bg-gray-50 text-gray-500' : 'bg-white text-gray-700'
                      }`}
                    >
                      <button
                        onClick={() =>
                          setManualChecks((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i))
                          )
                        }
                        className={`mt-0.5 ${
                          item.done ? 'text-emerald-600' : 'text-gray-400 hover:text-emerald-600'
                        }`}
                      >
                        {item.done ? <CheckCircle size={16} /> : <Circle size={16} />}
                      </button>
                      <div className="flex-1">
                        <p className={`font-medium ${item.done ? 'line-through' : ''}`}>
                          {item.title}
                        </p>
                        {item.notes && (
                          <p className="mt-0.5 text-[11px] text-gray-500">{item.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setManualChecks((prev) =>
                            prev.filter((checkpoint) => checkpoint.id !== item.id)
                          )
                        }
                        className="text-gray-400 transition hover:text-rose-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </aside>

          <section className="space-y-6">
            <CeremonyChecklist />

            {prioritySections.map((section) => {
              const sectionItems = groupedItems[section.key] || [];
              const visibleItems = sectionItems.filter(matchesSearch);
              const completion = summary.byCategory?.[section.key] || { total: 0, done: 0 };
              const isExpanded = expandedSections.has(section.key);

              return (
                <Card
                  key={section.key}
                  className={`overflow-hidden border bg-white shadow-sm ${section.accent || ''}`}
                >
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="flex w-full items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4 text-left"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <div className="rounded-full bg-gray-200 p-2 text-gray-700">
                        <section.icon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{section.title}</p>
                        <p className="text-xs text-gray-500">{section.summary}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge type="default">
                        {completion.done}/{completion.total}
                      </Badge>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="space-y-4 px-5 py-4">
                      {visibleItems.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                          {searchTerm
                            ? translate(
                                'common.protocol.checklist.labels.searchEmpty',
                                'Sin resultados para esta búsqueda.'
                              )
                            : translate(
                                'common.protocol.checklist.labels.emptySection',
                                'Nada pendiente en esta sección.'
                              )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {visibleItems.map((item) => renderChecklistItem(item))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}

            {supportSections.map((section) => {
              const sectionItems = groupedItems[section.key] || [];
              const visibleItems = sectionItems.filter(matchesSearch);
              const isExpanded = expandedSections.has(section.key);

              return (
                <Card key={section.key} className="border bg-white shadow-sm">
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="flex w-full items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-5 py-4 text-left"
                  >
                    <p className="text-sm font-semibold text-gray-900">{section.title}</p>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isExpanded && (
                    <div className="space-y-4 px-5 py-4">
                      {visibleItems.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                          {searchTerm
                            ? translate(
                                'common.protocol.checklist.labels.searchEmpty',
                                'Sin resultados para esta búsqueda.'
                              )
                            : translate(
                                'common.protocol.checklist.labels.emptySection',
                                'Añade aquí notas personales o tareas técnicas.'
                              )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {visibleItems.map((item) => renderChecklistItem(item))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}

            <Card className="flex flex-col gap-3 border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Plus size={18} />
                <p className="font-semibold">
                  {translate(
                    'common.protocol.checklist.customItems.title',
                    'Añade tu propio punto de control'
                  )}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {translate(
                  'common.protocol.checklist.customItems.subtitle',
                  `Personaliza el checklist con recordatorios propios (máximo ${MAX_CUSTOM_ITEMS} ítems).`
                )}
              </p>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <input
                  type="text"
                  className="flex-1 rounded-md border px-3 py-2 text-sm"
                  placeholder={translate(
                    'common.protocol.checklist.customItems.placeholder',
                    'Ej: preparar kit de emergencia'
                  )}
                  value={newItemData.label}
                  onChange={(e) => setNewItemData((prev) => ({ ...prev, label: e.target.value }))}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={newItemData.category || CATEGORIES.PERSONAL}
                    onChange={(e) =>
                      setNewItemData((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="rounded-md border px-3 py-2 text-sm"
                  >
                    {[...supportSections, ...prioritySections].map((section) => (
                      <option key={section.key} value={section.key}>
                        {section.title}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={newItemData.dueDate}
                    onChange={(e) =>
                      setNewItemData((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                    className="rounded-md border px-3 py-2 text-sm"
                  />
                  <Button
                    onClick={handleAddCustomItem}
                    disabled={summary.customItemsCount >= MAX_CUSTOM_ITEMS}
                    startIcon={<Plus size={14} />}
                  >
                    {translate('common.protocol.checklist.customItems.addButton', 'Añadir')}
                  </Button>
                </div>
              </div>
            </Card>
          </section>
        </div>

        {loading || syncInProgress ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            {syncInProgress
              ? translate('common.protocol.checklist.sync.inProgress', 'Sincronizando checklist…')
              : translate('common.protocol.checklist.sync.loading', 'Cargando checklist…')}
          </div>
        ) : null}
      </div>
    </PageWrapper>
  );
}
