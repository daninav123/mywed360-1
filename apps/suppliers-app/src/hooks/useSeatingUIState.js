/**
 * Hook personalizado para manejar el estado de UI del Seating Plan
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  saveUIPrefs,
  loadUIPrefs,
  DEFAULT_UI_PREFS,
  hasVisited,
  markAsVisited,
} from '../utils/seatingStorage';
import {
  createDefaultOnboardingState,
  sanitizeOnboardingState,
  onboardingStatesEqual,
} from '../utils/seatingOnboarding';

/**
 * Hook para manejar estado de UI del Seating Plan
 * @param {string} weddingId - ID de la boda activa
 * @returns {Object} Estado y funciones de UI
 */
export const useSeatingUIState = (weddingId) => {
  // Estados de visualización
  const [showTables, setShowTables] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [showSeatNumbers, setShowSeatNumbers] = useState(false);
  const [showAdvancedTools, setShowAdvancedTools] = useState(true);
  const [showLibraryPanel, setShowLibraryPanel] = useState(true);
  const [showInspectorPanel, setShowInspectorPanel] = useState(true);
  const [showSmartPanelPinned, setShowSmartPanelPinned] = useState(true);
  const [showOverview, setShowOverview] = useState(true);
  const [designFocusMode, setDesignFocusMode] = useState(false);

  // Estados de modales
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const [capacityOpen, setCapacityOpen] = useState(false);
  const [guestDrawerOpen, setGuestDrawerOpen] = useState(false);
  const [exportWizardOpen, setExportWizardOpen] = useState(false);
  const [autoLayoutModalOpen, setAutoLayoutModalOpen] = useState(false);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [exportWizardEnhancedOpen, setExportWizardEnhancedOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Estados de canvas
  const [viewport, setViewport] = useState({ scale: 1, offset: { x: 0, y: 0 } });
  const [focusTableId, setFocusTableId] = useState(null);

  // Estados de sidebar/panels
  const [guestSidebarOpen, setGuestSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [ceremonyActiveRow, setCeremonyActiveRow] = useState(0);
  const [guidedGuestId, setGuidedGuestId] = useState(null);

  // Estado de onboarding
  const [onboardingPrefs, setOnboardingPrefs] = useState(() => createDefaultOnboardingState());

  // Cargar preferencias al montar
  useEffect(() => {
    const prefs = loadUIPrefs(weddingId);
    if (!prefs) return;

    if (Object.prototype.hasOwnProperty.call(prefs, 'showRulers')) {
      setShowRulers(!!prefs.showRulers);
    }
    if (Object.prototype.hasOwnProperty.call(prefs, 'showSeatNumbers')) {
      setShowSeatNumbers(!!prefs.showSeatNumbers);
    }
    if (Object.prototype.hasOwnProperty.call(prefs, 'showTables')) {
      setShowTables(!!prefs.showTables);
    }
    if (Object.prototype.hasOwnProperty.call(prefs, 'showAdvancedTools')) {
      setShowAdvancedTools(!!prefs.showAdvancedTools);
    }
    if (Object.prototype.hasOwnProperty.call(prefs, 'showLibraryPanel')) {
      setShowLibraryPanel(prefs.showLibraryPanel !== false);
    }
    if (Object.prototype.hasOwnProperty.call(prefs, 'showInspectorPanel')) {
      setShowInspectorPanel(prefs.showInspectorPanel !== false);
    }
    if (Object.prototype.hasOwnProperty.call(prefs, 'showSmartPanelPinned')) {
      setShowSmartPanelPinned(prefs.showSmartPanelPinned !== false);
    }
    if (Object.prototype.hasOwnProperty.call(prefs, 'showOverview')) {
      setShowOverview(prefs.showOverview !== false);
    }
    if (Object.prototype.hasOwnProperty.call(prefs, 'designFocusMode')) {
      setDesignFocusMode(!!prefs.designFocusMode);
    }
    if (Object.prototype.hasOwnProperty.call(prefs, 'onboarding')) {
      const sanitized = sanitizeOnboardingState(prefs.onboarding);
      setOnboardingPrefs((prev) => (onboardingStatesEqual(prev, sanitized) ? prev : sanitized));
    }
  }, [weddingId]);

  // Guardar preferencias cuando cambien
  useEffect(() => {
    saveUIPrefs(weddingId, {
      showRulers,
      showSeatNumbers,
      showTables,
      showAdvancedTools,
      showLibraryPanel,
      showInspectorPanel,
      showSmartPanelPinned,
      showOverview,
      designFocusMode,
      onboarding: onboardingPrefs,
    });
  }, [
    weddingId,
    showRulers,
    showSeatNumbers,
    showTables,
    showAdvancedTools,
    showLibraryPanel,
    showInspectorPanel,
    showSmartPanelPinned,
    showOverview,
    designFocusMode,
    onboardingPrefs,
  ]);

  // Detectar mobile
  useEffect(() => {
    const updateIsMobile = () => {
      try {
        setIsMobile(window.innerWidth <= 1024);
      } catch (error) {
        setIsMobile(false);
      }
    };

    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  // Cerrar sidebar en mobile
  useEffect(() => {
    if (isMobile) {
      setGuestSidebarOpen(false);
    }
  }, [isMobile]);

  // Verificar primera visita para tour
  useEffect(() => {
    if (!hasVisited()) {
      setShowTour(true);
      markAsVisited();
    }
  }, []);

  // Funciones de toggle
  const toggleShowTables = useCallback(() => setShowTables((s) => !s), []);
  const toggleShowRulers = useCallback(() => setShowRulers((s) => !s), []);
  const toggleShowSeatNumbers = useCallback(() => setShowSeatNumbers((s) => !s), []);
  const toggleShowAdvancedTools = useCallback(() => setShowAdvancedTools((s) => !s), []);
  const toggleLibraryPanel = useCallback(() => setShowLibraryPanel((s) => !s), []);
  const toggleInspectorPanel = useCallback(() => setShowInspectorPanel((s) => !s), []);
  const toggleSmartPanel = useCallback(() => setShowSmartPanelPinned((s) => !s), []);
  const toggleGuestSidebar = useCallback(() => setGuestSidebarOpen((s) => !s), []);
  const toggleDesignFocus = useCallback(() => setDesignFocusMode((s) => !s), []);

  // Calcular columnas del grid
  const gridColumns = useMemo(() => {
    const cols = [];
    if (showLibraryPanel) cols.push('18rem');
    cols.push('1fr');
    if (showSmartPanelPinned && !isMobile) cols.push('18rem');
    if (showInspectorPanel) cols.push('20rem');
    if (guestSidebarOpen && !isMobile) cols.push('22rem');
    return cols.join(' ');
  }, [showLibraryPanel, showSmartPanelPinned, showInspectorPanel, guestSidebarOpen, isMobile]);

  return {
    // Estados de visualización
    showTables,
    setShowTables,
    toggleShowTables,
    showRulers,
    setShowRulers,
    toggleShowRulers,
    showSeatNumbers,
    setShowSeatNumbers,
    toggleShowSeatNumbers,
    showAdvancedTools,
    setShowAdvancedTools,
    toggleShowAdvancedTools,
    showLibraryPanel,
    setShowLibraryPanel,
    toggleLibraryPanel,
    showInspectorPanel,
    setShowInspectorPanel,
    toggleInspectorPanel,
    showSmartPanelPinned,
    setShowSmartPanelPinned,
    toggleSmartPanel,
    showOverview,
    setShowOverview,
    designFocusMode,
    setDesignFocusMode,
    toggleDesignFocus,

    // Estados de modales
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

    // Estados de canvas
    viewport,
    setViewport,
    focusTableId,
    setFocusTableId,

    // Estados de sidebar/panels
    guestSidebarOpen,
    setGuestSidebarOpen,
    toggleGuestSidebar,
    isMobile,
    ceremonyActiveRow,
    setCeremonyActiveRow,
    guidedGuestId,
    setGuidedGuestId,

    // Onboarding
    onboardingPrefs,
    setOnboardingPrefs,

    // Computados
    gridColumns,
    showGuestSidebar: guestSidebarOpen && !isMobile,
  };
};
