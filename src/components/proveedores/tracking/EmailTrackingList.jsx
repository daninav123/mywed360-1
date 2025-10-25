import { Clock, Mail, CheckCircle, AlertCircle, XCircle, Eye } from 'lucide-react';
import React, { useMemo } from 'react';

import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';

const FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'enviado', label: 'Enviado' },
  { key: 'entregado', label: 'Entregado' },
  { key: 'leido', label: 'Leído' },
  { key: 'responded', label: 'Respondido' },
  { key: 'error', label: 'Error' },
  { key: 'pendiente', label: 'Pendiente' },
];

/**
 * @typedef {Object} EmailTrackingItem
 * @property {string} id
 * @property {string} providerId
 * @property {string} providerName
 * @property {string} subject
 * @property {string} status
 * @property {string} [sentAt]
 * @property {string} [date]
 * @property {string} [lastUpdated]
 * @property {string} [lastEmailDate]
 * @property {number} [openCount]
 * @property {string} [recipientEmail]
 */

const EmailTrackingList = ({ trackingItems = [], onViewDetails, onFilter, currentFilter }) => {
  const getStatusInfo = (status) => {
    switch (status) {
      case 'enviado':
        return {
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          icon: <Mail size={16} />,
          label: 'Enviado',
        };
      case 'entregado':
        return {
          color: 'text-green-600',
          bg: 'bg-green-100',
          icon: <CheckCircle size={16} />,
          label: 'Entregado',
        };
      case 'leido':
        return {
          color: 'text-purple-600',
          bg: 'bg-purple-100',
          icon: <Eye size={16} />,
          label: 'Leído',
        };
      case 'responded':
      case 'completed':
        return {
          color: 'text-emerald-600',
          bg: 'bg-emerald-100',
          icon: <CheckCircle size={16} />,
          label: 'Respondido',
        };
      case 'error':
      case 'urgent':
        return {
          color: 'text-red-600',
          bg: 'bg-red-100',
          icon: <XCircle size={16} />,
          label: 'Error',
        };
      case 'pendiente':
      case 'waiting':
      case 'waiting_response':
      case 'followup':
        return {
          color: 'text-amber-600',
          bg: 'bg-amber-100',
          icon: <Clock size={16} />,
          label: 'Pendiente',
        };
      default:
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          icon: <AlertCircle size={16} />,
          label: 'Desconocido',
        };
    }
  };

  const list = useMemo(() => (Array.isArray(trackingItems) ? trackingItems : []), [trackingItems]);

  const filteredItems = useMemo(() => {
    if (currentFilter === 'todos') return list;
    return list.filter((item) => (item.status || '').toLowerCase() === currentFilter.toLowerCase());
  }, [list, currentFilter]);

  const formatDateTime = (value) => {
    if (!value) return '';
    try {
      const date =
        typeof value?.toDate === 'function'
          ? value.toDate()
          : value instanceof Date
            ? value
            : new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((filter) => (
          <Button
            key={filter.key}
            size="sm"
            variant={filter.key === currentFilter ? 'default' : 'outline'}
            className={filter.key === currentFilter ? 'capitalize' : 'capitalize text-gray-600'}
            onClick={() => onFilter(filter.key)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay registros de seguimiento que coincidan con el filtro seleccionado.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const statusInfo = getStatusInfo(item.status);
            const sentAt = item.sentAt || item.date || item.lastEmailDate || item.createdAt;
            const updatedAt = item.lastUpdated || item.lastEmailDate || sentAt;
            const emailLabel = item.recipientEmail || '';

            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {item.providerName || 'Proveedor'}
                      </h3>
                      <span
                        className={`text-xs ${statusInfo.color} ${statusInfo.bg} flex items-center gap-1 px-2 py-1 rounded-full`}
                      >
                        {statusInfo.icon} {statusInfo.label}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-gray-700 mb-1 truncate">
                      {item.subject || '(Sin asunto)'}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 text-xs text-gray-500">
                      <span>Enviado: {formatDateTime(sentAt)}</span>
                      {updatedAt && updatedAt !== sentAt && (
                        <span>Actualizado: {formatDateTime(updatedAt)}</span>
                      )}
                      {emailLabel && <span>{emailLabel}</span>}
                      {item.openCount > 0 && (
                        <span className="text-green-600 flex items-center">
                          <Eye size={12} className="mr-1" /> Abierto {item.openCount}{' '}
                          {item.openCount === 1 ? 'vez' : 'veces'}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button size="sm" variant="ghost" onClick={() => onViewDetails(item)}>
                    Detalles
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default React.memo(EmailTrackingList, (prevProps, nextProps) => {
  return (
    prevProps.currentFilter === nextProps.currentFilter &&
    JSON.stringify(prevProps.trackingItems) === JSON.stringify(nextProps.trackingItems)
  );
});
