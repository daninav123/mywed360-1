import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { useState, useEffect, useCallback, useRef } from 'react';

import { db } from '../firebaseConfig';
import { useAuth } from './useAuth';
import { useWedding } from '../context/WeddingContext';
import { loadData, saveData } from '../services/SyncService';
import { recordSupplierInsight } from '../services/supplierInsightsService';
import computeSupplierScore from '../utils/supplierScore';
import {
  normalizeStatus,
  isConfirmedStatus,
  isDiscardedStatus,
  isTrackingStatus,
} from '../utils/supplierStatus';

const SERVICE_LINES_COLLECTION = "serviceLines";
const MEETINGS_COLLECTION = "supplierMeetings";

const TAB_ALL = 'todos';
const TAB_TRACKING = 'seguimiento';
const TAB_CONFIRMED = 'confirmados';
const TAB_FAVORITES = 'favoritos';


/**
 * @typedef {Object} Provider
 * @property {string} id - ID único del proveedor
 * @property {string} name - Nombre del proveedor
 * @property {string} service - Tipo de servicio ofrecido
 * @property {string} contact - Nombre de la persona de contacto
 * @property {string} email - Email de contacto
 * @property {string} phone - Teléfono de contacto
 * @property {string} status - Estado actual (Nuevo, Contactado, Seleccionado, Confirmado, etc.)
 * @property {string} date - Fecha de contacto o cita
 * @property {number} rating - Puntuación media (0-5)
 * @property {number} ratingCount - Número de valoraciones
 * @property {string} [snippet] - Descripción corta
 * @property {string} [link] - Enlace a la web del proveedor
 * @property {string} [image] - URL de la imagen del proveedor
 */

/**
 * Hook personalizado para gestionar la lógica de los proveedores.
 * Proporciona funcionalidades para listar, filtrar, añadir, editar y eliminar proveedores,
 * así como para gestionar el estado de selección y filtrado.
 *
 * @returns {Object} Objeto con estados y funciones para gestionar proveedores
 * @property {Provider[]} providers - Lista completa de proveedores
 * @property {Provider[]} filteredProviders - Lista de proveedores filtrada según criterios
 * @property {boolean} loading - Indica si hay una operación en curso
 * @property {string|null} error - Mensaje de error si existe
 * @property {Provider|null} selectedProvider - Proveedor actualmente seleccionado
 * @property {string[]} selectedProviderIds - IDs de proveedores seleccionados
 * @property {string} searchTerm - Término de búsqueda actual
 * @property {string} serviceFilter - Filtro por servicio
 * @property {string} statusFilter - Filtro por estado
 * @property {string} dateFrom - Filtro por fecha desde
 * @property {string} dateTo - Filtro por fecha hasta
 * @property {string} tab - Segmento actual ('todos', 'seguimiento', 'confirmados', 'favoritos')
 * @property {Function} setSearchTerm - Actualizar término de búsqueda
 * @property {Function} setServiceFilter - Actualizar filtro por servicio
 * @property {Function} setStatusFilter - Actualizar filtro por estado
 * @property {Function} setDateFrom - Actualizar filtro por fecha desde
 * @property {Function} setDateTo - Actualizar filtro por fecha hasta
 * @property {Function} setTab - Cambiar pestaña actual
 * @property {Function} setSelectedProvider - Establecer proveedor seleccionado
 * @property {Function} loadProviders - Cargar proveedores desde la base de datos
 * @property {Function} addProvider - Añadir un nuevo proveedor
 * @property {Function} updateProvider - Actualizar un proveedor existente
 * @property {Function} deleteProvider - Eliminar un proveedor
 * @property {Function} toggleSelectProvider - Seleccionar/deseleccionar un proveedor
 * @property {Function} clearSelection - Limpiar selecciones
 * @property {Function} clearFilters - Limpiar todos los filtros
 */
export const useProveedores = () => {
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedProviderIds, setSelectedProviderIds] = useState([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  // Filtro de rating mínimo (0 = cualquiera)
  const [ratingMin, setRatingMin] = useState(0);
  const [tab, setTab] = useState(TAB_ALL);

  const { user } = useAuth();
  const userUid = user?.uid || null;
  const { activeWedding } = useWedding();
  const persistTimer = useRef(null);
  const providersRef = useRef(providers);

  useEffect(() => {
    providersRef.current = providers;
  }, [providers]);

  const getCollectionPath = useCallback(() => {
    if (activeWedding) return `weddings/${activeWedding}/suppliers`;
    if (userUid) return `users/${userUid}/suppliers`;
    return null;
  }, [activeWedding, userUid]);

  /**
   * Aplicar filtros a los proveedores
   */
  const applyFilters = useCallback(
    (providersToFilter) => {
      const source = Array.isArray(providersToFilter) ? providersToFilter : providersRef.current;
      let filtered = Array.isArray(source) ? [...source] : [];

      // Aplicar filtro de búsqueda
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name?.toLowerCase().includes(searchTermLower) ||
            p.service?.toLowerCase().includes(searchTermLower) ||
            p.contact?.toLowerCase().includes(searchTermLower) ||
            p.status?.toLowerCase().includes(searchTermLower) ||
            p.snippet?.toLowerCase().includes(searchTermLower)
        );
      }

      // Aplicar filtro de servicio
      if (serviceFilter) {
        filtered = filtered.filter((p) => p.service === serviceFilter);
      }

      // Aplicar filtro de estado
      if (statusFilter) {
        filtered = filtered.filter((p) => p.status === statusFilter);
      }

      // Aplicar filtro de fecha desde
      if (dateFrom) {
        filtered = filtered.filter((p) => p.date >= dateFrom);
      }

      // Aplicar filtro de fecha hasta
      if (dateTo) {
        filtered = filtered.filter((p) => p.date <= dateTo);
      }

      // Aplicar filtro de rating mínimo
      if (ratingMin > 0) {
        filtered = filtered.filter((p) => p.rating >= ratingMin);
      }

      // Filtrar por pestaña/segmento
      if (tab === TAB_TRACKING) {
        filtered = filtered.filter((p) => isTrackingStatus(p.status));
      } else if (tab === TAB_CONFIRMED) {
        filtered = filtered.filter((p) => isConfirmedStatus(p.status));
      } else if (tab === TAB_FAVORITES) {
        filtered = filtered.filter((p) => Boolean(p.favorite));
      }

      setFilteredProviders(filtered);
    },
    [searchTerm, serviceFilter, statusFilter, dateFrom, dateTo, ratingMin, tab]
  );

  const applyFiltersRef = useRef(applyFilters);
  useEffect(() => {
    applyFiltersRef.current = applyFilters;
  }, [applyFilters]);

  /**
   * Cargar proveedores desde Firestore
   */
  const loadProviders = useCallback(async () => {
    if (!userUid) return;

    setLoading(true);

    try {
      const primaryPath = getCollectionPath();
      if (!primaryPath) {
        setLoading(false);
        return;
      }
      const tryLoad = async (path) => {
        const proveedoresRef = collection(db, path);
        return await getDocs(proveedoresRef);
      };

      let snapshot;
      try {
        snapshot = await tryLoad(primaryPath);
      } catch (e) {
        // Intentar rutas alternativas si hay error de permisos u otros
        const fallbacks = [];
        if (activeWedding) fallbacks.push(`weddings_public/${activeWedding}/suppliers`);
        if (userUid) {
          fallbacks.push(`users/${userUid}/suppliers`);
          fallbacks.push(`usuarios/${userUid}/proveedores`); // legacy
        }
        for (const p of fallbacks) {
          try {
            const snap = await tryLoad(p);
            snapshot = snap;
            if (snap && !snap.empty) break;
          } catch {}
        }
      }
      if (!snapshot) {
        snapshot = { docs: [], empty: true };
      }
      const toIso = (d) => {
        try {
          if (!d) return '';
          if (typeof d?.toDate === 'function')
            return new Date(d.toDate()).toISOString().split('T')[0];
          return new Date(d).toISOString().split('T')[0];
        } catch {
          return '';
        }
      };
      const baseProviders = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data(), date: toIso(d.data().date) }))
        .sort((a, b) => {
          const ac = a.created?.seconds || a.createdAt?.seconds || 0;
          const bc = b.created?.seconds || b.createdAt?.seconds || 0;
          return bc - ac;
        });

      const providersWithLines = await Promise.all(
        baseProviders.map(async (prov) => {
          const lines = [];
          try {
            const linesRef = collection(db, primaryPath, prov.id, SERVICE_LINES_COLLECTION);
            const linesSnap = await getDocs(linesRef);
            linesSnap.forEach((docSnap) => {
              lines.push({ id: docSnap.id, ...docSnap.data() });
            });
            lines.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
          } catch (err) {
            console.warn('[useProveedores] no se pudieron cargar líneas de servicio', err);
          }
          return { ...prov, serviceLines: lines };
        })
      );

      const serviceLineMap = new Map(
        providersWithLines.map((prov) => [prov.id, prov.serviceLines || []])
      );
      const now = Date.now();
      const enrichedProviders = providersWithLines.map((prov) => {
        const lines = serviceLineMap.get(prov.id) || [];
        const coveredLines = lines.filter((line) => {
          const status = String(line?.status || '').toLowerCase();
          if (status.includes('confirm') || status.includes('contrat') || status.includes('assign')) {
            return true;
          }
          if (line?.assignedProviderId || line?.providerId) return true;
          return false;
        }).length;
        const coverageRatio = lines.length ? coveredLines / lines.length : 0;
        const lastInteraction =
          prov.lastInteractionAt ||
          prov.lastContactAt ||
          prov.lastEmailAt ||
          prov.lastFollowupAt ||
          prov.updatedAt ||
          prov.updated ||
          prov.date;
        let recentInteractionDays = null;
        if (lastInteraction) {
          try {
            const value =
              typeof lastInteraction?.toDate === 'function'
                ? lastInteraction.toDate()
                : new Date(lastInteraction);
            const diffMs = now - value.getTime();
            if (Number.isFinite(diffMs)) {
              recentInteractionDays = diffMs / (1000 * 60 * 60 * 24);
            }
          } catch {}
        }
        const intelligentScore = computeSupplierScore(prov, null, {
          serviceCoverageRatio: coverageRatio,
          recentInteractionDays,
        });
        return {
          ...prov,
          intelligentScore,
        };
      });

      setProviders(enrichedProviders);
      applyFiltersRef.current(enrichedProviders);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar los proveedores:', err);
      try {
        setProviders([]);
        applyFiltersRef.current([]);
      } catch {}
      if (String(err?.message || '').toLowerCase().includes('permission')) {
        setError('No tienes permisos para ver los proveedores de esta boda.');
      } else {
        setError('No se pudieron cargar los proveedores.');
      }
      setLoading(false);
    }
  }, [userUid, getCollectionPath, activeWedding]);

  /**
   * Limpiar todos los filtros
   */
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setServiceFilter('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setRatingMin(0);
    setTab(TAB_ALL);
  }, []);
  const getServiceLinesCollection = useCallback(
    (providerId) => {
      const path = getCollectionPath();
      if (!path || !providerId) return null;
      return collection(db, path, providerId, SERVICE_LINES_COLLECTION);
    },
    [getCollectionPath]
  );

  const getMeetingsCollection = useCallback(
    (providerId) => {
      const path = getCollectionPath();
      if (!path || !providerId) return null;
      return collection(db, path, providerId, MEETINGS_COLLECTION);
    },
    [getCollectionPath]
  );

  const syncServiceLinesLocally = useCallback(
    (providerId, updater) => {
      setProviders((prev) => {
        const updated = prev.map((prov) =>
          prov.id === providerId
            ? {
                ...prov,
                serviceLines: updater(Array.isArray(prov.serviceLines) ? prov.serviceLines : []),
              }
            : prov
        );
        try {
          applyFiltersRef.current(updated);
        } catch {}
        return updated;
      });
    },
    [applyFiltersRef]
  );

  const addServiceLine = useCallback(
    async (providerId, lineData) => {
      const ref = getServiceLinesCollection(providerId);
      if (!ref) return null;
      try {
        const payload = {
          name: lineData?.name || lineData?.service || 'Servicio',
          status: lineData?.status || 'Pendiente',
          budget: typeof lineData?.budget === 'number' ? lineData.budget : null,
          notes: lineData?.notes || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        const docRef = await addDoc(ref, payload);
        const nextLine = { id: docRef.id, ...payload };
        syncServiceLinesLocally(providerId, (prev) => [...prev, nextLine]);
        return docRef.id;
      } catch (err) {
        console.warn('[useProveedores] addServiceLine failed', err);
        throw err;
      }
    },
    [getServiceLinesCollection, syncServiceLinesLocally]
  );

  const updateServiceLine = useCallback(
    async (providerId, lineId, changes) => {
      const ref = getServiceLinesCollection(providerId);
      if (!ref || !lineId) return false;
      try {
        const docRef = doc(ref, lineId);
        await updateDoc(docRef, { ...changes, updatedAt: serverTimestamp() });
        syncServiceLinesLocally(providerId, (prev) =>
          prev.map((line) => (line.id === lineId ? { ...line, ...changes } : line))
        );
        return true;
      } catch (err) {
        console.warn('[useProveedores] updateServiceLine failed', err);
        return false;
      }
    },
    [getServiceLinesCollection, syncServiceLinesLocally]
  );

  const deleteServiceLine = useCallback(
    async (providerId, lineId) => {
      const ref = getServiceLinesCollection(providerId);
      if (!ref || !lineId) return false;
      try {
        const docRef = doc(ref, lineId);
        await deleteDoc(docRef);
        syncServiceLinesLocally(providerId, (prev) => prev.filter((line) => line.id !== lineId));
        return true;
      } catch (err) {
        console.warn('[useProveedores] deleteServiceLine failed', err);
        return false;
      }
    },
    [getServiceLinesCollection, syncServiceLinesLocally]
  );

  const mergeServiceLines = useCallback(
    async (providerId, primaryLineId, mergeIds, options = {}) => {
      const ref = getServiceLinesCollection(providerId);
      if (!ref || !primaryLineId || !Array.isArray(mergeIds) || mergeIds.length === 0) return false;
      try {
        const primaryRef = doc(ref, primaryLineId);
        const payload = { updatedAt: serverTimestamp() };
        if (options.name) payload.name = options.name;
        if (options.status) payload.status = options.status;
        if (typeof options.budget === 'number') payload.budget = options.budget;
        if (options.notes) payload.notes = options.notes;
        await updateDoc(primaryRef, payload);

        for (const mergeId of mergeIds.filter((id) => id !== primaryLineId)) {
          try {
            const mergeRef = doc(ref, mergeId);
            await deleteDoc(mergeRef);
          } catch (err) {
            console.warn('[useProveedores] merge remove line failed', err);
          }
        }

        syncServiceLinesLocally(providerId, (prev) => {
          const kept = prev.filter((line) => !mergeIds.includes(line.id) || line.id === primaryLineId);
          return kept.map((line) => (line.id === primaryLineId ? { ...line, ...options } : line));
        });
        return true;
      } catch (err) {
        console.warn('[useProveedores] mergeServiceLines failed', err);
        return false;
      }
    },
    [getServiceLinesCollection, syncServiceLinesLocally]
  );

  const getMeetingsCollectionSafe = useCallback(
    (providerId) => getMeetingsCollection(providerId),
    [getMeetingsCollection]
  );

  const addMeetingEntry = useCallback(
    async (providerId, meeting) => {
      const ref = getMeetingsCollectionSafe(providerId);
      if (!ref) return null;
      try {
        const payload = {
          ...meeting,
          createdAt: serverTimestamp(),
        };
        await addDoc(ref, payload);
      } catch (err) {
        console.warn('[useProveedores] addMeetingEntry failed', err);
      }
    },
    [getMeetingsCollectionSafe]
  );

  const registerManualContact = useCallback(
    async (providerId, note) => {
      await addMeetingEntry(providerId, {
        type: 'manual_contact',
        note: note || '',
        source: 'manual',
      });
    },
    [addMeetingEntry]
  );

  /**
   * Crear un nuevo proveedor
   */
  const addProvider = useCallback(
    async (providerData) => {
      if (!user) return null;

      try {
        const path = getCollectionPath();
        if (!path) return null;
        const proveedoresRef = collection(db, path);

        // Añadir campos de timestamp
        const providerWithTimestamp = {
          ...providerData,
          created: serverTimestamp(),
          createdAt: serverTimestamp(),
          updated: serverTimestamp(),
          date: providerData.date ? Timestamp.fromDate(new Date(providerData.date)) : null,
        };

        const docRef = await addDoc(proveedoresRef, providerWithTimestamp);

        // Actualizar estado local
        const newProvider = {
          id: docRef.id,
          ...providerData,
          date: providerData.date || '',
        };

        setProviders((prev) => [newProvider, ...prev]);
        applyFiltersRef.current([newProvider, ...providers]);
        loadProviders();

        return newProvider;
      } catch (err) {
        console.error('Error al añadir proveedor:', err);
        setError('No se pudo añadir el proveedor. Inténtalo de nuevo más tarde.');
        return null;
      }
    },
    [user, providers, applyFiltersRef, getCollectionPath, addServiceLine, loadProviders]
  );

  /**
   * Actualizar un proveedor existente
   */
  const updateProvider = useCallback(
    async (providerId, providerData) => {
      if (!user) return false;

      try {
        const path = getCollectionPath();
        if (!path) return false;
        const providerRef = doc(db, path, providerId);
        const existing = providers.find((p) => p.id === providerId) || {};

        const parseBudgetValue = (raw) => {
          if (raw == null) return null;
          if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
          const cleaned = String(raw).replace(/[^0-9.,-]/g, '').replace(',', '.');
          const value = parseFloat(cleaned);
          return Number.isNaN(value) ? null : value;
        };

        const contractStatus = (providerData.contractStatus ?? existing.contractStatus ?? '')
          .toString()
          .toLowerCase();
        const budgetStatus = (providerData.budgetStatus ?? existing.budgetStatus ?? '')
          .toString()
          .toLowerCase();
        const contractOk = ['signed', 'firmado', 'accepted', 'confirmado'].some((flag) =>
          contractStatus.includes(flag)
        );
        const budgetOk = ['approved', 'aceptado', 'confirmado'].some((flag) =>
          budgetStatus.includes(flag)
        );

        const providerWithTimestamp = {
          ...providerData,
          updated: serverTimestamp(),
          date: providerData.date ? Timestamp.fromDate(new Date(providerData.date)) : null,
        };

        if (contractOk && budgetOk && (providerData.status || existing.status) !== 'Confirmado') {
          providerWithTimestamp.status = 'Confirmado';
        }

        await updateDoc(providerRef, providerWithTimestamp);

        setProviders((prev) => {
          const updated = prev.map((p) =>
            p.id === providerId
              ? {
                  ...p,
                  ...providerData,
                  id: providerId,
                  status: providerWithTimestamp.status || providerData.status || p.status,
                  date: providerData.date ? providerData.date : p.date || '',
                }
              : p
          );
          try {
            applyFiltersRef.current(updated);
          } catch {}
          return updated;
        });

        setSelectedProvider((prev) =>
          prev && prev.id === providerId
            ? {
                ...prev,
                ...providerData,
                status: providerWithTimestamp.status || providerData.status || prev.status,
                id: providerId,
              }
            : prev
        );

        const finalStatus = providerWithTimestamp.status || providerData.status || existing.status;
        if (finalStatus === 'Confirmado') {
          try {
            await recordSupplierInsight({
              supplierId: providerId,
              weddingId: activeWedding || null,
              service: providerData.service || existing.service || '',
              budget: parseBudgetValue(
                providerData.budget ?? providerData.priceRange ?? existing.budget ?? existing.priceRange
              ),
              responseTimeMinutes: providerData.responseTimeMinutes ?? null,
              satisfaction:
                typeof providerData.satisfactionScore === 'number'
                  ? providerData.satisfactionScore
                  : null,
              status: 'Confirmado',
            });
          } catch (err) {
            console.warn('[useProveedores] recordSupplierInsight failed', err);
          }
        }

        setError(null);
        loadProviders();
        return true;
      } catch (err) {
        console.error('Error al actualizar proveedor:', err);
        setError('Error al actualizar el proveedor. Inténtalo de nuevo.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user, getCollectionPath, providers, activeWedding, applyFiltersRef, loadProviders]
  );

  /**
   * Eliminar un proveedor
   */
  /**
   * Añadir reserva a proveedor
   */
  const addReservation = useCallback(
    async (providerId, reservation) => {
      const provider = providers.find((p) => p.id === providerId);
      if (!provider) return false;

      const newReservations = Array.isArray(provider.reservations)
        ? [...provider.reservations, reservation]
        : [reservation];

      setProviders((prev) => {
        const updated = prev.map((p) => (p.id === providerId ? { ...p, reservations: newReservations } : p));
        try {
          applyFiltersRef.current(updated);
        } catch {}
        return updated;
      });

      if (user) {
        try {
          const path = getCollectionPath();
          if (path) {
            const providerRef = doc(db, path, providerId);
            await updateDoc(providerRef, {
              reservations: newReservations,
              updated: serverTimestamp(),
            });
          }
        } catch (err) {
          console.error('Error al guardar reserva', err);
        }
      }

      await addMeetingEntry(providerId, {
        type: 'reservation',
        note: reservation?.note || '',
        date: reservation?.date || new Date().toISOString(),
        source: 'reservation_modal',
      });

      return true;
    },
    [providers, user, getCollectionPath, applyFiltersRef, addMeetingEntry]
  );

  const deleteProvider = useCallback(
    async (providerId) => {
      if (!user) return false;

      try {
        const path = getCollectionPath();
        if (path) {
          const providerRef = doc(db, path, providerId);
          await deleteDoc(providerRef);
        }

        // Actualizar estado local
        setProviders((prev) => prev.filter((p) => p.id !== providerId));
        applyFiltersRef.current(providers.filter((p) => p.id !== providerId));

        // Si es el proveedor seleccionado, limpiarlo
        if (selectedProvider && selectedProvider.id === providerId) {
          setSelectedProvider(null);
        }

        // Eliminar de la lista de seleccionados si estaba allí
        setSelectedProviderIds((prev) => prev.filter((id) => id !== providerId));
        loadProviders();
        return true;
      } catch (err) {
        console.error('Error al eliminar proveedor:', err);
        setError('No se pudo eliminar el proveedor. Inténtalo de nuevo más tarde.');
        return false;
      }
    },
    [user, providers, selectedProvider, applyFiltersRef, getCollectionPath, loadProviders]
  );

  /**
   * Seleccionar/deseleccionar un proveedor de la lista
   */
  const toggleFavoriteProvider = useCallback(
    async (providerId) => {
      const provider = providers.find((p) => p.id === providerId);
      if (!provider) return;
      const newFav = !provider.favorite;
      // actualizar local
      setProviders((prev) =>
        prev.map((p) => (p.id === providerId ? { ...p, favorite: newFav } : p))
      );
      applyFiltersRef.current(providers.map((p) => (p.id === providerId ? { ...p, favorite: newFav } : p)));
      // actualizar firestore
      if (user) {
        try {
          const path = getCollectionPath();
          if (path) {
            const providerRef = doc(db, path, providerId);
            await updateDoc(providerRef, { favorite: newFav, updated: serverTimestamp() });
          }
        } catch (err) {
          console.error('Error al marcar favorito', err);
        }
      }
    },
    [providers, user, applyFiltersRef, getCollectionPath]
  );

  const toggleSelectProvider = useCallback((providerId) => {
    setSelectedProviderIds((prev) => {
      if (prev.includes(providerId)) {
        return prev.filter((id) => id !== providerId);
      } else {
        return [...prev, providerId];
      }
    });
  }, []);

  /**
   * Limpiar todas las selecciones
   */
  const clearSelection = useCallback(() => {
    setSelectedProviderIds([]);
  }, []);

  const loadProvidersRef = useRef(loadProviders);
  useEffect(() => {
    loadProvidersRef.current = loadProviders;
  }, [loadProviders]);

  const lastLoadKeyRef = useRef(null);

  useEffect(() => {
    if (!userUid) {
      lastLoadKeyRef.current = null;
      setProviders([]);
      setFilteredProviders([]);
      setLoading(false);
      return;
    }
    const key = `${userUid}::${activeWedding || ''}`;
    if (lastLoadKeyRef.current === key) return;
    lastLoadKeyRef.current = key;
    loadProvidersRef.current();
  }, [userUid, activeWedding]);

  const reloadProviders = useCallback(() => {
    return loadProvidersRef.current();
  }, []);

  // Hidratar filtros guardados por boda
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadData('supplierFilters', {
          docPath: activeWedding ? `weddings/${activeWedding}` : undefined,
          fallbackToLocal: true,
        });
        if (!cancelled && data && typeof data === 'object') {
          if (typeof data.searchTerm === 'string') setSearchTerm(data.searchTerm);
          if (typeof data.serviceFilter === 'string') setServiceFilter(data.serviceFilter);
          if (typeof data.statusFilter === 'string') setStatusFilter(data.statusFilter);
          if (typeof data.dateFrom === 'string') setDateFrom(data.dateFrom);
          if (typeof data.dateTo === 'string') setDateTo(data.dateTo);
          if (typeof data.ratingMin === 'number') setRatingMin(data.ratingMin);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [activeWedding]);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFiltersRef.current();
  }, [searchTerm, serviceFilter, statusFilter, dateFrom, dateTo, ratingMin, tab, applyFiltersRef]);

  // Persistir filtros (debounce) por boda
  useEffect(() => {
    if (persistTimer.current) {
      clearTimeout(persistTimer.current);
    }
    persistTimer.current = setTimeout(() => {
      const payload = { searchTerm, serviceFilter, statusFilter, dateFrom, dateTo, ratingMin };
      saveData('supplierFilters', payload, {
        docPath: activeWedding ? `weddings/${activeWedding}` : undefined,
        showNotification: false,
      }).catch(() => {});
    }, 300);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [searchTerm, serviceFilter, statusFilter, dateFrom, dateTo, ratingMin, tab, activeWedding]);

  return {
    // Estado
    providers,
    filteredProviders,
    loading,
    error,
    selectedProvider,
    selectedProviderIds,
    searchTerm,
    serviceFilter,
    statusFilter,
    dateFrom,
    dateTo,
    ratingMin,
    tab,

    // Setters
    setSearchTerm,
    setServiceFilter,
    setStatusFilter,
    setDateFrom,
    setDateTo,
    setRatingMin,
    setTab,
    setSelectedProvider,

    // Acciones
    loadProviders: reloadProviders,
    addProvider,
    updateProvider,
    deleteProvider,
    addReservation,
    addServiceLine,
    updateServiceLine,
    deleteServiceLine,
    mergeServiceLines,
    registerManualContact,
    toggleSelectProvider,
    toggleFavoriteProvider,
    clearSelection,
    clearFilters,
  };
};

export default useProveedores;

