import { Plus, Sparkles } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import AIEmailModal from '../components/proveedores/ai/AIEmailModal';
import AISearchModal from '../components/proveedores/ai/AISearchModal';
import AssignSelectedToGroupModal from '../components/proveedores/AssignSelectedToGroupModal';
import BulkStatusModal from '../components/proveedores/BulkStatusModal';
import CompareSelectedModal from '../components/proveedores/CompareSelectedModal';
import RFQModal from '../components/proveedores/RFQModal';
import DuplicateDetectorModal from '../components/proveedores/DuplicateDetectorModal';
import ProveedorCard from '../components/proveedores/ProveedorCard';
import ProveedorForm from '../components/proveedores/ProveedorForm';
import ProveedorList from '../components/proveedores/ProveedorList';
import ProviderSearchDrawer from '../components/proveedores/ProviderSearchDrawer';
import ReservationModal from '../components/proveedores/ReservationModal';
import SupplierOnboardingModal from '../components/proveedores/SupplierOnboardingModal';
import TrackingModal from '../components/proveedores/tracking/TrackingModal';
import WantedServicesModal from '../components/proveedores/WantedServicesModal';
import ServicesBoard from '../components/proveedores/ServicesBoard';
import SupplierKanban from '../components/proveedores/SupplierKanban';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageTabs from '../components/ui/PageTabs';
import Modal from '../components/Modal';

// Componentes

// Hooks
import { useWedding } from '../context/WeddingContext';
import useActiveWeddingInfo from '../hooks/useActiveWeddingInfo';
import useAISearch from '../hooks/useAISearch';
import { useAuth } from '../hooks/useAuth';
import useProveedores from '../hooks/useProveedores';
import useSupplierGroups from '../hooks/useSupplierGroups';
import useSupplierShortlist from '../hooks/useSupplierShortlist';
import { loadData, saveData } from '../services/SyncService';
import { loadTrackingRecords, TRACKING_STATUS } from '../services/EmailTrackingService';
import { sendBulkRfqAutomation } from '../services/bulkRfqAutomation';
import { recommendBestProvider } from '../utils/providerRecommendation';

const Proveedores = () => {
  const {
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
    setSearchTerm,
    setServiceFilter,
    setStatusFilter,
    setDateFrom,
    setDateTo,
    setRatingMin,
    setTab,
    setSelectedProvider,
    loadProviders,
    addProvider,
    addReservation,
    updateProvider,
    deleteProvider,
    toggleFavoriteProvider,
    toggleSelectProvider,
    clearSelection,
    clearFilters,
  } = useProveedores();

  const {
    results: aiResults,
    loading: aiLoading,
    usedFallback: aiUsedFallback,
    error: aiSearchError,
    lastQuery: aiLastQuery,
    searchProviders,
  } = useAISearch();
  const { user } = useAuth();
  const { groups } = useSupplierGroups();
  const {
    shortlist,
    loading: shortlistLoading,
    error: shortlistError,
    addEntry: addShortlistEntry,
    markReviewed: markShortlistReviewed,
    removeEntry: removeShortlistEntry,
  } = useSupplierShortlist();
  const { info: weddingInfo, loading: loadingWeddingInfo } = useActiveWeddingInfo();
  const { activeWedding } = useWedding();

  // Estado UI
  const [showNewProviderForm, setShowNewProviderForm] = useState(false);
  const [showEditProviderForm, setShowEditProviderForm] = useState(false);
  const [showAISearchModal, setShowAISearchModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showAIEmailModal, setShowAIEmailModal] = useState(false);
  const [aiSelectedResult, setAiSelectedResult] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showBulkStatus, setShowBulkStatus] = useState(false);
  const [showDupModal, setShowDupModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showGroupSelectedModal, setShowGroupSelectedModal] = useState(false);
  const [showBulkRfqModal, setShowBulkRfqModal] = useState(false);
  const [bulkRfqTargets, setBulkRfqTargets] = useState([]);
  const [sortMode, setSortMode] = useState('match');
  const [originFilter, setOriginFilter] = useState('all');
  const [statusView, setStatusView] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [trackingItem, setTrackingItem] = useState(null);
  const [automationLoading, setAutomationLoading] = useState(false);
  const [autoRecommendation, setAutoRecommendation] = useState(null);

  // Servicios deseaños
  const [wantedServices, setWantedServices] = useState([]);
  const [showWantedModal, setShowWantedModal] = useState(false);
  const [showNeedsModal, setShowNeedsModal] = useState(false);
  const [newProviderInitial, setNewProviderInitial] = useState(null);
  const [showBuscadosKanban, setShowBuscadosKanban] = useState(false);
  const [unreadMap, setUnreadMap] = useState({});
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [searchDrawerResult, setSearchDrawerResult] = useState(null);
  const [searchDrawerLoading, setSearchDrawerLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  const normalizedWanted = useMemo(() => {
    return (wantedServices || [])
      .map((s) => (typeof s === 'string' ? { id: s, name: s } : s))
      .filter((s) => s && (s.name || s.id));
  }, [wantedServices]);

  const selectedProviders = useMemo(() => {
    const set = new Set(selectedProviderIds || []);
    return (providers || []).filter((p) => set.has(p.id));
  }, [providers, selectedProviderIds]);

  const groupedByService = useMemo(() => {
    let list = filteredProviders || [];
    if (originFilter === 'ai') list = list.filter((p) => p.createdFromAI);
    if (originFilter === 'manual') list = list.filter((p) => !p.createdFromAI);
    if (statusView === 'pending') list = list.filter((p) => p.status === 'Pendiente');
    if (statusView === 'contacted') list = list.filter((p) => p.status === 'Contactado');
    const groups = {};
    list.forEach((p) => {
      const key = p.service || 'Otros';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    const collator = new Intl.Collator('es', { sensitivity: 'base' });
    const keys = Object.keys(groups).sort((a, b) => collator.compare(a, b));
    keys.forEach((k) => {
      groups[k].sort((a, b) => {
        if (sortMode === 'name') {
          return collator.compare(a.name || '', b.name || '');
        }
        const aScore = Number.isFinite(a?.intelligentScore?.score)
          ? a.intelligentScore.score
          : Number.isFinite(a.aiMatch)
            ? a.aiMatch
            : Number.isFinite(a.match)
              ? a.match
              : 0;
        const bScore = Number.isFinite(b?.intelligentScore?.score)
          ? b.intelligentScore.score
          : Number.isFinite(b.aiMatch)
            ? b.aiMatch
            : Number.isFinite(b.match)
              ? b.match
              : 0;
        if (bScore !== aScore) return bScore - aScore;
        return collator.compare(a.name || '', b.name || '');
      });
    });
    return { keys, groups };
  }, [filteredProviders, sortMode, originFilter, statusView]);

  const prefsKey = useMemo(() => {
    if (typeof window === 'undefined') return null;
    if (activeWedding) return `buscadosPrefs_${activeWedding}`;
    if (user?.uid) return `buscadosPrefs_user_${user.uid}`;
    return 'buscadosPrefs';
  }, [activeWedding, user?.uid]);

  const legacyPrefsKeys = useMemo(() => {
    if (typeof window === 'undefined') return [];
    const base = 'busca\u00f1osPrefs';
    const keys = [];
    if (activeWedding) keys.push(`${base}_${activeWedding}`);
    if (user?.uid) keys.push(`${base}_user_${user.uid}`);
    keys.push(base);
    return keys;
  }, [activeWedding, user?.uid]);

  useEffect(() => {
    if (!prefsKey || typeof window === 'undefined') return;
    const candidates = [prefsKey, ...legacyPrefsKeys];
    for (const key of candidates) {
      if (!key) continue;
      try {
        const rawPrefs = localStorage.getItem(key);
        if (!rawPrefs) continue;
        const prefs = JSON.parse(rawPrefs);
        if (prefs && typeof prefs === 'object') {
          if (prefs.originFilter) setOriginFilter(prefs.originFilter);
          if (prefs.statusView) setStatusView(prefs.statusView);
          if (prefs.sortMode) setSortMode(prefs.sortMode);
          if (prefs.expandedGroups && typeof prefs.expandedGroups === 'object') {
            setExpandedGroups(prefs.expandedGroups);
          }
          break;
        }
      } catch {
        continue;
      }
    }
  }, [prefsKey, legacyPrefsKeys]);

  useEffect(() => {
    if (!prefsKey || typeof window === 'undefined') return;
    const prefs = { originFilter, statusView, sortMode, expandedGroups };
    try {
      localStorage.setItem(prefsKey, JSON.stringify(prefs));
    } catch {}
  }, [prefsKey, originFilter, statusView, sortMode, expandedGroups]);

  const onboardingKey = useMemo(() => {
    if (typeof window === 'undefined') return null;
    if (activeWedding) return 'supplier_onboarding_done_' + activeWedding;
    if (user?.uid) return 'supplier_onboarding_done_user_' + user?.uid;
    return null;
  }, [activeWedding, user?.uid]);
  const markOnboardingDone = useCallback(() => {
    if (typeof window !== 'undefined' && onboardingKey) {
      localStorage.setItem(onboardingKey, '1');
    }
    setShowOnboardingModal(false);
  }, [onboardingKey]);
  const saveWanted = async (list) => {
    setWantedServices(list);
    try {
      await saveData('wantedServices', list, {
        docPath: activeWedding ? `weddings/${activeWedding}` : undefined,
        showNotification: false,
      });
    } catch {}
    setShowWantedModal(false);
  };

  const handleOnboardingComplete = useCallback(
    async (services) => {
      if (Array.isArray(services) && services.length) {
        await saveWanted(services);
        if (typeof window !== 'undefined') {
          toast.success('Servicios iniciales configuraños');
        }
      } else if (typeof window !== 'undefined') {
        toast.info('No se guardaron servicios.');
      }
      markOnboardingDone();
    },
    [markOnboardingDone, saveWanted]
  );

  const handleOnboardingSkip = useCallback(() => {
    if (typeof window !== 'undefined') {
      toast.info('Puedes configurar los servicios cuando quieras.');
    }
    markOnboardingDone();
  }, [markOnboardingDone]);

  // Cargar proveedores
  useEffect(() => {
    if (user) loadProviders();
  }, [user, loadProviders]);

  const computeUnreadMap = useCallback(() => {
    const records = loadTrackingRecords();
    const pendingStatuses = [
      TRACKING_STATUS?.WAITING,
      TRACKING_STATUS?.FOLLOWUP,
      TRACKING_STATUS?.URGENT,
    ].filter(Boolean);
    const byEmail = {};
    (providers || []).forEach((prov) => {
      if (prov.email) byEmail[String(prov.email).toLowerCase()] = prov.id;
    });
    const map = {};
    (Array.isArray(records) ? records : []).forEach((record) => {
      const status = record?.status;
      const isPending = pendingStatuses.length
        ? pendingStatuses.includes(status)
        : status !== TRACKING_STATUS?.RESPONDED && status !== 'responded';
      if (!isPending) return;
      const providerId = record?.providerId || byEmail[String(record?.providerEmail || '').toLowerCase()];
      if (providerId) map[providerId] = true;
    });
    return map;
  }, [providers]);

  useEffect(() => {
    try {
      setUnreadMap(computeUnreadMap());
    } catch (err) {
      console.warn('No se pudieron calcular indicadores de seguimiento', err);
      setUnreadMap({});
    }
  }, [computeUnreadMap]);

  // Registrar resultado de pago de Stripe desde query paramás
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      const payment = url.searchParamás.get('payment');
      const pid = url.searchParamás.get('providerId');
      const amount = url.searchParamás.get('amount');
      if (payment && pid) {
        const normalizedAmount = amount ? Number(amount) : null;
        if (payment === 'success') {
          const p = (providers || []).find((x) => String(x.id) === String(pid));
          if (p) {
            updateProvider(p.id, {
              ...p,
              depositStatus: 'paid',
              depositAmount: normalizedAmount || p.depositAmount || null,
              depositPaidAt: new Date().toISOString(),
            }).catch(() => {});
          }
          try { toast.success('Señal pagada correctamente'); } catch {}
        } else if (payment === 'cancel') {
          try { toast.info('Pago cancelado'); } catch {}
        }
        // Limpiar query paramás de la URL
        url.searchParamás.delete('payment');
        url.searchParamás.delete('providerId');
        url.searchParamás.delete('amount');
        window.history.replaceState({}, document.title, url.pathname + (url.search ? `?${url.searchParamás.toString()}` : '') + url.hash);
      }
    } catch {}
  }, [providers, updateProvider]);

  // Mostrar onboarding inicial si no se ha completado y faltan daños básicos
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!onboardingKey) return;
    try {
      const done = localStorage.getItem(onboardingKey) === '1';
      const noProviders = (providers || []).length === 0;
      const noWanted = (normalizedWanted || []).length === 0;
      if (!done && (noProviders || noWanted)) {
        setShowOnboardingModal(true);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingKey, providers?.length, normalizedWanted?.length]);

  // Cargar servicios deseaños por boda
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadData('wantedServices', {
          docPath: activeWedding ? `weddings/${activeWedding}` : undefined,
          fallbackToLocal: true,
        });
        if (!cancelled && Array.isArray(data)) setWantedServices(data);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [activeWedding]);

  const formatShortDate = (value) => {
    if (!value) return '';
    try {
      const date =
        typeof value?.toDate === 'function'
          ? value.toDate()
          : typeof value === 'string'
            ? new Date(value)
            : value instanceof Date
              ? value
              : new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  const normalizedProviders = useMemo(() => {
    const mapEstado = (status) => {
      const value = String(status || '').toLowerCase();
      if (value.includes('confirm')) return 'Contratado';
      if (value.includes('seleccion') || value.includes('presup')) return 'Presupuestos';
      if (value.includes('contact')) return 'Contactado';
      if (value.includes('rechaz')) return 'Rechazado';
      return 'Por definir';
    };
    return (providers || []).map((prov) => ({
      ...prov,
      nombre: prov.name || prov.nombre || prov.contact || 'Proveedor',
      servicio: prov.service || prov.servicio || 'Servicio',
      estado: mapEstado(prov.status || prov.estado),
      favorito: Boolean(prov.favorite || prov.favorito),
      presupuesto: prov.priceRange || prov.presupuesto || 0,
      presupuestoAsignado: prov.assignedBudget || prov.presupuestoAsignado || 0,
      gastado: prov.spent || prov.gastado || 0,
      proximaAccion: prov.nextAction || prov.proximaAccion || '',
      origin: prov.origin || prov.origen || '',
      groupName: prov.groupName || prov.grupo || '',
    }));
  }, [providers]);

  const contractedProviders = useMemo(
    () =>
      (normalizedProviders || []).filter((prov) =>
        String(prov?.estado || '').toLowerCase().includes('contrat')
      ),
    [normalizedProviders]
  );

  const budgetStageProviders = useMemo(
    () =>
      (normalizedProviders || []).filter((prov) =>
        String(prov?.estado || '').toLowerCase().includes('presup')
      ),
    [normalizedProviders]
  );

  const servicesCovered = useMemo(() => {
    const covered = new Set();
    (normalizedProviders || []).forEach((prov) => {
      const state = String(prov?.estado || '').toLowerCase();
      if (!state.includes('contrat') && !state.includes('presup')) return;
      const service = prov?.servicio || prov?.service;
      if (service) covered.add(service);
    });
    return covered;
  }, [normalizedProviders]);

  const missingServices = useMemo(() => {
    return normalizedWanted.filter((service) => {
      const key = service?.name || service?.id;
      if (!key) return false;
      return !servicesCovered.has(key);
    });
  }, [servicesCovered, normalizedWanted]);

  // Handlers
  const handleViewDetail = (provider) => {
    if (!provider) return;
    setSelectedProvider(provider);
    setActiveTab('info');
    setUnreadMap((prev) => {
      if (!prev || !prev[provider.id]) return prev || {};
      const next = { ...prev };
      delete next[provider.id];
      return next;
    });
  };
  const handleNewProvider = () => {
    setNewProviderInitial(null);
    setShowNewProviderForm(true);
  };
  const handleEditProvider = () => setShowEditProviderForm(true);
  const handleReserveProvider = (provider) => {
    setSelectedProvider(provider);
    setShowReservationModal(true);
  };
  const handleCloseDetail = () => setSelectedProvider(null);
  const handleOpenAISearch = () => setShowAISearchModal(true);

  const handleEdit = (provider) => {
    if (provider) setSelectedProvider(provider);
    setShowEditProviderForm(true);
  };

  const handleDelete = async (providerId) => {
    if (!providerId) return;
    try {
      const ok = typeof window !== 'undefined' ? window.confirm('¿Eliminar este proveedor?') : true;
      if (!ok) return;
      await deleteProvider(providerId);
    } catch {}
  };

  const handleOpenGroups = (groupId) => {
    try {
      if (!groupId) return;
      const g = (groups || []).find((x) => x.id === groupId);
      if (g) {
        setTab('buscados');
        setSearchTerm(g.name || '');
        if (typeof window !== 'undefined') {
          toast.info(`Grupo: ${g.name}`);
        }
      }
    } catch {}
  };

  const handleOpenSearchDrawer = () => {
    setSearchDrawerResult(null);
    setSearchDrawerLoading(false);
    setSearchDrawerOpen(true);
  };

  const handleCloseSearchDrawer = () => {
    setSearchDrawerOpen(false);
    setSearchDrawerResult(null);
    setSearchDrawerLoading(false);
  };

  const handleDrawerSearch = useCallback(
    async (query) => {
      if (!query) return;
      setSearchDrawerLoading(true);
      try {
        const results = await searchProviders(query);
        setSearchHistory((prev) => [...prev.slice(-4), query]);
        if (Array.isArray(results) && results.length) {
          setSearchDrawerResult(results[0]);
        } else {
          setSearchDrawerResult(null);
        }
      } catch (err) {
        console.warn('Búsqueda IA fallback', err);
        setSearchDrawerResult(null);
      } finally {
        setSearchDrawerLoading(false);
      }
    },
    [searchProviders]
  );

  const mapAIResultToProvider = useCallback(
    (result, overrides = {}) => {
      if (!result) return null;
      const baseName = (result.name || result.title || 'Proveedor sugerido').trim();
      const serviceName = (result.service || serviceFilter || 'Servicio para bodas').trim();
      const sanitize = (value) =>
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '.')
          .replace(/^[.]+|[.]+$/g, '');
      const fallbackEmail = result.email || (baseName ? `${sanitize(baseName)}@contacto.pro` : '');
      const normalized = {
        name: baseName,
        service: serviceName,
        contact: result.contact || '',
        email: fallbackEmail,
        phone: result.phone || '',
        status: 'Pendiente',
        snippet: result.snippet || result.aiSummary || '',
        link: result.link || '',
        image: result.image || '',
        priceRange: result.priceRange || result.price || '',
        location: result.location || '',
        rating: result.rating || 0,
        ratingCount: result.ratingCount || 0,
        aiMatch: result.match || 0,
        aiSummary: result.aiSummary || '',
        tags: Array.isArray(result.tags) ? result.tags : [],
        source: 'ai-search',
        createdFromAI: true,
      };
      return { ...normalized, ...overrides };
    },
    [serviceFilter]
  );

  const addResultToShortlist = useCallback(
    async (result, overrides = {}) => {
      if (!result || typeof addShortlistEntry !== 'function') return;
      try {
        const uniqueKey = (result.link || result.email || result.name || '')
          .toString()
          .toLowerCase();
        const alreadyExists = (shortlist || []).some((item) => {
          const compareKey = (item.link || item.email || item.name || '').toString().toLowerCase();
          return uniqueKey && compareKey && compareKey === uniqueKey;
        });
        if (alreadyExists) return;
        const entry = {
          name: result.name || result.title || 'Proveedor sugerido',
          service: overrides.service || result.service || serviceFilter || '',
          location: result.location || '',
          priceRange: overrides.priceRange || result.priceRange || result.price || '',
          source: overrides.source || result.source || 'ai',
          match: overrides.match ?? result.match ?? null,
          link: result.link || '',
          email: result.email || '',
          phone: result.phone || '',
          notes: overrides.notes || result.snippet || result.aiSummary || '',
        };
        await addShortlistEntry(entry);
      } catch (err) {
        console.warn('[shortlist] add entry failed', err);
      }
    },
    [addShortlistEntry, shortlist, serviceFilter]
  );

  const handleDrawerSave = useCallback(
    async (result) => {
      if (!result) return;
      await addResultToShortlist(result);
      const normalized = mapAIResultToProvider(result);
      if (!normalized) return;
      setNewProviderInitial(normalized);
      setShowNewProviderForm(true);
      handleCloseSearchDrawer();
    },
    [mapAIResultToProvider, handleCloseSearchDrawer, addResultToShortlist]
  );

  const handleBoardSearch = useCallback(
    (service) => {
      if (service) setServiceFilter(service);
      handleOpenSearchDrawer();
    },
    [handleOpenSearchDrawer, setServiceFilter]
  );

  const handleBoardOpenAI = useCallback(
    (service) => {
      if (service) setServiceFilter(service);
      handleOpenAISearch();
    },
    [handleOpenAISearch, setServiceFilter]
  );

  const handleBoardAdd = useCallback(
    (service) => {
      setNewProviderInitial({
        name: '',
        service: service || '',
        status: 'Pendiente',
      });
      setShowNewProviderForm(true);
    },
    []
  );

  const handleKanbanMove = useCallback(
    async (prov, targetKey) => {
      if (!prov || !targetKey) return;
      const statusMap = {
        por_definir: 'Pendiente',
        vistos: 'Vistos',
        contactado: 'Contactado',
        presupuesto: 'Seleccionado',
        contratado: 'Confirmado',
        rechazado: 'Rechazado',
      };
      const newStatus = statusMap[targetKey] || 'Pendiente';
      const current = (providers || []).find((p) => p.id === prov.id);
      if (!current || current.status === newStatus) return;
      await updateProvider(current.id, { ...current, status: newStatus });
    },
    [providers, updateProvider]
  );

  const openCompareModal = () => {
    if (!selectedProviderIds.length) return;
    setShowCompareModal(true);
  };

  const handleAutoRecommend = useCallback(async () => {
    if (!selectedProviders.length) {
      toast.info('Selecciona al menos un proveedor para automatizar la solicitud.', { autoClose: 4000 });
      return;
    }
    const providersWithEmail = selectedProviders
      .filter((provider) => provider?.email)
      .map((provider) => ({
        ...provider,
        assignedBudget:
          Number(provider?.assignedBudget ?? provider?.presupuestoAsignado ?? provider?.budgetTarget ?? provider?.presupuesto) ||
          null,
      }));

    if (!providersWithEmail.length) {
      toast.warn('Ninguno de los proveedores seleccionados tiene email configurado.', { autoClose: 5000 });
      return;
    }

    const weddingDoc = (weddingInfo && (weddingInfo.weddingInfo || weddingInfo)) || {};
    const serviceNames = Array.from(
      new Set(
        providersWithEmail
          .map((p) => p?.service || p?.servicio || '')
          .filter(Boolean),
      ),
    );
    const servicesLabel = serviceNames.length ? serviceNames.join(', ') : 'tu evento';
    const autoSubject = `Solicitud de presupuesto para ${servicesLabel}`;
    const autoBody = [
      'Hola {proveedor_nombre},',
      '',
      'Estamos organizando nuestra boda para {fecha_evento} en {lugar} y necesitamos {servicio}.',
      'Nuestro presupuesto objetivo es {presupuesto_asignado} y nos gustaría conocer tu propuesta detallada, disponibilidad y cualquier información relevante.',
      '',
      'Quedamos atentos a tu respuesta.',
      '',
      'Gracias,',
      '{organizador}',
    ].join('\n');

    setAutomationLoading(true);
    setAutoRecommendation(null);
    try {
      const rfqResult = await sendBulkRfqAutomation({
        weddingId: activeWedding,
        providers: providersWithEmail,
        subject: autoSubject,
        body: autoBody,
        weddingInfo: weddingDoc,
      });

      const recommendation = recommendBestProvider(providersWithEmail, {
        wantedServices: normalizedWanted,
        requiredTags: normalizedWanted,
        preferences: weddingDoc?.preferences || {},
      });

      if (recommendation) {
        setAutoRecommendation({ recommendation, rfqResult });
        setShowCompareModal(true);
        const winner = providersWithEmail.find((p) => p.id === recommendation.providerId);
        if (winner?.name) {
          toast.success(`Recomendación IA: ${winner.name}`, { autoClose: 5000 });
        } else {
          toast.success('Recomendación IA generada.', { autoClose: 5000 });
        }
      } else {
        toast.info('Se enviaron las solicitudes, pero no se pudo calcular una recomendación automática.', { autoClose: 5000 });
      }

      if (rfqResult.fail > 0) {
        toast.warn(`No se pudieron enviar ${rfqResult.fail} solicitudes.`, { autoClose: 6000 });
      }
    } catch (error) {
      console.error('Error en la automatización de RFQ:', error);
      toast.error('No se pudo completar la automatización de solicitudes.', { autoClose: 6000 });
    } finally {
      setAutomationLoading(false);
    }
  }, [selectedProviders, weddingInfo, activeWedding, normalizedWanted]);

  const openBulkRfqModal = () => {
    if (!selectedProviders.length) {
      toast.info('Selecciona al menos un proveedor con email para enviar el RFQ.');
      return;
    }
    const hasEmail = selectedProviders.some((p) => !!p?.email);
    if (!hasEmail) {
      toast.error('Ninguno de los proveedores seleccionados tiene email válido.');
      return;
    }
    setBulkRfqTargets(selectedProviders);
    setShowBulkRfqModal(true);
  };

  const openBulkStatusModal = () => {
    if (!selectedProviderIds.length) return;
    setShowBulkStatus(true);
  };

  const openDuplicatesModal = () => {
    setShowDupModal(true);
  };
  const openGroupSelectedModal = () => {
    if (!selectedProviderIds.length) return;
    setShowGroupSelectedModal(true);
  };

  const handleBulkRfqSent = (outcome) => {
    if (!outcome) return;
    if (outcome.sentCount > 0) {
      toast.success(`RFQ enviado a ${outcome.sentCount} proveedor(es).`);
    } else if (!outcome.ok) {
      toast.error('No se pudo enviar el RFQ.');
    }
    if (outcome.sentCount > 0) {
      clearSelection();
    }
  };

  const handleAISelect = useCallback(
    async (result, action) => {
      if (!result) return;
      await addResultToShortlist(result, {
        source: action === 'email' ? 'ai-email' : 'ai-modal',
        match: result.match ?? result.aiMatch ?? null,
      });
      if (action === 'view') {
        const normalized = mapAIResultToProvider(result);
        if (normalized) {
          setSelectedProvider(normalized);
          setActiveTab('info');
        }
        setShowAISearchModal(false);
      } else if (action === 'add') {
        const normalized = mapAIResultToProvider(result);
        if (normalized) {
          await addProvider(normalized);
        }
        setShowAISearchModal(false);
      } else if (action === 'select') {
        const normalized = mapAIResultToProvider(result, { status: 'Seleccionado' });
        if (normalized) {
          await addProvider(normalized);
        }
        setShowAISearchModal(false);
      } else if (action === 'email') {
        setAiSelectedResult(result);
        setShowAIEmailModal(true);
      }
    },
    [
      mapAIResultToProvider,
      addProvider,
      setActiveTab,
      setSelectedProvider,
      setShowAISearchModal,
      setAiSelectedResult,
      setShowAIEmailModal,
      addResultToShortlist,
    ]
  );

  const handleShortlistPromote = useCallback(
    async (item) => {
      if (!item) return;
      setNewProviderInitial({
        name: item.name || '',
        service: item.service || '',
        email: item.email || '',
        phone: item.phone || '',
        link: item.link || '',
        status: 'Pendiente',
        snippet: item.notes || '',
        priceRange: item.priceRange || '',
        location: item.location || '',
        origin: item.source || 'shortlist',
      });
      setShowNewProviderForm(true);
      try {
        if (item.id) await markShortlistReviewed(item.id);
      } catch (err) {
        console.warn('[shortlist] mark reviewed failed', err);
      }
    },
    [markShortlistReviewed, setNewProviderInitial, setShowNewProviderForm]
  );

  const handleShortlistReview = useCallback(
    async (item) => {
      if (!item?.id) return;
      try {
        await markShortlistReviewed(item.id);
        toast.success('Entrada marcada como revisada.');
      } catch (err) {
        console.warn('[shortlist] review failed', err);
        toast.error('No se pudo marcar como revisado.');
      }
    },
    [markShortlistReviewed]
  );

  const handleShortlistRemove = useCallback(
    async (item) => {
      if (!item?.id) return;
      try {
        await removeShortlistEntry(item.id);
        toast.info('Elemento eliminado de la lista de vistos.');
      } catch (err) {
        console.warn('[shortlist] remove failed', err);
        toast.error('No se pudo eliminar el elemento.');
      }
    },
    [removeShortlistEntry]
  );

  const ShortlistSection = () => (
    <div className="mt-3 space-y-4">
      {shortlistLoading && (
        <Card>
          <div className="text-sm text-muted">Cargando shortlist…</div>
        </Card>
      )}
      {shortlistError && (
        <Card>
          <div className="text-sm text-red-600">No se pudo cargar la lista de vistos.</div>
        </Card>
      )}
      {!shortlistLoading && (!shortlist || shortlist.length === 0) ? (
        <Card>
          <div className="text-sm text-muted">
            Aún no tienes proveedores en la lista de vistos. Guarda resultados de la búsqueda IA o añade enlaces manuales para revisarlos más tarde.
          </div>
        </Card>
      ) : null}
      {(shortlist || []).map((item) => (
        <Card key={item.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-body truncate">{item.name || 'Proveedor'}</h3>
              <p className="text-sm text-muted truncate">{item.service || 'Servicio'}</p>
              <p className="text-xs text-muted mt-1">
                {item.location ? `${item.location} · ` : ''}
                Guardado: {formatShortDate(item.createdAt)}
                {item.reviewedAt ? ` · Revisado: ${formatShortDate(item.reviewedAt)}` : ''}
              </p>
              {item.notes && <p className="text-sm text-body/80 mt-2">{item.notes}</p>}
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 underline mt-2 inline-block"
                >
                  Abrir enlace
                </a>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {item.match != null && (
                <span className="px-2 py-1 text-xs rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                  Match {item.match}
                </span>
              )}
              {item.priceRange && <span className="text-xs text-muted">{item.priceRange}</span>}
              {item.source && (
                <span className="text-[11px] text-muted uppercase tracking-wide">{item.source}</span>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => handleShortlistPromote(item)}>
              Crear proveedor
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleShortlistReview(item)}
              disabled={!!item.reviewedAt}
            >
              {item.reviewedAt ? 'Revisado' : 'Marcar revisado'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => handleShortlistRemove(item)}
            >
              Eliminar
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );

  const handleSubmitProvider = async (providerData) => {
    if (showEditProviderForm && selectedProvider) {
      await updateProvider(selectedProvider.id, providerData);
      setShowEditProviderForm(false);
    } else {
      const created = await addProvider(providerData);
      if (created?.id) {
        setUnreadMap((prev) => ({ ...prev, [created.id]: true }));
      }
      setShowNewProviderForm(false);
      setNewProviderInitial(null);
    }
  };

  const handleSubmitReservation = async (reservationData) => {
    if (selectedProvider && !['Confirmado', 'Seleccionado'].includes(selectedProvider.status)) {
      await addReservation(selectedProvider.id, reservationData);
      await updateProvider(selectedProvider.id, {
        ...selectedProvider,
        status: 'Contactado',
        date: reservationData.date,
      });
      // Nota: el calendario se gestiona desde la página de Tareas
}
    setShowReservationModal(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="page-header">
        <h1 className="page-title">Gestión de Proveedores</h1>
        {/* Texto accesible para E2E sin alterar el diseño visual */}
        <span className="sr-only">Proveedores</span>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowWantedModal(true)}
            className="flex items-center"
            variant="outline"
          >
            Configurar servicios
          </Button>
          <Button
            onClick={() => setShowNeedsModal(true)}
            className="flex items-center"
            variant="outline"
          >
            Matriz de necesidades
          </Button>
          <Button
            onClick={handleOpenAISearch}
            className="flex items-center"
            data-testid="open-ai-search"
          >
            <Sparkles size={16} className="mr-1" /> Búsqueda IA
          </Button>
          <Button onClick={handleNewProvider} className="flex items-center">
            <Plus size={16} className="mr-1" /> Nuevo Proveedor
          </Button>
        </div>
      </div>

      {/* Tabs de proveedores */}
      <div className="mb-4">
        <PageTabs
          value={tab}
          onChange={setTab}
          options={[
            { id: 'vistos', label: 'Vistos' },
            { id: 'buscados', label: 'Pipeline' },
            { id: 'contratados', label: 'Contratados' },
            { id: 'favoritos', label: 'Favoritos' },
          ]}
        />
        {tab === 'vistos' ? (
          <ShortlistSection />
        ) : tab === 'buscados' ? (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted">Origen:</span>
              <button
                type="button"
                onClick={() => setOriginFilter('all')}
                className={`px-2 py-1 rounded border text-xs ${originFilter === 'all' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-soft bg-surface text-body/80 hover:bg-[var(--color-accent)]/10'}`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setOriginFilter('ai')}
                className={`px-2 py-1 rounded border text-xs ${originFilter === 'ai' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-soft bg-surface text-body/80 hover:bg-[var(--color-accent)]/10'}`}
              >
                IA
              </button>
              <button
                type="button"
                onClick={() => setOriginFilter('manual')}
                className={`px-2 py-1 rounded border text-xs ${originFilter === 'manual' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-soft bg-surface text-body/80 hover:bg-[var(--color-accent)]/10'}`}
              >
                Manual
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted">Estado:</span>
              <button
                type="button"
                onClick={() => setStatusView('all')}
                className={`px-2 py-1 rounded border text-xs ${statusView === 'all' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-soft bg-surface text-body/80 hover:bg-[var(--color-accent)]/10'}`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setStatusView('pending')}
                className={`px-2 py-1 rounded border text-xs ${statusView === 'pending' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-soft bg-surface text-body/80 hover:bg-[var(--color-accent)]/10'}`}
              >
                Pendiente
              </button>
              <button
                type="button"
                onClick={() => setStatusView('contacted')}
                className={`px-2 py-1 rounded border text-xs ${statusView === 'contacted' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-soft bg-surface text-body/80 hover:bg-[var(--color-accent)]/10'}`}
              >
                Contactado
              </button>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const all = {};
                  groupedByService.keys.forEach((k) => {
                    all[k] = true;
                  });
                  setExpandedGroups(all);
                }}
                className="px-2 py-1 rounded border text-xs border-soft bg-surface text-body/80 hover:bg-[var(--color-accent)]/10"
              >
                Expandir todo
              </button>
              <button
                type="button"
                onClick={() => {
                  const all = {};
                  groupedByService.keys.forEach((k) => {
                    all[k] = false;
                  });
                  setExpandedGroups(all);
                }}
                className="px-2 py-1 rounded border text-xs border-soft bg-surface text-body/80 hover:bg-[var(--color-accent)]/10"
              >
                Contraer todo
              </button>
            </div>
          </div>
        ) : null}
        {tab !== 'vistos' && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-muted">Ordenar por:</span>
            <button
              type="button"
              onClick={() => setSortMode('match')}
              className={`px-2 py-1 rounded border text-xs ${sortMode === 'match' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-soft bg-surface text-body/80 hover:bg-[var(--color-accent)]/10'}`}
            >
              Puntuación IA
            </button>
            <button
              type="button"
              onClick={() => setSortMode('name')}
              className={`px-2 py-1 rounded border text-xs ${sortMode === 'name' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-soft bg-surface text-body/80 hover:bg-[var(--color-accent)]/10'}`}
            >
              Nombre
            </button>
          </div>
        )}
      </div>

      {error && (
        <Card className="mb-6 bg-red-50 border border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card className="p-8 text-center">
          <p className="text-muted">Cargando proveedores...</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Placeholders de servicios faltantes */}
          {tab === 'contratados' && missingServices.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {missingServices.map((s) => (
                <Card
                  key={s.id || s.name}
                  className="border border-dashed border-gray-300 bg-white/60 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{s.name || s.id}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-body">
                      Pendiente
                    </span>
                  </div>
                  <p className="text-sm text-muted mb-3">
                    Aún no hay proveedor confirmado para este servicio.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBoardSearch(s.name || s.id)}
                    >
                      Buscar con IA
                    </Button>
                    <Button size="sm" onClick={() => handleBoardAdd(s.name || s.id)}>
                      Añadir manualmente
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {tab === 'contratados' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card>
                <div className="text-sm text-muted">Proveedores contratados</div>
                <div className="text-2xl font-semibold">{contractedProviders.length}</div>
              </Card>
              <Card>
                <div className="text-sm text-muted">En negociación de presupuesto</div>
                <div className="text-2xl font-semibold">{budgetStageProviders.length}</div>
              </Card>
              <Card>
                <div className="text-sm text-muted">Servicios cubiertos</div>
                <div className="text-2xl font-semibold">{servicesCovered.size}</div>
              </Card>
            </div>
          )}

          {/* Lista de proveedores con filtros */}
          {tab === 'buscados' ? (
            <div className="space-y-6">
              <div className="border border-dashed border-soft bg-surface/70 rounded-md p-4 flex flex-wrap items-center gap-3">
                <div>
                  <div className="text-sm font-semibold text-body">Organiza tus necesidades</div>
                  <p className="text-xs text-muted max-w-md">
                    Utiliza la matriz para marcar servicios cubiertos, detectar huecos y lanzar búsquedas o altas rápidas.
                  </p>
                </div>
                <div className="ml-auto">
                  <Button size="sm" variant="outline" onClick={() => setShowNeedsModal(true)}>
                    Abrir matriz de necesidades
                  </Button>
                </div>
              </div>
              {searchHistory.length > 0 && (
                <div className="text-xs text-gray-500">
                  Últimas búsquedas IA: {searchHistory.slice(-3).join(', ')}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <div className="flex items-center gap-2">
                  <span className="text-muted">Vista:</span>
                  <button
                    type="button"
                    onClick={() => setShowBuscadosKanban(false)}
                    className={`px-2 py-1 rounded border text-xs ${
                      !showBuscadosKanban
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'border-soft bg-surface text-body/80 hover:bg-[var(--color-accent)]/10'
                    }`}
                  >
                    Lista
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBuscadosKanban(true)}
                    className={`px-2 py-1 rounded border text-xs ${
                      showBuscadosKanban
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'border-soft bg-surface text-body/80 hover:bg-[var(--color-accent)]/10'
                    }`}
                  >
                    Kanban
                  </button>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleOpenSearchDrawer}>
                    Búsqueda IA contextual
                  </Button>
                </div>
              </div>

              {showBuscadosKanban ? (
                <SupplierKanban
                  proveedores={normalizedProviders}
                  onMove={handleKanbanMove}
                  onClick={(prov) => {
                    const original = providers.find((p) => p.id === prov.id) || prov;
                    handleViewDetail(original);
                  }}
                />
              ) : (
                <>
                  {Array.isArray(selectedProviderIds) && selectedProviderIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                      <span>{selectedProviderIds.length} seleccionados</span>
                      <button
                        type="button"
                        onClick={handleAutoRecommend}
                        disabled={automationLoading}
                        className="px-3 py-1 border border-soft rounded-md bg-surface hover:bg-primary-soft disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {automationLoading ? 'Enviando…' : 'Solicitar y recomendar IA'}
                      </button>
                      <button
                        type="button"
                        onClick={openCompareModal}
                        className="px-3 py-1 border border-soft rounded-md bg-surface hover:bg-primary-soft"
                      >
                        Comparar
                      </button>
                      <button
                        type="button"
                        onClick={openBulkStatusModal}
                        className="px-3 py-1 border border-soft rounded-md bg-surface hover:bg-primary-soft"
                      >
                        Cambiar estado
                      </button>
                      <button
                        type="button"
                        onClick={openGroupSelectedModal}
                        className="px-3 py-1 border border-soft rounded-md bg-surface hover:bg-primary-soft"
                      >
                        Agrupar
                      </button>
                      <button
                        type="button"
                        onClick={openDuplicatesModal}
                        className="px-3 py-1 border border-soft rounded-md bg-surface hover:bg-primary-soft"
                      >
                        Revisar duplicaños
                      </button>
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="px-3 py-1 border border-soft rounded-md text-muted hover:bg-primary-soft"
                      >
                        Limpiar
                      </button>
                    </div>
                  )}
                  {groupedByService.keys.map((svc) => (
                    <div key={svc}>
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedGroups((prev) => ({ ...prev, [svc]: !(prev?.[svc] === false) }));
                        }}
                        className="flex items-center gap-2 mb-2"
                      >
                        <span className="text-lg font-semibold">{svc}</span>
                        <span className="text-xs text-muted">
                          {expandedGroups?.[svc] === false ? '(mástrar)' : '(ocultar)'}
                        </span>
                      </button>
                      {expandedGroups?.[svc] === false ? null : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {groupedByService.groups[svc].map((provider) => (
                            <ProveedorCard
                              key={provider.id}
                              provider={provider}
                              isSelected={selectedProviderIds?.includes?.(provider.id)}
                              onToggleSelect={() => toggleSelectProvider(provider.id)}
                              onViewDetail={() => handleViewDetail(provider)}
                              onToggleFavorite={toggleFavoriteProvider}
                              onEdit={() => handleEdit(provider)}
                              onDelete={() => handleDelete(provider.id)}
                              onReserve={() => handleReserveProvider(provider)}
                              onShowTracking={(item) => {
                                setTrackingItem(item || null);
                                setShowTrackingModal(!!item);
                              }}
                              onOpenGroups={handleOpenGroups}
                              hasPending={Boolean(unreadMap[provider.id])}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <ProveedorList
              providers={filteredProviders}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              serviceFilter={serviceFilter}
              setServiceFilter={setServiceFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              dateFrom={dateFrom}
              setDateFrom={setDateFrom}
              dateTo={dateTo}
              setDateTo={setDateTo}
              ratingMin={ratingMin}
              setRatingMin={setRatingMin}
              clearFilters={clearFilters}
              handleViewDetail={handleViewDetail}
              selected={selectedProviderIds}
              toggleSelect={toggleSelectProvider}
              toggleFavorite={toggleFavoriteProvider}
              onEdit={handleEdit}
              onDelete={(id) => handleDelete(id)}
              onReserve={(p) => handleReserveProvider(p)}
              onShowTracking={(item) => {
                setTrackingItem(item || null);
                setShowTrackingModal(!!item);
              }}
              onOpenGroups={handleOpenGroups}
              onOpenCompare={openCompareModal}
              onOpenRfq={openBulkRfqModal}
              onOpenBulkStatus={openBulkStatusModal}
              onOpenDuplicates={openDuplicatesModal}
              onOpenGroupSelected={openGroupSelectedModal}
              onClearSelection={clearSelection}
              hasPendingMap={unreadMap}
            />
          )}
        </div>
      )}

      {/* Modales */}
      {showNewProviderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <ProveedorForm
            initialData={newProviderInitial || undefined}
            onSubmit={handleSubmitProvider}
            onCancel={() => {
              setShowNewProviderForm(false);
              setNewProviderInitial(null);
            }}
          />
        </div>
      )}

      {showEditProviderForm && selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <ProveedorForm
            initialData={selectedProvider}
            onSubmit={handleSubmitProvider}
            onCancel={() => setShowEditProviderForm(false)}
          />
        </div>
      )}

      <AISearchModal
        isOpen={showAISearchModal}
        onClose={() => setShowAISearchModal(false)}
        onSearch={searchProviders}
        onSelect={handleAISelect}
        isLoading={aiLoading}
        results={aiResults}
        usedFallback={aiUsedFallback}
        error={aiSearchError}
        providers={providers}
        serviceFilter={serviceFilter}
        setServiceFilter={setServiceFilter}
      />

      <ProviderSearchDrawer
        open={searchDrawerOpen}
        onClose={handleCloseSearchDrawer}
        onBuscar={handleDrawerSearch}
        onGuardar={handleDrawerSave}
        resultado={searchDrawerResult}
        cargando={searchDrawerLoading}
      />

      {showAIEmailModal && aiSelectedResult && (
        <AIEmailModal
          isOpen={showAIEmailModal}
          onClose={() => {
            setShowAIEmailModal(false);
            setAiSelectedResult(null);
          }}
          aiResult={aiSelectedResult}
          searchQuery={aiLastQuery || ''}
        />
      )}

      <SupplierOnboardingModal
        open={showOnboardingModal}
        onClose={handleOnboardingSkip}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
        initialServices={normalizedWanted.map((item) => item.name || item.id)}
        weddingInfo={weddingInfo}
        loadingWedding={loadingWeddingInfo}
      />

      <CompareSelectedModal
        open={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        providers={selectedProviders}
        onRemoveFromSelection={(id) => {
          try {
            toggleSelectProvider(id);
          } catch {}
        }}
        recommendedId={autoRecommendation?.recommendation?.providerId}
        recommendationDetails={autoRecommendation?.recommendation}
        rfqSummary={autoRecommendation?.rfqResult}
      />

      <BulkStatusModal
        open={showBulkStatus}
        onClose={() => setShowBulkStatus(false)}
        onApply={async (newStatus) => {
          for (const pid of selectedProviderIds) {
            const p = providers.find((x) => x.id === pid);
            if (!p) continue;
            await updateProvider(pid, { ...p, status: newStatus });
          }
          clearSelection();
          setShowBulkStatus(false);
        }}
      />

      <DuplicateDetectorModal
        open={showDupModal}
        onClose={() => setShowDupModal(false)}
        providers={providers}
        onMerge={async (group, primaryId) => {
          if (!Array.isArray(group) || group.length < 2) return;
          const primary = group.find((x) => x.id === primaryId) || group[0];
          const others = group.filter((x) => x.id !== primary.id);
          const aliases = Array.from(
            new Set([...(primary.aliases || []), ...others.map((o) => o.email).filter(Boolean)])
          );
          await updateProvider(primary.id, { ...primary, aliases });
          for (const o of others) {
            await deleteProvider(o.id);
          }
          clearSelection();
          setShowDupModal(false);
        }}
      />

      {showReservationModal && selectedProvider && (
        <ReservationModal
          provider={selectedProvider}
          onClose={() => setShowReservationModal(false)}
          onSubmit={handleSubmitReservation}
        />
      )}

      {showTrackingModal && (
        <TrackingModal
          isOpen={showTrackingModal}
          onClose={() => setShowTrackingModal(false)}
          trackingItem={trackingItem}
        />
      )}

      <Modal
        open={showNeedsModal}
        onClose={() => setShowNeedsModal(false)}
        title="Matriz de necesidades"
        size="full"
        className="max-w-6xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Marca el estado de cada servicio, detecta duplicados y lanza rutas rápidas de búsqueda o alta manual.
          </p>
          <ServicesBoard
            proveedores={normalizedProviders}
            onOpenSearch={handleBoardSearch}
            onOpenAI={handleBoardOpenAI}
            onOpenNew={handleBoardAdd}
          />
        </div>
      </Modal>

      <WantedServicesModal
        open={showWantedModal}
        onClose={() => setShowWantedModal(false)}
        value={wantedServices}
        onSave={saveWanted}
      />
      {showBulkRfqModal && (
        <RFQModal
          open={showBulkRfqModal}
          onClose={() => {
            setShowBulkRfqModal(false);
            setBulkRfqTargets([]);
          }}
          providers={bulkRfqTargets}
          onSent={handleBulkRfqSent}
        />
      )}
      {showGroupSelectedModal && (
        <AssignSelectedToGroupModal
          open={showGroupSelectedModal}
          onClose={(res) => {
            setShowGroupSelectedModal(false);
            if (res?.success) {
              clearSelection();
              try { if (typeof window !== 'undefined') toast.success('Proveedores agrupaños'); } catch {}
            }
          }}
          providers={selectedProviders}
        />
      )}
    </div>
  );
};

export default Proveedores;



