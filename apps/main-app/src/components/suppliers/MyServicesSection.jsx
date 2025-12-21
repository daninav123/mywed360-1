import React, { useMemo, useState, useEffect } from 'react';
import { CheckCircle, Clock, Search, DollarSign, ChevronRight, Heart, Plus, Mail, FileText, TrendingUp } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { getCategoryStats } from '../../services/quoteStatsService';
import CategoryQuotesModalV2 from './CategoryQuotesModalV2';
import ImprovedServiceCard from '../wedding/ImprovedServiceCard';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useWeddingServices } from '../../hooks/useWeddingServices';
import { SUPPLIER_CATEGORIES } from '../../shared/supplierCategories';
import CategoryFavoritesModal from './CategoryFavoritesModal';

// Función para normalizar sin acentos
const removeAccents = (str) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

// Función para mapear card.key normalizado a category ID
const getCategoryIdFromKey = (cardKey) => {
  const normalizedKey = removeAccents(cardKey.toLowerCase().trim());
  
  // Buscar categoría que coincida con el card.key normalizado
  const category = SUPPLIER_CATEGORIES.find(cat => {
    const normalizedName = removeAccents(cat.name.toLowerCase().trim());
    const normalizedId = removeAccents(cat.id.toLowerCase().trim());
    return normalizedName === normalizedKey || normalizedId === normalizedKey;
  });
  
  return category?.id || cardKey;
};

const MyServicesSection = ({
  serviceCards = [],
  onSearchService,
  onViewFavorites,
  onAddManualProvider,
  loading = false,
  wedding = null,
}) => {
  const { favorites = [] } = useFavorites() || {};
  const { refreshServices } = useWeddingServices();
  const [favoritesModal, setFavoritesModal] = useState({ open: false, categoryId: null, categoryName: '', favorites: [] });
  const [quotesModal, setQuotesModal] = useState({ open: false, categoryId: null, categoryName: '', stats: null });
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

        {/* Grid de tarjetas mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {serviceCards.map((card) => {
            // Mapear card.key normalizado al ID real de la categoría
            const categoryId = getCategoryIdFromKey(card.key);
            
            // Contar favoritos para este servicio usando el ID correcto
            const serviceFavorites = favorites.filter(fav => {
              const favCategory = fav.supplier?.category;
              const supplierName = fav.supplier?.name || '';
              
              const normalizedFavCategory = favCategory ? removeAccents(favCategory.toLowerCase()) : '';
              const normalizedCategoryId = removeAccents(categoryId.toLowerCase());
              const normalizedCardKey = removeAccents(card.key.toLowerCase());
              const normalizedCardLabel = removeAccents(card.label.toLowerCase());
              const normalizedSupplierName = removeAccents(supplierName.toLowerCase());
              
              // DEBUG: Log para entender qué se está comparando
              if (card.key === 'decoracion' || card.key === 'ceremonia') {
                console.log(`🔍 [MyServicesSection] Comparando favorito para ${card.label}:`, {
                  favoriteName: fav.supplier?.name,
                  favCategory: favCategory,
                  normalizedFavCategory,
                  categoryId,
                  normalizedCategoryId,
                  cardKey: card.key,
                  cardLabel: card.label
                });
              }
              
              // 1. Comparar categoría directamente
              const categoryMatch = normalizedFavCategory === normalizedCategoryId || 
                                   normalizedFavCategory === normalizedCardKey ||
                                   normalizedFavCategory === normalizedCardLabel;
              
              if (categoryMatch) {
                console.log(`✅ [MyServicesSection] Match directo: ${fav.supplier?.name} → ${card.label}`);
                return true;
              }
              
              // 2. Buscar si la categoría del favorito es keyword de esta categoría
              // Por ejemplo: favorito con category="iglesia" → debe aparecer en ceremonia
              const category = SUPPLIER_CATEGORIES.find(c => 
                c.id === categoryId || 
                removeAccents(c.id.toLowerCase()) === normalizedCardKey ||
                removeAccents(c.name.toLowerCase()) === normalizedCardLabel
              );
              
              if (category && category.keywords) {
                // Verificar si favCategory es un keyword de esta categoría
                const isCategoryKeyword = category.keywords.some(keyword => {
                  const normalizedKeyword = removeAccents(keyword.toLowerCase());
                  return normalizedKeyword === normalizedFavCategory || 
                         normalizedFavCategory.includes(normalizedKeyword);
                });
                
                if (isCategoryKeyword) {
                  console.log(`✅ [MyServicesSection] Match por keyword: ${fav.supplier?.name} (${favCategory}) → ${card.label}`);
                  return true;
                }
                
                // 3. Si category es 'otros' o vacía, buscar por keywords en el nombre del proveedor
                if (normalizedFavCategory === 'otros' || !favCategory) {
                  const hasKeyword = category.keywords.some(keyword => {
                    const normalizedKeyword = removeAccents(keyword.toLowerCase());
                    return normalizedSupplierName.includes(normalizedKeyword);
                  });
                  
                  if (hasKeyword) {
                    console.log(`✅ [MyServicesSection] Match por keyword en nombre: ${fav.supplier?.name} → ${card.label}`);
                    return true;
                  }
                }
              }
              
              return false;
            });
            const favoritesCount = serviceFavorites.length;
            
            // Contar contactados (proveedores con estado)
            const contactedCount = card.providers?.length || 0;
            
            // Obtener presupuesto si existe
            const budgetAmount = card.confirmed?.price ? 
              parseFloat(card.confirmed.price.replace(/[^0-9.-]+/g, '')) : null;
            
            return (
              <ImprovedServiceCard
                key={card.key}
                service={{ id: categoryId, name: card.label }}
                confirmed={card.confirmed ? true : false}
                favoritesCount={favoritesCount}
                contactedCount={contactedCount}
                budgetAmount={budgetAmount}
                wedding={wedding}
                onSearch={() => onSearchService(card.label)}
                onViewFavorites={() => {
                  // Abrir modal con favoritos de esta categoría
                  setFavoritesModal({
                    open: true,
                    categoryId: categoryId,
                    categoryName: card.label,
                    favorites: serviceFavorites
                  });
                }}
                onViewDetails={async () => {
                  // Abrir modal con detalles de presupuestos, comunicaciones, etc.
                  try {
                    const stats = await getCategoryStats(card.key);
                    setQuotesModal({
                      open: true,
                      categoryId: card.key,
                      categoryName: card.label,
                      stats: stats
                    });
                  } catch (error) {
                    console.error('Error cargando stats:', error);
                  }
                }}
                onAutoFind={() => {
                  // Trigger auto-find para este servicio específico
                  onSearchService(card.label);
                }}
                onRequestQuote={() => {
                  // Buscar para solicitar presupuesto
                  onSearchService(card.label);
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Modal de favoritos por categoría */}
      <CategoryFavoritesModal
        isOpen={favoritesModal.open}
        onClose={() => setFavoritesModal({ open: false, categoryId: null, categoryName: '', favorites: [] })}
        categoryName={favoritesModal.categoryName}
        favorites={favoritesModal.favorites}
        onContact={(supplier) => {
          console.log('Contactar:', supplier);
        }}
        onViewDetails={(supplier) => {
          console.log('Ver detalles:', supplier);
        }}
      />

      {/* Modal de presupuestos y comunicaciones por categoría */}
      {quotesModal.open && (
        <CategoryQuotesModalV2
          category={quotesModal.categoryId}
          categoryLabel={quotesModal.categoryName}
          stats={quotesModal.stats || { stats: { contacted: 0, sent: 0, received: 0 } }}
          onClose={() => setQuotesModal({ open: false, categoryId: null, categoryName: '', stats: null })}
          onRefresh={async () => {
            console.log('🔄 [MyServicesSection] onRefresh llamado');
            try {
              // 1. Refrescar stats del modal
              console.log('📊 Refrescando stats...');
              const stats = await getCategoryStats(quotesModal.categoryId);
              setQuotesModal(prev => ({ ...prev, stats }));
              
              // 2. IMPORTANTE: Refrescar servicios de la boda para que se vea el cambio
              console.log('🔄 Refrescando servicios de la boda...');
              await refreshServices();
              console.log('✅ Servicios refrescados');
            } catch (error) {
              console.error('❌ Error refrescando:', error);
            }
          }}
        />
      )}
    </div>
  );
};

// Componente de Card de Servicio
const ServiceCard = ({ card, status, onSearch, onAddManual }) => {
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Cargar estadísticas de presupuestos para esta categoría
  useEffect(() => {
    const loadStats = async () => {
      if (!card.key) return;
      
      setLoadingStats(true);
      try {
        const result = await getCategoryStats(card.key);
        setStats(result);
      } catch (error) {
        console.error('Error cargando stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, [card.key]);
  
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
    <>
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
              <div>
                {stats?.acceptedQuote ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-semibold text-green-700">
                      CONTRATADO: {stats.acceptedQuote.supplierName} - {stats.acceptedQuote.totalPrice}€
                    </p>
                  </div>
                ) : stats && (stats.stats.contacted > 0 || stats.stats.sent > 0 || stats.stats.received > 0) ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {stats.stats.contacted} contactados
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {stats.stats.sent} enviados
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-600" />
                        {stats.stats.received} recibidos
                      </span>
                    </div>
                    {stats.stats.received > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-green-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${(stats.stats.received / stats.stats.sent) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aún no has contactado proveedores</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Botón de acción */}
        {status === 'pending' ? (
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                console.log('[MyServicesSection] Click Ver detalles:', {
                  category: card.key,
                  stats,
                  showModal
                });
                setShowModal(true);
              }}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Ver detalles
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

    {/* Modal de detalles de presupuestos */}
    {showModal && (
      <>
        {console.log('[MyServicesSection] Renderizando CategoryQuotesModalV2:', {
          showModal,
          hasStats: !!stats,
          category: card.key,
          statsData: stats
        })}
        <CategoryQuotesModalV2
          category={card.key}
          categoryLabel={card.label}
          stats={stats || { stats: { contacted: 0, sent: 0, received: 0 } }}
          onClose={() => {
            console.log('[MyServicesSection] Cerrando modal');
            setShowModal(false);
          }}
          onRefresh={() => {
            console.log('[MyServicesSection] Refrescando stats');
            getCategoryStats(card.key).then(setStats);
          }}
        />
      </>
    )}
    </>
  );
};

export default MyServicesSection;
