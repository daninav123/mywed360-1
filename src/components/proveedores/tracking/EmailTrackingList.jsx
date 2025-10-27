import { Clock, Mail, CheckCircle, AlertCircle, XCircle, Eye } from 'lucide-react';
import React, { useMemo } from 'react';

import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import useTranslations from '../../../hooks/useTranslations';

const FILTER_KEYS = [
  'todos',
  'enviado',
  'entregado',
  'leido',
  'responded',
  'error',
  'pendiente',
];

const FILTER_TO_TRANSLATION_KEY = {
  todos: 'all',
  enviado: 'sent',
  entregado: 'delivered',
  leido: 'read',
  responded: 'responded',
  error: 'error',
  pendiente: 'pending',
};

const RAW_STATUS_TO_KEY = {
  enviado: 'sent',
  sent: 'sent',
  entregado: 'delivered',
  delivered: 'delivered',
  leido: 'read',
  leído: 'read',
  read: 'read',
  responded: 'responded',
  completed: 'responded',
  error: 'error',
  urgent: 'error',
  failed: 'error',
  pendiente: 'pending',
  waiting: 'pending',
  waiting_response: 'pending',
  followup: 'pending',
};

const STATUS_STYLES = {
  sent: { color: 'text-blue-600', bg: 'bg-blue-100', Icon: Mail },
  delivered: { color: 'text-green-600', bg: 'bg-green-100', Icon: CheckCircle },
  read: { color: 'text-purple-600', bg: 'bg-purple-100', Icon: Eye },
  responded: { color: 'text-emerald-600', bg: 'bg-emerald-100', Icon: CheckCircle },
  error: { color: 'text-red-600', bg: 'bg-red-100', Icon: XCircle },
  pending: { color: 'text-amber-600', bg: 'bg-amber-100', Icon: Clock },
  unknown: { color: 'text-gray-600', bg: 'bg-gray-100', Icon: AlertCircle },
};

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
  const { t, format } = useTranslations();
  const notAvailable = t('common.suppliers.tracking.shared.notAvailable');

  const getStatusInfo = (status) => {
    const key =
      RAW_STATUS_TO_KEY[String(status || '').toLowerCase()] || 'unknown';
    const { color, bg, Icon } = STATUS_STYLES[key] || STATUS_STYLES.unknown;
    return {
      color,
      bg,
      icon: <Icon size={16} />,
      label: t(`common.suppliers.tracking.status.${key}`),
    };
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
      return format.datetime(date);
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTER_KEYS.map((key) => (
          <Button
            key={key}
            size="sm"
            variant={key === currentFilter ? 'default' : 'outline'}
            className={key === currentFilter ? 'capitalize' : 'capitalize text-gray-600'}
            onClick={() => onFilter(key)}
          >
            {t(
              `common.suppliers.tracking.list.filters.${FILTER_TO_TRANSLATION_KEY[key] || 'all'}`
            )}
          </Button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {t('common.suppliers.tracking.list.empty')}
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
                      {item.providerName ||
                        t('common.suppliers.tracking.list.placeholders.provider')}
                    </h3>
                    <span
                      className={`text-xs ${statusInfo.color} ${statusInfo.bg} flex items-center gap-1 px-2 py-1 rounded-full`}
                    >
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                  </div>

                    <p className="text-sm font-medium text-gray-700 mb-1 truncate">
                  {item.subject ||
                    t('common.suppliers.tracking.list.placeholders.subject')}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 text-xs text-gray-500">
                      <span>
                        {t('common.suppliers.tracking.list.sentAt', {
                          value: formatDateTime(sentAt) || notAvailable,
                        })}
                      </span>
                      {updatedAt && updatedAt !== sentAt && (
                        <span>
                          {t('common.suppliers.tracking.list.updatedAt', {
                            value: formatDateTime(updatedAt) || notAvailable,
                          })}
                        </span>
                      )}
                      {emailLabel && <span>{emailLabel}</span>}
                      {item.openCount > 0 && (
                        <span className="text-green-600 flex items-center">
                          <Eye size={12} className="mr-1" />
                          {t('common.suppliers.tracking.list.openCount', {
                            count: item.openCount,
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button size="sm" variant="ghost" onClick={() => onViewDetails(item)}>
                    {t('common.suppliers.tracking.list.details')}
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
