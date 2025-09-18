import React, { useCallback, useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Plus, Sparkles } from "lucide-react";

// Componentes
import ProveedorList from "../components/proveedores/ProveedorList";
import CompareSelectedModal from "../components/proveedores/CompareSelectedModal";
import SupplierOnboardingModal from "../components/proveedores/SupplierOnboardingModal";
import ProveedorCard from "../components/proveedores/ProveedorCard";
import ProveedorForm from "../components/proveedores/ProveedorForm";
import ReservationModal from "../components/proveedores/ReservationModal";
import AISearchModal from "../components/proveedores/ai/AISearchModal";
import AIEmailModal from "../components/proveedores/ai/AIEmailModal";
import TrackingModal from "../components/proveedores/tracking/TrackingModal";
import BulkStatusModal from "../components/proveedores/BulkStatusModal";
import DuplicateDetectorModal from "../components/proveedores/DuplicateDetectorModal";
import WantedServicesModal from "../components/proveedores/WantedServicesModal";

// Hooks
import useProveedores from "../hooks/useProveedores";
import useAISearch from "../hooks/useAISearch";
import { useAuth } from "../hooks/useAuth";
import useSupplierGroups from "../hooks/useSupplierGroups";
import useActiveWeddingInfo from "../hooks/useActiveWeddingInfo";
import { loadData, saveData } from "../services/SyncService";
import { toast } from "react-toastify";
import { useWedding } from "../context/WeddingContext";

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
  const [activeTab, setActiveTab] = useState("info");
  const [showBulkStatus, setShowBulkStatus] = useState(false);
  const [showDupModal, setShowDupModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [sortMode, setSortMode] = useState('match');
  const [originFilter, setOriginFilter] = useState('all');
  const [statusView, setStatusView] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState({});

  // Servicios deseados
  const [wantedServices, setWantedServices] = useState([]);
  const [showWantedModal, setShowWantedModal] = useState(false);

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
        const am = Number.isFinite(a.aiMatch) ? a.aiMatch : (Number.isFinite(a.match) ? a.match : 0);
        const bm = Number.isFinite(b.aiMatch) ? b.aiMatch : (Number.isFinite(b.match) ? b.match : 0);
        if (bm !== am) return bm - am;
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
    if (user?.uid) return 'supplier_onboarding_done_user_' + (user?.uid);
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
      await saveData("wantedServices", list, {
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
          toast.success('Servicios iniciales configurados');
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

  // Cargar servicios deseados por boda
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadData("wantedServices", {
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


  const missingServices = useMemo(() => {
    const confirmed = new Set(
      (providers || [])
        .filter((p) => ["Confirmado", "Seleccionado"].includes(p.status))
        .map((p) => p.service)
        .filter(Boolean),
    );
    return normalizedWanted.filter((s) => !confirmed.has(s.name || s.id));
  }, [providers, normalizedWanted]);

  // Handlers
  const handleViewDetail = (provider) => {
    setSelectedProvider(provider);
    setActiveTab("info");
  };
  const handleNewProvider = () => setShowNewProviderForm(true);
  const handleEditProvider = () => setShowEditProviderForm(true);
  const handleReserveProvider = (provider) => {
    setSelectedProvider(provider);
    setShowReservationModal(true);
  };
  const handleCloseDetail = () => setSelectedProvider(null);
  const handleOpenAISearch = () => setShowAISearchModal(true);

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

  const mapAIResultToProvider = useCallback((result, overrides = {}) => {
    if (!result) return null;
    const baseName = (result.name || result.title || 'Proveedor sugerido').trim();
    const serviceName = (result.service || serviceFilter || 'Servicio para bodas').trim();
    const sanitize = (value) =>
      value.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^[.]+|[.]+$/g, '');
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
  }, [serviceFilter]);

  const handleAISelect = useCallback(
    async (result, action) => {
      if (!result) return;
      if (action === "view") {
        const normalized = mapAIResultToProvider(result);
        if (normalized) {
          setSelectedProvider(normalized);
          setActiveTab("info");
        }
        setShowAISearchModal(false);
      } else if (action === "add") {
        const normalized = mapAIResultToProvider(result);
        if (normalized) {
          await addProvider(normalized);
        }
        setShowAISearchModal(false);
      } else if (action === "select") {
        const normalized = mapAIResultToProvider(result, { status: "Seleccionado" });
        if (normalized) {
          await addProvider(normalized);
        }
        setShowAISearchModal(false);
      } else if (action === "email") {
        setAiSelectedResult(result);
        setShowAIEmailModal(true);
      }
    },
    [mapAIResultToProvider, addProvider, setActiveTab, setSelectedProvider, setShowAISearchModal, setAiSelectedResult, setShowAIEmailModal]
  );

  const handleSubmitProvider = async (providerData) => {
    if (showEditProviderForm && selectedProvider) {
      await updateProvider(selectedProvider.id, providerData);
      setShowEditProviderForm(false);
    } else {
      await addProvider(providerData);
      setShowNewProviderForm(false);
    }
  };

  const handleSubmitReservation = async (reservationData) => {
    if (
      selectedProvider &&
      !["Confirmado", "Seleccionado"].includes(selectedProvider.status)
    ) {
      await addReservation(selectedProvider.id, reservationData);
      await updateProvider(selectedProvider.id, {
        ...selectedProvider,
        status: "Contactado",
        date: reservationData.date,
      });
    }
    setShowReservationModal(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Proveedores</h1>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowWantedModal(true)}
            className="flex items-center"
            variant="outline"
          >
            Configurar servicios
          </Button>
          <Button onClick={handleOpenAISearch} className="flex items-center">
            <Sparkles size={16} className="mr-1" /> Búsqueda IA
          </Button>
          <Button onClick={handleNewProvider} className="flex items-center">
            <Plus size={16} className="mr-1" /> Nuevo Proveedor
          </Button>
        </div>
      </div>

      {/* Tabs de proveedores */}
      <div className="mb-4">
        <nav className="flex gap-2 border-b border-gray-200" aria-label="Filtros de proveedores">
          {([
            { id: "contratados", label: "Contratados" },
            { id: "buscados", label: "Buscados" },
            { id: "favoritos", label: "Favoritos" },
          ]).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTab(opt.id)}
              className={`px-3 py-2 text-sm font-medium border-b-2 ${
                tab === opt.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </nav>
        {tab === 'buscados' && (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Origen:</span>
              <button
                type="button"
                onClick={() => setOriginFilter('all')}
                className={`px-2 py-1 rounded border text-xs ${originFilter === 'all' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setOriginFilter('ai')}
                className={`px-2 py-1 rounded border text-xs ${originFilter === 'ai' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                IA
              </button>
              <button
                type="button"
                onClick={() => setOriginFilter('manual')}
                className={`px-2 py-1 rounded border text-xs ${originFilter === 'manual' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Manual
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Estado:</span>
              <button
                type="button"
                onClick={() => setStatusView('all')}
                className={`px-2 py-1 rounded border text-xs ${statusView === 'all' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setStatusView('pending')}
                className={`px-2 py-1 rounded border text-xs ${statusView === 'pending' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Pendiente
              </button>
              <button
                type="button"
                onClick={() => setStatusView('contacted')}
                className={`px-2 py-1 rounded border text-xs ${statusView === 'contacted' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
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
                className="px-2 py-1 rounded border text-xs border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
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
                className="px-2 py-1 rounded border text-xs border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                Contraer todo
              </button>
            </div>
          </div>
        )}
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="text-gray-500">Ordenar por:</span>
          <button
            type="button"
            onClick={() => setSortMode("match")}
            className={`px-2 py-1 rounded border text-xs ${sortMode === "match" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            Puntuacion IA
          </button>
          <button
            type="button"
            onClick={() => setSortMode("name")}
            className={`px-2 py-1 rounded border text-xs ${sortMode === "name" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
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
          <p className="text-gray-500">Cargando proveedores...</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Placeholders de servicios faltantes */}
          {tab === "contratados" && missingServices.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {missingServices.map((s) => (
                <Card key={s.id || s.name} className="opacity-60 border-dashed">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{s.name || s.id}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      Pendiente
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Aún no hay proveedor confirmado para este servicio.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setServiceFilter(s.name || s.id);
                        setShowAISearchModal(true);
                      }}
                    >
                      Buscar con IA
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Lista de proveedores con filtros */}
          {tab === "buscados" ? (
            <div className="space-y-6">
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
                    <span className="text-xs text-gray-500">
                      {expandedGroups?.[svc] === false ? "(mostrar)" : "(ocultar)"}
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
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
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
              onOpenCompare={openCompareModal}
              onOpenBulkStatus={openBulkStatusModal}
              onOpenDuplicates={openDuplicatesModal}
              onClearSelection={clearSelection}
            />
          )}

        </div>
      )}

      {/* Modales */}
      {showNewProviderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <ProveedorForm
            onSubmit={handleSubmitProvider}
            onCancel={() => setShowNewProviderForm(false)}
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
        providers={providers}
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
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {showAIEmailModal && aiSelectedResult && (
        <AIEmailModal
          isOpen={showAIEmailModal}
          onClose={() => {
            setShowAIEmailModal(false);
            setAiSelectedResult(null);
          }}
          aiResult={aiSelectedResult}
          searchQuery={aiLastQuery || ""}
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
            new Set([
              ...(primary.aliases || []),
              ...others.map((o) => o.email).filter(Boolean),
            ]),
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
          trackingItem={null}
        />
      )}

      <WantedServicesModal
        open={showWantedModal}
        onClose={() => setShowWantedModal(false)}
        value={wantedServices}
        onSave={saveWanted}
      />
    </div>
  );
};

export default Proveedores;







