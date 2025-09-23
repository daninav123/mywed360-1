/**
 * Hook personalizado para gestionar el estado del plan de asientos
 * Centraliza toda la l├│gica de estado y operaciones del SeatingPlan
 */

import {
  doc as fsDoc,
  setDoc,
  getDoc,
  getDocs,
  collection as fsCollection,
  onSnapshot,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useState, useRef, useEffect, useMemo } from 'react';

import { useWedding } from '../context/WeddingContext';
import { db } from '../firebaseConfig';
import { saveData, loadData, subscribeSyncState, getSyncState } from '../services/SyncService';

// Utilidad para normalizar IDs de mesas
export const normalizeId = (id) => {
  const num = parseInt(id, 10);
  return !isNaN(num) ? num : id;
};

export const useSeatingPlan = () => {
  const { activeWedding } = useWedding();

  // Estados principales
  const [tab, setTab] = useState('ceremony');
  const [syncStatus, setSyncStatus] = useState(getSyncState());
  const [hallSize, setHallSize] = useState({ width: 1800, height: 1200 });

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

  // Estados computados basados en la pesta├▒a activa
  const areas = tab === 'ceremony' ? areasCeremony : areasBanquet;
  const setAreas = tab === 'ceremony' ? setAreasCeremony : setAreasBanquet;
  const tables = tab === 'ceremony' ? tablesCeremony : tablesBanquet;
  const seats = tab === 'ceremony' ? seatsCeremony : [];
  const setTables = tab === 'ceremony' ? setTablesCeremony : setTablesBanquet;

  // Cargar dimensiones del sal├│n
  useEffect(() => {
    if (!activeWedding) return;

    const loadHallDimensions = async () => {
      try {
        // Primero doc único seatingPlan/banquet
        const mainRef = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet');
        const mainSnap = await getDoc(mainRef);
        if (mainSnap.exists()) {
          const data = mainSnap.data() || {};
          const cfg = data.config || {};
          if (cfg.width && cfg.height) {
            const next = { width: cfg.width, height: cfg.height };
            if (Number.isFinite(cfg.aisleMin)) next.aisleMin = cfg.aisleMin;
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
          const { width, height, aisleMin } = snap.data();
          if (width && height) {
            const next = { width, height };
            if (Number.isFinite(aisleMin)) next.aisleMin = aisleMin;
            setHallSize(next);
          }
        }
      } catch (err) {
        console.warn('No se pudieron cargar dimensiones del sal├│n:', err);
      }
    };

    loadHallDimensions();
  }, [activeWedding]);

  // Suscribirse a cambios en el estado de sincronizaci├│n
  useEffect(() => {
    const unsubscribe = subscribeSyncState(setSyncStatus);
    return () => unsubscribe();
  }, []);

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
          if (isEmpty) return; // Evitar crear doc vacío
          await setDoc(ref, payload, { merge: true });
        } catch (e) {
          console.warn('[useSeatingPlan] Autosave ceremony error:', e);
        }
      }, 800);
      return () => {
        try {
          clearTimeout(ceremonySaveTimerRef.current);
        } catch (_) {}
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
          if (
            hallSize &&
            typeof hallSize.width === 'number' &&
            typeof hallSize.height === 'number'
          ) {
            cfg.width = hallSize.width;
            cfg.height = hallSize.height;
            if (Number.isFinite(hallSize.aisleMin)) cfg.aisleMin = hallSize.aisleMin;
          }
          const payload = {
            ...(Object.keys(cfg).length ? { config: cfg } : {}),
            tables: Array.isArray(tablesBanquet) ? tablesBanquet : [],
            areas: Array.isArray(areasBanquet) ? areasBanquet : [],
            updatedAt: serverTimestamp(),
          };
          const hasTables = Array.isArray(payload.tables) && payload.tables.length > 0;
          const hasAreas = Array.isArray(payload.areas) && payload.areas.length > 0;
          const hasConfig = !!(
            cfg.width &&
            cfg.height &&
            !(cfg.width === 1800 && cfg.height === 1200 && !Number.isFinite(cfg.aisleMin))
          );
          const isEmpty = !hasTables && !hasAreas && !hasConfig;
          if (isEmpty) return; // Evitar crear doc vacío
          await setDoc(ref, payload, { merge: true });
        } catch (e) {
          console.warn('[useSeatingPlan] Autosave banquet error:', e);
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
  ]);

  // Funciones de gesti├│n del historial
  const pushHistory = (snapshot) => {
    const newHistory = history.slice(0, historyPointer + 1);
    newHistory.push(snapshot);
    setHistory(newHistory);
    setHistoryPointer(newHistory.length - 1);
  };

  const undo = () => {
    if (historyPointer > 0) {
      const prevSnapshot = history[historyPointer - 1];
      // Aplicar snapshot anterior
      setHistoryPointer(historyPointer - 1);
      return prevSnapshot;
    }
    return null;
  };

  const redo = () => {
    if (historyPointer < history.length - 1) {
      const nextSnapshot = history[historyPointer + 1];
      // Aplicar siguiente snapshot
      setHistoryPointer(historyPointer + 1);
      return nextSnapshot;
    }
    return null;
  };

  // Funciones de gesti├│n de mesas
  const handleSelectTable = (id) => {
    const table = tables.find((t) => t.id === id);
    setSelectedTable(table || null);
  };

  const handleTableDimensionChange = (field, value) => {
    if (!selectedTable) return;

    const updatedTable = { ...selectedTable, [field]: parseInt(value) };
    setSelectedTable(updatedTable);

    // Actualizar en la lista de mesas
    setTables((prev) => prev.map((t) => (t.id === selectedTable.id ? updatedTable : t)));
  };

  const toggleSelectedTableShape = () => {
    if (!selectedTable) return;

    const newShape = selectedTable.shape === 'rectangle' ? 'circle' : 'rectangle';
    const updatedTable = { ...selectedTable, shape: newShape };
    setSelectedTable(updatedTable);

    setTables((prev) => prev.map((t) => (t.id === selectedTable.id ? updatedTable : t)));
  };

  // Funciones de generaci├│n de layouts
  const generateSeatGrid = (
    rows = 10,
    cols = 12,
    gap = 40,
    startX = 100,
    startY = 80,
    aisleAfter = 6
  ) => {
    const newSeats = [];
    let seatId = 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * gap + (col > aisleAfter ? gap : 0);
        const y = startY + row * gap;

        newSeats.push({
          id: seatId++,
          x,
          y,
          enabled: true,
          guestId: null,
          guestName: null,
        });
      }
    }

    setSeatsCeremony(newSeats);

    // Guardar en historial
    pushHistory({
      type: 'ceremony',
      seats: newSeats,
      tables: tablesCeremony,
      areas: areasCeremony,
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
  } = {}) => {
    const newTables = [];
    let tableId = 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * gapX;
        const y = startY + row * gapY;

        newTables.push({
          id: tableId++,
          x,
          y,
          width: 80,
          height: 60,
          shape: 'rectangle',
          seats,
          enabled: true,
          guestId: null,
          guestName: null,
          name: `Mesa ${tableId - 1}`,
        });
      }
    }

    setTablesBanquet(newTables);

    // Guardar en historial
    pushHistory({
      type: 'banquet',
      tables: newTables,
      areas: areasBanquet,
    });
  };

  // Funciones de exportaci├│n
  const exportPNG = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = await html2canvas(canvasRef.current);
      const link = document.createElement('a');
      link.download = `seating-plan-${tab}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error exportando PNG:', error);
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
      console.error('Error exportando PDF:', error);
    }
  };

  // Funciones de guardado
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
      } catch (err) {
        console.error('Error guardando dimensiones del sal├│n:', err);
      }
    }
  };

  return {
    // Estados
    tab,
    setTab,
    syncStatus,
    hallSize,
    areas,
    tables,
    seats,
    selectedTable,
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

    // Funciones de gesti├│n
    handleSelectTable,
    handleTableDimensionChange,
    toggleSelectedTableShape,

    // Funciones de historial
    pushHistory,
    undo,
    redo,
    canUndo: historyPointer > 0,
    canRedo: historyPointer < history.length - 1,

    // Funciones de generaci├│n
    generateSeatGrid,
    generateBanquetLayout,

    // Funciones de exportaci├│n
    exportPNG,
    exportPDF,

    // Funciones de configuraci├│n
    saveHallDimensions,

    // Utilidades
    normalizeId,
  };
};
