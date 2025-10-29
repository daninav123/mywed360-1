import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useWedding } from '../context/WeddingContext';

const SupplierContactsContext = createContext();

export function SupplierContactsProvider({ children }) {
  const { activeWedding } = useWedding();
  const [contacts, setContacts] = useState({});

  // Cargar contactos del localStorage
  useEffect(() => {
    if (!activeWedding) return;

    const storageKey = `supplier_contacts_${activeWedding}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setContacts(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading supplier contacts:', error);
    }
  }, [activeWedding]);

  // Guardar contactos en localStorage
  const saveContacts = useCallback(
    (newContacts) => {
      if (!activeWedding) return;

      const storageKey = `supplier_contacts_${activeWedding}`;
      try {
        localStorage.setItem(storageKey, JSON.stringify(newContacts));
      } catch (error) {
        console.error('Error saving supplier contacts:', error);
      }
    },
    [activeWedding]
  );

  // Registrar contacto
  const logContact = useCallback(
    (supplierId, method, supplierName) => {
      setContacts((prev) => {
        const supplierContacts = prev[supplierId] || [];
        const newContact = {
          id: Date.now(),
          method,
          timestamp: new Date().toISOString(),
          supplierName,
        };

        const newContacts = {
          ...prev,
          [supplierId]: [newContact, ...supplierContacts].slice(0, 50), // Guardar últimos 50
        };

        saveContacts(newContacts);
        return newContacts;
      });
    },
    [saveContacts]
  );

  // Obtener historial de contactos
  const getContactHistory = useCallback(
    (supplierId) => {
      return contacts[supplierId] || [];
    },
    [contacts]
  );

  // Obtener último contacto
  const getLastContact = useCallback(
    (supplierId) => {
      const history = contacts[supplierId];
      return history && history.length > 0 ? history[0] : null;
    },
    [contacts]
  );

  // Verificar si necesita seguimiento (más de 7 días)
  const needsFollowUp = useCallback(
    (supplierId) => {
      const lastContact = getLastContact(supplierId);
      if (!lastContact) return false;

      const lastDate = new Date(lastContact.timestamp);
      const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSince >= 7;
    },
    [getLastContact]
  );

  const value = {
    logContact,
    getContactHistory,
    getLastContact,
    needsFollowUp,
    contacts,
  };

  return (
    <SupplierContactsContext.Provider value={value}>{children}</SupplierContactsContext.Provider>
  );
}

export function useSupplierContacts() {
  const context = useContext(SupplierContactsContext);
  if (!context) {
    throw new Error('useSupplierContacts must be used within SupplierContactsProvider');
  }
  return context;
}
