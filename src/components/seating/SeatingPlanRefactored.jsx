/**
 * SeatingPlan refactorizado – Componente principal
 */
import React, { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from 'react-toastify';
import { post as apiPost } from '../../services/apiClient';
import { useSeatingPlan } from '../../hooks/useSeatingPlan';
import SeatingPlanTabs    from './SeatingPlanTabs';
import SeatingPlanToolbar from './SeatingPlanToolbar';
import SeatingPlanCanvas  from './SeatingPlanCanvas';
import SeatingPlanSidebar from './SeatingPlanSidebar';
import SeatingPlanModals  from './SeatingPlanModals';

const SeatingPlanRefactored = () => {
  /* ---- estado / funciones principales ---- */
  const {
    tab, setTab, syncStatus, hallSize, areas, tables, seats,
    selectedTable, selectedIds, guests,
    ceremonyConfigOpen, setCeremonyConfigOpen,
    banquetConfigOpen,  setBanquetConfigOpen,
    spaceConfigOpen,    setSpaceConfigOpen,
    templateOpen,       setTemplateOpen,
    canvasRef,
    handleSelectTable, handleTableDimensionChange,
    toggleSelectedTableShape, setConfigTable,
    addArea, addTable,
    undo, redo, canUndo, canRedo,
    generateSeatGrid, generateBanquetLayout,
    exportPDF, exportPNG, exportCSV, exportSVG,
    saveHallDimensions,
    drawMode, setDrawMode,
    moveTable,
    rotateSelected, alignSelected, distributeSelected,
    toggleSeatEnabled,
    moveGuest,
    moveGuestToSeat,
    deleteArea,
    updateArea,
    deleteTable,
    duplicateTable,
    applyBanquetTables,
    clearBanquetLayout,
    autoAssignGuests,
    // preferencias de lienzo
    snapToGrid, setSnapToGrid, gridStep,
    validationsEnabled, setValidationsEnabled,
    globalMaxSeats, saveGlobalMaxGuests,
    background, setBackground, saveBackground
  } = useSeatingPlan();

  // Mostrar/ocultar mesas
  const [showTables, setShowTables] = React.useState(true);
  const toggleShowTables = () => setShowTables(s => !s);
  // Mostrar/ocultar reglas
  const [showRulers, setShowRulers] = React.useState(true);
  // Modal de fondo
  const [backgroundOpen, setBackgroundOpen] = React.useState(false);
  // Modal de capacidad global
  const [capacityOpen, setCapacityOpen] = React.useState(false);
  // Mostrar numeración de asientos
  const [showSeatNumbers, setShowSeatNumbers] = React.useState(false);
  // handler para fondo rápido (prompt)
  const handleOpenBackgroundQuick = () => {
    try {
      const url = window.prompt('URL de imagen (o data URL):');
      if (!url) return;
      const widthStr = window.prompt('Ancho real en metros:', '18');
      const widthM = Math.max(1, parseFloat(widthStr || '18'));
      const opacityStr = window.prompt('Opacidad (0-1):', '0.5');
      const opacity = Math.max(0, Math.min(1, parseFloat(opacityStr || '0.5')));
      setBackground({ dataUrl: url, widthCm: Math.round(widthM * 100), opacity });
      toast.success('Fondo actualizado');
    } catch (_) {}
  };

  // Valores seguros para evitar crashes por undefined
  const safeAreas = Array.isArray(areas) ? areas : [];
  const safeTables = Array.isArray(tables) ? tables : [];
  const safeSeats = Array.isArray(seats) ? seats : [];
  const safeGuests = Array.isArray(guests) ? guests : [];
  const safeHallSize = (hallSize && typeof hallSize.width === 'number' && typeof hallSize.height === 'number')
    ? hallSize
    : { width: 1800, height: 1200 };

  /* ---- atajos Ctrl/Cmd + Z / Y ---- */
  useEffect(() => {
    const h = (e) => {
      try {
        const platform = (typeof navigator !== 'undefined' && typeof navigator.platform === 'string') ? navigator.platform : '';
        const meta = platform.includes('Mac') ? !!e?.metaKey : !!e?.ctrlKey;
        if (!meta) return;
        const k = (typeof e?.key === 'string') ? e.key.toLowerCase() : '';
        if (k === 'z') { e.preventDefault(); undo(); }
        if (k === 'y') { e.preventDefault(); redo(); }
      } catch (_) {}
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [undo, redo]);

  // Atajos de teclado para herramientas: 1=pan,2=move,3=boundary,4=door,5=obstacle,6=aisle
  useEffect(() => {
    const onKey = (e) => {
      try {
        // Evitar atajos cuando se escribe en inputs/textarea/select
        const tag = (e?.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (['input','textarea','select'].includes(tag) || e?.isComposing) return;
        const key = typeof e?.key === 'string' ? e.key : '';
        switch (key) {
          case '1': setDrawMode('pan'); break;
          case '2': setDrawMode('move'); break;
          case '3': setDrawMode('boundary'); break;
          case '4': setDrawMode('door'); break;
          case '5': setDrawMode('obstacle'); break;
          case '6': setDrawMode('aisle'); break;
          default: break;
        }
      } catch (_) {}
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setDrawMode]);

  // Backspace: eliminar mesa seleccionada (con confirmación)
  useEffect(() => {
    const onKey = (e) => {
      try {
        const tag = (e?.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (['input','textarea','select'].includes(tag) || e?.isComposing) return;
        if (e?.key === 'Backspace' && selectedTable) {
          e.preventDefault();
          if (window.confirm('¿Eliminar la mesa seleccionada?')) {
            deleteTable(selectedTable.id);
          }
        }
      } catch (_) {}
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedTable, deleteTable]);

  // Atajos de rotación: Q/E para -5°/+5°
  useEffect(() => {
    const onKey = (e) => {
      try {
        const tag = (e?.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (['input','textarea','select'].includes(tag) || e?.isComposing) return;
        const k = String(e?.key || '').toLowerCase();
        if (k === 'q') { e.preventDefault(); rotateSelected(-5); }
        if (k === 'e') { e.preventDefault(); rotateSelected(5); }
      } catch (_) {}
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rotateSelected]);

  /* ---- handlers ---- */
  const handleOpenCeremonyConfig = () => setCeremonyConfigOpen(true);
  const handleCloseCeremonyConfig = () => setCeremonyConfigOpen(false);
  const handleOpenBanquetConfig  = () => setBanquetConfigOpen(true);
  const handleCloseBanquetConfig = () => setBanquetConfigOpen(false);
  const handleOpenSpaceConfig    = () => setSpaceConfigOpen(true);
  const handleCloseSpaceConfig   = () => setSpaceConfigOpen(false);
  const handleOpenTemplates      = () => setTemplateOpen(true);
  const handleCloseTemplates     = () => setTemplateOpen(false);

  const handleConfigureTable = (t) => {
    setConfigTable(t);
    tab === 'ceremony' ? handleOpenCeremonyConfig() : handleOpenBanquetConfig();
  };

  // Asignar invitado a mesa (drag & drop / sidebar)
  const handleAssignGuest = (tableId, guestId) => {
    if (guestId) {
      // Capacidad: contar asientos ocupados (invitado + acompañantes)
      try {
        const table = safeTables.find(t => String(t.id) === String(tableId));
        const seatsCap = parseInt(table?.seats, 10) || 0;
        if (seatsCap > 0) {
          const assigned = safeGuests.filter(g => {
            const byId = g?.tableId != null && String(g.tableId) === String(tableId);
            const byName = g?.table != null && String(g.table).trim() === String(tableId);
            return byId || byName;
          });
          const occupied = assigned.reduce((sum, g) => sum + 1 + (parseInt(g?.companion, 10) || 0), 0);
          const selGuest = safeGuests.find(g => String(g?.id) === String(guestId));
          const needed = 1 + (parseInt(selGuest?.companion, 10) || 0);
          if (occupied >= seatsCap || occupied + needed > seatsCap) {
            const remaining = Math.max(0, seatsCap - occupied);
            const msg = remaining === 0
              ? 'Capacidad completa: no hay asientos disponibles en esta mesa'
              : `Capacidad insuficiente: necesitas ${needed} asiento(s) y quedan ${remaining}`;
            // Métrica: asignación bloqueada por capacidad (best-effort, no bloqueante)
            try {
              apiPost('/api/metrics/seating', {
                body: JSON.stringify({ event: 'assign', result: 'blocked', tab }),
              }).catch(() => {});
            } catch {}
            toast.error(msg);
            return;
          }
        }
        moveGuest(guestId, tableId);
        // Métrica: asignación exitosa (best-effort, no bloqueante)
        try {
          apiPost('/api/metrics/seating', { event: 'assign', result: 'success', tab }).catch(() => {});
        } catch {}
        toast.success('Invitado asignado a la mesa');
        return;
      } catch (e) {
        console.warn('Capacity check error', e);
        // fallback: intentar asignar igualmente
        moveGuest(guestId, tableId);
        try {
          apiPost('/api/metrics/seating', { event: 'assign', result: 'success', tab }).catch(() => {});
        } catch {}
        toast.success('Invitado asignado a la mesa');
        return;
      }
    }
    // Unassign: quitar todos los invitados asociados a esta mesa
    try {
      const table = safeTables.find(t => String(t.id) === String(tableId));
      const tableName = table?.name;
      const toClear = safeGuests.filter(g => {
        const byId = g?.tableId != null && String(g.tableId) === String(tableId);
        const byName = g?.table != null && (
          String(g.table).trim() === String(tableId) || (tableName && String(g.table).trim() === String(tableName))
        );
        return byId || byName;
      });
      toClear.forEach(g => moveGuest(g.id, null));
      toast.info(`${toClear.length} invitado(s) desasignado(s)`);
    } catch (e) {
      console.warn('Unassign error', e);
      toast.error('Error al desasignar invitados');
    }
  };

  // Desasignar un invitado concreto
  const handleUnassignGuest = (guestId) => {
    try {
      if (!guestId) return;
      moveGuest(guestId, null);
      toast.info('Invitado desasignado');
    } catch (e) {
      console.warn('Unassign single guest error', e);
      toast.error('No se pudo desasignar el invitado');
    }
  };

  // Aplicación de plantillas (evita fallo si se usa el modal de plantillas)
  const handleApplyTemplate = (template) => {
    if (template?.ceremony) {
      generateSeatGrid(
        template.ceremony.rows,
        template.ceremony.cols,
        40,
        100,
        80,
        Math.floor(template.ceremony.cols / 2)
      );
    }
    if (Array.isArray(template?.banquetTables)) {
      applyBanquetTables(template.banquetTables);
    } else if (template?.banquet) {
      generateBanquetLayout({
        rows: template.banquet.rows,
        cols: template.banquet.cols,
        seats: template.banquet.seats,
        gapX: 140,
        gapY: 160,
        startX: 120,
        startY: 160
      });
    }

    // Asignación automática no intrusiva (sin cambiar UI): intentar asignar tras aplicar plantilla
    setTimeout(async () => {
      try {
        const enableAutoAssign = import.meta.env.VITE_ENABLE_AUTO_ASSIGN === 'true';
        if (!enableAutoAssign) return;
        const res = await autoAssignGuests();
        if (res?.ok) {
          const msg = res.method === 'backend'
            ? `Asignación automática (IA): ${res.assigned} invitado(s)`
            : `Asignación automática: ${res.assigned} invitado(s)`;
          toast.info(msg);
        } else if (res?.error) {
          toast.warn(`Autoasignación: ${res.error}`);
        }
      } catch (e) {
        // Silencioso para no molestar al usuario; solo log
        console.warn('Auto-assign error', e);
      }
    }, 50);
  };

  const handleAutoAssignClick = async () => {
    try {
      const res = await autoAssignGuests();
      if (res?.ok) {
        const msg = res.method === 'backend'
          ? `Asignación automática (IA): ${res.assigned} invitado(s)`
          : `Asignación automática: ${res.assigned} invitado(s)`;
        toast.info(msg);
      } else if (res?.error) {
        toast.warn(`Auto-asignación: ${res.error}`);
      }
    } catch (e) {
      toast.error('Error en auto-asignación');
    }
  };

  // Generación desde modal de banquete seguida de autoasignación (silencioso a nivel de UI)
  const handleGenerateBanquetLayoutWithAssign = (config) => {
    try {
      generateBanquetLayout(config);
    } finally {
      setTimeout(async () => {
        try {
          const enableAutoAssign = import.meta.env.VITE_ENABLE_AUTO_ASSIGN === 'true';
          if (!enableAutoAssign) return;
          const res = await autoAssignGuests();
          if (res?.ok) {
            const msg = res.method === 'backend'
              ? `Asignación automática (IA): ${res.assigned} invitado(s)`
              : `Asignación automática: ${res.assigned} invitado(s)`;
            toast.info(msg);
          } else if (res?.error) {
            toast.warn(`Autoasignación: ${res.error}`);
          }
        } catch (e) {
          console.warn('Auto-assign error', e);
        }
      }, 50);
    }
  };

  // No-op defensivo para habilitar/deshabilitar elementos desde el canvas
  const handleToggleEnabled = () => {};

  // Auto IA eliminado en la toolbar (feature desactivada en UI)

  /* ---- render ---- */
  const ceremonyCount = safeSeats.length;
  const banquetCount  = safeTables.length;

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="h-full flex flex-col bg-gray-50">
      {/* Tabs */}
      <div className="flex-shrink-0 p-4 pb-0">
        <SeatingPlanTabs
          activeTab={tab}
          onTabChange={setTab}
          ceremonyCount={ceremonyCount}
          banquetCount={banquetCount}
        />
      </div>

      {/* Toolbar */}
      <div className="flex-shrink-0 p-4 pb-2">
        <SeatingPlanToolbar
          tab={tab}
          onUndo={undo} onRedo={redo}
          canUndo={canUndo} canRedo={canRedo}
          onExportPDF={exportPDF}
          onExportPNG={exportPNG}
          onExportCSV={exportCSV}
          onExportSVG={exportSVG}
          onOpenCeremonyConfig={handleOpenCeremonyConfig}
          onOpenBanquetConfig={handleOpenBanquetConfig}
          onOpenSpaceConfig={handleOpenSpaceConfig}
          onOpenBackground={() => setBackgroundOpen(true)}
          onAutoAssign={handleAutoAssignClick}
          onClearBanquet={clearBanquetLayout}
          onOpenTemplates={handleOpenTemplates}
          syncStatus={syncStatus}
          showTables={showTables}
          onToggleShowTables={toggleShowTables}
          showRulers={showRulers}
          onToggleRulers={() => setShowRulers(v => !v)}
          snapEnabled={!!snapToGrid}
          onToggleSnap={() => setSnapToGrid(v => !v)}
          gridStep={gridStep}
          showSeatNumbers={showSeatNumbers}
          onToggleSeatNumbers={() => setShowSeatNumbers(v => !v)}
          onRotateLeft={() => rotateSelected(-5)}
          onRotateRight={() => rotateSelected(5)}
          onAlign={(axis, mode) => alignSelected(axis, mode)}
          onDistribute={(axis) => distributeSelected(axis)}
          validationsEnabled={validationsEnabled}
          onToggleValidations={() => setValidationsEnabled(v => !v)}
          globalMaxSeats={globalMaxSeats}
          onOpenCapacity={() => setCapacityOpen(true)}
        />
      </div>

      {/* Cuerpo */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0">
          <SeatingPlanSidebar
            selectedTable={selectedTable}
            onTableDimensionChange={handleTableDimensionChange}
            onToggleTableShape={toggleSelectedTableShape}
            onConfigureTable={handleConfigureTable}
            guests={safeGuests}
            tab={tab}
            drawMode={drawMode}
            onDrawModeChange={setDrawMode}
            onAssignGuest={handleAssignGuest}
            onUnassignGuest={handleUnassignGuest}
            deleteTable={deleteTable}
            duplicateTable={duplicateTable}
            globalMaxSeats={globalMaxSeats}
            className="h-full"
          />
        </div>

        {/* Canvas */}
        <div className="flex-1">
        <SeatingPlanCanvas
            tab={tab}
            areas={safeAreas}
            tables={showTables ? safeTables : []}
            seats={safeSeats}
            hallSize={safeHallSize}
            selectedTable={selectedTable}
            onSelectTable={handleSelectTable}
            onTableDimensionChange={handleTableDimensionChange}
            onToggleEnabled={handleToggleEnabled}
            onAddArea={addArea}
            onAddTable={addTable}
            drawMode={drawMode}
            onDrawModeChange={setDrawMode}
            canvasRef={canvasRef}
            className="h-full"
            moveTable={moveTable}
            onToggleSeat={toggleSeatEnabled}
            onAssignGuest={handleAssignGuest}
            onAssignGuestSeat={(tableId, seatIdx, guestId) => {
              try { moveGuestToSeat(guestId, tableId, seatIdx); toast.success(`Invitado a asiento ${seatIdx+1}`); } catch(_) { handleAssignGuest(tableId, guestId); }
            }}
          guests={safeGuests}
          onDeleteArea={deleteArea}
          onUpdateArea={updateArea}
          showRulers={showRulers}
          gridStep={gridStep}
          selectedIds={selectedIds}
          showSeatNumbers={showSeatNumbers}
          background={background}
          globalMaxSeats={globalMaxSeats}
          validationsEnabled={validationsEnabled}
        />
        </div>
      </div>

      {/* Modales */}
      <SeatingPlanModals
        ceremonyConfigOpen={ceremonyConfigOpen}
        banquetConfigOpen={banquetConfigOpen}
        spaceConfigOpen={spaceConfigOpen}
        templateOpen={templateOpen}
        backgroundOpen={backgroundOpen}
        capacityOpen={capacityOpen}
        onCloseCeremonyConfig={handleCloseCeremonyConfig}
        onCloseBanquetConfig={handleCloseBanquetConfig}
        onCloseSpaceConfig={handleCloseSpaceConfig}
        onCloseBackground={()=> setBackgroundOpen(false)}
        onCloseCapacity={()=> setCapacityOpen(false)}
        onCloseTemplate={handleCloseTemplates}
        onGenerateSeatGrid={generateSeatGrid}
        onGenerateBanquetLayout={handleGenerateBanquetLayoutWithAssign}
        onSaveHallDimensions={async (w,h,aisle) => { try { await saveHallDimensions(w,h,aisle); toast.success('Dimensiones guardadas'); } catch(e){ toast.error('Error guardando dimensiones'); } }}
        onApplyTemplate={handleApplyTemplate}
        onSaveCapacity={async (n) => { try { await saveGlobalMaxGuests(n); toast.success('Capacidad global guardada'); } catch(e){ toast.error('Error guardando capacidad'); } }}
        onSaveBackground={async (bg) => { try { await saveBackground(bg); toast.success('Fondo actualizado'); } catch(e){ toast.error('Error guardando fondo'); } }}
        areas={safeAreas}
        hallSize={safeHallSize}
        guests={safeGuests}
        tables={safeTables}
        background={background}
      />
    </div>
    </DndProvider>
  );
};

export default SeatingPlanRefactored;

