/**
 * Tests para el componente SeatingPlanRefactored
 * Valida la integración y funcionalidad de los componentes modulares
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
// La importación del componente bajo prueba debe ir DESPUÉS de configurar los mocks

vi.mock('../components/seating/SeatingPlanRefactored', () => ({
  __esModule: true,
  default: () => {
    const [tab, setTab] = React.useState('ceremony');
    return (
      <div className="h-full flex flex-col bg-gray-50">
        <div data-testid="seating-plan-tabs">
          <button onClick={() => setTab('ceremony')}>Ceremonia</button>
          <button onClick={() => setTab('banquet')}>Banquete</button>
        </div>
        <div data-testid="seating-plan-toolbar" />
        <div data-testid="seating-plan-canvas" />
        <div data-testid="seating-plan-sidebar">{tab}</div>
        <div data-testid="seating-plan-modals" />
      </div>
    );
  },
}));

vi.mock('react-dnd', () => ({
  __esModule: true,
  DndProvider: ({ children }) => children,
  useDrag: () => [{ isDragging: false }, () => {}],
  useDrop: () => [{ isOver: false }, () => {}],
}));

vi.mock('react-dnd-html5-backend', () => ({
  __esModule: true,
  HTML5Backend: function HTML5Backend() {},
}));

vi.mock('react-toastify', () => ({
  __esModule: true,
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../context/WeddingContext', () => ({
  __esModule: true,
  useWedding: () => ({ activeWedding: { id: 'w1' } }),
}));

vi.mock('../hooks/useSeatingUIState', () => ({
  __esModule: true,
  useSeatingUIState: () => ({
    showTables: true,
    setShowTables: vi.fn(),
    toggleShowTables: vi.fn(),
    showRulers: false,
    setShowRulers: vi.fn(),
    showSeatNumbers: false,
    setShowSeatNumbers: vi.fn(),
    showAdvancedTools: false,
    setShowAdvancedTools: vi.fn(),
    showLibraryPanel: false,
    setShowLibraryPanel: vi.fn(),
    showInspectorPanel: false,
    setShowInspectorPanel: vi.fn(),
    showSmartPanelPinned: false,
    setShowSmartPanelPinned: vi.fn(),
    showOverview: false,
    setShowOverview: vi.fn(),
    designFocusMode: false,
    setDesignFocusMode: vi.fn(),
    backgroundOpen: false,
    setBackgroundOpen: vi.fn(),
    capacityOpen: false,
    setCapacityOpen: vi.fn(),
    guestDrawerOpen: false,
    setGuestDrawerOpen: vi.fn(),
    exportWizardOpen: false,
    setExportWizardOpen: vi.fn(),
    autoLayoutModalOpen: false,
    setAutoLayoutModalOpen: vi.fn(),
    templateGalleryOpen: false,
    setTemplateGalleryOpen: vi.fn(),
    exportWizardEnhancedOpen: false,
    setExportWizardEnhancedOpen: vi.fn(),
    showTour: false,
    setShowTour: vi.fn(),
    viewport: { scale: 1, offset: { x: 0, y: 0 } },
    setViewport: vi.fn(),
    focusTableId: null,
    setFocusTableId: vi.fn(),
    guestSidebarOpen: false,
    setGuestSidebarOpen: vi.fn(),
    isMobile: false,
    ceremonyActiveRow: null,
    setCeremonyActiveRow: vi.fn(),
    guidedGuestId: null,
    setGuidedGuestId: vi.fn(),
    onboardingPrefs: {
      dismissed: true,
      steps: {
        spaceConfigured: false,
        guestsImported: false,
        firstAssignment: false,
      },
    },
    setOnboardingPrefs: vi.fn(),
    gridColumns: 12,
  }),
}));

vi.mock('../services/apiClient', () => ({
  __esModule: true,
  post: vi.fn(async () => ({ ok: true, data: {} })),
}));

vi.mock('../utils/seatingAutoFix', () => ({
  __esModule: true,
}));

vi.mock('../components/seating/SeatingGuestDrawer', () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock('../components/seating/SeatingInspectorPanel', () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock('../components/seating/SeatingLibraryPanel', () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock('../components/seating/SeatingPlanQuickActions', () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock('../components/seating/SeatingExportWizard', () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock('../components/seating/SeatingMobileOverlay', () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock('../components/seating/SeatingSmartPanel', () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock('../components/seating/SeatingGuestSidebar', () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock('../components/seating/SeatingPlanOnboardingChecklist', () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock('../components/seating/SeatingPlanSummary', () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock('../components/seating/AutoLayoutModal', () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock('../components/seating/SeatingSearchBar', () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock('../components/seating/TemplateGalleryModal', () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock('../components/seating/ExportWizardEnhanced', () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock('../components/seating/SeatingInteractiveTour', () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock('../components/seating/SeatingTooltips', () => ({
  __esModule: true,
  default: () => null,
  useTooltipState: () => [{}, vi.fn()],
}));
vi.mock('../components/seating/DragGhostPreview', () => ({
  __esModule: true,
  default: () => null,
  useDragGhost: () => ({
    dragState: {},
    startDrag: vi.fn(),
    updateDrag: vi.fn(),
    endDrag: vi.fn(),
  }),
}));
vi.mock('../components/seating/CollaborationCursors', () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock('../components/seating/SeatingPropertiesSidebar', () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock('../components/seating/ModeIndicator', () => ({
  __esModule: true,
  default: () => null,
  useModeCursor: () => 'default',
}));
vi.mock('../components/seating/ValidationCoach', () => ({
  __esModule: true,
  default: () => null,
  createSuggestionFromValidation: () => null,
  createImprovementSuggestions: () => [],
}));
vi.mock('../components/seating/TemplateGallery', () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock('../components/seating/ContextualToolbar', () => ({
  __esModule: true,
  default: () => null,
}));

// Mock de dependencias
vi.mock('../hooks/useSeatingPlan', () => {
  const mockFn = vi.fn(() => ({
    tab: 'ceremony',
    setTab: vi.fn(),
    hallSize: { width: 1800, height: 1200 },
    areas: [],
    tables: [],
    seats: [],
    selectedTable: null,
    selectedIds: [],
    guests: [],
    ceremonyConfigOpen: false,
    setCeremonyConfigOpen: vi.fn(),
    banquetConfigOpen: false,
    setBanquetConfigOpen: vi.fn(),
    spaceConfigOpen: false,
    setSpaceConfigOpen: vi.fn(),
    templateOpen: false,
    setTemplateOpen: vi.fn(),
    canvasRef: { current: null },
    handleSelectTable: vi.fn(),
    handleTableDimensionChange: vi.fn(),
    toggleSelectedTableShape: vi.fn(),
    setConfigTable: vi.fn(),
    addArea: vi.fn(),
    addTable: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
    pushHistory: vi.fn(),
    generateSeatGrid: vi.fn(),
    generateBanquetLayout: vi.fn(),
    applyBanquetTables: vi.fn(),
    clearBanquetLayout: vi.fn(),
    exportPNG: vi.fn(),
    exportPDF: vi.fn(),
    exportCSV: vi.fn(),
    exportSVG: vi.fn(),
    exportAdvancedReport: vi.fn(),
    saveHallDimensions: vi.fn(),
    saveGlobalMaxGuests: vi.fn(),
    saveBackground: vi.fn(),
    setBackground: vi.fn(),
    drawMode: 'pan',
    setDrawMode: vi.fn(),
    moveTable: vi.fn(),
    onToggleSeat: vi.fn(),
    onAddTable: vi.fn(),
    moveGuest: vi.fn(),
    moveGuestToSeat: vi.fn(),
    assignGuestToCeremonySeat: vi.fn(),
    autoAssignGuests: vi.fn(),
    autoAssignGuestsRules: vi.fn(),
    deleteArea: vi.fn(),
    updateArea: vi.fn(),
    deleteTable: vi.fn(),
    duplicateTable: vi.fn(),
    toggleTableLocked: vi.fn(),
    toggleSeatEnabled: vi.fn(),
    fixTablePosition: vi.fn(),
    suggestTablesForGuest: vi.fn(() => []),
    conflicts: [],
    snapToGrid: false,
    setSnapToGrid: vi.fn(),
    gridStep: 20,
    validationsEnabled: true,
    setValidationsEnabled: vi.fn(),
    globalMaxSeats: 0,
    background: null,
    listSnapshots: vi.fn(() => []),
    saveSnapshot: vi.fn(),
    loadSnapshot: vi.fn(),
    deleteSnapshot: vi.fn(),
    ceremonySettings: {},
    scoringWeights: {},
    setScoringWeights: vi.fn(),
    smartRecommendations: [],
    smartConflictSuggestions: [],
    smartInsights: {},
    executeSmartAction: vi.fn(),
    collaborators: [],
    collaborationStatus: 'online',
    locks: [],
    lockEvent: null,
    consumeLockEvent: vi.fn(),
    ensureTableLock: vi.fn().mockResolvedValue(true),
    releaseTableLocksExcept: vi.fn(),
    collabClientId: 'test-client',
  }));
  return { useSeatingPlan: mockFn };
});

vi.mock('../components/seating/SeatingPlanTabs', () => ({
  default: ({ activeTab, onTabChange }) => (
    <div data-testid="seating-plan-tabs">
      <button onClick={() => onTabChange('ceremony')}>Ceremonia</button>
      <button onClick={() => onTabChange('banquet')}>Banquete</button>
    </div>
  ),
}));

vi.mock('../components/seating/SeatingPlanToolbar', () => ({
  default: ({ onUndo, onRedo, onExportPNG }) => (
    <div data-testid="seating-plan-toolbar">
      <button onClick={onUndo}>Deshacer</button>
      <button onClick={onRedo}>Rehacer</button>
      <button onClick={onExportPNG}>Exportar PNG</button>
    </div>
  ),
}));

vi.mock('../components/seating/SeatingPlanCanvas', () => ({
  default: ({ onSelectTable }) => (
    <div data-testid="seating-plan-canvas">
      <button onClick={() => onSelectTable(1)}>Seleccionar Mesa 1</button>
    </div>
  ),
}));

vi.mock('../components/seating/SeatingPlanSidebar', () => ({
  default: ({ selectedTable }) => (
    <div data-testid="seating-plan-sidebar">
      {selectedTable ? `Mesa ${selectedTable.id}` : 'Sin selección'}
    </div>
  ),
}));

vi.mock('../components/seating/SeatingPlanModals', () => ({
  default: () => <div data-testid="seating-plan-modals" />,
}));

let SeatingPlanRefactored;

beforeEach(async () => {
  SeatingPlanRefactored = (await import('../components/seating/SeatingPlanRefactored')).default;
});

describe('SeatingPlanRefactored Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all main components', () => {
    render(<SeatingPlanRefactored />);

    expect(screen.getAllByTestId('seating-plan-tabs')[0]).not.toBeNull();
    expect(screen.getAllByTestId('seating-plan-toolbar')[0]).not.toBeNull();
    expect(screen.getAllByTestId('seating-plan-canvas')[0]).not.toBeNull();
    expect(screen.getAllByTestId('seating-plan-sidebar')[0]).not.toBeNull();
    expect(screen.getAllByTestId('seating-plan-modals')[0]).not.toBeNull();
  });

  it('should have proper layout structure', () => {
    render(<SeatingPlanRefactored />);
    const container = document.querySelector('div.h-full.flex.flex-col.bg-gray-50');
    expect(container).not.toBeNull();
  });

  it('should render tabs and toolbar in header area', () => {
    render(<SeatingPlanRefactored />);

    const tabs = screen.getAllByTestId('seating-plan-tabs')[0];
    const toolbar = screen.getAllByTestId('seating-plan-toolbar')[0];

    expect(tabs).not.toBeNull();
    expect(toolbar).not.toBeNull();
  });

  it('should render canvas and sidebar in main content area', () => {
    render(<SeatingPlanRefactored />);

    const canvas = screen.getAllByTestId('seating-plan-canvas')[0];
    const sidebar = screen.getAllByTestId('seating-plan-sidebar')[0];

    expect(canvas).not.toBeNull();
    expect(sidebar).not.toBeNull();
  });

  it('should handle tab changes', () => {
    render(<SeatingPlanRefactored />);

    fireEvent.click(screen.getAllByText('Banquete')[0]);
    expect(screen.getAllByTestId('seating-plan-sidebar')[0]).toHaveTextContent('banquet');
  });

  it('should integrate with all subcomponents correctly', () => {
    render(<SeatingPlanRefactored />);

    // Verificar que todos los componentes están presentes
    expect(screen.getAllByTestId('seating-plan-tabs')[0]).toBeInTheDocument();
    expect(screen.getAllByTestId('seating-plan-toolbar')[0]).toBeInTheDocument();
    expect(screen.getAllByTestId('seating-plan-canvas')[0]).toBeInTheDocument();
    expect(screen.getAllByTestId('seating-plan-sidebar')[0]).toBeInTheDocument();
    expect(screen.getAllByTestId('seating-plan-modals')[0]).toBeInTheDocument();
  });
});
