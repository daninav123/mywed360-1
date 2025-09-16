import React, { useEffect, useMemo, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Plus, Sparkles } from 'lucide-react';

// Componentes
import ProveedorList from '../components/proveedores/ProveedorList';
import ProveedorCard from '../components/proveedores/ProveedorCard';
import ProveedorForm from '../components/proveedores/ProveedorForm';
import ReservationModal from '../components/proveedores/ReservationModal';
import AISearchModal from '../components/proveedores/ai/AISearchModal';
import AIEmailModal from '../components/proveedores/ai/AIEmailModal';
import TrackingModal from '../components/proveedores/tracking/TrackingModal';
import BulkStatusModal from '../components/proveedores/BulkStatusModal';
import DuplicateDetectorModal from '../components/proveedores/DuplicateDetectorModal';
import WantedServicesModal from '../components/proveedores/WantedServicesModal';

// Hooks
import useProveedores from '../hooks/useProveedores';
import useAISearch from '../hooks/useAISearch';
import { useAuth } from '../hooks/useAuth';
import useSupplierGroups from '../hooks/useSupplierGroups';
import { loadData, saveData } from '../services/SyncService';
import { useWedding } from '../context/WeddingContext';

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

  const { results: aiResults, loading: aiLoading, lastQuery: aiLastQuery, searchProviders } = useAISearch();
  const { user } = useAuth();
  const { groups } = useSupplierGroups();
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

  // Servicios deseados
  const [wantedServices, setWantedServices] = useState([]);
  const [showWantedModal, setShowWantedModal] = useState(false);

  const normalizedWanted = useMemo(() => {
    return (wantedServices || [])
      .map((s) => (typeof s === 'string' ? { id: s, name: s } : s))
      .filter((s) => s && (s.name || s.id));
  }, [wantedServices]);

  // Cargar proveedores
  useEffect(() => { if (user) loadProviders(); }, [user, loadProviders]);

  // Cargar servicios deseados por boda
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadData('wantedServices', { docPath: activeWedding ? `weddings/${activeWedding}` : undefined, fallbackToLocal: true });
        if (!cancelled && Array.isArray(data)) setWantedServices(data);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [activeWedding]);

  const saveWanted = async (list) => {
    setWantedServices(list);
    try { await saveData('wantedServices', list, { docPath: activeWedding ? `weddings/${activeWedding}` : undefined, showNotification: false }); } catch {}
    setShowWantedModal(false);
  };

  const missingServices = useMemo(() => {
    const confirmed = new Set(
      (providers || [])
        .filter((p) => ['Confirmado','Seleccionado'].includes(p.status))
        .map((p) => p.service)
        .filter(Boolean)
    );
    return normalizedWanted.filter((s) => !confirmed.has(s.name || s.id));
  }, [providers, normalizedWanted]);

  // Handlers
  const handleViewDetail = (provider) => { setSelectedProvider(provider); setActiveTab('info'); };
  const handleNewProvider = () => setShowNewProviderForm(true);
  const handleEditProvider = () => setShowEditProviderForm(true);
  const handleReserveProvider = (provider) => { setSelectedProvider(provider); setShowReservationModal(true); };
  const handleCloseDetail = () => setSelectedProvider(null);
  const handleOpenAISearch = () => setShowAISearchModal(true);

  const handleAISelect = (provider, action) => {
    if (action === 'view') { setSelectedProvider(provider); setShowAISearchModal(false); }
    else if (action === 'add') { addProvider(provider); setShowAISearchModal(false); }
    else if (action === 'select') { addProvider({ ...provider, status: 'Seleccionado' }); setShowAISearchModal(false); }
    else if (action === 'email') { setAiSelectedResult(provider); setShowAIEmailModal(true); }
  };

  const handleSubmitProvider = async (providerData) => {
    if (showEditProviderForm && selectedProvider) { await updateProvider(selectedProvider.id, providerData); setShowEditProviderForm(false); }
    else { await addProvider(providerData); setShowNewProviderForm(false); }
  };

  const handleSubmitReservation = async (reservationData) => {
    if (selectedProvider && !['Confirmado','Seleccionado'].includes(selectedProvider.status)) {
      await addReservation(selectedProvider.id, reservationData);
      await updateProvider(selectedProvider.id, { ...selectedProvider, status: 'Contactado', date: reservationData.date });
    }
    setShowReservationModal(false);
  };

  return (      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestión de Proveedores</h1>
          <div className="flex space-x-2">
            <Button onClick={()=>setShowWantedModal(true)} className="flex items-center" variant="outline">Configurar servicios</Button>
            <Button onClick={handleOpenAISearch} className="flex items-center"><Sparkles size={16} className="mr-1" /> Búsqueda IA</Button>
            <Button onClick={handleNewProvider} className="flex items-center"><Plus size={16} className="mr-1" /> Nuevo Proveedor</Button>
          </div>
        </div>

        {error && (<Card className="mb-6 bg-red-50 border border-red-200"><p className="text-red-700">{error}</p></Card>)}

        {loading ? (
          <Card className="p-8 text-center"><p className="text-gray-500">Cargando proveedores...</p></Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* Placeholders de servicios faltantes */}
            {missingServices.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {missingServices.map((s) => (
                  <Card key={s.id || s.name} className="opacity-60 border-dashed">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">{s.name || s.id}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">Pendiente</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Aún no hay proveedor confirmado para este servicio.</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setServiceFilter(s.name || s.id); setShowAISearchModal(true); }}>Buscar con IA</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Lista de proveedores con filtros */}
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
              tab={tab}
              setTab={setTab}
              selected={selectedProviderIds}
              toggleSelect={toggleSelectProvider}
              toggleFavorite={toggleFavoriteProvider}
            />
          </div>
        )}

        {/* Modales */}
        {showNewProviderForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <ProveedorForm onSubmit={handleSubmitProvider} onCancel={() => setShowNewProviderForm(false)} />
          </div>
        )}

        {showEditProviderForm && selectedProvider && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <ProveedorForm initialData={selectedProvider} onSubmit={handleSubmitProvider} onCancel={() => setShowEditProviderForm(false)} />
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
            onClose={() => { setShowAIEmailModal(false); setAiSelectedResult(null); }}
            aiResult={aiSelectedResult}
            searchQuery={aiLastQuery || ''}
          />
        )}

        <BulkStatusModal
          open={showBulkStatus}
          onClose={()=>setShowBulkStatus(false)}
          onApply={async (newStatus) => {
            for (const pid of selectedProviderIds) {
              const p = providers.find(x => x.id === pid);
              if (!p) continue;
              await updateProvider(pid, { ...p, status: newStatus });
            }
          }}
        />

        <DuplicateDetectorModal
          open={showDupModal}
          onClose={()=>setShowDupModal(false)}
          providers={providers}
          onMerge={async (group, primaryId) => {
            if (!Array.isArray(group) || group.length < 2) return;
            const primary = group.find(x => x.id === primaryId) || group[0];
            const others = group.filter(x => x.id !== primary.id);
            const aliases = Array.from(new Set([...(primary.aliases||[]), ...others.map(o=>o.email).filter(Boolean)]));
            await updateProvider(primary.id, { ...primary, aliases });
            for (const o of others) { await deleteProvider(o.id); }
          }}
        />

        {showReservationModal && selectedProvider && (
          <ReservationModal provider={selectedProvider} onClose={() => setShowReservationModal(false)} onSubmit={handleSubmitReservation} />
        )}

        {showTrackingModal && (
          <TrackingModal isOpen={showTrackingModal} onClose={() => setShowTrackingModal(false)} trackingItem={null} />
        )}

        <WantedServicesModal open={showWantedModal} onClose={()=>setShowWantedModal(false)} value={wantedServices} onSave={saveWanted} />
      </div>);
};

export default Proveedores;


