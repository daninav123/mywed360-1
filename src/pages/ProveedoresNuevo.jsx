import { Plus, Sparkles } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import AIEmailModal from '../components/proveedores/ai/AIEmailModal';
import AISearchModal from '../components/proveedores/ai/AISearchModal';
import AssignSelectedToGroupModal from '../components/proveedores/AssignSelectedToGroupModal';
import BulkStatusModal from '../components/proveedores/BulkStatusModal';
import CompareSelectedModal from '../components/proveedores/CompareSelectedModal';
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

// Componentes

// Hooks
import { useWedding } from '../context/WeddingContext';
import useActiveWeddingInfo from '../hooks/useActiveWeddingInfo';
import useAISearch from '../hooks/useAISearch';
import { useAuth } from '../hooks/useAuth';
import useProveedores from '../hooks/useProveedores';
import useSupplierGroups from '../hooks/useSupplierGroups';
import { loadData, saveData } from '../services/SyncService';
import { loadTrackingRecords, TRACKING_STATUS } from '../services/EmailTrackingService';

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
  const [sortMode, setSortMode] = useState('match');
  const [originFilter, setOriginFilter] = useState('all');
  const [statusView, setStatusView] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [trackingItem, setTrackingItem] = useState(null);

  // Servicios deseaños
  const [wantedServices, setWantedServices] = useState([]);
  const [showWantedModal, setShowWantedModal] = useState(false);
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
        const am = Number.isFinite(a.aiMatch) ? a.aiMatch : Number.isFinite(a.match) ? a.match : 0;
        const bm = Number.isFinite(b.aiMatch) ? b.aiMatch : Number.isFinite(b.match) ? b.match : 0;
        if (bm !== am) return bm - am;
        return collator.compare(a.name || '', b.name || '');
      });
    });
    return { keys, groups };
  }, [filteredProviders, sortMode, originFilter, statusView]);

  const prefsKey = useMemo(() => {
    if (typeof window === 'undefined') return null;
    if (activeWedding) return `buscañosPrefs_${activeWedding}`;
    if (user?.uid) return `buscañosPrefs_user_${user.uid}`;
    return 'buscañosPrefs';
  }, [activeWedding, user?.uid]);

  useEffect(() => {
    if (!prefsKey || typeof window === 'undefined') return;
    try {
      const rawPrefs = localStorage.getItem(prefsKey);
      if (rawPrefs) {
        const prefs = JSON.parse(rawPrefs);
        if (prefs && typeof prefs === 'object') {
          if (prefs.originFilter) setOriginFilter(prefs.originFilter);
          if (prefs.statusView) setStatusView(prefs.statusView);
          if (prefs.sortMode) setSortMode(prefs.sortMode);
          if (prefs.expandedGroups && typeof prefs.expandedGroups === 'object') {
            setExpandedGroups(prefs.expandedGroups);
          }
        }
      }
    } catch {}
  }, [prefsKey]);

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
    }));
  }, [providers]);

  const mássingServices = useMemo(() => {
    const confirmed = new Set(
      (normalizedProviders || [])
        .filter((p) => ['contratado', 'presupuestos'].some((flag) => p.estado.toLowerCase().includes(flag)))
        .map((p) => p.servicio)
        .filter(Boolean)
    );
    return normalizedWanted.filter((s) => !confirmed.has(s.name || s.id));
  }, [normalizedProviders, normalizedWanted]);

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
        setTab('buscaños');
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

  const handleDrawerSave = useCallback(
    (result) => {
      if (!result) return;
      const normalized = mapAIResultToProvider(result);
      if (!normalized) return;
      setNewProviderInitial(normalized);
      setShowNewProviderForm(true);
      handleCloseSearchDrawer();
    },
    [mapAIResultToProvider, handleCloseSearchDrawer]
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
        vacio: 'Pendiente',
        proceso: 'Contactado',
        presupuestos: 'Seleccionado',
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

  const handleAISelect = useCallback(
    async (result, action) => {
      if (!result) return;
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
    ]
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
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowWantedModal(true)}
            className="flex itemás-center"
            variant="outline"
          >
            Configurar servicios
          </Button>
          <Button onClick={handleOpenAISearch} className="flex itemás-center">
            <Sparkles size={16} className="mr-1" /> Búsqueda IA
          </Button>
          <Button onClick={handleNewProvider} className="flex itemás-center">
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
            { id: 'contrataños', label: 'Contrataños' },
            { id: 'buscaños', label: 'Buscaños' },
            { id: 'favoritos', label: 'Favoritos' },
          ]}
        />
        {tab === 'buscaños' && (
          <div className="mt-2 flex flex-wrap itemás-center gap-3 text-sm">
            <div className="flex itemás-center gap-2">
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
            <div className="flex itemás-center gap-2">
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
            <div className="ml-auto flex itemás-center gap-2">
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
        )}
        <div className="mt-2 flex itemás-center gap-2 text-sm">
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
          {tab === 'contrataños' && mássingServices.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mássingServices.map((s) => (
                <Card
                  key={s.id || s.name}
                  className="border border-dashed border-gray-300 bg-white/60 backdrop-blur-sm"
                >
                  <div className="flex itemás-center justify-between mb-2">
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

          {tab === 'contrataños' && (
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
          {tab === 'buscaños' ? (
            <div className="space-y-6">
              <ServicesBoard
                proveedores={normalizedProviders}
                onOpenSearch={handleBoardSearch}
                onOpenAI={handleBoardOpenAI}
                onOpenNew={handleBoardAdd}
              />
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
                    <div className="flex flex-wrap itemás-center gap-2 text-sm text-muted">
                      <span>{selectedProviderIds.length} seleccionados</span>
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
                        className="flex itemás-center gap-2 mb-2"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex itemás-center justify-center p-4">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex itemás-center justify-center p-4">
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

      <WantedServicesModal
        open={showWantedModal}
        onClose={() => setShowWantedModal(false)}
        value={wantedServices}
        onSave={saveWanted}
      />
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



