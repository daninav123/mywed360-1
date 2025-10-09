// Hook de GestiÃ³n del plan de asientos
import {
  doc as fsDoc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useState, useRef, useEffect, useMemo } from 'react';

import { useWedding } from '../context/WeddingContext';
import { db } from '../firebaseConfig';
import {
  createTableFromType,
  sanitizeTable,
  updateTableWithField,
  inferTableType,
} from '../utils/seatingTables';

// Utilidad para normalizar IDs de mesas
export const normalizeId = (id) => {
  const num = parseInt(id, 10);
  return !isNaN(num) ? num : id;
};

export const useSeatingPlan = () => {
  const { activeWedding } = useWedding();

  // Estados principales
  const [tab, setTab] = useState('ceremony');
  const [hallSize, setHallSize] = useState({ width: 1800, height: 1200 });
  const [drawMode, setDrawMode] = useState('pan');
  const [validationsEnabled, setValidationsEnabled] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridStep] = useState(20);
  const [globalMaxSeats, setGlobalMaxSeats] = useState(0);
  const [background, setBackground] = useState(null);
  const [scoringWeights, setScoringWeights] = useState({ fit: 50, side: 10, wants: 20, avoid: -10 });
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
  const [tablesBanquet, setTablesBanquet] = useState([]);

  // Estados de UI
  const [selectedTable, setSelectedTable] = useState(null);
  const [configTable, setConfigTable] = useState(null);
  const [preview, setPreview] = useState(null);
  const [guests, setGuests] = useState([]);

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

  // Estados computados basados en la pestaÃ±a activa
  const areas = tab === 'ceremony' ? areasCeremony : areasBanquet;
  const setAreas = tab === 'ceremony' ? setAreasCeremony : setAreasBanquet;
  const tables = tab === 'ceremony' ? tablesCeremony : tablesBanquet;
  const seats = tab === 'ceremony' ? seatsCeremony : [];
  const setTables = tab === 'ceremony' ? setTablesCeremony : setTablesBanquet;

  // Cargar dimensiones del salÃ³n (y compatibilidad con estructura nueva/legacy)
  useEffect(() => {
    if (!activeWedding) return;
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
        console.warn('No se pudieron cargar dimensiones del salÃ³n:', err);
      }
    };
    loadHallDimensions();
  }, [activeWedding]);

  // Cargar configuración de ceremonia (seats/tables/areas/settings)
  useEffect(() => {
    if (!activeWedding) return;
    let cancelled = false;
    const loadCeremonyPlan = async () => {
      try {
        const ref = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'ceremony');
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const data = snap.data() || {};
        if (cancelled) return;
        if (Array.isArray(data.seats)) setSeatsCeremony(data.seats);
        if (Array.isArray(data.tables)) setTablesCeremony(data.tables);
        if (Array.isArray(data.areas)) setAreasCeremony(data.areas);
        const loadedSettings =
          data.settings && typeof data.settings === 'object' ? data.settings.ceremony : undefined;
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
        console.warn('No se pudieron cargar datos de ceremonia:', err);
      }
    };
    loadCeremonyPlan();
    return () => {
      cancelled = true;
    };
  }, [activeWedding]);

  // Suscribirse a cambios en el estado de sincronizaciÃ³n
  useEffect(() => {  }, []);

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
      if (!activeWedding) return;
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
          const payload = {
            seats: Array.isArray(seatsCeremony) ? seatsCeremony : [],
            tables: Array.isArray(tablesCeremony) ? tablesCeremony : [],
            areas: Array.isArray(areasCeremony) ? areasCeremony : [],
            ...(settingsPayload ? { settings: settingsPayload } : {}),
            updatedAt: serverTimestamp(),
          };
          const isEmpty =
            (!payload.seats || payload.seats.length === 0) &&
            (!payload.tables || payload.tables.length === 0) &&
            (!payload.areas || payload.areas.length === 0);
          if (isEmpty) return; // Evitar crear doc vacÃ­o
          await setDoc(ref, payload, { merge: true });
        } catch (e) {
          console.warn('[useSeatingPlan] Autosave ceremony error:', e);
        }
      }, 800);
      return () => {
        try { clearTimeout(ceremonySaveTimerRef.current); } catch (_) {}
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
          if (hallSize && typeof hallSize.width === 'number' && typeof hallSize.height === 'number') {
            cfg.width = hallSize.width;
            cfg.height = hallSize.height;
            if (Number.isFinite(hallSize.aisleMin)) cfg.aisleMin = hallSize.aisleMin;
            if (Number.isFinite(globalMaxSeats)) cfg.maxSeats = globalMaxSeats;
          }
          const payload = {
            ...(Object.keys(cfg).length ? { config: cfg } : {}),
            ...(background ? { background } : {}),
            tables: Array.isArray(tablesBanquet) ? tablesBanquet : [],
            areas: Array.isArray(areasBanquet) ? areasBanquet : [],
            updatedAt: serverTimestamp(),
          };
          const hasTables = Array.isArray(payload.tables) && payload.tables.length > 0;
          const hasAreas = Array.isArray(payload.areas) && payload.areas.length > 0;
          const hasConfig = !!(cfg.width && cfg.height);
          const isEmpty = !hasTables && !hasAreas && !hasConfig;
          if (isEmpty) return; // Evitar crear doc vacÃ­o
          await setDoc(ref, payload, { merge: true });
        } catch (e) {
          console.warn('[useSeatingPlan] Autosave banquet error:', e);
        }
      }, 800);
      return () => {
        try { clearTimeout(banquetSaveTimerRef.current); } catch (_) {}
      };
    } catch (_) {}
  }, [activeWedding, tablesBanquet, areasBanquet, hallSize?.width, hallSize?.height, hallSize?.aisleMin, globalMaxSeats, background]);

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

  // GestiÃ³n de mesas
  const handleSelectTable = (id, multi = false) => {
    const table = tables.find((t) => String(t.id) === String(id));
    if (!multi) {
      setSelectedIds(id == null ? [] : [id]);
      setSelectedTable(table || null);
      return;
    }
    // Multi-selecciÃ³n: alterna en selectedIds, mantÃ©n selectedTable como Ãºltimo clicado
    setSelectedIds((prev) => {
      const s = new Set((prev || []).map(String));
      const key = String(id);
      if (s.has(key)) s.delete(key); else s.add(key);
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
      selectedTable.tableType === 'round' || selectedTable.shape === 'circle'
        ? 'square'
        : 'round';
    const updated = updateTableWithField(selectedTable, 'tableType', nextType);
    const sanitized = sanitizeTable(updated, { forceAuto: true });
    setSelectedTable(sanitized);
    setTables((prev) => prev.map((t) => (t.id === selectedTable.id ? sanitized : t)));
  };
  const moveTable = (tableId, pos, { finalize } = { finalize: true }) => {
    const apply = (prev) => prev.map((t) => (String(t.id) === String(tableId) ? { ...t, x: pos.x, y: pos.y } : t));
    if (tab === 'ceremony') setTablesCeremony((p) => apply(p)); else setTablesBanquet((p) => apply(p));
    if (finalize) {
      try {
        pushHistory({ type: tab, tables: tab === 'ceremony' ? tablesCeremony : tablesBanquet, areas: tab === 'ceremony' ? areasCeremony : areasBanquet, seats: tab === 'ceremony' ? seatsCeremony : [] });
      } catch (_) {}
    }
  };
  const deleteTable = (tableId) => {
    if (tab === 'ceremony') setTablesCeremony((prev) => prev.filter((t) => String(t.id) !== String(tableId)));
    else setTablesBanquet((prev) => prev.filter((t) => String(t.id) !== String(tableId)));
  };
  const duplicateTable = (tableId) => {
      const source = tab === 'ceremony' ? tablesCeremony : tablesBanquet;
      const setFn = tab === 'ceremony' ? setTablesCeremony : setTablesBanquet;
      const t = source.find((x) => String(x.id) === String(tableId));
      if (!t) return;
      const maxId = source.reduce((m, x) => { const n = parseInt(x.id, 10); return Number.isFinite(n) ? Math.max(m, n) : m; }, 0);
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
    setFn((prev) => prev.map((t) => (String(t.id) === String(tableId) ? { ...t, locked: !t.locked } : t)));
  };

  const addTable = (table = {}) => {
    const typeHint =
      table.tableType ||
      (table.shape === 'circle' ? 'round' : inferTableType(table));
    const base = createTableFromType(typeHint, {
      ...table,
      id: Date.now(),
      autoCapacity: table.autoCapacity ?? true,
    });
    const sanitized = sanitizeTable(base, { forceAuto: base.autoCapacity });
    if (tab === 'ceremony') {
      setTablesCeremony((prev) => [...prev, sanitized]);
    } else {
      setTablesBanquet((prev) => [...prev, sanitized]);
    }
  };

  // Ãreas (perÃ­metro/puertas/obstÃ¡culos/pasillos)
  const addArea = (area) => {
    const normalize = (a) => (Array.isArray(a) || a?.points ? a : []);
    if (tab === 'ceremony') setAreasCeremony((prev) => [...prev, normalize(area)]);
    else setAreasBanquet((prev) => [...prev, normalize(area)]);
    // Guardar en historial tras aÃ±adir Ã¡rea
    try { pushHistory(); } catch (_) {}
  };
  const deleteArea = (index) => {
    const del = (arr) => arr.filter((_, i) => i !== index);
    if (tab === 'ceremony') setAreasCeremony((prev) => del(prev)); else setAreasBanquet((prev) => del(prev));
  };
  const updateArea = (index, updated) => {
    const upd = (arr) => arr.map((a, i) => (i === index ? updated : a));
    if (tab === 'ceremony') setAreasCeremony((prev) => upd(prev)); else setAreasBanquet((prev) => upd(prev));
  };

  // GeneraciÃ³n de layouts
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
    gapX = 140,
    gapY = 160,
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
  const clearBanquetLayout = () => setTablesBanquet([]);

  // Invitados y asientos
  const moveGuest = (guestId, tableId) => {
    setGuests((prev) => prev.map((g) => (String(g.id) === String(guestId) ? { ...g, tableId: tableId == null ? null : tableId, table: tableId == null ? null : String(tableId) } : g)));
  };
  const moveGuestToSeat = (guestId, tableId, _seatIdx) => { moveGuest(guestId, tableId); };
  const assignGuestToCeremonySeat = async (seatId, guestId) => {
    setSeatsCeremony((prev) => prev.map((s) => (String(s.id) === String(seatId) ? { ...s, guestId, guestName: (guests.find((g) => String(g.id) === String(guestId)) || {}).name || null } : s)));
    return true;
  };
  const toggleSeatEnabled = (seatId) => {
    setSeatsCeremony((prev) => prev.map((s) => (String(s.id) === String(seatId) ? { ...s, enabled: s.enabled === false ? true : !s.enabled } : s)));
  };

  // SelecciÃ³n mÃºltiple directa desde el canvas (reemplazo o uniÃ³n)
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

  // Auto-asignaciÃ³n y sugerencias bÃ¡sicas
  const autoAssignGuests = async () => {
    try {
      const pending = guests.filter((g) => !g.tableId && !g.table);
      if (pending.length === 0) return { ok: true, method: 'local', assigned: 0 };
      const occ = new Map();
      guests.forEach((g) => {
        const tid = g?.tableId != null ? String(g.tableId) : null;
        if (!tid) return;
        occ.set(tid, (occ.get(tid) || 0) + 1 + (parseInt(g.companion, 10) || 0));
      });
      let assigned = 0;
      const updated = [...guests];
      pending.forEach((g) => {
        const table = tablesBanquet.find((t) => {
          const cap = parseInt(t.seats, 10) || globalMaxSeats || 0;
          const used = occ.get(String(t.id)) || 0;
          return cap === 0 || used + 1 + (parseInt(g.companion, 10) || 0) <= cap;
        });
        if (table) {
          const tid = String(table.id);
          occ.set(tid, (occ.get(tid) || 0) + 1 + (parseInt(g.companion, 10) || 0));
          assigned += 1 + (parseInt(g.companion, 10) || 0);
          const idx = updated.findIndex((x) => String(x.id) === String(g.id));
          if (idx >= 0) updated[idx] = { ...updated[idx], tableId: table.id, table: String(table.id) };
        }
      });
      setGuests(updated);
      return { ok: true, method: 'local', assigned };
    } catch (e) {
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

  const conflicts = useMemo(() => {
    if (!validationsEnabled) return [];
    try {
      const out = [];
      // ---- Banquete ----
      const boundary = (() => {
        try {
          const b = (areasBanquet || []).find(
            (a) => !Array.isArray(a) && a?.type === 'boundary' && Array.isArray(a?.points) && a.points.length >= 3
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
          return { minX: (t.x || 0) - r, minY: (t.y || 0) - r, maxX: (t.x || 0) + r, maxY: (t.y || 0) + r };
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
          const intersect = (yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi || 1e-9) + xi;
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
        (tablesBanquet || [])
          .map((t) => String(t?.name || '').trim())
          .filter(Boolean)
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
        // 1) Perímetro
        if (boundary && !boxInsidePoly(box, boundary)) {
          out.push({ type: 'perimeter', tableId: t.id, message: 'Fuera del perímetro' });
          return; // prioriza perímetro
        }
        // 2) Obstáculos/puertas
        if (obstacles.some((o) => rectsOverlap(padded, o))) {
          out.push({ type: 'obstacle', tableId: t.id, message: 'Colisión con obstáculo/puerta' });
          return;
        }
        // 3) Espaciado mínimo entre mesas
        const others = (tablesBanquet || []).filter((x) => String(x?.id) !== tid);
        const otherExpanded = others.map(getTableBox).map((b) => expandBox(b, aisle / 2));
        if (otherExpanded.some((o) => rectsOverlap(padded, o))) {
          out.push({ type: 'spacing', tableId: t.id, message: 'Distancia insuficiente entre mesas' });
          return;
        }
      });

      // ---- Ceremonia ----
      try {
        const cerBoundary = (() => {
          const b = (areasCeremony || []).find(
            (a) => !Array.isArray(a) && a?.type === 'boundary' && Array.isArray(a?.points) && a.points.length >= 3
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
            out.push({ type: 'perimeter', tableId: `S${s.id}`, message: 'Silla fuera del perímetro' });
            return;
          }
          if (cerObstacles.some((o) => px >= o.minX && px <= o.maxX && py >= o.minY && py <= o.maxY)) {
            out.push({ type: 'obstacle', tableId: `S${s.id}`, message: 'Silla sobre obstáculo/puerta' });
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
        table?.name && String(table.name).trim()
          ? `name-${String(table.name).trim()}`
          : null;
      const assignedGuests = [
        ...(assignments.get(idKey) || []),
        ...(nameKey ? assignments.get(nameKey) || [] : []),
      ];
      const companions = assignedGuests.reduce(
        (sum, guest) => sum + (parseInt(guest?.companion, 10) || 0),
        0
      );
      const capacity = parseInt(table.seats, 10) || globalMaxSeats || 0;
      const used = assignedGuests.length + companions;
      const free = capacity > 0 ? Math.max(0, capacity - used) : 0;
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
        conflictReasons,
        isVipTable: keywordMatch(table?.name, SMART_VIP_KEYWORDS),
        sideHints,
      };
    });
  }, [tablesBanquet, guests, conflicts, globalMaxSeats]);

  const smartRecommendations = useMemo(() => {
    const pendingGuests = (guests || []).filter(
      (guest) => !guest?.tableId && !guest?.table
    );
    if (!pendingGuests.length || !smartTableMeta.length) return [];

    const buildReason = (message, weight) => ({ message, weight });

    const evaluateTable = (guest, meta) => {
      if (meta.free <= 0) return { score: -Infinity, reasons: [] };
      const desiredSeats = 1 + (parseInt(guest?.companion, 10) || 0);
      if (meta.free < desiredSeats) return { score: -Infinity, reasons: [] };

      let score = 0;
      const reasons = [];
      const remainingAfter = meta.free - desiredSeats;
      const capacityScore = Math.max(0, 28 - Math.max(0, remainingAfter) * 5);
      score += capacityScore;
      reasons.push(buildReason(`Quedan ${meta.free} asientos libres`, capacityScore));

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
            buildReason(
              `Mesa con ${sameGroupCount} invitado(s) del grupo "${group}"`,
              bonus
            )
          );
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
        reasons.push(
          buildReason(`Mesa con ${meta.conflictReasons.length} conflicto(s)`, -14)
        );
      }

      if (desiredSeats > 1 && remainingAfter === 0) {
        score += 5;
        reasons.push(buildReason('Encaja justo incluyendo acompañantes', 5));
      }

      return { score, reasons };
    };

    return pendingGuests
      .map((guest) => {
        const evaluations = smartTableMeta
          .map((meta) => {
            const { score, reasons } = evaluateTable(guest, meta);
            return {
              tableId: meta.tableId,
              tableName: meta.table?.name || `Mesa ${meta.tableId}`,
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

  const smartInsights = useMemo(() => {
    const pendingGuests = (guests || []).filter(
      (guest) => !guest?.tableId && !guest?.table
    );
    const vipPending = pendingGuests.filter((guest) =>
      keywordMatch(
        [guest?.tags, guest?.group, guest?.notes, guest?.name].join(' '),
        SMART_VIP_KEYWORDS
      )
    ).length;
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
      tablesNearlyFull,
      conflictCount: conflicts.length,
      companionSeats,
    };
  }, [guests, smartTableMeta, conflicts]);

  // Conflictos: perÃ­metro, obstÃ¡culos/puertas, pasillos (espaciado) y overbooking
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
    } catch (error) { console.error('Error exportando PNG:', error); }
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
    } catch (error) { console.error('Error exportando PDF:', error); }
  };
  const exportCSV = async (options = {}) => {
    const { tabs: selectedTabs } = options;
    try {
      const requestedTabs = Array.isArray(selectedTabs) && selectedTabs.length ? selectedTabs : ['banquet', 'ceremony'];
      const rows = [
        ['guestId', 'name', 'tab', 'table', 'companions', 'notes'].join(','),
        ...guests.map((g) => {
          const tableName = g.table ?? g.tableId ?? '';
          const tabForGuest = (() => {
            if (requestedTabs.includes('banquet') && tableName) return 'banquet';
            if (requestedTabs.includes('ceremony') && seatsCeremony.some((seat) => String(seat.guestId) === String(g.id))) {
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seating-${requestedTabs.join('-')}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.warn('CSV export failed', e); }
  };
  const exportSVG = async () => {
    try {
      const w = hallSize?.width || 1800;
      const h = hallSize?.height || 1200;
      const header = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${w}\" height=\"${h}\">`;
      const footer = '</svg>';
      const body = [
        ...areasBanquet.map((a) => {
          const pts = Array.isArray(a?.points) ? a.points : Array.isArray(a) ? a : [];
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + (pts.length ? ' Z' : '');
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seating-${tab}-${Date.now()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.warn('SVG export failed', e); }
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
      console.warn('No se pudo cargar el logotipo para la exportación', error);
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
        hallDimensions: 'Dimensiones del salón',
        aisle: 'Pasillo mínimo',
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
        instructionsPasillos: 'Respeta el pasillo mínimo indicado para el montaje.',
        instructionsRevisar: 'Revisar el plano antes de la llegada de proveedores.',
        instructionsCapacidad: 'Verificar que la capacidad asignada no exceda el máximo global.',
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

  const exportDetailedPDF = async (options) => {
    const {
      tabs: requestedTabs = ['ceremony', 'banquet'],
      contents = [],
      config: exportConfig = {},
      logoDataUrl = null,
    } = options;
    const language = exportConfig.language || 'es';
    const orientation =
      exportConfig.orientation === 'landscape' || exportConfig.orientation === 'portrait'
        ? exportConfig.orientation
        : 'portrait';
    const pdf = new jsPDF(orientation === 'landscape' ? 'landscape' : 'portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 14;
    const marginY = 16;
    const bodyFont = 11;
    const smallFont = 9;
    let cursorY = marginY;

    const ensureSpace = (needed = 6) => {
      if (cursorY + needed > pageHeight - marginY) {
        pdf.addPage();
        cursorY = marginY;
      }
    };

    const addHeading = (text, size = 14) => {
      ensureSpace(size / 2 + 4);
      pdf.setFontSize(size);
      pdf.setFont('helvetica', 'bold');
      pdf.text(text, marginX, cursorY);
      cursorY += size / 2 + 4;
      pdf.setFontSize(bodyFont);
      pdf.setFont('helvetica', 'normal');
    };

    const addParagraph = (text, options = {}) => {
      const { fontSize = bodyFont, bold = false } = options;
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      const lines = pdf.splitTextToSize(text, pageWidth - marginX * 2);
      lines.forEach((line) => {
        ensureSpace(fontSize / 2 + 2);
        pdf.text(line, marginX, cursorY);
        cursorY += fontSize / 2 + 2;
      });
      pdf.setFontSize(bodyFont);
      pdf.setFont('helvetica', 'normal');
    };

    if (logoDataUrl) {
      try {
        const logoWidth = 32;
        const logoHeight = 12;
        pdf.addImage(logoDataUrl, 'PNG', pageWidth - marginX - logoWidth, marginY - 4, logoWidth, logoHeight);
      } catch (error) {
        console.warn('No se pudo incrustar el logotipo en el PDF', error);
      }
    }

    addHeading(translate(language, 'reportTitle'), 16);
    addParagraph(
      `${translate(language, 'generatedAt')} ${new Date().toLocaleString(language.toLowerCase())}`,
      { fontSize: smallFont }
    );

    addHeading(translate(language, 'summary'), 13);
    if (exportConfig.includeMeasures) {
      const hallSummary = [
        `${translate(language, 'hallDimensions')}: ${((hallSize?.width || 0) / 100).toFixed(1)} m × ${(
          (hallSize?.height || 0) / 100
        ).toFixed(1)} m`,
      ];
      if (hallSize?.aisleMin != null) {
        hallSummary.push(
          `${translate(language, 'aisle')}: ${(hallSize.aisleMin / 100).toFixed(2)} m`
        );
      }
      hallSummary.forEach((line) => addParagraph(`• ${line}`));
    }
    if (exportConfig.scale) {
      addParagraph(`• ${translate(language, 'scale', 'Escala')}: ${exportConfig.scale}`);
    }
    const legendItems = [
      translate(language, 'legendVip'),
      translate(language, 'legendLocked'),
      translate(language, 'legendCapacity'),
      translate(language, 'legendConflict'),
      translate(language, 'legendNotes'),
    ];

    const tabsData = requestedTabs
      .map((tab) => collectTabReport(normalizeTabId(tab)))
      .filter(Boolean);

    if (contents.includes('legend')) {
      addHeading(translate(language, 'legend'), 13);
      legendItems.forEach((item) => addParagraph(`• ${item}`, { fontSize: bodyFont }));
    }

    tabsData.forEach((tabData, index) => {
      if (index > 0 || contents.includes('legend')) {
        pdf.addPage();
        cursorY = marginY;
      }
      addHeading(tabData.title, 14);

      if (tabData.id === 'ceremony') {
        addParagraph(
          `${translate(language, 'ceremonyRows')}: ${tabData.rows.length} · ${translate(
            language,
            'guestList'
          )}: ${tabData.guests.length}`
        );
        tabData.rows.forEach((row) => {
          addParagraph(
            `${row.label} — ${row.assigned}/${row.enabled} ${
              row.reservedLabel ? `(${row.reservedLabel})` : ''
            }`
          );
          if (contents.includes('guestList') && row.guests.length) {
            const guestNames = row.guests.map((guest) => guest.name || '—').join(', ');
            addParagraph(`   ${translate(language, 'guestList')}: ${guestNames}`, {
              fontSize: smallFont,
            });
          }
        });
        if (contents.includes('providerNotes') && tabData.notes) {
          addHeading(translate(language, 'vipNotes'), 12);
          addParagraph(tabData.notes, { fontSize: bodyFont });
        }
      } else if (tabData.id === 'banquet') {
        addParagraph(
          `${translate(language, 'banquetTables')}: ${tabData.totalTables} · ${translate(
            language,
            'guestList'
          )}: ${tabData.totalGuestsSeated}`
        );
        if (contents.includes('guestList')) {
          tabData.tables.forEach((table) => {
            addParagraph(
              `${table.name} — ${table.assignedCount}/${table.seats}${
                table.locked ? ' · Locked' : ''
              }`
            );
            if (table.assignedGuests.length) {
              const guestNames = table.assignedGuests
                .map((guest) => guest.name || '—')
                .join(', ');
              addParagraph(`   ${guestNames}`, { fontSize: smallFont });
            }
          });
        }
      } else if (tabData.id === 'free-draw') {
        addParagraph(
          `${translate(language, 'freeDrawZones')}: ${tabData.shapeCount}`
        );
      }

      if (contents.includes('conflicts')) {
        addHeading(translate(language, 'conflicts'), 12);
        if (!conflicts.length) {
          addParagraph(translate(language, 'noConflicts'), { fontSize: smallFont });
        } else {
          conflicts.forEach((conflict) => {
            addParagraph(
              `• ${conflict.tableId != null ? `Ref ${conflict.tableId}: ` : ''}${
                conflict.message || conflict.type
              }`,
              { fontSize: smallFont }
            );
          });
        }
      }

      if (contents.includes('setupInstructions')) {
        addHeading(translate(language, 'setupInstructions'), 12);
        const instructions = [
          translate(language, 'instructionsPasillos'),
          translate(language, 'instructionsRevisar'),
          translate(language, 'instructionsCapacidad'),
        ];
        instructions.forEach((instruction) =>
          addParagraph(`• ${instruction}`, { fontSize: bodyFont })
        );
      }

      if (contents.includes('providerNotes') && tabData.id !== 'ceremony') {
        addHeading(translate(language, 'providerNotes'), 12);
        const providerTexts = [];
        if (ceremonySettings?.notes) {
          providerTexts.push(ceremonySettings.notes);
        }
        if (exportConfig.presetName) {
          providerTexts.push(`Preset: ${exportConfig.presetName}`);
        }
        if (!providerTexts.length) {
          providerTexts.push('Sin notas registradas.');
        }
        providerTexts.forEach((text) => addParagraph(`• ${text}`, { fontSize: smallFont }));
      }
    });

    pdf.save(`seating-report-${Date.now()}.pdf`);
  };

  const exportDetailedSVG = (options) => {
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
    svgParts.push(`<rect x="0" y="0" width="${width + padding * 2}" height="${totalHeight}" fill="#ffffff"/>`);

    if (logoDataUrl) {
      svgParts.push(
        `<image href="${logoDataUrl}" x="${padding}" y="${padding / 2}" height="60" preserveAspectRatio="xMidYMid meet" />`
      );
    }

    requestedTabs.forEach((tab, index) => {
      const tabId = normalizeTabId(tab);
      const yOffset = padding + index * (height + padding);
      svgParts.push(
        `<g transform="translate(${padding}, ${yOffset})" data-tab="${tabId}">`
      );
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
          svgParts.push(`<path d="${d}" fill="none" stroke="#10b981" stroke-width="4" opacity="0.8"/>`);
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
            `<text x="${table.x}" y="${table.y + 6}" font-size="28" fill="#1f2937" text-anchor="middle">${table.name ||
              `Mesa ${table.id}`}</text>`
          );
        });
      } else if (tabId === 'free-draw') {
        (areasBanquet || []).forEach((shape) => {
          const pts = Array.isArray(shape?.points) ? shape.points : Array.isArray(shape) ? shape : [];
          if (!pts.length) return;
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
          svgParts.push(`<path d="${d}" fill="#dbeafe" stroke="#3b82f6" stroke-width="3" opacity="0.6"/>`);
        });
      }
      svgParts.push(`</g>`);
    });

    svgParts.push('</svg>');
    const svgString = svgParts.join('');
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `seating-advanced-${Date.now()}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportAdvancedReport = async (options = {}) => {
    const {
      formats = ['pdf'],
      tabs: requestedTabs = ['ceremony', 'banquet'],
      contents = [],
      config: exportConfig = {},
    } = options;
    const normalizedTabs = requestedTabs.map((tab) => normalizeTabId(tab));
    const uniqueFormats = Array.from(new Set(formats));
    const logoDataUrl = exportConfig.logoUrl ? await fetchImageAsDataURL(exportConfig.logoUrl) : null;

    const tasks = [];
    if (uniqueFormats.includes('pdf')) {
      tasks.push(
        exportDetailedPDF({
          tabs: normalizedTabs,
          contents,
          config: exportConfig,
          logoDataUrl,
        })
      );
    }
    if (uniqueFormats.includes('svg')) {
      tasks.push(
        Promise.resolve(
          exportDetailedSVG({
            tabs: normalizedTabs,
            config: exportConfig,
            logoDataUrl,
          })
        )
      );
    }
    if (uniqueFormats.includes('csv')) {
      tasks.push(exportCSV({ tabs: normalizedTabs }));
    }
    await Promise.all(tasks);
  };

  // Guardado de configuraciÃ³n
  const saveHallDimensions = async (width, height, aisleMin) => {
    const nextHall = { width, height };
    if (Number.isFinite(aisleMin)) nextHall.aisleMin = aisleMin;
    setHallSize(nextHall);
    if (activeWedding) {
      try {
        const cfgRef = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet', 'config');
        const toSave = { width, height };
        if (Number.isFinite(aisleMin)) toSave.aisleMin = aisleMin;
        await setDoc(cfgRef, toSave, { merge: true });
      } catch (err) { console.error('Error guardando dimensiones del salÃ³n:', err); }
    }
  };
  const saveGlobalMaxGuests = async (n) => {
    const val = Number.parseInt(n, 10) || 0;
    setGlobalMaxSeats(val);
    if (activeWedding) {
      try {
        const ref = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet');
        await setDoc(ref, { config: { ...(hallSize || {}), ...(Number.isFinite(hallSize?.aisleMin) ? { aisleMin: hallSize.aisleMin } : {}), maxSeats: val } }, { merge: true });
      } catch (e) { console.warn('saveGlobalMaxGuests failed', e); }
    }
  };
  const saveBackground = async (bg) => {
    setBackground(bg || null);
    if (activeWedding) {
      try {
        const ref = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet');
        await setDoc(ref, { background: bg || null }, { merge: true });
      } catch (e) { console.warn('saveBackground failed', e); }
    }
  };

  // No-ops requeridos por la UI
  const rotateSelected = (deg = 0) => {
    try {
      if (!selectedTable) return;
      const setFn = tab === 'ceremony' ? setTablesCeremony : setTablesBanquet;
      setFn((prev) => prev.map((t) => (t.id === selectedTable.id ? { ...t, angle: (t.angle || 0) + deg } : t)));
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
      setFn((prev) => prev.map((t) => (ids.map(String).includes(String(t.id)) ? { ...t, [axis]: target } : t)));
    } catch (_) {}
  };
  const distributeSelected = (axis = 'x') => {
    try {
      const ids = Array.isArray(selectedIds) && selectedIds.length > 2 ? selectedIds : [];
      if (ids.length < 3) return;
      const arr = tab === 'ceremony' ? [...tablesCeremony] : [...tablesBanquet];
      const sel = arr.filter((t) => ids.map(String).includes(String(t.id))).sort((a, b) => (axis === 'x' ? (a.x || 0) - (b.x || 0) : (a.y || 0) - (b.y || 0)));
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

  // Snapshots (localStorage)
  const storagePrefix = (activeWedding && `seatingPlan:${activeWedding}`) || 'seatingPlan:local';
  const indexKey = `${storagePrefix}:snapshots:index`;
  const listSnapshots = () => {
    try {
      const raw = localStorage.getItem(indexKey);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
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
    } catch (e) { return false; }
  };
  const loadSnapshot = (name) => {
    try {
      const key = `${storagePrefix}:snapshot:${String(name || '').trim()}`;
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      applySnapshot(JSON.parse(raw));
      return true;
    } catch (e) { return false; }
  };
  const deleteSnapshot = (name) => {
    try {
      const safe = String(name || '').trim();
      const key = `${storagePrefix}:snapshot:${safe}`;
      localStorage.removeItem(key);
      const idx = listSnapshots().filter((n) => n !== safe);
      localStorage.setItem(indexKey, JSON.stringify(idx));
      return true;
    } catch (e) { return false; }
  };

  // Setter merge para scoringWeights
  const updateScoringWeights = (patch) => {
    try { setScoringWeights((prev) => ({ ...(prev || {}), ...(patch || {}) })); } catch (e) {}
  };

  return {
    // Estados
    tab,
    setTab,    hallSize,
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

    // Funciones de estado
    setAreas,
    setTables,
    setSelectedTable,
    setConfigTable,
    setPreview,
    setGuests,

    // Funciones de gestiÃ³n
    handleSelectTable,
    handleTableDimensionChange,
    toggleSelectedTableShape,
    moveTable,
    deleteTable,
    duplicateTable,
    toggleTableLocked,
    addTable,
    addArea,
    updateArea,
    deleteArea,

    // Historial
    pushHistory,
    undo,
    redo,
    canUndo: historyPointer > 0,
    canRedo: historyPointer < history.length - 1,

    // GeneraciÃ³n
    generateSeatGrid,
    generateBanquetLayout,
    applyBanquetTables,
    clearBanquetLayout,

    // Exportaciones
    exportPNG,
    exportCSV,
    exportPDF,
    exportSVG,
    exportAdvancedReport,

    // ConfiguraciÃ³n
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
    smartInsights,

    // Invitados / auto-asignaciÃ³n / sugerencias
    moveGuest,
    moveGuestToSeat,
    assignGuestToCeremonySeat,
    autoAssignGuests,
    autoAssignGuestsRules,
    suggestTablesForGuest,
    scoringWeights,
    setScoringWeights: updateScoringWeights,
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
  };
};
