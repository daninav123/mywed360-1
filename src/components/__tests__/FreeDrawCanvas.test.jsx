/* @vitest-environment jsdom */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import FreeDrawCanvas from '../../components/FreeDrawCanvas.jsx';

describe('FreeDrawCanvas', () => {
  test('finalizes free draw with object payload on double click', () => {
    const onFinalize = vi.fn();
    const { container } = render(
      <FreeDrawCanvas
        drawMode="free"
        areas={[]}
        scale={1}
        offset={{ x: 0, y: 0 }}
        onFinalize={onFinalize}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();

    // Simulate a short stroke
    fireEvent.pointerDown(svg, { clientX: 10, clientY: 10 });
    fireEvent.pointerMove(svg, { clientX: 20, clientY: 20 });
    fireEvent.pointerMove(svg, { clientX: 30, clientY: 30 });
    fireEvent.pointerUp(svg, { clientX: 30, clientY: 30 });

    // Double click to finalize
    fireEvent.doubleClick(svg);

    expect(onFinalize).toHaveBeenCalledTimes(1);
    const payload = onFinalize.mock.calls[0][0];
    expect(payload).toBeTruthy();
    expect(payload.type).toBe('free');
    expect(Array.isArray(payload.points)).toBe(true);
    expect(payload.points.length).toBeGreaterThan(0);
  });

  test('finalizes boundary on Enter with closed polygon', () => {
    const onFinalize = vi.fn();
    const { container } = render(
      <FreeDrawCanvas
        drawMode="boundary"
        areas={[]}
        scale={1}
        offset={{ x: 0, y: 0 }}
        onFinalize={onFinalize}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();

    // Add three points (clicks add points in boundary mode)
    fireEvent.pointerDown(svg, { clientX: 10, clientY: 10 });
    fireEvent.pointerDown(svg, { clientX: 60, clientY: 10 });
    fireEvent.pointerDown(svg, { clientX: 60, clientY: 60 });

    // Press Enter to finalize
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(onFinalize).toHaveBeenCalledTimes(1);
    const payload = onFinalize.mock.calls[0][0];
    expect(payload.type).toBe('boundary');
    expect(Array.isArray(payload.points)).toBe(true);
    // Should be closed: first equals last
    const first = payload.points[0];
    const last = payload.points[payload.points.length - 1];
    expect(first.x).toBeCloseTo(last.x);
    expect(first.y).toBeCloseTo(last.y);
  });
});
