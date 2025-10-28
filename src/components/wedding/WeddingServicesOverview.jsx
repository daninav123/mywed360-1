// components/wedding/WeddingServicesOverview.jsx
// Vista general de todos los servicios de la boda con sus proveedores

import React, { useMemo } from 'react';
import WeddingServiceCard from './WeddingServiceCard';
import useProveedores from '../../hooks/useProveedores';
import useSupplierShortlist from '../../hooks/useSupplierShortlist';

// Servicios típicos de una boda
const WEDDING_SERVICES = [
  { id: 'fotografia', name: 'Fotografía', priority: 1 },
  { id: 'catering', name: 'Catering', priority: 2 },
  { id: 'venue', name: 'Lugar de celebración', priority: 3 },
  { id: 'musica', name: 'Música', priority: 4 },
  { id: 'video', name: 'Vídeo', priority: 5 },
  { id: 'flores', name: 'Flores y decoración', priority: 6 },
  { id: 'tarta', name: 'Tarta', priority: 7 },
  { id: 'transporte', name: 'Transporte', priority: 8 },
  { id: 'animacion', name: 'Animación', priority: 9 },
];

/**
 * Vista general de servicios de la boda
 * Muestra el estado de cada servicio (confirmado, en evaluación, pendiente)
 */
export default function WeddingServicesOverview({ onSearch }) {
  const { providers } = useProveedores();
  const { shortlist } = useSupplierShortlist();
  
  // Agrupar proveedores confirmados por servicio
  const confirmedByService = useMemo(() => {
    const map = {};
    
    (providers || []).forEach(provider => {
      const serviceKey = provider.service?.toLowerCase() || 'otros';
      
      // Solo considerar confirmados
      if (provider.status?.toLowerCase().includes('confirm')) {
        // Tomar el primero (el más reciente suele ser el más relevante)
        if (!map[serviceKey]) {
          map[serviceKey] = provider;
        }
      }
    });
    
    return map;
  }, [providers]);
  
  // Contar proveedores en shortlist por servicio
  const shortlistCountByService = useMemo(() => {
    const map = {};
    
    (shortlist || []).forEach(item => {
      const serviceKey = item.service?.toLowerCase() || 'otros';
      map[serviceKey] = (map[serviceKey] || 0) + 1;
    });
    
    return map;
  }, [shortlist]);
  
  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalServices = WEDDING_SERVICES.length;
    const confirmedCount = Object.keys(confirmedByService).length;
    const inEvaluationCount = Object.keys(shortlistCountByService).length - confirmedCount;
    const pendingCount = totalServices - confirmedCount - inEvaluationCount;
    
    return {
      total: totalServices,
      confirmed: confirmedCount,
      inEvaluation: inEvaluationCount > 0 ? inEvaluationCount : 0,
      pending: pendingCount > 0 ? pendingCount : 0,
      progress: (confirmedCount / totalServices) * 100
    };
  }, [confirmedByService, shortlistCountByService]);
  
  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Servicios de tu boda
        </h2>
        <p className="text-gray-600 mb-4">
          Gestiona todos los proveedores que necesitas para tu gran día
        </p>
        
        {/* Barra de progreso */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-700 font-medium">Progreso</span>
            <span className="text-gray-900 font-bold">{stats.progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </div>
        
        {/* Contadores */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-600">Total</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
            <p className="text-sm text-gray-600">Confirmados</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{stats.inEvaluation}</p>
            <p className="text-sm text-gray-600">En evaluación</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-400">{stats.pending}</p>
            <p className="text-sm text-gray-600">Pendientes</p>
          </div>
        </div>
      </div>
      
      {/* Tarjetas de servicios */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {WEDDING_SERVICES.map(service => {
          const serviceKey = service.id.toLowerCase();
          const confirmed = confirmedByService[serviceKey];
          const shortlistCount = shortlistCountByService[serviceKey] || 0;
          
          return (
            <WeddingServiceCard
              key={service.id}
              service={service.name}
              confirmedProvider={confirmed}
              shortlistCount={shortlistCount}
              onSearch={onSearch}
            />
          );
        })}
      </div>
      
      {/* Mensaje de ayuda */}
      {stats.confirmed === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-2">
            👋 ¡Empieza buscando proveedores para tu boda!
          </p>
          <p className="text-sm text-gray-500">
            Haz clic en "Buscar proveedores" en cualquier servicio para comenzar
          </p>
        </div>
      )}
    </div>
  );
}
