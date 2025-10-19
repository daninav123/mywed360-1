import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getTaskTemplates,
  saveTaskTemplateDraft,
  publishTaskTemplate,
  previewTaskTemplate,
} from '../../services/adminDataService';

const EMPTY_FORM = {
  id: null,
  name: '',
  notes: '',
  version: null,
  status: 'draft',
  blocksJson: JSON.stringify([], null, 2),
};

const STATUS_LABELS = {
  draft: 'Borrador',
  published: 'Publicado',
  archived: 'Archivado',
};

function formatCount(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString('es-ES');
}

function ensureJsonString(value) {
  try {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        JSON.parse(trimmed);
        return trimmed;
      }
    }
  } catch (error) {
    // ignore
  }
  return JSON.stringify(Array.isArray(value) ? value : [], null, 2);
}

const AdminTaskTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [meta, setMeta] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const nextSuggestedVersion = useMemo(() => {
    if (!templates.length) return 1;
    const highest = templates.reduce((acc, tpl) => Math.max(acc, Number(tpl.version) || 0), 0);
    return highest + 1;
  }, [templates]);

  const hydrateForm = useCallback((template) => {
    if (!template) {
      setForm({
        ...EMPTY_FORM,
        version: nextSuggestedVersion,
      });
      return;
    }
    setForm({
      id: template.id || null,
      name: template.name || '',
      notes: template.notes || '',
      version: Number(template.version) || null,
      status: template.status || 'draft',
      blocksJson: ensureJsonString(template.blocks || []),
    });
  }, [nextSuggestedVersion]);

  const selectTemplate = useCallback(
    (id, list) => {
      const source = Array.isArray(list) ? list : templates;
      const target = source.find((tpl) => tpl.id === id);
      if (!target) return;
      setSelectedId(target.id);
      hydrateForm(target);
      setPreview(null);
      setError(null);
      setMessage(null);
    },
    [hydrateForm, templates],
  );

  const loadTemplates = useCallback(
    async ({ forceRefresh = false, silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const data = await getTaskTemplates({ forceRefresh });
        const items = Array.isArray(data?.templates) ? data.templates : [];
        setTemplates(items);
        setMeta(data?.meta || {});
        if (!items.length) {
          setSelectedId(null);
          hydrateForm(null);
        }
        return { items, meta: data?.meta || {} };
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [hydrateForm],
  );

  useEffect(() => {
    (async () => {
      const { items, meta: metaInfo } = await loadTemplates({ forceRefresh: true });
      let defaultId = metaInfo?.latestPublished?.id || null;
      if (!defaultId && items.length) {
        defaultId = items[0].id;
      }
      if (defaultId) {
        selectTemplate(defaultId, items);
      } else if (!items.length) {
        hydrateForm(null);
      }
    })();
  }, [loadTemplates, selectTemplate, hydrateForm]);

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
    setMessage(null);
  };

  const handleVersionChange = (event) => {
    const raw = event.target.value;
    setForm((prev) => ({
      ...prev,
      version: raw === '' ? null : Number(raw),
    }));
    setError(null);
    setMessage(null);
  };

  const handleBlocksChange = (event) => {
    setForm((prev) => ({
      ...prev,
      blocksJson: event.target.value,
    }));
    setError(null);
    setMessage(null);
  };

  const handleNewDraft = () => {
    setSelectedId(null);
    setPreview(null);
    setError(null);
    setMessage(null);
    setForm({
      ...EMPTY_FORM,
      version: nextSuggestedVersion,
    });
  };

  const handleSaveDraft = async () => {
    setError(null);
    setMessage(null);
    let parsedBlocks;
    try {
      parsedBlocks = JSON.parse(form.blocksJson || '[]');
      if (!Array.isArray(parsedBlocks)) {
        throw new Error('La plantilla debe ser un array de bloques.');
      }
    } catch (parseError) {
      setError('No se pudo interpretar el JSON de bloques. Verifica la estructura.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: form.id || undefined,
        name: form.name || undefined,
        notes: form.notes || undefined,
        version: Number.isFinite(form.version) ? Number(form.version) : undefined,
        blocks: parsedBlocks,
      };
      const result = await saveTaskTemplateDraft(payload);
      const { items } = await loadTemplates({ forceRefresh: true, silent: true });
      const targetId = result?.id || payload.id || (items[0]?.id ?? null);
      if (targetId) {
        selectTemplate(targetId, items);
      } else {
        setSelectedId(null);
        hydrateForm(null);
      }
      setMessage('Borrador guardado correctamente.');
    } catch (saveError) {
      setError(saveError?.message || 'No se pudo guardar la plantilla.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!form.id) {
      setError('Guarda la plantilla antes de publicarla.');
      return;
    }
    setPublishing(true);
    setError(null);
    setMessage(null);
    try {
      await publishTaskTemplate(form.id);
      const { items } = await loadTemplates({ forceRefresh: true, silent: true });
      selectTemplate(form.id, items);
      setMessage('Versión publicada correctamente.');
    } catch (publishError) {
      setError(publishError?.message || 'No se pudo publicar la plantilla.');
    } finally {
      setPublishing(false);
    }
  };

  const handlePreview = async () => {
    if (!form.id) {
      setError('Guarda la plantilla antes de generar una vista previa.');
      return;
    }
    setPreviewing(true);
    setError(null);
    setMessage(null);
    try {
      const data = await previewTaskTemplate(form.id, {});
      setPreview(data?.preview || null);
    } catch (previewError) {
      setError(previewError?.message || 'No se pudo generar la vista previa.');
    } finally {
      setPreviewing(false);
    }
  };

  const selectedTemplate = useMemo(
    () => templates.find((tpl) => tpl.id === selectedId) || null,
    [templates, selectedId],
  );

  const templateSummary = useMemo(() => {
    if (!selectedTemplate) return null;
    const totals = selectedTemplate.totals || {};
    return {
      blocks: totals.blocks || 0,
      subtasks: totals.subtasks || 0,
      updatedAt: selectedTemplate.updatedAt || '—',
      publishedAt: selectedTemplate.publishedAt || null,
    };
  }, [selectedTemplate]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Plantillas de tareas</h1>
        <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
          Gestiona el seed de tareas padre y subtareas aplicado a cada nueva boda. Puedes editar en JSON, guardar
          versiones de borrador y publicar la vigente.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase text-[var(--color-text-soft,#6b7280)]">
              Versiones disponibles
            </h2>
            <button
              type="button"
              onClick={handleNewDraft}
              className="rounded-md border border-dashed border-[var(--color-border-soft,#d1d5db)] px-2 py-1 text-xs font-medium text-[var(--color-primary,#2563eb)] hover:border-[var(--color-primary,#2563eb)]"
            >
              Nuevo borrador
            </button>
          </div>
          <div className="space-y-2">
            {loading && !templates.length ? (
              <div className="rounded-lg border border-soft bg-surface px-3 py-4 text-sm text-[var(--color-text-soft,#6b7280)]">
                Cargando plantillas...
              </div>
            ) : null}
            {templates.map((tpl) => {
              const isActive = tpl.id === selectedId;
              const statusLabel = STATUS_LABELS[tpl.status] || tpl.status;
              const totals = tpl.totals || {};
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => selectTemplate(tpl.id)}
                  className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                    isActive
                      ? 'border-[var(--color-primary,#2563eb)] bg-[var(--color-bg-soft,#f3f4f6)] ring-1 ring-[var(--color-primary,#2563eb)]'
                      : 'border-[var(--color-border-soft,#d1d5db)] hover:border-[var(--color-primary,#2563eb)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-sm font-medium">
                    <span>{tpl.name || `Plantilla v${tpl.version}`}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        tpl.status === 'published'
                          ? 'bg-[var(--color-primary-muted,#dbeafe)] text-[var(--color-primary,#2563eb)]'
                          : 'bg-[var(--color-border-soft,#d1d5db)] text-[var(--color-text-soft,#6b7280)]'
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--color-text-soft,#6b7280)]">
                    v{tpl.version || '—'} · {formatCount(totals.blocks)} bloques · {formatCount(totals.subtasks)} subtareas
                  </div>
                  <div className="text-xs text-[var(--color-text-soft,#6b7280)]">
                    {tpl.updatedAt ? `Actualizado ${tpl.updatedAt}` : 'Sin fecha de actualización'}
                  </div>
                </button>
              );
            })}
            {!loading && !templates.length ? (
              <div className="rounded-lg border border-dashed border-[var(--color-border-soft,#d1d5db)] px-3 py-4 text-xs text-[var(--color-text-soft,#6b7280)]">
                Aún no hay plantillas guardadas. Crea un borrador para empezar.
              </div>
            ) : null}
          </div>
          {meta?.latestPublished ? (
            <div className="rounded-lg border border-soft bg-surface px-3 py-3 text-xs text-[var(--color-text-soft,#6b7280)]">
              <div className="font-semibold text-[var(--color-text,#111827)]">Última publicada</div>
              <div>ID: {meta.latestPublished.id}</div>
              <div>Versión: {meta.latestPublished.version}</div>
              <div>Actualizada: {meta.latestPublished.updatedAt || '—'}</div>
            </div>
          ) : null}
        </aside>

        <section className="space-y-5">
          <div className="rounded-xl border border-soft bg-surface shadow-sm">
            <div className="border-b border-soft px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--color-text,#111827)]">
                    {form.id ? `Plantilla ${form.name || form.id}` : 'Nuevo borrador'}
                  </h2>
                  {templateSummary ? (
                    <p className="text-xs text-[var(--color-text-soft,#6b7280)]">
                      {formatCount(templateSummary.blocks)} bloques · {formatCount(templateSummary.subtasks)} subtareas ·{' '}
                      Última actualización {templateSummary.updatedAt}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePreview}
                    disabled={!form.id || previewing}
                    className={`rounded-md border px-3 py-1 text-xs font-medium ${
                      !form.id || previewing
                        ? 'cursor-not-allowed border-[var(--color-border-soft,#d1d5db)] text-[var(--color-text-soft,#9ca3af)]'
                        : 'border-[var(--color-border-soft,#d1d5db)] text-[var(--color-text,#111827)] hover:border-[var(--color-primary,#2563eb)]'
                    }`}
                  >
                    {previewing ? 'Generando vista...' : 'Vista previa'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className={`rounded-md px-3 py-1 text-xs font-semibold text-white ${
                      saving
                        ? 'bg-[var(--color-primary-muted,#93c5fd)]'
                        : 'bg-[var(--color-primary,#2563eb)] hover:bg-[var(--color-primary-dark,#1d4ed8)]'
                    }`}
                  >
                    {saving ? 'Guardando...' : 'Guardar borrador'}
                  </button>
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={!form.id || publishing}
                    className={`rounded-md border px-3 py-1 text-xs font-medium ${
                      !form.id || publishing
                        ? 'cursor-not-allowed border-[var(--color-border-soft,#d1d5db)] text-[var(--color-text-soft,#9ca3af)]'
                        : 'border-[var(--color-primary,#2563eb)] text-[var(--color-primary,#2563eb)] hover:bg-[var(--color-primary-muted,#dbeafe)]'
                    }`}
                  >
                    {publishing ? 'Publicando...' : 'Publicar'}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-4 py-5 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-[var(--color-text-soft,#6b7280)]" htmlFor="task-template-name">
                    Nombre interno
                  </label>
                  <input
                    id="task-template-name"
                    value={form.name}
                    onChange={handleFieldChange('name')}
                    placeholder="Plantilla base 2025"
                    className="w-full rounded-md border border-soft px-3 py-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-[var(--color-text-soft,#6b7280)]" htmlFor="task-template-version">
                    Versión
                  </label>
                  <input
                    id="task-template-version"
                    type="number"
                    min="1"
                    value={form.version ?? ''}
                    onChange={handleVersionChange}
                    className="w-full rounded-md border border-soft px-3 py-2"
                    placeholder={String(nextSuggestedVersion)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-[var(--color-text-soft,#6b7280)]" htmlFor="task-template-notes">
                  Notas
                </label>
                <textarea
                  id="task-template-notes"
                  rows={2}
                  value={form.notes}
                  onChange={handleFieldChange('notes')}
                  placeholder="Notas de cambio o contexto de la plantilla."
                  className="w-full rounded-md border border-soft px-3 py-2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-[var(--color-text-soft,#6b7280)]" htmlFor="task-template-json">
                  Bloques (JSON)
                </label>
                <textarea
                  id="task-template-json"
                  rows={18}
                  value={form.blocksJson}
                  onChange={handleBlocksChange}
                  className="w-full rounded-md border border-soft px-3 py-2 font-mono text-xs leading-5"
                  spellCheck={false}
                />
                <p className="text-xs text-[var(--color-text-soft,#6b7280)]">
                  Debe ser un array de bloques. Cada bloque admite propiedades como <code>name</code>, <code>startPct</code>, <code>endPct</code>, <code>admin</code> e <code>items</code> (subtareas con campos opcionales como <code>category</code>, <code>assigneeSuggestion</code>, <code>checklist</code>, etc.).
                </p>
              </div>

              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              ) : null}
              {message ? (
                <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                  {message}
                </div>
              ) : null}
            </div>
          </div>

          {preview ? (
            <div className="rounded-xl border border-soft bg-surface shadow-sm">
              <div className="border-b border-soft px-4 py-3">
                <h3 className="text-sm font-semibold text-[var(--color-text,#111827)]">Vista previa (ejemplo)</h3>
                <p className="text-xs text-[var(--color-text-soft,#6b7280)]">
                  Wedding date: {preview.weddingDate} · {formatCount(preview.blocks?.length || 0)} bloques · {formatCount(preview.totals?.subtasks || 0)} subtareas
                </p>
              </div>
              <div className="px-4 py-4">
                <div className="max-h-64 overflow-auto rounded-md border border-soft bg-[var(--color-bg-soft,#f9fafb)] p-3 text-xs font-mono leading-5">
                  <pre>
                    {JSON.stringify(
                      (preview.blocks || []).slice(0, 3),
                      null,
                      2,
                    )}
                    {(preview.blocks || []).length > 3 ? '\n…' : ''}
                  </pre>
                </div>
                <p className="mt-2 text-xs text-[var(--color-text-soft,#6b7280)]">
                  Se muestran los primeros bloques de la vista previa. La respuesta completa incluye todas las fechas y subtareas generadas para el ejemplo.
                </p>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default AdminTaskTemplates;
