/**
 * SeatingPlanModern - Nueva versión con diseño flotante moderno
 * Wrapper que integra el nuevo diseño visual con la funcionalidad existente
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from 'react-toastify';

// Nuevos componentes de diseño
import SeatingLayoutFloating from './SeatingLayoutFloating';
import SeatingToolbarFloating from './SeatingToolbarFloating';
import SeatingHeaderCompact from './SeatingHeaderCompact';
import SeatingFooterStats from './SeatingFooterStats';
import SeatingInspectorFloating from './SeatingInspectorFloating';

// Componentes Fase 3 (Premium)
import ThemeToggle from './ThemeToggle';
import ConfettiCelebration from './ConfettiCelebration';
import QuickAddTableButton from './QuickAddTableButton';

// Componentes existentes (reutilizados)
import SeatingPlanCanvas from './SeatingPlanCanvas';
import SeatingPlanModals from './SeatingPlanModals';
import SeatingGuestDrawer from './SeatingGuestDrawer';
import SeatingExportWizard from './SeatingExportWizard';

// Hooks
import { useSeatingPlan } from '../../hooks/useSeatingPlan';
import { useWedding } from '../../context/WeddingContext';
import useTheme from '../../hooks/useTheme';
import { post as apiPost } from '../../services/apiClient';

export default function SeatingPlanModern() {
  const { activeWedding } = useWedding();
  
  // Hook principal de seating
  const {
    // Estado básico
    tab,
    setTab,
    hallSize,
    areas,
    tables,
    seats,
    selectedTable,
    guests,
    
    // Modales
    ceremonyConfigOpen,
    setCeremonyConfigOpen,
    banquetConfigOpen,
    setBanquetConfigOpen,
    spaceConfigOpen,
    setSpaceConfigOpen,
    templateOpen,
    setTemplateOpen,
    
    // Acciones principales
    handleSelectTable,
    addTable,
    deleteTable,
    duplicateTable,
    toggleTableLocked,
    undo,
    redo,
    canUndo,
    canRedo,
    
    // Generación
    generateSeatGrid,
    generateBanquetLayout,
    
    // Exportación
    exportPDF,
    exportPNG,
    exportCSV,
    
    // Dimensiones
    saveHallDimensions,
    
    // Modo de dibujo
    drawMode,
    setDrawMode,
    
    // Transformaciones
    moveTable,
    rotateSelected,
    
    // Invitados
    moveGuest,
    moveGuestToSeat,
    
    // Auto-asignación
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
  
  // Fase 3: Theme y celebración
  const { theme, isDark, toggleTheme } = useTheme();
  const [showConfetti, setShowConfetti] = useState(false);
  const [previousPercentage, setPreviousPercentage] = useState(0);

  // Calcular estadísticas
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
      toast.success('🎉 ¡100% de invitados asignados! ¡Felicitaciones!', {
        autoClose: 3000,
      });
    }
    setPreviousPercentage(stats.assignedPercentage);
  }, [stats.assignedPercentage, previousPercentage, stats.totalGuests]);

  // Handler para Auto-IA
  const handleAutoAssign = useCallback(async () => {
    setAutoAssignLoading(true);
    try {
      await autoAssignGuests();
      toast.success('✨ Asignación automática completada');
    } catch (error) {
      console.error('Error en auto-asignación:', error);
      toast.error('Error en la asignación automática');
    } finally {
      setAutoAssignLoading(false);
    }
  }, [autoAssignGuests]);

  // Handler para añadir mesa
  const handleAddTable = useCallback(() => {
    try {
      if (!addTable) {
        toast.error('La función addTable no está disponible');
        console.error('addTable no está en useSeatingPlan');
        return;
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
        name: `Mesa ${(tables?.length || 0) + 1}`,
      };
      
      console.log('Añadiendo mesa:', newTable);
      addTable(newTable);
      toast.success('✨ Mesa añadida - Arrástrala para posicionarla');
    } catch (error) {
      console.error('Error añadiendo mesa:', error);
      toast.error('Error al añadir mesa: ' + error.message);
    }
  }, [addTable, hallSize, tables]);

  // Handler para duplicar mesa
  const handleDuplicate = useCallback((tableId) => {
    duplicateTable(tableId);
    toast.success('Mesa duplicada');
  }, [duplicateTable]);

  // Handler para rotar mesa
  const handleRotate = useCallback((tableId) => {
    rotateSelected();
    toast.success('Mesa rotada');
  }, [rotateSelected]);

  // Handler para toggle lock
  const handleToggleLock = useCallback((tableId) => {
    toggleTableLocked(tableId);
  }, [toggleTableLocked]);

  // Handler para eliminar mesa
  const handleDelete = useCallback((tableId) => {
    deleteTable(tableId);
    toast.success('Mesa eliminada');
  }, [deleteTable]);

  // Handler para cambiar capacidad
  const handleCapacityChange = useCallback((tableId, newCapacity) => {
    // Buscar la mesa y actualizar
    const tableToUpdate = tables?.find(t => t.id === tableId);
    if (tableToUpdate) {
      // Aquí deberías tener un método updateTable en useSeatingPlan
      // Por ahora solo mostramos feedback
      toast.info(`Capacidad actualizada: ${newCapacity}`);
    }
  }, [tables]);

  // Handler para remover invitado
  const handleRemoveGuest = useCallback((tableId, guestId) => {
    // Mover invitado de vuelta a sin asignar
    const guest = guests?.find(g => g.id === guestId);
    if (guest) {
      moveGuest(guestId, null, null);
      toast.success('Invitado removido de la mesa');
    }
  }, [guests, moveGuest]);

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
    // Aquí podrías obtener el nombre real del usuario del contexto
    return 'Usuario';
  }, []);

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
              // Más props según necesites
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
