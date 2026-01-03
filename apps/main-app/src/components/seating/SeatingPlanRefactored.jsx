/**
 * SeatingPlan refactorizado - Componente principal
 * Versión refactorizada con utilidades y hooks separados
 */
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from 'react-toastify';

import SeatingGuestDrawer from './SeatingGuestDrawer';
import SeatingInspectorPanel from './SeatingInspectorPanel';
import SeatingLibraryPanel from './SeatingLibraryPanel';
import SeatingPlanCanvas from './SeatingPlanCanvas';
import SeatingPlanTabs from './SeatingPlanTabs';
import SeatingPlanToolbar from './SeatingPlanToolbar';
import SeatingPlanQuickActions from './SeatingPlanQuickActions';
import SeatingExportWizard from './SeatingExportWizard';
import SeatingMobileOverlay from './SeatingMobileOverlay';
import SeatingSmartPanel from './SeatingSmartPanel';
import SeatingGuestSidebar from './SeatingGuestSidebar';
import SeatingPlanModals from './SeatingPlanModals';
import SeatingPlanOnboardingChecklist from './SeatingPlanOnboardingChecklist';
import SeatingPlanSummary from './SeatingPlanSummary';
import AutoLayoutModal from './AutoLayoutModal';
import SeatingSearchBar from './SeatingSearchBar';
import TemplateGalleryModal from './TemplateGalleryModal';
import ExportWizardEnhanced from './ExportWizardEnhanced';
import SeatingInteractiveTour from './SeatingInteractiveTour';
import SeatingTooltips, { useTooltipState } from './SeatingTooltips';
import DragGhostPreview, { useDragGhost } from './DragGhostPreview';
import CollaborationCursors from './CollaborationCursors';

// ✅ NUEVOS COMPONENTES UX
import SeatingPropertiesSidebar from './SeatingPropertiesSidebar';
import ModeIndicator, { useModeCursor } from './ModeIndicator';
import ValidationCoach, {
  createSuggestionFromValidation,
  createImprovementSuggestions,
} from './ValidationCoach';
import TemplateGallery from './TemplateGallery';
import ContextualToolbar from './ContextualToolbar';
import * as AutoFixUtils from '../../utils/seatingAutoFix';

import { useWedding } from '../../context/WeddingContext';
import { useSeatingPlan } from '../../hooks/useSeatingPlan';
import { useSeatingUIState } from '../../hooks/useSeatingUIState';

import { post as apiPost } from '../../services/apiClient';
import { resolveAreaType, generateAreaSummary } from '../../utils/seatingAreas';
import {
  determineOnboardingStep,
  ONBOARDING_STEP_KEYS,
  ONBOARDING_STEP_ID_MAP,
  createDefaultOnboardingState,
} from '../../utils/seatingOnboarding';
import {
  ensureSafeArray,
  ensureSafeHallSize,
  isHallReady,
  getPendingGuests,
  createExportSnapshot,
  createTableLocksMap,
  getOtherCollaborators,
} from '../../utils/seatingLayout';

// Las constantes y funciones se movieron a:
// - utils/seatingAreas.js
// - utils/seatingOnboarding.js
// - utils/seatingLayout.js

const SeatingPlanRefactored = () => {
  const { activeWedding } = useWedding();
  const {
    tab,
    setTab,
    hallSize,
    areas,
    tables,
    seats,
    selectedTable,
    selectedIds,
    guests,
    ceremonyConfigOpen,
    setCeremonyConfigOpen,
    banquetConfigOpen,
    setBanquetConfigOpen,
    spaceConfigOpen,
    setSpaceConfigOpen,
    templateOpen,
    setTemplateOpen,
    canvasRef,
    handleSelectTable: baseHandleSelectTable,
    handleTableDimensionChange,
    toggleSelectedTableShape,
    setConfigTable,
    addArea,
    addTable,
    undo,
    redo,
    canUndo,
    canRedo,
    generateSeatGrid,
    generateBanquetLayout,
    exportPDF,
    exportPNG,
    exportCSV,
    exportSVG,
    exportPlaceCardsPDF,
    exportPosterA2,
    exportAdvancedReport,
    saveHallDimensions,
    drawMode,
    setDrawMode,
    moveTable,
    rotateSelected,
    alignSelected,
    distributeSelected,
    toggleSeatEnabled,
    moveGuest,
    moveGuestToSeat,
    assignGuestToCeremonySeat,
    deleteArea,
    updateArea,
    deleteTable,
    duplicateTable,
    toggleTableLocked,
    applyBanquetTables,
    clearBanquetLayout,
    resetSeatingPlan, // ✅ NUEVO: Reset completo
    autoAssignGuests,
    autoAssignGuestsRules,
    conflicts,
    fixTablePosition,
    suggestTablesForGuest,
    // preferencias de lienzo
    snapToGrid,
    setSnapToGrid,
    gridStep,
    validationsEnabled,
    setValidationsEnabled,
    globalMaxSeats,
    saveGlobalMaxGuests,
    background,
    setBackground,
    saveBackground,
    // snapshots
    listSnapshots,
    saveSnapshot,
    loadSnapshot,
    deleteSnapshot,
    ceremonySettings,
    scoringWeights,
    setScoringWeights,
    smartRecommendations,
    smartConflictSuggestions,
    smartInsights,
    executeSmartAction,
    collaborators,
    collaborationStatus,
    locks,
    lockEvent,
    consumeLockEvent,
    ensureTableLock,
    releaseTableLocksExcept,
    collabClientId,
    generateAutoLayoutFromGuests,
    analyzeCurrentGuests,
  } = useSeatingPlan();

  // Hook personalizado para manejar todo el estado de UI
  const {
    showTables,
    setShowTables,
    toggleShowTables,
    showRulers,
    setShowRulers,
    showSeatNumbers,
    setShowSeatNumbers,
    showAdvancedTools,
    setShowAdvancedTools,
    showLibraryPanel,
    setShowLibraryPanel,
    showInspectorPanel,
    setShowInspectorPanel,
    showSmartPanelPinned,
    setShowSmartPanelPinned,
    showOverview,
    setShowOverview,
    designFocusMode,
    setDesignFocusMode,
    backgroundOpen,
    setBackgroundOpen,
    capacityOpen,
    setCapacityOpen,
    guestDrawerOpen,
    setGuestDrawerOpen,
    exportWizardOpen,
    setExportWizardOpen,
    autoLayoutModalOpen,
    setAutoLayoutModalOpen,
    templateGalleryOpen,
    setTemplateGalleryOpen,
    exportWizardEnhancedOpen,
    setExportWizardEnhancedOpen,
    showTour,
    setShowTour,
    viewport,
    setViewport,
    focusTableId,
    setFocusTableId,
    guestSidebarOpen,
    setGuestSidebarOpen,
    isMobile,
    ceremonyActiveRow,
    setCeremonyActiveRow,
    guidedGuestId,
    setGuidedGuestId,
    onboardingPrefs,
    setOnboardingPrefs,
    gridColumns,
  } = useSeatingUIState(activeWedding);

  // Valores seguros para evitar crashes por undefined
  const safeAreas = ensureSafeArray(areas);
  const safeTables = ensureSafeArray(tables);
  const safeSeats = ensureSafeArray(seats);
  const safeGuests = ensureSafeArray(guests);
  const safeHallSize = ensureSafeHallSize(hallSize);

  // Valores computados
  const smartPanelEligible = tab === 'banquet';
  const showSmartPanel = smartPanelEligible && showSmartPanelPinned;

  // Snapshot de exportación usando utilidad
  const exportPreviewSnapshot = useMemo(
    () => createExportSnapshot({ tab, hallSize, tables, seats, guests, areas }),
    [tab, hallSize, tables, seats, guests, areas]
  );

  // Estado del hall
  const hallReady = isHallReady(safeHallSize);

  // Tooltips
  const [tooltipState, updateTooltipState] = useTooltipState();

  // Drag Ghost Preview
  const { dragState, startDrag, updateDrag, endDrag } = useDragGhost();

  // ✅ NUEVOS ESTADOS UX
  const [showTemplateGalleryNew, setShowTemplateGalleryNew] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showModeIndicator, setShowModeIndicator] = useState(true);

  // Cursor dinámico según modo
  const modeCursor = useModeCursor(drawMode);

  // Actualizar estado de tooltips
  useEffect(() => {
    updateTooltipState({
      hasSpaceConfigured: !!safeHallSize?.width,
      tables: safeTables,
      assignedGuests: safeGuests.filter((g) => g.tableId || g.table).length,
      hasDraggedTable: safeTables.length > 0,
    });
  }, [safeHallSize, safeTables, safeGuests, updateTooltipState]);

  // ✅ NUEVO: Generar sugerencias desde validaciones
  useEffect(() => {
    if (!validationsEnabled || tab !== 'banquet') {
      setSuggestions([]);
      return;
    }

    const newSuggestions = [];
    const processedPairs = new Set();

    // Por cada mesa, verificar validaciones
    safeTables.forEach((table) => {
      // Verificar distancia con otras mesas
      safeTables.forEach((other) => {
        if (table.id === other.id) return;

        // Evitar duplicados (par ya procesado)
        const pairKey = [table.id, other.id].sort().join('-');
        if (processedPairs.has(pairKey)) return;
        processedPairs.add(pairKey);

        const dx = table.x - other.x;
        const dy = table.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 140cm = 120cm diámetro promedio + 20cm margen mínimo
        const minDistance = 140;

        if (distance < minDistance && distance > 0) {
          newSuggestions.push({
            id: `spacing-${pairKey}`,
            severity: 'suggestion',
            title: '💡 Espacio entre mesas',
            message: `Las mesas están un poco juntas (${Math.round(distance)}cm).`,
            details: 'Considera separarlas a 100cm para mejor circulación.',
            canAutoFix: true,
            autoFixLabel: 'Separar automáticamente',
            autoFixAction: {
              type: 'adjust-spacing',
              tables: [String(table.id), String(other.id)],
              targetSpacing: 220, // 220cm entre centros = 100cm libres
            },
          });
        }
      });
    });

    // Sugerencias de mejora
    if (safeTables.length > 0 && safeGuests.length > 0) {
      try {
        const improvements = createImprovementSuggestions(safeTables, safeGuests, safeHallSize);
        if (Array.isArray(improvements)) {
          newSuggestions.push(...improvements);
        }
      } catch (error) {
        console.error('Error generando sugerencias de mejora:', error);
      }
    }

    // Máximo 3 sugerencias visibles a la vez
    setSuggestions(newSuggestions.slice(0, 3));
  }, [safeTables, validationsEnabled, tab, safeGuests, safeHallSize]);

  // Colaboradores y locks
  const otherCollaborators = useMemo(() => getOtherCollaborators(collaborators), [collaborators]);

  const tableLocks = useMemo(() => createTableLocksMap(locks), [locks]);

  // Invitados pendientes
  const pendingGuests = useMemo(() => getPendingGuests(safeGuests), [safeGuests]);

  const handleSelectTable = React.useCallback(
    (id, multi = false) => {
      const run = async () => {
        if (id == null) {
          releaseTableLocksExcept([]);
          await Promise.resolve(baseHandleSelectTable(null, multi));
          return;
        }
        const ok = await ensureTableLock(id);
        if (!ok) return;
        const nextIds = multi ? Array.from(new Set([...(selectedIds || []), id])) : [id];
        releaseTableLocksExcept(nextIds);
        await Promise.resolve(baseHandleSelectTable(id, multi));
      };
      run().catch((error) => {
        // console.warn('[SeatingPlan] handleSelectTable error:', error);
      });
    },
    [baseHandleSelectTable, ensureTableLock, releaseTableLocksExcept, selectedIds]
  );

  // Resumen de áreas usando utilidad
  const areaSummary = useMemo(() => generateAreaSummary(safeAreas), [safeAreas]);

  const seatingProgress = React.useMemo(() => {
    const tableIds = new Set(
      safeTables
        .map((table) => {
          if (table?.id == null) return null;
          return String(table.id);
        })
        .filter(Boolean)
    );
    const tableNames = new Set(
      safeTables
        .map((table) => {
          if (typeof table?.name !== 'string') return null;
          const trimmed = table.name.trim();
          return trimmed === '' ? null : trimmed;
        })
        .filter(Boolean)
    );

    let totalPersons = 0;
    let assignedPersons = 0;

    safeGuests.forEach((guest) => {
      const companionRaw = Number.parseInt(guest?.companion, 10);
      const companionCount = Number.isFinite(companionRaw) && companionRaw > 0 ? companionRaw : 0;
      const persons = 1 + companionCount;
      totalPersons += persons;

      const tableId = guest?.tableId != null ? String(guest.tableId) : null;
      const tableName =
        typeof guest?.table === 'string' && guest.table.trim() !== '' ? guest.table.trim() : null;
      const isAssigned =
        (tableId && tableIds.has(tableId)) ||
        (tableName && (tableIds.has(tableName) || tableNames.has(tableName)));
      if (isAssigned) {
        assignedPersons += persons;
      }
    });

    const enabledSeats = safeSeats.filter((seat) => seat?.enabled !== false).length;
    const ceremonyProgress =
      totalPersons > 0 ? Math.min(100, Math.round((enabledSeats / totalPersons) * 100)) : 0;
    const banquetProgress =
      totalPersons > 0 ? Math.min(100, Math.round((assignedPersons / totalPersons) * 100)) : 0;

    return {
      totalPersons,
      assignedPersons,
      enabledSeats,
      ceremonyProgress,
      banquetProgress,
    };
  }, [safeGuests, safeSeats, safeTables]);

  const hasConfiguredSpace = React.useMemo(() => {
    const widthConfigured =
      Number.isFinite(safeHallSize?.width) &&
      Number.isFinite(safeHallSize?.height) &&
      (Math.round(safeHallSize.width) !== 1800 || Math.round(safeHallSize.height) !== 1200);
    const hasAreas = safeAreas.length > 0;
    const hasBackgroundConfigured =
      !!background &&
      (typeof background === 'string'
        ? background.trim() !== ''
        : typeof background === 'object' && Object.keys(background).length > 0);
    const hasTablesAvailable = safeTables.length > 0;
    return widthConfigured || hasAreas || hasBackgroundConfigured || hasTablesAvailable;
  }, [safeHallSize, safeAreas, safeTables, background]);

  const hasGuestsImported = safeGuests.length > 0;
  const hasAssignedGuests = seatingProgress.assignedPersons > 0;

  useEffect(() => {
    setOnboardingPrefs((prev) => {
      if (!prev || typeof prev !== 'object') return createDefaultOnboardingState();
      let changed = false;
      const nextSteps = { ...prev.steps };
      if (hasConfiguredSpace && !nextSteps.spaceConfigured) {
        nextSteps.spaceConfigured = true;
        changed = true;
      }
      if (hasGuestsImported && !nextSteps.guestsImported) {
        nextSteps.guestsImported = true;
        changed = true;
      }
      if (hasAssignedGuests && !nextSteps.firstAssignment) {
        nextSteps.firstAssignment = true;
        changed = true;
      }
      const actualCompleted = hasConfiguredSpace && hasGuestsImported && hasAssignedGuests;
      const nextDismissed = actualCompleted ? true : prev.dismissed;
      if (!changed && nextDismissed === prev.dismissed) {
        return prev;
      }
      return {
        ...prev,
        steps: nextSteps,
        dismissed: nextDismissed,
      };
    });
  }, [hasConfiguredSpace, hasGuestsImported, hasAssignedGuests]);

  const onboardingActiveStep = React.useMemo(
    () => (onboardingPrefs.dismissed ? null : determineOnboardingStep(onboardingPrefs.steps)),
    [onboardingPrefs.dismissed, onboardingPrefs.steps]
  );

  const onboardingCompletedCount = React.useMemo(
    () =>
      ONBOARDING_STEP_KEYS.reduce((acc, key) => (onboardingPrefs.steps?.[key] ? acc + 1 : acc), 0),
    [onboardingPrefs.steps]
  );

  const onboardingProgress = React.useMemo(() => {
    const total = ONBOARDING_STEP_KEYS.length;
    return {
      completed: onboardingCompletedCount,
      total,
      percent: total > 0 ? Math.min(100, Math.round((onboardingCompletedCount / total) * 100)) : 0,
    };
  }, [onboardingCompletedCount]);

  const showOnboardingChecklist =
    !onboardingPrefs.dismissed && onboardingActiveStep !== null && onboardingProgress.total > 0;

  const handleDismissOnboarding = React.useCallback(() => {
    setOnboardingPrefs((prev) => (prev.dismissed ? prev : { ...prev, dismissed: true }));
  }, []);

  const handleCompleteOnboardingStep = React.useCallback((stepKey) => {
    if (!ONBOARDING_STEP_KEYS.includes(stepKey)) return;
    setOnboardingPrefs((prev) => {
      if (prev.steps?.[stepKey]) return prev;
      const nextSteps = { ...prev.steps, [stepKey]: true };
      return { ...prev, steps: nextSteps };
    });
  }, []);

  const handleCompleteOnboardingStepById = React.useCallback(
    (stepId) => {
      const stepKey = ONBOARDING_STEP_ID_MAP[stepId];
      if (stepKey) {
        handleCompleteOnboardingStep(stepKey);
      }
    },
    [handleCompleteOnboardingStep]
  );

  const handleToggleLibraryPanel = React.useCallback(
    () => setShowLibraryPanel((prev) => !prev),
    []
  );

  const handleToggleInspectorPanel = React.useCallback(
    () => setShowInspectorPanel((prev) => !prev),
    []
  );

  const handleToggleSmartPanel = React.useCallback(
    () => setShowSmartPanelPinned((prev) => !prev),
    []
  );

  const handleToggleGuestPanel = React.useCallback(() => setGuestSidebarOpen((prev) => !prev), []);

  const handleToggleDesignFocus = React.useCallback(() => setDesignFocusMode((prev) => !prev), []);

  const handleResetOnboarding = React.useCallback(() => {
    setOnboardingPrefs((prev) => {
      if (!prev.dismissed) return prev;
      return {
        ...prev,
        dismissed: false,
      };
    });
  }, []);

  useEffect(() => {
    if (!lockEvent) return;
    if (lockEvent.kind === 'lock-denied' && lockEvent.resourceType === 'table') {
      toast.warn(`Esta mesa est� en edici�n por ${lockEvent.ownerName || 'otro colaborador'}`);
    }
    consumeLockEvent();
  }, [lockEvent, consumeLockEvent]);

  useEffect(() => {
    if (tab !== 'banquet') {
      releaseTableLocksExcept([]);
    }
  }, [tab, releaseTableLocksExcept]);

  // Invitados asignados a la mesa seleccionada
  const assignedToSelected = React.useMemo(() => {
    try {
      if (!selectedTable) return [];
      return safeGuests.filter((g) => g?.tableId === selectedTable?.id);
    } catch (_) {
      return [];
    }
  }, [safeGuests, selectedTable]);

  const availableExportTabs = React.useMemo(() => ['ceremony', 'banquet', 'free-draw'], []);

  const ceremonyRows = React.useMemo(() => {
    if (!Array.isArray(safeSeats) || safeSeats.length === 0) return [];
    const vipRowSet = new Set(
      Array.isArray(ceremonySettings?.vipRows)
        ? ceremonySettings.vipRows
            .map((value) => Number.parseInt(value, 10))
            .filter((value) => Number.isFinite(value) && value >= 0)
        : []
    );
    const vipLabel = ceremonySettings?.vipLabel || 'VIP';
    const rowMap = new Map();
    safeSeats.forEach((seat) => {
      const key =
        seat?.rowIndex != null
          ? `row-${seat.rowIndex}`
          : `y-${Math.round(typeof seat?.y === 'number' ? seat.y : 0)}`;
      if (!rowMap.has(key)) {
        rowMap.set(key, {
          key,
          rowIndex: typeof seat?.rowIndex === 'number' ? seat.rowIndex : null,
          yReference: typeof seat?.y === 'number' ? seat.y : 0,
          seats: [],
        });
      }
      rowMap.get(key).seats.push(seat);
    });
    const sorted = Array.from(rowMap.values()).sort((a, b) => a.yReference - b.yReference);
    return sorted.map((bucket, index) => {
      const seats = bucket.seats;
      const enabledSeats = seats.filter((s) => s?.enabled !== false);
      const assignedSeats = seats.filter((s) => !!s?.guestId);
      const referenceIndex = bucket.rowIndex != null ? bucket.rowIndex : index;
      const isVip = vipRowSet.has(referenceIndex);
      return {
        key: bucket.key,
        index,
        referenceIndex,
        label: `Fila ${index + 1}`,
        seats,
        enabledCount: enabledSeats.length,
        assignedCount: assignedSeats.length,
        disabledCount: seats.length - enabledSeats.length,
        availableCount: Math.max(0, enabledSeats.length - assignedSeats.length),
        isVip,
        reservedLabel: isVip ? vipLabel : null,
      };
    });
  }, [safeSeats, ceremonySettings?.vipRows, ceremonySettings?.vipLabel]);

  React.useEffect(() => {
    if (!Array.isArray(ceremonyRows) || ceremonyRows.length === 0) {
      setCeremonyActiveRow(0);
      return;
    }
    setCeremonyActiveRow((prev) => {
      if (prev >= 0 && prev < ceremonyRows.length) return prev;
      const vipCandidates = Array.isArray(ceremonySettings?.vipRows)
        ? ceremonySettings.vipRows
            .map((value) => Number.parseInt(value, 10))
            .filter((value) => Number.isFinite(value) && value >= 0 && value < ceremonyRows.length)
        : [];
      if (vipCandidates.length > 0) {
        return vipCandidates[0];
      }
      return 0;
    });
  }, [ceremonyRows, ceremonySettings?.vipRows]);

  const ceremonyAssignedGuestIds = React.useMemo(() => {
    const ids = new Set();
    safeSeats.forEach((seat) => {
      if (seat?.guestId) ids.add(String(seat.guestId));
    });
    return ids;
  }, [safeSeats]);

  const ceremonySuggestions = React.useMemo(() => {
    const suggestions = {
      padrinos: [],
      familiares: [],
      otros: [],
    };
    if (!Array.isArray(safeGuests) || safeGuests.length === 0) return suggestions;
    const toText = (value) => (value == null ? '' : String(value).toLowerCase());
    const matchesAny = (guest, patterns) => {
      const tags = Array.isArray(guest?.tags) ? guest.tags.map(toText) : [];
      const group = toText(guest?.group || guest?.groupName);
      const notes = toText(guest?.notes);
      return patterns.some(
        (pattern) =>
          tags.includes(pattern) || group.includes(pattern) || (notes && notes.includes(pattern))
      );
    };
    const vipPatterns = [
      'padrino',
      'padrinos',
      'madrina',
      'madrinas',
      'best man',
      'bestman',
      'maid of honor',
      'oficiante',
    ];
    const familyPatterns = [
      'familia',
      'familiares',
      'family',
      'padre',
      'madre',
      'hermano',
      'hermana',
      'abuelo',
      'abuela',
      'primo',
      'prima',
      't�o',
      't�a',
      'tio',
      'tia',
    ];
    safeGuests.forEach((guest) => {
      if (!guest?.id) return;
      if (ceremonyAssignedGuestIds.has(String(guest.id))) return;
      const bag = matchesAny(guest, vipPatterns)
        ? suggestions.padrinos
        : matchesAny(guest, familyPatterns)
          ? suggestions.familiares
          : suggestions.otros;
      if (bag.length < 8) {
        bag.push(guest);
      }
    });
    return suggestions;
  }, [safeGuests, ceremonyAssignedGuestIds]);

  const handleGenerateAdvancedExport = React.useCallback(
    async (payload) => {
      if (!payload || !Array.isArray(payload.formats)) return;
      try {
        const result = await exportAdvancedReport?.(payload);
        if (result?.exportId) {
          toast.success('Exportaci�n guardada y lista para descargar.');
        } else {
          toast.success('Exportaci�n generada correctamente.');
        }
      } catch (error) {
        // console.error('Error generando exportaci�n avanzada', error);
        toast.error('No se pudo generar la exportaci�n avanzada.');
      }
    },
    [exportAdvancedReport]
  );

  /* ---- atajos Ctrl/Cmd + Z / Y ---- */
  useEffect(() => {
    const h = (e) => {
      try {
        const platform =
          typeof navigator !== 'undefined' && typeof navigator.platform === 'string'
            ? navigator.platform
            : '';
        const meta = platform.includes('Mac') ? !!e?.metaKey : !!e?.ctrlKey;
        if (!meta) return;
        const k = typeof e?.key === 'string' ? e.key.toLowerCase() : '';
        if (k === 'z') {
          e.preventDefault();
          undo();
        }
        if (k === 'y') {
          e.preventDefault();
          redo();
        }
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
        const tag = e?.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
        if (['input', 'textarea', 'select'].includes(tag) || e?.isComposing) return;
        const key = typeof e?.key === 'string' ? e.key : '';
        switch (key) {
          case '1':
            setDrawMode('pan');
            break;
          case '2':
            setDrawMode('move');
            break;
          case '3':
            setDrawMode('boundary');
            break;
          case '4':
            setDrawMode('door');
            break;
          case '5':
            setDrawMode('obstacle');
            break;
          case '6':
            setDrawMode('aisle');
            break;
          default:
            break;
        }
      } catch (_) {}
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setDrawMode]);

  // Handlers usados por atajos globales (definir antes del efecto)
  const handleOpenSpaceConfig = React.useCallback(
    () => setSpaceConfigOpen(true),
    [setSpaceConfigOpen]
  );
  // Abrir Template Gallery mejorado
  const handleOpenTemplates = React.useCallback(() => {
    setTemplateGalleryOpen(true);
  }, []);

  // Handler para aplicar plantilla desde la galería
  const handleSelectTemplate = React.useCallback(
    (template) => {
      try {
        // Aplicar la plantilla según su configuración
        if (tab === 'banquet' && template.layout) {
          // TODO: Re-enable auto layout generation after fixing initialization order
          // handleGenerateAutoLayout(template.layout);
          // console.log('Template selected:', template);
          toast.success(`Plantilla "${template.name}" seleccionada`);
        }
      } catch (error) {
        // console.error('Error applying template:', error);
        toast.error('Error al aplicar plantilla');
      }
    },
    [tab]
  );

  // Atajos extra: rotaci�n, alinear/distribuir, tabs, toggles y paneles
  useEffect(() => {
    const onKey = (e) => {
      try {
        const tag = e?.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
        if (['input', 'textarea', 'select'].includes(tag) || e?.isComposing) return;
        const key = String(e?.key || '').toLowerCase();
        const meta = !!(e?.metaKey || e?.ctrlKey);
        const alt = !!e?.altKey;
        const shift = !!e?.shiftKey;

        // Rotaci�n: Q/E (Shift = �15�, normal = �5�)
        if (!meta && !alt && (key === 'q' || key === 'e')) {
          e.preventDefault();
          const delta = shift ? 15 : 5;
          rotateSelected(key === 'q' ? -delta : delta);
          return;
        }

        // Alinear/Distribuir: Alt+Arrow (align), Shift+Alt+Arrow (distribute)
        if (
          alt &&
          ['arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(e.key.toLowerCase())
        ) {
          e.preventDefault();
          const axis = ['arrowleft', 'arrowright'].includes(key) ? 'x' : 'y';
          if (shift) {
            distributeSelected(axis);
          } else {
            const mode = key === 'arrowleft' || key === 'arrowup' ? 'start' : 'end';
            alignSelected(axis, mode);
          }
          return;
        }

        // Tabs: Ctrl/Cmd + Left/Right
        if (meta && (key === 'arrowleft' || key === 'arrowright')) {
          e.preventDefault();
          const next = key === 'arrowleft' ? 'ceremony' : 'banquet';
          setTab(next);
          return;
        }

        // Toggles: R (reglas), N (n�meros), V (validaciones)
        if (!meta && !alt && key === 'r') {
          e.preventDefault();
          setShowRulers((v) => !v);
          return;
        }
        if (!meta && !alt && key === 'n') {
          e.preventDefault();
          setShowSeatNumbers((v) => !v);
          return;
        }
        if (!meta && !alt && key === 'v') {
          e.preventDefault();
          setValidationsEnabled?.((v) => !v);
          return;
        }

        // Paneles: P (plantillas), S (espacio)
        if (!meta && !alt && key === 'p') {
          e.preventDefault();
          handleOpenTemplates();
          return;
        }
        if (!meta && !alt && key === 's') {
          e.preventDefault();
          handleOpenSpaceConfig();
          return;
        }
      } catch (_) {}
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    rotateSelected,
    alignSelected,
    distributeSelected,
    setTab,
    setShowRulers,
    setShowSeatNumbers,
    setValidationsEnabled,
    handleOpenTemplates,
    handleOpenSpaceConfig,
  ]);

  // Backspace: eliminar mesa seleccionada (con confirmaci�n)
  useEffect(() => {
    const onKey = (e) => {
      try {
        const tag = e?.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
        if (['input', 'textarea', 'select'].includes(tag) || e?.isComposing) return;
        if (e?.key === 'Backspace' && selectedTable) {
          e.preventDefault();
          if (window.confirm('�Eliminar la mesa seleccionada?')) {
            deleteTable(selectedTable.id);
          }
        }
      } catch (_) {}
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedTable, deleteTable]);

  // Atajos de rotaci�n: Q/E para -5°/+5°
  useEffect(() => {
    const onKey = (e) => {
      try {
        const tag = e?.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
        if (['input', 'textarea', 'select'].includes(tag) || e?.isComposing) return;
        const k = String(e?.key || '').toLowerCase();
        if (k === 'q') {
          e.preventDefault();
          rotateSelected(-5);
        }
        if (k === 'e') {
          e.preventDefault();
          rotateSelected(5);
        }
      } catch (_) {}
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rotateSelected]);

  /* ---- handlers ---- */
  const handleOpenCeremonyConfig = React.useCallback(
    () => setCeremonyConfigOpen(true),
    [setCeremonyConfigOpen]
  );
  const handleCloseCeremonyConfig = React.useCallback(
    () => setCeremonyConfigOpen(false),
    [setCeremonyConfigOpen]
  );
  const handleOpenBanquetConfig = React.useCallback(
    () => setBanquetConfigOpen(true),
    [setBanquetConfigOpen]
  );
  const handleCloseBanquetConfig = React.useCallback(
    () => setBanquetConfigOpen(false),
    [setBanquetConfigOpen]
  );
  const handleCloseSpaceConfig = React.useCallback(
    () => setSpaceConfigOpen(false),
    [setSpaceConfigOpen]
  );
  const handleCloseTemplates = React.useCallback(() => setTemplateOpen(false), [setTemplateOpen]);

  // ✅ NUEVOS HANDLERS UX
  const handleAutoFix = React.useCallback(
    (suggestion) => {
      const { autoFixAction } = suggestion;
      if (!autoFixAction) return;

      try {
        switch (autoFixAction.type) {
          case 'adjust-spacing':
            AutoFixUtils.adjustTableSpacing(
              safeTables,
              autoFixAction.tables,
              autoFixAction.targetSpacing || 100,
              moveTable
            );
            toast.success('Espaciado ajustado correctamente');
            break;

          case 'move-inside-boundary':
            const tableToMove = safeTables.find((t) => t.id === autoFixAction.tableId);
            if (tableToMove) {
              AutoFixUtils.moveTableInsideBoundary(tableToMove, safeAreas, safeHallSize, moveTable);
              toast.success('Mesa movida dentro del perímetro');
            }
            break;

          case 'find-free-spot':
            const tableToRelocate = safeTables.find((t) => t.id === autoFixAction.tableId);
            if (tableToRelocate) {
              const found = AutoFixUtils.findAndMoveToFreeSpot(
                tableToRelocate,
                safeTables,
                safeAreas,
                safeHallSize,
                moveTable
              );
              if (found) {
                toast.success('Posición libre encontrada');
              } else {
                toast.warning('No se encontró posición libre');
              }
            }
            break;

          case 'optimize-layout':
            AutoFixUtils.optimizeLayout(safeTables, safeGuests, safeHallSize, applyBanquetTables);
            toast.success('Layout optimizado');
            break;

          default:
            console.warn('Auto-fix no implementado:', autoFixAction.type);
        }
      } catch (error) {
        console.error('Error en auto-fix:', error);
        toast.error('Error al aplicar la corrección');
      }
    },
    [safeTables, safeAreas, safeHallSize, safeGuests, moveTable, applyBanquetTables]
  );

  const handleUpdateTableFromSidebar = React.useCallback(
    (tableId, updates) => {
      const table = safeTables.find((t) => t.id === tableId);
      if (!table) return;

      // Actualizar posición si cambió
      if (updates.x !== undefined || updates.y !== undefined) {
        moveTable(tableId, {
          x: updates.x ?? table.x,
          y: updates.y ?? table.y,
        });
      }

      // Otros updates se pueden manejar aquí
      // Por ahora, moveTable es suficiente para la mayoría
    },
    [safeTables, moveTable]
  );

  const handleSelectTemplateNew = React.useCallback(
    async (template) => {
      setShowTemplateGalleryNew(false);

      try {
        // Generar layout según plantilla
        if (typeof generateAutoLayoutFromGuests === 'function') {
          const result = await generateAutoLayoutFromGuests(template.layout);
          if (result?.success) {
            toast.success(`Layout "${template.name}" aplicado`);
          }
        }
      } catch (error) {
        console.error('Error aplicando plantilla:', error);
        toast.error('Error al aplicar la plantilla');
      }
    },
    [generateAutoLayoutFromGuests]
  );

  const handleConfigureTable = React.useCallback(
    (t) => {
      setConfigTable(t);
      tab === 'ceremony' ? handleOpenCeremonyConfig() : handleOpenBanquetConfig();
    },
    [setConfigTable, tab, handleOpenCeremonyConfig, handleOpenBanquetConfig]
  );

  // Asignar invitado a mesa (drag & drop / sidebar)
  const handleAssignGuest = React.useCallback(
    (tableId, guestId) => {
      if (guestId) {
        // Capacidad: contar asientos ocupados (invitado + acompa�antes)
        try {
          const table = safeTables.find((t) => String(t.id) === String(tableId));
          const seatsCap = parseInt(table?.seats, 10) || 0;
          if (seatsCap > 0) {
            const assigned = safeGuests.filter((g) => {
              const byId = g?.tableId != null && String(g.tableId) === String(tableId);
              const byName = g?.table != null && String(g.table).trim() === String(tableId);
              return byId || byName;
            });
            const occupied = assigned.reduce(
              (sum, g) => sum + 1 + (parseInt(g?.companion, 10) || 0),
              0
            );
            const selGuest = safeGuests.find((g) => String(g?.id) === String(guestId));
            const needed = 1 + (parseInt(selGuest?.companion, 10) || 0);
            if (occupied >= seatsCap || occupied + needed > seatsCap) {
              const remaining = Math.max(0, seatsCap - occupied);
              const msg =
                remaining === 0
                  ? 'Capacidad completa: no hay asientos disponibles en esta mesa'
                  : `Capacidad insuficiente: necesitas ${needed} asiento(s) y quedan ${remaining}`;
              // M�trica: asignaci�n bloqueada por capacidad (best-effort, no bloqueante)
              try {
                apiPost(
                  '/api/metrics/seating',
                  { event: 'assign', result: 'blocked', tab, weddingId: activeWedding },
                  { auth: true }
                ).catch(() => {});
              } catch {}
              toast.error(msg);
              return;
            }
          }
          moveGuest(guestId, tableId);
          // M�trica: asignaci�n exitosa (best-effort, no bloqueante)
          try {
            apiPost(
              '/api/metrics/seating',
              { event: 'assign', result: 'success', tab, weddingId: activeWedding },
              { auth: true }
            ).catch(() => {});
          } catch {}
          toast.success('Invitado asignado a la mesa');
          return;
        } catch (e) {
          // console.warn('Capacity check error', e);
          // fallback: intentar asignar igualmente
          moveGuest(guestId, tableId);
          try {
            apiPost(
              '/api/metrics/seating',
              { event: 'assign', result: 'success', tab, weddingId: activeWedding },
              { auth: true }
            ).catch(() => {});
          } catch {}
          toast.success('Invitado asignado a la mesa');
          return;
        }
      }
      // Unassign: quitar todos los invitados asociados a esta mesa
      try {
        const table = safeTables.find((t) => String(t.id) === String(tableId));
        const tableName = table?.name;
        const toClear = safeGuests.filter((g) => {
          const byId = g?.tableId != null && String(g.tableId) === String(tableId);
          const byName =
            g?.table != null &&
            (String(g.table).trim() === String(tableId) ||
              (tableName && String(g.table).trim() === String(tableName)));
          return byId || byName;
        });
        toClear.forEach((g) => moveGuest(g.id, null));
        toast.info(`${toClear.length} invitado(s) desasignado(s)`);
      } catch (e) {
        // console.warn('Unassign error', e);
        toast.error('Error al desasignar invitados');
      }
    },
    [safeTables, safeGuests, moveGuest, tab]
  );

  const focusTable = React.useCallback(
    (tableId) => {
      if (!tableId) return;
      if (tab !== 'banquet') {
        setTab('banquet');
      }
      setFocusTableId(tableId);
      handleSelectTable(tableId, false);
    },
    [tab, setTab, setFocusTableId, handleSelectTable]
  );

  const handleSmartAssign = React.useCallback(
    (guestId, tableId) => {
      if (!guestId || !tableId) return;
      focusTable(tableId);
      handleAssignGuest(tableId, guestId);
    },
    [focusTable, handleAssignGuest]
  );

  const handleSmartAction = React.useCallback(
    (action) => {
      if (!action) return;
      if (action.type === 'focus-table') {
        focusTable(action.tableId);
        return;
      }
      const result = executeSmartAction?.(action);
      if (result?.ok) {
        if (action.type === 'reassign') {
          toast.success(`Invitado reubicado${action.guestName ? `: ${action.guestName}` : ''}`);
          if (action.toTableId) {
            focusTable(action.toTableId);
          }
        } else if (action.type === 'fix-position') {
          toast.info('Mesa ajustada dentro del plano');
          if (action.tableId) focusTable(action.tableId);
        }
      } else {
        toast.error('No se pudo aplicar la acci�n sugerida');
      }
    },
    [executeSmartAction, focusTable]
  );

  // Desasignar un invitado concreto
  const handleUnassignGuest = React.useCallback(
    (guestId) => {
      try {
        if (!guestId) return;
        moveGuest(guestId, null);
        toast.info('Invitado desasignado');
      } catch (e) {
        // console.warn('Unassign single guest error', e);
        toast.error('No se pudo desasignar el invitado');
      }
    },
    [moveGuest]
  );

  // Aplicaci�n de plantillas (evita fallo si se usa el modal de plantillas)
  const handleApplyTemplate = React.useCallback(
    (template) => {
      if (template?.ceremony) {
        const ceremonyConfig = {
          rows: template.ceremony.rows,
          cols: template.ceremony.cols,
          gap: template.ceremony.gap || 40,
          startX: 100,
          startY: 80,
          aisleAfter:
            template.ceremony.aisleAfter != null
              ? template.ceremony.aisleAfter
              : Math.floor((template.ceremony.cols || 0) / 2),
          vipRows: template.ceremony.vipRows || [],
          vipLabel: template.ceremony.vipLabel || 'VIP',
          lockVipSeats: !!template.ceremony.lockVipSeats,
          notes: Array.isArray(template?.overlays?.notes)
            ? template.overlays.notes.join(' � ')
            : template.ceremony.notes || '',
        };
        generateSeatGrid(ceremonyConfig);
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
          startY: 160,
        });
      }

      // Asignaci�n autom�tica forzada tras aplicar plantilla
      setTimeout(async () => {
        try {
          const res = await (typeof autoAssignGuestsRules === 'function'
            ? autoAssignGuestsRules()
            : autoAssignGuests());
          if (res?.ok) {
            const msg =
              res.method === 'backend'
                ? `Asignaci�n autom�tica (IA): ${res.assigned} invitado(s)`
                : `Asignaci�n autom�tica: ${res.assigned} invitado(s)`;
            toast.info(msg);
          } else if (res?.error) {
            toast.warn(`Autoasignaci�n: ${res.error}`);
          }
        } catch (e) {
          // Silencioso para no molestar al usuario; solo log
          // console.warn('Auto-assign error', e);
        }
      }, 50);
    },
    [generateSeatGrid, applyBanquetTables, generateBanquetLayout, autoAssignGuests]
  );

  const handleAutoAssignClick = React.useCallback(async () => {
    try {
      const res = await (typeof autoAssignGuestsRules === 'function'
        ? autoAssignGuestsRules()
        : autoAssignGuests());
      if (res?.ok) {
        const msg =
          res.method === 'backend'
            ? `Asignaci�n autom�tica (IA): ${res.assigned} invitado(s)`
            : `Asignaci�n autom�tica: ${res.assigned} invitado(s)`;
        toast.info(msg);
      } else if (res?.error) {
        toast.warn(`Auto-asignaci�n: ${res.error}`);
      }
    } catch (e) {
      toast.error('Error en auto-asignaci�n');
    }
  }, [autoAssignGuestsRules, autoAssignGuests]);

  // Generaci�n desde modal de banquete seguida de autoasignaci�n forzada (silencioso a nivel de UI)
  const handleGenerateBanquetLayoutWithAssign = React.useCallback(
    (config) => {
      try {
        generateBanquetLayout(config);
      } finally {
        setTimeout(async () => {
          try {
            const res = await (typeof autoAssignGuestsRules === 'function'
              ? autoAssignGuestsRules()
              : autoAssignGuests());
            if (res?.ok) {
              const msg =
                res.method === 'backend'
                  ? `Asignaci�n autom�tica (IA): ${res.assigned} invitado(s)`
                  : `Asignaci�n autom�tica: ${res.assigned} invitado(s)`;
              toast.info(msg);
            } else if (res?.error) {
              toast.warn(`Autoasignaci�n: ${res.error}`);
            }
          } catch (e) {
            // console.warn('Auto-assign error', e);
          }
        }, 50);
      }
    },
    [generateBanquetLayout, autoAssignGuestsRules, autoAssignGuests]
  );

  // Generaci�n desde modal de ceremonia seguida de autoasignaci�n forzada
  const handleGenerateCeremonyWithAssign = React.useCallback(
    (...args) => {
      const config =
        typeof args[0] === 'object' && args[0] !== null
          ? { ...args[0] }
          : {
              rows: args[0],
              cols: args[1],
              gap: args[2],
              startX: args[3],
              startY: args[4],
              aisleAfter: args[5],
            };
      try {
        generateSeatGrid(config);
      } finally {
        setTimeout(async () => {
          try {
            const res = await (typeof autoAssignGuestsRules === 'function'
              ? autoAssignGuestsRules()
              : autoAssignGuests());
            if (res?.ok) {
              const msg =
                res.method === 'backend'
                  ? `Asignaci�n autom�tica (IA): ${res.assigned} invitado(s)`
                  : `Asignaci�n autom�tica: ${res.assigned} invitado(s)`;
              toast.info(msg);
            } else if (res?.error) {
              toast.warn(`Autoasignaci�n: ${res.error}`);
            }
          } catch (e) {
            // console.warn('Auto-assign error', e);
          }
        }, 50);
      }
    },
    [generateSeatGrid, autoAssignGuestsRules, autoAssignGuests]
  );

  // No-op defensivo para habilitar/deshabilitar elementos desde el canvas
  const handleToggleEnabled = React.useCallback(() => {}, []);

  const handleAssignGuestToCeremonyRow = React.useCallback(
    async (guestId, targetRowIndex) => {
      if (!guestId) return { ok: false, error: 'guest-required' };
      const rows = Array.isArray(ceremonyRows) ? ceremonyRows : [];
      if (!rows.length) return { ok: false, error: 'no-rows' };
      const index =
        typeof targetRowIndex === 'number' && targetRowIndex >= 0
          ? targetRowIndex
          : ceremonyActiveRow;
      const row = rows[index];
      if (!row) return { ok: false, error: 'row-not-found' };
      const availableSeats = row.seats.filter((seat) => seat?.enabled !== false && !seat?.guestId);
      const vipCandidates = availableSeats.filter((seat) => seat?.reservedFor);
      const candidateSeat = vipCandidates.length > 0 ? vipCandidates[0] : availableSeats[0];
      if (!candidateSeat) {
        toast.warning('Esta fila no tiene asientos disponibles');
        return { ok: false, error: 'row-full' };
      }
      try {
        setCeremonyActiveRow(index);
        await assignGuestToCeremonySeat(candidateSeat.id, guestId);
        toast.success('Invitado asignado a la fila seleccionada');
        return { ok: true };
      } catch (err) {
        toast.error('No se pudo asignar el invitado a la fila');
        return { ok: false, error: 'assign-error', cause: err };
      }
    },
    [assignGuestToCeremonySeat, ceremonyRows, ceremonyActiveRow]
  );

  // Análisis de invitados para el modal de auto layout
  const guestAnalysis = React.useMemo(() => {
    if (typeof analyzeCurrentGuests === 'function') {
      return analyzeCurrentGuests();
    }
    return {
      tables: [],
      unassignedGuests: [],
      totalTables: 0,
      totalAssigned: 0,
    };
  }, [analyzeCurrentGuests, safeGuests]);

  // Handler para generar layout automático
  const handleGenerateAutoLayout = React.useCallback(
    async (layoutType) => {
      try {
        if (typeof generateAutoLayoutFromGuests !== 'function') {
          toast.error('Función de generación automática no disponible');
          return;
        }

        const result = generateAutoLayoutFromGuests(layoutType);

        if (result.success) {
          toast.success(result.message || 'Layout generado correctamente');

          // Si cambiamos al tab de banquete si no estamos ahí
          if (tab !== 'banquet') {
            setTab('banquet');
          }
        } else {
          toast.error(result.message || 'No se pudo generar el layout');
        }
      } catch (error) {
        // console.error('Error generando auto layout:', error);
        toast.error('Error generando el layout automático');
      }
    },
    [generateAutoLayoutFromGuests, tab, setTab]
  );

  // Abrir modal de auto layout
  const handleOpenAutoLayout = React.useCallback(() => {
    setAutoLayoutModalOpen(true);
  }, []);

  const renderLibraryPanel = (wrapperClassName = 'h-full') =>
    showLibraryPanel ? (
      <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${wrapperClassName}`}>
        <SeatingLibraryPanel
          tab={tab}
          drawMode={drawMode}
          onDrawModeChange={setDrawMode}
          onOpenTemplates={handleOpenTemplates}
          showTables={showTables}
          onToggleShowTables={toggleShowTables}
          showRulers={showRulers}
          onToggleRulers={() => setShowRulers((v) => !v)}
          snapToGrid={snapToGrid}
          onToggleSnap={() => setSnapToGrid((v) => !v)}
          showSeatNumbers={showSeatNumbers}
          onToggleSeatNumbers={() => setShowSeatNumbers((v) => !v)}
          gridStep={gridStep}
          onAddTable={addTable}
          onOpenGuestDrawer={() => setGuestDrawerOpen(true)}
          pendingCount={pendingGuests.length}
          areaSummary={areaSummary}
        />
      </div>
    ) : null;

  const renderSmartPanel = (wrapperClassName = 'h-full') =>
    showSmartPanel ? (
      <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${wrapperClassName}`}>
        <SeatingSmartPanel
          recommendations={smartRecommendations}
          conflictSuggestions={smartConflictSuggestions}
          insights={smartInsights}
          onAssign={handleSmartAssign}
          onFocusTable={focusTable}
          onExecuteAction={handleSmartAction}
        />
      </div>
    ) : null;

  const renderGuestPanel = (wrapperClassName = 'h-full') =>
    guestSidebarOpen ? (
      <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${wrapperClassName}`}>
        <SeatingGuestSidebar
          guests={safeGuests}
          pendingGuests={pendingGuests}
          recommendations={smartRecommendations}
          conflictSuggestions={smartConflictSuggestions}
          conflicts={conflicts}
          insights={smartInsights}
          onAssignRecommendation={handleSmartAssign}
          onFocusTable={focusTable}
          onExecuteAction={handleSmartAction}
          onOpenGuestDrawer={() => setGuestDrawerOpen(true)}
          listSnapshots={listSnapshots}
          loadSnapshot={loadSnapshot}
          deleteSnapshot={deleteSnapshot}
        />
      </div>
    ) : null;

  const renderCanvas = (className = 'h-full') => (
    <div className="relative h-full" style={{ cursor: modeCursor }}>
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
        className={className}
        moveTable={moveTable}
        onToggleSeat={toggleSeatEnabled}
        onAssignGuest={handleAssignGuest}
        onAssignGuestSeat={(tableId, seatIdx, guestId) => {
          try {
            moveGuestToSeat(guestId, tableId, seatIdx);
            toast.success(`Invitado a asiento ${seatIdx + 1}`);
          } catch (_) {
            handleAssignGuest(tableId, guestId);
          }
        }}
        onAssignCeremonySeat={async (seatId, guestId) => {
          try {
            await assignGuestToCeremonySeat(seatId, guestId);
            toast.success('Invitado asignado a silla');
          } catch (_) {}
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
        tableLocks={tableLocks}
        currentClientId={collabClientId}
        validationsEnabled={validationsEnabled}
        designFocusMode={designFocusMode}
        suggestions={guidedGuestId ? suggestTablesForGuest?.(guidedGuestId) || null : null}
        focusTableId={focusTableId}
        onViewportChange={(vp) => setViewport(vp)}
      />

      {/* ✅ NUEVO: Sidebar de propiedades */}
      {(selectedTable || selectedIds.length > 0) && (
        <SeatingPropertiesSidebar
          selectedTable={selectedTable}
          selectedIds={selectedIds}
          tables={safeTables}
          guests={safeGuests}
          onUpdateTable={handleUpdateTableFromSidebar}
          onDeleteTable={deleteTable}
          onDuplicateTable={duplicateTable}
          onToggleLock={toggleTableLocked}
          onClose={() => handleSelectTable(null)}
          onAssignGuest={(tableId) => {
            setGuestDrawerOpen(true);
          }}
          onRemoveGuest={(guestId) => {
            moveGuest(guestId, null);
          }}
        />
      )}

      {/* ✅ NUEVO: Validaciones Coach */}
      <ValidationCoach
        suggestions={suggestions}
        onDismiss={(id) => {
          setSuggestions((prev) => prev.filter((s) => s.id !== id));
        }}
        onAutoFix={handleAutoFix}
        position="bottom-right"
      />
    </div>
  );

  const renderInspector = (wrapperClassName = 'h-full', panelClassName = 'h-full') =>
    showInspectorPanel ? (
      <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${wrapperClassName}`}>
        <SeatingInspectorPanel
          selectedTable={selectedTable}
          tab={tab}
          globalMaxSeats={globalMaxSeats}
          ceremonyRows={ceremonyRows}
          ceremonyActiveRow={ceremonyActiveRow}
          onSelectCeremonyRow={setCeremonyActiveRow}
          onAssignCeremonyGuest={handleAssignGuestToCeremonyRow}
          ceremonySuggestions={ceremonySuggestions}
          ceremonySettings={ceremonySettings}
          guests={safeGuests}
          onTableDimensionChange={handleTableDimensionChange}
          onConfigureTable={handleConfigureTable}
          duplicateTable={duplicateTable}
          deleteTable={deleteTable}
          toggleTableLocked={toggleTableLocked}
          assignedGuests={assignedToSelected}
          onUnassignGuest={handleUnassignGuest}
          className={panelClassName}
        />
      </div>
    ) : null;

  // Auto IA eliminado en la toolbar (feature desactivada en UI)

  /* ---- render ---- */
  const ceremonyCount = safeSeats.length;
  const banquetCount = safeTables.length;

  if (!isHallReady) {
    return (
      <DndProvider backend={HTML5Backend}>
        <div className="h-full flex items-center justify-center text-muted">Cargando plano...</div>
      </DndProvider>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col bg-slate-50">
        {/* Tabs */}
        <div className="flex-shrink-0 p-4 pb-0">
          <SeatingPlanTabs
            activeTab={tab}
            onTabChange={setTab}
            ceremonyCount={ceremonyCount}
            banquetCount={banquetCount}
            ceremonyProgress={seatingProgress.ceremonyProgress}
            banquetProgress={seatingProgress.banquetProgress}
          />
        </div>

        {showOverview ? (
          <>
            {/* Summary */}
            <div className="flex-shrink-0 px-4 pt-3">
              <SeatingPlanSummary
                totalGuests={safeGuests.length}
                totalPersons={seatingProgress.totalPersons}
                assignedPersons={seatingProgress.assignedPersons}
                pendingGuests={pendingGuests.length}
                tableCount={safeTables.length}
                seatCapacity={seatingProgress.enabledSeats}
                globalCapacity={Number.isFinite(globalMaxSeats) ? globalMaxSeats : 0}
                ceremonyProgress={seatingProgress.ceremonyProgress}
                banquetProgress={seatingProgress.banquetProgress}
                areaSummary={areaSummary}
                onOpenGuestDrawer={() => setGuestDrawerOpen(true)}
                onOpenAutoLayout={handleOpenAutoLayout}
                hasAssignedTables={guestAnalysis.totalTables > 0}
              />
            </div>

            {/* Quick Actions */}
            <div className="flex-shrink-0 px-4 pb-3">
              <SeatingPlanQuickActions
                tab={tab}
                pendingCount={pendingGuests.length}
                hasTables={safeTables.length > 0}
                hasGuests={safeGuests.length > 0}
                onAddTable={tab === 'banquet' ? addTable : undefined}
                onOpenGuestDrawer={() => setGuestDrawerOpen(true)}
                onAutoAssign={handleAutoAssignClick}
                onOpenTemplates={handleOpenTemplates}
                onOpenSpaceConfig={handleOpenSpaceConfig}
                onOpenCeremonyConfig={handleOpenCeremonyConfig}
                onOpenBanquetConfig={handleOpenBanquetConfig}
                onFitToContent={() => window.dispatchEvent(new Event('seating-fit'))}
                onOpenExport={() => setExportWizardOpen(true)}
                onToggleAdvancedTools={(open) => setShowAdvancedTools(!!open)}
                advancedOpen={showAdvancedTools}
                focusMode={designFocusMode}
                onToggleFocusMode={handleToggleDesignFocus}
                onboarding={{
                  activeStep: onboardingActiveStep,
                  completed: {
                    space: !!onboardingPrefs.steps.spaceConfigured,
                    guests: !!onboardingPrefs.steps.guestsImported,
                    assign: !!onboardingPrefs.steps.firstAssignment,
                  },
                }}
                onboardingDismissed={onboardingPrefs.dismissed}
                onResetOnboarding={handleResetOnboarding}
                onHideOverview={() => setShowOverview(false)}
                panels={{
                  library: showLibraryPanel,
                  inspector: showInspectorPanel,
                  smart: showSmartPanelPinned,
                  guest: guestSidebarOpen,
                }}
                smartPanelAvailable={smartPanelEligible}
                guestPanelAvailable={!isMobile}
                onToggleLibraryPanel={handleToggleLibraryPanel}
                onToggleInspectorPanel={handleToggleInspectorPanel}
                onToggleSmartPanel={handleToggleSmartPanel}
                onToggleGuestPanel={handleToggleGuestPanel}
              />
            </div>

            {showOnboardingChecklist ? (
              <div className="flex-shrink-0 px-4 pb-3">
                <SeatingPlanOnboardingChecklist
                  currentStep={onboardingActiveStep}
                  progress={onboardingProgress}
                  steps={[
                    {
                      id: 'space',
                      title: 'Configura el espacio',
                      description: 'Define dimensiones, fondo o dibuja zonas clave del salon.',
                      done: onboardingPrefs.steps.spaceConfigured,
                      actionLabel: 'Configurar espacio',
                      onAction: () => {
                        handleOpenSpaceConfig();
                      },
                      onMarkDone: () => handleCompleteOnboardingStep('spaceConfigured'),
                    },
                    {
                      id: 'guests',
                      title: 'Cargar invitados',
                      description: 'Importa tu lista o revisa los pendientes por asignar.',
                      done: onboardingPrefs.steps.guestsImported,
                      actionLabel: safeGuests.length > 0 ? 'Ver invitados' : 'Importar invitados',
                      onAction: () => {
                        setGuestDrawerOpen(true);
                      },
                      onMarkDone: () => handleCompleteOnboardingStep('guestsImported'),
                    },
                    {
                      id: 'assign',
                      title: 'Asigna mesas',
                      description: 'Ubica a cada invitado en una mesa o fila de ceremonia.',
                      done: onboardingPrefs.steps.firstAssignment,
                      actionLabel:
                        seatingProgress.assignedPersons > 0
                          ? 'Revisar asignaciones'
                          : 'Asignar ahora',
                      onAction: () => {
                        if (pendingGuests.length > 0) {
                          setGuidedGuestId(pendingGuests[0]?.id || null);
                          setGuestDrawerOpen(true);
                        } else {
                          handleAutoAssignClick();
                        }
                      },
                      onMarkDone: () => handleCompleteOnboardingStep('firstAssignment'),
                    },
                  ]}
                  onDismiss={() => {
                    handleDismissOnboarding();
                  }}
                />
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex-shrink-0 px-4 pt-3 pb-3">
            <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Panel superior oculto
                </p>
                <p className="text-sm text-slate-600">
                  Simplificamos la vista para centrarte en el lienzo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOverview(true)}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
              >
                Mostrar panel
              </button>
            </div>
          </div>
        )}

        {/* Toolbar */}
        {showAdvancedTools ? (
          <div className="flex-shrink-0 px-4 pb-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">Herramientas avanzadas</span>
                <button
                  type="button"
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                  onClick={() => setShowAdvancedTools(false)}
                >
                  Ocultar toolbar
                </button>
              </div>
              {/* FASE 2: Búsqueda avanzada */}
              <div className="mb-4">
                <SeatingSearchBar
                  guests={guests}
                  tables={tables}
                  onGuestFound={(guest) => {
                    // Resaltar invitado (puede implementarse después)
                    // console.log('Guest found:', guest);
                  }}
                  onTableFound={(table) => {
                    // Hacer zoom a la mesa
                    try {
                      selectTable?.(table.id);
                      // Trigger fit to show the table
                      setTimeout(() => {
                        window.dispatchEvent(new Event('seating-fit'));
                      }, 100);
                    } catch (e) {
                      // console.warn('Error focusing table:', e);
                    }
                  }}
                  className="w-full"
                />
              </div>

              {/* ✅ NUEVO: Toolbar Contextual */}
              <ContextualToolbar
                tables={safeTables}
                selectedTable={selectedTable}
                selectedIds={selectedIds}
                drawMode={drawMode}
                canUndo={canUndo}
                canRedo={canRedo}
                validationsEnabled={validationsEnabled}
                globalMaxSeats={globalMaxSeats}
                onGenerateAuto={() => {
                  if (typeof generateAutoLayoutFromGuests === 'function') {
                    generateAutoLayoutFromGuests('columns');
                  }
                }}
                onOpenTemplates={() => setShowTemplateGalleryNew(true)}
                onOpenSpaceConfig={handleOpenSpaceConfig}
                onChangeDrawMode={setDrawMode}
                onUndo={undo}
                onRedo={redo}
                onDuplicateTable={duplicateTable}
                onDeleteTable={deleteTable}
                onRotateTable={(id, degrees) => rotateSelected(degrees)}
                onToggleLock={toggleTableLocked}
                onAlignTables={() => alignSelected('horizontal', 'start')}
                onDistributeTables={() => distributeSelected('x')}
                onToggleValidations={(enabled) => setValidationsEnabled(enabled)}
                onOpenCapacity={() => setBanquetConfigOpen(true)}
                onOpenAdvanced={() => setShowAdvancedTools(true)}
              />

              {/* ✅ NUEVO: Indicador de Modo */}
              <ModeIndicator
                mode={drawMode}
                show={
                  showModeIndicator && !templateOpen && !ceremonyConfigOpen && !banquetConfigOpen
                }
              />
            </div>
          </div>
        ) : null}
        {/* Cuerpo principal */}
        {isMobile ? (
          <div className="flex-1 flex flex-col gap-4 px-4 pb-6">
            <SeatingMobileOverlay
              hallSize={safeHallSize}
              tables={safeTables}
              selectedTable={selectedTable}
              onSelectTable={handleSelectTable}
              onOpenGuestDrawer={() => setGuestDrawerOpen(true)}
              onOpenTemplates={handleOpenTemplates}
              onOpenExportWizard={() => setExportWizardOpen(true)}
            />
            {renderLibraryPanel('max-h-60 overflow-y-auto')}
            <div className="min-h-[55vh] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {renderCanvas('h-[55vh]')}
            </div>
            {renderSmartPanel('overflow-hidden')}
            {renderInspector('max-h-60 overflow-y-auto', 'max-h-60 overflow-y-auto')}
          </div>
        ) : (
          <div className="flex-1 grid gap-4 px-4 pb-6" style={{ gridTemplateColumns: gridColumns }}>
            {renderLibraryPanel()}
            <div className="h-full rounded-3xl border border-slate-200 bg-white shadow-sm">
              {renderCanvas('h-full')}
            </div>
            {renderSmartPanel()}
            {renderInspector('h-full', 'h-full')}
            {renderGuestPanel()}
          </div>
        )}
        {/* Barra inferior de estado */}
        <div className={`flex-shrink-0 px-4 pb-4 ${isMobile ? 'pt-2' : ''}`}>
          <div
            className={`flex items-center text-muted bg-white border rounded-lg px-3 py-2 ${
              isMobile ? 'flex-wrap gap-x-3 gap-y-2 text-[11px]' : 'gap-4 text-xs'
            }`}
          >
            <div>Zoom: {Math.round((viewport?.scale || 1) * 100)}%</div>
            <div>
              Dimensiones: {(safeHallSize.width / 100).toFixed(1)} �{' '}
              {(safeHallSize.height / 100).toFixed(1)} m
            </div>
            <div>Conflictos: {Array.isArray(conflicts) ? conflicts.length : 0}</div>
            <div className="flex items-center gap-2">
              <span>Colaboradores:</span>
              {otherCollaborators.length === 0 ? (
                <span className="text-gray-500">
                  {collaborationStatus === 'connecting'
                    ? 'Conectando&'
                    : collaborationStatus === 'online'
                      ? 'Solo t�'
                      : 'Offline'}
                </span>
              ) : (
                <div className="flex items-center gap-1 flex-wrap">
                  {otherCollaborators.map((member) => (
                    <span
                      key={member.id}
                      className="px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white shadow-sm"
                      style={{ backgroundColor: member.color || '#6366f1' }}
                      title={member.displayName || member.userId || 'Colaborador'}
                    >
                      {(member.displayName || member.userId || '?')
                        .split(' ')
                        .slice(0, 2)
                        .join(' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div
              className={`${
                isMobile
                  ? 'basis-full mt-1 flex items-center justify-between gap-2'
                  : 'ml-auto flex items-center gap-2'
              }`}
            >
              <button
                className="px-2 py-1 border rounded hover:bg-gray-50"
                onClick={() => setGuestDrawerOpen(true)}
              >
                Pendientes: {pendingGuests.length}
              </button>
              {!isMobile && (
                <button
                  className="px-2 py-1 border rounded hover:bg-gray-50 text-xs"
                  onClick={() => setGuestSidebarOpen((prev) => !prev)}
                >
                  {guestSidebarOpen ? 'Ocultar Guest Sidebar' : 'Mostrar Guest Sidebar'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Drawer de invitados */}
        <SeatingGuestDrawer
          open={guestDrawerOpen}
          onClose={() => setGuestDrawerOpen(false)}
          guests={safeGuests}
          selectedTableId={selectedTable?.id}
          onAssignGuest={handleAssignGuest}
          guidedGuestId={guidedGuestId}
          onGuideGuest={setGuidedGuestId}
        />

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
          onCloseBackground={() => setBackgroundOpen(false)}
          onCloseCapacity={() => setCapacityOpen(false)}
          onCloseTemplate={handleCloseTemplates}
          onGenerateSeatGrid={handleGenerateCeremonyWithAssign}
          onGenerateBanquetLayout={handleGenerateBanquetLayoutWithAssign}
          onSaveHallDimensions={async (w, h, aisle) => {
            try {
              await saveHallDimensions(w, h, aisle);
              toast.success('Dimensiones guardadas');
            } catch (e) {
              toast.error('Error guardando dimensiones');
            }
          }}
          onApplyTemplate={handleApplyTemplate}
          onSaveCapacity={async (n) => {
            try {
              await saveGlobalMaxGuests(n);
              toast.success('Capacidad global guardada');
            } catch (e) {
              toast.error('Error guardando capacidad');
            }
          }}
          onSaveBackground={async (bg) => {
            try {
              await saveBackground(bg);
              toast.success('Fondo actualizado');
            } catch (e) {
              toast.error('Error guardando fondo');
            }
          }}
          areas={safeAreas}
          hallSize={safeHallSize}
          guests={safeGuests}
          tables={safeTables}
          background={background}
          globalMaxSeats={globalMaxSeats}
          ceremonySettings={ceremonySettings}
        />
        <SeatingExportWizard
          open={exportWizardOpen}
          onClose={() => setExportWizardOpen(false)}
          onGenerateExport={handleGenerateAdvancedExport}
          availableTabs={availableExportTabs}
          storageKey={activeWedding ? `seatingPlan:${activeWedding}:export-presets` : undefined}
          previewData={exportPreviewSnapshot}
        />

        {/* Modal de Auto Layout */}
        <AutoLayoutModal
          isOpen={autoLayoutModalOpen}
          onClose={() => setAutoLayoutModalOpen(false)}
          onGenerate={handleGenerateAutoLayout}
          analysis={guestAnalysis}
        />

        {/* FASE 3: Template Gallery Modal */}
        <TemplateGalleryModal
          isOpen={templateGalleryOpen}
          onClose={() => setTemplateGalleryOpen(false)}
          onSelectTemplate={handleSelectTemplate}
        />

        {/* FASE 3: Export Wizard Enhanced */}
        <ExportWizardEnhanced
          isOpen={exportWizardEnhancedOpen}
          onClose={() => setExportWizardEnhancedOpen(false)}
          onExport={(format, options) => {
            try {
              // Llamar al export correspondiente según formato
              if (format === 'pdf') {
                exportPDF();
              } else if (format === 'png') {
                exportPNG();
              } else if (format === 'svg') {
                exportSVG();
              } else if (format === 'excel') {
                exportCSV();
              }
              toast.success(`Exportado como ${format.toUpperCase()}`);
            } catch (error) {
              // console.error('Export error:', error);
              toast.error('Error al exportar');
            }
          }}
          canvasRef={canvasRef}
        />

        {/* FASE 4: Tour Interactivo */}
        <SeatingInteractiveTour
          isEnabled={true}
          autoStart={showTour}
          onComplete={() => {
            setShowTour(false);
            toast.success('¡Tour completado! Ya conoces todas las herramientas');
          }}
          onSkip={() => {
            setShowTour(false);
          }}
        />

        {/* FASE 4: Tooltips Contextuales */}
        <SeatingTooltips
          state={tooltipState}
          onAction={(action) => {
            if (action === 'start-tour') setShowTour(true);
            if (action === 'open-space') setSpaceConfigOpen(true);
            if (action === 'open-templates') setTemplateGalleryOpen(true);
            // TODO: Re-enable after fixing initialization order
            // if (action === 'auto-generate') handleGenerateAutoLayout('columns');
            if (action === 'open-export') setExportWizardEnhancedOpen(true);
          }}
          position="bottom-right"
        />

        {/* FASE 2: Drag Ghost Preview */}
        <DragGhostPreview
          isDragging={dragState.isDragging}
          draggedItem={dragState.draggedItem}
          targetTable={dragState.targetTable}
          position={dragState.position}
          canDrop={dragState.canDrop}
        />

        {/* FASE 5: Collaboration Cursors */}
        <CollaborationCursors
          users={otherCollaborators}
          currentUserId={activeWedding}
          canvasRef={canvasRef}
          scale={viewport.scale}
          offset={viewport.offset}
        />

        {/* ✅ NUEVO: Galería de Plantillas */}
        <TemplateGallery
          isOpen={showTemplateGalleryNew}
          onClose={() => setShowTemplateGalleryNew(false)}
          onSelectTemplate={handleSelectTemplateNew}
          onCustomGenerate={() => {
            setShowTemplateGalleryNew(false);
            if (typeof generateAutoLayoutFromGuests === 'function') {
              generateAutoLayoutFromGuests('columns');
            }
          }}
        />
      </div>
    </DndProvider>
  );
};

export default SeatingPlanRefactored;
