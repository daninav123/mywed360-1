import React, { useEffect, useMemo, useState } from 'react';

const MAX_SCENES = 6;

const slugify = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || '';

const cloneScenes = (list = []) => list.map((scene) => ({ ...scene }));

/**
 * SceneManager
 * Editor sencillo para las escenas configurables de Momentos.
 */
export default function SceneManager({ scenes = [], onSave = () => {} }) {
  const [drafts, setDrafts] = useState(() => cloneScenes(scenes));
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setDrafts(cloneScenes(scenes));
    setIsDirty(false);
  }, [scenes]);

  const canAdd = useMemo(() => drafts.length < MAX_SCENES, [drafts.length]);

  const updateDraft = (index, patch) => {
    setDrafts((prev) =>
      prev.map((scene, idx) => (idx === index ? { ...scene, ...patch } : scene))
    );
    setIsDirty(true);
  };

  const handleAdd = () => {
    if (!canAdd) return;
    setDrafts((prev) => [
      ...prev,
      { id: '', label: '', emoji: '', color: '' },
    ]);
    setIsDirty(true);
  };

  const handleRemove = (index) => {
    setDrafts((prev) => prev.filter((_, idx) => idx !== index));
    setIsDirty(true);
  };

  const handleSave = () => {
    const normalized = drafts
      .map((scene) => {
        const label = (scene.label || '').trim();
        const baseId = (scene.id || '').trim();
        const id = slugify(baseId || label);
        if (!id || !label) return null;
        return {
          id,
          label,
          emoji: (scene.emoji || '').trim() || null,
          color: (scene.color || '').trim() || null,
        };
      })
      .filter(Boolean)
      .slice(0, MAX_SCENES);
    if (!normalized.length) return;
    onSave(normalized);
    setIsDirty(false);
  };

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Escenas configurables</h3>
          <p className="text-sm text-gray-500">
            Ajusta los nombres que verán tus invitados al subir sus fotos (máximo {MAX_SCENES}).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className="px-3 py-2 text-sm border border-gray-200 rounded-md text-gray-600 hover:bg-gray-100 transition disabled:opacity-40"
          >
            Añadir escena
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-green-600 text-white shadow hover:bg-green-700 transition disabled:opacity-40"
          >
            Guardar cambios
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {drafts.map((scene, index) => (
          <div
            key={`${scene.id || 'scene'}-${index}`}
            className="flex flex-col md:flex-row md:items-center gap-3 border border-gray-100 rounded-md px-3 py-2 bg-gray-50"
          >
            <div className="flex items-center gap-2 w-full md:w-1/5">
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Emoji
              </label>
              <input
                type="text"
                value={scene.emoji || ''}
                maxLength={2}
                onChange={(event) => updateDraft(index, { emoji: event.target.value })}
                className="w-16 border border-gray-300 rounded-md px-2 py-1 text-center text-lg"
                placeholder="😊"
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
                Nombre de escena
              </label>
              <input
                type="text"
                value={scene.label || ''}
                onChange={(event) => updateDraft(index, { label: event.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Ceremonia, Fiesta..."
              />
            </div>
            <div className="w-full md:w-1/4">
              <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
                Identificador
              </label>
              <input
                type="text"
                value={scene.id || ''}
                onChange={(event) => updateDraft(index, { id: event.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                placeholder="ceremonia"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Se usará en filtros y reglas de automatización.
              </p>
            </div>
            <div className="flex items-center justify-end md:justify-start w-full md:w-auto">
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 border border-red-100 rounded-md transition"
                aria-label={`Eliminar escena ${scene.label || ''}`}
              >
                Quitar
              </button>
            </div>
          </div>
        ))}
        {!drafts.length && (
          <div className="border border-dashed border-gray-200 rounded-md p-6 text-center text-sm text-gray-500">
            Añade al menos una escena para organizar los momentos del evento.
          </div>
        )}
      </div>
    </section>
  );
}
