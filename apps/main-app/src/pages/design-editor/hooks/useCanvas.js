import { useState, useCallback, useRef } from 'react';
import { useWedding } from '../../../context/WeddingContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004/api';

export function useCanvas() {
  const { activeWedding } = useWedding();
  const [canvasState, setCanvasState] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  const canvasRefForHistory = useRef(null);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const saveToHistory = useCallback((canvasRef) => {
    const canvas = canvasRef?.current?.getCanvas();
    if (!canvas) return;

    const json = canvas.toJSON();
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(json);
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex((prev) => (prev < 49 ? prev + 1 : 49));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (canUndo && canvasRefForHistory.current) {
      const canvas = canvasRefForHistory.current.getCanvas();
      if (canvas && history[historyIndex - 1]) {
        canvas.loadFromJSON(history[historyIndex - 1], () => {
          canvas.renderAll();
          setHistoryIndex((prev) => prev - 1);
        });
      }
    }
  }, [canUndo, history, historyIndex]);

  const redo = useCallback(() => {
    if (canRedo && canvasRefForHistory.current) {
      const canvas = canvasRefForHistory.current.getCanvas();
      if (canvas && history[historyIndex + 1]) {
        canvas.loadFromJSON(history[historyIndex + 1], () => {
          canvas.renderAll();
          setHistoryIndex((prev) => prev + 1);
        });
      }
    }
  }, [canRedo, history, historyIndex]);

  const saveDesign = useCallback(async (canvasJSON) => {
    if (!activeWedding) {
      console.warn('No active wedding, skipping save');
      return null;
    }

    setIsSaving(true);
    try {
      await firebaseReady;
      const { doc, setDoc, serverTimestamp } = await fsImport();

      const designId = `design-${Date.now()}`;
      const designRef = doc(db, 'weddings', activeWedding, 'designs', designId);

      await setDoc(designRef, {
        canvas: canvasJSON || canvasState,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      return designId;
    } catch (error) {
      console.error('Error saving design:', error);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [activeWedding, canvasState]);

  const exportDesign = useCallback(async (format = 'pdf', canvasRef) => {
    const { exportToPDF, exportToSVG, exportToPNG } = await import('../utils/exportEngine');
    
    const canvas = canvasRef?.current?.getCanvas();
    if (!canvas) {
      throw new Error('No canvas available for export');
    }

    switch (format) {
      case 'pdf':
        return await exportToPDF(canvas, { filename: `design-${Date.now()}.pdf` });
      case 'svg':
        return exportToSVG(canvas, `design-${Date.now()}.svg`);
      case 'png':
        return exportToPNG(canvas, `design-${Date.now()}.png`);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }, []);

  const setCanvasRef = useCallback((ref) => {
    canvasRefForHistory.current = ref;
  }, []);

  return {
    canvasState,
    setCanvasState,
    history,
    historyIndex,
    canUndo,
    canRedo,
    undo,
    redo,
    saveToHistory,
    setCanvasRef,
    saveDesign,
    exportDesign,
    isSaving,
  };
}
