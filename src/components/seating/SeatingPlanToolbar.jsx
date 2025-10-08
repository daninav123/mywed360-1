/**
 * Componente Toolbar modernizado para el plan de asientos
 * Interfaz mejorada con iconos claros y mejor UX
 */

import {
  Undo2,
  Redo2,
  Download,
  Grid,
  Maximize,
  Palette,
  Eye,
  EyeOff,
  Trash,
  Ruler,
  Magnet,
  RotateCcw,
  RotateCw,
  Image as ImageIcon,
  Columns,
  Rows,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { Keyboard } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import useTranslations from '../../hooks/useTranslations';

const SeatingPlanToolbar = ({
  tab,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExportPDF,
  onExportPNG,
  onExportCSV,
  onExportPlaceCards,
  onOpenCeremonyConfig,
  onOpenBanquetConfig,
  onOpenSpaceConfig,
  onOpenTemplates,
  onOpenBackground,
  onAutoAssign,
  onClearBanquet,
  showTables = true,
  onToggleShowTables,
  // Vista avanzada
  showRulers = false,
  onToggleRulers,
  snapEnabled = false,
  onToggleSnap,
  gridStep = 20,
  onExportSVG,
  onExportPoster,
  showSeatNumbers = false,
  onToggleSeatNumbers,
  onRotateLeft,
  onRotateRight,
  onAlign,
  onDistribute,
  validationsEnabled = true,
  onToggleValidations,
  globalMaxSeats = 0,
  onOpenCapacity,
  // Snapshots
  snapshots = [],
  onSaveSnapshot,
  onLoadSnapshot,
  onDeleteSnapshot,
  className = '',
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const [showSnaps, setShowSnaps] = useState(false);
  const [showHotkeys, setShowHotkeys] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotError, setSnapshotError] = useState('');
  const exportRef = useRef(null);
  const alignRef = useRef(null);
  const snapsRef = useRef(null);
  const { t } = useTranslations();
  const [showTablesLocal, setShowTablesLocal] = useState(showTables);

  const handleToggleTables = () => {
    if (onToggleShowTables) onToggleShowTables();
    setShowTablesLocal((s) => !s);
  };

  const handleCloseSnaps = useCallback(() => {
    setShowSnaps(false);
    setSnapshotName('');
    setSnapshotError('');
  }, []);

  const handleToggleSnapshots = useCallback(() => {
    if (showSnaps) {
      handleCloseSnaps();
    } else {
      setShowSnaps(true);
      setSnapshotName('');
      setSnapshotError('');
    }
  }, [showSnaps, handleCloseSnaps]);

  const handleSnapshotNameChange = useCallback(
    (event) => {
      setSnapshotName(event.target.value);
      if (snapshotError) {
        setSnapshotError('');
      }
    },
    [snapshotError]
  );

  const handleSnapshotSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const trimmed = snapshotName.trim();
      if (!trimmed) {
        setSnapshotError(
          t('seating.snapshots.nameRequired', { defaultValue: 'Ingresa un nombre' })
        );
        return;
      }
      onSaveSnapshot?.(trimmed);
      handleCloseSnaps();
    },
    [snapshotName, onSaveSnapshot, handleCloseSnaps, t]
  );

  useEffect(() => {
    setShowTablesLocal(showTables);
  }, [showTables]);

  // Cierre por click-away
  useEffect(() => {
    const onClickAway = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
      if (alignRef.current && !alignRef.current.contains(e.target)) {
        setShowAlignMenu(false);
      }
      if (snapsRef.current && !snapsRef.current.contains(e.target)) {
        handleCloseSnaps();
      }
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, [handleCloseSnaps]);

  // Atajos de teclado: E (toggle), Escape (cerrar)
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
      if (['input', 'textarea', 'select'].includes(tag)) return;
      const k = String(e.key || '').toLowerCase();
      if (k === 'e') {
        setShowExportMenu((s) => !s);
      } else if (k === 'escape') {
        setShowExportMenu(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div
      className={`bg-white border rounded-lg shadow-sm ${className}`}
      role="toolbar"
      aria-label="Seating toolbar"
    >
      <div className="flex flex-wrap items-center gap-2 p-3">
        {/* Grupo: Historial */}
        <div className="flex items-center gap-1 border-r pr-3">
          <button
            type="button"
            data-testid="undo-btn"
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('seating.toolbar.undoTooltip', { defaultValue: 'Deshacer (Ctrl+Z)' })}
            aria-label={t('seating.toolbar.undoTooltip', { defaultValue: 'Deshacer (Ctrl+Z)' })}
          >
            <Undo2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('seating.toolbar.undo')}</span>
          </button>

          <button
            type="button"
            data-testid="redo-btn"
            onClick={onRedo}
            disabled={!canRedo}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('seating.toolbar.redoTooltip', { defaultValue: 'Rehacer (Ctrl+Y)' })}
            aria-label={t('seating.toolbar.redoTooltip', { defaultValue: 'Rehacer (Ctrl+Y)' })}
          >
            <Redo2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('seating.toolbar.redo')}</span>
          </button>
        </div>

        {/* Grupo: Visibilidad */}
        <div className="flex items-center gap-1 border-r pr-3">
          <button
            type="button"
            onClick={handleToggleTables}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
            title={
              showTablesLocal
                ? t('seating.toolbar.hideTables', { defaultValue: 'Ocultar mesas' })
                : t('seating.toolbar.showTables', { defaultValue: 'Mostrar mesas' })
            }
            aria-pressed={showTablesLocal}
            aria-label={
              showTablesLocal
                ? t('seating.toolbar.hideTables', { defaultValue: 'Ocultar mesas' })
                : t('seating.toolbar.showTables', { defaultValue: 'Mostrar mesas' })
            }
          >
            {showTablesLocal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="hidden sm:inline">
              {showTablesLocal
                ? t('seating.toolbar.hideTables', { defaultValue: 'Mesas' })
                : t('seating.toolbar.showTables', { defaultValue: 'Mesas' })}
            </span>
          </button>
          {/* Regla */}
          <button
            type="button"
            onClick={onToggleRulers}
            className={`flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100 ${showRulers ? 'text-blue-700' : ''}`}
            title={
              showRulers
                ? t('seating.toolbar.hideRulers', { defaultValue: 'Ocultar reglas' })
                : t('seating.toolbar.showRulers', { defaultValue: 'Mostrar reglas' })
            }
            aria-pressed={showRulers}
            aria-label={
              showRulers
                ? t('seating.toolbar.hideRulers', { defaultValue: 'Ocultar reglas' })
                : t('seating.toolbar.showRulers', { defaultValue: 'Mostrar reglas' })
            }
          >
            <Ruler className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t('seating.toolbar.rulers', { defaultValue: 'Reglas' })}
            </span>
          </button>

          {/* Snap a cuadricula */}
          <button
            type="button"
            onClick={onToggleSnap}
            className={`flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100 ${snapEnabled ? 'text-blue-700' : ''}`}
            title={
              snapEnabled
                ? `${t('seating.toolbar.snapEnabled', { defaultValue: 'Snap activado' })} (${gridStep} cm)`
                : t('seating.toolbar.enableSnap', { defaultValue: 'Activar snap a cuadricula' })
            }
            aria-pressed={snapEnabled}
            aria-label={
              snapEnabled
                ? `${t('seating.toolbar.disableSnap', { defaultValue: 'Desactivar snap' })} (${gridStep} cm)`
                : t('seating.toolbar.enableSnap', { defaultValue: 'Activar snap a cuadricula' })
            }
          >
            <Magnet className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t('seating.toolbar.snap', { defaultValue: 'Snap' })}
            </span>
          </button>

          {/* Numeracion */}
          <button
            type="button"
            onClick={onToggleSeatNumbers}
            className={`flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100 ${showSeatNumbers ? 'text-blue-700' : ''}`}
            title={
              showSeatNumbers
                ? t('seating.toolbar.hideSeatNumbers', { defaultValue: 'Ocultar numeracion' })
                : t('seating.toolbar.showSeatNumbers', { defaultValue: 'Mostrar numeracion' })
            }
            aria-pressed={showSeatNumbers}
            aria-label={
              showSeatNumbers
                ? t('seating.toolbar.hideSeatNumbers', { defaultValue: 'Ocultar numeracion' })
                : t('seating.toolbar.showSeatNumbers', { defaultValue: 'Mostrar numeracion' })
            }
          >
            <Rows className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t('seating.toolbar.seatNumbers', { defaultValue: 'Numeros' })}
            </span>
          </button>

          {/* Validaciones en vivo */}
          <button
            type="button"
            onClick={onToggleValidations}
            className={`flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100 ${validationsEnabled ? 'text-blue-700' : ''}`}
            title={
              validationsEnabled
                ? t('seating.toolbar.disableValidations', {
                    defaultValue: 'Desactivar validaciones',
                  })
                : t('seating.toolbar.enableValidations', { defaultValue: 'Activar validaciones' })
            }
            aria-pressed={validationsEnabled}
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t('seating.toolbar.validations', { defaultValue: 'Checks' })}
            </span>
          </button>
        </div>

        {/* Grupo: Configuración */}
        <div className="flex items-center gap-1 border-r pr-3">
          <button
            type="button"
            data-testid="space-config-btn"
            onClick={onOpenSpaceConfig}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
            title={t('seating.toolbar.spaceConfig', { defaultValue: 'Configurar espacio' })}
            aria-label={t('seating.toolbar.spaceConfig', { defaultValue: 'Configurar espacio' })}
          >
            <Maximize className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t('seating.toolbar.space', { defaultValue: 'Espacio' })}
            </span>
          </button>

          {tab === 'ceremony' && (
            <button
              type="button"
              data-testid="ceremony-config-btn"
              onClick={onOpenCeremonyConfig}
              className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
              title={t('seating.toolbar.ceremonyConfig', { defaultValue: 'Configurar ceremonia' })}
              aria-label={t('seating.toolbar.ceremonyConfig', {
                defaultValue: 'Configurar ceremonia',
              })}
            >
              <Grid className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t('seating.toolbar.ceremony', { defaultValue: 'Ceremonia' })}
              </span>
            </button>
          )}

          {tab === 'banquet' && (
            <button
              type="button"
              data-testid="banquet-config-btn"
              onClick={onOpenBanquetConfig}
              className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
              title={t('seating.toolbar.banquetConfig', { defaultValue: 'Configurar banquete' })}
              aria-label={t('seating.toolbar.banquetConfig', {
                defaultValue: 'Configurar banquete',
              })}
            >
              <Grid className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t('seating.toolbar.banquet', { defaultValue: 'Banquete' })}
              </span>
            </button>
          )}

          {tab === 'banquet' && (
            <button
              type="button"
              onClick={onOpenCapacity}
              className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
              title={`${t('seating.toolbar.capacityTooltip', { defaultValue: 'Capacidad global' })}: ${globalMaxSeats || '--'}`}
              aria-label={t('seating.toolbar.capacityTooltip', {
                defaultValue: 'Capacidad global',
              })}
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t('seating.toolbar.capacityShort', { defaultValue: 'Cap' })}:{' '}
                {globalMaxSeats || '--'}
              </span>
            </button>
          )}

          {tab === 'banquet' && (
            <button
              type="button"
              data-testid="clear-banquet-btn"
              onClick={onClearBanquet}
              className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-red-50 text-red-600"
              title={t('seating.toolbar.clearBanquet', { defaultValue: 'Vaciar plano' })}
              aria-label={t('seating.toolbar.clearBanquet', { defaultValue: 'Vaciar plano' })}
            >
              <Trash className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t('seating.toolbar.clear', { defaultValue: 'Vaciar' })}
              </span>
            </button>
          )}

          {tab === 'banquet' &&
            onAutoAssign &&
            import.meta.env.VITE_ENABLE_AUTO_ASSIGN === 'true' && (
              <button
                type="button"
                data-testid="auto-assign-btn"
                onClick={onAutoAssign}
                className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
                title={t('seating.toolbar.autoAssign', { defaultValue: 'Auto-asignar invitados' })}
                aria-label={t('seating.toolbar.autoAssign', {
                  defaultValue: 'Auto-asignar invitados',
                })}
              >
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {t('seating.toolbar.autoAssignShort', { defaultValue: 'Auto-asignar' })}
                </span>
              </button>
            )}

          <button
            type="button"
            data-testid="templates-btn"
            onClick={onOpenTemplates}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
            title={t('seating.toolbar.templates', { defaultValue: 'Plantillas' })}
            aria-label={t('seating.toolbar.templates')}
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t('seating.toolbar.templates', { defaultValue: 'Plantillas' })}
            </span>
          </button>

          {/* Fondo */}
          <button
            type="button"
            onClick={onOpenBackground}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
            title={t('seating.toolbar.backgroundConfig', { defaultValue: 'Configurar fondo' })}
            aria-label={t('seating.toolbar.backgroundConfig', { defaultValue: 'Configurar fondo' })}
          >
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t('seating.toolbar.background', { defaultValue: 'Fondo' })}
            </span>
          </button>

          {/* Rotación rápida */}
          {tab === 'banquet' && (
            <>
              <button
                type="button"
                onClick={onRotateLeft}
                className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
                title="Rotar -5Â°"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">-5Â°</span>
              </button>
              <button
                type="button"
                onClick={onRotateRight}
                className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
                title="Rotar +5Â°"
              >
                <RotateCw className="h-4 w-4" />
                <span className="hidden sm:inline">+5Â°</span>
              </button>
            </>
          )}

          {/* Alinear / Distribuir */}
          {tab === 'banquet' && (
            <div ref={alignRef} className="relative">
              <button
                type="button"
                onClick={() => setShowAlignMenu((s) => !s)}
                className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
                title={t('seating.toolbar.alignMenu', { defaultValue: 'Alinear/Distribuir' })}
              >
                <Columns className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {t('seating.toolbar.align', { defaultValue: 'Alinear' })}
                </span>
              </button>
              {showAlignMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white border rounded shadow z-10 text-sm">
                  <div className="px-3 py-1 font-medium text-gray-600">
                    {t('seating.toolbar.align', { defaultValue: 'Alinear' })}
                  </div>
                  <button
                    className="block w-full text-left px-3 py-1 hover:bg-gray-50"
                    onClick={() => {
                      onAlign?.('x', 'start');
                      setShowAlignMenu(false);
                    }}
                  >
                    {t('seating.toolbar.alignLeft', { defaultValue: 'Izquierda' })}
                  </button>
                  <button
                    className="block w-full text-left px-3 py-1 hover:bg-gray-50"
                    onClick={() => {
                      onAlign?.('x', 'center');
                      setShowAlignMenu(false);
                    }}
                  >
                    {t('seating.toolbar.alignCenterX', { defaultValue: 'Centro X' })}
                  </button>
                  <button
                    className="block w-full text-left px-3 py-1 hover:bg-gray-50"
                    onClick={() => {
                      onAlign?.('x', 'end');
                      setShowAlignMenu(false);
                    }}
                  >
                    {t('seating.toolbar.alignRight', { defaultValue: 'Derecha' })}
                  </button>
                  <button
                    className="block w-full text-left px-3 py-1 hover:bg-gray-50"
                    onClick={() => {
                      onAlign?.('y', 'start');
                      setShowAlignMenu(false);
                    }}
                  >
                    {t('seating.toolbar.alignTop', { defaultValue: 'Arriba' })}
                  </button>
                  <button
                    className="block w-full text-left px-3 py-1 hover:bg-gray-50"
                    onClick={() => {
                      onAlign?.('y', 'center');
                      setShowAlignMenu(false);
                    }}
                  >
                    {t('seating.toolbar.alignCenterY', { defaultValue: 'Centro Y' })}
                  </button>
                  <button
                    className="block w-full text-left px-3 py-1 hover:bg-gray-50"
                    onClick={() => {
                      onAlign?.('y', 'end');
                      setShowAlignMenu(false);
                    }}
                  >
                    {t('seating.toolbar.alignBottom', { defaultValue: 'Abajo' })}
                  </button>
                  <div className="px-3 py-1 font-medium text-gray-600 border-t">
                    {t('seating.toolbar.distribute', { defaultValue: 'Distribuir' })}
                  </div>
                  <button
                    className="block w-full text-left px-3 py-1 hover:bg-gray-50"
                    onClick={() => {
                      onDistribute?.('x');
                      setShowAlignMenu(false);
                    }}
                  >
                    {t('seating.toolbar.distributeHorizontal', { defaultValue: 'Horizontal' })}
                  </button>
                  <button
                    className="block w-full text-left px-3 py-1 hover:bg-gray-50"
                    onClick={() => {
                      onDistribute?.('y');
                      setShowAlignMenu(false);
                    }}
                  >
                    {t('seating.toolbar.distributeVertical', { defaultValue: 'Vertical' })}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Grupo: Exportación (menú) */}
        <div ref={exportRef} className="flex items-center gap-1 border-r pr-3 relative">
          <button
            type="button"
            data-testid="export-menu-btn"
            onClick={() => setShowExportMenu((s) => !s)}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
            title={t('seating.toolbar.export')}
            aria-haspopup="menu"
            aria-expanded={showExportMenu}
            aria-label={t('seating.toolbar.export')}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{t('seating.toolbar.export')}</span>
          </button>
          {showExportMenu && (
            <div
              role="menu"
              className="absolute top-full right-0 mt-1 w-36 bg-white border rounded shadow z-10"
            >
              <button
                type="button"
                data-testid="export-pdf"
                onClick={() => {
                  onExportPDF?.();
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
              >
                {t('seating.export.pdf', { defaultValue: 'PDF' })}
              </button>
              <button
                type="button"
                data-testid="export-png"
                onClick={() => {
                  onExportPNG?.();
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
              >
                {t('seating.export.png', { defaultValue: 'PNG' })}
              </button>
              <button
                type="button"
                data-testid="export-csv"
                onClick={() => {
                  onExportCSV?.();
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
              >
                {t('seating.export.csv', { defaultValue: 'CSV' })}
              </button>
              <button
                type="button"
                data-testid="export-svg"
                onClick={() => {
                  onExportSVG?.();
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
              >
                SVG
              </button>
              {tab === 'banquet' && (
                <button
                  type="button"
                  data-testid="export-poster"
                  onClick={() => {
                    onExportPoster?.();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                >
                  Póster A2
                </button>
              )}
              {tab === 'banquet' && (
                <button
                  type="button"
                  data-testid="export-placecards"
                  onClick={() => {
                    onExportPlaceCards?.();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                >
                  Tarjetas
                </button>
              )}
            </div>
          )}
        </div>

      </div>


      {showHotkeys && (
        <div className="px-3 pb-3">
          <div className="bg-white border rounded shadow w-[22rem] max-w-[92vw] p-3 text-xs leading-5">
            <div className="font-semibold text-gray-800 mb-1">{t('seating.hotkeys.title', { defaultValue: 'Atajos de teclado' })}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="text-gray-600">Ctrl/Cmd + Z / Y</div><div>{t('seating.hotkeys.items.undoRedo', { defaultValue: 'Deshacer / Rehacer' })}</div>
              <div className="text-gray-600">1..6</div><div>{t('seating.hotkeys.items.tools', { defaultValue: 'Herramientas (Pan, Mover, Perímetro, Puertas, Obstáculos, Pasillos)' })}</div>
              <div className="text-gray-600">Ctrl/Cmd + + / - / 0</div><div>{t('seating.hotkeys.items.zoomFit', { defaultValue: 'Zoom in / out / Ajustar' })}</div>
              <div className="text-gray-600">Ctrl/Cmd + A</div><div>{t('seating.hotkeys.items.selectAll', { defaultValue: 'Seleccionar todo' })}</div>
              <div className="text-gray-600">Esc</div><div>{t('seating.hotkeys.items.escape', { defaultValue: 'Limpiar selección / cerrar menús' })}</div>
              <div className="text-gray-600">Q / E</div><div>{t('seating.hotkeys.items.rotate', { defaultValue: 'Rotar -5° / +5° (Shift: ±15°)' })}</div>
              <div className="text-gray-600">Alt + ←/→/↑/↓</div><div>{t('seating.hotkeys.items.align', { defaultValue: 'Alinear (inicio/fin)' })}</div>
              <div className="text-gray-600">Shift + Alt + ←/→/↑/↓</div><div>{t('seating.hotkeys.items.distribute', { defaultValue: 'Distribuir (X/Y)' })}</div>
              <div className="text-gray-600">Ctrl/Cmd + ←/→</div><div>{t('seating.hotkeys.items.tabs', { defaultValue: 'Cambiar pestaña (Ceremonia/Banquete)' })}</div>
              <div className="text-gray-600">R / N / V</div><div>{t('seating.hotkeys.items.toggles', { defaultValue: 'Reglas / Números / Validaciones' })}</div>
              <div className="text-gray-600">P / S</div><div>{t('seating.hotkeys.items.panels', { defaultValue: 'Plantillas / Configurar espacio' })}</div>
              <div className="text-gray-600">Enter / Esc</div><div>{t('seating.hotkeys.items.drawFinalizeCancel', { defaultValue: 'Finalizar / Cancelar dibujo' })}</div>
              <div className="text-gray-600">Backspace/Delete</div><div>{t('seating.hotkeys.items.backspaceDelete', { defaultValue: 'Deshacer punto / Eliminar mesa' })}</div>
              <div className="text-gray-600">Tab (perímetro)</div><div>{t('seating.hotkeys.items.tabExactLength', { defaultValue: 'Longitud exacta del segmento' })}</div>
            </div>
          </div>
        </div>
      )}
      {/* Snapshots menu */}
      <div className="px-3 pb-3">
        <div ref={snapsRef} className="relative inline-block">
          <button
            type="button"
            onClick={handleToggleSnapshots}
            className="px-2 py-1 text-sm rounded border hover:bg-gray-50"
            title={t('seating.snapshots.title', { defaultValue: 'Snapshots' })}
            aria-expanded={showSnaps}
            aria-controls="seating-snapshots-menu"
          >
            {t('seating.snapshots.button', { defaultValue: 'Snapshots' })}
          </button>
          {showSnaps && (
            <div
              id="seating-snapshots-menu"
              className="absolute z-10 mt-1 bg-white border rounded shadow w-64"
            >
              <div className="px-3 py-2 border-b text-sm font-medium">
                {t('seating.snapshots.manage', { defaultValue: 'Gestionar snapshots' })}
              </div>
              <form onSubmit={handleSnapshotSubmit} className="px-3 py-2 space-y-2">
                <div>
                  <label
                    htmlFor="snapshot-name"
                    className="block text-xs font-medium text-gray-600"
                  >
                    {t('seating.snapshots.nameLabel', { defaultValue: 'Nombre' })}
                  </label>
                  <input
                    id="snapshot-name"
                    type="text"
                    value={snapshotName}
                    onChange={handleSnapshotNameChange}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder={t('seating.snapshots.namePlaceholder', {
                      defaultValue: 'Ej: Plano base',
                    })}
                  />
                </div>
                {snapshotError && <p className="text-xs text-red-600">{snapshotError}</p>}
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {t('seating.snapshots.saveCurrent', { defaultValue: 'Guardar actual' })}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseSnaps}
                    className="px-2 py-1 text-sm rounded border hover:bg-gray-50"
                  >
                    {t('common.cancel', { defaultValue: 'Cancelar' })}
                  </button>
                </div>
              </form>
              <div className="max-h-48 overflow-auto">
                {(snapshots || []).length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-500">
                    {t('seating.snapshots.empty', { defaultValue: 'Sin snapshots' })}
                  </div>
                ) : (
                  snapshots.map((name) => (
                    <div
                      key={name}
                      className="flex items-center justify-between px-3 py-1 text-sm hover:bg-gray-50"
                    >
                      <button
                        type="button"
                        className="text-blue-600 hover:underline"
                        onClick={() => {
                          onLoadSnapshot?.(name);
                          handleCloseSnaps();
                        }}
                      >
                        {t('seating.snapshots.load', { defaultValue: 'Cargar' })}: {name}
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() => onDeleteSnapshot?.(name)}
                      >
                        {t('seating.snapshots.delete', { defaultValue: 'Borrar' })}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(SeatingPlanToolbar);


