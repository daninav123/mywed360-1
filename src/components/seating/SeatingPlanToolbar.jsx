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
        return 'Error de sincronización';
      default:
        return 'Sin conexión';
    }
  };

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center gap-2 p-3">
        {/* Grupo: Historial */}
        <div className="flex items-center gap-1 border-r pr-3">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('seating.toolbar.undoTooltip', { defaultValue: 'Deshacer (Ctrl+Z)' })}
          >
            <Undo2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('seating.toolbar.undo')}</span>
          </button>
          
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('seating.toolbar.redoTooltip', { defaultValue: 'Rehacer (Ctrl+Y)' })}
          >
            <Redo2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('seating.toolbar.redo')}</span>
          </button>
        </div>

        {/* Grupo: Visibilidad */}
        <div className="flex items-center gap-1 border-r pr-3">
          <button
            onClick={handleToggleTables}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
            title={showTablesLocal ? t('seating.toolbar.hideTables',{defaultValue:'Ocultar mesas'}) : t('seating.toolbar.showTables',{defaultValue:'Mostrar mesas'})}
          >
            {showTablesLocal ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
            <span className="hidden sm:inline">
              {showTablesLocal ? t('seating.toolbar.hideTables',{defaultValue:'Mesas'}) : t('seating.toolbar.showTables',{defaultValue:'Mesas'})}
            </span>
          </button>
        </div>

        {/* Grupo: Configuración */}
        <div className="flex items-center gap-1 border-r pr-3">
          <button
            onClick={onOpenSpaceConfig}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
            title={t('seating.toolbar.spaceConfig',{defaultValue:'Configurar espacio'})}
          >
            <Maximize className="h-4 w-4" />
            <span className="hidden sm:inline">{t('seating.toolbar.space',{defaultValue:'Espacio'})}</span>
          </button>

          {tab === 'ceremony' && (
            <button
              onClick={onOpenCeremonyConfig}
              className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
              title={t('seating.toolbar.ceremonyConfig')}
            >
              <Grid className="h-4 w-4" />
              <span className="hidden sm:inline">{t('seating.toolbar.ceremony')}</span>
            </button>
          )}

          {tab === 'banquet' && (
            <button
              onClick={onOpenBanquetConfig}
              className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
              title={t('seating.toolbar.banquetConfig')}
            >
              <Grid className="h-4 w-4" />
              <span className="hidden sm:inline">{t('seating.toolbar.banquet')}</span>
            </button>
          )}

          <button
            onClick={onOpenTemplates}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
            title={t('seating.toolbar.templates')}
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">{t('seating.toolbar.templates')}</span>
          </button>
        </div>

        {/* Grupo: Exportación (menú) */}
        <div ref={exportRef} className="flex items-center gap-1 border-r pr-3 relative">
          <button
            onClick={() => setShowExportMenu((s) => !s)}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100"
            title={t('seating.toolbar.export')}
            aria-haspopup="menu"
            aria-expanded={showExportMenu}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{t('seating.toolbar.export')}</span>
          </button>
          {showExportMenu && (
            <div role="menu" className="absolute top-full right-0 mt-1 w-36 bg-white border rounded shadow z-10">
              <button
                onClick={() => { onExportPDF?.(); setShowExportMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
              >
                {t('seating.export.pdf', { defaultValue: 'PDF' })}
              </button>
              <button
                onClick={() => { onExportPNG?.(); setShowExportMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
              >
                {t('seating.export.png', { defaultValue: 'PNG' })}
              </button>
              <button
                onClick={() => { onExportCSV?.(); setShowExportMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
              >
                {t('seating.export.csv', { defaultValue: 'CSV' })}
              </button>
            </div>
          )}
        </div>

        {/* Estado de sincronización */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            {getSyncIcon()}
            <span className="hidden md:inline">{getSyncText()}</span>
          </div>
        </div>
      </div>

      {/* Barra de progreso de sincronización */}
      {syncStatus?.status === 'syncing' && (
        <div className="h-1 bg-gray-200">
          <div className="h-full bg-blue-500 animate-pulse" style={{ width: '60%' }} />
        </div>
      )}
    </div>
  );
};

export default React.memo(SeatingPlanToolbar);
