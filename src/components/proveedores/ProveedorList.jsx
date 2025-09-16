import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCcw } from 'lucide-react';
import ProveedorCard from './ProveedorCard';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

/**
 * @typedef {import('../../hooks/useProveedores').Provider} Provider
 */

/**
 * Lista de proveedores con filtros básicos y tabs.
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
  selected,
  toggleFavorite,
  ratingMin,
  setRatingMin,
  toggleSelect
}) => {
  // Servicios únicos
  const uniqueServices = useMemo(() => {
    return [...new Set(providers.map(p => p.service))].filter(Boolean);
  }, [providers]);

  // Estados únicos
  const uniqueStatuses = useMemo(() => {
    return [...new Set(providers.map(p => p.status))].filter(Boolean);
  }, [providers]);

  // Filtrado
  const filteredProviders = useMemo(() => {
    return providers
      .filter(p => {
        if (searchTerm && ![p.name, p.service, p.contact, p.status].some(v => v?.toLowerCase?.().includes(searchTerm.toLowerCase()))) {
          return false;
        }
        if (serviceFilter && p.service !== serviceFilter) return false;
        if (statusFilter && p.status !== statusFilter) return false;
        if (dateFrom && new Date(p.date) < new Date(dateFrom)) return false;
        if (dateTo && new Date(p.date) > new Date(dateTo)) return false;
        if (tab === 'selected' && !selected.includes(p.id)) return false;
        if (tab === 'contacted' && !['Contactado','Confirmado','Seleccionado'].includes(p.status)) return false;
        return true;
      });
  }, [providers, searchTerm, serviceFilter, statusFilter, dateFrom, dateTo, tab, selected]);

  const navigate = useNavigate();

  const handleCreateContract = (provider) => {
    const title = `Contrato Proveedor - ${provider?.name || 'Proveedor'}`;
    navigate('/protocolo/documentos-legales', {
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
        <h2 className="text-xl font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Búsqueda */}
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

          {/* Servicio */}
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

          {/* Rating mínimo */}
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

          {/* Estado */}
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

        {/* Fechas */}
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

        {/* Acciones */}
        <div className="flex justify-end space-x-2">
          <Button onClick={clearFilters} variant="outline" size="sm">
            <RefreshCcw size={16} className="mr-1" /> Limpiar filtros
          </Button>
        </div>
      </Card>

      {/* Tabs */}
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
      </div>

      {/* Lista */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProviders.length > 0 ? (
          filteredProviders.map(provider => (
            <ProveedorCard
              key={provider.id}
              provider={provider}
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
    </div>
  );
};

export default ProveedorList;

