import { useState, useEffect, useCallback } from 'react';
import { useWedding } from '../context/WeddingContext';
import { tasksAPI } from '../services/apiService';

const CATEGORIES = {
  DOCUMENTATION: 'documentation',
  PROVIDERS: 'providers',
  CEREMONY: 'ceremony',
  CONTINGENCY: 'contingency',
  PERSONAL: 'personal',
  TECHNICAL: 'technical',
};

const ITEM_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  DONE: 'done',
};

const STATUS_COLORS = {
  [ITEM_STATUS.PENDING]: 'gray',
  [ITEM_STATUS.IN_PROGRESS]: 'yellow',
  [ITEM_STATUS.DONE]: 'green',
};

const DEFAULT_ITEMS = [
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
    label: 'Documentación de testigos',
    category: CATEGORIES.DOCUMENTATION,
    status: ITEM_STATUS.PENDING,
    dueDate: null,
    notes: '',
    relatedDocType: 'witness_docs',
    critical: false,
  },
  {
    id: 'prov-catering',
    label: 'Confirmación catering',
    category: CATEGORIES.PROVIDERS,
    status: ITEM_STATUS.PENDING,
    dueDate: null,
    notes: '',
    relatedDocType: null,
    critical: true,
  },
  {
    id: 'prov-music',
    label: 'Confirmación música/DJ',
    category: CATEGORIES.PROVIDERS,
    status: ITEM_STATUS.PENDING,
    dueDate: null,
    notes: '',
    relatedDocType: null,
    critical: true,
  },
  {
    id: 'prov-photo',
    label: 'Confirmación fotógrafo/videógrafo',
    category: CATEGORIES.PROVIDERS,
    status: ITEM_STATUS.PENDING,
    dueDate: null,
    notes: '',
    relatedDocType: null,
    critical: false,
  },
  {
    id: 'prov-flowers',
    label: 'Confirmación floristería',
    category: CATEGORIES.PROVIDERS,
    status: ITEM_STATUS.PENDING,
    dueDate: null,
    notes: '',
    relatedDocType: null,
    critical: false,
  },
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
    label: 'Música de ceremonia confirmada',
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

export default function useChecklistPostgres() {
  const { activeWedding } = useWedding();
  const [items, setItems] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!activeWedding) return;
    
    setLoading(true);
    try {
      const tasks = await tasksAPI.getAll(activeWedding);
      
      const mappedItems = tasks.map(task => ({
        id: task.id,
        label: task.title,
        category: task.category,
        status: task.status,
        dueDate: task.dueDate,
        notes: task.notes || '',
        relatedDocType: task.notes,
        critical: task.priority === 'high',
        custom: !DEFAULT_ITEMS.find(di => di.id === task.id),
      }));
      
      if (mappedItems.length === 0) {
        setItems(DEFAULT_ITEMS);
      } else {
        const existingIds = new Set(mappedItems.map(item => item.id));
        const mergedItems = [
          ...mappedItems,
          ...DEFAULT_ITEMS.filter(defaultItem => !existingIds.has(defaultItem.id))
        ];
        setItems(mergedItems);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setItems(DEFAULT_ITEMS);
    } finally {
      setLoading(false);
    }
  }, [activeWedding]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const updateItem = useCallback(async (itemId, updates) => {
    if (!activeWedding) return;
    
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    );

    try {
      await tasksAPI.update(itemId, {
        title: updates.label,
        status: updates.status,
        dueDate: updates.dueDate,
        notes: updates.notes,
        priority: updates.critical ? 'high' : 'medium',
      });
    } catch (error) {
      console.error('Error updating task:', error);
      await loadTasks();
    }
  }, [activeWedding, loadTasks]);

  const addCustomItem = useCallback(async (label, category, dueDate = null) => {
    if (!activeWedding) return;
    
    const customItemsCount = items.filter(item => item.custom).length;

    if (customItemsCount >= MAX_CUSTOM_ITEMS) {
      throw new Error(`Máximo ${MAX_CUSTOM_ITEMS} ítems personalizados permitidos`);
    }

    const newItem = {
      label,
      category,
      status: ITEM_STATUS.PENDING,
      dueDate,
      notes: '',
      relatedDocType: null,
      critical: false,
      custom: true,
    };

    try {
      const created = await tasksAPI.create(activeWedding, {
        title: label,
        category,
        status: ITEM_STATUS.PENDING,
        dueDate,
        priority: 'medium',
      });
      
      setItems((prev) => [...prev, { ...newItem, id: created.id }]);
      return { ...newItem, id: created.id };
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }, [activeWedding, items]);

  const removeCustomItem = useCallback(async (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (!item?.custom) {
      throw new Error('Solo se pueden eliminar ítems personalizados');
    }

    setItems((prev) => prev.filter((item) => item.id !== itemId));

    try {
      await tasksAPI.delete(itemId);
    } catch (error) {
      console.error('Error deleting task:', error);
      await loadTasks();
    }
  }, [items, loadTasks]);

  const setItemStatus = useCallback((itemId, status) => {
    if (!Object.values(ITEM_STATUS).includes(status)) return;
    updateItem(itemId, { status });
  }, [updateItem]);

  const setItemNotes = useCallback((itemId, notes) => {
    updateItem(itemId, { notes });
  }, [updateItem]);

  const setItemDueDate = useCallback((itemId, dueDate) => {
    updateItem(itemId, { dueDate });
  }, [updateItem]);

  const toggleItemCritical = useCallback((itemId) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      updateItem(itemId, { critical: !item.critical });
    }
  }, [items, updateItem]);

  const getItemDocuments = useCallback((itemId) => {
    const item = items.find(i => i.id === itemId);
    if (!item?.relatedDocType) return [];

    return documents.filter(doc => 
      doc.type === item.relatedDocType || 
      doc.relatedCeremonyId === itemId
    );
  }, [items, documents]);

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
      byStatus[item.status]++;

      if (byCategory[item.category]) {
        byCategory[item.category].total++;
        if (item.status === ITEM_STATUS.DONE) {
          byCategory[item.category].done++;
        }
      }

      if (item.critical && item.status !== ITEM_STATUS.DONE) {
        criticalPending.push(item);
      }

      if (item.dueDate) {
        const dueDate = new Date(item.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate < today && item.status !== ITEM_STATUS.DONE) {
          overdueItems.push(item);
        }
      }
    });

    const completionPercentage = items.length > 0 
      ? Math.round((byStatus[ITEM_STATUS.DONE] / items.length) * 100)
      : 0;

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

  const validateReadiness = useCallback(() => {
    const summary = getChecklistSummary();
    const issues = [];

    if (summary.criticalPending.length > 0) {
      issues.push({
        type: 'critical',
        message: `${summary.criticalPending.length} ítems críticos pendientes`,
        items: summary.criticalPending,
      });
    }

    if (summary.overdueItems.length > 0) {
      issues.push({
        type: 'overdue',
        message: `${summary.overdueItems.length} ítems vencidos`,
        items: summary.overdueItems,
      });
    }

    const docCategory = summary.byCategory[CATEGORIES.DOCUMENTATION];
    if (docCategory && docCategory.done < docCategory.total) {
      issues.push({
        type: 'documentation',
        message: `Documentación incompleta (${docCategory.done}/${docCategory.total})`,
      });
    }

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
    items,
    documents,
    loading,
    syncInProgress,
    updateItem,
    addCustomItem,
    removeCustomItem,
    setItemStatus,
    setItemNotes,
    setItemDueDate,
    toggleItemCritical,
    getItemDocuments,
    getChecklistSummary,
    validateReadiness,
    CATEGORIES,
    ITEM_STATUS,
    STATUS_COLORS,
    MAX_CUSTOM_ITEMS,
  };
}
