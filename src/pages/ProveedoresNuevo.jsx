import React, { useState, useEffect } from 'react';

import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Plus, Sparkles } from 'lucide-react';

// Importar componentes modulares
import ProveedorList from '../components/proveedores/ProveedorList';
import ProveedorCard from '../components/proveedores/ProveedorCard';
import ProveedorForm from '../components/proveedores/ProveedorForm';
import ReservationModal from '../components/proveedores/ReservationModal';
import AISearchModal from '../components/proveedores/ai/AISearchModal';
import AIEmailModal from '../components/proveedores/ai/AIEmailModal';

import TrackingModal from '../components/proveedores/tracking/TrackingModal';
import useSupplierGroups from '../hooks/useSupplierGroups';
import BulkStatusModal from '../components/proveedores/BulkStatusModal';
import DuplicateDetectorModal from '../components/proveedores/DuplicateDetectorModal';

// Importar hooks personalizados
import useProveedores from '../hooks/useProveedores';
import useAISearch from '../hooks/useAISearch';
import { useAuth } from '../hooks/useAuth';

const Proveedores = () => {
  // Diagnóstico: verificar que la versión nueva se carga en el navegador
  console.log('%c[Lovenda] ProveedoresNuevo cargado', 'color: #10B981; font-weight: bold;');
  // Obtener funcionalidad de los hooks personalizados
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
    clearFilters
  } = useProveedores();

  const {
    results: aiResults,
    loading: aiLoading,
    lastQuery: aiLastQuery,
    searchProviders,
    clearResults
  } = useAISearch();

  const { user } = useAuth();
  const { groups } = useSupplierGroups();

  // Estado local para modales y pestañas
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
  const [currentTrackingItem, setCurrentTrackingItem] = useState(null);
  const [trackingFilter, setTrackingFilter] = useState('todos');
  const [highlightGroupId, setHighlightGroupId] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      loadProviders();
    }
  }, [user, loadProviders]);

  // Funciones para manejar la visualización de modales
  const handleViewDetail = (provider) => {
    setSelectedProvider(provider);
    setActiveTab('info');
  };

  const handleNewProvider = () => {
    setShowNewProviderForm(true);
  };

  const handleEditProvider = () => {
    setShowEditProviderForm(true);
  };

  const handleReserveProvider = (provider) => {
    setSelectedProvider(provider);
    setShowReservationModal(true);
  };

  const handleCloseDetail = () => {
    setSelectedProvider(null);
  };

  const handleOpenAISearch = () => {
    setShowAISearchModal(true);
  };

  const handleAISelect = (provider, action) => {
    if (action === 'view') {
      setSelectedProvider(provider);
      setShowAISearchModal(false);
    } else if (action === 'add') {
      addProvider(provider);
      setShowAISearchModal(false);
    } else if (action === 'select') {
      addProvider({...provider, status: 'Seleccionado'});
      setShowAISearchModal(false);
    } else if (action === 'email') {
      setAiSelectedResult(provider);
      setShowAIEmailModal(true);
    }
  };

  const handleSubmitProvider = async (providerData) => {
    if (showEditProviderForm && selectedProvider) {
      await updateProvider(selectedProvider.id, providerData);
      setShowEditProviderForm(false);
    } else {
      await addProvider(providerData);
      setShowNewProviderForm(false);
    }
  };

  const handleDeleteProvider = async (providerId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
      await deleteProvider(providerId);
    }
  };

  const handleSubmitReservation = async (reservationData) => {
    // En una implementación real, esto guardaría la reserva en la base de datos
    console.log('Reserva creada:', reservationData);
    // Actualizar el estado del proveedor a 'Contactado' si no está ya confirmado/seleccionado
    if (selectedProvider && 
        selectedProvider.status !== 'Confirmado' && 
        selectedProvider.status !== 'Seleccionado') {
      // Guardar reserva en Firestore y estado local
      await addReservation(selectedProvider.id, reservationData);

      await updateProvider(selectedProvider.id, { 
        ...selectedProvider, 
        status: 'Contactado',
        date: reservationData.date
      });
    }
    setShowReservationModal(false);
  };

  const handleViewTrackingDetails = (trackingItem) => {
    setCurrentTrackingItem(trackingItem);
    setShowTrackingModal(true);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestión de Proveedores</h1>
          
          <div className="flex space-x-2">
            <Button onClick={handleOpenAISearch} className="flex items-center">
              <Sparkles size={16} className="mr-1" /> Búsqueda IA
            </Button>
            <Button onClick={handleNewProvider} className="flex items-center">
              <Plus size={16} className="mr-1" /> Nuevo Proveedor
            </Button>
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
              highlightGroupId={highlightGroupId}
              selected={selectedProviderIds}
              toggleSelect={toggleSelectProvider}
              toggleFavorite={toggleFavoriteProvider}
            />

            {/* Acciones con proveedores seleccionados */}
            {selectedProviderIds.length > 0 && (
              <Card className="bg-blue-50 border border-blue-100">
                <div className="flex justify-between items-center">
                  <p className="text-blue-800">
                    {selectedProviderIds.length} {selectedProviderIds.length === 1 ? 'proveedor seleccionado' : 'proveedores seleccionados'}
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={clearSelection}>
                      Deseleccionar todo
                    </Button>
                    <Button size="sm" onClick={()=>setShowBulkStatus(true)}>Cambiar estado</Button>
                    <Button size="sm" variant="outline" onClick={()=>setShowDupModal(true)}>Duplicados</Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Vista detallada simple (temporal) */}
        {selectedProvider && (
          <Card className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">{selectedProvider.name}</h2>
              <Button variant="outline" onClick={handleCloseDetail}>Cerrar</Button>
            </div>
            <div className="space-y-1 text-sm text-gray-700">
              {selectedProvider.service && <p><strong>Servicio:</strong> {selectedProvider.service}</p>}
              {selectedProvider.email && <p><strong>Email:</strong> {selectedProvider.email}</p>}
              {selectedProvider.phone && <p><strong>Teléfono:</strong> {selectedProvider.phone}</p>}
              {selectedProvider.snippet && <p className="text-gray-600">{selectedProvider.snippet}</p>}
            </div>
          </Card>
        )}

        {/* Modal para añadir nuevo proveedor */}
        {showNewProviderForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <ProveedorForm
              onSubmit={handleSubmitProvider}
              onCancel={() => setShowNewProviderForm(false)}
            />
          </div>
        )}

        {/* Modal para editar proveedor */}
        {showEditProviderForm && selectedProvider && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <ProveedorForm
              initialData={selectedProvider}
              onSubmit={handleSubmitProvider}
              onCancel={() => setShowEditProviderForm(false)}
            />
          </div>
        )}

        {/* Modal de búsqueda con IA */}
        <AISearchModal
          isOpen={showAISearchModal}
          onClose={() => setShowAISearchModal(false)}
          onSearch={searchProviders}
          onSelect={handleAISelect}
          isLoading={aiLoading}
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
            // No limpiamos la selección automáticamente
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
            for (const o of others) {
              await deleteProvider(o.id);
            }
          }}
        />

        {/* Modal de reserva */}
        {showReservationModal && selectedProvider && (
          <ReservationModal
            provider={selectedProvider}
            onClose={() => setShowReservationModal(false)}
            onSubmit={handleSubmitReservation}
          />
        )}

        {/* Modal de seguimiento */}
        {showTrackingModal && currentTrackingItem && (
          <TrackingModal
            isOpen={showTrackingModal}
            onClose={() => setShowTrackingModal(false)}
            trackingItem={currentTrackingItem}
          />
        )}

        {/* Proveedores seleccionados */}
        {selectedProviderIds.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">Proveedores seleccionados</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {selectedProviderIds.map(pid => {
                const provider = providers.find(p => p.id === pid);
                if(!provider) return null;
                // inyectar nombre de grupo si está en grupos
                let groupName = provider.groupName;
                if (!groupName && Array.isArray(groups)) {
                  for (const g of groups) {
                    if (Array.isArray(g.memberIds) && g.memberIds.includes(pid)) {
                      groupName = g.name || '';
                      break;
                    }
                  }
                }
                return (
                  <ProveedorCard
                    key={pid}
                    provider={{ ...provider, groupName }}
                    isSelected={true}
                    onToggleSelect={() => toggleSelectProvider(pid)}
                    onViewDetail={() => handleViewDetail(provider)}
                    onToggleFavorite={toggleFavoriteProvider}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Proveedores;





