import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const navigateMock = vi.fn();
const setActiveWeddingMock = vi.fn();
var logEventMock;

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'wed-1' }),
  useNavigate: () => navigateMock,
}));

vi.mock('../../context/WeddingContext', () => ({
  useWedding: () => ({
    activeWedding: 'wed-1',
    setActiveWedding: setActiveWeddingMock,
  }),
}));

vi.mock('../../services/PerformanceMonitor', () => {
  logEventMock = vi.fn();
  return {
    performanceMonitor: {
      logEvent: logEventMock,
    },
  };
});

const snapshotData = {
  name: 'Boda Activa',
  weddingDate: '2025-06-20',
  location: 'Madrid',
  progress: 50,
  guests: [],
  tasks: [],
  suppliers: [],
  designs: [],
  documents: [],
  active: true,
};

vi.mock('firebase/firestore', () => {
  const doc = vi.fn(() => ({}));
  const onSnapshot = vi.fn((ref, handler) => {
    handler({
      id: 'wed-1',
      exists: () => true,
      data: () => snapshotData,
    });
    return () => {};
  });
  const updateDoc = vi.fn(() => Promise.resolve());
  const serverTimestamp = vi.fn(() => '__serverTimestamp__');
  const deleteField = vi.fn(() => '__deleteField__');
  return {
    doc,
    onSnapshot,
    updateDoc,
    serverTimestamp,
    deleteField,
  };
});

import BodaDetalle from '../BodaDetalle';
import { onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';

describe('BodaDetalle (flujo 10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onSnapshot.mockImplementation((ref, handler) => {
      handler({
        id: 'wed-1',
        exists: () => true,
        data: () => snapshotData,
      });
      return () => {};
    });
    global.confirm = vi.fn(() => true);
    serverTimestamp.mockReturnValue('__serverTimestamp__');
  });

  it('permite archivar una boda desde el detalle y registra métricas', async () => {
    render(<BodaDetalle />);

    const archiveButton = await screen.findByRole('button', { name: 'Archivar' });
    fireEvent.click(archiveButton);

    await waitFor(() => expect(updateDoc).toHaveBeenCalled());

    expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
      active: false,
      archivedAt: '__serverTimestamp__',
    });

    expect(setActiveWeddingMock).toHaveBeenCalledWith('');
    expect(logEventMock).toHaveBeenCalledWith(
      'wedding_archived',
      expect.objectContaining({
        weddingId: 'wed-1',
        source: 'wedding_detail',
      })
    );

    await waitFor(() => expect(screen.getByText('Archivada')).toBeInTheDocument());
  });
});
