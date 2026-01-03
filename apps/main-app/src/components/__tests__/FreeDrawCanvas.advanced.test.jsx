/* @vitest-environment jsdom */
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import FreeDrawCanvas from '../../components/FreeDrawCanvas.jsx';

function stubSvgRect(svg, { left = 0, top = 0, width = 800, height = 600 } = {}) {
  // jsdom doesn't lay out; stub bounding box for coordinate math
  Object.defineProperty(svg, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON: () => {},
    }),
  });
}

describe('FreeDrawCanvas advanced interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Make rAF immediate to simplify throttled pointerMove
    vi.stubGlobal('requestAnimationFrame', (cb) => cb(0));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('boundary: Tab abre prompt para fijar longitud exacta', async () => {
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
    stubSvgRect(svg);

    // Primer punto
    fireEvent.pointerDown(svg, { clientX: 10, clientY: 10 });
    // Mover el cursor para definir dirección
    fireEvent.pointerMove(svg, { clientX: 110, clientY: 10 });
    await new Promise((r) => setTimeout(r, 0));

    // Tab: fijar a 2.00 m => 200 cm a partir del último punto en misma dirección
    vi.spyOn(window, 'prompt').mockReturnValue('2.00');
    // esperar a que el handler de keydown esté vinculado tras el render/movimiento
    await Promise.resolve();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(window.prompt).toHaveBeenCalledTimes(1);
  });

  it('erase: dispara onDeleteArea al hacer click en un área', () => {
    const onDeleteArea = vi.fn();
    const poly = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
      { x: 0, y: 50 },
      { x: 0, y: 0 },
    ];
    const { container } = render(
      <FreeDrawCanvas
        drawMode="erase"
        areas={[poly]}
        scale={1}
        offset={{ x: 0, y: 0 }}
        onDeleteArea={onDeleteArea}
      />
    );
    const svg = container.querySelector('svg');
    stubSvgRect(svg);

    const areaPath = container.querySelector('path[data-area-type="poly"]');
    expect(areaPath).toBeTruthy();
    fireEvent.pointerDown(areaPath, { clientX: 10, clientY: 10 });

    expect(onDeleteArea).toHaveBeenCalledTimes(1);
    expect(onDeleteArea).toHaveBeenCalledWith(0);
  });

  it('line: con Shift hace snap horizontal/vertical', () => {
    const onFinalize = vi.fn();
    const { container } = render(
      <FreeDrawCanvas
        drawMode="line"
        areas={[]}
        scale={1}
        offset={{ x: 0, y: 0 }}
        onFinalize={onFinalize}
      />
    );
    const svg = container.querySelector('svg');
    stubSvgRect(svg);

    fireEvent.pointerDown(svg, { clientX: 100, clientY: 100 });
    // Desplazamiento más horizontal que vertical con Shift
    fireEvent.pointerMove(svg, { clientX: 200, clientY: 150, shiftKey: true });
    // Finalizar con Enter para usar los puntos ya calculados
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onFinalize).toHaveBeenCalledTimes(1);
    const payload = onFinalize.mock.calls[0][0];
    expect(payload.type).toBe('line');
    expect(payload.points).toHaveLength(2);
    // y final debe ser exactamente igual al y inicial (snap horizontal)
    expect(payload.points[1].y).toBeCloseTo(payload.points[0].y, 3);
  });

  it('rect: con Shift y movimiento vertical, fuerza x del cursor = x inicial', () => {
    const onFinalize = vi.fn();
    const { container } = render(
      <FreeDrawCanvas
        drawMode="rect"
        areas={[]}
        scale={1}
        offset={{ x: 0, y: 0 }}
        onFinalize={onFinalize}
      />
    );
    const svg = container.querySelector('svg');
    stubSvgRect(svg);

    fireEvent.pointerDown(svg, { clientX: 50, clientY: 50 });
    // Mucho más vertical que horizontal con Shift
    fireEvent.pointerMove(svg, { clientX: 60, clientY: 200, shiftKey: true });
    // Finalizar con Enter
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onFinalize).toHaveBeenCalledTimes(1);
    const payload = onFinalize.mock.calls[0][0];
    expect(payload.type).toBe('rect');
    expect(payload.points.length).toBeGreaterThanOrEqual(4);
    // El tercer punto (cur) debe tener misma x que el inicio (snap vertical)
    expect(payload.points[2].x).toBeCloseTo(payload.points[0].x, 3);
  });
});
