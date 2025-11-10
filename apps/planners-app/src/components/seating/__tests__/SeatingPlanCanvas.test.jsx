/* @vitest-environment jsdom */
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import React, { createRef } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock SeatingCanvas to surface scale/offset for assertions
vi.mock('../../../features/seating/SeatingCanvas', () => ({
  default: (props) => (
    <div
      data-testid="mock-seating-canvas"
      data-scale={props.scale}
      data-offset-x={props.offset?.x}
      data-offset-y={props.offset?.y}
    />
  ),
}));

import SeatingPlanCanvas from '../SeatingPlanCanvas.jsx';

const baseProps = () => ({
  tab: 'banquet',
  areas: [],
  tables: [],
  seats: [],
  hallSize: { width: 1800, height: 1200 },
  selectedTable: null,
  onSelectTable: vi.fn(),
  onTableDimensionChange: vi.fn(),
  onAssignGuest: vi.fn(),
  onToggleEnabled: vi.fn(),
  onAddArea: vi.fn(),
  onAddTable: vi.fn(),
  moveTable: vi.fn(),
  onToggleSeat: vi.fn(),
  guests: [],
  onDeleteArea: vi.fn(),
  onUpdateArea: vi.fn(),
});

describe('SeatingPlanCanvas interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets correct cursor per tool and toggles grabbing while panning', () => {
    const ref = createRef();
    const props = { ...baseProps(), drawMode: 'pan', canvasRef: ref };
    const { rerender } = render(<SeatingPlanCanvas {...props} />);

    const canvas = ref.current; // main canvas div
    expect(canvas).toBeTruthy();
    // Initial cursor for pan
    expect(canvas.style.cursor).toBe('grab');

    // Start panning
    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 50 });
    expect(canvas.style.cursor).toBe('grabbing');
    // Finish panning (listener is on window)
    fireEvent.pointerUp(window);
    expect(canvas.style.cursor).toBe('grab');

    // Move tool
    rerender(<SeatingPlanCanvas {...props} drawMode="move" />);
    expect(canvas.style.cursor).toBe('move');

    // Erase tool
    rerender(<SeatingPlanCanvas {...props} drawMode="erase" />);
    expect(canvas.style.cursor).toBe('not-allowed');

    // Boundary tool -> crosshair
    rerender(<SeatingPlanCanvas {...props} drawMode="boundary" />);
    expect(canvas.style.cursor).toBe('crosshair');
  });

  it('responds to keyboard zoom shortcuts (Ctrl/Cmd +, -, 0)', async () => {
    const ref = createRef();
    render(<SeatingPlanCanvas {...baseProps()} drawMode="pan" canvasRef={ref} />);

    // Read initial scale from mocked SeatingCanvas
    const mc = () => screen.getByTestId('mock-seating-canvas');
    const scale0 = parseFloat(mc().getAttribute('data-scale'));
    expect(scale0).toBeGreaterThan(0);

    // Zoom in
    fireEvent.keyDown(window, { key: '=', ctrlKey: true });
    const scale1 = parseFloat(mc().getAttribute('data-scale'));
    expect(scale1).toBeGreaterThan(scale0);

    // Zoom out
    fireEvent.keyDown(window, { key: '-', ctrlKey: true });
    const scale2 = parseFloat(mc().getAttribute('data-scale'));
    // After + then -, should be close to original but <= previous
    expect(scale2).toBeLessThanOrEqual(scale1);

    // Fit to content (Ctrl+0) -> expect a deterministic fit based on hallSize
    fireEvent.keyDown(window, { key: '0', ctrlKey: true });
    const scale3 = parseFloat(mc().getAttribute('data-scale'));
    // With hall 1800x1200 and view fallback 800x600, expected ~0.4
    expect(scale3).toBeGreaterThan(0.35);
    expect(scale3).toBeLessThan(0.5);
  });

  it('zooms with wheel events on the canvas element', async () => {
    const ref = createRef();
    render(<SeatingPlanCanvas {...baseProps()} drawMode="pan" canvasRef={ref} />);

    const mc = () => screen.getByTestId('mock-seating-canvas');
    const canvas = ref.current;
    expect(canvas).toBeTruthy();

    const s0 = parseFloat(mc().getAttribute('data-scale'));
    // Zoom in (deltaY < 0)
    fireEvent.wheel(canvas, { deltaY: -120, clientX: 100, clientY: 80 });
    const s1 = parseFloat(mc().getAttribute('data-scale'));
    expect(s1).toBeGreaterThan(s0);

    // Zoom out (deltaY > 0)
    fireEvent.wheel(canvas, { deltaY: 120, clientX: 100, clientY: 80 });
    const s2 = parseFloat(mc().getAttribute('data-scale'));
    expect(s2).toBeLessThanOrEqual(s1);
  });

  it('fits to content on mount when content exists', async () => {
    const ref = createRef();
    const props = baseProps();
    // Supply some content to trigger fitToContent effect
    props.tables = [
      { id: 1, x: 200, y: 150, width: 120, height: 80, shape: 'rectangle', seats: 6 },
    ];
    render(<SeatingPlanCanvas {...props} drawMode="pan" canvasRef={ref} />);

    const mc = () => screen.getByTestId('mock-seating-canvas');

    await waitFor(() => {
      const scale = parseFloat(mc().getAttribute('data-scale'));
      expect(scale).toBeGreaterThan(0.35);
      expect(scale).toBeLessThan(0.5); // ~0.4 given hall 1800x1200 and view 800x600
    });
  });
});
