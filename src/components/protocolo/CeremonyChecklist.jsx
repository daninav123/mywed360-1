import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, FileText, CheckCircle2 } from 'lucide-react';

import { Card } from '../ui';
import { Button } from '../ui';
import useCeremonyChecklist from '../../hooks/useCeremonyChecklist';
import { useTranslations } from '../../hooks/useTranslations';

const STATUS_COLORS = {
  const { t } = useTranslations();

  pending: 'bg-amber-100 text-amber-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  done: 'bg-emerald-100 text-emerald-800',
};

const STATUS_LABELS = {
  pending: 'Pendiente',
  'in-progress': 'En curso',
  done: 'Completado',
};

export default function CeremonyChecklist({ compact = false }) {
  const { items, loading, saveItems, documentsIndex, defaults } = useCeremonyChecklist();
  const [draft, setDraft] = useState(items);
  const [dirty, setDirty] = useState(false);
  const [newItem, setNewItem] = useState({ label: '', category: 'General' });
  const [limitWarning, setLimitWarning] = useState('');

  useEffect(() => {
    setDraft(items);
    setDirty(false);
    setLimitWarning('');
  }, [items]);

  const defaultIds = useMemo(
    () => new Set((defaults || []).map((item) => item.id)),
    [defaults],
  );

  const grouped = useMemo(() => {
    return (draft || []).reduce((acc, item) => {
      const bucket = item.category || 'General';
      if (!acc[bucket]) acc[bucket] = [];
      acc[bucket].push(item);
      return acc;
    }, {});
  }, [draft]);

  const handleStatus = (itemId, status) => {
    setDraft((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status } : item)),
    );
    setDirty(true);
  };

  const handleField = (itemId, field, value) => {
    setDraft((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
    );
    setDirty(true);
  };

  const handleAdd = () => {
    const label = (newItem.label || '').trim();
    if (!label) return;
    const customCount = (draft || []).filter((item) => !defaultIds.has(item.id)).length;
    if (customCount >= 50) {
      setLimitWarning({t('common.has_alcanzado_maximo_items_personalizados')});
      return;
    }
    setDraft((prev) => [
      ...prev,
      {
        id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        label,
        category: newItem.category || 'General',
        status: 'pending',
        dueDate: '',
        notes: '',
      },
    ]);
    setNewItem({ label: '', category: 'General' });
    setDirty(true);
    setLimitWarning('');
  };

  const handleSave = async () => {
    await saveItems(draft);
    setDirty(false);
  };

  const handleReset = () => {
    setDraft(defaults);
    setDirty(true);
  };

  if (loading) {
    return (
      <Card className="p-4">
        <p className="text-sm text-gray-600">Cargando checklist de ceremonia…</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Checklist de protocolo</h2>
          <p className="text-sm text-gray-600">
            Controla documentos, ensayos y entregables críticos para el flujo 11.
          </p>
          {!compact && limitWarning && (
            <p className="mt-1 text-sm text-amber-600">{limitWarning}</p>
          )}
        </div>
        {!compact && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleReset}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300"
              disabled={!dirty}
            >
              Restaurar base
            </Button>
            <Button onClick={handleSave} disabled={!dirty} leftIcon={<Save size={16} />}>
              Guardar cambios
            </Button>
          </div>
        )}
      </div>

      {!compact && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Nuevo ítem</label>
              <input
                className="border rounded px-3 py-2"
                placeholder={t('common.confirmar_musica_entrada')}
                value={newItem.label}
                onChange={(e) => setNewItem((prev) => ({ ...prev, label: e.target.value }))}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Categoría</label>
              <input
                className="border rounded px-3 py-2"
                placeholder="General"
                value={newItem.category}
                onChange={(e) => setNewItem((prev) => ({ ...prev, category: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAdd} leftIcon={<Plus size={16} />} disabled={!newItem.label.trim()}>
                Añadir
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-6">
        {Object.entries(grouped).map(([category, list]) => (
          <Card key={category} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-800">{category}</h3>
              {!compact && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Estado rápido:</span>
                  {['pending', 'in-progress', 'done'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        list.forEach((item) => handleStatus(item.id, status));
                      }}
                      className={`px-2 py-1 rounded ${STATUS_COLORS[status]}`}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {list.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm space-y-3"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <input
                      className="font-medium text-gray-800 border-b border-dashed focus:outline-none focus-visible:ring-2 ring-primary"
                      value={item.label}
                      onChange={(e) => handleField(item.id, 'label', e.target.value)}
                      disabled={compact}
                    />
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        STATUS_COLORS[item.status] || STATUS_COLORS.pending
                      }`}
                    >
                      {STATUS_LABELS[item.status] || STATUS_LABELS.pending}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex flex-col">
                      <label className="text-gray-500 mb-1">Fecha límite</label>
                      <input
                        type="date"
                        className="border rounded px-2 py-1"
                        value={item.dueDate}
                        onChange={(e) => handleField(item.id, 'dueDate', e.target.value)}
                        disabled={compact}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-gray-500 mb-1">Estado</label>
                      <select
                    className="border rounded px-2 py-1"
                    value={item.status}
                    onChange={(e) => handleStatus(item.id, e.target.value)}
                    disabled={compact}
                  >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col md:col-span-1">
                      <label className="text-gray-500 mb-1">Notas</label>
                      <textarea
                        className="border rounded px-2 py-1"
                        rows={2}
                        value={item.notes}
                        onChange={(e) => handleField(item.id, 'notes', e.target.value)}
                        disabled={compact}
                      />
                    </div>
                  </div>

                  {item.relatedDocType && documentsIndex?.[item.relatedDocType]?.length > 0 && (
                    <div className="border-t border-dashed pt-2 text-sm text-gray-600 flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-gray-500">
                        <FileText size={16} />
                        <span>Documentos asociados</span>
                      </div>
                      <ul className="pl-4 list-disc">
                        {documentsIndex[item.relatedDocType].map((docItem) => (
                          <li key={docItem.id} className="flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            <span>{docItem.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.relatedDocType &&
                    (!documentsIndex || !documentsIndex[item.relatedDocType]?.length) && (
                      <div className="border-t border-dashed pt-2 text-sm text-amber-600 flex items-center gap-2">
                        <FileText size={16} />
                        <span>
                          No hay documentos vinculados a este requisito. Súbelos desde la guía legal.
                        </span>
                      </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {compact && (
        <p className="text-xs text-gray-500">
          Vista resumida. Gestiona todos los pendientes desde la pestaña Checklist.
        </p>
      )}
    </div>
  );
}
