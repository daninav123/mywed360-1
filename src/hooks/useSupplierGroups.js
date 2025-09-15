import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, onSnapshot, updateDoc, doc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useWedding } from '../context/WeddingContext';

/**
 * Gestiona grupos manuales de proveedores (unificar/separar tarjetas)
 * Estructura en Firestore: weddings/{weddingId}/supplierGroups/{groupId}
 *  { name, memberIds: string[], createdAt, updatedAt, notes? }
 * Además, setea `groupId` y `groupName` en cada proveedor miembro para facilitar UI.
 */
export default function useSupplierGroups() {
  const { activeWedding } = useWedding();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeWedding) return;
    const col = collection(db, 'weddings', activeWedding, 'supplierGroups');
    const unsub = onSnapshot(
      col,
      (snap) => {
        setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('Error leyendo supplierGroups:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [activeWedding]);

  const createGroup = useCallback(
    async ({ name, memberIds = [], notes = '' }) => {
      if (!activeWedding) return { success: false, error: 'No wedding' };
      if (!name || memberIds.length < 2) return { success: false, error: 'Nombre y al menos 2 proveedores' };
      try {
        const col = collection(db, 'weddings', activeWedding, 'supplierGroups');
        const now = serverTimestamp();
        const ref = await addDoc(col, { name, memberIds, notes, createdAt: now, updatedAt: now });
        // actualizar proveedores con groupId
        await Promise.all(
          memberIds.map((pid) =>
            updateDoc(doc(db, 'weddings', activeWedding, 'suppliers', pid), {
              groupId: ref.id,
              groupName: name,
              updated: serverTimestamp(),
            }).catch(() => {})
          )
        );
        return { success: true, id: ref.id };
      } catch (e) {
        console.error('Error creando grupo proveedores:', e);
        return { success: false, error: e.message };
      }
    },
    [activeWedding]
  );

  const dissolveGroup = useCallback(
    async (groupId) => {
      if (!activeWedding || !groupId) return { success: false, error: 'Missing params' };
      try {
        const gRef = doc(db, 'weddings', activeWedding, 'supplierGroups', groupId);
        const gSnap = await getDoc(gRef);
        const data = gSnap.exists() ? gSnap.data() : null;
        const memberIds = Array.isArray(data?.memberIds) ? data.memberIds : [];
        // limpiar groupId en proveedores
        await Promise.all(
          memberIds.map((pid) =>
            updateDoc(doc(db, 'weddings', activeWedding, 'suppliers', pid), {
              groupId: null,
              groupName: null,
              updated: serverTimestamp(),
            }).catch(() => {})
          )
        );
        await deleteDoc(gRef);
        return { success: true };
      } catch (e) {
        console.error('Error disolviendo grupo proveedores:', e);
        return { success: false, error: e.message };
      }
    },
    [activeWedding]
  );

  const removeMember = useCallback(
    async (groupId, memberId) => {
      if (!activeWedding || !groupId || !memberId) return { success: false, error: 'Missing params' };
      try {
        const gRef = doc(db, 'weddings', activeWedding, 'supplierGroups', groupId);
        const gSnap = await getDoc(gRef);
        if (!gSnap.exists()) return { success: false, error: 'Group not found' };
        const data = gSnap.data();
        const nextMembers = (data.memberIds || []).filter((id) => id !== memberId);
        await updateDoc(gRef, { memberIds: nextMembers, updatedAt: serverTimestamp() });
        await updateDoc(doc(db, 'weddings', activeWedding, 'suppliers', memberId), {
          groupId: null,
          groupName: null,
          updated: serverTimestamp(),
        });
        // si <2 miembros, disolver
        if (nextMembers.length < 2) {
          await deleteDoc(gRef);
        }
        return { success: true };
      } catch (e) {
        console.error('Error quitando miembro del grupo:', e);
        return { success: false, error: e.message };
      }
    },
    [activeWedding]
  );

  const addMembers = useCallback(
    async (groupId, memberIds = []) => {
      if (!activeWedding || !groupId || memberIds.length === 0) return { success: false, error: 'Missing params' };
      try {
        const gRef = doc(db, 'weddings', activeWedding, 'supplierGroups', groupId);
        const gSnap = await getDoc(gRef);
        if (!gSnap.exists()) return { success: false, error: 'Group not found' };
        const data = gSnap.data();
        const merged = Array.from(new Set([...(data.memberIds || []), ...memberIds]));
        await updateDoc(gRef, { memberIds: merged, updatedAt: serverTimestamp() });
        // set groupId en los nuevos miembros
        await Promise.all(
          memberIds.map((pid) =>
            updateDoc(doc(db, 'weddings', activeWedding, 'suppliers', pid), {
              groupId: gRef.id,
              groupName: data?.name || '',
              updated: serverTimestamp(),
            }).catch(() => {})
          )
        );
        return { success: true };
      } catch (e) {
        console.error('Error añadiendo miembros al grupo:', e);
        return { success: false, error: e.message };
      }
    },
    [activeWedding]
  );

  const updateGroup = useCallback(
    async (groupId, { name, notes }) => {
      if (!activeWedding || !groupId) return { success: false, error: 'Missing params' };
      try {
        const gRef = doc(db, 'weddings', activeWedding, 'supplierGroups', groupId);
        const snap = await getDoc(gRef);
        if (!snap.exists()) return { success: false, error: 'Group not found' };
        const data = snap.data();
        const newName = typeof name === 'string' ? name : data?.name || '';
        const newNotes = typeof notes === 'string' ? notes : data?.notes || '';
        await updateDoc(gRef, { name: newName, notes: newNotes, updatedAt: serverTimestamp() });
        // Propagar cambio de nombre a miembros
        const memberIds = Array.isArray(data?.memberIds) ? data.memberIds : [];
        await Promise.all(
          memberIds.map((pid) =>
            updateDoc(doc(db, 'weddings', activeWedding, 'suppliers', pid), {
              groupName: newName,
              updated: serverTimestamp(),
            }).catch(() => {})
          )
        );
        return { success: true };
      } catch (e) {
        console.error('Error actualizando grupo de proveedores:', e);
        return { success: false, error: e.message };
      }
    },
    [activeWedding]
  );

  return { groups, loading, error, createGroup, dissolveGroup, removeMember, addMembers, updateGroup };
}
