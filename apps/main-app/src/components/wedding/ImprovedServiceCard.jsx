import React from 'react';
import { Search, Heart, Send, Sparkles, CheckCircle, Clock, FileText } from 'lucide-react';
import { getCategoryIcon, getCategoryEmoji } from '../../utils/categoryIcons';
import { getServiceCardState, getCardClasses } from '../../utils/serviceCardState';
import Button from '../ui/Button';

/**
 * Tarjeta de servicio mejorada con estadísticas y acciones rápidas
 */
const ImprovedServiceCard = ({
  service,
  confirmed = false,
  favoritesCount = 0,
  contactedCount = 0,
  budgetAmount = null,
  wedding = null,
  onSearch,
  onViewFavorites,
  onViewDetails,
  onAutoFind,
  onRequestQuote,
}) => {
  const emoji = getCategoryEmoji(service.id);
  
  // Obtener estado de la tarjeta
  const stateInfo = getServiceCardState(
    {
      key: service.id,
      favoritos: favoritesCount,
      contactados: contactedCount,
      presupuesto: budgetAmount,
    },
    wedding
  );
  
  const cardClasses = getCardClasses(stateInfo);

  return (
    <div className={`rounded-xl ${cardClasses.container} p-5 hover:shadow-lg transition-all duration-200 group`}>
      {/* Header con icono y estado */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl group-hover:scale-110 transition-transform">
            {emoji}
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">{service.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={cardClasses.badge}>
                {stateInfo.emoji} {stateInfo.displayText}
              </span>
            </div>
          </div>
        </div>
        
        {/* Icono de estado grande */}
        {stateInfo.state === 'contracted' && (
          <div className="text-right">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        )}
        {stateInfo.state === 'over_budget' && (
          <div className="text-right">
            <span className="text-2xl">⚠️</span>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-white/60 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Heart className="h-4 w-4 text-pink-500" />
            <span className="text-xl font-bold text-gray-900">{favoritesCount}</span>
          </div>
          <div className="text-xs text-gray-600">Favoritos</div>
        </div>
        
        <div className="text-center p-2 bg-white/60 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Send className="h-4 w-4 text-blue-500" />
            <span className="text-xl font-bold text-gray-900">{contactedCount}</span>
          </div>
          <div className="text-xs text-gray-600">Contactados</div>
        </div>
        
        <div className="text-center p-2 bg-white/60 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="text-lg">💰</span>
            <span className="text-xl font-bold text-gray-900">
              {budgetAmount ? `${budgetAmount}€` : '—'}
            </span>
          </div>
          <div className="text-xs text-gray-600">Presupuesto</div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSearch?.(service.name)}
          className="flex items-center justify-center gap-1.5 text-sm"
        >
          <Search className="h-4 w-4" />
          Buscar
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails?.()}
          className="flex items-center justify-center gap-1.5 text-sm"
        >
          <FileText className="h-4 w-4" />
          Ver detalles
        </Button>
      </div>

      {/* Botón secundario: Solicitar presupuesto */}
      {favoritesCount > 0 && !confirmed && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => onRequestQuote?.(service.id)}
          className="w-full mt-2 flex items-center justify-center gap-1.5 text-sm"
        >
          <Send className="h-4 w-4" />
          Solicitar a {favoritesCount}
        </Button>
      )}

      {/* Mensaje de confirmación */}
      {confirmed && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-xs font-medium text-green-800">
            ✓ Proveedor contratado
          </p>
        </div>
      )}
    </div>
  );
};

export default ImprovedServiceCard;
