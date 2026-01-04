/**
 * Hook para sincronización bidireccional Seating ↔ Invitados (PostgreSQL)
 * Usa API endpoints existentes en lugar de Firebase
 */

import { useCallback, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004/api';
const SYNC_EVENT = 'mywed360-seating-sync';

export function useSeatingSync(weddingId, options = {}) {
  const {
    enabled = true,
    onSyncComplete = null,
    onSyncError = null,
  } = options;

  const isSyncingRef = useRef(false);

  // Sincroniza cambio desde Seating Plan → Invitados
  const syncSeatingToGuest = useCallback(async (guestId, seatAssignment) => {
    if (!enabled || !weddingId) return;

    try {
      const token = localStorage.getItem('authToken');
      
      await axios.put(
        `${API_URL}/guests/${guestId}`,
        {
          seatAssignment: seatAssignment || null,
          tableId: seatAssignment?.tableId || null,
          table: seatAssignment?.tableName || null,
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      window.dispatchEvent(new CustomEvent(SYNC_EVENT, {
        detail: { source: 'seating', guestId, seatAssignment },
      }));

      if (onSyncComplete) onSyncComplete();
    } catch (error) {
      console.error('[useSeatingSync] Error syncing seating to guest:', error);
      if (onSyncError) onSyncError(error);
    }
  }, [enabled, weddingId, onSyncComplete, onSyncError]);

  // Sincroniza cambio desde Invitados → Seating Plan
  const syncGuestToSeating = useCallback(async (guestId, seatAssignment) => {
    if (!enabled || !weddingId) return;

    try {
      const token = localStorage.getItem('authToken');
      
      await axios.put(
        `${API_URL}/seating-plan/${weddingId}/sync-guest`,
        { guestId, seatAssignment },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      window.dispatchEvent(new CustomEvent(SYNC_EVENT, {
        detail: { source: 'guests', guestId, seatAssignment },
      }));

      if (onSyncComplete) onSyncComplete();
    } catch (error) {
      console.error('[useSeatingSync] Error syncing guest to seating:', error);
      if (onSyncError) onSyncError(error);
    }
  }, [enabled, weddingId, onSyncComplete, onSyncError]);

  // Sincronización completa (reconstruye seating desde guests)
  const fullSync = useCallback(async () => {
    if (!enabled || !weddingId || isSyncingRef.current) return;

    isSyncingRef.current = true;
    
    try {
      const token = localStorage.getItem('authToken');
      
      await axios.post(
        `${API_URL}/seating-plan/${weddingId}/full-sync`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      window.dispatchEvent(new CustomEvent(SYNC_EVENT, {
        detail: { source: 'full-sync' },
      }));

      if (onSyncComplete) onSyncComplete();
    } catch (error) {
      console.error('[useSeatingSync] Error in full sync:', error);
      if (onSyncError) onSyncError(error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [enabled, weddingId, onSyncComplete, onSyncError]);

  return {
    syncSeatingToGuest,
    syncGuestToSeating,
    fullSync,
    isSupported: true,
  };
}

export default useSeatingSync;
