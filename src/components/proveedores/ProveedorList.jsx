import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCcw } from 'lucide-react';
import ProveedorCard from './ProveedorCard';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import useSupplierGroups from '../../hooks/useSupplierGroups';
import GroupCreateModal from './GroupCreateModal';
import ProveedorGroupCard from './ProveedorGroupCard';
import GroupSuggestions from './GroupSuggestions';
import useGroupBudgets from '../../hooks/useGroupBudgets';
import RFQModal from './RFQModal';
import CompareSelectedModal from './CompareSelectedModal';
import FilterPresets from './FilterPresets';

/**
 * @typedef {import('../../hooks/useProveedores').Provider} Provider
 */

/**
 * Componente que muestra la lista de proveedores con filtros y opciones de búsqueda.
 * Permite filtrar por servicio, estado y rango de fechas, así como buscar por término.
 * También proporciona navegación por pestañas para ver diferentes grupos de proveedores.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Provider[]} props.providers - Lista de proveedores a mostrar
 * @param {string} props.searchTerm - Término de búsqueda actual
 * @param {Function} props.setSearchTerm - Función para actualizar el término de búsqueda
 * @param {string} props.serviceFilter - Filtro actual por servicio
 * @param {Function} props.setServiceFilter - Función para actualizar el filtro por servicio
 * @param {string} props.statusFilter - Filtro actual por estado
 * @param {Function} props.setStatusFilter - Función para actualizar el filtro por estado
 * @param {string} props.dateFrom - Fecha inicial para filtro por rango
 * @param {Function} props.setDateFrom - Función para actualizar la fecha inicial
 * @param {string} props.dateTo - Fecha final para filtro por rango
 * @param {Function} props.setDateTo - Función para actualizar la fecha final
 * @param {Function} props.clearFilters - Función para limpiar todos los filtros
 * @param {Function} props.handleViewDetail - Función para ver detalles de un proveedor
 * @param {string} props.tab - Pestaña actual ('all', 'selected', 'contacted')
 * @param {Function} props.setTab - Función para cambiar la pestaña
 * @param {string[]} props.selected - IDs de proveedores seleccionados
 * @param {number} props.ratingMin - Rating mínimo seleccionado
 * @param {Function} props.setRatingMin - Setter del rating mínimo
 * @param {Function} props.toggleSelect - Función para alternar selección de proveedor
 * @returns {React.ReactElement} Componente de lista de proveedores con filtros
 */
const ProveedorList = ({ 
  providers, 
  searchTerm, 
  setSearchTerm,
  serviceFilter, 
  setServiceFilter, 
  statusFilter, 
  setStatusFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  clearFilters,
  handleViewDetail,
  tab,
  setTab,
  highlightGroupId,
  selected,
  toggleFavorite,
  ratingMin,
  setRatingMin,
  toggleSelect
}) => {
  // Lista de servicios únicos para el filtro usando useMemo para evitar cálculos innecesarios
  const uniqueServices = useMemo(() => {
    return [...new Set(providers.map(p => p.service))].filter(Boolean);
  }, [providers]);
  
  // Lista de estados únicos para el filtro usando useMemo
  const uniqueStatuses = useMemo(() => {
    return [...new Set(providers.map(p => p.status))].filter(Boolean);
  }, [providers]);
  
  // Filtrado de proveedores usando useMemo para mejorar rendimiento
  const filteredProviders = useMemo(() => {
    return providers
      .filter(p => {
        // Filtrar por término de búsqueda
        if (searchTerm && !p.name?.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !p.service?.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !p.contact?.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !p.status?.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        // Filtrar por servicio
        if (serviceFilter && p.service !== serviceFilter) {
          return false;
        }
        
        // Filtrar por estado
        if (statusFilter && p.status !== statusFilter) {
          return false;
        }
        
        // Filtrar por fecha desde
        if (dateFrom && new Date(p.date) < new Date(dateFrom)) {
          return false;
        }
        
        // Filtrar por fecha hasta
        if (dateTo && new Date(p.date) > new Date(dateTo)) {
          return false;
        }
        
        // Filtrado por pestaña
        if (tab === 'selected' && !selected.includes(p.id)) {
          return false;
        }
        
        if (tab === 'contacted' && p.status !== 'Contactado' && p.status !== 'Confirmado' && p.status !== 'Seleccionado') {
          return false;
        }
        
        return true;
      });
  }, [providers, searchTerm, serviceFilter, statusFilter, dateFrom, dateTo, tab, selected]);

  const navigate = useNavigate();

  // Grupos manuales: unificar/separar tarjetas
  const { groups, loading: loadingGroups, dissolveGroup, createGroup } = useSupplierGroups();
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showSelectedSug, setShowSelectedSug] = useState(false);
  const [hideGrouped, setHideGrouped] = useState(false);
  const [highlightedGroupId, setHighlightedGroupId] = useState(null);
  const [openRFQ, setOpenRFQ] = useState(false);
  const [openCompare, setOpenCompare] = useState(false);
  const [portalOnly, setPortalOnly] = useState(false);

  const groupMemberIds = useMemo(() => {
    const set = new Set();
    (groups || []).forEach((g) => (g.memberIds || []).forEach((id) => set.add(id)));
    return set;
  }, [groups]);

  const groupNameByMemberId = useMemo(() => {
    const map = new Map();
    (groups || []).forEach((g) => (g.memberIds || []).forEach((id) => map.set(id, g.name || '')));
    return map;
  }, [groups]);

  const providersToShow = useMemo(() => {
    let list = filteredProviders;
    if (hideGrouped) list = list.filter((p) => !groupMemberIds.has(p.id));
    if (portalOnly) {
      list = list.filter((p) => p.portalLastSubmitAt || p.portalAvailability);
    }
    return list;
  }, [filteredProviders, hideGrouped, portalOnly, groupMemberIds]);

  const visibleGroups = useMemo(() => {
    const idsInList = new Set(filteredProviders.map((p) => p.id));
    return (groups || []).filter((g) => (g.memberIds || []).some((id) => idsInList.has(id)));
  }, [groups, filteredProviders]);

  const handleCreateGroup = async ({ name, notes }) => {
    const toGroup = selected.filter(Boolean);
    if (toGroup.length < 2) return;
    const res = await createGroup({ name, notes, memberIds: toGroup });
    if (res?.success) {
      setShowGroupModal(false);
      // limpiar selección tras agrupar
      toGroup.forEach((id) => toggleSelect(id));
    }
  };

  // Sugerencias para la selección actual (sin necesidad de crear grupo)
  const selectedProviders = useMemo(() => providers.filter((p) => selected.includes(p.id)), [providers, selected]);
  const { budgetsBySupplier: selectedBudgets } = useGroupBudgets(selected);
  const portalCount = useMemo(() => (providers || []).filter((p) => p.portalLastSubmitAt || p.portalAvailability).length, [providers]);

  // Efecto: resaltar y hacer scroll al grupo
  React.useEffect(() => {
    if (tab !== 'groups' || !highlightGroupId) return;
    setHighlightedGroupId(highlightGroupId);
  }, [tab, highlightGroupId]);

  React.useEffect(() => {
    if (tab !== 'groups' || !highlightedGroupId) return;
    const id = `group-${highlightedGroupId}`;
    const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const t = setTimeout(() => setHighlightedGroupId(null), 3000);
    return () => clearTimeout(t);
  }, [tab, highlightedGroupId, visibleGroups]);

  const handleCreateContract = (provider) => {
    const title = `Contrato Proveedor - ${provider?.name || 'Proveedor'}`;
    navigate('/protocolo/documentos', {
      state: {
        prefill: {
          type: 'provider_contract',
          title,
          providerName: provider?.name || '',
          service: provider?.service || '',
          eventDate: provider?.date || '',
          amount: provider?.priceRange || '',
          region: 'ES',
        }
      }
    });
  };

  return (
    <div className="w-full">
      <Card className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Filtros</h2>
          <span className="text-sm text-gray-600">Respuestas portal: {portalCount}</span>
        </div>
        <div className="mb-4">
          <FilterPresets
            filters={{ searchTerm, serviceFilter, statusFilter, dateFrom, dateTo, ratingMin, tab, hideGrouped }}
            applyFilters={(f) => {
              setSearchTerm(f.searchTerm || '');
              setServiceFilter(f.serviceFilter || '');
              setStatusFilter(f.statusFilter || '');
              setDateFrom(f.dateFrom || '');
              setDateTo(f.dateTo || '');
              setRatingMin(typeof f.ratingMin === 'number' ? f.ratingMin : 0);
              setTab(f.tab || 'all');
              setHideGrouped(!!f.hideGrouped);
            }}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Búsqueda por texto */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar proveedores..."
              className="w-full p-2 pl-10 border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          </div>
          
          {/* Filtro por servicio */}
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={serviceFilter}
            onChange={e => setServiceFilter(e.target.value)}
          >
            <option value="">Todos los servicios</option>
            {uniqueServices.map(service => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>
          
          {/* Filtro por rating */}
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={ratingMin}
            onChange={e => setRatingMin(Number(e.target.value))}
          >
            <option value={0}>Rating mínimo</option>
            {[1,2,3,4,5].map(r => (
              <option key={r} value={r}>{r}+</option>
            ))}
          </select>

          {/* Filtro por estado */}
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        
        {/* Filtros por fecha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Desde fecha:</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Hasta fecha:</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
        </div>
        
        {/* Botones de acción para filtros */}
        <div className="flex justify-between items-center space-x-2">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={hideGrouped}
                onChange={(e) => setHideGrouped(e.target.checked)}
              />
              Ocultar agrupados
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={portalOnly}
                onChange={(e) => setPortalOnly(e.target.checked)}
              />
              Solo respuestas portal
            </label>
            {selected.length > 0 ? `${selected.length} seleccionado(s)` : 'Sin selecciones'}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowGroupModal(true)}
              variant="primary"
              size="sm"
              disabled={selected.length < 2}
            >
              Unificar seleccionados
            </Button>
            <Button
              onClick={() => setOpenCompare(true)}
              variant="outline"
              size="sm"
              disabled={selected.length < 1}
            >
              Comparar
            </Button>
            <Button
              onClick={() => setOpenRFQ(true)}
              variant="outline"
              size="sm"
              disabled={selected.length < 1}
            >
              Solicitar presupuesto
            </Button>
            <Button
              onClick={() => setShowSelectedSug(true)}
              variant="outline"
              size="sm"
              disabled={selected.length < 1}
            >
              Sugerencias
            </Button>
            <Button onClick={clearFilters} variant="outline" size="sm">
              <RefreshCcw size={16} className="mr-1" /> Limpiar filtros
            </Button>
          </div>
        </div>
      </Card>
 
      {tab === 'groups' && visibleGroups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {visibleGroups.map((g) => (
            <div key={g.id} id={`group-${g.id}`}>
              <ProveedorGroupCard
                group={g}
                providers={filteredProviders}
                onDissolve={async (gid) => await dissolveGroup(gid)}
                onViewMember={(p) => handleViewDetail?.(p)}
                highlighted={g.id === highlightedGroupId}
              />
            </div>
          ))}
        </div>
      )}
      {tab === 'groups' && visibleGroups.length === 0 && (
        <div className="col-span-full text-center py-8 text-gray-500">
          No hay grupos. Selecciona 2+ proveedores y pulsa "Unificar seleccionados".
        </div>
      )}

      {/* Selector de pestaña */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`py-2 px-4 ${tab === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setTab('all')}
        >
          Todos
        </button>
        <button
          className={`py-2 px-4 ${tab === 'reserved' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setTab('reserved')}
        >
          Reservas
        </button>
        <button
          className={`py-2 px-4 ${tab === 'favorite' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setTab('favorite')}
        >
          Favoritos
        </button>
        <button
          className={`py-2 px-4 ${tab === 'groups' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setTab('groups')}
        >
          Grupos
        </button>
      </div>

      {/* Lista de proveedores */}
      {tab !== 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providersToShow.length > 0 ? (
            providersToShow.map(provider => (
              <ProveedorCard
                key={provider.id}
                provider={{ ...provider, groupName: provider.groupName ?? groupNameByMemberId.get(provider.id) }}
                isSelected={selected.includes(provider.id)}
                onToggleSelect={() => toggleSelect(provider.id)}
                onViewDetail={() => handleViewDetail(provider)}
                onToggleFavorite={toggleFavorite}
                onCreateContract={handleCreateContract}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              No hay proveedores que coincidan con los filtros aplicados.
            </div>
          )}
        </div>
      )}
      <GroupCreateModal
        open={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onConfirm={handleCreateGroup}
      />
      <GroupSuggestions
        open={showSelectedSug}
        onClose={() => setShowSelectedSug(false)}
        group={{ id: 'selected', name: 'Selección actual', memberIds: selected }}
        providers={selectedProviders}
        budgetsBySupplier={selectedBudgets}
      />      <RFQModal
        open={openRFQ}
        onClose={() => setOpenRFQ(false)}
        providers={selectedProviders}
      />
      <CompareSelectedModal
        open={openCompare}
        onClose={() => setOpenCompare(false)}
        providers={selectedProviders}
      />
    </div>
  );
};

export default ProveedorList;




