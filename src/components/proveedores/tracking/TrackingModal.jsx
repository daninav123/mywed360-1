import { X, Mail, Clock, CheckCircle, Eye, XCircle, Calendar } from 'lucide-react';
import React from 'react';

import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import useTranslations from '../../../hooks/useTranslations';

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
  failed: 'error',
  pendiente: 'pending',
  waiting: 'pending',
  waiting_response: 'pending',
  followup: 'pending',
};

const STATUS_STYLES = {
  sent: { color: 'text-blue-600', bgColor: 'bg-blue-100', iconColor: 'text-blue-600', Icon: Mail },
  delivered: {
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    Icon: CheckCircle,
  },
  read: {
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    Icon: Eye,
  },
  responded: {
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    Icon: CheckCircle,
  },
  error: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    Icon: XCircle,
  },
  pending: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    iconColor: 'text-amber-600',
    Icon: Clock,
  },
  unknown: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    iconColor: 'text-gray-600',
    Icon: Clock,
  },
};

/**
 * @typedef {import('./EmailTrackingList').EmailTrackingItem} EmailTrackingItem
 */

/**
 * Modal que muestra los detalles completos del seguimiento de un email enviado a un proveedor.
 * Incluye información detallada sobre el estado del email, historial de interacciones,
 * contenido del mensaje, acciones realizadas y estadísticas de apertura.
 *
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Indica si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {EmailTrackingItem} props.trackingItem - Elemento de seguimiento a mostrar en detalle
 * @returns {React.ReactElement|null} Modal de detalles de seguimiento o null si no está abierto
 */
const TrackingModal = ({ isOpen, onClose, trackingItem }) => {
  const { t, format } = useTranslations();
  if (!isOpen || !trackingItem) return null;

  // Función para obtener el color y texto según el estado del email
  const getStatusInfo = (status) => {
    const key =
      RAW_STATUS_TO_KEY[String(status || '').toLowerCase()] || 'unknown';
    const { color, bgColor, iconColor, Icon } =
      STATUS_STYLES[key] || STATUS_STYLES.unknown;
    return {
      color,
      bgColor,
      icon: <Icon size={20} className={iconColor} />,
      text: t(`common.suppliers.tracking.status.${key}`),
    };
  };

  // Formatear fecha y hora
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date =
        typeof dateStr?.toDate === 'function'
          ? dateStr.toDate()
          : dateStr instanceof Date
            ? dateStr
            : new Date(dateStr);
      if (Number.isNaN(date.getTime())) return '';
      return format.datetime(date);
    } catch (e) {
      return '';
    }
  };

  // Datos de ejemplo para la visualización
  const statusInfo = getStatusInfo(trackingItem.status);
  const notAvailable = t('common.suppliers.tracking.shared.notAvailable');
  const fallbackRecipient =
    trackingItem.recipientEmail ||
    t('common.suppliers.tracking.modal.placeholders.recipient');

  // Historial de actividad de ejemplo
  const activities = [
    {
      type: 'send',
      date: trackingItem.sentAt,
      detail: t('common.suppliers.tracking.modal.activities.send', {
        email: fallbackRecipient,
      }),
    },
  ];

  // Añadir eventos adicionales basados en el estado
  if (trackingItem.status !== 'enviado' && trackingItem.status !== 'error') {
    activities.push({
      type: 'deliver',
      date:
        trackingItem.deliveredAt ||
        new Date(new Date(trackingItem.sentAt).getTime() + 60000).toISOString(),
      detail: t('common.suppliers.tracking.modal.activities.deliver'),
    });
  }

  if (trackingItem.status === 'leido') {
    // Añadir eventos de apertura
    const openCount = trackingItem.openCount || 1;
    for (let i = 0; i < openCount; i++) {
      activities.push({
        type: 'open',
        date:
          i === 0
            ? trackingItem.firstOpenedAt ||
              new Date(new Date(trackingItem.sentAt).getTime() + 300000).toISOString()
            : new Date(new Date(trackingItem.sentAt).getTime() + 300000 * (i + 1)).toISOString(),
        detail:
          i === 0
            ? t('common.suppliers.tracking.modal.activities.openFirst')
            : t('common.suppliers.tracking.modal.activities.openNth', {
                index: i + 1,
              }),
      });
    }
  }

  if (trackingItem.status === 'error') {
    activities.push({
      type: 'error',
      date:
        trackingItem.errorAt ||
        new Date(new Date(trackingItem.sentAt).getTime() + 120000).toISOString(),
      detail:
        trackingItem.errorMessage ||
        t('common.suppliers.tracking.modal.activities.errorDefault'),
    });
  }

  // Ordenar actividades por fecha
  activities.sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {t('common.suppliers.tracking.modal.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label={t('common.suppliers.tracking.modal.closeAria')}
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido principal con scroll */}
        <div className="overflow-y-auto p-4 flex-1">
          {/* Información del email */}
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                {t('common.suppliers.tracking.modal.emailInfo.title')}
              </h3>
              <span
                className={`flex items-center gap-1 px-3 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}
              >
                {statusInfo.icon}
                <span className="ml-1 font-medium">{statusInfo.text}</span>
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">
                  {t('common.suppliers.tracking.modal.emailInfo.fields.subject')}
                </p>
                <p className="font-medium">
                  {trackingItem.subject ||
                    t('common.suppliers.tracking.modal.placeholders.subject')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">
                    {t('common.suppliers.tracking.modal.emailInfo.fields.provider')}
                  </p>
                  <p className="font-medium">
                    {trackingItem.providerName ||
                      t('common.suppliers.tracking.list.placeholders.provider')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    {t('common.suppliers.tracking.modal.emailInfo.fields.recipient')}
                  </p>
                  <p className="font-medium">
                    {trackingItem.recipientEmail ||
                      t('common.suppliers.tracking.modal.placeholders.recipientEmail')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">
                    {t('common.suppliers.tracking.modal.emailInfo.fields.sent')}
                  </p>
                  <p className="font-medium">
                    {formatDateTime(trackingItem.sentAt) || notAvailable}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    {t('common.suppliers.tracking.modal.emailInfo.fields.updated')}
                  </p>
                  <p className="font-medium">
                    {formatDateTime(trackingItem.lastUpdated || trackingItem.sentAt) ||
                      notAvailable}
                  </p>
                </div>
              </div>

              {trackingItem.openCount > 0 && (
                <div>
                  <p className="text-sm text-gray-500">
                    {t('common.suppliers.tracking.modal.emailInfo.fields.opens')}
                  </p>
                  <p className="font-medium text-green-600">
                    {t('common.suppliers.tracking.modal.emailInfo.openCount', {
                      count: trackingItem.openCount,
                    })}
                  </p>
                </div>
              )}

              {trackingItem.providerWebsite && (
                <a
                  href={trackingItem.providerWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  {t('common.suppliers.tracking.modal.emailInfo.websiteLink', {
                    url: trackingItem.providerWebsite,
                  })}
                </a>
              )}

              {trackingItem.errorMessage && (
                <div className="bg-red-50 p-3 rounded-md border border-red-200 text-red-700">
                  <p className="font-medium mb-1">
                    {t('common.suppliers.tracking.modal.error.title')}
                  </p>
                  <p className="text-sm">
                    {trackingItem.errorMessage ||
                      t('common.suppliers.tracking.modal.error.default')}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Historial de actividad */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">
              {t('common.suppliers.tracking.modal.activity.title')}
            </h3>

            <div className="relative">
              {/* Línea de tiempo vertical */}
              <div className="absolute left-6 top-0 h-full w-0.5 bg-gray-200"></div>

              {/* Eventos */}
              <div className="space-y-6">
                {activities.map((activity, index) => {
                  let icon;
                  let iconBg;

                  switch (activity.type) {
                    case 'send':
                      icon = <Mail size={16} className="text-white" />;
                      iconBg = 'bg-blue-500';
                      break;
                    case 'deliver':
                      icon = <CheckCircle size={16} className="text-white" />;
                      iconBg = 'bg-green-500';
                      break;
                    case 'open':
                      icon = <Eye size={16} className="text-white" />;
                      iconBg = 'bg-purple-500';
                      break;
                    case 'error':
                      icon = <XCircle size={16} className="text-white" />;
                      iconBg = 'bg-red-500';
                      break;
                    default:
                      icon = <Clock size={16} className="text-white" />;
                      iconBg = 'bg-gray-500';
                  }

                  return (
                    <div key={index} className="flex">
                      <div className="relative flex items-center justify-center">
                        <div
                          className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center z-10`}
                        >
                          {icon}
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <p className="text-sm text-gray-500 mb-1">
                            {formatDateTime(activity.date) || notAvailable}
                          </p>
                          <p className="font-medium">{activity.detail}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Contenido del email (ejemplo) */}
          <Card>
            <h3 className="text-lg font-medium mb-4">
              {t('common.suppliers.tracking.modal.content.title')}
            </h3>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="mb-4">
                <p>
                  <strong>{t('common.suppliers.tracking.modal.content.fromLabel')}</strong>{' '}
                  {t('common.suppliers.tracking.modal.content.fromValue')}
                </p>
                <p>
                  <strong>{t('common.suppliers.tracking.modal.content.toLabel')}</strong>{' '}
                  {trackingItem.recipientEmail ||
                    t('common.suppliers.tracking.modal.content.placeholderRecipientEmail')}
                </p>
                <p>
                  <strong>{t('common.suppliers.tracking.modal.content.subjectLabel')}</strong>{' '}
                  {trackingItem.subject ||
                    t('common.suppliers.tracking.modal.placeholders.subject')}
                </p>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <p>{t('common.suppliers.tracking.modal.content.body.greeting')}</p>
                <br />
                <p>{t('common.suppliers.tracking.modal.content.body.intro')}</p>
                <p>{t('common.suppliers.tracking.modal.content.body.note')}</p>
                <br />
                <p>{t('common.suppliers.tracking.modal.content.body.farewell')}</p>
                <p>{t('common.suppliers.tracking.modal.content.body.signature')}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer con botones */}
        <div className="border-t p-4 bg-gray-50 flex justify-between">
          <div>
            <Button variant="outline" size="sm" className="flex items-center">
              <Calendar size={16} className="mr-1" />{' '}
              {t('common.suppliers.tracking.modal.buttons.schedule')}
            </Button>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              {t('common.suppliers.tracking.modal.buttons.close')}
            </Button>
            <Button
              variant="outline"
              className="flex items-center"
              onClick={() => window.open(`mailto:${trackingItem.recipientEmail || ''}`)}
            >
              <Mail size={16} className="mr-1" />{' '}
              {t('common.suppliers.tracking.modal.buttons.reply')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingModal;
