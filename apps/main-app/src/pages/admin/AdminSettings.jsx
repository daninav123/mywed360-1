import React, { useEffect, useState } from 'react';

import { getSettingsData, updateFeatureFlag, rotateSecret, saveTemplate } from '../../services/adminDataService';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState([]);
  const [secrets, setSecrets] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [showFlagConfirm, setShowFlagConfirm] = useState(null);
  const [showSecretModal, setShowSecretModal] = useState(''); // almacena id del secreto
  const [rotateStep, setRotateStep] = useState(0);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      const data = await getSettingsData();
      setFlags(data.featureFlags || []);
      setSecrets(data.secrets || []);
      setTemplates(data.templates || []);
      const initialTemplate = (data.templates && data.templates[0]) || null;
      setSelectedTemplate(initialTemplate?.id || '');
      setTemplateContent(initialTemplate?.content || '');
      setLoading(false);
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const template = templates.find((item) => item.id === selectedTemplate);
    if (template) {
      setTemplateContent(template.content);
    }
  }, [selectedTemplate, templates]);

  const handleToggleFlag = (flag) => {
    setShowFlagConfirm(flag);
  };

  const confirmToggleFlag = async () => {
    if (!showFlagConfirm) return;
    try {
      const updated = await updateFeatureFlag(showFlagConfirm.id, !showFlagConfirm.enabled);
      if (updated) {
        setFlags((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      } else {
        setFlags((prev) => prev.map((f) => (f.id === showFlagConfirm.id ? { ...f, enabled: !f.enabled } : f)));
      }
    } catch (e) {
      // console.warn('[AdminSettings] toggle flag failed:', e);
    } finally {
      setShowFlagConfirm(null);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      await saveTemplate(selectedTemplate, templateContent);
      setTemplates((prev) =>
        prev.map((template) =>
          template.id === selectedTemplate ? { ...template, content: templateContent } : template
        )
      );
    } catch (e) {
      // console.warn('[AdminSettings] save template failed:', e);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-soft bg-surface px-4 py-6 text-sm text-[var(--color-text-soft,#6b7280)]">
        Cargando configuración...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-soft bg-surface shadow-sm">
        <header className="border-b border-soft px-4 py-3">
          <h1 className="text-lg font-semibold">Feature flags</h1>
        </header>
        <ul className="divide-y divide-soft">
          {flags.map((flag) => (
            <li key={flag.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{flag.name}</p>
                <p className="text-xs text-[var(--color-text-soft,#6b7280)]">{flag.description}</p>
              </div>
              <button
                type="button"
                data-testid="feature-flag-toggle"
                onClick={() => handleToggleFlag(flag)}
                className={
                  flag.enabled
                    ? 'rounded-full bg-green-100 px-4 py-2 text-xs font-medium text-green-700'
                    : 'rounded-full bg-[var(--color-bg-soft,#f3f4f6)] px-4 py-2 text-xs font-medium text-[var(--color-text-soft,#6b7280)]'
                }
              >
                {flag.enabled ? 'Activo' : 'Inactivo'}
              </button>
            </li>
          ))}
          {flags.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-[var(--color-text-soft,#6b7280)]">
              No hay banderas configuradas.
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-soft bg-surface shadow-sm">
        <header className="border-b border-soft px-4 py-3">
          <h2 className="text-sm font-semibold">Rotación de secretos</h2>
        </header>
        <ul className="divide-y divide-soft text-sm">
          {secrets.map((secret) => (
            <li key={secret.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">{secret.name}</p>
                <p className="text-xs text-[var(--color-text-soft,#6b7280)]">Última rotación: {secret.lastRotatedAt}</p>
              </div>
              <button
                type="button"
                data-testid="secret-rotate-button"
                onClick={() => { setRotateStep(0); setShowSecretModal(secret.id); }}
                className="rounded-md border border-soft px-3 py-1 text-xs hover:bg-[var(--color-bg-soft,#f3f4f6)]"
              >
                Rotar
              </button>
            </li>
          ))}
          {secrets.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-[var(--color-text-soft,#6b7280)]">
              No hay secretos configurados.
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-soft bg-surface shadow-sm p-4 space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Plantillas globales</h2>
          <p className="text-xs text-[var(--color-text-soft,#6b7280)]">Actualiza contenidos reutilizables.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-[240px_1fr]">
          <select
            data-testid="template-editor-select"
            value={selectedTemplate}
            onChange={(event) => setSelectedTemplate(event.target.value)}
            className="rounded-md border border-soft px-3 py-2 text-sm"
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <textarea
            data-testid="template-editor-content"
            value={templateContent}
            onChange={(event) => setTemplateContent(event.target.value)}
            rows={8}
            className="w-full rounded-md border border-soft px-3 py-2 text-sm"
          />
        </div>
        <div className="rounded-lg border border-dashed border-soft p-4 text-xs text-[var(--color-text-soft,#6b7280)]" data-testid="template-editor-preview">
          {templateContent}
        </div>
        <button
          type="button"
          data-testid="template-editor-save"
          onClick={handleSaveTemplate}
          className="rounded-md bg-[color:var(--color-primary,#6366f1)] px-4 py-2 text-sm font-semibold text-[color:var(--color-on-primary,#ffffff)] hover:bg-[color:var(--color-primary-dark,#4f46e5)]"
        >
          Guardar cambios
        </button>
      </section>

      {showFlagConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4" data-testid="feature-flag-confirm-modal">
          <div className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl space-y-4">
            <p className="text-sm">
              ¿Deseas {showFlagConfirm.enabled ? 'desactivar' : 'activar'} la bandera <strong>{showFlagConfirm.name}</strong>?
            </p>
            <div className="flex justify-end gap-3 text-sm">
              <button type="button" onClick={() => setShowFlagConfirm(null)} className="px-3 py-2 text-[var(--color-text-soft,#6b7280)]">
                Cancelar
              </button>
              <button
                type="button"
                data-testid="feature-flag-confirm"
                onClick={confirmToggleFlag}
                className="rounded-md bg-[color:var(--color-primary,#6366f1)] px-3 py-2 text-[color:var(--color-on-primary,#ffffff)]"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {showSecretModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4" data-testid="secret-rotate-modal">
          <div className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl space-y-4">
            <p className="text-sm text-[var(--color-text-soft,#6b7280)]">Proceso simulado de rotación en 3 pasos.</p>
            <div className="flex flex-col gap-2 text-sm">
              {rotateStep < 2 && (
                <button
                  type="button"
                  data-testid="secret-rotate-step-next"
                  onClick={() => setRotateStep((s) => s + 1)}
                  className="rounded-md border border-soft px-3 py-2"
                >
                  {rotateStep === 0 ? 'Paso siguiente' : 'Validar actualización'}
                </button>
              )}
              <button
                type="button"
                data-testid="secret-rotate-confirm"
                onClick={async () => {
                  try {
                    await rotateSecret(showSecretModal);
                  } catch (e) {
                    // console.warn('[AdminSettings] rotate secret failed:', e);
                  } finally {
                    setShowSecretModal('');
                    setRotateStep(0);
                  }
                }}
                className="rounded-md bg-[color:var(--color-primary,#6366f1)] px-3 py-2 text-[color:var(--color-on-primary,#ffffff)]"
              >
                Confirmar rotación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;