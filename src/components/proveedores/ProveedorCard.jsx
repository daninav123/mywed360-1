import { Eye, Edit2, Trash2, Calendar, Star, MapPin, Users } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import AssignSupplierToGroupModal from './AssignSupplierToGroupModal';
import ProveedorDetail from './ProveedorDetail';
import ProviderEmailModal from './ProviderEmailModal';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import useSupplierBudgets from '../../hooks/useSupplierBudgets';
import * as EmailService from '../../services/emailService';
import { loadTrackingRecords } from '../../services/EmailTrackingService';

/**
 * @typedef {import('../../hooks/useProveedores').Provider} Provider
 */

/**
 * Componente que muestra la información de un proveedor en formato de tarjeta.
 * Incluye opciones para ver detalles, editar, eliminar y agendar una cita.
 *
 * @param {Object} props - Propiedades del componente
 * @param {Provider} props.provider - Daños del proveedor a mástrar
 * @param {boolean} props.isSelected - Indica si el proveedor está selecciónado
 * @param {Function} props.onToggleSelect - Función para alternar la selección del proveedor
 * @param {Function} props.onViewDetail - Función para ver detalles del proveedor
 * @param {Function} props.onEdit - Función para editar el proveedor
 * @param {Function} props.onDelete - Función para eliminar el proveedor
 * @param {Function} props.onReserve - Función para reservar una cita con el proveedor
 * @returns {React.ReactElement} Componente de tarjeta de proveedor
 */
const ProveedorCard = ({
  provider,
  isSelected,
  onToggleSelect,
  onViewDetail,
  onEdit,
  onDelete,
  onReserve,
  onToggleFavorite,
  onCreateContract,
  onShowTracking,
  onOpenGroups,
  budgetsOverride,
}) => {
  const [showDetail, setShowDetail] = useState(false);
  const [detailTab, setDetailTab] = useState('info');
  const [showEmail, setShowEmail] = useState(false);
  const [tracking, setTracking] = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [emails, setEmails] = useState([]);
  const [emailsOpen, setEmailsOpen] = useState(false);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const { budgets = [] } = useSupplierBudgets(provider?.id);
  const budgetsToUse = Array.isArray(budgetsOverride) ? budgetsOverride : budgets;
  const budgetInfo = useMemo(() => {
    try {
      const list = Array.isArray(budgetsToUse) ? budgetsToUse : [];
      if (!list.length) return null;
      const pendingCount = list.filter((b) => b.status === 'pending').length;
      const accepted = list.find((b) => b.status === 'accepted');
      const latest = list[0];
      return { pendingCount, accepted, latest };
    } catch {
      return null;
    }
  }, [budgetsToUse]);

  const refreshTracking = () => {
    try {
      const list = loadTrackingRecords();
      const rec = (Array.isArray(list) ? list : []).find(
        (r) =>
          r.providerEmail &&
          provider?.email &&
          r.providerEmail.toLowerCase() === provider.email.toLowerCase()
      );
      setTracking(rec || null);
    } catch {}
  };

  useEffect(() => {
    refreshTracking();
  }, [provider?.email]);

  // Cargar correos relacionados con este proveedor (por email o nombre)
  const fetchProviderEmails = async () => {
    if (!provider) return [];
    const term = provider.email || provider.name || '';
    if (!term) return [];
    try {
      setEmailsLoading(true);
      const results = await EmailService.searchEmails(term);
      return Array.isArray(results) ? results : [];
    } catch {
      return [];
    } finally {
      setEmailsLoading(false);
    }
  };

  const lastAgo = useMemo(() => {
    try {
      const d = tracking?.lastEmailDate ? new Date(tracking.lastEmailDate) : null;
      if (!d || isNaN(d.getTime())) return null;
      const diffMs = Date.now() - d.getTime();
      const sec = Math.floor(diffMs / 1000);
      const min = Math.floor(sec / 60);
      const hrs = Math.floor(min / 60);
      const days = Math.floor(hrs / 24);
      if (days > 0) return `hace ${days} día${days !== 1 ? 's' : ''}`;
      if (hrs > 0) return `hace ${hrs} h`;
      if (min > 0) return `hace ${min} min`;
      return 'justo ahora';
    } catch {
      return null;
    }
  }, [tracking?.lastEmailDate]);
  // Función para mástrar estrellas de calificación
  const renderRating = (rating, count) => {
    const stars = [];
    const actualRating = count > 0 ? rating / count : 0;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={`${i <= actualRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
        />
      );
    }

    return (
      <div className="flex itemás-center">
        {stars}
        {count > 0 && <span className="ml-1 text-xs text-gray-500">({count})</span>}
      </div>
    );
  };

  // Color según estado del proveedor
  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmado':
        return 'bg-green-100 text-green-800';
      case 'Contactado':
        return 'bg-blue-100 text-blue-800';
      case 'Seleccionado':
        return 'bg-purple-100 text-purple-800';
      case 'Rechazado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Card
        className={`relative transition-all ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => setShowDetail(true)}
      >
        {/* Botón favorito */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(provider.id);
          }}
          className="absolute top-2 left-2 text-yellow-400 hover:scale-110 transition-transform"
          title={provider.favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
        >
          <Star
            size={18}
            className={provider.favorite ? 'fill-yellow-400' : 'fill-none stroke-2'}
          />
        </button>

        {/* Checkbox para selección */}
        <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        </div>

        {/* Imagen de proveedor si existe */}
        {provider.image && (
          <div className="w-full h-32 overflow-hidden rounded-t-lg mb-2">
            <img src={provider.image} alt={provider.name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Información principal */}
        <div className="p-4">
          <h3 className="text-lg font-semibold line-clamp-1">{provider.name}</h3>

          <div className="mt-1 mb-3 flex itemás-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(provider.status)}`}>
              {provider.status}
            </span>
            <span className="text-sm font-medium text-gray-500">{provider.service}</span>
            {provider.groupName && (
              <span
                className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 inline-flex itemás-center gap-1"
                title={`Grupo: ${provider.groupName}`}
              >
                <Users size={12} /> {provider.groupName}
              </span>
            )}
            {budgetInfo && (
              <span
                className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 inline-flex itemás-center gap-1"
                title={budgetInfo.accepted
                  ? `Presupuesto aceptado: ${budgetInfo.accepted?.amount ?? '-'} ${budgetInfo.accepted?.currency || ''}`
                  : budgetInfo.latest
                    ? `Último presupuesto: ${budgetInfo.latest?.amount ?? '-'} ${budgetInfo.latest?.currency || ''}`
                    : 'Presupuesto'}
              >
                {budgetInfo.accepted
                  ? 'Presupuesto aceptado'
                  : budgetInfo.pendingCount > 0
                    ? `Presupuesto pendiente (${budgetInfo.pendingCount})`
                    : 'Presupuesto recibido'}
              </span>
            )}
          </div>

          {provider.contact && (
            <p className="text-sm text-gray-600 mb-1">Contacto: {provider.contact}</p>
          )}

          {provider.phone && <p className="text-sm text-gray-600 mb-1">Tel: {provider.phone}</p>}

          {provider.email && (
            <p className="text-sm text-gray-600 mb-1 truncate">{provider.email}</p>
          )}

          {(provider.website || provider.link) && (
            <a
              href={provider.website || provider.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline block truncate mb-1"
              onClick={(e) => e.stopPropagation()}
            >
              {(provider.website || provider.link).replace(/^https?:\/\//, '').split('/')[0]}
            </a>
          )}

          {provider.priceRange && (
            <p className="text-sm font-medium mt-1">Precio: {provider.priceRange}</p>
          )}

          {provider.depositStatus === 'paid' && (
            <span className="inline-flex itemás-center mt-2 text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded">
              Señal pagada
            </span>
          )}

          {(provider.location || provider.address) && (
            <div className="flex itemás-center mt-1 text-sm text-gray-600">
              <MapPin size={14} className="mr-1 text-gray-400" />
              <span className="truncate">{provider.location || provider.address}</span>
            </div>
          )}

          {/* Fecha */}
          {provider.date && (
            <div className="flex itemás-center mt-2 mb-2">
              <Calendar size={14} className="mr-1 text-gray-400" />
              <span className="text-sm text-gray-600">{provider.date}</span>
            </div>
          )}

          {/* Calificación */}
          <div className="mt-2">{renderRating(provider.rating, provider.ratingCount)}</div>

          {/* Extracto o descripción corta */}
          {provider.snippet && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{provider.snippet}</p>
          )}
        </div>

        {/* Acciones */}
        <div
          className="border-t border-gray-100 p-3 bg-gray-50 rounded-b-lg flex flex-wrap itemás-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            onClick={() => (onViewDetail ? onViewDetail(provider) : setShowDetail(true))}
            variant="ghost"
            size="sm"
            className="flex-1"
          >
            <Eye size={16} className="mr-1" /> Ver
          </Button>

          <Button onClick={() => setShowEmail(true)} variant="outline" size="sm" className="flex-1">
            Contactar
          </Button>

          {/* Contratos se gestionan en la plataforma del proveedor */}

          {onEdit && (
            <Button
              onClick={() => onEdit?.(provider)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Edit2 size={16} className="mr-1" /> Editar
            </Button>
          )}

          {budgetInfo && (
            <Button
              onClick={() => {
                setDetailTab('info');
                setShowDetail(true);
              }}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Ver presupuesto
            </Button>
          )}

          {!provider.groupId && (
            <Button
              onClick={() => setShowAssign(true)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Asignar a grupo
            </Button>
          )}

          {onDelete && (
            <Button
              onClick={() => onDelete?.(provider.id)}
              variant="outline"
              size="sm"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 size={16} className="mr-1" /> Eliminar
            </Button>
          )}

          {onReserve && (
            <Button
              onClick={() => onReserve?.(provider)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Calendar size={16} className="mr-1" /> Reservar
            </Button>
          )}
        </div>

        {tracking && (
          <div className="w-full text-xs text-gray-600 mt-1 flex itemás-center gap-2 flex-wrap">
            <span>Seguimiento: {tracking.status || '-'}</span>
            <span>Último: {lastAgo || '-'}</span>
            <span>Hilo: {(tracking.thread || []).length}</span>
            <a
              href="/email/inbox"
              className="ml-auto text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
              title="Abrir bandeja de entrada"
            >
              Ver correo
            </a>
            {typeof onShowTracking === 'function' && (
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  try {
                    onShowTracking({
                      id: tracking.id || provider.id,
                      providerId: provider.id,
                      providerName: provider.name,
                      subject: tracking.subject || `Mensaje para ${provider.name}`,
                      status: tracking.status || 'pendiente',
                      sentAt: tracking.lastEmailDate || new Date().toISOString(),
                      lastUpdated: tracking.lastEmailDate || new Date().toISOString(),
                      openCount: tracking.openCount || 0,
                      recipientEmail: tracking.providerEmail || provider.email || '',
                    });
                  } catch {
                    onShowTracking(null);
                  }
                }}
                title="Ver detalles de seguimiento"
              >
                Detalles
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Correos relacionados con este proveedor */}
      <div className="mt-1">
        <button
          type="button"
          className="text-xs text-blue-600 hover:underline"
          onClick={async (e) => {
            e.stopPropagation();
            setEmailsOpen((v) => !v);
            if (!emailsOpen && emails.length === 0) {
              const list = await fetchProviderEmails();
              setEmails(list);
            }
          }}
          title="Ver correos relacionados"
        >
          {emailsOpen ? 'Ocultar correos' : `Correos relacionados (${emails.length || 0})`}
        </button>
        {emailsOpen && (
          <div className="mt-1 border rounded p-2 bg-white/50 max-h-40 overflow-auto text-xs">
            {emailsLoading ? (
              <div className="text-gray-500">Cargando correos...</div>
            ) : emails.length === 0 ? (
              <div className="text-gray-500">Sin correos relacionados</div>
            ) : (
              <ul className="space-y-1">
                {emails.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2">
                    <span className="truncate" title={m.subject}>{m.subject || '(Sin asunto)'}</span>
                    <span className="text-gray-500 whitespace-nowrap">{new Date(m.date).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 text-right">
              <a
                href={`/email/inbox?search=${encodeURIComponent(provider.email || provider.name || '')}`}
                className="text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Abrir en buzón
              </a>
            </div>
          </div>
        )}
      </div>

      {showDetail && (
        <ProveedorDetail
          provider={provider}
          onClose={() => setShowDetail(false)}
          onEdit={onEdit}
          activeTab={detailTab}
          setActiveTab={setDetailTab}
          onOpenGroups={onOpenGroups}
        />
      )}
      {showAssign && (
        <AssignSupplierToGroupModal
          open={showAssign}
          onClose={() => setShowAssign(false)}
          provider={provider}
        />
      )}
      {showEmail && (
        <ProviderEmailModal
          open={showEmail}
          onClose={() => setShowEmail(false)}
          provider={provider}
          onSent={() => {
            refreshTracking();
            setShowEmail(false);
          }}
        />
      )}
    </>
  );
};

// Utilizar React.memo para evitar renderizaños innecesarios cuando las props no cambian
export default React.memo(ProveedorCard, (prevProps, nextProps) => {
  // Comparación personalizada para determinar si las props han cambiado
  // Solo re-renderiza si alguna de estas propiedades ha cambiado
  return (
    prevProps.provider.id === nextProps.provider.id &&
    prevProps.provider.name === nextProps.provider.name &&
    prevProps.provider.service === nextProps.provider.service &&
    prevProps.provider.status === nextProps.provider.status &&
    prevProps.provider.date === nextProps.provider.date &&
    prevProps.isSelected === nextProps.isSelected
  );
});
