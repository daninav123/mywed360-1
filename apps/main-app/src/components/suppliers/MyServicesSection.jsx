import React, { useMemo } from 'react';
import { CheckCircle, Clock, Search, DollarSign, ChevronRight, Heart, Plus } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import QuoteRequestsTracker from './QuoteRequestsTracker';

const MyServicesSection = ({
  serviceCards = [],
  onSearchService,
  onViewFavorites,
  onAddManualProvider,
  loading = false,
}) => {
  // Agrupar servicios por estado
  const groupedServices = useMemo(() => {
    const confirmed = [];
    const inProgress = [];
    const pending = [];

    serviceCards.forEach((card) => {
      if (card.confirmed) {
        confirmed.push(card);
      } else if (card.providers && card.providers.length > 0) {
        inProgress.push(card);
      } else {
        pending.push(card);
      }
    });

    return { confirmed, inProgress, pending };
  }, [serviceCards]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Presupuestos Pendientes */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-orange-100">
            <DollarSign className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Presupuestos Pendientes</h2>
            <p className="text-sm text-gray-600">Compara y gestiona las cotizaciones recibidas</p>
          </div>
        </div>
        <QuoteRequestsTracker />
      </div>

      {/* Servicios de tu Boda */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Servicios de tu Boda</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewFavorites}
            leftIcon={<Heart className="w-4 h-4" />}
          >
            Ver Favoritos
          </Button>
        </div>

        <div className="space-y-3">
          {/* Servicios Confirmados */}
          {groupedServices.confirmed.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                ✓ Confirmados ({groupedServices.confirmed.length})
              </h3>
              {groupedServices.confirmed.map((card) => (
                <ServiceCard
                  key={card.key}
                  card={card}
                  status="confirmed"
                  onSearch={() => onSearchService(card.label)}
                />
              ))}
            </div>
          )}

          {/* Servicios En Progreso */}
          {groupedServices.inProgress.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                ⏳ En progreso ({groupedServices.inProgress.length})
              </h3>
              {groupedServices.inProgress.map((card) => (
                <ServiceCard
                  key={card.key}
                  card={card}
                  status="inProgress"
                  onSearch={() => onSearchService(card.label)}
                />
              ))}
            </div>
          )}

          {/* Servicios Pendientes */}
          {groupedServices.pending.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                🔍 Sin proveedores ({groupedServices.pending.length})
              </h3>
              {groupedServices.pending.map((card) => (
                <ServiceCard
                  key={card.key}
                  card={card}
                  status="pending"
                  onSearch={() => onSearchService(card.label)}
                  onAddManual={() => onAddManualProvider(card.label)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente de Card de Servicio
const ServiceCard = ({ card, status, onSearch, onAddManual }) => {
  const statusConfig = {
    confirmed: {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    inProgress: {
      icon: Clock,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    pending: {
      icon: Search,
      iconColor: 'text-gray-400',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className={`p-4 ${config.bgColor} ${config.borderColor} border`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 rounded-lg bg-white">
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 mb-1">{card.label}</h4>

            {/* Confirmado */}
            {status === 'confirmed' && card.confirmed && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">{card.confirmed.name}</p>
                {card.confirmed.price && (
                  <p className="text-sm text-gray-600">Precio: {card.confirmed.price}</p>
                )}
              </div>
            )}

            {/* En Progreso */}
            {status === 'inProgress' && (
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  {card.providers.length} proveedor{card.providers.length > 1 ? 'es' : ''} en
                  contacto
                </p>
                {card.providers.slice(0, 2).map((prov, idx) => (
                  <p key={idx} className="text-xs text-gray-500">
                    • {prov.name}
                  </p>
                ))}
                {card.providers.length > 2 && (
                  <p className="text-xs text-gray-500">+{card.providers.length - 2} más</p>
                )}
              </div>
            )}

            {/* Pendiente */}
            {status === 'pending' && (
              <p className="text-sm text-gray-500">Aún no has contactado proveedores</p>
            )}
          </div>
        </div>

        {/* Botón de acción */}
        {status === 'pending' ? (
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={onSearch}
              rightIcon={<Search className="w-4 h-4" />}
            >
              Buscar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddManual}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Tengo uno
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onSearch}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Ver más
          </Button>
        )}
      </div>
    </Card>
  );
};

export default MyServicesSection;
