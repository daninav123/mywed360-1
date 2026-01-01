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
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'react-toastify';
import useTranslations from '../../hooks/useTranslations';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todas', icon: Inbox },
  { value: 'pending', label: 'Pendientes', icon: Circle },
  { value: 'contacted', label: 'Contactadas', icon: CheckCircle },
  { value: 'quoted', label: 'Cotizadas', icon: Eye },
  { value: 'accepted', label: 'Aceptadas', icon: CheckCircle },
  { value: 'rejected', label: 'Rechazadas', icon: Archive },
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

      // Usar el endpoint correcto que lee de suppliers/{id}/quote-requests
      const response = await fetch(
        `/api/suppliers/${supplierId}/quote-requests?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-supplier-id': supplierId, // Header requerido por el endpoint
          },
        }
      );

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

      // Transformar datos del formato V2 al formato que espera el panel
      const transformedRequests = (data.requests || []).map((req) => ({
        id: req.id,
        coupleName: req.contacto?.nombre || 'Sin nombre',
        contactEmail: req.contacto?.email || '',
        contactPhone: req.contacto?.telefono || '',
        message: req.customMessage || '',
        weddingDate: req.weddingInfo?.fecha || null,
        guestCount: req.weddingInfo?.numeroInvitados || null,
        budget: req.weddingInfo?.presupuestoTotal || null,
        location: req.weddingInfo?.ciudad || null,
        services: [req.supplierCategoryName || req.supplierCategory || 'Servicio'],
        status: req.status || 'pending',
        receivedAt: req.createdAt,
        viewedAt: req.viewedAt,
        respondedAt: req.respondedAt,
        viewed: req.viewed || false,
        // Campos adicionales del sistema V2
        serviceDetails: req.serviceDetails || {},
        supplierCategory: req.supplierCategory,
        supplierCategoryName: req.supplierCategoryName,
      }));

      setRequests(transformedRequests);

      // Calcular total de páginas
      const total = data.total || transformedRequests.length;
      setTotalPages(Math.ceil(total / itemsPerPage) || 1);
    } catch (error) {
      // console.error('[SupplierRequests] Error loading:', error);
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

        // Usar el endpoint correcto
        const response = await fetch(
          `/api/suppliers/${supplierId}/quote-requests/${requestId}/status`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'x-supplier-id': supplierId,
            },
            body: JSON.stringify({ status: newStatus }),
          }
        );

        if (!response.ok) throw new Error('update_error');

        toast.success(tRef.current('suppliers.requests.success.statusUpdated'));
        loadRequests();
      } catch (error) {
        // console.error('[SupplierRequests] Error updating:', error);
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
      let date;

      // Manejar diferentes formatos de timestamp
      if (timestamp.toDate) {
        // Firestore Timestamp con método toDate()
        date = timestamp.toDate();
      } else if (timestamp._seconds) {
        // Firestore Timestamp serializado { _seconds, _nanoseconds }
        date = new Date(timestamp._seconds * 1000);
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        // ISO string o timestamp en milisegundos
        date = new Date(timestamp);
      } else {
        return 'Fecha inválida';
      }

      // Verificar que la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }

      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      // console.error('Error formateando fecha:', error, timestamp);
      return 'Fecha inválida';
    }
  }, []);

  // Obtener badge de estado
  const getStatusBadge = useCallback((status) => {
    const badges = {
      pending: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pendiente' },
      contacted: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Contactada' },
      quoted: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Cotizada' },
      accepted: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aceptada' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazada' },
    };

    const badge = badges[status] || badges.pending;
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
        className="group  border  rounded-xl p-6 hover:shadow-md hover:border-indigo-300 transition-all duration-300 transform hover:-translate-y-1" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5 pb-4 border-b border-gray-100">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-primary)] text-white font-bold text-sm shadow-lg">
                {request.coupleName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h3 className="text-xl font-bold  group-hover:text-indigo-600 transition-colors" style={{ color: 'var(--color-text)' }}>
                  {request.coupleName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={14} className="" style={{ color: 'var(--color-muted)' }} />
                  <span className="text-xs " style={{ color: 'var(--color-muted)' }}>{formatDate(request.receivedAt)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(request.status)}
            {request.urgency === 'urgent' && (
              <span className="animate-pulse flex items-center gap-1 text-xs  font-semibold bg-red-50 px-2 py-1 rounded-full" style={{ color: 'var(--color-danger)' }}>
                ⚠️ Urgente
              </span>
            )}
          </div>
        </div>

        {/* Detalles de la boda */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 p-5  border  rounded-xl" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
          {request.weddingDate && (
            <div className="flex items-center gap-3 p-2  rounded-lg shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-100">
                <Calendar size={18} className="text-pink-600" />
              </div>
              <div>
                <p className="text-xs  font-medium" style={{ color: 'var(--color-muted)' }}>Fecha de Boda</p>
                <p className="text-sm font-semibold " style={{ color: 'var(--color-text)' }}>
                  {new Date(request.weddingDate).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
          {request.location && (
            <div className="flex items-center gap-3 p-2  rounded-lg shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                <MapPin size={18} className="" style={{ color: 'var(--color-success)' }} />
              </div>
              <div>
                <p className="text-xs  font-medium" style={{ color: 'var(--color-muted)' }}>Ubicación</p>
                <p className="text-sm font-semibold " style={{ color: 'var(--color-text)' }}>{request.location}</p>
              </div>
            </div>
          )}
          {request.guestCount && (
            <div className="flex items-center gap-3 p-2  rounded-lg shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                <Users size={18} className="" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <p className="text-xs  font-medium" style={{ color: 'var(--color-muted)' }}>Invitados</p>
                <p className="text-sm font-semibold " style={{ color: 'var(--color-text)' }}>{request.guestCount} personas</p>
              </div>
            </div>
          )}
          {request.budget && (
            <div className="flex items-center gap-3 p-2  rounded-lg shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
                <DollarSign size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs  font-medium" style={{ color: 'var(--color-muted)' }}>Presupuesto</p>
                <p className="text-sm font-semibold " style={{ color: 'var(--color-text)' }}>{request.budget}€</p>
              </div>
            </div>
          )}
        </div>

        {/* Mensaje */}
        {request.message && (
          <div className="mb-5 p-4  bg-[var(--color-primary)]" style={{ backgroundColor: 'var(--color-surface)' }}>
            <p className="text-xs  font-semibold mb-1" style={{ color: 'var(--color-muted)' }}>💬 Mensaje del Cliente</p>
            <p className="text-sm  leading-relaxed" style={{ color: 'var(--color-text)' }}>
              {request.message.length > 150
                ? `${request.message.substring(0, 150)}...`
                : request.message}
            </p>
          </div>
        )}

        {/* Contacto */}
        <div className="flex flex-wrap gap-3 mb-5">
          <a
            href={`mailto:${request.contactEmail}`}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary)] transition-colors text-sm font-medium"
          >
            <Mail size={16} />
            <span className="text-sm">{request.contactEmail}</span>
          </a>
          {request.contactPhone && (
            <a
              href={`tel:${request.contactPhone}`}
              className="flex items-center gap-2 px-4 py-2  text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium" style={{ backgroundColor: 'var(--color-success)' }}
            >
              <Phone size={16} />
              <span className="text-sm">{request.contactPhone}</span>
            </a>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
          {request.status === 'pending' && (
            <>
              <button
                onClick={() => updateRequestStatus(request.id, 'contacted')}
                className="flex-1 min-w-[200px] px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary)] transition-all shadow-md hover:shadow-lg text-sm font-semibold transform hover:scale-105"
              >
                <CheckCircle size={18} className="inline mr-2" />
                Marcar como Contactada
              </button>
              <button
                onClick={() => updateRequestStatus(request.id, 'quoted')}
                className="flex-1 min-w-[200px] px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary)] transition-all shadow-md hover:shadow-lg text-sm font-semibold transform hover:scale-105"
              >
                <Eye size={18} className="inline mr-2" />
                Enviar Cotización
              </button>
            </>
          )}
          {request.status === 'contacted' && (
            <button
              onClick={() => updateRequestStatus(request.id, 'quoted')}
              className="flex-1 px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary)] transition-all shadow-md hover:shadow-lg text-sm font-semibold transform hover:scale-105"
            >
              <Eye size={18} className="inline mr-2" />
              Enviar Cotización
            </button>
          )}
          {(request.status === 'quoted' || request.status === 'accepted') && (
            <div className="flex-1 px-6 py-3 bg-green-100 text-green-800 rounded-lg text-sm font-semibold text-center border-2 border-green-200">
              ✅ Solicitud {request.status === 'accepted' ? 'Aceptada' : 'Cotizada'}
            </div>
          )}
          {request.status === 'archived' && (
            <button
              onClick={() => updateRequestStatus(request.id, 'new')}
              className="flex-1 px-4 py-2  text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium" style={{ backgroundColor: 'var(--color-primary)' }}
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
          <p className="" style={{ color: 'var(--color-text-secondary)' }}>Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[var(--color-primary)] text-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/supplier/dashboard/' + localStorage.getItem('supplier_id'))}
              className="p-2 hover:/10 rounded-lg transition-colors" style={{ backgroundColor: 'var(--color-surface)' }}
              title="Volver al dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Inbox className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Solicitudes Recibidas</h1>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('supplier_token');
              localStorage.removeItem('supplier_id');
              localStorage.removeItem('supplier_data');
              navigate('/supplier/login');
            }}
            className="flex items-center gap-2 px-4 py-2 /10 hover:bg-white/20 rounded-lg transition-colors" style={{ backgroundColor: 'var(--color-surface)' }}
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-indigo-100">
            Gestiona las solicitudes de presupuesto de tus clientes potenciales
          </p>
          <div className="text-right">
            <div className="text-4xl font-bold">{requests.length}</div>
            <div className="text-indigo-100 text-sm">Solicitudes</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className=" border  rounded-lg p-4" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 " style={{ color: 'var(--color-muted)' }}
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar por nombre, email o mensaje..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border  rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
            />
          </div>

          {/* Filtro de estado */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="" style={{ color: 'var(--color-muted)' }} />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 px-4 py-2 border  rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
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
        <div className="text-center py-16  border  rounded-lg" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
          <Inbox className="h-16 w-16  mx-auto mb-4" style={{ color: 'var(--color-muted)' }} />
          <h3 className="text-xl font-semibold  mb-2" style={{ color: 'var(--color-text)' }}>
            {searchTerm
              ? 'No se encontraron solicitudes'
              : statusFilter === 'all'
                ? 'Aún no tienes solicitudes'
                : 'No hay solicitudes con este filtro'}
          </h3>
          <p className="" style={{ color: 'var(--color-text-secondary)' }}>
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
            <div className="flex items-center justify-between  border  rounded-lg p-4" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 border  rounded-lg hover: disabled:opacity-50 disabled:cursor-not-allowed" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-bg)' }}
              >
                <ChevronLeft size={20} />
                Anterior
              </button>
              <span className="" style={{ color: 'var(--color-text)' }}>
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 border  rounded-lg hover: disabled:opacity-50 disabled:cursor-not-allowed" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-bg)' }}
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
