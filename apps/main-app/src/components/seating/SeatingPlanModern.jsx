/**
 * SeatingPlanModern - New floating layout version
 * Wrapper integrating the new visual design with existing functionality
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

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

// FASE 1: Layout Generator
import LayoutGeneratorModal from './LayoutGeneratorModal';
import { generateLayout, LAYOUT_TYPES } from './SeatingLayoutGenerator';

// FASE 2: Drawing Tools & Templates
import DrawingTools, { DRAWING_TOOLS } from './DrawingTools';
import DrawingElements from './DrawingElements';
import TemplateSelector from './WeddingTemplates';
import { createSeatingPlanDrawingHandlers } from './SeatingPlanHandlers';

// FASE 3: Snap Guides & Minimap
import SnapGuides from './SnapGuides';
import useSnapGuides from './useSnapGuides';
import Minimap from './Minimap';
import BanquetConfigAdvanced from './BanquetConfigAdvanced';

// AI Assistant
import AIAssistantChat from './AIAssistantChat';

// Heatmap
import OccupancyHeatmapModal from './OccupancyHeatmapModal';

// Lista móvil
import TableListMobileModal from './TableListMobileModal';

// Sistema de logros
import AchievementUnlocked from './AchievementUnlocked';
import AchievementsModal from './AchievementsModal';
import { useAchievements } from '../../hooks/useAchievements';

// Hooks
import { useSeatingPlan } from '../../hooks/useSeatingPlan';
import { useWedding } from '../../context/WeddingContext';
import useTheme from '../../hooks/useTheme';
import { post as apiPost } from '../../services/apiClient';
import useTranslations from '../../hooks/useTranslations';
import { useMobileViewport } from '../../hooks/useMobileViewport';

// Modo móvil
import SeatingMobile from './SeatingMobile';

export default function SeatingPlanModern() {
  const { t } = useTranslations();
  const { activeWedding } = useWedding();
  
  // Detectar viewport móvil (≤1024px)
  const isMobile = useMobileViewport(1024);

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
    applyBanquetTables,
    setupSeatingPlanAutomatically, // Generación TODO automática 

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

  // Calcular invitados sin mesa asignada
  const pendingGuestsCount = useMemo(() => {
    return (guests || []).filter((g) => !g.tableId && !g.table).length;
  }, [guests]);

  // FASE 1: Layout Generator
  const [layoutGeneratorOpen, setLayoutGeneratorOpen] = useState(false);

  // FASE 2: Drawing Tools & Templates
  const [activeTool, setActiveTool] = useState(DRAWING_TOOLS.SELECT);
  const [drawingElements, setDrawingElements] = useState([]);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);

  // FASE 3: Snap Guides & Minimap
  const snapGuides = useSnapGuides(tables);
  const [showMinimap, setShowMinimap] = useState(false); // Oculto por defecto para no saturar UI
  const [banquetConfig, setBanquetConfig] = useState({});

  // Phase 3: Theme and celebration
  const { theme, isDark, toggleTheme } = useTheme();
  const [showConfetti, setShowConfetti] = useState(false);
  const [previousPercentage, setPreviousPercentage] = useState(0);

  // AI Assistant state
  const [aiChatOpen, setAiChatOpen] = useState(false);

  // Heatmap state
  const [heatmapOpen, setHeatmapOpen] = useState(false);

  // Lista móvil state
  const [listViewOpen, setListViewOpen] = useState(false);

  // Sistema de logros - TEMPORALMENTE DESACTIVADO por loops infinitos
  // const achievements = useAchievements(activeWedding);
  const achievements = {
    unlockedAchievements: [],
    progress: { percentage: 0, totalPoints: 0 },
    nextAchievement: null,
    trackEvent: () => {},
    updateSessionData: () => {},
  };
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);

  // Si es móvil, renderizar interfaz móvil optimizada
  if (isMobile) {
    return (
      <SeatingMobile
        tables={tables || []}
        guests={guests || []}
        onAssignGuest={(guestId, tableId) => moveGuest(guestId, tableId)}
        onUpdateTable={(tableId, updates) => {
          // Implementar actualización de mesa
          console.log('Update table:', tableId, updates);
        }}
        onAddTable={addTable}
        onAddGuest={() => {
          // Abrir modal de agregar invitado
          setGuestDrawerOpen(true);
        }}
        onExport={() => setExportWizardOpen(true)}
        onImport={() => {
          // Implementar importación
          console.log('Import');
        }}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        collaborativeEditors={{}} // TODO: Integrar colaboración en tiempo real
        currentUser={activeWedding?.ownerIds?.[0] || 'user'}
      />
    );
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const totalGuests = guests?.length || 0;
    const assignedGuests = guests?.filter((g) => g.tableId || g.table)?.length || 0;
    const assignedPercentage =
      totalGuests > 0 ? Math.round((assignedGuests / totalGuests) * 100) : 0;
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
      setPreviousPercentage(stats.assignedPercentage);
    } else if (stats.assignedPercentage !== previousPercentage) {
      setPreviousPercentage(stats.assignedPercentage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.assignedPercentage, stats.totalGuests]);

  // Trackear cambios para logros - DESACTIVADO temporalmente
  // useEffect(() => {
  //   achievements.updateSessionData({
  //     totalGuests: stats.totalGuests,
  //     assignedGuests: stats.assignedGuests,
  //     conflictsCount: stats.conflictCount,
  //     totalTables: stats.tableCount,
  //   });
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [stats.totalGuests, stats.assignedGuests, stats.conflictCount, stats.tableCount]);

  // Handler para Auto-IA
  const handleAutoAssign = useCallback(async () => {
    setAutoAssignLoading(true);
    try {
      await autoAssignGuests();
      toast.success(t('planModern.toasts.autoAssignSuccess'));
    } catch (error) {
      // console.error('[auto-assign] error:', error);
      toast.error(t('planModern.toasts.autoAssignError'));
    } finally {
      setAutoAssignLoading(false);
    }
  }, [autoAssignGuests, t]);

  // Handler to add a table
  const handleAddTable = useCallback(() => {
    try {
      // console.log('[handleAddTable] state before adding:');
      // console.log('- tab:', tab);
      // console.log('- tables.length:', tables?.length || 0);
      // console.log('- addTable available:', !!addTable);

      if (!addTable) {
        toast.error(t('planModern.errors.addTableUnavailable'));
        // console.error('[addTable] handler missing in useSeatingPlan');
        return;
      }

      // Asegurar que estamos en tab banquet
      if (tab !== 'banquet') {
        // console.warn('[handleAddTable] Not in banquet tab, switching...');
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

      // console.log('[handleAddTable] adding table:', newTable);
      addTable(newTable);
      toast.success(t('planModern.toasts.addTableSuccess'));

      // Verify state after the async update
      setTimeout(() => {
        // console.log('[handleAddTable] state after async check:');
        // console.log('- tables.length:', tables?.length || 0);
      }, 100);
    } catch (error) {
      // console.error('[handleAddTable] Error:', error);
      const details = error?.message ? `: ${error.message}` : '';
      toast.error(t('planModern.toasts.addTableError', { message: details }));
    }
  }, [addTable, hallSize, tables, tab, setTab, t]);

  // Debug: Detectar cambios en tables
  useEffect(() => {
    // console.log('[SeatingPlanModern] tables changed:', { length: tables?.length || 0, tab, tables: tables?.map((t) => ({ id: t.id, name: t.name, x: t.x, y: t.y })) });
  }, [tables, tab]);

  // Handler para duplicar mesa
  const handleDuplicate = useCallback(
    (tableId) => {
      duplicateTable(tableId);
      toast.success(t('planModern.toasts.duplicateTable'));
    },
    [duplicateTable, t]
  );

  // Handler para rotar mesa
  const handleRotate = useCallback(
    (tableId) => {
      rotateSelected();
      toast.success(t('planModern.toasts.rotateTable'));
    },
    [rotateSelected, t]
  );

  // Handler para toggle lock
  const handleToggleLock = useCallback(
    (tableId) => {
      toggleTableLocked(tableId);
    },
    [toggleTableLocked]
  );

  // Handler para eliminar mesa
  const handleDelete = useCallback(
    (tableId) => {
      deleteTable(tableId);
      toast.success(t('planModern.toasts.deleteTable'));
    },
    [deleteTable, t]
  );

  // Handler para cambiar capacidad
  const handleCapacityChange = useCallback(
    (tableId, newCapacity) => {
      // Buscar la mesa y actualizar
      const tableToUpdate = tables?.find((t) => t.id === tableId);
      if (tableToUpdate) {
        // TODO: provide an updateTable method in useSeatingPlan
        // Por ahora solo mostramos feedback
        toast.info(t('planModern.toasts.capacityUpdated', { value: newCapacity }));
      }
    },
    [tables, t]
  );

  // Handler para remover invitado
  const handleRemoveGuest = useCallback(
    (tableId, guestId) => {
      // Mover invitado de vuelta a sin asignar
      const guest = guests?.find((g) => g.id === guestId);
      if (guest) {
        moveGuest(guestId, null, null);
        toast.success(t('planModern.toasts.removeGuest'));
      }
    },
    [guests, moveGuest, t]
  );

  // Handler para generación TODO automática 
  const [isGeneratingAuto, setIsGeneratingAuto] = useState(false);

  const handleGenerarTodoAutomatico = useCallback(async () => {
    try {
      setIsGeneratingAuto(true);

      toast.info(' Analizando invitados y generando plan...', {
        autoClose: 2000,
      });

      const result = await setupSeatingPlanAutomatically({
        layoutPreference: 'auto',
        tableCapacity: 8,
      });

      console.log(' Resultado de generación:', result);

      if (result.success) {
        // Track achievement: layout generated - DESACTIVADO temporalmente
        // achievements.trackEvent('layout_generated');

        toast.success(
          <div>
            <strong> {result.message}</strong>
            <div style={{ marginTop: '8px', fontSize: '13px' }}>
              {result.stats.mesas} mesas creadas
              <br />
              {result.stats.invitadosAsignados} invitados asignados
              <br />
              Layout: {result.stats.layoutUsado}
              {result.stats.invitadosPendientes > 0 && (
                <>
                  <br /> {result.stats.invitadosPendientes} pendientes
                </>
              )}
            </div>
          </div>,
          { autoClose: 6000 }
        );

        // IMPORTANTE: Esperar y recargar si NO se asignaron invitados
        if (result.stats.invitadosAsignados === 0 && result.stats.invitadosPendientes > 0) {
          console.log(' No se asignaron invitados, recargando en 2 segundos...');
          toast.info(' Refrescando datos...', { autoClose: 1500 });

          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } else {
        toast.error(result.message || 'Error en la generación automática');
      }
    } catch (error) {
      // console.error('[handleGenerarTodoAutomatico] Error:', error);
      toast.error('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setIsGeneratingAuto(false);
    }
  }, [setupSeatingPlanAutomatically]);

  // Handler para abrir drawer de invitados
  const handleOpenDrawMode = useCallback(() => {
    setGuestDrawerOpen(true);
  }, []);

  // FASE 2: Handlers para Drawing Tools usando el helper
  const drawingHandlers = useMemo(() => {
    return createSeatingPlanDrawingHandlers({
      tab,
      setTab,
      generateBanquetLayout,
      applyBanquetTables,
      addTable,
      drawingElements,
      setDrawingElements,
      hallSize,
    });
  }, [tab, setTab, generateBanquetLayout, applyBanquetTables, addTable, drawingElements, hallSize]);

  const {
    handleAddDrawingElement,
    handleDeleteDrawingElement,
    handleSelectDrawingElement,
    handleApplyTemplate,
    handleClearDrawingElements,
  } = drawingHandlers;

  // Obtener mesa seleccionada con datos completos
  const selectedTableData = useMemo(() => {
    if (!selectedTable) return null;

    const table = tables?.find((t) => t.id === selectedTable);
    if (!table) return null;

    // Obtener invitados asignados a esta mesa
    const assignedGuests =
      guests?.filter((g) => g.tableId === table.id || g.table === table.id) || [];

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
            themeToggle={<ThemeToggle isDark={isDark} onToggle={toggleTheme} />}
          />
        </SeatingLayoutFloating.Header>

        {/* Confetti Celebration */}
        <ConfettiCelebration show={showConfetti} onComplete={() => setShowConfetti(false)} />

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
            onOpenTemplates={() => setTemplateSelectorOpen(true)}
            onOpenLayoutGenerator={() => setLayoutGeneratorOpen(true)}
            onToggleDrawingTools={() =>
              setActiveTool(
                activeTool === DRAWING_TOOLS.SELECT ? DRAWING_TOOLS.PERIMETER : DRAWING_TOOLS.SELECT
              )
            }
            hasDrawingElements={drawingElements.length > 0}
            onClearDrawing={handleClearDrawingElements}
            onToggleMinimap={() => setShowMinimap(!showMinimap)}
            showMinimap={showMinimap}
            onGenerarTodoAutomatico={handleGenerarTodoAutomatico}
            isGeneratingAuto={isGeneratingAuto}
            onOpenAIChat={() => setAiChatOpen(true)}
            onOpenHeatmap={() => setHeatmapOpen(true)}
            pendingGuestsCount={pendingGuestsCount}
            onOpenListView={() => setListViewOpen(true)}
            onOpenAchievements={() => setAchievementsModalOpen(true)}
            achievementsProgress={achievements.progress}
          />

          {/* FASE 2: Drawing Tools (solo en banquet) */}
          {tab === 'banquet' && (
            <DrawingTools
              activeTool={activeTool}
              onToolSelect={setActiveTool}
              onAddElement={handleAddDrawingElement}
              onDeleteElement={handleDeleteDrawingElement}
              elements={drawingElements}
              canvasRef={canvasRef}
              scale={1}
              offset={{ x: 0, y: 0 }}
            />
          )}

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
            >
              {/* FASE 2: Drawing Elements (solo en banquet) */}
              {tab === 'banquet' && (
                <DrawingElements
                  elements={drawingElements}
                  scale={1}
                  onSelectElement={handleSelectDrawingElement}
                  selectedIds={drawingElements.filter((el) => el.selected).map((el) => el.id)}
                />
              )}

              {/* FASE 3: Snap Guides (alineación automática) */}
              <SnapGuides
                guides={snapGuides.guides}
                canvasWidth={hallSize?.width || 2000}
                canvasHeight={hallSize?.height || 1500}
              />
            </SeatingPlanCanvas>
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
          <QuickAddTableButton onAdd={handleAddTable} position="bottom-right" />

          {/*  BOTÓN GENERAR TODO AUTOMÁTICAMENTE (solo si no hay mesas) */}
          {tab === 'banquet' && tables?.length === 0 && guests?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5, type: 'spring' }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40"
            >
              <button
                onClick={handleGenerarTodoAutomatico}
                disabled={isGeneratingAuto}
                className="group relative bg-[var(--color-primary)] 
                         text-white font-bold px-8 py-6 rounded-2xl shadow-2xl
                         transform transition-all duration-300
                         hover:scale-105 hover:shadow-indigo-500/50
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex flex-col items-center gap-3"
              >
                <span className="text-4xl">✨</span>
                <span className="text-xl">Generar Plan Automáticamente</span>
                <span className="text-sm opacity-90">
                  {isGeneratingAuto
                    ? '🔮 Generando...'
                    : `📊 ${guests?.length || 0} invitados detectados`}
                </span>

                {/* Efecto de brillo animado */}
                <div
                  className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 
                              group-hover:opacity-100 transition-opacity duration-300"
                />
              </button>
            </motion.div>
          )}

          {/* 🆕 BOTÓN FLOTANTE: ASIGNAR INVITADOS (SIEMPRE VISIBLE PARA DEBUG) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed top-24 right-6 z-50"
          >
            <button
              onClick={handleGenerarTodoAutomatico}
              disabled={isGeneratingAuto}
              className="group bg-gradient-to-r from-green-500 to-emerald-600 
                       hover:from-green-600 hover:to-emerald-700
                       text-white font-semibold px-6 py-4 rounded-xl shadow-lg
                       transform transition-all duration-200
                       hover:scale-105 hover:shadow-xl
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-3"
              title={`Asignar automáticamente todos los invitados a las mesas (${navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+G)`}
            >
              <span className="text-2xl">🎯</span>
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold">
                  {isGeneratingAuto ? '⏳ Asignando...' : 'Asignar Invitados'}
                </span>
                <span className="text-xs opacity-90">
                  {stats.totalGuests > 0
                    ? `${stats.totalGuests - stats.assignedGuests} sin asignar`
                    : 'Cargando...'}
                </span>
              </div>
            </button>
          </motion.div>

          {/* FASE 3: Minimap (navegación rápida) */}
          {showMinimap && tab === 'banquet' && (
            <Minimap
              tables={tables || []}
              hallSize={hallSize}
              viewport={{ x: 0, y: 0, width: 800, height: 600 }}
              scale={1}
              position="bottom-left"
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
        <SeatingGuestDrawer
          open={guestDrawerOpen}
          guests={guests || []}
          selectedTableId={selectedTable?.id}
          onClose={() => setGuestDrawerOpen(false)}
          onAssignGuest={moveGuest}
        />

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

        {/* FASE 1: Layout Generator Modal */}
        <LayoutGeneratorModal
          isOpen={layoutGeneratorOpen}
          onClose={() => setLayoutGeneratorOpen(false)}
          onGenerate={(layoutType, config) => {
            // Generar y aplicar layout
            // console.log('[LayoutGenerator] Generating:', layoutType, config);
            const generatedTables = generateLayout(layoutType, config);
            if (generatedTables && generatedTables.length > 0) {
              generateBanquetLayout(generatedTables);
              toast.success(`✨ ${generatedTables.length} mesas generadas`);
            }
            setLayoutGeneratorOpen(false);
          }}
          currentConfig={{
            tableCount: tables?.length || 12,
            hallWidth: hallSize?.width || 1800,
            hallHeight: hallSize?.height || 1200,
          }}
        />

        {/* FASE 2: Template Selector Modal */}
        <TemplateSelector
          isOpen={templateSelectorOpen}
          onClose={() => setTemplateSelectorOpen(false)}
          onSelectTemplate={(template) => {
            handleApplyTemplate(template);
            // Track achievement: template used - DESACTIVADO temporalmente
            // achievements.trackEvent('template_used');
          }}
          guestCount={stats.totalGuests}
          guests={guests || []}
          hallSize={hallSize}
        />

        {/* FASE 3: Banquet Config Advanced Modal */}
        <BanquetConfigAdvanced
          isOpen={banquetConfigOpen}
          onClose={() => setBanquetConfigOpen(false)}
          config={banquetConfig}
          onSave={(newConfig) => {
            setBanquetConfig(newConfig);
            toast.success('⚙️ Configuración guardada');
          }}
        />

        {/* AI Assistant Chat */}
        <AIAssistantChat
          isOpen={aiChatOpen}
          onClose={() => setAiChatOpen(false)}
          guests={guests || []}
          tables={tables || []}
          onSuggestion={(suggestion) => {
            // console.log('[AI Suggestion]:', suggestion);
            toast.info('Sugerencia IA aplicada');
          }}
        />

        {/* Occupancy Heatmap Modal */}
        <OccupancyHeatmapModal
          isOpen={heatmapOpen}
          onClose={() => setHeatmapOpen(false)}
          tables={tables || []}
          guests={guests || []}
          onTableClick={(tableId) => {
            handleSelectTable(tableId, false);
          }}
        />

        {/* Table List Mobile Modal */}
        <TableListMobileModal
          isOpen={listViewOpen}
          onClose={() => setListViewOpen(false)}
          tables={tables || []}
          guests={guests || []}
          onTableClick={(tableId) => {
            handleSelectTable(tableId, false);
          }}
          onUnassignGuest={moveGuest}
          onDeleteTable={deleteTable}
          onDuplicateTable={duplicateTable}
        />

        {/* Achievements Modal */}
        <AchievementsModal
          isOpen={achievementsModalOpen}
          onClose={() => setAchievementsModalOpen(false)}
          achievementsData={{
            unlockedAchievements: achievements.unlockedAchievements,
            progress: achievements.progress,
            nextAchievement: achievements.nextAchievement,
          }}
        />

        {/* Achievement Unlocked Notification - DESACTIVADO temporalmente */}
        {/* {achievements.recentlyUnlocked && (
          <AchievementUnlocked
            achievement={achievements.recentlyUnlocked}
            onClose={() => {}}
          />
        )} */}
      </SeatingLayoutFloating>
    </DndProvider>
  );
}
