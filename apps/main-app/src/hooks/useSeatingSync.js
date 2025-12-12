/**
 * Hook para sincronización bidireccional Seating ↔ Invitados
 * 
 * Mantiene consistencia entre:
 * - weddings/{id}/guests/{guestId}.seatAssignment
 * - weddings/{id}/seatingPlan/banquet.tables[].seats[].guestId
 */

import { useEffect, useCallback, useRef } from 'react';
import { db } from '../services/firebase';
import { doc, updateDoc, getDoc, collection, getDocs, writeBatch } from 'firebase/firestore';

const SYNC_EVENT = 'mywed360-seating-sync';
const DEBOUNCE_MS = 500;

/**
 * Hook de sincronización bidireccional
 * 
 * @param {string} weddingId - ID de la boda
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Funciones de sincronización
 */
export function useSeatingSync(weddingId, options = {}) {
  const {
    enabled = true,
    autoSync = true,
    onSyncComplete = null,
    onSyncError = null,
  } = options;

  const debounceTimerRef = useRef(null);
  const isSyncingRef = useRef(false);

  /**
   * Sincroniza cambio desde Seating Plan → Invitados
   * Actualiza guest.seatAssignment cuando se asigna una mesa
   */
  const syncSeatingToGuest = useCallback(async (guestId, seatAssignment) => {
    if (!enabled || !weddingId) return;

    try {
      // console.log('[useSeatingSync] Sincronizando Seating → Guest', { guestId, seatAssignment });

      const guestRef = doc(db, 'weddings', weddingId, 'guests', guestId);
      
      await updateDoc(guestRef, {
        seatAssignment: seatAssignment || null,
        tableId: seatAssignment?.tableId || null,
        table: seatAssignment?.tableName || null, // Legacy field
        updatedAt: new Date().toISOString(),
        lastSyncedFrom: 'seating',
      });

      // console.log('[useSeatingSync] ✅ Guest actualizado');

      // Emitir evento para que otros componentes se actualicen
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, {
        detail: { source: 'seating', guestId, seatAssignment },
      }));

      onSyncComplete?.({ source: 'seating', guestId });
    } catch (error) {
      // console.error('[useSeatingSync] Error sincronizando a guest:', error);
      onSyncError?.({ source: 'seating', guestId, error });
      throw error;
    }
  }, [weddingId, enabled, onSyncComplete, onSyncError]);

  /**
   * Sincroniza cambio desde Invitados → Seating Plan
   * Actualiza tabla cuando se cambia mesa desde lista de invitados
   */
  const syncGuestToSeating = useCallback(async (guestId, seatAssignment) => {
    if (!enabled || !weddingId) return;

    try {
      // console.log('[useSeatingSync] Sincronizando Guest → Seating', { guestId, seatAssignment });

      const seatingRef = doc(db, 'weddings', weddingId, 'seatingPlan', 'banquet');
      const seatingSnap = await getDoc(seatingRef);

      if (!seatingSnap.exists()) {
        // console.warn('[useSeatingSync] Seating plan no existe, creando...');
        await updateDoc(seatingRef, {
          tables: [],
          updatedAt: new Date().toISOString(),
        });
        return;
      }

      const seatingData = seatingSnap.data();
      let tables = seatingData.tables || [];
      let updated = false;

      // Remover guest de su mesa anterior
      tables = tables.map(table => ({
        ...table,
        seats: (table.seats || []).map(seat => {
          if (seat.guestId === guestId) {
            return { ...seat, guestId: null, occupied: false };
          }
          return seat;
        }),
      }));

      // Si hay nueva asignación, agregar a nueva mesa
      if (seatAssignment?.tableId) {
        const tableIndex = tables.findIndex(t => t.id === seatAssignment.tableId);
        
        if (tableIndex !== -1) {
          const table = tables[tableIndex];
          const availableSeatIndex = (table.seats || []).findIndex(s => !s.occupied);

          if (availableSeatIndex !== -1) {
            tables[tableIndex].seats[availableSeatIndex] = {
              ...tables[tableIndex].seats[availableSeatIndex],
              guestId,
              occupied: true,
            };
            updated = true;
          } else {
            // console.warn('[useSeatingSync] Mesa llena, no se puede asignar');
            throw new Error('Mesa llena');
          }
        } else {
          // console.warn('[useSeatingSync] Mesa no encontrada:', seatAssignment.tableId);
        }
      } else {
        updated = true; // Remoción exitosa
      }

      if (updated) {
        await updateDoc(seatingRef, {
          tables,
          updatedAt: new Date().toISOString(),
          lastSyncedFrom: 'guests',
        });

        // console.log('[useSeatingSync] ✅ Seating plan actualizado');

        // Emitir evento
        window.dispatchEvent(new CustomEvent(SYNC_EVENT, {
          detail: { source: 'guests', guestId, seatAssignment },
        }));

        onSyncComplete?.({ source: 'guests', guestId });
      }
    } catch (error) {
      // console.error('[useSeatingSync] Error sincronizando a seating:', error);
      onSyncError?.({ source: 'guests', guestId, error });
      throw error;
    }
  }, [weddingId, enabled, onSyncComplete, onSyncError]);

  /**
   * Sincronización masiva: verifica consistencia y corrige discrepancias
   */
  const syncAll = useCallback(async () => {
    if (!enabled || !weddingId || isSyncingRef.current) return;

    isSyncingRef.current = true;

    try {
      // console.log('[useSeatingSync] Iniciando sincronización masiva...');

      const [guestsSnap, seatingSnap] = await Promise.all([
        getDocs(collection(db, 'weddings', weddingId, 'guests')),
        getDoc(doc(db, 'weddings', weddingId, 'seatingPlan', 'banquet')),
      ]);

      const guests = {};
      guestsSnap.docs.forEach(doc => {
        guests[doc.id] = { id: doc.id, ...doc.data() };
      });

      const seatingData = seatingSnap.exists() ? seatingSnap.data() : { tables: [] };
      const tables = seatingData.tables || [];

      // Construir mapa de asignaciones desde seating
      const seatingAssignments = {};
      tables.forEach(table => {
        (table.seats || []).forEach(seat => {
          if (seat.guestId) {
            seatingAssignments[seat.guestId] = {
              tableId: table.id,
              tableName: table.name,
              seatIndex: seat.index || 0,
            };
          }
        });
      });

      // Detectar discrepancias
      const batch = writeBatch(db);
      let changesCount = 0;

      Object.entries(guests).forEach(([guestId, guest]) => {
        const seatingAssignment = seatingAssignments[guestId];
        const guestAssignment = guest.seatAssignment;

        const seatingTableId = seatingAssignment?.tableId;
        const guestTableId = guestAssignment?.tableId;

        // Si difieren, usar seating como fuente de verdad
        if (seatingTableId !== guestTableId) {
          const guestRef = doc(db, 'weddings', weddingId, 'guests', guestId);
          
          batch.update(guestRef, {
            seatAssignment: seatingAssignment || null,
            tableId: seatingTableId || null,
            table: seatingAssignment?.tableName || null,
            updatedAt: new Date().toISOString(),
            lastSyncedFrom: 'seating',
          });

          changesCount++;
          // console.log('[useSeatingSync] Corrigiendo guest:', guestId, { from: guestTableId, to: seatingTableId });
        }
      });

      if (changesCount > 0) {
        await batch.commit();
        // console.log(`[useSeatingSync] ✅ ${changesCount} invitados sincronizados`);
      } else {
        // console.log('[useSeatingSync] ✅ No hay discrepancias');
      }

      onSyncComplete?.({ type: 'full', changesCount });
      
      return { success: true, changesCount };
    } catch (error) {
      // console.error('[useSeatingSync] Error en sincronización masiva:', error);
      onSyncError?.({ type: 'full', error });
      throw error;
    } finally {
      isSyncingRef.current = false;
    }
  }, [weddingId, enabled, onSyncComplete, onSyncError]);

  /**
   * Sincronización con debounce para evitar múltiples llamadas
   */
  const debouncedSyncAll = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      syncAll();
    }, DEBOUNCE_MS);
  }, [syncAll]);

  /**
   * Escuchar eventos de sincronización de otros componentes
   */
  useEffect(() => {
    if (!autoSync || !enabled) return;

    const handleSyncEvent = (event) => {
      const { source } = event.detail;
      // console.log('[useSeatingSync] Evento de sincronización detectado:', source);
      
      // No reaccionar a eventos propios para evitar loops
      if (source === 'auto-sync') return;

      debouncedSyncAll();
    };

    window.addEventListener(SYNC_EVENT, handleSyncEvent);

    return () => {
      window.removeEventListener(SYNC_EVENT, handleSyncEvent);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [autoSync, enabled, debouncedSyncAll]);

  /**
   * Sincronización inicial al montar
   */
  useEffect(() => {
    if (autoSync && enabled && weddingId) {
      // Esperar 2 segundos antes de primera sincronización
      const timer = setTimeout(() => {
        syncAll();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [weddingId, autoSync, enabled]); // Solo ejecutar al montar

  return {
    syncSeatingToGuest,
    syncGuestToSeating,
    syncAll,
    isSyncing: isSyncingRef.current,
  };
}

export default useSeatingSync;
