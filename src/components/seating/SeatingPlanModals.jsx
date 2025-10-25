import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import BanquetConfigModal from '../BanquetConfigModal';
import CeremonyConfigModal from '../CeremonyConfigModal';
import Modal from '../Modal';
import VenueTemplateSelector from './VenueTemplateSelector';
import { useTranslations } from '../../hooks/useTranslations';

const clampNumber = (value, fallback, {
  const { t } = useTranslations();
 min, max }) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  let result = parsed;
  if (Number.isFinite(min)) result = Math.max(min, result);
  if (Number.isFinite(max)) result = Math.min(max, result);
  return result;
};

const BackgroundModal = ({
  open,
  background,
  hallSize,
  onSave,
  onClose,
}) => {
  const initialWidth = hallSize?.width || 1800;
  const buildDraft = useCallback(
    () => ({
      dataUrl: background?.dataUrl || '',
      widthCm: background?.widthCm || initialWidth,
      opacity: background?.opacity ?? 0.5,
    }),
    [background?.dataUrl, background?.opacity, background?.widthCm, initialWidth]
  );

  const [draft, setDraft] = useState(buildDraft);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (open) {
      setDraft(buildDraft());
      setUploadError('');
    }
  }, [open, buildDraft]);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Selecciona un archivo de imagen (JPG, PNG, SVG…).');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((prev) => ({
        ...prev,
        dataUrl: typeof reader.result === 'string' ? reader.result : '',
      }));
      setUploadError('');
    };
    reader.onerror = () => setUploadError('No se pudo leer el archivo.');
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (typeof onSave !== 'function') {
      onClose?.();
      return;
    }
    const payload = draft.dataUrl
      ? {
          dataUrl: draft.dataUrl,
          widthCm: clampNumber(draft.widthCm, initialWidth, { min: 100 }),
          opacity: clampNumber(draft.opacity, 0.5, { min: 0, max: 1 }),
        }
      : null;
    try {
      await onSave(payload);
      onClose?.();
    } catch (err) {
      setUploadError(err?.message || 'No se pudo guardar el fondo.');
    }
  };

  const handleRemove = async () => {
    if (typeof onSave === 'function') {
      try {
        await onSave(null);
      } catch (err) {
        setUploadError(err?.message || 'No se pudo eliminar el fondo.');
        return;
      }
    }
    onClose?.();
  };

  return (
    <Modal open={open} title="Fondo del plano" onClose={onClose} size="lg">
      <form className="space-y-4" onSubmit={handleSave}>
        <p className="text-sm text-gray-600">
          Puedes subir un plano de la sala para calcarlo en el lienzo. El archivo se guarda como data URL
          local y se escala al ancho indicado (cm reales).
        </p>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Imagen de referencia
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="w-full text-sm"
          />
          <textarea
            value={draft.dataUrl}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, dataUrl: e.target.value.trim() }))
            }
            placeholder={t('common.pega_aqui_una_data_url')}
            className="w-full min-h-[90px] text-xs border rounded px-2 py-1"
          />
          {draft.dataUrl && (
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="font-medium">Vista previa:</span>
              <img
                src={draft.dataUrl}
                alt="Vista previa fondo"
                className="max-h-20 border rounded"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex flex-col text-sm text-gray-700">
            Ancho (cm)
            <input
              type="number"
              min={100}
              value={draft.widthCm}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, widthCm: e.target.value }))
              }
              className="mt-1 border rounded px-2 py-1"
            />
          </label>
          <label className="flex flex-col text-sm text-gray-700">
            Opacidad ({Math.round((draft.opacity ?? 0.5) * 100)}%)
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round((draft.opacity ?? 0.5) * 100)}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  opacity: clampNumber(e.target.value / 100, 0.5, {
                    min: 0,
                    max: 1,
                  }),
                }))
              }
              className="mt-1"
            />
          </label>
          <label className="flex flex-col text-sm text-gray-700">
            Transparencia manual
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={draft.opacity ?? 0.5}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  opacity: clampNumber(e.target.value, 0.5, {
                    min: 0,
                    max: 1,
                  }),
                }))
              }
              className="mt-1 border rounded px-2 py-1"
            />
          </label>
        </div>

        {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

        <div className="flex justify-between pt-2">
          <button
            type="button"
            className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
            onClick={handleRemove}
          >
            Quitar fondo
          </button>
          <div className="space-x-2">
            <button
              type="button"
              className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Guardar fondo
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

const CapacityModal = ({
  open,
  globalMaxSeats,
  onSave,
  onClose,
}) => {
  const [value, setValue] = useState(globalMaxSeats || 0);

  useEffect(() => {
    if (open) setValue(globalMaxSeats || 0);
  }, [open, globalMaxSeats]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (typeof onSave === 'function') {
      await onSave(clampNumber(value, 0, { min: 0 }));
    }
    onClose?.();
  };

  return (
    <Modal open={open} title="Capacidad global" onClose={onClose} size="sm">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <p className="text-sm text-gray-600">
          Define el número máximo de invitados que deberían caber en el salón. Se usa para validar
          nuevas mesas y para mostrar avisos de overbooking.
        </p>
        <label className="flex flex-col text-sm text-gray-700">
          Invitados máximos
          <input
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-1 border rounded px-2 py-1"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
};

const HallDimensionsModal = ({
  open,
  hallSize,
  onSave,
  onClose,
}) => {
  const [width, setWidth] = useState(hallSize?.width || 1800);
  const [height, setHeight] = useState(hallSize?.height || 1200);
  const [aisle, setAisle] = useState(
    hallSize?.aisleMin !== undefined ? hallSize.aisleMin : 80
  );

  useEffect(() => {
    if (!open) return;
    setWidth(hallSize?.width || 1800);
    setHeight(hallSize?.height || 1200);
    setAisle(hallSize?.aisleMin !== undefined ? hallSize.aisleMin : 80);
  }, [open, hallSize?.width, hallSize?.height, hallSize?.aisleMin]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (typeof onSave === 'function') {
      const nextWidth = clampNumber(width, 1800, { min: 100 });
      const nextHeight = clampNumber(height, 1200, { min: 100 });
      const nextAisle = clampNumber(aisle, 80, { min: 0 });
      await onSave(nextWidth, nextHeight, nextAisle);
    }
    try { toast.success('Dimensiones guardadas'); } catch (_) {}
    onClose?.();
  };

  return (
    <Modal open={open} title="Configurar Espacio" onClose={onClose} size="sm">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <p className="text-sm text-gray-600">
          Introduce el tamaño real del salón en centímetros y el pasillo mínimo que quieres asegurar
          entre mesas.
        </p>
        <div className="space-y-3">
          <div className="flex flex-col text-sm text-gray-700">
            <label htmlFor="hall-width">Ancho (m)</label>
            <input
              id="hall-width"
              type="number"
              min={100}
              step={0.1}
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="mt-1 border rounded px-2 py-1"
            />
          </div>
          <div className="flex flex-col text-sm text-gray-700">
            <label htmlFor="hall-height">Largo (m)</label>
            <input
              id="hall-height"
              type="number"
              min={100}
              step={0.1}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="mt-1 border rounded px-2 py-1"
            />
          </div>
          <div className="flex flex-col text-sm text-gray-700">
            <label htmlFor="hall-aisle">Pasillo mínimo (cm)</label>
            <input
              id="hall-aisle"
              type="number"
              min={0}
              value={aisle}
              onChange={(e) => setAisle(e.target.value)}
              className="mt-1 border rounded px-2 py-1"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
};

const TemplateModal = ({
  open,
  onApplyTemplate,
  onClose,
  guests,
  tables,
  areas,
  hallSize,
}) => {
  const totalGuests = useMemo(() => {
    if (!Array.isArray(guests)) return 0;
    return guests.reduce(
      (sum, guest) => sum + 1 + (Number.parseInt(guest?.companion, 10) || 0),
      0
    );
  }, [guests]);

  const tableCount = Array.isArray(tables) ? tables.length : 0;
  const hasBoundary = useMemo(
    () =>
      Array.isArray(areas) &&
      areas.some(
        (area) =>
          !Array.isArray(area) &&
          area?.type === 'boundary' &&
          Array.isArray(area?.points) &&
          area.points.length >= 3
      ),
    [areas]
  );

  const hallMeters =
    hallSize && hallSize.width && hallSize.height
      ? `${(hallSize.width / 100).toFixed(1)} × ${(hallSize.height / 100).toFixed(1)} m`
      : '—';

  const handleApply = async (template) => {
    if (typeof onApplyTemplate === 'function') {
      await onApplyTemplate(template);
    }
    onClose?.();
  };

  // Constructores de mesas para plantillas E2E
  const buildCircularTables = () => {
    const w = hallSize?.width || 1800;
    const h = hallSize?.height || 1200;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.35;
    const n = 10;
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      out.push({
        tableType: 'round',
        x: Math.round(cx + r * Math.cos(a)),
        y: Math.round(cy + r * Math.sin(a)),
        seats: 8,
        name: `Mesa ${i + 1}`,
      });
    }
    return out;
  };

  const buildUEdgeTables = () => {
    const w = hallSize?.width || 1800;
    const h = hallSize?.height || 1200;
    const m = 140; // margen a bordes
    const gapX = 160;
    const gapY = 160;
    const out = [];
    // Fila inferior
    for (let x = m; x <= w - m; x += gapX) {
      out.push({ tableType: 'square', x, y: h - m, seats: 8 });
    }
    // Columna izquierda
    for (let y = m + gapY; y <= h - m - gapY; y += gapY) {
      out.push({ tableType: 'square', x: m, y, seats: 8 });
    }
    // Columna derecha
    for (let y = m + gapY; y <= h - m - gapY; y += gapY) {
      out.push({ tableType: 'square', x: w - m, y, seats: 8 });
    }
    return out;
  };

  const buildLEdgeTables = () => {
    const w = hallSize?.width || 1800;
    const h = hallSize?.height || 1200;
    const m = 140;
    const gapX = 160;
    const gapY = 160;
    const out = [];
    // Fila inferior
    for (let x = m; x <= w - m; x += gapX) {
      out.push({ tableType: 'square', x, y: h - m, seats: 8 });
    }
    // Columna izquierda
    for (let y = m + gapY; y <= h - m - gapY; y += gapY) {
      out.push({ tableType: 'square', x: m, y, seats: 8 });
    }
    return out;
  };

  const buildImperialSingle = () => {
    const w = hallSize?.width || 1800;
    const h = hallSize?.height || 1200;
    return [
      {
        tableType: 'imperial',
        x: Math.round(w / 2),
        y: Math.round(h / 2),
        width: 800,
        height: 120,
        seats: 16,
        name: 'Mesa Imperial',
      },
    ];
  };

  return (
    <Modal open={open} title="Plantillas" onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700">
          <div className="p-3 border rounded bg-gray-50">
            <p className="font-semibold">Hall configurado</p>
            <p>{hallMeters}</p>
          </div>
          <div className="p-3 border rounded bg-gray-50">
            <p className="font-semibold">Invitados totales</p>
            <p>{totalGuests}</p>
          </div>
          <div className="p-3 border rounded bg-gray-50">
            <p className="font-semibold">Mesas actuales</p>
            <p>{tableCount}</p>
          </div>
          <div className="p-3 border rounded bg-gray-50 md:col-span-3">
            <p className="font-semibold">Perímetro dibujado</p>
            <p>{hasBoundary ? 'Sí, se reutilizará si coincide con la plantilla.' : 'No se ha definido perímetro.'}</p>
          </div>
        </div>
        {/* Acciones rápidas esperadas por E2E */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50"
            onClick={() => handleApply({ banquet: { rows: 3, cols: 4, seats: 8 } })}
          >
            Sugerido por datos
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50"
            onClick={() => handleApply({ banquet: { rows: 4, cols: 5, seats: 8 } })}
          >
            Boda Mediana
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50"
            onClick={() => handleApply({ banquetTables: buildCircularTables() })}
          >
            Distribución circular
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50"
            onClick={() => handleApply({ banquetTables: buildUEdgeTables() })}
          >
            Forma U
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50"
            onClick={() => handleApply({ banquetTables: buildLEdgeTables() })}
          >
            Forma L
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50"
            onClick={() => handleApply({ banquetTables: buildImperialSingle() })}
          >
            Mesa Imperial única
          </button>
        </div>

        <VenueTemplateSelector onApply={handleApply} selectedTemplateId={null} />
        <div className="flex justify-end">
          <button
            type="button"
            className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};

const SeatingPlanModals = ({
  ceremonyConfigOpen,
  banquetConfigOpen,
  spaceConfigOpen,
  templateOpen,
  backgroundOpen,
  capacityOpen,
  onCloseCeremonyConfig,
  onCloseBanquetConfig,
  onCloseSpaceConfig,
  onCloseTemplate,
  onCloseBackground,
  onCloseCapacity,
  onGenerateSeatGrid,
  onGenerateBanquetLayout,
  onSaveHallDimensions,
  onApplyTemplate,
  onSaveCapacity,
  onSaveBackground,
  areas,
  hallSize,
  guests,
  tables,
  background,
  globalMaxSeats,
  ceremonySettings = {},
}) => {
  const handleCeremonyApply = useCallback(
    ({ rows, cols, gap, aisleAfter, vipRows, vipLabel, lockVipSeats, notes }) => {
      if (typeof onGenerateSeatGrid !== 'function') return;
      const safeRows = clampNumber(rows, 10, { min: 1 });
      const safeCols = clampNumber(cols, 12, { min: 1 });
      const safeGap = clampNumber(gap, 40, { min: 20 });
      const safeAisle = clampNumber(aisleAfter, 6, { min: 0 });
      const payload = {
        rows: safeRows,
        cols: safeCols,
        gap: safeGap,
        startX: 100,
        startY: 80,
        aisleAfter: safeAisle,
        vipRows: Array.isArray(vipRows) ? vipRows : [],
        vipLabel: typeof vipLabel === 'string' && vipLabel.trim() ? vipLabel.trim() : 'VIP',
        lockVipSeats,
        notes: typeof notes === 'string' ? notes.trim() : '',
      };
      onGenerateSeatGrid(payload);
    },
    [onGenerateSeatGrid]
  );

  const handleBanquetApply = useCallback(
    (config) => {
      if (typeof onGenerateBanquetLayout !== 'function') return;
      const payload = {
        rows: clampNumber(config.rows, 3, { min: 1 }),
        cols: clampNumber(config.cols, 4, { min: 1 }),
        seats: clampNumber(config.seats, 8, { min: 1 }),
        gapX: clampNumber(config.gapX, 140, { min: 60 }),
        gapY: clampNumber(config.gapY, 160, { min: 60 }),
      };
      onGenerateBanquetLayout(payload);
    },
    [onGenerateBanquetLayout]
  );

  return (
    <>
      <CeremonyConfigModal
        open={ceremonyConfigOpen}
        onApply={handleCeremonyApply}
        onClose={onCloseCeremonyConfig}
        initialConfig={ceremonySettings}
      />
      <BanquetConfigModal
        open={banquetConfigOpen}
        onApply={handleBanquetApply}
        onClose={onCloseBanquetConfig}
      />
      <HallDimensionsModal
        open={spaceConfigOpen}
        hallSize={hallSize}
        onSave={onSaveHallDimensions}
        onClose={onCloseSpaceConfig}
      />
      <TemplateModal
        open={templateOpen}
        onApplyTemplate={onApplyTemplate}
        onClose={onCloseTemplate}
        guests={guests}
        tables={tables}
        areas={areas}
        hallSize={hallSize}
      />
      <BackgroundModal
        open={backgroundOpen}
        background={background}
        hallSize={hallSize}
        onSave={onSaveBackground}
        onClose={onCloseBackground}
      />
      <CapacityModal
        open={capacityOpen}
        globalMaxSeats={globalMaxSeats}
        onSave={onSaveCapacity}
        onClose={onCloseCapacity}
      />
    </>
  );
};

export default SeatingPlanModals;
