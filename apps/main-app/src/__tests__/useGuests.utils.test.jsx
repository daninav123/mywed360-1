import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// Mocks para aislar el hook
vi.mock('../hooks/useWeddingCollection', () => ({
  default: () => ({
    data: [],
    addItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));
vi.mock('../services/SyncService', () => ({
  subscribeSyncState: () => () => {},
  getSyncState: () => ({}),
}));
vi.mock('../services/whatsappBridge', () => ({
  ensureExtensionAvailable: vi.fn(),
  sendBatchMessages: vi.fn(),
}));
vi.mock('../services/whatsappService', () => ({
  toE164: (p) => p,
  waDeeplink: (p, m) => `wa:${p}?text=${encodeURIComponent(m)}`,
}));
vi.mock('../services/apiClient', () => ({
  post: vi.fn(),
}));

import useGuests from '../hooks/useGuests';

function GrabUtils({ onUtils }) {
  const { utils } = useGuests();
  React.useEffect(() => {
    onUtils(utils);
  }, [onUtils, utils]);
  return null;
}

describe('useGuests utils', () => {
  it('normalize trims and lowercases', async () => {
    let utilsRef = null;
    render(<GrabUtils onUtils={(u) => (utilsRef = u)} />);
    expect(utilsRef).toBeTruthy();
    expect(utilsRef.normalize('  HéLLo  ')).toBe('héllo');
  });

  it('normalizeStatus maps various inputs correctly', () => {
    let utilsRef = null;
    render(<GrabUtils onUtils={(u) => (utilsRef = u)} />);
    expect(utilsRef.normalizeStatus('accepted', '')).toBe('confirmed');
    expect(utilsRef.normalizeStatus('', 'sí')).toBe('confirmed');
    expect(utilsRef.normalizeStatus('', 'si')).toBe('confirmed');
    expect(utilsRef.normalizeStatus('', 'no')).toBe('declined');
    expect(utilsRef.normalizeStatus('unknown', '')).toBe('pending');
  });

  it('getStatusLabel returns labels for declined/pending', () => {
    let utilsRef = null;
    render(<GrabUtils onUtils={(u) => (utilsRef = u)} />);
    expect(utilsRef.getStatusLabel({ status: 'declined' })).toBe('No');
    expect(utilsRef.getStatusLabel({})).toBe('Pendiente');
  });
});

