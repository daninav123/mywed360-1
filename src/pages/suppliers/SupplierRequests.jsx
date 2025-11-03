import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox,
  Search,
  Filter,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  Circle,
  Archive,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'react-toastify';
import useTranslations from '../../hooks/useTranslations';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todas', icon: Inbox },
  { value: 'new', label: 'Nuevas', icon: Circle },
  { value: 'viewed', label: 'Vistas', icon: Eye },
  { value: 'contacted', label: 'Contactadas', icon: CheckCircle },
  { value: 'archived', label: 'Archivadas', icon: Archive },
];

export default function SupplierRequests() {
  const navigate = useNavigate();
  const { t } = useTranslations();
  const tRef = useRef(t);
  tRef.current = t;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 10;

  // Cargar solicitudes
  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('supplier_token');
      const supplierId = localStorage.getItem('supplier_id');

      if (!token || !supplierId) {
        navigate('/supplier/login');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/supplier-requests/${supplierId}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('supplier_token');
          localStorage.removeItem('supplier_id');
          navigate('/supplier/login');
          return;
        }
        throw new Error('load_error');
      }

      const data = await response.json();
      setRequests(data.data || []);

      // Calcular total de páginas
      const total = data.pagination?.total || 0;
      setTotalPages(Math.ceil(total / itemsPerPage) || 1);
    } catch (error) {
      console.error('[SupplierRequests] Error loading:', error);
      toast.error(tRef.current('suppliers.requests.errors.loadError'));
    } finally {
      setLoading(false);
    }
  }, [navigate, currentPage, statusFilter]);

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter]);

  // Actualizar estado de solicitud
  const updateRequestStatus = useCallback(
    async (requestId, newStatus) => {
      try {
        const token = localStorage.getItem('supplier_token');
        const supplierId = localStorage.getItem('supplier_id');

        const response = await fetch(`/api/supplier-requests/${supplierId}/${requestId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) throw new Error('update_error');

        toast.success(tRef.current('suppliers.requests.success.statusUpdated'));
        loadRequests();
      } catch (error) {
        console.error('[SupplierRequests] Error updating:', error);
        toast.error(tRef.current('suppliers.requests.errors.updateError'));
      }
    },
    [loadRequests]
  );

  // Filtrar por búsqueda
  const filteredRequests = useMemo(() => {
    if (!searchTerm) return requests;

    const term = searchTerm.toLowerCase();
    return requests.filter(
      (req) =>
        req.coupleName?.toLowerCase().includes(term) ||
        req.contactEmail?.toLowerCase().includes(term) ||
        req.message?.toLowerCase().includes(term)
    );
  }, [requests, searchTerm]);

  // Formatear fecha
  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return 'Sin fecha';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return 'Fecha inválida';
    }
  }, []);

  // Obtener badge de estado
  const getStatusBadge = useCallback((status) => {
    const badges = {
      new: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Nueva' },
      viewed: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Vista' },
      contacted: { bg: 'bg-green-100', text: 'text-green-800', label: 'Contactada' },
      responded: { bg: 'bg-green-100', text: 'text-green-800', label: 'Respondida' },
      archived: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Archivada' },
    };

    const badge = badges[status] || badges.new;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  }, []);

  // Renderizar card de solicitud
  const renderRequestCard = useCallback(
    (request) => (
      <div
        key={request.id}
        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{request.coupleName}</h3>
              {getStatusBadge(request.status)}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {formatDate(request.receivedAt)}
              </span>
              {request.urgency === 'urgent' && (
                <span className="flex items-center gap-1 text-red-600 font-medium">⚠️ Urgente</span>
              )}
            </div>
          </div>
        </div>

        {/* Detalles de la boda */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
          {request.weddingDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={16} className="text-gray-500" />
              <span className="text-gray-700">
                <strong>Fecha:</strong> {new Date(request.weddingDate).toLocaleDateString('es-ES')}
              </span>
            </div>
          )}
          {request.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={16} className="text-gray-500" />
              <span className="text-gray-700">
                <strong>Lugar:</strong> {request.location}
              </span>
            </div>
          )}
          {request.guestCount && (
            <div className="flex items-center gap-2 text-sm">
              <Users size={16} className="text-gray-500" />
              <span className="text-gray-700">
                <strong>Invitados:</strong> {request.guestCount}
              </span>
            </div>
          )}
          {request.budget && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign size={16} className="text-gray-500" />
              <span className="text-gray-700">
                <strong>Presupuesto:</strong> {request.budget}
              </span>
            </div>
          )}
        </div>

        {/* Mensaje */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-2">{request.message}</p>
        </div>

        {/* Contacto */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-700">
          <a
            href={`mailto:${request.contactEmail}`}
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
          >
            <Mail size={14} />
            {request.contactEmail}
          </a>
          {request.contactPhone && (
            <a
              href={`tel:${request.contactPhone}`}
              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
            >
              <Phone size={14} />
              {request.contactPhone}
            </a>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          {request.status === 'new' && (
            <button
              onClick={() => updateRequestStatus(request.id, 'contacted')}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <CheckCircle size={16} className="inline mr-1" />
              Marcar Contactada
            </button>
          )}
          {request.status === 'contacted' && (
            <button
              onClick={() => updateRequestStatus(request.id, 'archived')}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <Archive size={16} className="inline mr-1" />
              Archivar
            </button>
          )}
          {request.status === 'archived' && (
            <button
              onClick={() => updateRequestStatus(request.id, 'new')}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Circle size={16} className="inline mr-1" />
              Marcar Nueva
            </button>
          )}
          <a
            href={`mailto:${request.contactEmail}?subject=Re: Solicitud de presupuesto`}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium text-center"
          >
            <Mail size={16} className="inline mr-1" />
            Responder
          </a>
        </div>
      </div>
    ),
    [formatDate, getStatusBadge, updateRequestStatus]
  );

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Inbox className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Solicitudes Recibidas</h1>
            </div>
            <p className="text-indigo-100">
              Gestiona las solicitudes de presupuesto de tus clientes potenciales
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{requests.length}</div>
            <div className="text-indigo-100 text-sm">Solicitudes</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar por nombre, email o mensaje..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filtro de estado */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de solicitudes */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
          <Inbox className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm
              ? 'No se encontraron solicitudes'
              : statusFilter === 'all'
                ? 'Aún no tienes solicitudes'
                : 'No hay solicitudes con este filtro'}
          </h3>
          <p className="text-gray-600">
            {searchTerm
              ? 'Intenta con otros términos de búsqueda'
              : 'Las solicitudes de clientes potenciales aparecerán aquí'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {filteredRequests.map((request) => renderRequestCard(request))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
                Anterior
              </button>
              <span className="text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
