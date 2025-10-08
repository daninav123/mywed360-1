import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

var setDocMock;
var getDocMock;
var getDocsMock;
var docMock;
var collectionMock;
var whereMock;
var queryMock;
var serverTimestampMock;
var onSnapshotMock;
var deleteFieldMock;

vi.mock('firebase/firestore', () => {
  setDocMock = vi.fn(() => Promise.resolve());
  getDocMock = vi.fn(() => Promise.resolve({ exists: () => false }));
  getDocsMock = vi.fn(async () => ({ docs: [] }));
  docMock = vi.fn((...path) => ({ path }));
  collectionMock = vi.fn(() => ({}));
  whereMock = vi.fn(() => ({}));
  queryMock = vi.fn(() => ({}));
  serverTimestampMock = vi.fn(() => '__serverTimestamp__');
  onSnapshotMock = vi.fn();
  deleteFieldMock = vi.fn(() => '__deleteField__');
  return {
    setDoc: setDocMock,
    getDoc: getDocMock,
    getDocs: getDocsMock,
    doc: docMock,
    collection: collectionMock,
    where: whereMock,
    query: queryMock,
    serverTimestamp: serverTimestampMock,
    onSnapshot: onSnapshotMock,
    deleteField: deleteFieldMock,
  };
});

var logEventMock;

vi.mock('../../services/PerformanceMonitor', () => {
  logEventMock = vi.fn();
  return {
    performanceMonitor: {
      logEvent: logEventMock,
    },
  };
});

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    currentUser: { uid: 'planner-1' },
  }),
}));

vi.mock('../../firebaseConfig', () => ({
  db: {},
  firebaseReady: Promise.resolve(),
}));

import WeddingProvider, { useWedding } from '../WeddingContext';

describe('WeddingContext setActiveWedding (flujo 10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sincroniza el activeWedding con Firestore y registra métricas', () => {
    const wrapper = ({ children }) => <WeddingProvider>{children}</WeddingProvider>;
    const { result } = renderHook(() => useWedding(), { wrapper });

    act(() => {
      result.current.setActiveWedding('wed-42');
    });

    const userDocCall = setDocMock.mock.calls.find(
      ([ref]) => Array.isArray(ref.path) && ref.path.length === 2 && ref.path[0] === 'users'
    );
    expect(userDocCall?.[1]).toMatchObject({
      activeWeddingId: 'wed-42',
      hasActiveWedding: true,
    });

    const subDocCall = setDocMock.mock.calls.find(
      ([ref]) =>
        Array.isArray(ref.path) &&
        ref.path.length === 4 &&
        ref.path[0] === 'users' &&
        ref.path[2] === 'weddings'
    );
    expect(subDocCall?.[1]).toMatchObject({
      active: true,
    });

    expect(logEventMock).toHaveBeenCalledWith(
      'wedding_switched',
      expect.objectContaining({
        fromWeddingId: null,
        toWeddingId: 'wed-42',
        userUid: 'planner-1',
      })
    );
  });

  it('desactiva la boda activa cuando se pasa un identificador vacío', () => {
    const wrapper = ({ children }) => <WeddingProvider>{children}</WeddingProvider>;
    const { result } = renderHook(() => useWedding(), { wrapper });

    act(() => {
      result.current.setActiveWedding('wed-42');
    });
    setDocMock.mockClear();
    logEventMock.mockClear();

    act(() => {
      result.current.setActiveWedding('');
    });

    expect(setDocMock).toHaveBeenCalledTimes(1);
    const userDocCall = setDocMock.mock.calls[0];
    expect(userDocCall?.[1]).toMatchObject({
      activeWeddingId: null,
      hasActiveWedding: false,
    });

    expect(logEventMock).toHaveBeenCalledWith(
      'wedding_switched',
      expect.objectContaining({
        fromWeddingId: 'wed-42',
        toWeddingId: null,
        userUid: 'planner-1',
      })
    );
  });
});
