/**
 * Tests extendidos para la funcionalidad de undo/redo y exportación
 * del hook useSeatingPlan.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSeatingPlan } from '../hooks/useSeatingPlan';

// Mocks compartidos (los mismos que en useSeatingPlan.test.jsx)
vi.mock('../firebaseConfig', () => ({ db: {} }));
vi.mock('../services/SyncService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
  subscribeSyncState: vi.fn(() => () => {}),
  getSyncState: vi.fn(() => ({ status: 'synced' }))
}));
vi.mock('../context/WeddingContext', () => ({
  useWedding: () => ({ activeWedding: 'test-wedding-id' })
}));

const mockCanvas = {
  toDataURL: vi.fn(() => 'data:image/png;base64,test')
};

vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve(mockCanvas))
}));

const mockPdfInstance = { addImage: vi.fn(), addPage: vi.fn(), save: vi.fn() };
vi.mock('jspdf', () => ({ default: vi.fn(() => mockPdfInstance) }));

// Helper para simular un <a> click sin manipular el DOM real
const createElementSpy = vi.spyOn(document, 'createElement');
createElementSpy.mockImplementation((tag) => {
  if (tag === 'a') {
    return { click: vi.fn() };
  }
  return document.createElement(tag);
});

describe('useSeatingPlan Hook – undo/redo & export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permite deshacer y rehacer cambios en el historial', () => {
    const { result } = renderHook(() => useSeatingPlan());

    // Añadimos dos snapshots diferentes
    act(() => {
      result.current.pushHistory({ type: 'snapshot-1', foo: 1 });
      result.current.pushHistory({ type: 'snapshot-2', foo: 2 });
    });

    // Debe poder deshacer
    expect(result.current.canUndo).toBe(true);

    let prev;
    act(() => {
      prev = result.current.undo();
    });
    expect(prev).toMatchObject({ type: 'snapshot-1' });
    expect(result.current.canRedo).toBe(true);

    let next;
    act(() => {
      next = result.current.redo();
    });
    expect(next).toMatchObject({ type: 'snapshot-2' });
  });

  it('exportPNG invoca html2canvas y genera enlace', async () => {
    const { result } = renderHook(() => useSeatingPlan());

    // Inyectamos un ref de canvas simulado
    const fakeDiv = document.createElement('div');
    result.current.canvasRef.current = fakeDiv;

    await act(async () => {
      await result.current.exportPNG();
    });

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockCanvas.toDataURL).toHaveBeenCalled();
  });

  it('exportPDF invoca html2canvas y jspdf', async () => {
    const { result } = renderHook(() => useSeatingPlan());

    const fakeDiv = document.createElement('div');
    fakeDiv.height = 1000;
    fakeDiv.width = 1000;
    result.current.canvasRef.current = fakeDiv;

    await act(async () => {
      await result.current.exportPDF();
    });

    expect(mockCanvas.toDataURL).toHaveBeenCalled();
    expect(mockPdfInstance.addImage).toHaveBeenCalled();
    expect(mockPdfInstance.save).toHaveBeenCalled();
  });
});
