import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslations } from '../../hooks/useTranslations';

const DEFAULT_STORAGE_KEY = 'seating.export.presets';
const MAX_PREVIEW_WIDTH = 220;
const MAX_PREVIEW_HEIGHT = 160;

const MiniPreview = ({
  const { t } = useTranslations();
 snapshot, selectedTabs, selectedFormats, selectedContents }) => {
  const effectiveSnapshot = snapshot || {};
  const tables = Array.isArray(effectiveSnapshot.tables) ? effectiveSnapshot.tables : [];
  const hallSize = effectiveSnapshot.hallSize || { width: 1800, height: 1200 };
  const guestsCount = Number(effectiveSnapshot.guestsCount) || 0;
  const seats = Array.isArray(effectiveSnapshot.seats) ? effectiveSnapshot.seats : [];
  const areas = Array.isArray(effectiveSnapshot.areas) ? effectiveSnapshot.areas : [];

  const { shapes, previewWidth, previewHeight, capacityEstimate } = useMemo(() => {
    if (tables.length === 0) {
      return {
        shapes: [],
        previewWidth: MAX_PREVIEW_WIDTH,
        previewHeight: MAX_PREVIEW_HEIGHT,
        capacityEstimate: 0,
      };
    }

    const rawShapes = tables.slice(0, 60).map((table, index) => {
      const diameter =
        typeof table?.radius === 'number' && Number.isFinite(table.radius)
          ? table.radius * 2
          : undefined;
      const width =
        typeof table?.width === 'number' && Number.isFinite(table.width)
          ? table.width
          : diameter || 160;
      const height =
        typeof table?.height === 'number' && Number.isFinite(table.height)
          ? table.height
          : diameter || 120;
      const cx =
        typeof table?.x === 'number' && Number.isFinite(table.x)
          ? table.x
          : index * (width + 120);
      const cy =
        typeof table?.y === 'number' && Number.isFinite(table.y)
          ? table.y
          : (index % 6) * (height + 140);
      const seatsCount = Number(table?.seats || table?.capacity || 0) || 0;
      return {
        id: table?.id ?? `table-${index}`,
        cx,
        cy,
        width: Math.max(width, 80),
        height: Math.max(height, 80),
        shape: table?.shape || table?.tableType || 'round',
        seatsCount,
      };
    });

    const minX = rawShapes.reduce(
      (acc, shape) => Math.min(acc, shape.cx - shape.width / 2),
      0
    );
    const minY = rawShapes.reduce(
      (acc, shape) => Math.min(acc, shape.cy - shape.height / 2),
      0
    );
    const maxX = rawShapes.reduce(
      (acc, shape) => Math.max(acc, shape.cx + shape.width / 2),
      hallSize.width || 1800
    );
    const maxY = rawShapes.reduce(
      (acc, shape) => Math.max(acc, shape.cy + shape.height / 2),
      hallSize.height || 1200
    );

    const spanX = Math.max(maxX - minX, hallSize.width || 1800, 1);
    const spanY = Math.max(maxY - minY, hallSize.height || 1200, 1);
    const ratio = Math.min(
      MAX_PREVIEW_WIDTH / spanX,
      MAX_PREVIEW_HEIGHT / spanY,
      1
    );
    const scaledShapes = rawShapes.map((shape) => ({
      id: shape.id,
      type: shape.shape,
      seatsCount: shape.seatsCount,
      width: Math.max(shape.width * ratio, 6),
      height: Math.max(shape.height * ratio, 6),
      left: (shape.cx - minX - shape.width / 2) * ratio,
      top: (shape.cy - minY - shape.height / 2) * ratio,
    }));
    const estimatedCapacity = rawShapes.reduce(
      (sum, shape) => sum + (shape.seatsCount || 0),
      0
    );

    return {
      shapes: scaledShapes,
      previewWidth: Math.max(spanX * ratio, 60),
      previewHeight: Math.max(spanY * ratio, 60),
      capacityEstimate: estimatedCapacity,
    };
  }, [tables, hallSize]);

  const selectedTabsList = Array.from(selectedTabs || []);
  const selectedFormatsList = Array.from(selectedFormats || []);
  const selectedContentsList = Array.from(selectedContents || []);

  return (
    <div className="border rounded-lg bg-slate-900/95 text-white shadow-inner overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
          Vista previa miniatura
        </span>
        <span className="text-[10px] text-slate-400">
          Pestaña activa: {snapshot?.tab ? snapshot.tab.toUpperCase() : 'N/D'}
        </span>
      </div>
      <div className="p-3 space-y-3">
        <div
          className="relative mx-auto rounded border border-slate-700 bg-slate-800/90"
          style={{
            width: `${previewWidth}px`,
            height: `${previewHeight}px`,
            maxWidth: '100%',
          }}
        >
          {shapes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-400">
              No hay mesas en el plano actual.
            </div>
          ) : (
            shapes.map((shape) => (
              <div
                key={shape.id}
                className={`absolute border border-slate-600/80 bg-white/90 ${
                  shape.type === 'round' || shape.type === 'circular'
                    ? 'rounded-full'
                    : 'rounded'
                }`}
                style={{
                  left: `${shape.left}px`,
                  top: `${shape.top}px`,
                  width: `${shape.width}px`,
                  height: `${shape.height}px`,
                  boxShadow: '0 0 6px rgba(15, 23, 42, 0.25)',
                }}
              />
            ))
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-300">
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">
              Resumen
            </div>
            <div>Mesas visibles: {tables.length}</div>
            <div>
              Capacidad estimada: {capacityEstimate || seats.length || '—'} pax
            </div>
            <div>Invitados asignados: {guestsCount}</div>
            <div>Áreas dibujadas: {areas.length}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">
              Selección
            </div>
            <div>
              Tabs: {selectedTabsList.length ? selectedTabsList.join(', ') : '—'}
            </div>
            <div>
              Formatos:{' '}
              {selectedFormatsList.length ? selectedFormatsList.join(', ') : '—'}
            </div>
            <div>
              Contenido:{' '}
              {selectedContentsList.length ? selectedContentsList.join(', ') : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatOptions = [
  { id: 'pdf', label: {t('common.pdf_multipagina')} },
  { id: 'svg', label: 'SVG editable' },
  { id: 'csv', label: 'CSV (resumen invitados)' },
];

const tabOptions = [
  { id: 'ceremony', label: 'Ceremonia' },
  { id: 'banquet', label: 'Banquete' },
  { id: 'free-draw', label: 'Libre' },
];

const defaultContentOptions = [
  { id: 'legend', label: 'Leyenda de colores' },
  { id: 'guestList', label: 'Lista de invitados por mesa' },
  { id: 'resolvedConflicts', label: 'Resumen de conflictos resueltos' },
  { id: 'providerNotes', label: 'Notas para proveedores' },
  { id: 'setupInstructions', label: 'Instrucciones de montaje/pasillos' },
];

export default function SeatingExportWizard({
  open = false,
  onClose,
  onGenerateExport,
  availableTabs = ['ceremony', 'banquet', 'free-draw'],
  defaultSelection = { formats: ['pdf'], tabs: ['ceremony', 'banquet'] },
  storageKey,
  previewData,
}) {
  const [step, setStep] = useState(1);
  const [formats, setFormats] = useState(new Set(defaultSelection.formats || ['pdf']));
  const [tabs, setTabs] = useState(new Set(defaultSelection.tabs || availableTabs));
  const [contents, setContents] = useState(new Set(['legend', 'guestList']));
  const [config, setConfig] = useState({
    orientation: 'portrait',
    scale: '1:75',
    includeMeasures: true,
    language: 'es',
    logoUrl: '',
    presetName: '',
  });

  const resolvedStorageKey = storageKey || DEFAULT_STORAGE_KEY;
  const canUseStorage =
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

  const loadPresetsFromStorage = useCallback(() => {
    if (!canUseStorage) return [];
    try {
      const raw = window.localStorage.getItem(resolvedStorageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item) => item && typeof item.name === 'string' && item.name.trim().length > 0)
        .map((item) => ({
          id:
            item.id ||
            (item.name ? `${item.name}-${item.updatedAt || ''}` : `preset-${Date.now()}`),
          name: item.name,
          formats: Array.isArray(item.formats) ? item.formats : [],
          tabs: Array.isArray(item.tabs) ? item.tabs : [],
          contents: Array.isArray(item.contents) ? item.contents : [],
          config:
            item.config && typeof item.config === 'object'
              ? item.config
              : {
                  orientation: 'portrait',
                  scale: '1:75',
                  includeMeasures: true,
                  language: 'es',
                  logoUrl: '',
                },
          updatedAt: item.updatedAt || null,
        }));
    } catch {
      return [];
    }
  }, [resolvedStorageKey, canUseStorage]);

  const [presets, setPresets] = useState(() => loadPresetsFromStorage());

  useEffect(() => {
    setPresets(loadPresetsFromStorage());
  }, [loadPresetsFromStorage]);

  useEffect(() => {
    if (!canUseStorage) return;
    try {
      window.localStorage.setItem(resolvedStorageKey, JSON.stringify(presets));
    } catch (_) {}
  }, [presets, resolvedStorageKey, canUseStorage]);

  const sortedPresets = useMemo(
    () => [...presets].sort((a, b) => a.name.localeCompare(b.name)),
    [presets]
  );

  const canContinueStep1 = formats.size > 0;
  const canContinueStep2 = contents.size > 0 || formats.has('csv');

  const isTabEnabled = (id) => availableTabs.includes(id);

  const handleFormatChange = (id) => {
    setFormats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTabToggle = (id) => {
    if (!isTabEnabled(id)) return;
    setTabs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleContentToggle = (id) => {
    setContents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfigChange = (patch) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const handleSavePreset = useCallback(
    ({ silent = false } = {}) => {
      const trimmedName = (config.presetName || '').trim();
      if (!trimmedName) {
        if (!silent) toast.error('Introduce un nombre para el preset antes de guardarlo');
        return false;
      }
      const baseConfig = {
        orientation: config.orientation,
        scale: config.scale,
        includeMeasures: config.includeMeasures,
        language: config.language,
        logoUrl: config.logoUrl,
      };
      const normalized = trimmedName.toLowerCase();
      let saved = false;
      setPresets((prev) => {
        const existing = prev.find(
          (preset) => preset.name && preset.name.toLowerCase() === normalized
        );
        const nextPreset = {
          id:
            existing?.id ||
            (typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `preset-${Date.now()}`),
          name: trimmedName,
          formats: Array.from(formats),
          tabs: Array.from(tabs),
          contents: Array.from(contents),
          config: baseConfig,
          updatedAt: new Date().toISOString(),
        };
        saved = true;
        const filtered = prev.filter(
          (preset) => preset.name && preset.name.toLowerCase() !== normalized
        );
        return [...filtered, nextPreset].sort((a, b) => a.name.localeCompare(b.name));
      });
      setConfig((prev) => ({ ...prev, presetName: trimmedName }));
      if (saved && !silent) {
        toast.success(`Preset "${trimmedName}" guardado`);
      }
      return saved;
    },
    [config, contents, formats, tabs, setConfig, setPresets]
  );

  const handleApplyPreset = useCallback(
    (preset) => {
      if (!preset) return;
      const nextFormats =
        Array.isArray(preset.formats) && preset.formats.length
          ? preset.formats
          : defaultSelection.formats || ['pdf'];
      const nextTabs =
        Array.isArray(preset.tabs) && preset.tabs.length ? preset.tabs : availableTabs;
      const nextContents =
        Array.isArray(preset.contents) && preset.contents.length
          ? preset.contents
          : ['legend', 'guestList'];
      setFormats(new Set(nextFormats));
      setTabs(new Set(nextTabs));
      setContents(new Set(nextContents));
      const presetConfig =
        preset.config && typeof preset.config === 'object' ? preset.config : {};
      setConfig((prev) => ({
        ...prev,
        orientation: presetConfig.orientation || prev.orientation,
        scale: presetConfig.scale || prev.scale,
        includeMeasures:
          typeof presetConfig.includeMeasures === 'boolean'
            ? presetConfig.includeMeasures
            : prev.includeMeasures,
        language: presetConfig.language || prev.language,
        logoUrl: presetConfig.logoUrl || '',
        presetName: preset.name || '',
      }));
      toast.success(`Preset "${preset.name}" aplicado`);
    },
    [availableTabs, defaultSelection, setConfig, setContents, setFormats, setTabs]
  );

  const handleDeletePreset = useCallback(
    (presetId) => {
      setPresets((prev) => prev.filter((preset) => preset.id !== presetId));
      toast.info('Preset eliminado');
    },
    [setPresets]
  );

  const renderPresetList = useCallback(
    (variant = 'default') => {
      if (!sortedPresets.length) return null;
      const listWrapperClasses =
        variant === 'compact'
          ? 'border border-gray-200 rounded-lg bg-gray-50 p-3'
          : 'border rounded-lg bg-white shadow-sm p-4';
      return (
        <div className={listWrapperClasses}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">Presets guardados</h3>
            <span className="text-[11px] text-gray-500">{sortedPresets.length}</span>
          </div>
          <div className="space-y-2 max-h-52 overflow-auto pr-1">
            {sortedPresets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between gap-2 rounded border border-gray-200 bg-white px-2 py-1.5 text-xs"
              >
                <div>
                  <div className="font-semibold text-gray-800">{preset.name}</div>
                  <div className="text-[10px] text-gray-500">
                    {preset.formats?.join(', ') || '—'} · {preset.tabs?.join(', ') || '—'}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                    onClick={() => handleApplyPreset(preset)}
                  >
                    Aplicar
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50"
                    onClick={() => handleDeletePreset(preset.id)}
                  >
                    Borrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    },
    [handleApplyPreset, handleDeletePreset, sortedPresets]
  );

  const resetAndClose = () => {
    setStep(1);
    setFormats(new Set(defaultSelection.formats || ['pdf']));
    setTabs(new Set(defaultSelection.tabs || availableTabs));
    setContents(new Set(['legend', 'guestList']));
    setConfig({
      orientation: 'portrait',
      scale: '1:75',
      includeMeasures: true,
      language: 'es',
      logoUrl: '',
      presetName: '',
    });
    onClose?.();
  };

  const handleSubmit = () => {
    if ((config.presetName || '').trim()) {
      handleSavePreset({ silent: true });
    }
    const payload = {
      formats: Array.from(formats),
      tabs: Array.from(tabs),
      contents: Array.from(contents),
      config,
      snapshot: previewData || null,
    };
    onGenerateExport?.(payload);
    resetAndClose();
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      {renderPresetList()}
      <div className="grid md:grid-cols-[1.4fr,1fr] gap-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Formatos a exportar</h3>
            <div className="space-y-2">
              {formatOptions.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formats.has(opt.id)}
                    onChange={() => handleFormatChange(opt.id)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Pestañas a incluir</h3>
            <div className="space-y-2">
              {tabOptions.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-2 text-sm ${
                    isTabEnabled(opt.id) ? '' : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={tabs.has(opt.id)}
                    onChange={() => handleTabToggle(opt.id)}
                    disabled={!isTabEnabled(opt.id)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 text-xs text-gray-600 px-3 py-2 border-b">
            Preview (placeholder)
          </div>
          <div className="flex-1 min-h-[180px] bg-white flex items-center justify-center text-xs text-gray-400 px-4 text-center">
            La vista previa interactiva se habilitará cuando la generación esté implementada.
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-900 mb-2">Contenido adicional</h3>
      <p className="text-xs text-gray-500 mb-2">
        Selecciona secciones para adjuntar junto al plano. Si eliges sólo CSV, puedes dejar este
        paso vacío.
      </p>
      <div className="space-y-2">
        {defaultContentOptions.map((opt) => (
          <label key={opt.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={contents.has(opt.id)}
              onChange={() => handleContentToggle(opt.id)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="grid md:grid-cols-[1.15fr,0.85fr] gap-4">
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Orientación</label>
            <select
              value={config.orientation}
              onChange={(e) => handleConfigChange({ orientation: e.target.value })}
              className="w-full border px-2 py-1 rounded text-sm"
            >
              <option value="portrait">Vertical</option>
              <option value="landscape">Horizontal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Escala</label>
            <select
              value={config.scale}
              onChange={(e) => handleConfigChange({ scale: e.target.value })}
              className="w-full border px-2 py-1 rounded text-sm"
            >
              <option value="1:50">1:50</option>
              <option value="1:75">1:75</option>
              <option value="1:100">1:100</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Idioma</label>
            <select
              value={config.language}
              onChange={(e) => handleConfigChange({ language: e.target.value })}
              className="w-full border px-2 py-1 rounded text-sm"
            >
              <option value="es">Español</option>
              <option value="en">Inglés</option>
              <option value="pt">Portugués</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="includeMeasures"
              type="checkbox"
              checked={config.includeMeasures}
              onChange={(e) => handleConfigChange({ includeMeasures: e.target.checked })}
            />
            <label htmlFor="includeMeasures" className="text-xs text-gray-600">
              Incluir medidas y leyenda de escala
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Logotipo (URL opcional)</label>
          <input
            type="url"
            value={config.logoUrl}
            onChange={(e) => handleConfigChange({ logoUrl: e.target.value })}
            placeholder="https://..."
            className="w-full border px-2 py-1 rounded text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Guardar preset (nombre opcional)
          </label>
          <input
            type="text"
            value={config.presetName}
            onChange={(e) => handleConfigChange({ presetName: e.target.value })}
            placeholder={t('common.exportacion_para_proveedores')}
            className="w-full border px-2 py-1 rounded text-sm"
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Introduce un nombre y pulsa <strong>Guardar preset</strong> para reutilizar esta
            configuración en futuras exportaciones.
          </p>
        </div>

        <div className="border rounded-lg p-3 bg-gray-50 text-xs text-gray-600 space-y-1">
          <div className="font-medium text-gray-800">Resumen</div>
          <div>Formatos: {Array.from(formats).join(', ') || '—'}</div>
          <div>Pestañas: {Array.from(tabs).join(', ') || '—'}</div>
          <div>Contenido: {Array.from(contents).join(', ') || '—'}</div>
        </div>
      </div>
      <div className="space-y-4">
        <MiniPreview
          snapshot={previewData}
          selectedTabs={Array.from(tabs)}
          selectedFormats={Array.from(formats)}
          selectedContents={Array.from(contents)}
        />
        {renderPresetList('compact')}
      </div>
    </div>
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Exportar plan de asientos · paso {step} de 3
            </p>
            <p className="text-xs text-gray-500">
              Configura formatos, contenido y opciones antes de generar el archivo.
            </p>
          </div>
          <button
            onClick={resetAndClose}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            Cerrar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        <div className="px-5 py-4 border-t flex items-center justify-between bg-gray-50">
          <div className="text-xs text-gray-500">
            {step < 3 && (
              <span>
                Debes completar todas las secciones para continuar. Los datos se usan sólo para
                exportar; no afectan el plano guardado.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={resetAndClose}
              className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Cancelar
            </button>
            {step > 1 && (
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Anterior
              </button>
            )}
            {step < 3 && (
              <button
                onClick={() => setStep((s) => Math.min(3, s + 1))}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={(step === 1 && !canContinueStep1) || (step === 2 && !canContinueStep2)}
              >
                Siguiente
              </button>
            )}
            {step === 3 && (
              <>
                <button
                  onClick={() => handleSavePreset()}
                  className="px-3 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!config.presetName || !config.presetName.trim()}
                >
                  Guardar preset
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Generar exportación
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
