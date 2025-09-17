/**
 * Componente Toolbar modernizado para el plan de asientos
 * Interfaz mejorada con iconos claros y mejor UX
 */

import React, { useEffect, useRef, useState } from 'react';
import useTranslations from '../../hooks/useTranslations';
import { 
  Undo2, 
  Redo2,
  Download,
  Grid,
  Maximize,
  Palette,
  Eye,
  EyeOff,
  Cloud,
  CloudOff,
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
  syncStatus,
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
  className = ""
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const handleToggleTables = () => {
    if (onToggleShowTables) onToggleShowTables();
    setShowTablesLocal(s => !s);
  };
  const exportRef = useRef(null);
  const alignRef = useRef(null);
  const snapsRef = useRef(null);
  const { t } = useTranslations();
  const [showTablesLocal, setShowTablesLocal] = useState(showTables);
  
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
        setShowSnaps(false);
      }
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  // Atajos de teclado: E (toggle), Escape (cerrar)
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      if (['input','textarea','select'].includes(tag)) return;
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
  const getSyncIcon = () => {
    switch (syncStatus?.status) {
      case 'syncing':
        return <Cloud className="h-4 w-4 animate-pulse text-blue-500" />;
      case 'synced':
        return <Cloud className="h-4 w-4 text-green-500" />;
      case 'error':
        return <CloudOff className="h-4 w-4 text-red-500" />;
      default:
        return <CloudOff className="h-4 w-4 text-gray-400" />;
    }
  };
  const [showSnaps, setShowSnaps] = useState(false);

  const getSyncText = () => {
    switch (syncStatus?.status) {
      case 'syncing':
        return 'Sincronizando...';
      case 'synced':
        return 'Sincronizado';
      case 'error':
        return 'Error de Sincronización';
      default:
        return 'Sin conexión';
    }
  };

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`} role="toolbar" aria-label="Seating toolbar">
      <div className="flex flex-wrap items-center gap-2 p-3">
        {/* Grupo: Historial */}
        <div className="flex items-center gap-1 border-r pr-3">
          <button type="button" data-testid="undo-btn"
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('seating.toolbar.undoTooltip', { defaultValue: 'Deshacer (Ctrl+Z)' })}
            aria-label={t('seating.toolbar.undoTooltip', { defaultValue: 'Deshacer (Ctrl+Z)' })}
          >
            <Undo2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('seating.toolbar.undo')}</span>
          </button>
          
          <button type="button" data-testid="redo-btn"
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
          <button type="button"
            onClick={handleToggleTables}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
            title={showTablesLocal ? t('seating.toolbar.hideTables',{defaultValue:'Ocultar mesas'}) : t('seating.toolbar.showTables',{defaultValue:'Mostrar mesas'})}
            aria-pressed={showTablesLocal}
            aria-label={showTablesLocal ? t('seating.toolbar.hideTables',{defaultValue:'Ocultar mesas'}) : t('seating.toolbar.showTables',{defaultValue:'Mostrar mesas'})}
          >
            {showTablesLocal ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
            <span className="hidden sm:inline">
              {showTablesLocal ? t('seating.toolbar.hideTables',{defaultValue:'Mesas'}) : t('seating.toolbar.showTables',{defaultValue:'Mesas'})}
            </span>
          </button>
          {/* Regla */}
          <button type="button"
            onClick={onToggleRulers}
            className={`flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100 ${showRulers ? 'text-blue-700' : ''}`}
            title={showRulers ? 'Ocultar reglas' : 'Mostrar reglas'}
            aria-pressed={showRulers}
            aria-label={showRulers ? 'Ocultar reglas' : 'Mostrar reglas'}
          >
            <Ruler className="h-4 w-4"/>
            <span className="hidden sm:inline">Reglas</span>
          </button>

          {/* Snap a cuadrícula */}
          <button type="button"
            onClick={onToggleSnap}
            className={`flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100 ${snapEnabled ? 'text-blue-700' : ''}`}
            title={snapEnabled ? `Snap: ${gridStep} cm` : 'Activar snap a cuadrícula'}
            aria-pressed={snapEnabled}
            aria-label={snapEnabled ? `Desactivar snap (${gridStep} cm)` : 'Activar snap a cuadrícula'}
          >
            <Magnet className="h-4 w-4"/>
            <span className="hidden sm:inline">Snap</span>
          </button>

          {/* Numeración */}
          <button type="button"
            onClick={onToggleSeatNumbers}
            className={`flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100 ${showSeatNumbers ? 'text-blue-700' : ''}`}
            title={showSeatNumbers ? 'Ocultar numeración' : 'Mostrar numeración'}
            aria-pressed={showSeatNumbers}
          >
            <Rows className="h-4 w-4" />
            <span className="hidden sm:inline">Números</span>
          </button>

          {/* Validaciones en vivo */}
          <button type="button"
            onClick={onToggleValidations}
            className={`flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100 ${validationsEnabled ? 'text-blue-700' : ''}`}
            title={validationsEnabled ? 'Desactivar validaciones' : 'Activar validaciones'}
            aria-pressed={validationsEnabled}
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Check</span>
          </button>
        </div>

        {/* Grupo: Configuración */}
        <div className="flex items-center gap-1 border-r pr-3">
          <button type="button" data-testid="space-config-btn"
            onClick={onOpenSpaceConfig}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
            title={t('seating.toolbar.spaceConfig',{defaultValue:'Configurar espacio'})}
            aria-label={t('seating.toolbar.spaceConfig',{defaultValue:'Configurar espacio'})}
          >
            <Maximize className="h-4 w-4" />
            <span className="hidden sm:inline">{t('seating.toolbar.space',{defaultValue:'Espacio'})}</span>
          </button>

          {tab === 'ceremony' && (
            <button type="button" data-testid="ceremony-config-btn"
              onClick={onOpenCeremonyConfig}
              className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
              title={t('seating.toolbar.ceremonyConfig', { defaultValue: 'Configurar ceremonia' })}
              aria-label={t('seating.toolbar.ceremonyConfig', { defaultValue: 'Configurar ceremonia' })}
            >
              <Grid className="h-4 w-4" />
              <span className="hidden sm:inline">{t('seating.toolbar.ceremony', { defaultValue: 'Ceremonia' })}</span>
            </button>
          )}

          {tab === 'banquet' && (
            <button type="button" data-testid="banquet-config-btn"
              onClick={onOpenBanquetConfig}
              className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
              title={t('seating.toolbar.banquetConfig', { defaultValue: 'Configurar banquete' })}
              aria-label={t('seating.toolbar.banquetConfig', { defaultValue: 'Configurar banquete' })}
            >
              <Grid className="h-4 w-4" />
              <span className="hidden sm:inline">{t('seating.toolbar.banquet', { defaultValue: 'Banquete' })}</span>
            </button>
          )}

          {tab === 'banquet' && (
            <button type="button"
              onClick={onOpenCapacity}
              className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
              title={`Capacidad global: ${globalMaxSeats || '—'}`}
              aria-label="Definir capacidad global"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Cap: {globalMaxSeats || '—'}</span>
            </button>
          )}

          {tab === 'banquet' && (
            <button type="button" data-testid="clear-banquet-btn"
              onClick={onClearBanquet}
              className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-red-50 text-red-600"
              title={t('seating.toolbar.clearBanquet', { defaultValue: 'Vaciar plano' })}
              aria-label={t('seating.toolbar.clearBanquet', { defaultValue: 'Vaciar plano' })}
            >
              <Trash className="h-4 w-4" />
              <span className="hidden sm:inline">{t('seating.toolbar.clear',{defaultValue:'Vaciar'})}</span>
            </button>
          )}

          {tab === 'banquet' && onAutoAssign && import.meta.env.VITE_ENABLE_AUTO_ASSIGN === 'true' && (
            <button type="button" data-testid="auto-assign-btn"
              onClick={onAutoAssign}
              className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
              title="Auto-asignar invitados"
              aria-label="Auto-asignar invitados"
            >
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Auto-asignar</span>
            </button>
          )}

          
          <button type="button" data-testid="templates-btn"
            onClick={onOpenTemplates}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
            title={t('seating.toolbar.templates', { defaultValue: 'Plantillas' })}
            aria-label={t('seating.toolbar.templates')}
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">{t('seating.toolbar.templates', { defaultValue: 'Plantillas' })}</span>
          </button>

          {/* Fondo */}
          <button type="button"
            onClick={onOpenBackground}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
            title="Configurar fondo"
            aria-label="Configurar fondo"
          >
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Fondo</span>
          </button>

          {/* Rotación rápida */}
          {tab === 'banquet' && (
            <>
              <button type="button" onClick={onRotateLeft} className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100" title="Rotar -5°"><RotateCcw className="h-4 w-4" /><span className="hidden sm:inline">-5°</span></button>
              <button type="button" onClick={onRotateRight} className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100" title="Rotar +5°"><RotateCw className="h-4 w-4" /><span className="hidden sm:inline">+5°</span></button>
            </>
          )}

          {/* Alinear / Distribuir */}
          {tab === 'banquet' && (
            <div ref={alignRef} className="relative">
              <button type="button" onClick={()=>setShowAlignMenu(s=>!s)} className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100" title="Alinear/Distribuir">
                <Columns className="h-4 w-4" />
                <span className="hidden sm:inline">Alinear</span>
              </button>
              {showAlignMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white border rounded shadow z-10 text-sm">
                  <div className="px-3 py-1 font-medium text-gray-600">Alinear</div>
                  <button className="block w-full text-left px-3 py-1 hover:bg-gray-50" onClick={()=>{onAlign?.('x','start'); setShowAlignMenu(false);}}>Izquierda</button>
                  <button className="block w-full text-left px-3 py-1 hover:bg-gray-50" onClick={()=>{onAlign?.('x','center'); setShowAlignMenu(false);}}>Centro X</button>
                  <button className="block w-full text-left px-3 py-1 hover:bg-gray-50" onClick={()=>{onAlign?.('x','end'); setShowAlignMenu(false);}}>Derecha</button>
                  <button className="block w-full text-left px-3 py-1 hover:bg-gray-50" onClick={()=>{onAlign?.('y','start'); setShowAlignMenu(false);}}>Arriba</button>
                  <button className="block w-full text-left px-3 py-1 hover:bg-gray-50" onClick={()=>{onAlign?.('y','center'); setShowAlignMenu(false);}}>Centro Y</button>
                  <button className="block w-full text-left px-3 py-1 hover:bg-gray-50" onClick={()=>{onAlign?.('y','end'); setShowAlignMenu(false);}}>Abajo</button>
                  <div className="px-3 py-1 font-medium text-gray-600 border-t">Distribuir</div>
                  <button className="block w-full text-left px-3 py-1 hover:bg-gray-50" onClick={()=>{onDistribute?.('x'); setShowAlignMenu(false);}}>Horizontal</button>
                  <button className="block w-full text-left px-3 py-1 hover:bg-gray-50" onClick={()=>{onDistribute?.('y'); setShowAlignMenu(false);}}>Vertical</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Grupo: Exportación (menú) */}
        <div ref={exportRef} className="flex items-center gap-1 border-r pr-3 relative">
          <button type="button" data-testid="export-menu-btn"
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
            <div role="menu" className="absolute top-full right-0 mt-1 w-36 bg-white border rounded shadow z-10">
              <button type="button" data-testid="export-pdf"
                onClick={() => { onExportPDF?.(); setShowExportMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
              >
                {t('seating.export.pdf', { defaultValue: 'PDF' })}
              </button>
              <button type="button" data-testid="export-png"
                onClick={() => { onExportPNG?.(); setShowExportMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
              >
                {t('seating.export.png', { defaultValue: 'PNG' })}
              </button>
              <button type="button" data-testid="export-csv"
                onClick={() => { onExportCSV?.(); setShowExportMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
              >
                {t('seating.export.csv', { defaultValue: 'CSV' })}
              </button>
              <button type="button" data-testid="export-svg"
                onClick={() => { onExportSVG?.(); setShowExportMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
              >
                SVG
              </button>
              {tab === 'banquet' && (
                <button type="button" data-testid="export-poster"
                  onClick={() => { onExportPoster?.(); setShowExportMenu(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                >
                  Póster A2
                </button>
              )}
              {tab === 'banquet' && (
                <button type="button" data-testid="export-placecards"
                  onClick={() => { onExportPlaceCards?.(); setShowExportMenu(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                >
                  Tarjetas
                </button>
              )}
            </div>
          )}
        </div>

        {/* Estado de Sincronización */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            {getSyncIcon()}
            <span className="hidden md:inline">{getSyncText()}</span>
          </div>
        </div>
      </div>

      {/* Barra de progreso de Sincronización */}
      {syncStatus?.status === 'syncing' && (
        <div className="h-1 bg-gray-200">
          <div className="h-full bg-blue-500 animate-pulse" style={{ width: '60%' }} />
        </div>
      )}

      {/* Snapshots menu */}
      <div className="px-3 pb-3">
        <div ref={snapsRef} className="relative inline-block">
          <button
            type="button"
            onClick={() => setShowSnaps(s => !s)}
            className="px-2 py-1 text-sm rounded border hover:bg-gray-50"
            title="Snapshots"
          >
            Snapshots
          </button>
          {showSnaps && (
            <div className="absolute z-10 mt-1 bg-white border rounded shadow w-56">
              <div className="px-3 py-2 border-b text-sm font-medium">Gestionar Snapshots</div>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onClick={() => {
                const name = window.prompt('Nombre del snapshot:');
                if (!name) return;
                onSaveSnapshot?.(name);
                setShowSnaps(false);
              }}>Guardar actual…</button>
              <div className="max-h-48 overflow-auto">
                {(snapshots||[]).length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-500">Sin snapshots</div>
                ) : (
                  snapshots.map(n => (
                    <div key={n} className="flex items-center justify-between px-3 py-1 text-sm hover:bg-gray-50">
                      <button className="text-blue-600 hover:underline" onClick={() => { onLoadSnapshot?.(n); setShowSnaps(false); }}>Cargar: {n}</button>
                      <button className="text-red-600 hover:underline" onClick={() => onDeleteSnapshot?.(n)}>Borrar</button>
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


