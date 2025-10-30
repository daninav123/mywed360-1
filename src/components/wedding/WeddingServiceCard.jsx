// components/wedding/WeddingServiceCard.jsx
// Tarjeta de servicio que muestra el proveedor confirmado o estado pendiente

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Search,
  Clock,
  Phone,
  Mail,
  ExternalLink,
  MessageCircle,
  Heart,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useWeddingServices } from '../../hooks/useWeddingServices';
import SelectFromFavoritesModal from '../suppliers/SelectFromFavoritesModal';
import { toast } from 'react-toastify';

/**
 * Tarjeta de servicio de la boda
 * Muestra el proveedor confirmado o botones para buscar
 */
export default function WeddingServiceCard({
  serviceId, // ID de la categoría (ej: 'fotografia')
  serviceName, // Nombre para mostrar (ej: 'Fotografía')
  service, // Retrocompatibilidad
  confirmedProvider,
  shortlistCount = 0,
  onSearch,
}) {
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const { assignSupplier } = useWeddingServices();
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

  // Usar serviceId si está disponible, sino usar service
  const categoryId = serviceId || service?.toLowerCase();
  const displayName = serviceName || service;

  const hasConfirmed = !!confirmedProvider;
  const hasShortlist = shortlistCount > 0;

  // Filtrar favoritos por categoría del servicio (usar ID directo)
  const serviceFavorites = favorites.filter((fav) => fav.supplier?.category === categoryId);
  const hasFavorites = serviceFavorites.length > 0;

  // Debug SIMPLIFICADO - solo una vez al montar
  useEffect(() => {
    if (categoryId === 'fotografia' && favorites.length > 0) {
      console.log('🔍 DEBUG FOTOGRAFÍA - Categorías guardadas:');
      favorites.forEach((fav, idx) => {
        console.log(`  [${idx}] "${fav.supplier?.category}" - ${fav.supplier?.name}`);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  // Función para asignar proveedor
  const handleAssign = async (supplier) => {
    try {
      await assignSupplier(categoryId, supplier, null, '', 'contratado');
      // No cerramos el modal aquí, lo hace SelectFromFavoritesModal
    } catch (error) {
      throw error; // Re-lanzar para que lo maneje el modal
    }
  };

  // Iconos por servicio
  const serviceIcons = {
    fotografia: '📸',
    video: '🎥',
    catering: '🍽️',
    venue: '🏛️',
    musica: '🎵',
    dj: '🎧',
    flores: '💐',
    decoracion: '🎨',
    tarta: '🍰',
    animacion: '🎪',
    transporte: '🚗',
  };

  const icon = serviceIcons[categoryId] || '💼';

  return (
    <div
      data-testid="wedding-service-card"
      data-service-id={categoryId}
      data-service-name={displayName}
      className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="font-semibold text-lg text-gray-900">{displayName}</h3>
        </div>

        {/* Estado */}
        <div>
          {hasConfirmed ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle size={14} />
              Confirmado
            </span>
          ) : hasShortlist ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <Clock size={14} />
              En evaluación
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              <Search size={14} />
              Pendiente
            </span>
          )}
        </div>
      </div>

      {/* Contenido */}
      {hasConfirmed ? (
        // Proveedor confirmado
        <div className="space-y-3">
          <div className="border-l-4 border-green-500 bg-green-50 p-3 rounded">
            <p className="font-medium text-gray-900">{confirmedProvider.name}</p>
            {confirmedProvider.contact && (
              <p className="text-sm text-gray-600 mt-1">Contacto: {confirmedProvider.contact}</p>
            )}
            {confirmedProvider.rating > 0 && (
              <div className="flex items-center gap-1 mt-1 text-sm">
                <span className="text-yellow-500">⭐</span>
                <span className="font-medium">{confirmedProvider.rating.toFixed(1)}</span>
                {confirmedProvider.ratingCount > 0 && (
                  <span className="text-gray-500">({confirmedProvider.ratingCount} reseñas)</span>
                )}
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            {confirmedProvider.phone && (
              <button
                onClick={() =>
                  window.open(
                    `https://wa.me/${confirmedProvider.phone.replace(/\D/g, '')}`,
                    '_blank'
                  )
                }
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-1"
                title="Contactar por WhatsApp"
              >
                <MessageCircle size={16} />
                WhatsApp
              </button>
            )}
            {confirmedProvider.email && (
              <button
                onClick={() => window.open(`mailto:${confirmedProvider.email}`, '_blank')}
                className="flex-1 px-3 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors text-sm flex items-center justify-center gap-1"
                title="Enviar Email"
              >
                <Mail size={16} />
                Email
              </button>
            )}
            {confirmedProvider.link && (
              <button
                onClick={() => window.open(confirmedProvider.link, '_blank')}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                title="Ver web"
              >
                <ExternalLink size={16} />
              </button>
            )}
          </div>

          {/* Información adicional */}
          {confirmedProvider.confirmedAt && (
            <p className="text-xs text-gray-500 mt-2">
              Contratado el {new Date(confirmedProvider.confirmedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      ) : (
        // Sin proveedor confirmado
        <div className="space-y-3">
          {hasShortlist && (
            <p className="text-sm text-gray-600">
              {shortlistCount} {shortlistCount === 1 ? 'proveedor' : 'proveedores'} en tu lista
            </p>
          )}

          <div className="flex flex-col gap-2">
            {/* Botón Ver Favoritos (solo si hay favoritos) */}
            {hasFavorites && (
              <button
                onClick={() => setShowFavoritesModal(true)}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <Heart size={16} fill="currentColor" />
                Ver favoritos ({serviceFavorites.length})
              </button>
            )}

            {hasShortlist && (
              <button
                onClick={() => navigate(`/proveedores?service=${categoryId}`)}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <Clock size={16} />
                Revisar opciones ({shortlistCount})
              </button>
            )}
            <button
              onClick={() => {
                if (onSearch) {
                  onSearch(categoryId);
                } else {
                  navigate(`/proveedores?service=${categoryId}`);
                }
              }}
              className={`w-full px-4 py-2 border rounded-md transition-colors text-sm font-medium flex items-center justify-center gap-2 ${
                hasShortlist || hasFavorites
                  ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'border-blue-600 text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Search size={16} />
              {hasShortlist || hasFavorites ? 'Buscar más' : 'Buscar proveedores'}
            </button>
          </div>

          {!hasShortlist && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Aún no has explorado opciones para este servicio
            </p>
          )}
        </div>
      )}

      {/* Modal de favoritos */}
      <SelectFromFavoritesModal
        open={showFavoritesModal}
        onClose={() => setShowFavoritesModal(false)}
        serviceName={displayName}
        favorites={serviceFavorites}
        onAssign={handleAssign}
      />
    </div>
  );
}
