/**
 * SeatingPlanModern - New floating layout version
 * Wrapper integrating the new visual design with existing functionality
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from 'react-toastify';

// New design components
import SeatingLayoutFloating from './SeatingLayoutFloating';
import SeatingToolbarFloating from './SeatingToolbarFloating';
import SeatingHeaderCompact from './SeatingHeaderCompact';
import SeatingFooterStats from './SeatingFooterStats';
import SeatingInspectorFloating from './SeatingInspectorFloating';

// Phase 3 components (Premium)
import ThemeToggle from './ThemeToggle';
import ConfettiCelebration from './ConfettiCelebration';
import QuickAddTableButton from './QuickAddTableButton';

// Existing components (reused)
import SeatingPlanCanvas from './SeatingPlanCanvas';
import SeatingPlanModals from './SeatingPlanModals';
import SeatingGuestDrawer from './SeatingGuestDrawer';
import SeatingExportWizard from './SeatingExportWizard';

// Hooks
import { useSeatingPlan } from '../../hooks/useSeatingPlan';
import { useWedding } from '../../context/WeddingContext';
import useTheme from '../../hooks/useTheme';
import { post as apiPost } from '../../services/apiClient';
import useTranslations from '../../hooks/useTranslations';

export default function SeatingPlanModern() {
  const { t } = useTranslations();
  const { activeWedding } = useWedding();
  
  // Hook principal de seating
  const {
    // Basic state
    tab,
    setTab,
    hallSize,
    areas,
    tables,
    seats,
    selectedTable,
    guests,
    
    // Modals
    ceremonyConfigOpen,
    setCeremonyConfigOpen,
    banquetConfigOpen,
    setBanquetConfigOpen,
    spaceConfigOpen,
    setSpaceConfigOpen,
    templateOpen,
    setTemplateOpen,
    
    // Main actions
    handleSelectTable,
    addTable,
    deleteTable,
    duplicateTable,
    toggleTableLocked,
    undo,
    redo,
    canUndo,
    canRedo,
    
    // Generation
    generateSeatGrid,
    generateBanquetLayout,
    
    // Export
    exportPDF,
    exportPNG,
    exportCSV,
    
    // Dimensions
    saveHallDimensions,
    
    // Draw mode
    drawMode,
    setDrawMode,
    
    // Transformations
    moveTable,
    rotateSelected,
    
    // Guests
    moveGuest,
    moveGuestToSeat,
    
    // Auto-assignment
    autoAssignGuests,
    conflicts,
  } = useSeatingPlan();

  // Crear ref local para el canvas si useSeatingPlan no lo proporciona
  const canvasRef = React.useRef(null);

  // Estado local para UI
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);
  const [exportWizardOpen, setExportWizardOpen] = useState(false);
  const [guestDrawerOpen, setGuestDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Phase 3: Theme and celebration
  const { theme, isDark, toggleTheme } = useTheme();
  const [showConfetti, setShowConfetti] = useState(false);
  const [previousPercentage, setPreviousPercentage] = useState(0);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalGuests = guests?.length || 0;
    const assignedGuests = guests?.filter(g => g.tableId || g.table)?.length || 0;
    const assignedPercentage = totalGuests > 0 
      ? Math.round((assignedGuests / totalGuests) * 100) 
      : 0;
    const tableCount = tables?.length || 0;
    const conflictCount = conflicts?.length || 0;

    return {
      totalGuests,
      assignedGuests,
      assignedPercentage,
      tableCount,
      conflictCount,
    };
  }, [guests, tables, conflicts]);

  // Detectar cuando llegamos a 100% y lanzar confetti
  useEffect(() => {
    if (stats.assignedPercentage === 100 && previousPercentage < 100 && stats.totalGuests > 0) {
      setShowConfetti(true);
      toast.success(t('planModern.toasts.fullAssignment'), {
        autoClose: 3000,
      });
    }
    setPreviousPercentage(stats.assignedPercentage);
  }, [stats.assignedPercentage, previousPercentage, stats.totalGuests, t]);

  // Handler para Auto-IA
  const handleAutoAssign = useCallback(async () => {
    setAutoAssignLoading(true);
    try {
      await autoAssignGuests();
      toast.success(t('planModern.toasts.autoAssignSuccess'));
    } catch (error) {
      console.error('[auto-assign] error:', error);
      toast.error(t('planModern.toasts.autoAssignError'));
    } finally {
      setAutoAssignLoading(false);
    }
  }, [autoAssignGuests, t]);

  // Handler to add a table
  const handleAddTable = useCallback(() => {
    try {
      console.log('[handleAddTable] state before adding:');
      console.log('- tab:', tab);
      console.log('- tables.length:', tables?.length || 0);
      console.log('- addTable available:', !!addTable);
      
      if (!addTable) {
        toast.error(t('planModern.errors.addTableUnavailable'));
        console.error('[addTable] handler missing in useSeatingPlan');
        return;
      }
      
      // Asegurar que estamos en tab banquet
      if (tab !== 'banquet') {
        console.warn('[handleAddTable] Not in banquet tab, switching...');
        setTab('banquet');
      }
      
      const newTable = {
        id: `table-${Date.now()}`,
        x: (hallSize?.width || 1800) / 2 - 50,
        y: (hallSize?.height || 1200) / 2 - 50,
        width: 100,
        height: 100,
        shape: 'circle',
        capacity: 8,
        seats: 8,
        number: (tables?.length || 0) + 1,
        name: t('planModern.defaults.tableName', { number: (tables?.length || 0) + 1 }),
      };
      
      console.log('[handleAddTable] adding table:', newTable);
      addTable(newTable);
      toast.success(t('planModern.toasts.addTableSuccess'));
      
      // Verify state after the async update
      setTimeout(() => {
        console.log('[handleAddTable] state after async check:');
        console.log('- tables.length:', tables?.length || 0);
      }, 100);
    } catch (error) {
      console.error('[handleAddTable] Error:', error);
      const details = error?.message ? `: ${error.message}` : '';
      toast.error(t('planModern.toasts.addTableError', { message: details }));
    }
  }, [addTable, hallSize, tables, tab, setTab, t]);
  
  // Debug: Detectar cambios en tables
  useEffect(() => {
    console.log('[SeatingPlanModern] tables changed:', {
      length: tables?.length || 0,
      tab,
      tables: tables?.map(t => ({ id: t.id, name: t.name, x: t.x, y: t.y }))
    });
  }, [tables, tab]);

  // Handler para duplicar mesa
  const handleDuplicate = useCallback((tableId) => {
    duplicateTable(tableId);
    toast.success(t('planModern.toasts.duplicateTable'));
  }, [duplicateTable, t]);

  // Handler para rotar mesa
  const handleRotate = useCallback((tableId) => {
    rotateSelected();
    toast.success(t('planModern.toasts.rotateTable'));
  }, [rotateSelected, t]);

  // Handler para toggle lock
  const handleToggleLock = useCallback((tableId) => {
    toggleTableLocked(tableId);
  }, [toggleTableLocked]);

  // Handler para eliminar mesa
  const handleDelete = useCallback((tableId) => {
    deleteTable(tableId);
    toast.success(t('planModern.toasts.deleteTable'));
  }, [deleteTable, t]);

  // Handler para cambiar capacidad
  const handleCapacityChange = useCallback((tableId, newCapacity) => {
    // Buscar la mesa y actualizar
    const tableToUpdate = tables?.find(t => t.id === tableId);
    if (tableToUpdate) {
      // TODO: provide an updateTable method in useSeatingPlan
      // Por ahora solo mostramos feedback
      toast.info(t('planModern.toasts.capacityUpdated', { value: newCapacity }));
    }
  }, [tables, t]);

  // Handler para remover invitado
  const handleRemoveGuest = useCallback((tableId, guestId) => {
    // Mover invitado de vuelta a sin asignar
    const guest = guests?.find(g => g.id === guestId);
    if (guest) {
      moveGuest(guestId, null, null);
      toast.success(t('planModern.toasts.removeGuest'));
    }
  }, [guests, moveGuest, t]);

  // Handler para abrir drawer de invitados
  const handleOpenDrawMode = useCallback(() => {
    setGuestDrawerOpen(true);
  }, []);

  // Obtener mesa seleccionada con datos completos
  const selectedTableData = useMemo(() => {
    if (!selectedTable) return null;
    
    const table = tables?.find(t => t.id === selectedTable);
    if (!table) return null;

    // Obtener invitados asignados a esta mesa
    const assignedGuests = guests?.filter(g => 
      g.tableId === table.id || g.table === table.id
    ) || [];

    return {
      ...table,
      assignedGuests,
    };
  }, [selectedTable, tables, guests]);

  // Nombre del usuario para el header
  const userName = useMemo(() => {
    // Obtain the actual user name from context if needed
    return t('planModern.header.userFallback');
  }, [t]);

  return (
    <DndProvider backend={HTML5Backend}>
      <SeatingLayoutFloating>
        {/* Header */}
        <SeatingLayoutFloating.Header>
          <SeatingHeaderCompact
            currentTab={tab === 'ceremony' ? 'ceremony' : 'banquet'}
            onTabChange={(newTab) => setTab(newTab)}
            guestCount={stats.totalGuests}
            tableCount={stats.tableCount}
            ceremonySeats={seats?.length || 0}
            userName={userName}
            themeToggle={
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            }
          />
        </SeatingLayoutFloating.Header>

        {/* Confetti Celebration */}
        <ConfettiCelebration 
          show={showConfetti} 
          onComplete={() => setShowConfetti(false)} 
        />

        {/* Main Canvas Area */}
        <SeatingLayoutFloating.Main>
          {/* Toolbar Flotante */}
          <SeatingToolbarFloating
            mode={drawMode}
            onModeChange={setDrawMode}
            onAddTable={handleAddTable}
            onOpenDrawMode={handleOpenDrawMode}
            onAutoAssign={handleAutoAssign}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenTemplates={() => setTemplateOpen(true)}
          />

          {/* Canvas Principal */}
          <SeatingLayoutFloating.Canvas>
            <SeatingPlanCanvas
              canvasRef={canvasRef}
              tab={tab}
              hallSize={hallSize}
              areas={areas}
              tables={tables}
              seats={seats}
              selectedTable={selectedTable}
              onSelectTable={handleSelectTable}
              drawMode={drawMode}
              guests={guests}
              moveTable={moveTable}
              // Additional props as needed
            />
          </SeatingLayoutFloating.Canvas>

          {/* Inspector Flotante (condicional) */}
          {selectedTableData && (
            <SeatingInspectorFloating
              table={selectedTableData}
              onClose={() => handleSelectTable(null)}
              onDuplicate={handleDuplicate}
              onRotate={handleRotate}
              onToggleLock={handleToggleLock}
              onDelete={handleDelete}
              onRemoveGuest={handleRemoveGuest}
              onCapacityChange={handleCapacityChange}
            />
          )}
          
          {/* Botón flotante de añadir mesa (siempre visible) */}
          <QuickAddTableButton 
            onAdd={handleAddTable} 
            position="bottom-right" 
          />
        </SeatingLayoutFloating.Main>

        {/* Footer */}
        <SeatingLayoutFloating.Footer>
          <SeatingFooterStats
            assignedPercentage={stats.assignedPercentage}
            totalGuests={stats.totalGuests}
            assignedGuests={stats.assignedGuests}
            tableCount={stats.tableCount}
            conflictCount={stats.conflictCount}
            onAutoAssign={handleAutoAssign}
            onExport={() => setExportWizardOpen(true)}
            autoAssignLoading={autoAssignLoading}
          />
        </SeatingLayoutFloating.Footer>

        {/* Modales (existentes) */}
        <SeatingPlanModals
          ceremonyConfigOpen={ceremonyConfigOpen}
          setCeremonyConfigOpen={setCeremonyConfigOpen}
          banquetConfigOpen={banquetConfigOpen}
          setBanquetConfigOpen={setBanquetConfigOpen}
          spaceConfigOpen={spaceConfigOpen}
          setSpaceConfigOpen={setSpaceConfigOpen}
          templateOpen={templateOpen}
          setTemplateOpen={setTemplateOpen}
          generateSeatGrid={generateSeatGrid}
          generateBanquetLayout={generateBanquetLayout}
          saveHallDimensions={saveHallDimensions}
          hallSize={hallSize}
        />

        {/* Guest Drawer */}
        {guestDrawerOpen && (
          <SeatingGuestDrawer
            guests={guests?.filter(g => !g.tableId && !g.table) || []}
            onClose={() => setGuestDrawerOpen(false)}
            onDragGuest={moveGuest}
          />
        )}

        {/* Export Wizard */}
        {exportWizardOpen && (
          <SeatingExportWizard
            onClose={() => setExportWizardOpen(false)}
            onExportPDF={exportPDF}
            onExportPNG={exportPNG}
            onExportCSV={exportCSV}
            tables={tables}
            guests={guests}
          />
        )}
      </SeatingLayoutFloating>
    </DndProvider>
  );
}
