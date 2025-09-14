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
  onOpenCeremonyConfig,
  onOpenBanquetConfig,
  onOpenSpaceConfig,
  onOpenTemplates,
  onAutoAssign,
  onClearBanquet,
  syncStatus,
  showTables = true,
  onToggleShowTables,
  className = ""
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const handleToggleTables = () => {
    if (onToggleShowTables) onToggleShowTables();
    setShowTablesLocal(s => !s);
  };
  const exportRef = useRef(null);
  const { t } = useTranslations();
  const [showTablesLocal, setShowTablesLocal] = useState(showTables);

  // Cierre por click-away
  useEffect(() => {
    const onClickAway = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportMenu(false);
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

  const getSyncText = () => {
    switch (syncStatus?.status) {
      case 'syncing':
        return 'Sincronizando...';
      case 'synced':
        return 'Sincronizado';
      case 'error':
        return 'Error de Sincronización';
      default:
        return 'Sin conexiÃ³n';
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
              title={t('seating.toolbar.ceremonyConfig')}
              aria-label={t('seating.toolbar.ceremonyConfig')}
            >
              <Grid className="h-4 w-4" />
              <span className="hidden sm:inline">{t('seating.toolbar.ceremony')}</span>
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
            title={t('seating.toolbar.templates')}
            aria-label={t('seating.toolbar.templates')}
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">{t('seating.toolbar.templates')}</span>
          </button>
        </div>

        {/* Grupo: Exportación (menÃº) */}
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
    </div>
  );
};

export default React.memo(SeatingPlanToolbar);

