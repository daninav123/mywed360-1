import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const navigateMock = vi.fn();
const setActiveWeddingMock = vi.fn();
var createWeddingMock;
var logEventMock;

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('../../context/WeddingContext', () => ({
  useWedding: () => ({
    activeWedding: 'wed-1',
    setActiveWedding: setActiveWeddingMock,
  }),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    currentUser: { uid: 'planner-1' },
    userProfile: { role: 'planner' },
  }),
}));

vi.mock('../../services/WeddingService', () => {
  createWeddingMock = vi.fn(() => Promise.resolve('new-wedding-id'));
  return {
    createWedding: createWeddingMock,
  };
});

vi.mock('../../services/PerformanceMonitor', () => {
  logEventMock = vi.fn();
  return {
    performanceMonitor: {
      logEvent: logEventMock,
    },
  };
});

vi.mock('../../components/WeddingFormModal', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ open, onSave, onClose }) => {
      const calledRef = React.useRef(false);
      React.useEffect(() => {
        if (open && !calledRef.current) {
          calledRef.current = true;
          void Promise.resolve(
            onSave({
              name: 'Nueva boda automatizada',
              date: '2025-01-01',
              location: 'Sevilla',
              banquetPlace: 'Hacienda X',
            })
          ).finally(() => {
            calledRef.current = false;
            onClose?.();
          });
        }
        if (!open) {
          calledRef.current = false;
        }
      }, [open, onSave, onClose]);
      return null;
    },
  };
});

vi.mock('firebase/firestore', () => {
  const collection = vi.fn();
  const query = vi.fn();
  const where = vi.fn();
  const onSnapshot = vi.fn();
  const doc = vi.fn((...path) => ({ path }));
  const setDoc = vi.fn(() => Promise.resolve());
  const updateDoc = vi.fn(() => Promise.resolve());
  const getDoc = vi.fn(() => Promise.resolve({ exists: () => false }));
  const serverTimestamp = vi.fn(() => '__serverTimestamp__');
  const deleteField = vi.fn(() => '__deleteField__');
  return {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    setDoc,
    updateDoc,
    getDoc,
    serverTimestamp,
    deleteField,
  };
});

import Bodas from '../Bodas';
import { onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

describe('Bodas page (flujo 10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onSnapshot.mockImplementation((q, callback) => {
      callback({
        docs: [
          {
            id: 'wed-1',
            data: () => ({
              name: 'Boda existente',
              weddingDate: '2025-06-20',
              location: 'Madrid',
              progress: 45,
              active: true,
              ownerIds: [],
              plannerIds: ['planner-1'],
            }),
          },
        ],
      });
      return () => {};
    });
    global.confirm = vi.fn(() => true);
    serverTimestamp.mockReturnValue('__serverTimestamp__');
  });

  it('crea una boda usando el servicio y actualiza el contexto', async () => {
    render(<Bodas />, { wrapper: ({ children }) => <>{children}</> });

    const createButton = await screen.findByRole('button', { name: /\+ Crear nueva boda/i });
    fireEvent.click(createButton);

    await waitFor(() =>
      expect(createWeddingMock).toHaveBeenCalledWith(
        'planner-1',
        expect.objectContaining({ name: 'Nueva boda automatizada' })
      )
    );

    expect(setActiveWeddingMock).toHaveBeenCalledWith('new-wedding-id');
    expect(navigateMock).toHaveBeenCalledWith('/bodas/new-wedding-id');
    expect(logEventMock).toHaveBeenCalledWith(
      'wedding_created',
      expect.objectContaining({
        weddingId: 'new-wedding-id',
        source: 'planner_dashboard',
      })
    );
  });

  it('archiva la boda activa y sincroniza Firestore', async () => {
    render(<Bodas />, { wrapper: ({ children }) => <>{children}</> });

    const archiveButton = await screen.findByRole('button', { name: 'Archivar' });
    fireEvent.click(archiveButton);

    await waitFor(() => expect(updateDoc).toHaveBeenCalled());

    expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
      active: false,
      archivedAt: '__serverTimestamp__',
    });

    expect(setDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        active: false,
      }),
      { merge: true }
    );

    expect(setActiveWeddingMock).toHaveBeenCalledWith('');
    expect(logEventMock).toHaveBeenCalledWith(
      'wedding_archived',
      expect.objectContaining({
        weddingId: 'wed-1',
        source: 'planner_dashboard',
      })
    );
  });
});
