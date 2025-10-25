import { doc, onSnapshot, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { useState, useEffect, useCallback, useRef } from 'react';

import { useWedding } from '../context/WeddingContext';
import { db } from '../firebaseConfig';
import { useTranslations } from '../../hooks/useTranslations';

// Categorías de ítems del checklist
const CATEGORIES = {
  const { t } = useTranslations();

  DOCUMENTATION: 'documentation',
  PROVIDERS: 'providers',
  CEREMONY: 'ceremony',
  CONTINGENCY: 'contingency',
  PERSONAL: 'personal',
  TECHNICAL: 'technical',
};

// Estados posibles de los ítems
const ITEM_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  DONE: 'done',
};

// Colores para los estados
const STATUS_COLORS = {
  [ITEM_STATUS.PENDING]: 'gray',
  [ITEM_STATUS.IN_PROGRESS]: 'yellow',
  [ITEM_STATUS.DONE]: 'green',
};

// Ítems por defecto del checklist
const DEFAULT_ITEMS = [
  // Documentación
  {
    id: 'doc-marriage-certificate',
    label: 'Certificado de matrimonio',
    category: CATEGORIES.DOCUMENTATION,
    status: ITEM_STATUS.PENDING,
    dueDate: null,
    notes: '',
    relatedDocType: 'marriage_certificate',
    critical: true,
  },
  {
    id: 'doc-ids',
    label: 'DNI/Pasaportes de los novios',
    category: CATEGORIES.DOCUMENTATION,
    status: ITEM_STATUS.PENDING,
    dueDate: null,
    notes: '',
    relatedDocType: 'identification',
    critical: true,
  },
  {
    id: 'doc-witnesses',
    label: t('common.documentacion_testigos'),
    category: CATEGORIES.DOCUMENTATION,
    status: ITEM_STATUS.PENDING,
    dueDate: null,
    notes: '',
    relatedDocType: 'witness_docs',
    critical: false,
  },
  
  // Proveedores
  {
    id: 'prov-catering',
    label: t('common.confirmacion_catering'),
    category: CATEGORIES.PROVIDERS,
    status: ITEM_STATUS.PENDING,
    dueDate: null,
    notes: '',
    relatedDocType: null,
    critical: true,
  },
  {
    id: 'prov-music',
    label: t('common.confirmacion_musicadj'),
    category: CATEGORIES.PROVIDERS,
    status: ITEM_STATUS.PENDING,
    dueDate: null,
    notes: '',
    relatedDocType: null,
    critical: true,
  },
  {
    id: 'prov-photo',
    label: t('common.confirmacion_fotografovideografo'),
    category: CATEGORIES.PROVIDERS,
    status: ITEM_STATUS.PENDING,
    dueDate: null,
    notes: '',
    relatedDocType: null,
    critical: false,
  },
  {
    id: 'prov-flowers',
    label: t('common.confirmacion_floristeria'),
    category: CATEGORIES.PROVIDERS,
    status: ITEM_STATUS.PENDING,
    dueDate: null,
    notes: '',
    relatedDocType: null,
    critical: false,
  },
  
  // Ceremonia
  {
    id: 'cer-vows',
    label: 'Votos preparados',
    category: CATEGORIES.CEREMONY,
    status: ITEM_STATUS.PENDING,
    dueDate: null,
    notes: '',
    relatedDocType: null,
    critical: false,
  },
  {
    id: 'cer-rings',
    label: 'Anillos listos',
    category: CATEGORIES.CEREMONY,
    status: ITEM_STATUS.PENDING,
    dueDate: null,
    notes: '',
    relatedDocType: null,
    critical: true,
  },
  {
    id: 'cer-music',
    label: t('common.musica_ceremonia_confirmada'),
    category: CATEGORIES.CEREMONY,
    status: ITEM_STATUS.PENDING,
    dueDate: null,
    notes: '',
    relatedDocType: null,
    critical: false,
  },
  {
    id: 'cer-officiant',
    label: 'Oficiante confirmado',
    category: CATEGORIES.CEREMONY,
    status: ITEM_STATUS.PENDING,
    dueDate: null,
    notes: '',
    relatedDocType: null,
    critical: true,
  },
  
  // Contingencia
  {
    id: 'cont-weather',
    label: 'Plan B por clima',
    category: CATEGORIES.CONTINGENCY,
    status: ITEM_STATUS.PENDING,
    dueDate: null,
    notes: '',
    relatedDocType: null,
    critical: false,
  },
  {
    id: 'cont-emergency',
    label: 'Contactos de emergencia',
    category: CATEGORIES.CONTINGENCY,
    status: ITEM_STATUS.PENDING,
    dueDate: null,
    notes: '',
    relatedDocType: null,
    critical: false,
  },
];

const MAX_CUSTOM_ITEMS = 50;

export default function useChecklist() {
  const { activeWedding } = useWedding();
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const unsubRef = useRef(null);
  const unsubDocsRef = useRef(null);

  // Cargar documentos relacionados
  useEffect(() => {
    if (!activeWedding) return;

    const loadDocuments = async () => {
      try {
        const docsRef = collection(db, 'weddings', activeWedding, 'documents');
        const snapshot = await getDocs(docsRef);
        const docs = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.relatedCeremonyId || data.type) {
            docs.push({
              id: doc.id,
              ...data,
            });
          }
        });
        
        setDocuments(docs);
      } catch (error) {
        console.warn('Error al cargar documentos:', error);
      }
    };

    loadDocuments();

    // Suscribirse a cambios en documentos
    const docsRef = collection(db, 'weddings', activeWedding, 'documents');
    const unsub = onSnapshot(docsRef, (snapshot) => {
      const docs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.relatedCeremonyId || data.type) {
          docs.push({
            id: doc.id,
            ...data,
          });
        }
      });
      setDocuments(docs);
    }, (error) => {
      console.warn('Error en listener de documentos:', error);
    });

    unsubDocsRef.current = unsub;

    return () => {
      if (unsubDocsRef.current) {
        unsubDocsRef.current();
        unsubDocsRef.current = null;
      }
    };
  }, [activeWedding]);

  // Cargar y suscribirse a cambios del checklist
  useEffect(() => {
    if (!activeWedding) return;

    setLoading(true);
    const ref = doc(db, 'weddings', activeWedding, 'ceremonyChecklist', 'main');
    
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.items && Array.isArray(data.items)) {
          // Merge con defaults para asegurar que todos los ítems base existan
          const existingIds = new Set(data.items.map(item => item.id));
          const mergedItems = [
            ...data.items,
            ...DEFAULT_ITEMS.filter(defaultItem => !existingIds.has(defaultItem.id))
          ];
          setItems(mergedItems);
        }
      } else {
        // Si no existe, usar defaults
        setItems(DEFAULT_ITEMS);
      }
      setLoading(false);
    }, (error) => {
      console.warn('Error al cargar checklist:', error);
      setLoading(false);
    });

    unsubRef.current = unsub;

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [activeWedding]);

  // Guardar cambios en Firestore
  const saveToFirestore = useCallback(async () => {
    if (!activeWedding || syncInProgress) return;

    setSyncInProgress(true);
    try {
      const ref = doc(db, 'weddings', activeWedding, 'ceremonyChecklist', 'main');
      await setDoc(
        ref,
        {
          items,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error al guardar checklist:', error);
    } finally {
      setSyncInProgress(false);
    }
  }, [activeWedding, items, syncInProgress]);

  // Guardar cambios con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToFirestore();
    }, 1000);

    return () => clearTimeout(timer);
  }, [items]);

  // Actualizar ítem
  const updateItem = useCallback((itemId, updates) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  }, []);

  // Añadir ítem personalizado
  const addCustomItem = useCallback((label, category, dueDate = null) => {
    const customItemsCount = items.filter(item => 
      !DEFAULT_ITEMS.find(defaultItem => defaultItem.id === item.id)
    ).length;

    if (customItemsCount >= MAX_CUSTOM_ITEMS) {
      throw new Error(`Máximo ${MAX_CUSTOM_ITEMS} ítems personalizados permitidos`);
    }

    const newItem = {
      id: `custom-${Date.now()}`,
      label,
      category,
      status: ITEM_STATUS.PENDING,
      dueDate,
      notes: '',
      relatedDocType: null,
      critical: false,
      custom: true,
    };

    setItems((prev) => [...prev, newItem]);
    return newItem;
  }, [items]);

  // Eliminar ítem personalizado
  const removeCustomItem = useCallback((itemId) => {
    // Solo permitir eliminar ítems personalizados
    const item = items.find(i => i.id === itemId);
    if (!item?.custom) {
      throw new Error(t('common.solo_pueden_eliminar_items_personalizados'));
    }

    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, [items]);

  // Cambiar estado de un ítem
  const setItemStatus = useCallback((itemId, status) => {
    if (!Object.values(ITEM_STATUS).includes(status)) return;

    updateItem(itemId, { status });
  }, [updateItem]);

  // Añadir/actualizar notas
  const setItemNotes = useCallback((itemId, notes) => {
    updateItem(itemId, { notes });
  }, [updateItem]);

  // Establecer fecha límite
  const setItemDueDate = useCallback((itemId, dueDate) => {
    updateItem(itemId, { dueDate });
  }, [updateItem]);

  // Marcar/desmarcar como crítico
  const toggleItemCritical = useCallback((itemId) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      updateItem(itemId, { critical: !item.critical });
    }
  }, [items, updateItem]);

  // Obtener documentos relacionados con un ítem
  const getItemDocuments = useCallback((itemId) => {
    const item = items.find(i => i.id === itemId);
    if (!item?.relatedDocType) return [];

    return documents.filter(doc => 
      doc.type === item.relatedDocType || 
      doc.relatedCeremonyId === itemId
    );
  }, [items, documents]);

  // Obtener resumen del checklist
  const getChecklistSummary = useCallback(() => {
    const byStatus = {
      [ITEM_STATUS.PENDING]: 0,
      [ITEM_STATUS.IN_PROGRESS]: 0,
      [ITEM_STATUS.DONE]: 0,
    };

    const byCategory = {};
    Object.values(CATEGORIES).forEach(cat => {
      byCategory[cat] = {
        total: 0,
        done: 0,
      };
    });

    const criticalPending = [];
    const overdueItems = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    items.forEach(item => {
      // Por estado
      byStatus[item.status]++;

      // Por categoría
      if (byCategory[item.category]) {
        byCategory[item.category].total++;
        if (item.status === ITEM_STATUS.DONE) {
          byCategory[item.category].done++;
        }
      }

      // Críticos pendientes
      if (item.critical && item.status !== ITEM_STATUS.DONE) {
        criticalPending.push(item);
      }

      // Vencidos
      if (item.dueDate) {
        const dueDate = new Date(item.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate < today && item.status !== ITEM_STATUS.DONE) {
          overdueItems.push(item);
        }
      }
    });

    const completionPercentage = Math.round(
      (byStatus[ITEM_STATUS.DONE] / items.length) * 100
    );

    return {
      total: items.length,
      byStatus,
      byCategory,
      criticalPending,
      overdueItems,
      completionPercentage,
      customItemsCount: items.filter(i => i.custom).length,
    };
  }, [items]);

  // Validar si el checklist está listo para el evento
  const validateReadiness = useCallback(() => {
    const summary = getChecklistSummary();
    const issues = [];

    // Verificar ítems críticos
    if (summary.criticalPending.length > 0) {
      issues.push({
        type: 'critical',
        message: `${summary.criticalPending.length} ítems críticos pendientes`,
        items: summary.criticalPending,
      });
    }

    // Verificar ítems vencidos
    if (summary.overdueItems.length > 0) {
      issues.push({
        type: 'overdue',
        message: `${summary.overdueItems.length} ítems vencidos`,
        items: summary.overdueItems,
      });
    }

    // Verificar documentación
    const docCategory = summary.byCategory[CATEGORIES.DOCUMENTATION];
    if (docCategory && docCategory.done < docCategory.total) {
      issues.push({
        type: 'documentation',
        message: `Documentación incompleta (${docCategory.done}/${docCategory.total})`,
      });
    }

    // Verificar proveedores
    const provCategory = summary.byCategory[CATEGORIES.PROVIDERS];
    if (provCategory && provCategory.done < provCategory.total) {
      issues.push({
        type: 'providers',
        message: `Proveedores sin confirmar (${provCategory.done}/${provCategory.total})`,
      });
    }

    const isReady = issues.length === 0;

    return {
      isReady,
      issues,
      completionPercentage: summary.completionPercentage,
    };
  }, [getChecklistSummary]);

  return {
    // Datos
    items,
    documents,
    loading,
    syncInProgress,

    // Gestión de ítems
    updateItem,
    addCustomItem,
    removeCustomItem,
    setItemStatus,
    setItemNotes,
    setItemDueDate,
    toggleItemCritical,

    // Utilidades
    getItemDocuments,
    getChecklistSummary,
    validateReadiness,

    // Constantes
    CATEGORIES,
    ITEM_STATUS,
    STATUS_COLORS,
    MAX_CUSTOM_ITEMS,
  };
}
