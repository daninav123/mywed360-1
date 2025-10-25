import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react';

import { Card } from '../ui';
import { Button } from '../ui';
import useCeremonyTimeline from '../../hooks/useCeremonyTimeline';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in-progress', label: 'En curso' },
  { value: 'done', label: 'Completado' },
];

export default function CeremonyTimeline({ compact = false }) {
  const { sections, loading, saveSections, defaults } = useCeremonyTimeline();
  const [draft, setDraft] = useState(sections);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(sections);
    setDirty(false);
  }, [sections]);

  const visibleSections = useMemo(() => {
    if (!compact) return draft;
    return (draft || []).map((section) => ({
      ...section,
      items: Array.isArray(section.items) ? section.items.slice(0, 3) : [],
    }));
  }, [draft, compact]);

  const handleFieldChange = (sectionId, itemId, field, value) => {
    setDraft((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          items: section.items.map((item) =>
            item.id === itemId ? { ...item, [field]: value } : item,
          ),
        };
      }),
    );
    setDirty(true);
  };

  const handleAddItem = (sectionId) => {
    setDraft((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        const newItem = {
          id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
          title: 'Nuevo hito',
          time: '',
          responsible: '',
          status: 'pending',
          notes: '',
        };
        return { ...section, items: [...section.items, newItem] };
      }),
    );
    setDirty(true);
  };

  const handleRemoveItem = (sectionId, itemId) => {
    setDraft((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          items: section.items.filter((item) => item.id !== itemId),
        };
      }),
    );
    setDirty(true);
  };

  const handleMoveItem = (sectionId, itemId, direction) => {
    setDraft((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        const items = [...section.items];
        const index = items.findIndex((item) => item.id === itemId);
        if (index === -1) return section;
        const target = direction === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= items.length) return section;
        const [removed] = items.splice(index, 1);
        items.splice(target, 0, removed);
        return { ...section, items };
      }),
    );
    setDirty(true);
  };

  const handleReset = () => {
    setDraft(defaults);
    setDirty(true);
  };

  const handleSave = async () => {
    await saveSections(draft);
    setDirty(false);
  };

  if (loading) {
    return (
      <Card className="p-4">
        <p className="text-sm text-gray-600">Cargando timeline de ceremonia…</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Timeline de la ceremonia</h2>
          <p className="text-sm text-gray-600">
            Coordina todos los hitos del protocolo antes, durante y después de la ceremonia.
          </p>
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

      {visibleSections.map((section) => (
        <Card key={section.id} className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h3 className="text-lg font-medium text-gray-800">{section.title}</h3>
              {section.description && (
                <p className="text-sm text-gray-500">{section.description}</p>
              )}
            </div>
            {!compact && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleAddItem(section.id)}
                leftIcon={<Plus size={16} />}
              >
                Añadir hito
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {section.items.map((item, idx) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-3 flex flex-col gap-3 bg-white shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <input
                    className="text-base font-medium text-gray-800 border-b border-dashed focus:outline-none focus-visible:ring-2 ring-primary"
                    value={item.title}
                    onChange={(e) =>
                      handleFieldChange(section.id, item.id, 'title', e.target.value)
                    }
                    placeholder="Nombre del hito"
                    disabled={compact}
                  />
                  {!compact && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveItem(section.id, item.id, 'up')}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                        disabled={idx === 0}
                        title="Subir"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveItem(section.id, item.id, 'down')}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                        disabled={idx === section.items.length - 1}
                        title="Bajar"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(section.id, item.id)}
                        className="p-1 rounded hover:bg-red-50 text-red-600"
                        title="Eliminar hito"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex flex-col">
                    <label className="text-gray-500 mb-1">Hora aproximada</label>
                    <input
                      className="border rounded px-2 py-1"
                      value={item.time}
                      onChange={(e) =>
                        handleFieldChange(section.id, item.id, 'time', e.target.value)
                      }
                      placeholder="HH:MM"
                      disabled={compact}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-gray-500 mb-1">Responsable</label>
                    <input
                      className="border rounded px-2 py-1"
                      value={item.responsible}
                      onChange={(e) =>
                        handleFieldChange(section.id, item.id, 'responsible', e.target.value)
                      }
                      placeholder="Nombre o rol"
                      disabled={compact}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-gray-500 mb-1">Estado</label>
                    <select
                      className="border rounded px-2 py-1"
                      value={item.status}
                      onChange={(e) =>
                        handleFieldChange(section.id, item.id, 'status', e.target.value)
                      }
                      disabled={compact}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col md:col-span-1">
                    <label className="text-gray-500 mb-1">Notas</label>
                    <input
                      className="border rounded px-2 py-1"
                      value={item.notes}
                      onChange={(e) =>
                        handleFieldChange(section.id, item.id, 'notes', e.target.value)
                      }
                      placeholder="Detalles / enlaces"
                      disabled={compact}
                    />
                  </div>
                </div>
              </div>
            ))}

            {!section.items.length && (
              <div className="text-sm text-gray-500">
                No hay hitos registrados. {!compact && 'Pulsa “Añadir hito” para empezar.'}
              </div>
            )}
          </div>
        </Card>
      ))}

      {compact && (
        <p className="text-xs text-gray-500">
          Vista resumida. Gestiona todos los hitos desde la pestaña Timing.
        </p>
      )}
    </div>
  );
}
