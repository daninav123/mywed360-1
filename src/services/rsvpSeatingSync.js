/**
 * RSVP-Seating Synchronization Service
 * Sincroniza confirmaciones RSVP con asignación de asientos
 * Sprint 5 - Sincronizar RSVP-Seating, S5-T001
 */

import { collection, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Estados de sincronización
 */
export const SYNC_STATUS = {
  SYNCED: 'synced',
  PENDING: 'pending',
  CONFLICT: 'conflict',
  ERROR: 'error'
};

/**
 * RSVPSeatingSync Service
 */
class RSVPSeatingSync {
  /**
   * Sincroniza un guest RSVP con su asiento
   */
  async syncGuestToSeating(weddingId, guestId) {
    try {
      // Obtener datos del guest
      const guestRef = doc(db, 'weddings', weddingId, 'guests', guestId);
      const guestDoc = await getDoc(guestRef);

      if (!guestDoc.exists()) {
        return { success: false, error: 'Guest not found' };
      }

      const guest = guestDoc.data();

      // Si no confirmó asistencia, remover de seating
      if (guest.status !== 'confirmed') {
        await this.removeGuestFromSeating(weddingId, guestId);
        return { success: true, action: 'removed', reason: 'not_confirmed' };
      }

      // Si confirmó, verificar que tenga asiento
      const hasSeating = await this.checkGuestHasSeating(weddingId, guestId);

      if (!hasSeating) {
        // Marcar como pendiente de asignar
        await this.markGuestNeedsSeating(weddingId, guestId);
        return { success: true, action: 'marked_pending', needsSeating: true };
      }

      // Actualizar datos del asiento con info del guest
      await this.updateSeatingFromGuest(weddingId, guestId, guest);

      return { success: true, action: 'synced' };
    } catch (error) {
      console.error('Error syncing guest to seating:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verifica si un guest tiene asiento asignado
   */
  async checkGuestHasSeating(weddingId, guestId) {
    try {
      const seatingQuery = query(
        collection(db, 'weddings', weddingId, 'seating'),
        where('guestId', '==', guestId)
      );

      const snapshot = await getDocs(seatingQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking guest seating:', error);
      return false;
    }
  }

  /**
   * Remueve guest del seating
   */
  async removeGuestFromSeating(weddingId, guestId) {
    try {
      const seatingQuery = query(
        collection(db, 'weddings', weddingId, 'seating'),
        where('guestId', '==', guestId)
      );

      const snapshot = await getDocs(seatingQuery);
      const batch = writeBatch(db);

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      // Log cambio
      await this.logSyncAction(weddingId, {
        action: 'remove_seating',
        guestId,
        reason: 'not_confirmed',
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error removing guest from seating:', error);
      return false;
    }
  }

  /**
   * Marca guest como pendiente de asiento
   */
  async markGuestNeedsSeating(weddingId, guestId) {
    try {
      const guestRef = doc(db, 'weddings', weddingId, 'guests', guestId);
      
      await updateDoc(guestRef, {
        needsSeating: true,
        seatingStatus: 'pending',
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error marking guest needs seating:', error);
      return false;
    }
  }

  /**
   * Actualiza datos del seating desde guest
   */
  async updateSeatingFromGuest(weddingId, guestId, guestData) {
    try {
      const seatingQuery = query(
        collection(db, 'weddings', weddingId, 'seating'),
        where('guestId', '==', guestId)
      );

      const snapshot = await getDocs(seatingQuery);

      if (snapshot.empty) return false;

      const batch = writeBatch(db);

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          guestName: guestData.name,
          guestEmail: guestData.email,
          dietary: guestData.allergens || [],
          companions: guestData.companions || [],
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();

      return true;
    } catch (error) {
      console.error('Error updating seating from guest:', error);
      return false;
    }
  }

  /**
   * Sincroniza todos los guests de una boda
   */
  async syncAllGuests(weddingId) {
    try {
      const guestsSnapshot = await getDocs(
        collection(db, 'weddings', weddingId, 'guests')
      );

      const results = {
        total: guestsSnapshot.size,
        synced: 0,
        removed: 0,
        needsSeating: 0,
        errors: 0
      };

      for (const guestDoc of guestsSnapshot.docs) {
        const result = await this.syncGuestToSeating(weddingId, guestDoc.id);
        
        if (result.success) {
          if (result.action === 'synced') results.synced++;
          else if (result.action === 'removed') results.removed++;
          else if (result.needsSeating) results.needsSeating++;
        } else {
          results.errors++;
        }
      }

      // Guardar resultado de sincronización
      await this.saveSyncReport(weddingId, results);

      return results;
    } catch (error) {
      console.error('Error syncing all guests:', error);
      throw error;
    }
  }

  /**
   * Sincroniza asientos a guests (dirección inversa)
   */
  async syncSeatingToGuests(weddingId) {
    try {
      const seatingSnapshot = await getDocs(
        collection(db, 'weddings', weddingId, 'seating')
      );

      const results = {
        total: seatingSnapshot.size,
        updated: 0,
        created: 0,
        errors: 0
      };

      for (const seatingDoc of seatingSnapshot.docs) {
        const seating = seatingDoc.data();
        
        if (!seating.guestId) continue;

        try {
          const guestRef = doc(db, 'weddings', weddingId, 'guests', seating.guestId);
          const guestDoc = await getDoc(guestRef);

          if (guestDoc.exists()) {
            // Actualizar guest existente
            await updateDoc(guestRef, {
              hasSeating: true,
              seatingAssigned: true,
              tableId: seating.tableId,
              seatNumber: seating.seatNumber,
              updatedAt: serverTimestamp()
            });
            results.updated++;
          } else {
            // Crear guest desde seating (caso raro)
            await setDoc(guestRef, {
              name: seating.guestName,
              email: seating.guestEmail || '',
              status: 'pending',
              hasSeating: true,
              tableId: seating.tableId,
              seatNumber: seating.seatNumber,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            results.created++;
          }
        } catch (error) {
          console.error('Error syncing seating to guest:', error);
          results.errors++;
        }
      }

      return results;
    } catch (error) {
      console.error('Error syncing seating to guests:', error);
      throw error;
    }
  }

  /**
   * Detecta conflictos de sincronización
   */
  async detectConflicts(weddingId) {
    try {
      const conflicts = [];

      // Conflicto 1: Guests confirmados sin asiento
      const confirmedQuery = query(
        collection(db, 'weddings', weddingId, 'guests'),
        where('status', '==', 'confirmed')
      );
      const confirmedSnapshot = await getDocs(confirmedQuery);

      for (const guestDoc of confirmedSnapshot.docs) {
        const hasSeating = await this.checkGuestHasSeating(weddingId, guestDoc.id);
        if (!hasSeating) {
          conflicts.push({
            type: 'missing_seating',
            guestId: guestDoc.id,
            guestName: guestDoc.data().name,
            severity: 'high'
          });
        }
      }

      // Conflicto 2: Asientos sin guest
      const seatingSnapshot = await getDocs(
        collection(db, 'weddings', weddingId, 'seating')
      );

      for (const seatingDoc of seatingSnapshot.docs) {
        const seating = seatingDoc.data();
        if (seating.guestId) {
          const guestRef = doc(db, 'weddings', weddingId, 'guests', seating.guestId);
          const guestDoc = await getDoc(guestRef);

          if (!guestDoc.exists()) {
            conflicts.push({
              type: 'orphan_seating',
              seatingId: seatingDoc.id,
              guestId: seating.guestId,
              severity: 'medium'
            });
          } else if (guestDoc.data().status !== 'confirmed') {
            conflicts.push({
              type: 'seating_not_confirmed',
              guestId: seating.guestId,
              guestName: guestDoc.data().name,
              status: guestDoc.data().status,
              severity: 'low'
            });
          }
        }
      }

      return conflicts;
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      throw error;
    }
  }

  /**
   * Resuelve conflicto automáticamente
   */
  async resolveConflict(weddingId, conflict, resolution) {
    try {
      switch (conflict.type) {
        case 'missing_seating':
          if (resolution === 'auto_assign') {
            // Buscar mesa disponible
            const tableId = await this.findAvailableTable(weddingId);
            if (tableId) {
              await this.assignGuestToTable(weddingId, conflict.guestId, tableId);
              return { success: true, action: 'assigned' };
            }
          }
          break;

        case 'orphan_seating':
          if (resolution === 'remove') {
            const seatingRef = doc(db, 'weddings', weddingId, 'seating', conflict.seatingId);
            await seatingRef.delete();
            return { success: true, action: 'removed' };
          }
          break;

        case 'seating_not_confirmed':
          if (resolution === 'remove_seating') {
            await this.removeGuestFromSeating(weddingId, conflict.guestId);
            return { success: true, action: 'removed' };
          }
          break;
      }

      return { success: false, error: 'Resolution not supported' };
    } catch (error) {
      console.error('Error resolving conflict:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Busca mesa disponible
   */
  async findAvailableTable(weddingId) {
    // TODO: Implementar lógica de búsqueda de mesa disponible
    // Por ahora retorna null
    return null;
  }

  /**
   * Asigna guest a mesa
   */
  async assignGuestToTable(weddingId, guestId, tableId) {
    // TODO: Implementar asignación
    return false;
  }

  /**
   * Guarda log de acción de sincronización
   */
  async logSyncAction(weddingId, actionData) {
    try {
      const logRef = collection(db, 'weddings', weddingId, 'syncLogs');
      await setDoc(doc(logRef), {
        ...actionData,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging sync action:', error);
    }
  }

  /**
   * Guarda reporte de sincronización
   */
  async saveSyncReport(weddingId, results) {
    try {
      const reportRef = doc(db, 'weddings', weddingId, 'syncReports', 'latest');
      await setDoc(reportRef, {
        ...results,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving sync report:', error);
    }
  }
}

// Instancia singleton
const rsvpSeatingSync = new RSVPSeatingSync();

export default rsvpSeatingSync;

/**
 * Hook de React para sincronización
 */
export function useRSVPSeatingSync(weddingId) {
  const [syncing, setSyncing] = React.useState(false);
  const [conflicts, setConflicts] = React.useState([]);
  const [lastSync, setLastSync] = React.useState(null);

  const syncAll = React.useCallback(async () => {
    try {
      setSyncing(true);
      const results = await rsvpSeatingSync.syncAllGuests(weddingId);
      setLastSync(new Date());
      return results;
    } catch (error) {
      console.error('Error syncing:', error);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [weddingId]);

  const detectConflicts = React.useCallback(async () => {
    try {
      const detected = await rsvpSeatingSync.detectConflicts(weddingId);
      setConflicts(detected);
      return detected;
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      throw error;
    }
  }, [weddingId]);

  const resolveConflict = React.useCallback(async (conflict, resolution) => {
    try {
      const result = await rsvpSeatingSync.resolveConflict(weddingId, conflict, resolution);
      if (result.success) {
        // Actualizar lista de conflictos
        setConflicts(prev => prev.filter(c => c !== conflict));
      }
      return result;
    } catch (error) {
      console.error('Error resolving conflict:', error);
      throw error;
    }
  }, [weddingId]);

  return {
    syncing,
    conflicts,
    lastSync,
    syncAll,
    detectConflicts,
    resolveConflict,
    rsvpSeatingSync
  };
}
