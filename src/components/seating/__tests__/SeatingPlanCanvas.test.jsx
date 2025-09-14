/* @vitest-environment jsdom */
import React, { createRef } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';

// Mock SeatingCanvas to surface scale/offset for assertions
vi.mock('../../../features/seating/SeatingCanvas', () => ({
  default: (props) => (
    <div
      data-testid="mock-seating-canvas"
      data-scale={props.scale}
      data-offset-x={props.offset?.x}
      data-offset-y={props.offset?.y}
    />
  )
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
});

