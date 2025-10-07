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
          const payload = {
            seats: Array.isArray(seatsCeremony) ? seatsCeremony : [],
            tables: Array.isArray(tablesCeremony) ? tablesCeremony : [],
            areas: Array.isArray(areasCeremony) ? areasCeremony : [],
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
  }, [activeWedding, seatsCeremony, tablesCeremony, areasCeremony]);

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
  });
  const applySnapshot = (snap) => {
    if (!snap || typeof snap !== 'object') return;
    try {
      if (Array.isArray(snap.areasCeremony)) setAreasCeremony(snap.areasCeremony);
      if (Array.isArray(snap.areasBanquet)) setAreasBanquet(snap.areasBanquet);
      if (Array.isArray(snap.tablesCeremony)) setTablesCeremony(snap.tablesCeremony);
      if (Array.isArray(snap.seatsCeremony)) setSeatsCeremony(snap.seatsCeremony);
      if (Array.isArray(snap.tablesBanquet)) setTablesBanquet(snap.tablesBanquet);
      if (snap.tab) setTab(snap.tab);
    } catch (_) {}
  };
  const pushHistory = (snapshot) => {
    const snap = snapshot && typeof snapshot === 'object' ? snapshot : makeSnapshot();
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
    const updatedTable = { ...selectedTable, [field]: parseInt(value, 10) };
    setSelectedTable(updatedTable);
    setTables((prev) => prev.map((t) => (t.id === selectedTable.id ? updatedTable : t)));
  };
  const toggleSelectedTableShape = () => {
    if (!selectedTable) return;
    const newShape = selectedTable.shape === 'rectangle' ? 'circle' : 'rectangle';
    const updatedTable = { ...selectedTable, shape: newShape };
    setSelectedTable(updatedTable);
    setTables((prev) => prev.map((t) => (t.id === selectedTable.id ? updatedTable : t)));
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
    const copy = { ...t, id: maxId + 1, x: (t.x || 0) + 30, y: (t.y || 0) + 30, name: `Mesa ${maxId + 1}` };
    setFn((prev) => [...prev, copy]);
  };
  const toggleTableLocked = (tableId) => {
    const setFn = tab === 'ceremony' ? setTablesCeremony : setTablesBanquet;
    setFn((prev) => prev.map((t) => (String(t.id) === String(tableId) ? { ...t, locked: !t.locked } : t)));
  };

  const addTable = (table = {}) => {
    const base = {
      id: Date.now(),
      x: Number(table.x) || 120,
      y: Number(table.y) || 120,
      shape: table.shape === 'circle' ? 'circle' : 'rectangle',
      width: Number(table.width) || 80,
      height: Number(table.height || table.length) || 60,
      diameter: Number(table.diameter) || 80,
      seats: Number.parseInt(table.seats, 10) || 8,
      enabled: true,
      name: table.name || '',
    };
    if (tab === 'ceremony') {
      setTablesCeremony((prev) => [...prev, base]);
    } else {
      const toAdd = base.shape === 'circle'
        ? { id: base.id, x: base.x, y: base.y, shape: 'circle', diameter: base.diameter, seats: base.seats, enabled: true, name: base.name || `Mesa ${base.id}` }
        : { id: base.id, x: base.x, y: base.y, shape: 'rectangle', width: base.width, height: base.height, seats: base.seats, enabled: true, name: base.name || `Mesa ${base.id}` };
      setTablesBanquet((prev) => [...prev, toAdd]);
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
  const generateSeatGrid = (rows = 10, cols = 12, gap = 40, startX = 100, startY = 80, aisleAfter = 6) => {
    const newSeats = [];
    let seatId = 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * gap + (col > aisleAfter ? gap : 0);
        const y = startY + row * gap;
        newSeats.push({ id: seatId++, x, y, enabled: true, guestId: null, guestName: null });
      }
    }
    setSeatsCeremony(newSeats);
    pushHistory({ type: 'ceremony', seats: newSeats, tables: tablesCeremony, areas: areasCeremony });
  };
  const generateBanquetLayout = ({ rows = 3, cols = 4, seats = 8, gapX = 140, gapY = 160, startX = 120, startY = 160 } = {}) => {
    const newTables = [];
    let tableId = 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * gapX;
        const y = startY + row * gapY;
        newTables.push({ id: tableId++, x, y, width: 80, height: 60, shape: 'rectangle', seats, enabled: true, name: `Mesa ${tableId - 1}` });
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
        const shape = t.shape === 'circle' ? 'circle' : 'rectangle';
        const base = { id, x: Number(t.x) || 0, y: Number(t.y) || 0, seats: Number.parseInt(t.seats, 10) || 8, enabled: t.enabled !== false, name: t.name || `Mesa ${id}`, shape };
        if (shape === 'circle') return { ...base, diameter: Number(t.diameter) || 80 };
        return { ...base, width: Number(t.width) || 80, height: Number(t.height || t.length) || 60 };
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

  // Conflictos: perÃ­metro, obstÃ¡culos/puertas, pasillos (espaciado) y overbooking
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
        } catch (e) { return null; }
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
          rects.push({ minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) });
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
        return { minX: (t.x || 0) - hw, minY: (t.y || 0) - hh, maxX: (t.x || 0) + hw, maxY: (t.y || 0) + hh };
      };
      const expandBox = (b, m) => ({ minX: b.minX - m, minY: b.minY - m, maxX: b.maxX + m, maxY: b.maxY + m });
      const rectsOverlap = (a, b) => !(a.maxX <= b.minX || a.minX >= b.maxX || a.maxY <= b.minY || a.minY >= b.maxY);
      const pointInPoly = (px, py, pts) => {
        if (!Array.isArray(pts) || pts.length < 3) return true;
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const xi = pts[i].x, yi = pts[i].y; const xj = pts[j].x, yj = pts[j].y;
          const intersect = (yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi || 1e-9) + xi;
          if (intersect) inside = !inside;
        }
        return inside;
      };
      const boxInsidePoly = (b, pts) => {
        if (!pts) return true;
        const corners = [
          { x: b.minX, y: b.minY }, { x: b.maxX, y: b.minY },
          { x: b.maxX, y: b.maxY }, { x: b.minX, y: b.maxY },
        ];
        return corners.every((c) => pointInPoly(c.x, c.y, pts));
      };

      // Overbooking map
      const idSet = new Set((tablesBanquet || []).map((t) => String(t?.id)));
      const nameSet = new Set((tablesBanquet || []).map((t) => String(t?.name || '').trim()).filter(Boolean));
      const occ = new Map();
      (guests || []).forEach((g) => {
        const tid = g?.tableId != null ? String(g.tableId) : null;
        const tname = g?.table != null ? String(g.table).trim() : '';
        let key = null;
        if (tid && idSet.has(tid)) key = tid; else if (tname && (idSet.has(tname) || nameSet.has(tname))) key = tname;
        if (!key) return; const count = 1 + (parseInt(g?.companion, 10) || 0);
        occ.set(key, (occ.get(key) || 0) + count);
      });

      (tablesBanquet || []).forEach((t) => {
        const box = getTableBox(t);
        const padded = expandBox(box, aisle / 2);
        const tid = String(t.id);
        // 1) PerÃ­metro
        if (boundary && !boxInsidePoly(box, boundary)) {
          out.push({ type: 'perimeter', tableId: t.id, message: 'Fuera del perÃ­metro' });
          return; // prioriza perÃ­metro
        }
        // 2) ObstÃ¡culos/puertas
        if (obstacles.some((o) => rectsOverlap(padded, o))) {
          out.push({ type: 'obstacle', tableId: t.id, message: 'ColisiÃ³n con obstÃ¡culo/puerta' });
          return;
        }
        // 3) Espaciado mÃ­nimo entre mesas
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
            rects.push({ minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) });
          });
          return rects;
        })();
        (seatsCeremony || []).forEach((s) => {
          const px = s.x || 0;
          const py = s.y || 0;
          if (cerBoundary && !pointInPoly(px, py, cerBoundary)) {
            out.push({ type: 'perimeter', tableId: `S${s.id}`, message: 'Silla fuera del perÃ­metro' });
            return;
          }
          if (cerObstacles.some((o) => px >= o.minX && px <= o.maxX && py >= o.minY && py <= o.maxY)) {
            out.push({ type: 'obstacle', tableId: `S${s.id}`, message: 'Silla sobre obstÃ¡culo/puerta' });
          }
        });
      } catch (e) {}
    } catch (e) {
      return [];
    }
  }, [tablesBanquet, areasBanquet, seatsCeremony, areasCeremony, guests, validationsEnabled, hallSize, globalMaxSeats]);

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
  const exportCSV = async () => {
    try {
      const rows = [['guestId', 'name', 'tableId', 'companions'].join(','), ...guests.map((g) => [g.id, JSON.stringify(g.name || ''), g.tableId ?? '', parseInt(g.companion, 10) || 0].join(','))];
      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seating-${tab}-${Date.now()}.csv`;
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

    // ConfiguraciÃ³n
    saveHallDimensions,
    saveGlobalMaxGuests,
    saveBackground,
    setBackground,

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
