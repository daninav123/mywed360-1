import React, { useMemo, useState } from 'react';

const formatOptions = [
  { id: 'pdf', label: 'PDF (multipágina)' },
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
    const payload = {
      formats: Array.from(formats),
      tabs: Array.from(tabs),
      contents: Array.from(contents),
      config,
    };
    onGenerateExport?.(payload);
    resetAndClose();
  };

  const renderStep1 = () => (
    <div className="space-y-4">
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
          placeholder="Ej: Exportación para proveedores"
          className="w-full border px-2 py-1 rounded text-sm"
        />
        <p className="text-[11px] text-gray-500 mt-1">
          Guardaremos esta configuración para reutilizarla más adelante.
        </p>
      </div>

      <div className="border rounded-lg p-3 bg-gray-50 text-xs text-gray-600 space-y-1">
        <div className="font-medium text-gray-800">Resumen</div>
        <div>Formatos: {Array.from(formats).join(', ') || '—'}</div>
        <div>Pestañas: {Array.from(tabs).join(', ') || '—'}</div>
        <div>Contenido: {Array.from(contents).join(', ') || '—'}</div>
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
              <button
                onClick={handleSubmit}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Generar exportación
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
