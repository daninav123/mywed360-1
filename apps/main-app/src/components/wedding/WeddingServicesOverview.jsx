// components/wedding/WeddingServicesOverview.jsx
// Vista general de todos los servicios de la boda con sus proveedores

import React, { useMemo, useState } from 'react';
import WeddingServiceCard from './WeddingServiceCard';
import useProveedores from '../../hooks/useProveedores';
import useSupplierShortlist from '../../hooks/useSupplierShortlist';
import { useWeddingCategories } from '../../hooks/useWeddingCategories';
import { useWeddingServices } from '../../hooks/useWeddingServices';
import { SUPPLIER_CATEGORIES } from '../../shared/supplierCategories';
import ManageServicesModal from './ManageServicesModal';
import { Settings } from 'lucide-react';
import Button from '../ui/Button';
import useTranslations from '../../hooks/useTranslations';

/**
 * Vista general de servicios de la boda
 * Muestra el estado de cada servicio (confirmado, en evaluación, pendiente)
 */
export default function WeddingServicesOverview({ onSearch, searchPanel }) {
  const { providers } = useProveedores();
  const { shortlist } = useSupplierShortlist();
  const { isCategoryActive, activeCategories, loading: loadingCategories } = useWeddingCategories();
  const { services, loading: loadingServices } = useWeddingServices();
  const [showManageModal, setShowManageModal] = useState(false);
  const { t } = useTranslations();

  // ⭐ CRÍTICO: useMemo con dependencia en activeCategories
  // Para que React re-renderice cuando cambian los servicios activos
  const activeServices = useMemo(() => {
    // console.log('🔄 [WeddingServicesOverview] Recalculando servicios activos...');
    // console.log('   activeCategories:', activeCategories);

    // Mapear TODAS las categorías y verificar cuáles están activas
    const allServices = SUPPLIER_CATEGORIES.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      isActive: isCategoryActive(cat.id),
    }));

    // Filtrar solo las activas
    const active = allServices.filter((s) => s.isActive);

    // console.log('   ✅ Servicios activos:', active.length);
    // console.log('   IDs:', active.map((s) => s.id));

    return active;
  }, [activeCategories, isCategoryActive]); // ← DEPENDENCIAS CRÍTICAS

  // Agrupar proveedores confirmados por servicio
  // PRIORIDAD: servicios asignados desde comparador > proveedores legacy
  const confirmedByService = useMemo(() => {
    const map = {};

    // 1. Primero cargar servicios asignados desde el nuevo sistema
    (services || []).forEach((service) => {
      if (service.assignedSupplier && service.category) {
        map[service.category] = {
          name: service.assignedSupplier.name,
          contact: service.assignedSupplier.email || service.assignedSupplier.contact?.email,
          email: service.assignedSupplier.email,
          phone: service.assignedSupplier.contact?.phone,
          rating: service.assignedSupplier.rating || 0,
          ratingCount: service.assignedSupplier.ratingCount || 0,
          price: service.assignedSupplier.price,
          quote: service.assignedSupplier.quote, // Datos del quote seleccionado
          confirmedAt: service.assignedSupplier.contractedAt || service.assignedSupplier.assignedAt,
          status: service.assignedSupplier.status,
        };
      }
    });

    // 2. Luego proveedores legacy (solo si no hay uno asignado ya)
    (providers || []).forEach((provider) => {
      const serviceKey = provider.service?.toLowerCase() || 'otros';

      // Solo considerar confirmados y si no hay ya uno asignado
      if (provider.status?.toLowerCase().includes('confirm') && !map[serviceKey]) {
        map[serviceKey] = provider;
      }
    });

    return map;
  }, [providers, services]);

  // Contar proveedores en shortlist por servicio
  const shortlistCountByService = useMemo(() => {
    const map = {};

    (shortlist || []).forEach((item) => {
      const serviceKey = item.service?.toLowerCase() || 'otros';
      map[serviceKey] = (map[serviceKey] || 0) + 1;
    });

    return map;
  }, [shortlist]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalServices = activeServices.length;
    const confirmedCount = Object.keys(confirmedByService).length;
    const inEvaluationCount = Object.keys(shortlistCountByService).length - confirmedCount;
    const pendingCount = totalServices - confirmedCount - inEvaluationCount;

    return {
      total: totalServices,
      confirmed: confirmedCount,
      inEvaluation: inEvaluationCount > 0 ? inEvaluationCount : 0,
      pending: pendingCount > 0 ? pendingCount : 0,
      progress: totalServices > 0 ? (confirmedCount / totalServices) * 100 : 0,
    };
  }, [confirmedByService, shortlistCountByService, activeServices.length]);

  if (loadingCategories) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
        <p className="text-gray-600">
          {t('wedding.servicesOverview.loading', { defaultValue: 'Cargando servicios...' })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <div className="bg-[var(--color-primary)] rounded-lg p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('wedding.servicesOverview.title', { defaultValue: 'Servicios de tu boda' })}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowManageModal(true)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {t('wedding.manageServices.title', { defaultValue: 'Gestionar servicios' })}
            <span className="ml-1 px-2 py-0.5 bg-purple-600 text-white text-xs font-semibold rounded-full">
              {activeServices.length}
            </span>
          </Button>
        </div>
        <p className="text-gray-600 mb-4">
          {t('wedding.servicesOverview.subtitle', {
            count: activeServices.length,
            defaultValue: '{{count}} servicios personalizados para tu gran día',
          })}
        </p>

        {/* Barra de progreso */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-700 font-medium">
              {t('wedding.servicesOverview.progress', { defaultValue: 'Progreso' })}
            </span>
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
            <p className="text-sm text-gray-600">
              {t('wedding.servicesOverview.counters.total', { defaultValue: 'Total' })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
            <p className="text-sm text-gray-600">
              {t('wedding.servicesOverview.counters.confirmed', { defaultValue: 'Confirmados' })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{stats.inEvaluation}</p>
            <p className="text-sm text-gray-600">
              {t('wedding.servicesOverview.counters.inEvaluation', {
                defaultValue: 'En evaluación',
              })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-400">{stats.pending}</p>
            <p className="text-sm text-gray-600">
              {t('wedding.servicesOverview.counters.pending', { defaultValue: 'Pendientes' })}
            </p>
          </div>
        </div>
      </div>

      {/* Panel de búsqueda (si se proporciona) */}
      {searchPanel && <div className="my-6">{searchPanel}</div>}

      {/* Tarjetas de servicios */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activeServices.map((service) => {
          const serviceKey = service.id.toLowerCase();
          const confirmed = confirmedByService[serviceKey];
          const shortlistCount = shortlistCountByService[serviceKey] || 0;

          // Encontrar servicios vinculados
          const currentServiceData = services.find((s) => s.category === service.id);
          const linkedServicesList = (currentServiceData?.linkedServices || [])
            .map((linkedId) => {
              const linkedService = services.find((s) => s.id === linkedId);
              return linkedService
                ? { id: linkedService.category, name: linkedService.name }
                : null;
            })
            .filter(Boolean);

          return (
            <WeddingServiceCard
              key={service.id}
              serviceId={service.id}
              serviceName={service.name}
              confirmedProvider={confirmed}
              shortlistCount={shortlistCount}
              linkedServices={linkedServicesList}
              allServices={services}
              onSearch={onSearch}
            />
          );
        })}
      </div>

      {/* Mensaje de ayuda */}
      {stats.confirmed === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-2">
            {t('wedding.servicesOverview.empty.title', {
              defaultValue: '👋 ¡Empieza buscando proveedores para tu boda!',
            })}
          </p>
          <p className="text-sm text-gray-500">
            {t('wedding.servicesOverview.empty.hint', {
              defaultValue: 'Haz clic en "Buscar proveedores" en cualquier servicio para comenzar',
            })}
          </p>
        </div>
      )}

      {/* Modal de gestión de servicios */}
      <ManageServicesModal open={showManageModal} onClose={() => setShowManageModal(false)} />
    </div>
  );
}
