/**
 * Tests para el componente SeatingPlanRefactored
 * Valida la integración y funcionalidad de los componentes modulares
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
// La importación del componente bajo prueba debe ir DESPUÉS de configurar los mocks

// Mock de dependencias
vi.mock('../hooks/useSeatingPlan', () => {
  const mockFn = vi.fn(() => ({
    tab: 'ceremony',
    setTab: vi.fn(),
    syncStatus: { status: 'synced' },
    hallSize: { width: 1800, height: 1200 },
    areas: [],
    tables: [],
    seats: [],
    selectedTable: null,
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
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
    pushHistory: vi.fn(),
    generateSeatGrid: vi.fn(),
    generateBanquetLayout: vi.fn(),
    exportPNG: vi.fn(),
    exportPDF: vi.fn(),
    saveHallDimensions: vi.fn(),
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

import SeatingPlanRefactored from '../components/seating/SeatingPlanRefactored';

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
    const mockSetTab = vi.fn();
    const { useSeatingPlan } = require('../hooks/useSeatingPlan');
    // Tomar el retorno por defecto del mock y sobreescribir setTab
    const defaultReturn = useSeatingPlan();
    useSeatingPlan.mockReturnValue({
      ...defaultReturn,
      setTab: mockSetTab,
    });

    render(<SeatingPlanRefactored />);

    fireEvent.click(screen.getAllByText('Banquete')[0]);
    expect(mockSetTab).toHaveBeenCalledWith('banquet');
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
