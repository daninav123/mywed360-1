import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useWedding } from '../context/WeddingContext';

const SupplierNotesContext = createContext();

export function SupplierNotesProvider({ children }) {
  const { activeWedding } = useWedding();
  const [notes, setNotes] = useState({});

  // Cargar notas del localStorage al iniciar
  useEffect(() => {
    if (!activeWedding) return;

    const storageKey = `supplier_notes_${activeWedding}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setNotes(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading supplier notes:', error);
    }
  }, [activeWedding]);

  // Guardar notas en localStorage
  const saveNotes = useCallback(
    (newNotes) => {
      if (!activeWedding) return;

      const storageKey = `supplier_notes_${activeWedding}`;
      try {
        localStorage.setItem(storageKey, JSON.stringify(newNotes));
      } catch (error) {
        console.error('Error saving supplier notes:', error);
      }
    },
    [activeWedding]
  );

  // Añadir o actualizar nota
  const setNote = useCallback(
    (supplierId, note) => {
      setNotes((prev) => {
        const newNotes = {
          ...prev,
          [supplierId]: {
            text: note,
            updatedAt: new Date().toISOString(),
          },
        };
        saveNotes(newNotes);
        return newNotes;
      });
    },
    [saveNotes]
  );

  // Obtener nota de un proveedor
  const getNote = useCallback(
    (supplierId) => {
      return notes[supplierId]?.text || '';
    },
    [notes]
  );

  // Eliminar nota
  const deleteNote = useCallback(
    (supplierId) => {
      setNotes((prev) => {
        const newNotes = { ...prev };
        delete newNotes[supplierId];
        saveNotes(newNotes);
        return newNotes;
      });
    },
    [saveNotes]
  );

  // Verificar si un proveedor tiene nota
  const hasNote = useCallback(
    (supplierId) => {
      return !!notes[supplierId]?.text;
    },
    [notes]
  );

  const value = {
    setNote,
    getNote,
    deleteNote,
    hasNote,
    notes,
  };

  return <SupplierNotesContext.Provider value={value}>{children}</SupplierNotesContext.Provider>;
}

export function useSupplierNotes() {
  const context = useContext(SupplierNotesContext);
  if (!context) {
    throw new Error('useSupplierNotes must be used within SupplierNotesProvider');
  }
  return context;
}
