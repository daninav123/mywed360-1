// Hook de Gestión del plan de asientos
import {
  collection,
  deleteDoc,
  doc as fsDoc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';

import { useWedding } from '../context/WeddingContext';
import { useUserContext } from '../context/UserContext';
import { db } from '../firebaseConfig';
import {
  createTableFromType,
  sanitizeTable,
  updateTableWithField,
  inferTableType,
} from '../utils/seatingTables';
import { generateAutoLayout, analyzeGuestAssignments } from '../utils/seatingLayoutGenerator';
import useGuests from './useGuests';

// Utilidad para normalizar IDs de mesas
export const normalizeId = (id) => {
  const num = parseInt(id, 10);
  return !isNaN(num) ? num : id;
};

export const useSeatingPlan = () => {
  const { activeWedding } = useWedding();

  // Obtener invitados reales de la gestión de invitados ✨
  const { guests: guestsFromManagement, updateGuest: updateGuestInManagement } = useGuests();

  // Detectar entorno de test (Cypress o Vitest) para evitar persistencia en Firestore
  const isVitest =
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      (import.meta.env.MODE === 'test' || import.meta.env.VITEST)) ||
    (typeof globalThis !== 'undefined' && !!globalThis.vi);
  const isTestEnv = (typeof window !== 'undefined' && !!window.Cypress) || isVitest;
  const canPersist = !!db && !isTestEnv;
  const { user: authUser } = useUserContext() || {};
  const currentUser = authUser || {};
  const currentUserId = currentUser.uid || 'anonymous';
  const currentUserName = currentUser.displayName || currentUser.email || 'Colaborador';
  const collabClientIdRef = useRef(null);
  if (!collabClientIdRef.current) {
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        collabClientIdRef.current = crypto.randomUUID();
      } else {
        collabClientIdRef.current = `client-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }
    } catch {
      collabClientIdRef.current = `client-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
  }
  const collaboratorPalette = [
    '#2563eb',
    '#fb7185',
    '#10b981',
    '#f97316',
    '#9333ea',
    '#0ea5e9',
    '#facc15',
    '#ec4899',
  ];
  const computeColorIndex = (seed) => {
    if (!seed) return 0;
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0; // eslint-disable-line no-bitwise
    }
    return Math.abs(hash) % collaboratorPalette.length;
  };
  const collaboratorColorRef = useRef(null);
  if (!collaboratorColorRef.current) {
    const seed = currentUserId || collabClientIdRef.current;
    collaboratorColorRef.current = collaboratorPalette[computeColorIndex(seed)];
  }
  const getLocalStorage = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
    } catch (_) {}
    return null;
  };
  const localStorageRef = getLocalStorage();
  const makeStorageKey = (suffix) => `seatingPlan:${activeWedding || 'default'}:${suffix}`;
  const pendingWritesRef = useRef({ ceremony: false, banquet: false });
  const [collaborators, setCollaborators] = useState([]);
  const [collaborationStatus, setCollaborationStatus] = useState(
    canPersist ? 'connecting' : 'offline'
  );
  const [locks, setLocks] = useState([]);
  const locksRef = useRef(new Map());
  const [lockEvent, setLockEvent] = useState(null);
  const emitLockEvent = useCallback((event) => {
    setLockEvent(event);
  }, []);
  const consumeLockEvent = useCallback(() => setLockEvent(null), []);
  const LOCK_TTL_MS = 60000; // Aumentado de 45s a 60s
  const LOCK_HEARTBEAT_MS = 30000; // Aumentado de 15s a 30s (reduce escrituras Firestore)
  const activeLockIntervalsRef = useRef(new Map());
  const ownedLocksRef = useRef(new Set());
  const [specialMomentsData, setSpecialMomentsData] = useState(null);
  const specialMomentsUnsubRef = useRef(null);
  const [tab, setTab] = useState('banquet');

  const buildBlocksFromMoments = (moments = {}) => {
    return Object.keys(moments || {})
      .filter((key) => key !== 'blocks' && key !== 'migratedFrom' && key !== 'updatedAt')
      .map((key) => ({
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
      }));
  };

  const normalizeSpecialMoments = (moments = {}) => {
    const normalized = {};
    Object.entries(moments || {}).forEach(([blockId, list]) => {
      if (blockId === 'blocks') return;
      const safeList = Array.isArray(list) ? list : [];
      normalized[blockId] = safeList.map((moment) => {
        const recipientId =
          moment && moment.recipientId != null && moment.recipientId !== ''
            ? String(moment.recipientId)
            : '';
        const recipientName =
          moment && moment.recipientName != null ? String(moment.recipientName) : '';
        return {
          ...moment,
          recipientId,
          recipientName,
        };
      });
    });
    return normalized;
  };

  const readLocalState = (suffix) => {
    if (!localStorageRef) return null;
    try {
      const raw = localStorageRef.getItem(makeStorageKey(suffix));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  };
  const writeLocalState = (suffix, value) => {
    if (!localStorageRef) return;
    try {
      if (value === null) {
        localStorageRef.removeItem(makeStorageKey(suffix));
        return;
      }
      localStorageRef.setItem(makeStorageKey(suffix), JSON.stringify(value));
    } catch (_) {}
  };

  const markPendingWrite = (key) => {
    pendingWritesRef.current[key] = true;
  };

  const shouldSkipSnapshot = (key, meta = {}) => {
    const lastEditor = meta?.lastEditor;
    const fromSelf = lastEditor && lastEditor === collabClientIdRef.current;
    const hadPending = pendingWritesRef.current[key];
    pendingWritesRef.current[key] = false;
    return fromSelf && hadPending;
  };

  const buildLockDocRef = (type, id) =>
    fsDoc(db, 'weddings', activeWedding, 'seatingLocks', `${type}-${id}`);

  const clearLockHeartbeat = (key) => {
    const heartbeat = activeLockIntervalsRef.current.get(key);
    if (heartbeat) {
      clearInterval(heartbeat);
      activeLockIntervalsRef.current.delete(key);
    }
  };

  const refreshLockHeartbeat = useCallback(
    (type, id) => {
      if (!canPersist || !activeWedding) return;
      const key = `${type}-${id}`;
      clearLockHeartbeat(key);
      const docRef = buildLockDocRef(type, id);
      const interval = setInterval(() => {
        updateDoc(docRef, { updatedAt: serverTimestamp() }).catch(() => {});
      }, LOCK_HEARTBEAT_MS);
      activeLockIntervalsRef.current.set(key, interval);
    },
    [activeWedding, canPersist]
  );

  const releaseLock = useCallback(
    async (type, id, { skipState = false } = {}) => {
      const key = `${type}-${id}`;
      clearLockHeartbeat(key);
      if (!skipState) {
        ownedLocksRef.current.delete(key);
      }
      if (!canPersist || !activeWedding) return;
      try {
        await runTransaction(db, async (tx) => {
          const docRef = buildLockDocRef(type, id);
          const snap = await tx.get(docRef);
          if (!snap.exists()) return;
          const data = snap.data() || {};
          const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : 0;
          const isMine = data.clientId === collabClientIdRef.current;
          const expired = !updatedAt || Date.now() - updatedAt > LOCK_TTL_MS;
          if (isMine || expired) {
            tx.delete(docRef);
          }
        });
      } catch (error) {
        // console.warn('[useSeatingPlan] releaseLock error:', error);
      }
    },
    [activeWedding, canPersist]
  );

  const acquireLock = useCallback(
    async (type, id) => {
      if (!canPersist || !activeWedding) return true;
      const key = `${type}-${id}`;
      try {
        await runTransaction(db, async (tx) => {
          const docRef = buildLockDocRef(type, id);
          const snap = await tx.get(docRef);
          if (snap.exists()) {
            const data = snap.data() || {};
            const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : 0;
            const isMine = data.clientId === collabClientIdRef.current;
            const expired = !updatedAt || Date.now() - updatedAt > LOCK_TTL_MS;
            if (!expired && !isMine) {
              throw new Error('occupied');
            }
          }
          tx.set(docRef, {
            resourceType: type,
            resourceId: String(id),
            clientId: collabClientIdRef.current,
            userId: currentUserId,
            displayName: currentUserName,
            color: collaboratorColorRef.current,
            updatedAt: serverTimestamp(),
          });
        });
        ownedLocksRef.current.add(key);
        refreshLockHeartbeat(type, id);
        return true;
      } catch (_error) {
        return false;
      }
    },
    [activeWedding, canPersist, currentUserId, currentUserName, refreshLockHeartbeat]
  );

  const releaseTableLocksExcept = useCallback(
    (ids = []) => {
      const keep = new Set(ids.map((value) => `table-${value}`));
      ownedLocksRef.current.forEach((key) => {
        if (!key.startsWith('table-')) return;
        if (!keep.has(key)) {
          const [, ...rest] = key.split('-');
          const rawId = rest.join('-');
          releaseLock('table', rawId);
        }
      });
    },
    [releaseLock]
  );

  const ensureTableLock = useCallback(
    async (tableId) => {
      if (tableId == null) return true;
      if (!canPersist || !activeWedding) return true;
      const key = `table-${tableId}`;
      const existing = locksRef.current.get(key);
      if (existing && existing.clientId === collabClientIdRef.current) {
        refreshLockHeartbeat('table', tableId);
        return true;
      }
      if (existing && existing.clientId && existing.clientId !== collabClientIdRef.current) {
        const fresh = existing.updatedAt && Date.now() - existing.updatedAt < LOCK_TTL_MS;
        if (fresh) {
          emitLockEvent({
            kind: 'lock-denied',
            resourceType: 'table',
            resourceId: tableId,
            ownerName: existing.displayName || existing.userId || 'Otro colaborador',
          });
          return false;
        }
      }
      const ok = await acquireLock('table', tableId);
      if (!ok) {
        const latest = locksRef.current.get(key);
        emitLockEvent({
          kind: 'lock-denied',
          resourceType: 'table',
          resourceId: tableId,
          ownerName: latest?.displayName || latest?.userId || 'Otro colaborador',
        });
      }
      return ok;
    },
    [acquireLock, activeWedding, canPersist, emitLockEvent, refreshLockHeartbeat]
  );

  const mergeUiPrefs = (patch) => {
    if (!patch || typeof patch !== 'object') return;
    try {
      const current = readLocalState('ui-prefs');
      const base = current && typeof current === 'object' ? current : {};
      writeLocalState('ui-prefs', { ...base, ...patch });
    } catch (_) {}
  };

  useEffect(() => {
    if (!activeWedding || !canPersist) {
      setCollaborators([]);
      setCollaborationStatus(canPersist ? 'idle' : 'offline');
      return () => {};
    }
    let cancelled = false;
    setCollaborationStatus('connecting');
    const clientId = collabClientIdRef.current;
    const presenceDoc = fsDoc(db, 'weddings', activeWedding, 'seatingPresence', clientId);
    const basePayload = {
      clientId,
      userId: currentUserId,
      displayName: currentUserName,
      color: collaboratorColorRef.current,
      tab,
      status: 'editing',
      lastActive: serverTimestamp(),
    };
    const ensurePresence = async () => {
      try {
        await setDoc(presenceDoc, basePayload, { merge: true });
        if (!cancelled) setCollaborationStatus('online');
      } catch (error) {
        // console.warn('[useSeatingPlan] presence set error:', error);
        if (!cancelled) setCollaborationStatus('error');
      }
    };
    ensurePresence();
    const heartbeat = setInterval(() => {
      updateDoc(presenceDoc, {
        lastActive: serverTimestamp(),
        tab,
        status: 'editing',
      }).catch((error) => {
        // console.warn('[useSeatingPlan] presence heartbeat error:', error);
      });
    }, 20000);
    const presenceCollection = collection(db, 'weddings', activeWedding, 'seatingPresence');
    const unsubscribe = onSnapshot(
      presenceCollection,
      (snapshot) => {
        const now = Date.now();
        const list = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data() || {};
            const rawTs = data.lastActive;
            let lastActiveMs = 0;
            if (rawTs instanceof Timestamp) {
              lastActiveMs = rawTs.toDate().getTime();
            } else if (typeof rawTs === 'number') {
              lastActiveMs = rawTs;
            }
            const isStale = lastActiveMs && now - lastActiveMs > 60000;
            if (isStale) return null;
            return {
              id: docSnap.id,
              ...data,
              isCurrent: docSnap.id === clientId,
              lastActiveMs,
            };
          })
          .filter(Boolean)
          .sort((a, b) => {
            const nameA = a.displayName || '';
            const nameB = b.displayName || '';
            return nameA.localeCompare(nameB, 'es');
          });
        setCollaborators(list);
      },
      (error) => {
        // console.warn('[useSeatingPlan] presence snapshot error:', error);
      }
    );
    return () => {
      cancelled = true;
      clearInterval(heartbeat);
      unsubscribe?.();
      deleteDoc(presenceDoc).catch(() => {});
      setCollaborators([]);
      setCollaborationStatus('offline');
    };
  }, [activeWedding, canPersist, currentUserId, currentUserName, tab]);

  useEffect(() => {
    if (!activeWedding || !canPersist) {
      locksRef.current = new Map();
      setLocks([]);
      return () => {};
    }
    const locksCollection = collection(db, 'weddings', activeWedding, 'seatingLocks');
    const unsubscribe = onSnapshot(
      locksCollection,
      (snapshot) => {
        const now = Date.now();
        const list = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() || {};
          const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : 0;
          const isExpired = updatedAt && now - updatedAt > LOCK_TTL_MS;
          if (isExpired && data.clientId !== collabClientIdRef.current) {
            deleteDoc(docSnap.ref).catch(() => {});
            return;
          }
          list.push({
            id: docSnap.id,
            resourceType: data.resourceType || 'table',
            resourceId:
              data.resourceId !== undefined && data.resourceId !== null
                ? String(data.resourceId)
                : '',
            clientId: data.clientId,
            userId: data.userId,
            displayName: data.displayName,
            color: data.color,
            updatedAt,
          });
        });
        const map = new Map();
        list.forEach((item) => map.set(`${item.resourceType}-${item.resourceId}`, item));
        locksRef.current = map;
        setLocks(list);
      },
      (error) => {
        // console.warn('[useSeatingPlan] locks snapshot error:', error);
      }
    );
    return () => {
      unsubscribe?.();
    };
  }, [activeWedding, canPersist]);

  // Estados principales
  const [hallSize, setHallSize] = useState({ width: 1800, height: 1200 });
  const [drawMode, setDrawMode] = useState('pan');
  const [validationsEnabled, setValidationsEnabled] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridStep] = useState(20);
  const [globalMaxSeats, setGlobalMaxSeats] = useState(0);
  const [background, setBackground] = useState(null);
  const [scoringWeights, setScoringWeights] = useState({
    fit: 50,
    side: 10,
    wants: 20,
    avoid: -10,
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [ceremonySettings, setCeremonySettings] = useState({
    vipRows: [],
    vipLabel: 'VIP',
    lockVipSeats: false,
    notes: '',
    rows: 0,
    cols: 0,
    gap: 40,
    aisleAfter: 6,
  });

  // Estados por tipo de evento
  const [areasCeremony, setAreasCeremony] = useState([]);
  const [areasBanquet, setAreasBanquet] = useState([]);
  const [tablesCeremony, setTablesCeremony] = useState([]);
  const [seatsCeremony, setSeatsCeremony] = useState([]);
  const [tablesBanquetState, setTablesBanquetState] = useState([]);

  // Wrapper para detectar Y PREVENIR datos corruptos
  const setTablesBanquet = useCallback((newTables) => {
    if (typeof newTables === 'function') {
      setTablesBanquetState((prev) => {
        const result = newTables(prev);
        const uniquePos = new Set(result.map((t) => `${t.x},${t.y}`)).size;

        // ⚠️ PROTECCIÓN: Detectar y prevenir corrupción de datos
        if (result.length > 3 && uniquePos < result.length * 0.3) {
          console.error('[setTablesBanquet] DATOS CORRUPTOS DETECTADOS - Rechazando update', {
            total: result.length,
            posicionesUnicas: uniquePos,
          });
          return prev; // ⬅️ PREVENCIÓN: Rechazar update corrupto
        }
        return result;
      });
    } else {
      const uniquePos = new Set(newTables.map((t) => `${t.x},${t.y}`)).size;

      // ⚠️ PROTECCIÓN: Detectar y prevenir corrupción de datos
      if (newTables.length > 3 && uniquePos < newTables.length * 0.3) {
        console.error('[setTablesBanquet] DATOS CORRUPTOS DETECTADOS - Rechazando update', {
          total: newTables.length,
          posicionesUnicas: uniquePos,
        });
        return; // ⬅️ PREVENCIÓN: No actualizar si está corrupto
      }
      setTablesBanquetState(newTables);
    }
  }, []);

  const tablesBanquet = tablesBanquetState;

  // Auto-guardado local para Banquete cuando no hay persistencia (Cypress/Vitest)
  useEffect(() => {
    if (!activeWedding || canPersist) return;
    try {
      const cfg = {};
      if (hallSize && typeof hallSize.width === 'number' && typeof hallSize.height === 'number') {
        cfg.width = hallSize.width;
        cfg.height = hallSize.height;
        if (Number.isFinite(hallSize.aisleMin)) cfg.aisleMin = hallSize.aisleMin;
      }
      const payload = {
        hallSize: Object.keys(cfg).length ? cfg : undefined,
        globalMaxSeats,
        background,
        tables: Array.isArray(tablesBanquet) ? tablesBanquet : [],
        areas: Array.isArray(areasBanquet) ? areasBanquet : [],
      };
      writeLocalState('banquet', payload);
    } catch (_) {}
  }, [
    activeWedding,
    canPersist,
    tablesBanquet,
    areasBanquet,
    hallSize?.width,
    hallSize?.height,
    hallSize?.aisleMin,
    globalMaxSeats,
    background,
  ]);

  // Estados de UI
  const [selectedTable, setSelectedTable] = useState(null);
  const [configTable, setConfigTable] = useState(null);
  const [preview, setPreview] = useState(null);

  // Sincronizar invitados de gestión con asignaciones del seating plan ✨
  const guests = useMemo(() => {
    // Si no hay invitados de gestión, retornar array vacío
    if (!guestsFromManagement || guestsFromManagement.length === 0) {
      return [];
    }

    // Retornar los invitados de gestión (ya tienen las asignaciones de mesas)
    return guestsFromManagement;
  }, [guestsFromManagement]);

  // Setter para guests (mantener compatibilidad con código existente)
  const setGuests = useCallback((updater) => {
    // Este setter no hace nada real porque los guests vienen de useGuests
    // pero lo mantenemos para compatibilidad
    // console.warn('[useSeatingPlan] setGuests called but guests come from useGuests hook');
  }, []);

  // Estados de modales
  const [ceremonyConfigOpen, setCeremonyConfigOpen] = useState(false);
  const [banquetConfigOpen, setBanquetConfigOpen] = useState(false);
  const [spaceConfigOpen, setSpaceConfigOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  // Historial para undo/redo
  const [history, setHistory] = useState([]);
  const [historyPointer, setHistoryPointer] = useState(-1);

  // Referencias
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  // Timers para auto-guardado
  const ceremonySaveTimerRef = useRef(null);
  const banquetSaveTimerRef = useRef(null);

  // Estados computados basados en la pestaña activa
  const areas = tab === 'ceremony' ? areasCeremony : areasBanquet;
  const setAreas = tab === 'ceremony' ? setAreasCeremony : setAreasBanquet;
  const tables = tab === 'ceremony' ? tablesCeremony : tablesBanquet;
  const seats = tab === 'ceremony' ? seatsCeremony : [];
  const setTables = tab === 'ceremony' ? setTablesCeremony : setTablesBanquet;

  useEffect(() => {
    const keep = [];
    if (selectedTable && selectedTable.id != null) {
      keep.push(selectedTable.id);
    }
    if (Array.isArray(selectedIds)) {
      selectedIds.forEach((id) => {
        if (id != null && !keep.includes(id)) keep.push(id);
      });
    }
    releaseTableLocksExcept(keep);
  }, [selectedTable?.id, selectedIds, releaseTableLocksExcept]);

  useEffect(() => {
    try {
      const stored = readLocalState('ui-prefs');
      if (stored && typeof stored === 'object') {
        if (Object.prototype.hasOwnProperty.call(stored, 'snapToGrid')) {
          setSnapToGrid(!!stored.snapToGrid);
        }
        if (Object.prototype.hasOwnProperty.call(stored, 'validationsEnabled')) {
          setValidationsEnabled(!!stored.validationsEnabled);
        }
      }
    } catch (_) {}
  }, [activeWedding]);

  useEffect(() => {
    mergeUiPrefs({
      snapToGrid,
      validationsEnabled,
    });
  }, [snapToGrid, validationsEnabled, activeWedding]);

  // Cargar dimensiones del sal�n (y compatibilidad con estructura nueva/legacy)
  useEffect(() => {
    if (!activeWedding) return;
    if (!canPersist) {
      const stored = readLocalState('banquet');
      if (stored && typeof stored === 'object') {
        if (
          stored.hallSize &&
          typeof stored.hallSize.width === 'number' &&
          typeof stored.hallSize.height === 'number'
        ) {
          setHallSize(stored.hallSize);
        }
        if (Number.isFinite(stored.globalMaxSeats)) {
          setGlobalMaxSeats(stored.globalMaxSeats);
        }
        if (stored.background !== undefined) {
          setBackground(stored.background);
        }
        if (Array.isArray(stored.areas)) {
          setAreasBanquet(stored.areas);
        }
        if (Array.isArray(stored.tables)) {
          setTablesBanquet(stored.tables);
        }
      }
      return;
    }
    const loadHallDimensions = async () => {
      try {
        const mainRef = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet');
        const mainSnap = await getDoc(mainRef);
        if (mainSnap.exists()) {
          const data = mainSnap.data() || {};
          const cfg = data.config || {};
          if (cfg.width && cfg.height) {
            const next = { width: cfg.width, height: cfg.height };
            if (Number.isFinite(cfg.aisleMin)) next.aisleMin = cfg.aisleMin;
            if (Number.isFinite(cfg.maxSeats)) setGlobalMaxSeats(cfg.maxSeats);
            if (data.background) setBackground(data.background);
            setHallSize(next);
            return;
          } else if (data.width && data.height) {
            const next = { width: data.width, height: data.height };
            if (Number.isFinite(data.aisleMin)) next.aisleMin = data.aisleMin;
            setHallSize(next);
            return;
          }
        }
        // Fallback legacy
        const cfgRef = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet', 'config');
        const snap = await getDoc(cfgRef);
        if (snap.exists()) {
          const { width, height, aisleMin, maxSeats } = snap.data();
          if (width && height) {
            const next = { width, height };
            if (Number.isFinite(aisleMin)) next.aisleMin = aisleMin;
            if (Number.isFinite(maxSeats)) setGlobalMaxSeats(maxSeats);
            setHallSize(next);
          }
        }
      } catch (err) {
        // console.warn('No se pudieron cargar dimensiones del sal�n:', err);
      }
    };
    loadHallDimensions();
  }, [activeWedding, canPersist]);

  useEffect(() => {
    if (!activeWedding || !canPersist) return () => {};

    // ✅ Listener de Firebase RE-HABILITADO (bug de IDs corruptos solucionado)
    const ref = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet');
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        try {
          if (!snap.exists()) {
            setTablesBanquet([]);
            setAreasBanquet([]);
            return;
          }
          const data = snap.data() || {};
          if (shouldSkipSnapshot('banquet', data.meta)) return;

          // ✅ Cargar mesas (con protección anti-corrupción)
          if (Array.isArray(data.tables)) {
            setTablesBanquet(data.tables);
          }

          if (Array.isArray(data.areas)) setAreasBanquet(data.areas);

          const cfg = data.config || {};
          if (cfg && typeof cfg === 'object') {
            setHallSize((prev) => {
              const next = {
                ...(prev || {}),
                ...('width' in cfg ? { width: cfg.width } : {}),
                ...('height' in cfg ? { height: cfg.height } : {}),
              };
              if (Number.isFinite(cfg.aisleMin)) next.aisleMin = cfg.aisleMin;
              return next;
            });
            if (Number.isFinite(cfg.maxSeats)) {
              setGlobalMaxSeats(cfg.maxSeats);
            }
          }
          if (Object.prototype.hasOwnProperty.call(data, 'background')) {
            setBackground(data.background || null);
          }
        } catch (err) {
          console.error('[useSeatingPlan] Error cargando banquet snapshot:', err);
        }
      },
      (error) => {
        console.error('[useSeatingPlan] Error en banquet snapshot listener:', error);
      }
    );
    return () => {
      unsubscribe?.();
    };
  }, [activeWedding, canPersist]);

  useEffect(() => {
    return () => {
      activeLockIntervalsRef.current.forEach((interval) => clearInterval(interval));
      activeLockIntervalsRef.current.clear();
      const owned = Array.from(ownedLocksRef.current);
      ownedLocksRef.current.clear();
      if (canPersist && activeWedding) {
        owned.forEach((key) => {
          const [type, ...rest] = key.split('-');
          const id = rest.join('-');
          releaseLock(type, id, { skipState: true });
        });
      }
    };
  }, [activeWedding, canPersist, releaseLock]);

  // Cargar configuraci�n de ceremonia (seats/tables/areas/settings)
  useEffect(() => {
    if (!activeWedding) return;
    if (!canPersist) {
      const stored = readLocalState('ceremony');
      if (stored && typeof stored === 'object') {
        if (Array.isArray(stored.seats)) setSeatsCeremony(stored.seats);
        if (Array.isArray(stored.tables)) setTablesCeremony(stored.tables);
        if (Array.isArray(stored.areas)) setAreasCeremony(stored.areas);
        if (stored.settings && typeof stored.settings === 'object') {
          setCeremonySettings((prev) => ({
            ...prev,
            ...stored.settings,
            vipRows: Array.isArray(stored.settings.vipRows)
              ? stored.settings.vipRows
                  .map((value) => Number.parseInt(value, 10))
                  .filter(Number.isFinite)
              : prev.vipRows,
          }));
        }
      }
      return () => {};
    }
    const ref = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'ceremony');
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        try {
          if (!snap.exists()) {
            setSeatsCeremony([]);
            setTablesCeremony([]);
            setAreasCeremony([]);
            return;
          }
          const data = snap.data() || {};
          if (shouldSkipSnapshot('ceremony', data.meta)) return;
          if (Array.isArray(data.seats)) setSeatsCeremony(data.seats);
          if (Array.isArray(data.tables)) setTablesCeremony(data.tables);
          if (Array.isArray(data.areas)) setAreasCeremony(data.areas);
          const loadedSettings =
            data.settings && typeof data.settings === 'object'
              ? data.settings.ceremony || data.settings
              : undefined;
          if (loadedSettings && typeof loadedSettings === 'object') {
            setCeremonySettings((prev) => ({
              ...prev,
              ...loadedSettings,
              vipRows: Array.isArray(loadedSettings.vipRows)
                ? loadedSettings.vipRows.map((n) => parseInt(n, 10)).filter(Number.isFinite)
                : prev.vipRows,
            }));
          }
        } catch (err) {
          // console.warn('[useSeatingPlan] ceremony snapshot error:', err);
        }
      },
      (err) => {
        // console.warn('[useSeatingPlan] ceremony snapshot error:', err);
      }
    );
    return () => {
      unsubscribe?.();
    };
  }, [activeWedding, canPersist]);

  // Suscribirse a cambios en el estado de sincronización
  useEffect(() => {}, []);

  // Semilla local de invitados en Cypress si no hay datos
  useEffect(() => {
    try {
      const isCypress = typeof window !== 'undefined' && !!window.Cypress;
      if (!isCypress) return;
      if (Array.isArray(guests) && guests.length > 0) return;
      const seed = Array.from({ length: 6 }).map((_, i) => ({
        id: `e2e-${i + 1}`,
        name: `Invitado E2E ${i + 1}`,
        companion: i % 3 === 0 ? 1 : 0,
        side: i % 2 === 0 ? 'novia' : 'novio',
        tableId: null,
        table: null,
      }));
      setGuests(seed);
    } catch (_) {}
  }, [guests]);

  // Auto-guardado: Ceremonia (seats/tables/areas)
  useEffect(() => {
    try {
      if (!activeWedding || !canPersist) return;
      if (ceremonySaveTimerRef.current) {
        clearTimeout(ceremonySaveTimerRef.current);
      }
      ceremonySaveTimerRef.current = setTimeout(async () => {
        try {
          const ref = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'ceremony');
          const settingsPayload =
            ceremonySettings && typeof ceremonySettings === 'object'
              ? {
                  ceremony: {
                    ...ceremonySettings,
                    vipRows: Array.isArray(ceremonySettings.vipRows)
                      ? ceremonySettings.vipRows.map((n) => parseInt(n, 10)).filter(Number.isFinite)
                      : [],
                  },
                }
              : null;
          const timestamp = serverTimestamp();
          const payload = {
            seats: Array.isArray(seatsCeremony) ? seatsCeremony : [],
            tables: Array.isArray(tablesCeremony) ? tablesCeremony : [],
            areas: Array.isArray(areasCeremony) ? areasCeremony : [],
            ...(settingsPayload ? { settings: settingsPayload } : {}),
            updatedAt: timestamp,
            meta: {
              lastEditor: collabClientIdRef.current,
              clientId: collabClientIdRef.current,
              updatedBy: currentUserName,
              color: collaboratorColorRef.current,
              updatedAt: timestamp,
            },
          };
          const isEmpty =
            (!payload.seats || payload.seats.length === 0) &&
            (!payload.tables || payload.tables.length === 0) &&
            (!payload.areas || payload.areas.length === 0);
          if (isEmpty) return; // Evitar crear doc vacío
          markPendingWrite('ceremony');
          await setDoc(ref, payload, { merge: true });
        } catch (e) {
          // console.warn('[useSeatingPlan] Autosave ceremony error:', e);
        }
      }, 800);
      return () => {
        try {
          clearTimeout(ceremonySaveTimerRef.current);
        } catch (_) {}
      };
    } catch (_) {}
  }, [activeWedding, seatsCeremony, tablesCeremony, areasCeremony, ceremonySettings]);

  // Auto-guardado: Banquete (config/tables/areas)
  useEffect(() => {
    try {
      if (!activeWedding) return;
      if (banquetSaveTimerRef.current) {
        clearTimeout(banquetSaveTimerRef.current);
      }
      banquetSaveTimerRef.current = setTimeout(async () => {
        try {
          const ref = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet');
          const cfg = {};
          if (
            hallSize &&
            typeof hallSize.width === 'number' &&
            typeof hallSize.height === 'number'
          ) {
            cfg.width = hallSize.width;
            cfg.height = hallSize.height;
            if (Number.isFinite(hallSize.aisleMin)) cfg.aisleMin = hallSize.aisleMin;
            if (Number.isFinite(globalMaxSeats)) cfg.maxSeats = globalMaxSeats;
          }
          const timestamp = serverTimestamp();
          const payload = {
            ...(Object.keys(cfg).length ? { config: cfg } : {}),
            ...(background ? { background } : {}),
            tables: Array.isArray(tablesBanquet) ? tablesBanquet : [],
            areas: Array.isArray(areasBanquet) ? areasBanquet : [],
            updatedAt: timestamp,
            meta: {
              lastEditor: collabClientIdRef.current,
              clientId: collabClientIdRef.current,
              updatedBy: currentUserName,
              color: collaboratorColorRef.current,
              updatedAt: timestamp,
            },
          };
          const hasTables = Array.isArray(payload.tables) && payload.tables.length > 0;
          const hasAreas = Array.isArray(payload.areas) && payload.areas.length > 0;
          const hasConfig = !!(cfg.width && cfg.height);
          const isEmpty = !hasTables && !hasAreas && !hasConfig;
          if (isEmpty) return; // Evitar crear doc vacío
          markPendingWrite('banquet');
          await setDoc(ref, payload, { merge: true });
        } catch (e) {
          // console.warn('[useSeatingPlan] Autosave banquet error:', e);
        }
      }, 800);
      return () => {
        try {
          clearTimeout(banquetSaveTimerRef.current);
        } catch (_) {}
      };
    } catch (_) {}
  }, [
    activeWedding,
    tablesBanquet,
    areasBanquet,
    hallSize?.width,
    hallSize?.height,
    hallSize?.aisleMin,
    globalMaxSeats,
    background,
  ]);

  useEffect(() => {
    if (!activeWedding || canPersist) return;
    const normalizedSettings =
      ceremonySettings && typeof ceremonySettings === 'object'
        ? {
            ...ceremonySettings,
            vipRows: Array.isArray(ceremonySettings.vipRows)
              ? ceremonySettings.vipRows.map((n) => parseInt(n, 10)).filter(Number.isFinite)
              : [],
          }
        : {};
    const payload = {
      seats: Array.isArray(seatsCeremony) ? seatsCeremony : [],
      tables: Array.isArray(tablesCeremony) ? tablesCeremony : [],
      areas: Array.isArray(areasCeremony) ? areasCeremony : [],
      settings: normalizedSettings,
    };
    const isEmpty =
      payload.seats.length === 0 && payload.tables.length === 0 && payload.areas.length === 0;
    writeLocalState('ceremony', isEmpty ? null : payload);
  }, [activeWedding, seatsCeremony, tablesCeremony, areasCeremony, ceremonySettings, canPersist]);

  useEffect(() => {
    if (!activeWedding || canPersist) return;
    const cfg = {};
    if (hallSize && typeof hallSize.width === 'number' && typeof hallSize.height === 'number') {
      cfg.width = hallSize.width;
      cfg.height = hallSize.height;
      if (Number.isFinite(hallSize.aisleMin)) cfg.aisleMin = hallSize.aisleMin;
    }
    const payload = {
      hallSize: cfg.width && cfg.height ? cfg : hallSize,
      globalMaxSeats,
      background: background || null,
      tables: Array.isArray(tablesBanquet) ? tablesBanquet : [],
      areas: Array.isArray(areasBanquet) ? areasBanquet : [],
    };
    const hasData =
      (payload.hallSize && typeof payload.hallSize.width === 'number') ||
      (Array.isArray(payload.tables) && payload.tables.length > 0) ||
      (Array.isArray(payload.areas) && payload.areas.length > 0) ||
      payload.background;
    writeLocalState('banquet', hasData ? payload : null);
  }, [
    activeWedding,
    tablesBanquet,
    areasBanquet,
    hallSize,
    globalMaxSeats,
    background,
    canPersist,
  ]);

  // Historial
  const makeSnapshot = () => ({
    tab,
    areasCeremony: [...areasCeremony],
    areasBanquet: [...areasBanquet],
    tablesCeremony: [...tablesCeremony],
    seatsCeremony: [...seatsCeremony],
    tablesBanquet: [...tablesBanquet],
    ceremonySettings: { ...ceremonySettings },
  });
  const applySnapshot = (snap) => {
    if (!snap || typeof snap !== 'object') return;
    try {
      if (Array.isArray(snap.areasCeremony)) setAreasCeremony(snap.areasCeremony);
      if (Array.isArray(snap.areasBanquet)) setAreasBanquet(snap.areasBanquet);
      if (Array.isArray(snap.tablesCeremony)) setTablesCeremony(snap.tablesCeremony);
      if (Array.isArray(snap.seatsCeremony)) setSeatsCeremony(snap.seatsCeremony);
      if (Array.isArray(snap.tablesBanquet))
        setTablesBanquet(snap.tablesBanquet.map((t) => sanitizeTable(t)));
      if (snap.tab) setTab(snap.tab);
      if (snap.ceremonySettings && typeof snap.ceremonySettings === 'object') {
        setCeremonySettings((prev) => ({
          ...prev,
          ...snap.ceremonySettings,
          vipRows: Array.isArray(snap.ceremonySettings.vipRows)
            ? snap.ceremonySettings.vipRows
                .map((value) => Number.parseInt(value, 10))
                .filter(Number.isFinite)
            : prev.vipRows,
        }));
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (specialMomentsUnsubRef.current) {
      try {
        specialMomentsUnsubRef.current();
      } catch {}
      specialMomentsUnsubRef.current = null;
    }

    if (!activeWedding) {
      try {
        const localValue =
          localStorageRef && typeof localStorageRef.getItem === 'function'
            ? localStorageRef.getItem('mywed360SpecialMoments')
            : null;
        if (localValue) {
          const parsed = JSON.parse(localValue);
          const rawBlocks = Array.isArray(parsed?.blocks) ? parsed.blocks : [];
          const payload =
            parsed?.moments && typeof parsed.moments === 'object' ? parsed.moments : parsed || {};
          const resolvedBlocks = rawBlocks.length ? rawBlocks : buildBlocksFromMoments(payload);
          setSpecialMomentsData({
            blocks: resolvedBlocks,
            moments: normalizeSpecialMoments(payload),
          });
        } else {
          setSpecialMomentsData(null);
        }
      } catch {
        setSpecialMomentsData(null);
      }
      return;
    }

    const ref = fsDoc(db, 'weddings', activeWedding, 'specialMoments', 'main');
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setSpecialMomentsData(null);
          return;
        }
        const data = snap.data() || {};
        const rawBlocks = Array.isArray(data?.blocks) ? data.blocks : [];
        const payload =
          data?.moments && typeof data.moments === 'object'
            ? data.moments
            : Object.fromEntries(
                Object.entries(data).filter(
                  ([key]) => !['updatedAt', 'blocks', 'migratedFrom'].includes(key)
                )
              );
        const resolvedBlocks = rawBlocks.length ? rawBlocks : buildBlocksFromMoments(payload);
        setSpecialMomentsData({
          blocks: resolvedBlocks,
          moments: normalizeSpecialMoments(payload),
        });
      },
      (error) => {
        // Silenciar errores de permisos - special moments son opcionales
        // console.warn('[_useSeatingPlanDisabled] Error cargando special moments:', error);
        setSpecialMomentsData(null);
      }
    );

    specialMomentsUnsubRef.current = unsubscribe;
    return () => {
      try {
        if (specialMomentsUnsubRef.current) {
          specialMomentsUnsubRef.current();
        }
      } catch {}
      specialMomentsUnsubRef.current = null;
    };
  }, [activeWedding, localStorageRef]);

  const pushHistory = (snapshot) => {
    const snap = snapshot && typeof snapshot === 'object' ? snapshot : makeSnapshot();
    if (!snap.ceremonySettings && ceremonySettings) {
      snap.ceremonySettings = { ...ceremonySettings };
    }
    const newHistory = history.slice(0, historyPointer + 1);
    newHistory.push(snap);
    setHistory(newHistory);
    setHistoryPointer(newHistory.length - 1);
  };
  const undo = () => {
    if (historyPointer > 0) {
      const prevSnapshot = history[historyPointer - 1];
      applySnapshot(prevSnapshot);
      setHistoryPointer(historyPointer - 1);
      return prevSnapshot;
    }
    return null;
  };
  const redo = () => {
    if (historyPointer < history.length - 1) {
      const nextSnapshot = history[historyPointer + 1];
      applySnapshot(nextSnapshot);
      setHistoryPointer(historyPointer + 1);
      return nextSnapshot;
    }
    return null;
  };

  // Gestión de mesas
  const handleSelectTable = (id, multi = false) => {
    const table = tables.find((t) => String(t.id) === String(id));
    if (!multi) {
      setSelectedIds(id == null ? [] : [id]);
      setSelectedTable(table || null);
      return;
    }
    // Multi-selección: alterna en selectedIds, mantén selectedTable como último clicado
    setSelectedIds((prev) => {
      const s = new Set((prev || []).map(String));
      const key = String(id);
      if (s.has(key)) s.delete(key);
      else s.add(key);
      return Array.from(s);
    });
    setSelectedTable(table || null);
  };
  const handleTableDimensionChange = (field, value) => {
    if (!selectedTable) return;
    const updated = updateTableWithField(selectedTable, field, value);
    const sanitized = sanitizeTable(updated, {
      forceAuto: updated.autoCapacity === true && ['tableType'].includes(field),
    });
    setSelectedTable(sanitized);
    setTables((prev) => prev.map((t) => (t.id === selectedTable.id ? sanitized : t)));
  };
  const toggleSelectedTableShape = () => {
    if (!selectedTable) return;
    const nextType =
      selectedTable.tableType === 'round' || selectedTable.shape === 'circle' ? 'square' : 'round';
    const updated = updateTableWithField(selectedTable, 'tableType', nextType);
    const sanitized = sanitizeTable(updated, { forceAuto: true });
    setSelectedTable(sanitized);
    setTables((prev) => prev.map((t) => (t.id === selectedTable.id ? sanitized : t)));
  };
  // Función auxiliar para detectar colisiones entre mesas
  const checkTableCollision = (tableId, newPos, currentTables) => {
    const movingTable = currentTables.find((t) => String(t.id) === String(tableId));
    if (!movingTable) {
      return false;
    }

    // Crear caja de la mesa en la nueva posición
    const getTableBox = (table, customPos) => {
      const x = customPos ? customPos.x : table.x || 0;
      const y = customPos ? customPos.y : table.y || 0;
      const hw = (table.shape === 'circle' ? table.diameter || 60 : table.width || 80) / 2;
      const hh =
        (table.shape === 'circle' ? table.diameter || 60 : table.height || table.length || 60) / 2;
      return {
        minX: x - hw,
        minY: y - hh,
        maxX: x + hw,
        maxY: y + hh,
      };
    };

    const rectsOverlap = (a, b) =>
      !(a.maxX <= b.minX || a.minX >= b.maxX || a.maxY <= b.minY || a.minY >= b.maxY);

    const movingBox = getTableBox(movingTable, newPos);

    // Margen de seguridad: 20px para evitar que las mesas se toquen
    const SAFETY_MARGIN = 20;
    const expandedMovingBox = {
      minX: movingBox.minX - SAFETY_MARGIN / 2,
      minY: movingBox.minY - SAFETY_MARGIN / 2,
      maxX: movingBox.maxX + SAFETY_MARGIN / 2,
      maxY: movingBox.maxY + SAFETY_MARGIN / 2,
    };

    // Verificar colisión con otras mesas
    const otherTables = currentTables.filter((t) => String(t.id) !== String(tableId));
    for (const otherTable of otherTables) {
      const otherBox = getTableBox(otherTable);
      const expandedOtherBox = {
        minX: otherBox.minX - SAFETY_MARGIN / 2,
        minY: otherBox.minY - SAFETY_MARGIN / 2,
        maxX: otherBox.maxX + SAFETY_MARGIN / 2,
        maxY: otherBox.maxY + SAFETY_MARGIN / 2,
      };

      if (rectsOverlap(expandedMovingBox, expandedOtherBox)) {
        return true; // Hay colisión
      }
    }

    return false; // No hay colisión
  };

  const moveTable = (tableId, pos, { finalize } = { finalize: true }) => {
    const currentTables = tab === 'ceremony' ? tablesCeremony : tablesBanquet;

    // Verificar colisión solo en el movimiento final (al soltar)
    if (finalize && checkTableCollision(tableId, pos, currentTables)) {
      toast.warning('⚠️ No se puede mover: colisión con otra mesa', {
        autoClose: 2000,
        position: 'bottom-right',
      });
      return false;
    }

    const apply = (prev) => {
      // FIX: Crear deep copy para evitar referencias compartidas
      const result = prev.map((t) => {
        const match = String(t.id) === String(tableId);
        if (match) {
          // Deep clone con spread de todos los campos para evitar mutaciones
          return {
            ...t,
            x: Number(pos.x),
            y: Number(pos.y),
          };
        }
        // Devolver copia del objeto para evitar referencias compartidas
        return { ...t };
      });

      // ⚠️ PROTECCIÓN: Detectar corrupción en tiempo real
      const uniquePos = new Set(result.map((t) => `${t.x},${t.y}`)).size;
      if (result.length > 3 && uniquePos < result.length * 0.3) {
        console.error('[moveTable] 🔴 CORRUPCIÓN DETECTADA - RECHAZANDO UPDATE', {
          total: result.length,
          posicionesUnicas: uniquePos,
          tableIdMovido: tableId,
          posicionDestino: pos,
        });
        // Rechazar el update para prevenir corrupción
        return prev;
      }

      return result;
    };
    
    if (tab === 'ceremony') setTablesCeremony((p) => apply(p));
    else setTablesBanquet((p) => apply(p));
    
    if (finalize) {
      try {
        pushHistory({
          type: tab,
          tables: tab === 'ceremony' ? tablesCeremony : tablesBanquet,
          areas: tab === 'ceremony' ? areasCeremony : areasBanquet,
          seats: tab === 'ceremony' ? seatsCeremony : [],
        });
      } catch (_) {}
    }
    return true;
  };
  const deleteTable = (tableId) => {
    releaseLock('table', tableId);
    if (tab === 'ceremony')
      setTablesCeremony((prev) => prev.filter((t) => String(t.id) !== String(tableId)));
    else setTablesBanquet((prev) => prev.filter((t) => String(t.id) !== String(tableId)));
  };
  const duplicateTable = (tableId) => {
    const source = tab === 'ceremony' ? tablesCeremony : tablesBanquet;
    const setFn = tab === 'ceremony' ? setTablesCeremony : setTablesBanquet;
    const t = source.find((x) => String(x.id) === String(tableId));
    if (!t) return;
    const maxId = source.reduce((m, x) => {
      const n = parseInt(x.id, 10);
      return Number.isFinite(n) ? Math.max(m, n) : m;
    }, 0);
    const copy = sanitizeTable({
      ...t,
      id: maxId + 1,
      x: (t.x || 0) + 30,
      y: (t.y || 0) + 30,
      name: `Mesa ${maxId + 1}`,
    });
    setFn((prev) => [...prev, copy]);
  };
  const toggleTableLocked = (tableId) => {
    const setFn = tab === 'ceremony' ? setTablesCeremony : setTablesBanquet;
    setFn((prev) =>
      prev.map((t) => (String(t.id) === String(tableId) ? { ...t, locked: !t.locked } : t))
    );
  };

  const addTable = (table = {}) => {
    try {
      // console.log('[addTable] Input:', table);
      // console.log('[addTable] Current tab:', tab);

      const typeHint =
        table.tableType || (table.shape === 'circle' ? 'round' : inferTableType(table));

      const base = createTableFromType(typeHint, {
        ...table,
        id: table.id || Date.now(),
        autoCapacity: table.autoCapacity ?? true,
      });

      const sanitized = sanitizeTable(base, { forceAuto: base.autoCapacity });
      // console.log('[addTable] Sanitized table:', sanitized);

      if (tab === 'ceremony') {
        setTablesCeremony((prev) => {
          const newTables = [...prev, sanitized];
          // console.log('[addTable] New ceremony tables:', newTables);
          return newTables;
        });
      } else {
        setTablesBanquet((prev) => {
          const newTables = [...prev, sanitized];
          // console.log('[addTable] New banquet tables:', newTables);
          // console.log('[addTable] Previous count:', prev.length, '� New count:', newTables.length);
          return newTables;
        });
      }

      // A�adir al historial
      try {
        pushHistory();
      } catch (e) {
        // console.warn('[addTable] Error pushing to history:', e);
      }
    } catch (error) {
      // console.error('[addTable] Error:', error);
      throw error;
    }
  };

  // Actualizar mesa (por ID)
  const updateTable = (tableId, updates = {}) => {
    try {
      // console.log('[updateTable] Updating table:', tableId, 'with:', updates);

      const setFn = tab === 'ceremony' ? setTablesCeremony : setTablesBanquet;

      setFn((prev) => {
        return prev.map((table) => {
          if (String(table.id) === String(tableId)) {
            // Aplicar actualizaciones manteniendo la forma correcta
            const updated = {
              ...table,
              ...updates,
            };

            // Si cambia capacidad, actualizar también seats
            if (updates.capacity !== undefined) {
              updated.seats = updates.capacity;
            }

            // Sanitizar la mesa actualizada
            const sanitized = sanitizeTable(updated, {
              forceAuto: updated.autoCapacity ?? table.autoCapacity,
            });

            // console.log('[updateTable] Updated table:', sanitized);
            return sanitized;
          }
          return table;
        });
      });

      // Añadir al historial
      try {
        pushHistory();
      } catch (e) {
        // console.warn('[updateTable] Error pushing to history:', e);
      }
    } catch (error) {
      // console.error('[updateTable] Error:', error);
      throw error;
    }
  };

  // Áreas (perímetro/puertas/obstáculos/pasillos)
  const addArea = (area) => {
    const normalize = (a) => (Array.isArray(a) || a?.points ? a : []);
    if (tab === 'ceremony') setAreasCeremony((prev) => [...prev, normalize(area)]);
    else setAreasBanquet((prev) => [...prev, normalize(area)]);
    // Guardar en historial tras añadir área
    try {
      pushHistory();
    } catch (_) {}
  };
  const deleteArea = (index) => {
    const del = (arr) => arr.filter((_, i) => i !== index);
    if (tab === 'ceremony') setAreasCeremony((prev) => del(prev));
    else setAreasBanquet((prev) => del(prev));
  };
  const updateArea = (index, updated) => {
    const upd = (arr) => arr.map((a, i) => (i === index ? updated : a));
    if (tab === 'ceremony') setAreasCeremony((prev) => upd(prev));
    else setAreasBanquet((prev) => upd(prev));
  };

  // Generación de layouts
  const generateSeatGrid = (
    configOrRows,
    maybeCols,
    maybeGap,
    maybeStartX,
    maybeStartY,
    maybeAisleAfter
  ) => {
    const baseConfig = {
      rows: 10,
      cols: 12,
      gap: 40,
      startX: 100,
      startY: 80,
      aisleAfter: 6,
      vipRows: [],
      vipLabel: 'VIP',
      lockVipSeats: false,
      notes: '',
    };
    let config;
    if (typeof configOrRows === 'object' && configOrRows !== null) {
      config = { ...baseConfig, ...configOrRows };
    } else {
      config = {
        ...baseConfig,
        rows: Number.parseInt(configOrRows, 10) || baseConfig.rows,
        cols: Number.parseInt(maybeCols, 10) || baseConfig.cols,
        gap: Number.parseInt(maybeGap, 10) || baseConfig.gap,
        startX: Number.isFinite(Number(maybeStartX)) ? Number(maybeStartX) : baseConfig.startX,
        startY: Number.isFinite(Number(maybeStartY)) ? Number(maybeStartY) : baseConfig.startY,
        aisleAfter:
          Number.isFinite(Number(maybeAisleAfter)) && Number(maybeAisleAfter) >= 0
            ? Number(maybeAisleAfter)
            : baseConfig.aisleAfter,
      };
    }
    const vipRowSet = new Set(
      Array.isArray(config.vipRows)
        ? config.vipRows
            .map((value) => Number.parseInt(value, 10))
            .filter((value) => Number.isFinite(value) && value >= 0)
        : []
    );
    const normalizedSettings = {
      vipRows: Array.from(vipRowSet),
      vipLabel:
        typeof config.vipLabel === 'string' && config.vipLabel.trim()
          ? config.vipLabel.trim()
          : 'VIP',
      lockVipSeats: !!config.lockVipSeats,
      notes: typeof config.notes === 'string' ? config.notes : '',
      rows: Number.isFinite(config.rows) ? config.rows : baseConfig.rows,
      cols: Number.isFinite(config.cols) ? config.cols : baseConfig.cols,
      gap: Number.isFinite(config.gap) ? config.gap : baseConfig.gap,
      aisleAfter: Number.isFinite(config.aisleAfter) ? config.aisleAfter : baseConfig.aisleAfter,
    };
    const startX = Number.isFinite(config.startX) ? config.startX : baseConfig.startX;
    const startY = Number.isFinite(config.startY) ? config.startY : baseConfig.startY;

    const newSeats = [];
    let seatId = 1;
    for (let row = 0; row < normalizedSettings.rows; row++) {
      for (let col = 0; col < normalizedSettings.cols; col++) {
        const x =
          startX +
          col * normalizedSettings.gap +
          (col > normalizedSettings.aisleAfter ? normalizedSettings.gap : 0);
        const y = startY + row * normalizedSettings.gap;
        const isVipRow = vipRowSet.has(row);
        newSeats.push({
          id: seatId++,
          x,
          y,
          enabled: !(normalizedSettings.lockVipSeats && isVipRow),
          guestId: null,
          guestName: null,
          rowIndex: row,
          colIndex: col,
          reservedFor: isVipRow ? normalizedSettings.vipLabel : null,
        });
      }
    }
    setSeatsCeremony(newSeats);
    setCeremonySettings(normalizedSettings);
    pushHistory({
      type: 'ceremony',
      seats: newSeats,
      tables: tablesCeremony,
      areas: areasCeremony,
      ceremonySettings: normalizedSettings,
    });
  };
  const generateBanquetLayout = ({
    rows = 3,
    cols = 4,
    seats = 8,
    gapX = 220, // ⬅️ Aumentado a 220 (100cm libres + validación)
    gapY = 220, // ⬅️ Aumentado a 220 (100cm libres + validación)
    startX = 120,
    startY = 160,
    tableType = 'square',
  } = {}) => {
    const newTables = [];
    let tableId = 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * gapX;
        const y = startY + row * gapY;
        const base = createTableFromType(tableType, {
          id: tableId,
          x,
          y,
          seats,
          name: `Mesa ${tableId}`,
        });
        const sanitized = sanitizeTable(base, { forceAuto: base.autoCapacity });
        newTables.push({ ...sanitized, id: tableId });
        tableId += 1;
      }
    }
    setTablesBanquet(newTables);
    pushHistory({ type: 'banquet', tables: newTables, areas: areasBanquet });
  };
  const applyBanquetTables = (tablesArray = []) => {
    try {
      let idCounter = 1;
      const sanitized = (Array.isArray(tablesArray) ? tablesArray : []).map((t) => {
        const id = t.id != null ? t.id : idCounter++;
        const type = t.tableType || inferTableType(t);
        const base = createTableFromType(type, {
          ...t,
          id,
          autoCapacity: t.autoCapacity ?? true,
        });
        return sanitizeTable(base, { forceAuto: base.autoCapacity });
      });

      setTablesBanquet(sanitized);
      pushHistory({ type: 'banquet', tables: sanitized, areas: areasBanquet });
    } catch (_) {}
  };

  /**
   * Genera el layout automáticamente basándose en los invitados y sus asignaciones de mesa
   */
  const generateAutoLayoutFromGuests = (layoutType = 'columns') => {
    try {
      const result = generateAutoLayout(guests, layoutType, hallSize);

      if (result.tables.length === 0) {
        return {
          success: false,
          message: result.message || 'No hay mesas para generar',
          unassignedGuests: result.unassignedGuests || [],
        };
      }

      // Aplicar las mesas generadas al estado
      applyBanquetTables(result.tables);

      return {
        success: true,
        message: result.message,
        tablesGenerated: result.totalTables,
        guestsAssigned: result.totalAssigned,
        unassignedGuests: result.unassignedGuests || [],
      };
    } catch (error) {
      // console.error('[generateAutoLayoutFromGuests] Error:', error);
      return {
        success: false,
        message: 'Error generando el layout automático',
        error: error.message,
      };
    }
  };

  /**
   * Analiza los invitados actuales para obtener estadísticas
   */
  const analyzeCurrentGuests = () => {
    try {
      return analyzeGuestAssignments(guests);
    } catch (error) {
      // console.error('[analyzeCurrentGuests] Error:', error);
      return {
        tables: [],
        unassignedGuests: [],
        totalTables: 0,
        totalAssigned: 0,
      };
    }
  };
  const clearBanquetLayout = () => {
    releaseTableLocksExcept([]);
    setTablesBanquet([]);
  };

  /**
   * ✅ NUEVO: Resetear completamente el Seating Plan (banquet)
   * Limpia mesas, áreas y configuración
   */
  const resetSeatingPlan = async () => {
    try {
      // Liberar todos los locks
      releaseTableLocksExcept([]);

      // Limpiar estado local
      setTablesBanquet([]);
      setAreasBanquet([]);
      setSelectedTable(null);
      setSelectedIds([]);

      // Resetear configuración a valores por defecto
      setHallSize({ width: 1800, height: 1200 });
      setGlobalMaxSeats(0);
      setBackground(null);

      // Limpiar historial
      setHistory([]);
      setHistoryPointer(-1);

      // Si hay persistencia, limpiar Firebase
      if (canPersist && activeWedding) {
        const ref = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet');
        await setDoc(ref, {
          tables: [],
          areas: [],
          config: {
            width: 1800,
            height: 1200,
            maxSeats: 0,
          },
          background: null,
          meta: {
            updatedAt: new Date(),
            updatedBy: currentUserId,
          },
        });
      }

      return { success: true, message: 'Seating Plan reseteado correctamente' };
    } catch (error) {
      console.error('[resetSeatingPlan] Error:', error);
      return { success: false, message: 'Error al resetear el Seating Plan' };
    }
  };

  /**
   * Genera TODO el Seating Plan automáticamente en un solo paso
   * 1. Analiza invitados de gestión
   * 2. Determina layout óptimo
   * 3. Genera mesas automáticamente
   * 4. Asigna invitados a las mesas
   * ✨ OBJETIVO: Mínimo esfuerzo del usuario
   */
  const setupSeatingPlanAutomatically = async ({
    layoutPreference = 'auto',
    tableCapacity = 8,
    allowOvercapacity = false,
  } = {}) => {
    try {
      console.log('[setupSeatingPlanAutomatically] 🚀 Iniciando generación automática...');

      // PASO 1: Analizar invitados actuales
      const analysis = analyzeCurrentGuests();

      if (analysis.totalGuests === 0) {
        return {
          success: false,
          message:
            'No hay invitados para asignar. Añade invitados en Gestión de Invitados primero.',
        };
      }

      console.log(
        '[setupSeatingPlanAutomatically] 📊 Invitados encontrados:',
        analysis.totalGuests
      );
      console.log('[setupSeatingPlanAutomatically] 📋 Análisis completo:', analysis);

      // PASO 2: Determinar layout óptimo automáticamente
      let layoutType = layoutPreference;

      if (layoutType === 'auto') {
        // Algoritmo inteligente según número de invitados
        if (analysis.totalGuests < 40) {
          layoutType = 'circular';
        } else if (analysis.totalGuests < 80) {
          layoutType = 'columns';
        } else if (analysis.totalGuests < 150) {
          layoutType = 'with-aisle';
        } else {
          layoutType = 'columns';
        }
        console.log(
          '[setupSeatingPlanAutomatically] 🎯 Layout seleccionado automáticamente:',
          layoutType
        );
      }

      // PASO 3: Generar layout desde invitados
      const layoutResult = generateAutoLayoutFromGuests(layoutType);

      if (!layoutResult.success) {
        console.error(
          '[setupSeatingPlanAutomatically] ❌ Error generando layout:',
          layoutResult.message
        );
        return layoutResult;
      }

      console.log('[setupSeatingPlanAutomatically] ✅ Layout generado:', {
        mesas: layoutResult.tablesGenerated,
        asignados: layoutResult.guestsAssigned,
        layoutType,
      });

      // PASO 4: Esperar un momento para que el estado se actualice
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log(
        '[setupSeatingPlanAutomatically] 🎯 Iniciando auto-asignación de invitados pendientes...'
      );

      // PASO 5: Auto-asignar invitados pendientes
      const assignResult = await autoAssignGuests();

      console.log('[setupSeatingPlanAutomatically] ✅ Auto-asignación completada:', {
        resultado: assignResult,
        asignados: assignResult.assigned || 0,
        ok: assignResult.ok,
      });

      // PASO 6: Calcular estadísticas finales
      const finalAnalysis = analyzeCurrentGuests();

      // PASO 7: Retornar resultado completo
      return {
        success: true,
        message: '¡Seating Plan generado automáticamente!',
        stats: {
          mesas: layoutResult.tablesGenerated || 0,
          invitadosAsignados: assignResult.assigned || 0,
          invitadosPendientes: finalAnalysis.unassignedGuests?.length || 0,
          layoutUsado: layoutType,
          totalInvitados: analysis.totalGuests,
        },
      };
    } catch (error) {
      console.error('[setupSeatingPlanAutomatically] ❌ Error crítico:', error);
      return {
        success: false,
        message: 'Error en la generación automática. Inténtalo de nuevo.',
        error: error.message,
      };
    }
  };

  // Invitados y asientos
  const moveGuest = async (guestId, tableId) => {
    try {
      // Actualizar el invitado en la gestión de invitados ✨
      await updateGuestInManagement(guestId, {
        tableId: tableId == null ? null : tableId,
        table: tableId == null ? null : String(tableId),
      });
    } catch (error) {
      console.error('[moveGuest] ❌ Error actualizando invitado:', error);
    }
  };
  const moveGuestToSeat = (guestId, tableId, _seatIdx) => {
    moveGuest(guestId, tableId);
  };
  const assignGuestToCeremonySeat = async (seatId, guestId) => {
    setSeatsCeremony((prev) =>
      prev.map((s) =>
        String(s.id) === String(seatId)
          ? {
              ...s,
              guestId,
              guestName: (guests.find((g) => String(g.id) === String(guestId)) || {}).name || null,
            }
          : s
      )
    );
    return true;
  };
  const toggleSeatEnabled = (seatId) => {
    setSeatsCeremony((prev) =>
      prev.map((s) =>
        String(s.id) === String(seatId)
          ? { ...s, enabled: s.enabled === false ? true : !s.enabled }
          : s
      )
    );
  };

  // Selección múltiple directa desde el canvas (reemplazo o unión)
  const selectTables = (ids = [], append = false) => {
    try {
      const clean = Array.from(new Set((ids || []).map((x) => String(x))));
      if (append) {
        setSelectedIds((prev) => Array.from(new Set([...(prev || []).map(String), ...clean])));
      } else {
        setSelectedIds(clean);
      }
      const id0 = clean[0];
      if (id0 != null) {
        const list = tab === 'ceremony' ? tablesCeremony : tablesBanquet;
        const t = list.find((x) => String(x.id) === String(id0));
        setSelectedTable(t || null);
      } else {
        setSelectedTable(null);
      }
    } catch (_) {}
  };

  // Auto-asignación y sugerencias básicas
  const autoAssignGuests = async () => {
    try {
      console.log('[autoAssignGuests] 🚀 Iniciando... Total guests:', guests.length);

      const pending = guests.filter((g) => !g.tableId && !g.table);
      console.log('[autoAssignGuests] 📋 Invitados pendientes:', pending.length);
      console.log(
        '[autoAssignGuests] 📝 IDs pendientes:',
        pending.map((g) => ({ id: g.id, name: g.name }))
      );

      if (pending.length === 0) {
        console.log('[autoAssignGuests] ℹ️ No hay invitados pendientes');
        return { ok: true, method: 'local', assigned: 0 };
      }

      console.log('[autoAssignGuests] 🪑 Mesas disponibles:', tablesBanquet.length);
      console.log(
        '[autoAssignGuests] 📊 Mesas:',
        tablesBanquet.map((t) => ({ id: t.id, seats: t.seats }))
      );

      const occ = new Map();
      guests.forEach((g) => {
        const tid = g?.tableId != null ? String(g.tableId) : null;
        if (!tid) return;
        occ.set(tid, (occ.get(tid) || 0) + 1 + (parseInt(g.companion, 10) || 0));
      });
      let assigned = 0;

      // Actualizar invitados en la gestión ✨
      console.log('[autoAssignGuests] 🎯 Comenzando asignación de', pending.length, 'invitados...');
      for (const g of pending) {
        const table = tablesBanquet.find((t) => {
          const cap = parseInt(t.seats, 10) || globalMaxSeats || 0;
          const used = occ.get(String(t.id)) || 0;
          return cap === 0 || used + 1 + (parseInt(g.companion, 10) || 0) <= cap;
        });

        if (table) {
          const tid = String(table.id);
          occ.set(tid, (occ.get(tid) || 0) + 1 + (parseInt(g.companion, 10) || 0));
          assigned += 1 + (parseInt(g.companion, 10) || 0);

          console.log(
            `[autoAssignGuests] ✅ Asignando invitado ${g.id} (${g.name}) a mesa ${table.id}`
          );

          // Actualizar en la gestión de invitados
          try {
            await updateGuestInManagement(g.id, {
              tableId: table.id,
              table: String(table.id),
            });
          } catch (updateError) {
            console.error(
              `[autoAssignGuests] ❌ Error actualizando invitado ${g.id}:`,
              updateError
            );
          }
        }
      }

      console.log(
        `[autoAssignGuests] 🎉 Asignación completada: ${assigned} invitados asignados de ${pending.length} pendientes`
      );
      return { ok: true, method: 'local', assigned };
    } catch (e) {
      console.error('[autoAssignGuests] ❌ Error crítico:', e);
      return { ok: false, error: 'auto-assign-failed' };
    }
  };
  const autoAssignGuestsRules = async () => autoAssignGuests();
  const suggestTablesForGuest = (guestId) => {
    try {
      const g = guests.find((x) => String(x.id) === String(guestId));
      if (!g) return [];
      const occ = new Map();
      guests.forEach((x) => {
        const tid = x?.tableId != null ? String(x.tableId) : null;
        if (!tid) return;
        occ.set(tid, (occ.get(tid) || 0) + 1 + (parseInt(x.companion, 10) || 0));
      });
      const list = tablesBanquet.map((t) => {
        const cap = parseInt(t.seats, 10) || globalMaxSeats || 0;
        const used = occ.get(String(t.id)) || 0;
        const free = cap > 0 ? Math.max(0, cap - used) : 1000;
        const fit = free - (parseInt(g.companion, 10) || 0);
        return { tableId: t.id, score: fit };
      });
      return list.sort((a, b) => b.score - a.score);
    } catch (_) {
      return [];
    }
  };

  const keywordMatch = (text, patterns = []) => {
    if (!text) return false;
    const normalized = String(text).toLowerCase();
    return patterns.some((pattern) => normalized.includes(pattern));
  };

  const SMART_VIP_KEYWORDS = [
    'vip',
    'padrin',
    'madrin',
    'best man',
    'maid of honor',
    'principal',
    'oficiante',
  ];

  const SMART_SIDE_KEYWORDS = {
    novia: ['novia', 'bride'],
    novio: ['novio', 'groom'],
  };

  const buildReason = (message, weight) => ({ message, weight });

  const evaluateTableFit = (guest, meta) => {
    if (!meta) return { score: -Infinity, reasons: [] };
    const desiredSeats = 1 + (parseInt(guest?.companion, 10) || 0);
    const hasCapacityLimit = Number.isFinite(meta.capacity) && meta.capacity > 0;
    const freeSeats = hasCapacityLimit ? Math.max(0, meta.free ?? 0) : 999;
    if (hasCapacityLimit && freeSeats < desiredSeats) return { score: -Infinity, reasons: [] };

    let score = 0;
    const reasons = [];

    if (hasCapacityLimit) {
      const remainingAfter = freeSeats - desiredSeats;
      const capacityScore = Math.max(0, 28 - Math.max(0, remainingAfter) * 5);
      score += capacityScore;
      reasons.push(buildReason(`Quedan ${meta.free} asientos libres`, capacityScore));
    } else {
      score += 8;
      reasons.push(buildReason('Mesa sin l�mite de asientos configurado', 8));
    }

    const guestSide = String(guest?.side || '').toLowerCase();
    if (guestSide && meta.sideHints.has(guestSide)) {
      score += 12;
      reasons.push(buildReason(`Mesa asociada al lado ${guestSide}`, 12));
    }

    const group = String(guest?.group || guest?.groupName || '').trim();
    if (group) {
      const sameGroupCount = meta.assignedGuests.filter(
        (assigned) =>
          String(assigned?.group || assigned?.groupName || '')
            .trim()
            .toLowerCase() === group.toLowerCase()
      ).length;
      if (sameGroupCount > 0) {
        const bonus = Math.min(15, sameGroupCount * 5);
        score += bonus;
        reasons.push(
          buildReason(`Mesa con ${sameGroupCount} invitado(s) del grupo "${group}"`, bonus)
        );
      }
    }

    const companionGroup = String(guest?.companionGroupId || '').trim();
    if (companionGroup) {
      const sameCompanionGroup = meta.assignedGuests.filter(
        (assigned) =>
          String(assigned?.companionGroupId || '')
            .trim()
            .toLowerCase() === companionGroup.toLowerCase()
      ).length;
      if (sameCompanionGroup > 0) {
        const bonus = Math.min(12, 4 + sameCompanionGroup * 4);
        score += bonus;
        reasons.push(buildReason(`Mesa con acompa�antes del grupo ${companionGroup}`, bonus));
      }
    }

    const guestDiet = String(guest?.dietaryRestrictions || '')
      .trim()
      .toLowerCase();
    if (guestDiet) {
      const dietMatches = meta.assignedGuests.filter((assigned) =>
        String(assigned?.dietaryRestrictions || '')
          .trim()
          .toLowerCase()
          .includes(guestDiet)
      ).length;
      if (dietMatches > 0) {
        const bonus = Math.min(10, 4 + dietMatches * 2);
        score += bonus;
        reasons.push(buildReason(`Mesa con ${dietMatches} invitado(s) con dieta similar`, bonus));
      } else {
        score -= 6;
        reasons.push(buildReason('La mesa no tiene invitados con la misma dieta', -6));
      }
    }

    const guestKeywords = [
      ...(Array.isArray(guest?.tags) ? guest.tags : []),
      guest?.notes || '',
      guest?.role || '',
      group,
      guest?.name || '',
    ]
      .join(' ')
      .toLowerCase();
    const isVipGuest = keywordMatch(guestKeywords, SMART_VIP_KEYWORDS);
    if (isVipGuest && meta.isVipTable) {
      score += 16;
      reasons.push(buildReason('Mesa VIP adecuada para este invitado', 16));
    } else if (isVipGuest) {
      score += 6;
      reasons.push(buildReason('Invitado VIP: mesa disponible', 6));
    }

    if (meta.table?.locked) {
      score -= 8;
      reasons.push(buildReason('Mesa bloqueada (preferir mesas libres)', -8));
    }

    if (meta.conflictReasons.length) {
      score -= 14;
      reasons.push(buildReason(`Mesa con ${meta.conflictReasons.length} conflicto(s)`, -14));
    }

    if (Number.isFinite(meta.overCapacity) && meta.overCapacity > 0) {
      const penalty = meta.overCapacity * 18;
      score -= penalty;
      reasons.push(
        buildReason(`Mesa sobre capacidad por ${meta.overCapacity} asiento(s)`, -penalty)
      );
    }

    if (desiredSeats > 1 && hasCapacityLimit && freeSeats - desiredSeats === 0) {
      score += 5;
      reasons.push(buildReason('Encaja justo incluyendo acompa�antes', 5));
    }

    return { score, reasons };
  };

  const conflicts = useMemo(() => {
    if (!validationsEnabled) return [];
    try {
      const out = [];
      // ---- Banquete ----
      const boundary = (() => {
        try {
          const b = (areasBanquet || []).find(
            (a) =>
              !Array.isArray(a) &&
              a?.type === 'boundary' &&
              Array.isArray(a?.points) &&
              a.points.length >= 3
          );
          return b ? b.points : null;
        } catch (e) {
          return null;
        }
      })();
      const obstacles = (() => {
        const rects = [];
        (areasBanquet || []).forEach((a) => {
          const type = Array.isArray(a) ? undefined : a?.type;
          if (!(type === 'obstacle' || type === 'door')) return;
          const pts = Array.isArray(a?.points) ? a.points : [];
          if (!pts.length) return;
          const xs = pts.map((p) => p.x);
          const ys = pts.map((p) => p.y);
          rects.push({
            minX: Math.min(...xs),
            minY: Math.min(...ys),
            maxX: Math.max(...xs),
            maxY: Math.max(...ys),
          });
        });
        return rects;
      })();
      const aisle = typeof hallSize?.aisleMin === 'number' ? hallSize.aisleMin : 80;

      const getTableBox = (t) => {
        if (!t) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        if (t.shape === 'circle') {
          const r = (t.diameter || 60) / 2;
          return {
            minX: (t.x || 0) - r,
            minY: (t.y || 0) - r,
            maxX: (t.x || 0) + r,
            maxY: (t.y || 0) + r,
          };
        }
        const hw = (t.width || 80) / 2;
        const hh = (t.height || t.length || 60) / 2;
        return {
          minX: (t.x || 0) - hw,
          minY: (t.y || 0) - hh,
          maxX: (t.x || 0) + hw,
          maxY: (t.y || 0) + hh,
        };
      };
      const expandBox = (b, m) => ({
        minX: b.minX - m,
        minY: b.minY - m,
        maxX: b.maxX + m,
        maxY: b.maxY + m,
      });
      const rectsOverlap = (a, b) =>
        !(a.maxX <= b.minX || a.minX >= b.maxX || a.maxY <= b.minY || a.minY >= b.maxY);
      const pointInPoly = (px, py, pts) => {
        if (!Array.isArray(pts) || pts.length < 3) return true;
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const xi = pts[i].x;
          const yi = pts[i].y;
          const xj = pts[j].x;
          const yj = pts[j].y;
          const intersect =
            yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi || 1e-9) + xi;
          if (intersect) inside = !inside;
        }
        return inside;
      };
      const boxInsidePoly = (b, pts) => {
        if (!pts) return true;
        const corners = [
          { x: b.minX, y: b.minY },
          { x: b.maxX, y: b.minY },
          { x: b.maxX, y: b.maxY },
          { x: b.minX, y: b.maxY },
        ];
        return corners.every((c) => pointInPoly(c.x, c.y, pts));
      };

      // Overbooking map
      const idSet = new Set((tablesBanquet || []).map((t) => String(t?.id)));
      const nameSet = new Set(
        (tablesBanquet || []).map((t) => String(t?.name || '').trim()).filter(Boolean)
      );
      const occ = new Map();
      (guests || []).forEach((g) => {
        const tid = g?.tableId != null ? String(g.tableId) : null;
        const tname = g?.table != null ? String(g.table).trim() : '';
        let key = null;
        if (tid && idSet.has(tid)) key = tid;
        else if (tname && (idSet.has(tname) || nameSet.has(tname))) key = tname;
        if (!key) return;
        const count = 1 + (parseInt(g?.companion, 10) || 0);
        occ.set(key, (occ.get(key) || 0) + count);
      });

      (tablesBanquet || []).forEach((t) => {
        const box = getTableBox(t);
        const padded = expandBox(box, aisle / 2);
        const tid = String(t.id);
        // 1) Per�metro
        if (boundary && !boxInsidePoly(box, boundary)) {
          out.push({ type: 'perimeter', tableId: t.id, message: 'Fuera del per�metro' });
          return; // prioriza per�metro
        }
        // 2) Obst�culos/puertas
        if (obstacles.some((o) => rectsOverlap(padded, o))) {
          out.push({ type: 'obstacle', tableId: t.id, message: 'Colisi�n con obst�culo/puerta' });
          return;
        }
        // 3) Espaciado m�nimo entre mesas
        const others = (tablesBanquet || []).filter((x) => String(x?.id) !== tid);
        const otherExpanded = others.map(getTableBox).map((b) => expandBox(b, aisle / 2));
        if (otherExpanded.some((o) => rectsOverlap(padded, o))) {
          out.push({
            type: 'spacing',
            tableId: t.id,
            message: 'Distancia insuficiente entre mesas',
          });
          return;
        }
      });

      (tablesBanquet || []).forEach((t) => {
        const tid = String(t.id);
        const cap = parseInt(t.seats, 10) || globalMaxSeats || 0;
        if (!Number.isFinite(cap) || cap <= 0) return;
        const nameKey = String(t?.name || '').trim();
        const used = occ.get(tid) || (nameKey ? occ.get(nameKey) : 0) || 0;
        const overflow = used > cap ? used - cap : 0;
        if (overflow > 0) {
          out.push({
            type: 'overbooking',
            tableId: t.id,
            message: `Mesa ${t?.name || tid} excede la capacidad por ${overflow} asiento(s)`,
            overflow,
            tableName: t?.name || `Mesa ${tid}`,
          });
        }
      });

      // ---- Ceremonia ----
      try {
        const cerBoundary = (() => {
          const b = (areasCeremony || []).find(
            (a) =>
              !Array.isArray(a) &&
              a?.type === 'boundary' &&
              Array.isArray(a?.points) &&
              a.points.length >= 3
          );
          return b ? b.points : null;
        })();
        const cerObstacles = (() => {
          const rects = [];
          (areasCeremony || []).forEach((a) => {
            const type = Array.isArray(a) ? undefined : a?.type;
            if (!(type === 'obstacle' || type === 'door')) return;
            const pts = Array.isArray(a?.points) ? a.points : [];
            if (!pts.length) return;
            const xs = pts.map((p) => p.x);
            const ys = pts.map((p) => p.y);
            rects.push({
              minX: Math.min(...xs),
              minY: Math.min(...ys),
              maxX: Math.max(...xs),
              maxY: Math.max(...ys),
            });
          });
          return rects;
        })();
        (seatsCeremony || []).forEach((s) => {
          const px = s.x || 0;
          const py = s.y || 0;
          if (cerBoundary && !pointInPoly(px, py, cerBoundary)) {
            out.push({
              type: 'perimeter',
              tableId: `S${s.id}`,
              message: 'Silla fuera del per�metro',
            });
            return;
          }
          if (
            cerObstacles.some((o) => px >= o.minX && px <= o.maxX && py >= o.minY && py <= o.maxY)
          ) {
            out.push({
              type: 'obstacle',
              tableId: `S${s.id}`,
              message: 'Silla sobre obst�culo/puerta',
            });
          }
        });
      } catch (e) {
        /* ignored */
      }
      return out;
    } catch (e) {
      return [];
    }
  }, [
    tablesBanquet,
    areasBanquet,
    seatsCeremony,
    areasCeremony,
    guests,
    validationsEnabled,
    hallSize,
    globalMaxSeats,
  ]);

  const smartTableMeta = useMemo(() => {
    const assignments = new Map();
    (guests || []).forEach((guest) => {
      const key =
        guest?.tableId != null
          ? `id-${guest.tableId}`
          : guest?.table != null
            ? `name-${String(guest.table).trim()}`
            : null;
      if (!key) return;
      if (!assignments.has(key)) assignments.set(key, []);
      assignments.get(key).push(guest);
    });

    const conflictMap = new Map();
    (conflicts || []).forEach((conflict) => {
      if (!conflict?.tableId) return;
      const keyId = `id-${String(conflict.tableId).replace(/^S/, '')}`;
      if (!conflictMap.has(keyId)) conflictMap.set(keyId, []);
      conflictMap.get(keyId).push(conflict);
    });

    return (tablesBanquet || []).map((table) => {
      const idKey = `id-${table.id}`;
      const nameKey =
        table?.name && String(table.name).trim() ? `name-${String(table.name).trim()}` : null;
      const assignedGuests = [
        ...(assignments.get(idKey) || []),
        ...(nameKey ? assignments.get(nameKey) || [] : []),
      ];
      const companions = assignedGuests.reduce(
        (sum, guest) => sum + (parseInt(guest?.companion, 10) || 0),
        0
      );
      const rawSeats = parseInt(table.seats, 10) || 0;
      const capacity = rawSeats || globalMaxSeats || 0;
      const hasCapacityLimit = Number.isFinite(capacity) && capacity > 0;
      const used = assignedGuests.length + companions;
      const free = hasCapacityLimit ? Math.max(0, capacity - used) : Math.max(0, rawSeats - used);
      const overCapacity = hasCapacityLimit ? Math.max(0, used - capacity) : 0;
      const conflictReasons = [
        ...(conflictMap.get(idKey) || []),
        ...(nameKey ? conflictMap.get(nameKey) || [] : []),
      ];
      const sideHints = new Set();
      Object.entries(SMART_SIDE_KEYWORDS).forEach(([side, patterns]) => {
        if (keywordMatch(table?.name, patterns)) {
          sideHints.add(side);
        }
      });
      return {
        table,
        tableId: String(table.id),
        nameKey,
        assignedGuests,
        capacity,
        free,
        used,
        overCapacity,
        conflictReasons,
        isVipTable: keywordMatch(table?.name, SMART_VIP_KEYWORDS),
        sideHints,
        tableName: (typeof table?.name === 'string' && table.name.trim()) || `Mesa ${table.id}`,
      };
    });
  }, [tablesBanquet, guests, conflicts, globalMaxSeats]);

  const smartRecommendations = useMemo(() => {
    const pendingGuests = (guests || []).filter((guest) => !guest?.tableId && !guest?.table);
    if (!pendingGuests.length || !smartTableMeta.length) return [];

    return pendingGuests
      .map((guest) => {
        const evaluations = smartTableMeta
          .map((meta) => {
            const { score, reasons } = evaluateTableFit(guest, meta);
            return {
              tableId: meta.tableId,
              tableName: meta.tableName,
              score,
              reasons,
              freeSeats: meta.free,
              conflicts: meta.conflictReasons,
            };
          })
          .filter((entry) => Number.isFinite(entry.score) && entry.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        const guestKeywords = [
          ...(Array.isArray(guest?.tags) ? guest.tags : []),
          guest?.notes || '',
          guest?.group || '',
          guest?.name || '',
        ]
          .join(' ')
          .toLowerCase();
        const cluster = keywordMatch(guestKeywords, SMART_VIP_KEYWORDS)
          ? 'vip'
          : keywordMatch(guestKeywords, ['familia', 'family', 'herman', 'padre', 'madre'])
            ? 'familia'
            : 'otros';

        return {
          guest,
          cluster,
          topRecommendations: evaluations,
        };
      })
      .filter((item) => item.topRecommendations.length > 0)
      .sort((a, b) => b.topRecommendations[0].score - a.topRecommendations[0].score);
  }, [guests, smartTableMeta]);

  const vipRecipients = useMemo(() => {
    if (!specialMomentsData || !specialMomentsData.moments) return [];
    const blockNameMap = new Map(
      (specialMomentsData.blocks || []).map((block) => {
        const blockId = String(block?.id ?? block?.key ?? '');
        const label = block?.name || block?.title || blockId || 'Bloque';
        return [blockId, label];
      })
    );

    const entries = [];
    Object.entries(specialMomentsData.moments || {}).forEach(([blockId, list]) => {
      if (!Array.isArray(list)) return;
      list.forEach((moment) => {
        const recipientId = moment?.recipientId ? String(moment.recipientId) : '';
        const recipientName = moment?.recipientName ? String(moment.recipientName) : '';
        if (!recipientId && !recipientName) return;
        entries.push({
          key: `${blockId || 'block'}-${moment?.id || ''}-${recipientId || recipientName}`,
          blockId,
          blockName: blockNameMap.get(String(blockId)) || String(blockId),
          momentId: moment?.id || '',
          momentTitle: moment?.title || '',
          time: moment?.time || '',
          recipientId,
          recipientName,
        });
      });
    });
    return entries;
  }, [specialMomentsData]);

  const smartConflictSuggestions = useMemo(() => {
    if (!Array.isArray(conflicts) || conflicts.length === 0) return [];
    const tableMetaIndex = new Map(smartTableMeta.map((meta) => [String(meta.tableId), meta]));
    const availableTargets = smartTableMeta.filter(
      (meta) =>
        String(meta.tableId) &&
        meta.conflictReasons.length === 0 &&
        (meta.free > 0 || !Number.isFinite(meta.capacity) || meta.capacity <= 0)
    );
    const suggestions = [];

    (conflicts || []).forEach((conflict, index) => {
      const rawTableId = conflict?.tableId;
      if (!rawTableId) return;
      const tableId = String(rawTableId).replace(/^S/, '');
      const meta = tableMetaIndex.get(tableId);
      const severity =
        conflict.type === 'overbooking' || conflict.type === 'obstacle' ? 'high' : 'medium';
      const baseSuggestion = {
        id: `conflict-${conflict.type}-${rawTableId}-${index}`,
        conflict,
        tableId,
        tableName: meta?.tableName || conflict?.tableName || `Mesa ${tableId}`,
        severity,
        actions: [],
      };

      if (conflict.type === 'overbooking' && meta) {
        const overflow = conflict?.overflow ?? meta.overCapacity ?? 1;
        if (overflow > 0 && availableTargets.length > 0) {
          const candidateGuests = [...meta.assignedGuests];
          candidateGuests.sort((a, b) => {
            const aVip = keywordMatch(
              [a?.name, a?.group, a?.notes, a?.role].join(' '),
              SMART_VIP_KEYWORDS
            );
            const bVip = keywordMatch(
              [b?.name, b?.group, b?.notes, b?.role].join(' '),
              SMART_VIP_KEYWORDS
            );
            if (aVip === bVip) return 0;
            return aVip ? 1 : -1; // prioriza mover no VIP
          });

          const actions = [];
          for (const guest of candidateGuests) {
            if (actions.length >= overflow) break;
            const alternatives = availableTargets
              .filter((target) => target.tableId !== meta.tableId)
              .map((target) => ({
                meta: target,
                evaluation: evaluateTableFit(guest, target),
              }))
              .filter(
                (entry) => Number.isFinite(entry.evaluation.score) && entry.evaluation.score > 0
              )
              .sort((a, b) => b.evaluation.score - a.evaluation.score);
            if (!alternatives.length) continue;
            const best = alternatives[0];
            actions.push({
              type: 'reassign',
              guestId: guest.id,
              guestName: guest?.name || `Invitado ${guest?.id}`,
              toTableId: best.meta.tableId,
              toTableName: best.meta.tableName,
              reasons: best.evaluation.reasons.slice(0, 2),
              score: best.evaluation.score,
            });
          }
          if (actions.length) {
            suggestions.push({ ...baseSuggestion, actions });
            return;
          }
        }
        suggestions.push(baseSuggestion);
        return;
      }

      if (meta && (conflict.type === 'perimeter' || conflict.type === 'spacing')) {
        suggestions.push({
          ...baseSuggestion,
          actions: [{ type: 'fix-position', tableId: meta.tableId }],
        });
        return;
      }

      if (meta && conflict.type === 'obstacle') {
        suggestions.push({
          ...baseSuggestion,
          actions: [
            { type: 'fix-position', tableId: meta.tableId },
            { type: 'focus-table', tableId: meta.tableId },
          ],
        });
        return;
      }

      suggestions.push(baseSuggestion);
    });

    return suggestions;
  }, [conflicts, smartTableMeta]);

  const smartInsights = useMemo(() => {
    const pendingGuests = (guests || []).filter((guest) => !guest?.tableId && !guest?.table);
    const vipRecipientIds = new Set(
      (vipRecipients || [])
        .map((entry) => entry.recipientId)
        .filter((id) => id)
        .map((id) => String(id))
    );
    let vipPending = 0;
    if (vipRecipientIds.size) {
      vipPending = pendingGuests.filter((guest) => vipRecipientIds.has(String(guest?.id))).length;
    } else {
      vipPending = pendingGuests.filter((guest) =>
        keywordMatch(
          [guest?.tags, guest?.group, guest?.notes, guest?.name].join(' '),
          SMART_VIP_KEYWORDS
        )
      ).length;
    }
    const tablesNearlyFull = smartTableMeta.filter(
      (meta) => meta.free > 0 && meta.free <= 2
    ).length;
    const companionSeats = pendingGuests.reduce(
      (sum, guest) => sum + (parseInt(guest?.companion, 10) || 0),
      0
    );
    return {
      pendingGuests: pendingGuests.length,
      vipPending,
      vipRecipients: vipRecipients.length,
      tablesNearlyFull,
      conflictCount: conflicts.length,
      companionSeats,
      highSeverityConflicts: smartConflictSuggestions.filter((item) => item.severity === 'high')
        .length,
      overbookedTables: smartTableMeta.filter((meta) => meta.overCapacity > 0).length,
    };
  }, [guests, smartTableMeta, conflicts, smartConflictSuggestions]);

  // Conflictos: perímetro, obstáculos/puertas, pasillos (espaciado) y overbooking
  const guestMap = useMemo(() => {
    const map = new Map();
    (guests || []).forEach((guest) => {
      if (guest && guest.id != null) {
        map.set(String(guest.id), guest);
      }
    });
    return map;
  }, [guests]);

  // Exportaciones
  const exportPNG = async () => {
    if (!canvasRef.current) return;
    try {
      const canvas = await html2canvas(canvasRef.current);
      const link = document.createElement('a');
      link.download = `seating-plan-${tab}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      // console.error('Error exportando PNG:', error);
    }
  };
  const exportPDF = async () => {
    if (!canvasRef.current) return;
    try {
      const canvas = await html2canvas(canvasRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`seating-plan-${tab}-${Date.now()}.pdf`);
    } catch (error) {
      // console.error('Error exportando PDF:', error);
    }
  };
  const exportCSV = async (options = {}) => {
    const { tabs: selectedTabs, returnBlob = false, filename } = options || {};
    try {
      const requestedTabs =
        Array.isArray(selectedTabs) && selectedTabs.length ? selectedTabs : ['banquet', 'ceremony'];
      const rows = [
        ['guestId', 'name', 'tab', 'table', 'companions', 'notes'].join(','),
        ...guests.map((g) => {
          const tableName = g.table ?? g.tableId ?? '';
          const tabForGuest = (() => {
            if (requestedTabs.includes('banquet') && tableName) return 'banquet';
            if (
              requestedTabs.includes('ceremony') &&
              seatsCeremony.some((seat) => String(seat.guestId) === String(g.id))
            ) {
              return 'ceremony';
            }
            return 'general';
          })();
          return [
            g.id,
            JSON.stringify(g.name || ''),
            tabForGuest,
            JSON.stringify(tableName || ''),
            parseInt(g.companion, 10) || 0,
            JSON.stringify(g.notes || ''),
          ].join(',');
        }),
      ];
      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const exportName = filename || `seating-${requestedTabs.join('-')}-${Date.now()}.csv`;
      if (returnBlob) {
        return {
          format: 'csv',
          blob,
          mimeType: 'text/csv',
          filename: exportName,
        };
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportName;
      a.click();
      URL.revokeObjectURL(url);
      return { format: 'csv', blob, mimeType: 'text/csv', filename: exportName };
    } catch (e) {
      // console.warn('CSV export failed', e);
      if (returnBlob) throw e;
      return null;
    }
  };
  const exportSVG = async (options = {}) => {
    const { returnBlob = false, filename } = options || {};
    try {
      const w = hallSize?.width || 1800;
      const h = hallSize?.height || 1200;
      const header = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${w}\" height=\"${h}\">`;
      const footer = '</svg>';
      const body = [
        ...areasBanquet.map((a) => {
          const pts = Array.isArray(a?.points) ? a.points : Array.isArray(a) ? a : [];
          const d =
            pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') +
            (pts.length ? ' Z' : '');
          return `<path d=\"${d}\" stroke=\"#10b981\" stroke-width=\"2\" fill=\"none\"/>`;
        }),
        ...tablesBanquet.map((t) => {
          if (t.shape === 'circle') {
            const r = (t.diameter || 60) / 2;
            return `<circle cx=\"${t.x}\" cy=\"${t.y}\" r=\"${r}\" fill=\"#eee\" stroke=\"#333\"/>`;
          }
          const hw = (t.width || 80) / 2;
          const hh = (t.height || t.length || 60) / 2;
          return `<rect x=\"${t.x - hw}\" y=\"${t.y - hh}\" width=\"${hw * 2}\" height=\"${hh * 2}\" fill=\"#eee\" stroke=\"#333\"/>`;
        }),
      ].join('');
      const svg = header + body + footer;
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const exportName = filename || `seating-${tab}-${Date.now()}.svg`;
      if (returnBlob) {
        return {
          format: 'svg',
          blob,
          mimeType: 'image/svg+xml',
          filename: exportName,
        };
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportName;
      a.click();
      URL.revokeObjectURL(url);
      return { format: 'svg', blob, mimeType: 'image/svg+xml', filename: exportName };
    } catch (e) {
      // console.warn('SVG export failed', e);
      if (returnBlob) throw e;
      return null;
    }
  };

  const fetchImageAsDataURL = async (url) => {
    if (!url) return null;
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) return null;
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('read-error'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      // console.warn('No se pudo cargar el logotipo para la exportaci�n', error);
      return null;
    }
  };

  const normalizeTabId = (value) => {
    if (value === 'ceremony' || value === 'banquet' || value === 'free-draw') return value;
    if (value === 'freedraw') return 'free-draw';
    return 'banquet';
  };

  const collectTabReport = (tabId) => {
    const guestsIndexByTable = new Map();
    (guests || []).forEach((guest) => {
      const key =
        guest?.tableId != null
          ? `id-${guest.tableId}`
          : guest?.table
            ? `name-${String(guest.table).trim()}`
            : null;
      if (!key) return;
      if (!guestsIndexByTable.has(key)) guestsIndexByTable.set(key, []);
      guestsIndexByTable.get(key).push(guest);
    });

    if (tabId === 'ceremony') {
      const rowsMap = new Map();
      (seatsCeremony || []).forEach((seat) => {
        const rowIndex = Number.isFinite(seat?.rowIndex) ? seat.rowIndex : 0;
        if (!rowsMap.has(rowIndex)) {
          rowsMap.set(rowIndex, {
            index: rowIndex,
            seats: [],
          });
        }
        rowsMap.get(rowIndex).seats.push(seat);
      });
      const rows = Array.from(rowsMap.values())
        .sort((a, b) => a.index - b.index)
        .map((row) => {
          const seats = row.seats;
          const enabledSeats = seats.filter((seat) => seat?.enabled !== false);
          const assignedSeats = seats.filter((seat) => !!seat?.guestId);
          const vip =
            Array.isArray(ceremonySettings?.vipRows) &&
            ceremonySettings.vipRows.some((vipRow) => Number(vipRow) === row.index);
          return {
            label: `Fila ${row.index + 1}`,
            index: row.index,
            seats,
            enabled: enabledSeats.length,
            assigned: assignedSeats.length,
            available: Math.max(0, enabledSeats.length - assignedSeats.length),
            reservedLabel: vip ? ceremonySettings?.vipLabel || 'VIP' : null,
            guests: seats
              .map((seat) => {
                if (!seat?.guestId) return null;
                const guest = guestMap.get(String(seat.guestId));
                return guest || null;
              })
              .filter(Boolean),
          };
        });

      const ceremonyGuests = rows.flatMap((row) => row.guests);

      return {
        id: 'ceremony',
        title: 'Ceremonia',
        rows,
        totalSeats: seatsCeremony.length,
        vipLabel: ceremonySettings?.vipLabel || 'VIP',
        vipRows: Array.isArray(ceremonySettings?.vipRows)
          ? ceremonySettings.vipRows.map((value) => Number(value)).filter(Number.isFinite)
          : [],
        notes: ceremonySettings?.notes || '',
        guests: ceremonyGuests,
      };
    }

    if (tabId === 'banquet') {
      const tables = Array.isArray(tablesBanquet) ? tablesBanquet : [];
      const tableSummaries = tables.map((table) => {
        const byIdKey = `id-${table.id}`;
        const byNameKey =
          table?.name && String(table.name).trim() ? `name-${String(table.name).trim()}` : null;
        const assignedGuests = [
          ...(guestsIndexByTable.get(byIdKey) || []),
          ...(byNameKey ? guestsIndexByTable.get(byNameKey) || [] : []),
        ];
        const companionCount = assignedGuests.reduce(
          (sum, guest) => sum + (parseInt(guest?.companion, 10) || 0),
          0
        );
        const totalAssigned = assignedGuests.length + companionCount;
        const capacity = parseInt(table.seats, 10) || globalMaxSeats || 0;
        return {
          id: table.id,
          name: table.name || `Mesa ${table.id}`,
          seats: capacity,
          assignedGuests,
          assignedCount: totalAssigned,
          freeCount: capacity > 0 ? Math.max(0, capacity - totalAssigned) : null,
          shape: table.shape || table.tableType || 'round',
          locked: table.locked || false,
        };
      });

      return {
        id: 'banquet',
        title: 'Banquete',
        tables: tableSummaries,
        totalTables: tables.length,
        totalGuestsSeated: tableSummaries.reduce((sum, table) => sum + table.assignedCount, 0),
      };
    }

    if (tabId === 'free-draw') {
      const shapes = Array.isArray(areasBanquet) ? areasBanquet : [];
      return {
        id: 'free-draw',
        title: 'Zona libre',
        shapes,
        shapeCount: shapes.length,
      };
    }

    return null;
  };

  const translate = (lang, key, fallback) => {
    const dictionary = {
      es: {
        reportTitle: 'Informe del plan de asientos',
        summary: 'Resumen general',
        hallDimensions: 'Dimensiones del sal�n',
        aisle: 'Pasillo m�nimo',
        vipNotes: 'Notas de ceremonia',
        legend: 'Leyenda',
        guestList: 'Lista de invitados',
        conflicts: 'Conflictos pendientes',
        noConflicts: 'No hay conflictos registrados.',
        providerNotes: 'Notas para proveedores',
        setupInstructions: 'Instrucciones de montaje',
        ceremonyRows: 'Filas de ceremonia',
        banquetTables: 'Mesas del banquete',
        freeDrawZones: 'Zonas libres',
        generatedAt: 'Generado el',
        legendVip: 'Filas VIP reservadas',
        legendLocked: 'Mesas bloqueadas',
        legendCapacity: 'Capacidad disponible',
        legendConflict: 'Conflictos detectados',
        legendNotes: 'Notas internas',
        instructionsPasillos: 'Respeta el pasillo m�nimo indicado para el montaje.',
        instructionsRevisar: 'Revisar el plano antes de la llegada de proveedores.',
        instructionsCapacidad: 'Verificar que la capacidad asignada no exceda el m�ximo global.',
        scale: 'Escala',
      },
      en: {
        reportTitle: 'Seating Plan Report',
        summary: 'Executive Summary',
        hallDimensions: 'Hall dimensions',
        aisle: 'Minimum aisle',
        vipNotes: 'Ceremony notes',
        legend: 'Legend',
        guestList: 'Guest list',
        conflicts: 'Pending conflicts',
        noConflicts: 'No conflicts registered.',
        providerNotes: 'Provider notes',
        setupInstructions: 'Setup instructions',
        ceremonyRows: 'Ceremony rows',
        banquetTables: 'Banquet tables',
        freeDrawZones: 'Free-draw zones',
        generatedAt: 'Generated on',
        legendVip: 'Reserved VIP rows',
        legendLocked: 'Locked tables',
        legendCapacity: 'Available capacity',
        legendConflict: 'Detected conflicts',
        legendNotes: 'Internal notes',
        instructionsPasillos: 'Keep the minimum aisle clearance during setup.',
        instructionsRevisar: 'Review the plan before vendors arrive.',
        instructionsCapacidad: 'Verify assigned capacity does not exceed the global maximum.',
        scale: 'Scale',
      },
    };
    const langDict = dictionary[lang] || dictionary.es;
    return langDict[key] || fallback || key;
  };

  const exportDetailedPDF = async (options = {}) => {
    const { config: exportConfig = {}, logoDataUrl = null } = options || {};

    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const margin = 16;

    const drawLogo = () => {
      if (!logoDataUrl) return;
      try {
        const width = pdf.internal.pageSize.getWidth();
        pdf.addImage(logoDataUrl, 'PNG', width - margin - 30, margin - 8, 28, 12);
      } catch {}
    };

    const getPageMetrics = () => ({
      width: pdf.internal.pageSize.getWidth(),
      height: pdf.internal.pageSize.getHeight(),
    });

    const allGuests = Array.isArray(guests) ? [...guests] : [];
    const guestMapById = new Map(
      allGuests
        .filter((guest) => guest && guest.id != null)
        .map((guest) => [String(guest.id), guest])
    );
    const tablesList = Array.isArray(tablesBanquet) ? tablesBanquet : [];
    const tableNameById = new Map(
      tablesList.map((table) => [String(table.id), table?.name || `Mesa ${table?.id ?? ''}`])
    );

    const renderLegend = (items = []) => {
      if (!items.length) return;
      const { width, height } = getPageMetrics();
      const legendWidth = 48;
      const legendHeight = items.length * 6 + 4;
      const originX = width - margin - legendWidth;
      const originY = height - margin - legendHeight;
      pdf.setDrawColor(148, 163, 184);
      pdf.setFillColor(255, 255, 255);
      pdf.rect(originX - 2, originY - 3, legendWidth + 4, legendHeight + 6, 'FD');
      items.forEach((item, index) => {
        const y = originY + index * 6;
        const [r, g, b] = item.color;
        pdf.setFillColor(r, g, b);
        pdf.rect(originX, y, 4, 4, 'F');
        pdf.setTextColor(55, 65, 81);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(item.label, originX + 6, y + 3);
      });
      pdf.setTextColor(33, 37, 41);
    };

    const renderCeremonyMap = () => {
      const seats = Array.isArray(seatsCeremony) ? seatsCeremony : [];
      const areas = Array.isArray(areasCeremony) ? areasCeremony : [];
      const boundaryArea = areas.find(
        (area) => area && area.type === 'boundary' && Array.isArray(area.points)
      );
      const boundaryPoints = boundaryArea ? boundaryArea.points : null;

      const { width: pageWidth, height: pageHeight } = getPageMetrics();
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      const allPoints = [];
      seats.forEach((seat) => {
        if (typeof seat?.x === 'number' && typeof seat?.y === 'number') {
          allPoints.push({ x: seat.x, y: seat.y });
        }
      });
      if (boundaryPoints) {
        boundaryPoints.forEach((point) => {
          if (typeof point?.x === 'number' && typeof point?.y === 'number') {
            allPoints.push({ x: point.x, y: point.y });
          }
        });
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('Plano de ceremonia', margin, margin);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      drawLogo();

      if (!allPoints.length) {
        pdf.text('No hay datos de asientos de ceremonia.', margin, margin + 10);
        renderLegend([
          { color: [253, 224, 71], label: 'VIP reservado' },
          { color: [96, 165, 250], label: 'Asignado' },
          { color: [226, 232, 240], label: 'Disponible' },
        ]);
        return;
      }

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      allPoints.forEach((point) => {
        if (point.x < minX) minX = point.x;
        if (point.x > maxX) maxX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.y > maxY) maxY = point.y;
      });
      const rangeX = maxX - minX || 1;
      const rangeY = maxY - minY || 1;
      const scale = Math.min(usableWidth / rangeX, usableHeight / rangeY) * 0.9;
      const offsetX = (pageWidth - rangeX * scale) / 2;
      const offsetY = (pageHeight - rangeY * scale) / 2;

      const mapX = (value) => offsetX + (value - minX) * scale;
      const mapY = (value) => offsetY + (value - minY) * scale;

      if (boundaryPoints) {
        pdf.setDrawColor(148, 163, 184);
        pdf.setLineWidth(0.4);
        for (let i = 0; i < boundaryPoints.length; i += 1) {
          const current = boundaryPoints[i];
          const next = boundaryPoints[(i + 1) % boundaryPoints.length];
          pdf.line(mapX(current.x), mapY(current.y), mapX(next.x), mapY(next.y));
        }
      }

      seats.forEach((seat) => {
        if (typeof seat?.x !== 'number' || typeof seat?.y !== 'number') return;
        const x = mapX(seat.x);
        const y = mapY(seat.y);
        const radius = Math.max(1.6, Math.min(4, (scale * 4) / 100));
        if (seat?.reservedFor) {
          pdf.setFillColor(253, 224, 71);
        } else if (seat?.guestId || seat?.guestName) {
          pdf.setFillColor(96, 165, 250);
        } else if (seat?.enabled === false) {
          pdf.setFillColor(226, 232, 240);
        } else {
          pdf.setFillColor(241, 245, 249);
        }
        pdf.setDrawColor(30, 41, 59);
        pdf.circle(x, y, radius, 'FD');
        if (seat?.guestName) {
          const initials = seat.guestName
            .split(' ')
            .map((word) => word[0] || '')
            .join('')
            .slice(0, 2)
            .toUpperCase();
          if (initials) {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(Math.min(6, radius * 2.4));
            pdf.text(initials, x, y + 0.6, { align: 'center', baseline: 'middle' });
          }
        }
      });

      renderLegend([
        { color: [253, 224, 71], label: 'VIP reservado' },
        { color: [96, 165, 250], label: 'Asignado' },
        { color: [226, 232, 240], label: 'Disponible' },
      ]);
    };

    const renderBanquetMap = () => {
      const tables = Array.isArray(tablesBanquet) ? tablesBanquet : [];
      const areas = Array.isArray(areasBanquet) ? areasBanquet : [];
      const boundaryArea = areas.find(
        (area) => area && area.type === 'boundary' && Array.isArray(area.points)
      );
      const obstacleAreas = areas.filter(
        (area) =>
          area && (area.type === 'obstacle' || area.type === 'door') && Array.isArray(area.points)
      );

      const { width: pageWidth, height: pageHeight } = getPageMetrics();
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      const allPoints = [];
      tables.forEach((table) => {
        if (typeof table?.x === 'number' && typeof table?.y === 'number') {
          allPoints.push({ x: table.x, y: table.y });
          if (table?.shape === 'circle') {
            const r = (table?.diameter || 60) / 2;
            allPoints.push({ x: table.x + r, y: table.y + r });
            allPoints.push({ x: table.x - r, y: table.y - r });
          } else {
            const hw = (table?.width || 80) / 2;
            const hh = (table?.height || table?.length || 60) / 2;
            allPoints.push({ x: table.x + hw, y: table.y + hh });
            allPoints.push({ x: table.x - hw, y: table.y - hh });
          }
        }
      });
      if (boundaryArea) {
        boundaryArea.points.forEach((point) => {
          if (typeof point?.x === 'number' && typeof point?.y === 'number') {
            allPoints.push({ x: point.x, y: point.y });
          }
        });
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('Plano de banquete', margin, margin);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      drawLogo();

      if (!allPoints.length) {
        pdf.text('No hay datos de mesas de banquete.', margin, margin + 10);
        renderLegend([
          { color: [148, 163, 184], label: 'Per�metro' },
          { color: [203, 213, 225], label: 'Mesa' },
          { color: [248, 113, 113], label: 'Obst�culo/Puerta' },
        ]);
        return;
      }

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      allPoints.forEach((point) => {
        if (point.x < minX) minX = point.x;
        if (point.x > maxX) maxX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.y > maxY) maxY = point.y;
      });
      const rangeX = maxX - minX || 1;
      const rangeY = maxY - minY || 1;
      const scale = Math.min(usableWidth / rangeX, usableHeight / rangeY) * 0.9;
      const offsetX = (pageWidth - rangeX * scale) / 2;
      const offsetY = (pageHeight - rangeY * scale) / 2;

      const mapX = (value) => offsetX + (value - minX) * scale;
      const mapY = (value) => offsetY + (value - minY) * scale;

      if (boundaryArea) {
        pdf.setDrawColor(148, 163, 184);
        pdf.setLineWidth(0.5);
        for (let i = 0; i < boundaryArea.points.length; i += 1) {
          const current = boundaryArea.points[i];
          const next = boundaryArea.points[(i + 1) % boundaryArea.points.length];
          pdf.line(mapX(current.x), mapY(current.y), mapX(next.x), mapY(next.y));
        }
      }

      obstacleAreas.forEach((area) => {
        const xs = area.points.map((p) => p.x);
        const ys = area.points.map((p) => p.y);
        const minOx = Math.min(...xs);
        const maxOx = Math.max(...xs);
        const minOy = Math.min(...ys);
        const maxOy = Math.max(...ys);
        pdf.setFillColor(248, 113, 113);
        pdf.rect(mapX(minOx), mapY(minOy), (maxOx - minOx) * scale, (maxOy - minOy) * scale, 'F');
      });

      tables.forEach((table) => {
        if (typeof table?.x !== 'number' || typeof table?.y !== 'number') return;
        const cx = mapX(table.x);
        const cy = mapY(table.y);
        pdf.setFillColor(203, 213, 225);
        pdf.setDrawColor(30, 41, 59);
        pdf.setLineWidth(0.4);
        if (table?.shape === 'circle') {
          const r = ((table?.diameter || 60) / 2) * scale;
          pdf.circle(cx, cy, Math.max(5, r), 'FD');
        } else {
          const hw = ((table?.width || 80) / 2) * scale;
          const hh = ((table?.height || table?.length || 60) / 2) * scale;
          pdf.rect(cx - hw, cy - hh, hw * 2, hh * 2, 'FD');
        }
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(table?.name || `Mesa ${table?.id ?? ''}`, cx, cy + 3, {
          align: 'center',
        });
      });

      renderLegend([
        { color: [148, 163, 184], label: 'Per�metro' },
        { color: [203, 213, 225], label: 'Mesa' },
        { color: [248, 113, 113], label: 'Obst�culo/Puerta' },
      ]);
    };

    const writeGuestList = () => {
      pdf.addPage('portrait', 'a4');
      const marginX = 16;
      const marginY = 18;
      let { width: pageWidth, height: pageHeight } = getPageMetrics();
      let cursorY = marginY;

      const renderHeader = () => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.text('Lista de invitados', marginX, cursorY);
        cursorY += 8;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text('Nombre  "  Estado  "  Mesa  "  Acompa�antes  "  Dieta', marginX, cursorY);
        cursorY += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
      };

      renderHeader();
      drawLogo();

      const ensureSpace = (needed = 6) => {
        if (cursorY + needed > pageHeight - marginY) {
          pdf.addPage('portrait', 'a4');
          const metrics = getPageMetrics();
          pageWidth = metrics.width;
          pageHeight = metrics.height;
          cursorY = marginY;
          renderHeader();
          drawLogo();
        }
      };

      const sortedGuests = [...allGuests].sort((a, b) => {
        const nameA = (a?.name || '').toLowerCase();
        const nameB = (b?.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

      if (!sortedGuests.length) {
        ensureSpace(6);
        pdf.text('No hay invitados registrados.', marginX, cursorY);
        cursorY += 6;
        return;
      }

      sortedGuests.forEach((guest) => {
        const tableLabel = guest?.table
          ? String(guest.table)
          : guest?.tableId != null
            ? tableNameById.get(String(guest.tableId)) || String(guest.tableId)
            : '';
        const line = [
          guest?.name || '',
          guest?.response || guest?.status || '',
          tableLabel,
          String(guest?.companion || 0),
          guest?.dietaryRestrictions ? guest.dietaryRestrictions : '',
        ].join('  "  ');
        ensureSpace(6);
        pdf.text(line, marginX, cursorY);
        cursorY += 6;
      });
    };

    const writeGuestsByTable = () => {
      pdf.addPage('portrait', 'a4');
      const marginX = 16;
      const marginY = 18;
      let { width: pageWidth, height: pageHeight } = getPageMetrics();
      let cursorY = marginY;

      const renderHeader = () => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.text('Invitados por mesa', marginX, cursorY);
        cursorY += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
      };

      renderHeader();
      drawLogo();

      const ensureSpace = (needed = 6) => {
        if (cursorY + needed > pageHeight - marginY) {
          pdf.addPage('portrait', 'a4');
          const metrics = getPageMetrics();
          pageWidth = metrics.width;
          pageHeight = metrics.height;
          cursorY = marginY;
          renderHeader();
          drawLogo();
        }
      };

      const tableSections = [];
      const assignmentMap = new Map();
      allGuests.forEach((guest) => {
        const idKey = guest?.tableId != null ? String(guest.tableId) : '';
        const nameKey = guest?.table ? String(guest.table).trim() : '';
        const key = idKey || nameKey;
        if (!key) return;
        if (!assignmentMap.has(key)) assignmentMap.set(key, []);
        assignmentMap.get(key).push(guest);
      });

      tablesList.forEach((table) => {
        const keyById = table?.id != null ? String(table.id) : '';
        const keyByName = table?.name ? String(table.name).trim() : '';
        const assigned = [];
        if (keyById && assignmentMap.has(keyById)) {
          assigned.push(...assignmentMap.get(keyById));
          assignmentMap.delete(keyById);
        }
        if (keyByName && assignmentMap.has(keyByName)) {
          assigned.push(...assignmentMap.get(keyByName));
          assignmentMap.delete(keyByName);
        }
        tableSections.push({
          name: table?.name || `Mesa ${table?.id ?? ''}`,
          guests: assigned,
        });
      });

      assignmentMap.forEach((value, key) => {
        tableSections.push({ name: `Mesa ${key}`, guests: value });
      });

      const unassigned = allGuests.filter((guest) => !guest?.table && guest?.tableId == null);
      if (unassigned.length) {
        tableSections.push({ name: 'Sin mesa asignada', guests: unassigned });
      }

      tableSections.sort((a, b) => a.name.localeCompare(b.name));

      if (!tableSections.length) {
        ensureSpace(6);
        pdf.text('No hay mesas registradas.', marginX, cursorY);
        cursorY += 6;
        return;
      }

      tableSections.forEach((section) => {
        ensureSpace(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text(section.name, marginX, cursorY);
        cursorY += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        if (!section.guests.length) {
          ensureSpace(6);
          pdf.text('', marginX + 4, cursorY);
          cursorY += 6;
        } else {
          section.guests
            .sort((a, b) => (a?.name || '').localeCompare(b?.name || ''))
            .forEach((guest) => {
              ensureSpace(6);
              pdf.text(`" ${guest?.name || 'Invitado sin nombre'}`, marginX + 4, cursorY);
              cursorY += 6;
            });
        }
      });
    };

    const writeDietaryRestrictions = () => {
      pdf.addPage('portrait', 'a4');
      const marginX = 16;
      const marginY = 18;
      let { width: pageWidth, height: pageHeight } = getPageMetrics();
      let cursorY = marginY;

      const renderHeader = () => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.text('Invitados con dietas especiales', marginX, cursorY);
        cursorY += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
      };

      renderHeader();
      drawLogo();

      const ensureSpace = (needed = 6) => {
        if (cursorY + needed > pageHeight - marginY) {
          pdf.addPage('portrait', 'a4');
          const metrics = getPageMetrics();
          pageWidth = metrics.width;
          pageHeight = metrics.height;
          cursorY = marginY;
          renderHeader();
          drawLogo();
        }
      };

      const dietGroups = new Map();
      allGuests.forEach((guest) => {
        const diet = String(guest?.dietaryRestrictions || '').trim();
        if (!diet) return;
        const key = diet.toLowerCase();
        if (!dietGroups.has(key)) {
          dietGroups.set(key, { label: diet, guests: [] });
        }
        dietGroups.get(key).guests.push(guest);
      });

      if (!dietGroups.size) {
        ensureSpace(6);
        pdf.text('No hay restricciones diet�ticas registradas.', marginX, cursorY);
        cursorY += 6;
        return;
      }

      Array.from(dietGroups.values())
        .sort((a, b) => a.label.localeCompare(b.label))
        .forEach((group) => {
          ensureSpace(8);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(12);
          pdf.text(group.label, marginX, cursorY);
          cursorY += 6;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
          group.guests
            .sort((a, b) => (a?.name || '').localeCompare(b?.name || ''))
            .forEach((guest) => {
              ensureSpace(6);
              pdf.text(`" ${guest?.name || 'Invitado sin nombre'}`, marginX + 4, cursorY);
              cursorY += 6;
            });
        });
    };

    const vipEntries = Array.isArray(vipRecipients) ? vipRecipients : [];

    const writeVipList = () => {
      pdf.addPage('portrait', 'a4');
      const marginX = 16;
      const marginY = 18;
      let { width: pageWidth, height: pageHeight } = getPageMetrics();
      let cursorY = marginY;

      const renderHeader = () => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.text('Momentos con destinatarios especiales', marginX, cursorY);
        cursorY += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
      };

      renderHeader();
      drawLogo();

      const ensureSpace = (needed = 6) => {
        if (cursorY + needed > pageHeight - marginY) {
          pdf.addPage('portrait', 'a4');
          const metrics = getPageMetrics();
          pageWidth = metrics.width;
          pageHeight = metrics.height;
          cursorY = marginY;
          renderHeader();
          drawLogo();
        }
      };

      if (!vipEntries.length) {
        ensureSpace(6);
        pdf.text('No hay destinatarios registrados en Momentos especiales.', marginX, cursorY);
        cursorY += 6;
        return;
      }

      const expanded = vipEntries.map((entry) => {
        const guest = entry.recipientId ? guestMapById.get(String(entry.recipientId)) : null;
        const tableLabel = guest?.table
          ? String(guest.table)
          : guest?.tableId != null
            ? tableNameById.get(String(guest.tableId)) || String(guest.tableId)
            : '';
        return {
          ...entry,
          guest,
          tableLabel,
          displayName: guest?.name || entry.recipientName || '',
        };
      });

      expanded.forEach((item) => {
        ensureSpace(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text(item.displayName, marginX, cursorY);
        cursorY += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const details = [
          item.blockName || 'Bloque',
          item.momentTitle ? `Momento: ${item.momentTitle}` : null,
          item.time ? `Hora: ${item.time}` : null,
          item.tableLabel ? `Mesa: ${item.tableLabel}` : null,
          item.guest?.dietaryRestrictions ? `Dieta: ${item.guest.dietaryRestrictions}` : null,
        ]
          .filter(Boolean)
          .join('  "  ');
        if (details) {
          ensureSpace(6);
          pdf.text(details, marginX + 4, cursorY);
          cursorY += 6;
        }
      });
    };

    renderCeremonyMap();
    pdf.addPage('landscape', 'a4');
    renderBanquetMap();
    writeGuestList();
    writeGuestsByTable();
    writeDietaryRestrictions();
    writeVipList();

    const exportName = `seating-report-${Date.now()}.pdf`;
    if (exportConfig.returnBlob) {
      const blob = pdf.output('blob');
      return {
        format: 'pdf',
        blob,
        mimeType: 'application/pdf',
        filename: exportName,
      };
    }
    pdf.save(exportName);
    return {
      format: 'pdf',
      blob: pdf.output('blob'),
      mimeType: 'application/pdf',
      filename: exportName,
    };
  };
  const exportDetailedSVG = (options = {}) => {
    const {
      tabs: requestedTabs = ['ceremony', 'banquet'],
      config: exportConfig = {},
      logoDataUrl = null,
    } = options;
    const width = hallSize?.width || 1800;
    const height = hallSize?.height || 1200;
    const padding = 120;
    const totalHeight = requestedTabs.length * (height + padding) + padding;

    const svgParts = [];
    svgParts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width + padding * 2}" height="${totalHeight}" viewBox="0 0 ${
        width + padding * 2
      } ${totalHeight}" font-family="Helvetica, Arial, sans-serif">`
    );
    svgParts.push(
      `<rect x="0" y="0" width="${width + padding * 2}" height="${totalHeight}" fill="#ffffff"/>`
    );

    if (logoDataUrl) {
      svgParts.push(
        `<image href="${logoDataUrl}" x="${padding}" y="${padding / 2}" height="60" preserveAspectRatio="xMidYMid meet" />`
      );
    }

    requestedTabs.forEach((tab, index) => {
      const tabId = normalizeTabId(tab);
      const yOffset = padding + index * (height + padding);
      svgParts.push(`<g transform="translate(${padding}, ${yOffset})" data-tab="${tabId}">`);
      svgParts.push(
        `<text x="${width / 2}" y="-20" font-size="32" fill="#111" text-anchor="middle">${tabId.toUpperCase()}</text>`
      );

      if (tabId === 'ceremony') {
        (seatsCeremony || []).forEach((seat) => {
          const fill = seat?.enabled === false ? '#fde68a' : seat?.guestId ? '#60a5fa' : '#e5e7eb';
          svgParts.push(
            `<circle cx="${seat.x}" cy="${seat.y}" r="18" fill="${fill}" stroke="#1f2937" stroke-width="2"/>`
          );
          if (seat?.guestName) {
            svgParts.push(
              `<text x="${seat.x}" y="${seat.y + 5}" font-size="18" fill="#1f2937" text-anchor="middle">${seat.guestName
                .split(' ')
                .map((word) => word[0])
                .join('')
                .toUpperCase()}</text>`
            );
          }
        });
      } else if (tabId === 'banquet') {
        (areasBanquet || []).forEach((area) => {
          const pts = Array.isArray(area?.points) ? area.points : Array.isArray(area) ? area : [];
          if (!pts.length) return;
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
          svgParts.push(
            `<path d="${d}" fill="none" stroke="#10b981" stroke-width="4" opacity="0.8"/>`
          );
        });
        (tablesBanquet || []).forEach((table) => {
          if (table.shape === 'circle') {
            const r = (table.diameter || 60) / 2;
            svgParts.push(
              `<circle cx="${table.x}" cy="${table.y}" r="${r}" fill="#f3f4f6" stroke="#111827" stroke-width="3"/>`
            );
          } else {
            const hw = (table.width || 80) / 2;
            const hh = (table.height || table.length || 60) / 2;
            svgParts.push(
              `<rect x="${table.x - hw}" y="${table.y - hh}" width="${hw * 2}" height="${hh * 2}" fill="#f3f4f6" stroke="#111827" stroke-width="3"/>`
            );
          }
          svgParts.push(
            `<text x="${table.x}" y="${table.y + 6}" font-size="28" fill="#1f2937" text-anchor="middle">${
              table.name || `Mesa ${table.id}`
            }</text>`
          );
        });
      } else if (tabId === 'free-draw') {
        (areasBanquet || []).forEach((shape) => {
          const pts = Array.isArray(shape?.points)
            ? shape.points
            : Array.isArray(shape)
              ? shape
              : [];
          if (!pts.length) return;
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
          svgParts.push(
            `<path d="${d}" fill="#dbeafe" stroke="#3b82f6" stroke-width="3" opacity="0.6"/>`
          );
        });
      }
      svgParts.push(`</g>`);
    });

    svgParts.push('</svg>');
    const svgString = svgParts.join('');
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const exportName = `seating-advanced-${Date.now()}.svg`;
    if (exportConfig.returnBlob) {
      return {
        format: 'svg',
        blob,
        mimeType: 'image/svg+xml',
        filename: exportName,
      };
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = exportName;
    anchor.click();
    URL.revokeObjectURL(url);
    return {
      format: 'svg',
      blob,
      mimeType: 'image/svg+xml',
      filename: exportName,
    };
  };

  const exportAdvancedReport = async (options = {}) => {
    const {
      formats = ['pdf'],
      tabs: requestedTabs = ['ceremony', 'banquet'],
      contents = [],
      config: exportConfig = {},
      snapshot = null,
    } = options || {};

    const normalizedTabs = requestedTabs.map((tab) => normalizeTabId(tab));
    const uniqueFormats = Array.from(new Set(formats)).filter(Boolean);
    const wantsPersistence = canPersist && !!activeWedding;

    const sanitizedConfig = {
      orientation: exportConfig.orientation || 'portrait',
      scale: exportConfig.scale || '1:75',
      includeMeasures:
        typeof exportConfig.includeMeasures === 'boolean' ? exportConfig.includeMeasures : true,
      language: exportConfig.language || 'es',
      logoUrl: exportConfig.logoUrl || '',
    };

    const logoDataUrl = sanitizedConfig.logoUrl
      ? await fetchImageAsDataURL(sanitizedConfig.logoUrl)
      : null;

    const artifactPromises = [];
    const artifactConfig = { ...sanitizedConfig, returnBlob: wantsPersistence };

    const toArtifact = (result) =>
      Promise.resolve(result).catch((error) => {
        // console.warn('[useSeatingPlan] export artifact failed', error);
        if (wantsPersistence) throw error;
        return null;
      });

    if (uniqueFormats.includes('pdf')) {
      artifactPromises.push(
        toArtifact(
          exportDetailedPDF({
            tabs: normalizedTabs,
            contents,
            config: artifactConfig,
            logoDataUrl,
          })
        )
      );
    }
    if (uniqueFormats.includes('svg')) {
      artifactPromises.push(
        toArtifact(
          exportDetailedSVG({
            tabs: normalizedTabs,
            config: artifactConfig,
            logoDataUrl,
          })
        )
      );
    }
    if (uniqueFormats.includes('csv')) {
      artifactPromises.push(
        toArtifact(
          exportCSV({
            tabs: normalizedTabs,
            returnBlob: wantsPersistence,
          })
        )
      );
    }

    const resolvedArtifacts = (await Promise.all(artifactPromises))
      .filter(Boolean)
      .map((artifact) => (artifact && artifact.blob ? artifact : null))
      .filter(Boolean);

    const triggerLocalDownload = (artifact) => {
      try {
        if (!artifact?.blob) return;
        const url = URL.createObjectURL(artifact.blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download =
          artifact.filename || `seating-export-${Date.now()}.${artifact.format || 'dat'}`;
        anchor.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        // console.warn('[useSeatingPlan] local download failed', error);
      }
    };

    if (!wantsPersistence) {
      resolvedArtifacts.forEach(triggerLocalDownload);
      return { exported: resolvedArtifacts };
    }

    const summarySource = snapshot && typeof snapshot === 'object' ? snapshot : null;
    const summary = summarySource
      ? Object.fromEntries(
          Object.entries({
            tab: summarySource.tab || null,
            hallWidth: summarySource.hallSize?.width ?? null,
            hallHeight: summarySource.hallSize?.height ?? null,
            tables: Array.isArray(summarySource.tables) ? summarySource.tables.length : null,
            guests:
              typeof summarySource.guestsCount === 'number' ? summarySource.guestsCount : null,
            areas: Array.isArray(summarySource.areas) ? summarySource.areas.length : null,
          }).filter(([, value]) => value !== null && value !== undefined)
        )
      : null;

    const exportId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const exportDocRef = fsDoc(db, 'weddings', activeWedding, 'exports', exportId);

    const baseDoc = {
      type: 'seating-plan',
      status: 'processing',
      formats: uniqueFormats,
      tabs: normalizedTabs,
      contents,
      config: sanitizedConfig,
      createdAt: serverTimestamp(),
      createdBy: {
        uid: currentUserId || null,
        name: currentUserName || null,
      },
    };
    if (summary && Object.keys(summary).length > 0) {
      baseDoc.summary = summary;
    }

    await setDoc(exportDocRef, baseDoc);

    const filesMeta = [];
    try {
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const storage = getStorage();
      const basePath = `weddings/${activeWedding}/exports/${exportId}`;

      for (const artifact of resolvedArtifacts) {
        if (!artifact?.blob) continue;
        const storagePath = `${basePath}/${artifact.filename}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, artifact.blob, {
          contentType: artifact.mimeType || 'application/octet-stream',
        });
        const downloadURL = await getDownloadURL(storageRef);
        filesMeta.push({
          format: artifact.format || null,
          filename: artifact.filename || null,
          storagePath,
          size: typeof artifact.blob.size === 'number' ? artifact.blob.size : null,
          contentType: artifact.mimeType || null,
          downloadURL,
        });
      }

      await setDoc(
        exportDocRef,
        {
          status: 'ready',
          files: filesMeta,
          completedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      // console.error('[useSeatingPlan] exportAdvancedReport upload error', error);
      await setDoc(
        exportDocRef,
        {
          status: 'failed',
          error: { message: error?.message || 'upload_failed' },
          completedAt: serverTimestamp(),
        },
        { merge: true }
      );
      resolvedArtifacts.forEach(triggerLocalDownload);
      throw error;
    }

    resolvedArtifacts.forEach(triggerLocalDownload);

    return {
      exportId,
      files: filesMeta,
    };
  };

  // Guardado de configuración
  const saveHallDimensions = async (width, height, aisleMin) => {
    const nextHall = { width, height };
    if (Number.isFinite(aisleMin)) nextHall.aisleMin = aisleMin;
    setHallSize(nextHall);
    if (!canPersist || !activeWedding) {
      const current = readLocalState('banquet') || {};
      writeLocalState('banquet', {
        ...current,
        hallSize: nextHall,
        globalMaxSeats,
        background: current.background ?? background ?? null,
        tables: Array.isArray(tablesBanquet) ? tablesBanquet : current.tables || [],
        areas: Array.isArray(areasBanquet) ? areasBanquet : current.areas || [],
      });
      return;
    }
    if (activeWedding) {
      try {
        const cfgRef = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet', 'config');
        const toSave = { width, height };
        if (Number.isFinite(aisleMin)) toSave.aisleMin = aisleMin;
        await setDoc(cfgRef, toSave, { merge: true });
        const timestamp = serverTimestamp();
        const ref = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet');
        markPendingWrite('banquet');
        await setDoc(
          ref,
          {
            config: { ...(Number.isFinite(aisleMin) ? { aisleMin } : {}), width, height },
            updatedAt: timestamp,
            meta: {
              lastEditor: collabClientIdRef.current,
              clientId: collabClientIdRef.current,
              updatedBy: currentUserName,
              color: collaboratorColorRef.current,
              updatedAt: timestamp,
            },
          },
          { merge: true }
        );
      } catch (err) {
        // console.error('Error guardando dimensiones del salón:', err);
      }
    }
  };
  const saveGlobalMaxGuests = async (n) => {
    const val = Number.parseInt(n, 10) || 0;
    setGlobalMaxSeats(val);
    if (!canPersist || !activeWedding) {
      const current = readLocalState('banquet') || {};
      writeLocalState('banquet', {
        ...current,
        hallSize: current.hallSize || hallSize,
        globalMaxSeats: val,
        background: current.background ?? background ?? null,
        tables: Array.isArray(tablesBanquet) ? tablesBanquet : current.tables || [],
        areas: Array.isArray(areasBanquet) ? areasBanquet : current.areas || [],
      });
      return;
    }
    if (activeWedding) {
      try {
        const ref = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet');
        const timestamp = serverTimestamp();
        markPendingWrite('banquet');
        await setDoc(
          ref,
          {
            config: {
              ...(hallSize || {}),
              ...(Number.isFinite(hallSize?.aisleMin) ? { aisleMin: hallSize.aisleMin } : {}),
              maxSeats: val,
            },
            updatedAt: timestamp,
            meta: {
              lastEditor: collabClientIdRef.current,
              clientId: collabClientIdRef.current,
              updatedBy: currentUserName,
              color: collaboratorColorRef.current,
              updatedAt: timestamp,
            },
          },
          { merge: true }
        );
      } catch (e) {
        // console.warn('saveGlobalMaxGuests failed', e);
      }
    }
  };
  const saveBackground = async (bg) => {
    setBackground(bg || null);
    if (!canPersist || !activeWedding) {
      const current = readLocalState('banquet') || {};
      writeLocalState('banquet', {
        ...current,
        hallSize: current.hallSize || hallSize,
        globalMaxSeats,
        background: bg || null,
        tables: Array.isArray(tablesBanquet) ? tablesBanquet : current.tables || [],
        areas: Array.isArray(areasBanquet) ? areasBanquet : current.areas || [],
      });
      return;
    }
    if (activeWedding) {
      try {
        const ref = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet');
        const timestamp = serverTimestamp();
        markPendingWrite('banquet');
        await setDoc(
          ref,
          {
            background: bg || null,
            updatedAt: timestamp,
            meta: {
              lastEditor: collabClientIdRef.current,
              clientId: collabClientIdRef.current,
              updatedBy: currentUserName,
              color: collaboratorColorRef.current,
              updatedAt: timestamp,
            },
          },
          { merge: true }
        );
      } catch (e) {
        // console.warn('saveBackground failed', e);
      }
    }
  };

  // No-ops requeridos por la UI
  const rotateSelected = (deg = 0) => {
    try {
      if (!selectedTable) return;
      const setFn = tab === 'ceremony' ? setTablesCeremony : setTablesBanquet;
      setFn((prev) =>
        prev.map((t) => (t.id === selectedTable.id ? { ...t, angle: (t.angle || 0) + deg } : t))
      );
    } catch (_) {}
  };
  const alignSelected = (axis = 'x', mode = 'center') => {
    try {
      const ids = Array.isArray(selectedIds) && selectedIds.length > 1 ? selectedIds : [];
      if (ids.length < 2) return;
      const arr = tab === 'ceremony' ? [...tablesCeremony] : [...tablesBanquet];
      const sel = arr.filter((t) => ids.map(String).includes(String(t.id)));
      if (sel.length < 2) return;
      const getCoord = (t) => (axis === 'x' ? t.x || 0 : t.y || 0);
      let target = 0;
      if (mode === 'start') target = Math.min(...sel.map(getCoord));
      else if (mode === 'end') target = Math.max(...sel.map(getCoord));
      else target = Math.round(sel.reduce((s, t) => s + getCoord(t), 0) / sel.length);
      const setFn = tab === 'ceremony' ? setTablesCeremony : setTablesBanquet;
      setFn((prev) =>
        prev.map((t) => (ids.map(String).includes(String(t.id)) ? { ...t, [axis]: target } : t))
      );
    } catch (_) {}
  };
  const distributeSelected = (axis = 'x') => {
    try {
      const ids = Array.isArray(selectedIds) && selectedIds.length > 2 ? selectedIds : [];
      if (ids.length < 3) return;
      const arr = tab === 'ceremony' ? [...tablesCeremony] : [...tablesBanquet];
      const sel = arr
        .filter((t) => ids.map(String).includes(String(t.id)))
        .sort((a, b) => (axis === 'x' ? (a.x || 0) - (b.x || 0) : (a.y || 0) - (b.y || 0)));
      const first = axis === 'x' ? sel[0].x || 0 : sel[0].y || 0;
      const last = axis === 'x' ? sel[sel.length - 1].x || 0 : sel[sel.length - 1].y || 0;
      const step = (last - first) / (sel.length - 1);
      const setFn = tab === 'ceremony' ? setTablesCeremony : setTablesBanquet;
      const idOrder = sel.map((t) => String(t.id));
      setFn((prev) =>
        prev.map((t) => {
          const idx = idOrder.indexOf(String(t.id));
          if (idx === -1) return t;
          const val = Math.round(first + idx * step);
          return axis === 'x' ? { ...t, x: val } : { ...t, y: val };
        })
      );
    } catch (_) {}
  };
  const fixTablePosition = (tableId) => {
    try {
      const w = hallSize?.width || 1800;
      const h = hallSize?.height || 1200;
      const margin = 20;
      const setFn = tab === 'ceremony' ? setTablesCeremony : setTablesBanquet;
      setFn((prev) =>
        prev.map((t) => {
          if (String(t.id) !== String(tableId)) return t;
          let x = t.x || 0;
          let y = t.y || 0;
          // Clamp to hall bounds with margin
          x = Math.max(margin, Math.min(w - margin, x));
          y = Math.max(margin, Math.min(h - margin, y));
          return { ...t, x, y };
        })
      );
    } catch (_) {}
  };

  const executeSmartAction = (action) => {
    try {
      if (!action || typeof action !== 'object') return { ok: false, error: 'invalid-action' };
      switch (action.type) {
        case 'reassign': {
          if (!action.guestId) return { ok: false, error: 'missing-guest' };
          moveGuest(action.guestId, action.toTableId ?? null);
          return { ok: true, type: action.type };
        }
        case 'fix-position': {
          if (!action.tableId) return { ok: false, error: 'missing-table' };
          fixTablePosition(action.tableId);
          return { ok: true, type: action.type };
        }
        case 'focus-table': {
          // Handler externo enfoca mesa; no mutamos estado aqu�
          return { ok: true, type: action.type };
        }
        default:
          return { ok: false, error: 'unsupported-action' };
      }
    } catch (error) {
      return { ok: false, error: error?.message || 'smart-action-failed' };
    }
  };

  // Snapshots (localStorage)
  const storagePrefix = (activeWedding && `seatingPlan:${activeWedding}`) || 'seatingPlan:local';
  const indexKey = `${storagePrefix}:snapshots:index`;
  const listSnapshots = () => {
    try {
      const raw = localStorage.getItem(indexKey);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  };
  const saveSnapshot = (name) => {
    try {
      const safe = String(name || '').trim();
      if (!safe) return false;
      const key = `${storagePrefix}:snapshot:${safe}`;
      localStorage.setItem(key, JSON.stringify(makeSnapshot()));
      const idx = listSnapshots();
      if (!idx.includes(safe)) {
        localStorage.setItem(indexKey, JSON.stringify([...idx, safe]));
      }
      return true;
    } catch (e) {
      return false;
    }
  };
  const loadSnapshot = (name) => {
    try {
      const key = `${storagePrefix}:snapshot:${String(name || '').trim()}`;
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      applySnapshot(JSON.parse(raw));
      return true;
    } catch (e) {
      return false;
    }
  };
  const deleteSnapshot = (name) => {
    try {
      const safe = String(name || '').trim();
      const key = `${storagePrefix}:snapshot:${safe}`;
      localStorage.removeItem(key);
      const idx = listSnapshots().filter((n) => n !== safe);
      localStorage.setItem(indexKey, JSON.stringify(idx));
      return true;
    } catch (e) {
      return false;
    }
  };

  // Setter merge para scoringWeights
  const updateScoringWeights = (patch) => {
    try {
      setScoringWeights((prev) => ({ ...(prev || {}), ...(patch || {}) }));
    } catch (e) {}
  };

  return {
    // Estados
    tab,
    setTab,
    hallSize,
    areas,
    tables,
    seats,
    selectedTable,
    selectedIds,
    configTable,
    preview,
    guests,
    ceremonySettings,
    setCeremonySettings,

    // Estados de modales
    ceremonyConfigOpen,
    setCeremonyConfigOpen,
    banquetConfigOpen,
    setBanquetConfigOpen,
    spaceConfigOpen,
    setSpaceConfigOpen,
    templateOpen,
    setTemplateOpen,

    // Referencias
    canvasRef,
    wsRef,

    // Colaboraci�n
    collaborators,
    collaborationStatus,
    locks,
    lockEvent,
    consumeLockEvent,
    collabClientId: collabClientIdRef.current,

    // Funciones de estado
    setAreas,
    setTables,
    setSelectedTable,
    setConfigTable,
    setPreview,
    setGuests,

    // Funciones de gestión
    handleSelectTable,
    handleTableDimensionChange,
    toggleSelectedTableShape,
    moveTable,
    deleteTable,
    duplicateTable,
    toggleTableLocked,
    addTable,
    updateTable, // NUEVA FUNCIÓN AGREGADA
    addArea,
    updateArea,
    deleteArea,
    ensureTableLock,
    releaseTableLocksExcept,

    // Historial
    pushHistory,
    undo,
    redo,
    canUndo: historyPointer > 0,
    canRedo: historyPointer < history.length - 1,

    // Generación
    generateSeatGrid,
    generateBanquetLayout,
    applyBanquetTables,
    clearBanquetLayout,
    resetSeatingPlan, // ✅ NUEVO: Reset completo del seating plan
    setupSeatingPlanAutomatically, // Generación TODO automática ✨
    generateAutoLayoutFromGuests,
    analyzeCurrentGuests,

    // Exportaciones
    exportPNG,
    exportCSV,
    exportPDF,
    exportSVG,
    exportAdvancedReport,

    // Configuración
    saveHallDimensions,
    saveGlobalMaxGuests,
    saveBackground,
    setBackground,
    ceremonySettings,
    setCeremonySettings,

    // Preferencias/validaciones/lienzo
    drawMode,
    setDrawMode,
    validationsEnabled,
    setValidationsEnabled,
    snapToGrid,
    setSnapToGrid,
    gridStep,
    globalMaxSeats,
    background,
    smartRecommendations,
    smartConflictSuggestions,
    smartInsights,
    vipRecipients,

    // Invitados / auto-asignación / sugerencias
    moveGuest,
    moveGuestToSeat,
    assignGuestToCeremonySeat,
    autoAssignGuests,
    autoAssignGuestsRules,
    suggestTablesForGuest,
    scoringWeights,
    setScoringWeights: updateScoringWeights,
    executeSmartAction,
    conflicts,

    // No-ops
    rotateSelected,
    alignSelected,
    distributeSelected,
    fixTablePosition,

    // Snapshots
    listSnapshots,
    saveSnapshot,
    loadSnapshot,
    deleteSnapshot,

    // Utilidades
    normalizeId,

    // Generación automática
    generateAutoLayoutFromGuests,
    analyzeCurrentGuests,
  };
};
