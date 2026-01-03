import React, { useState, useMemo, useEffect } from 'react';
import { X, CheckCircle, TrendingDown, Star, AlertCircle, DollarSign, Clock, Mail, MessageSquare, FileText, TrendingUp, Send, Plus, Calendar, ChevronDown, ChevronUp, ChevronRight, Paperclip, ArrowRight, ArrowLeft, Trash2, XCircle, Heart, ExternalLink, Sparkles } from 'lucide-react';
import Modal from '../Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';
import QuoteComparatorModal from './QuoteComparatorModal';
import QuoteDetailTabs from './QuoteDetailTabs';
import { getBackendUrl } from '../../config';
import { updateQuoteResponseStatus } from '../../services/quoteResponsesService';
import { cancelProviderQuoteRequests } from '../../services/quoteRequestsService';
import { getEmailsByProvider } from '../../services/emailsService';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useWeddingServices } from '../../hooks/useWeddingServices';
import useFinance from '../../hooks/useFinance';
import { normalizeBudgetCategoryKey } from '../../utils/budgetCategories';
import { toast } from 'react-toastify';

const CategoryQuotesModalV2 = ({ category, categoryLabel, stats, onClose, onRefresh }) => {
  const { assignSupplier } = useWeddingServices();
  const { budget, updateBudgetCategory } = useFinance();
  const { user } = useAuth();

  // Handlers para validación de IA
  const handleUpdateQuoteField = async (quoteId, fieldName, value) => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/quote-validation/${quoteId}/field`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fieldName, 
          value,
          userId: user?.uid 
        }),
      });

      if (!response.ok) {
        throw new Error('Error actualizando campo');
      }

      toast.success('Campo actualizado correctamente');
      
      // Refrescar datos si es necesario
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error actualizando campo:', error);
      toast.error('Error al actualizar el campo');
    }
  };

  const handleMarkAsValidated = async (quoteId, validationData) => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/quote-validation/${quoteId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validationData,
          userId: user?.uid,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message, { autoClose: 5000 });
        
        if (onRefresh) {
          onRefresh();
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error validando quote:', error);
      toast.error('Error al validar el presupuesto');
    }
  };
  // Agrupar datos por proveedor
  const providersList = useMemo(() => {
    const providersMap = new Map();

    // Normalizar nombre de proveedor para agrupación
    const normalizeProviderName = (name) => {
      if (!name) return 'unknown';
      return name.toLowerCase().trim().replace(/\s+/g, '-');
    };

    // Agrupar por nombre normalizado
    stats?.providers?.forEach(provider => {
      // Si el request está cancelado, no debe aparecer en la UI de proveedores
      if (provider?.status === 'cancelled' || provider?.status === 'canceled') {
        return;
      }

      const normalizedName = normalizeProviderName(provider.name);
      
      if (!providersMap.has(normalizedName)) {
        providersMap.set(normalizedName, {
          id: normalizedName, // ID único basado en nombre normalizado
          name: provider.name,
          email: provider.email || null,
          requests: [],
          quotes: [],
          status: 'pending',
        });
      }
      
      const p = providersMap.get(normalizedName);
      p.requests.push(provider);
      
      // Actualizar email si no lo tenía y ahora sí
      if (!p.email && provider.email) {
        p.email = provider.email;
      }
      
      // Determinar estado general
      if (provider.status === 'quoted' && p.status === 'pending') {
        p.status = 'quoted';
      }
    });

    // Añadir presupuestos a cada proveedor
    stats?.responses?.forEach(quote => {
      const normalizedQuoteName = normalizeProviderName(quote.supplierName);
      const matchingProvider = providersMap.get(normalizedQuoteName);
      
      if (matchingProvider) {
        matchingProvider.quotes.push(quote);
        if (quote.status === 'accepted') {
          matchingProvider.status = 'accepted';
        }
      }
    });

    // Si un proveedor no tiene requests activos ni quotes, no mostrar
    for (const [key, p] of providersMap.entries()) {
      if ((p.requests?.length || 0) === 0 && (p.quotes?.length || 0) === 0) {
        providersMap.delete(key);
      }
    }

    return Array.from(providersMap.values());
  }, [stats]);

  const hiddenProvidersStorageKey = useMemo(() => {
    const key = (category || categoryLabel || 'unknown').toString();
    return `mywed.hiddenProviders.${key}`;
  }, [category, categoryLabel]);

  const [hiddenProviderIds, setHiddenProviderIds] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(hiddenProvidersStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setHiddenProviderIds(parsed);
      }
    } catch {
      setHiddenProviderIds([]);
    }
  }, [hiddenProvidersStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(hiddenProvidersStorageKey, JSON.stringify(hiddenProviderIds || []));
    } catch {
      // ignore
    }
  }, [hiddenProvidersStorageKey, hiddenProviderIds]);

  const visibleProvidersList = useMemo(() => {
    if (!hiddenProviderIds?.length) return providersList;
    const hidden = new Set(hiddenProviderIds);
    return providersList.filter(p => !hidden.has(p.id));
  }, [providersList, hiddenProviderIds]);

  const [selectedProvider, setSelectedProvider] = useState(providersList[0]?.name || null);
  const [mainView, setMainView] = useState('provider'); // 'provider', 'compare', o 'favorites'
  const [selectedTab, setSelectedTab] = useState('quotes'); // quotes, conversation, notes
  const [selectedQuotesForComparison, setSelectedQuotesForComparison] = useState([]);
  const [showComparator, setShowComparator] = useState(false);
  const [notes, setNotes] = useState({});
  const [expandedQuotes, setExpandedQuotes] = useState({});
  const [selectedFavorites, setSelectedFavorites] = useState([]);
  
  // Favoritos
  const { favorites, loading: favoritesLoading, addFavorite, refreshFavorites } = useFavorites();
  const [isAutoFinding, setIsAutoFinding] = useState(false);
  const [isRequestingQuotes, setIsRequestingQuotes] = useState(false);
  
  // Filtrar favoritos por categoría actual
  const categoryFavorites = useMemo(() => {
    if (!favorites || !category) return [];
    const normalizedCategory = normalizeBudgetCategoryKey(category);
    return favorites.filter(fav => {
      const favCategory = normalizeBudgetCategoryKey(fav.supplier?.category || fav.supplier?.service || '');
      return favCategory === normalizedCategory;
    });
  }, [favorites, category]);

  const currentProvider = useMemo(() => {
    return visibleProvidersList.find(p => p.name === selectedProvider);
  }, [visibleProvidersList, selectedProvider]);

  useEffect(() => {
    if (!visibleProvidersList?.length) {
      if (selectedProvider) setSelectedProvider(null);
      return;
    }
    const stillVisible = visibleProvidersList.some(p => p.name === selectedProvider);
    if (!stillVisible) {
      setSelectedProvider(visibleProvidersList[0]?.name || null);
    }
  }, [visibleProvidersList, selectedProvider]);

  const toggleQuoteSelection = (quoteId) => {
    setSelectedQuotesForComparison(prev => 
      prev.includes(quoteId) 
        ? prev.filter(id => id !== quoteId)
        : [...prev, quoteId]
    );
  };

  const toggleQuoteExpand = (quoteId) => {
    setExpandedQuotes(prev => ({
      ...prev,
      [quoteId]: !prev[quoteId]
    }));
  };

  const getProviderStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return '⭐';
      case 'quoted': return '✅';
      case 'pending': return '⏳';
      default: return '○';
    }
  };

  const getProviderStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'text-yellow-600 bg-yellow-50';
      case 'quoted': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-gray-500 bg-gray-50';
      default: return 'text-gray-400 bg-gray-50';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    return date.toLocaleDateString('es-ES');
  };

  const handleAcceptQuote = async (quote) => {
    console.log('🎯 [handleAcceptQuote] INICIANDO - Quote:', quote);
    console.log('🎯 Category:', category);
    console.log('🎯 CategoryLabel:', categoryLabel);
    
    try {
      // 1. Marcar presupuesto como aceptado
      console.log('📝 [1] Marcando presupuesto como aceptado...');
      await updateQuoteResponseStatus(quote.id, 'accepted', 'Presupuesto aceptado');
      console.log('✅ [1] Presupuesto marcado como aceptado');
      
      // 2. Asignar proveedor automáticamente al servicio
      const supplierData = {
        id: quote.supplierId || quote.supplierName?.toLowerCase().replace(/\s+/g, '-'),
        name: quote.supplierName,
        contact: {
          email: quote.supplierEmail,
          phone: quote.supplierPhone,
        },
        email: quote.supplierEmail,
        phone: quote.supplierPhone,
      };
      
      // Intentar extraer precio de múltiples campos
      let price = quote.totalPrice || quote.amount || quote.price || 0;
      
      // Si aún no hay precio, buscar en servicesIncluded o items
      if (!price && quote.servicesIncluded && Array.isArray(quote.servicesIncluded)) {
        const priceMatch = JSON.stringify(quote.servicesIncluded).match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*€/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1].replace(',', ''));
        }
      }
      
      // Buscar en description o notes
      if (!price && quote.description) {
        const priceMatch = quote.description.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*€/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1].replace(',', ''));
        }
      }
      
      const notes = `Presupuesto aceptado - ${quote.description || ''}`;
      
      console.log('👤 [2] Asignando proveedor al servicio...');
      console.log('   - serviceId:', category);
      console.log('   - supplierData:', supplierData);
      console.log('   - price:', price, '(extraído de:', price > 0 ? 'quote data' : 'sin precio disponible)');
      console.log('   - quote completo:', quote);
      console.log('   - status: contratado');
      
      const assignResult = await assignSupplier(
        category,
        supplierData,
        price,
        notes,
        'contratado'
      );
      
      console.log('✅ [2] Proveedor asignado. Resultado:', assignResult);
      
      // 3. Actualizar presupuesto de finanzas
      console.log('💰 [3] Actualizando presupuesto de finanzas...');
      console.log('   - price:', price);
      console.log('   - budget.categories:', budget?.categories);
      
      if (price > 0) {
        const categories = budget?.categories || [];
        const existingIndex = categories.findIndex(
          (cat) => normalizeBudgetCategoryKey(cat.name) === normalizeBudgetCategoryKey(category)
        );
        
        console.log('   - existingIndex:', existingIndex);
        console.log('   - category normalizada:', normalizeBudgetCategoryKey(category));
        
        if (existingIndex >= 0) {
          // Actualizar categoría existente
          console.log('   - Actualizando categoría existente en índice:', existingIndex);
          updateBudgetCategory(existingIndex, { amount: price });
          console.log('✅ [3] Presupuesto actualizado');
        } else {
          console.log('⚠️ [3] Categoría no encontrada en presupuesto. No se actualiza.');
        }
      } else {
        console.log('⚠️ [3] Precio = 0, no se actualiza presupuesto');
        console.log('ℹ️ [3] NOTA: El proveedor se asignará de todos modos, solo sin precio');
      }
      
      console.log('🔔 [4] Mostrando notificación de éxito...');
      toast.success(
        <div>
          <div className="font-bold">✅ ¡Presupuesto aceptado!</div>
          <div className="text-sm">{quote.supplierName} contratado para {categoryLabel}</div>
          {price > 0 ? (
            <div className="text-sm">Presupuesto actualizado: {price}€</div>
          ) : (
            <div className="text-sm text-yellow-600">⚠️ Añade el precio manualmente</div>
          )}
        </div>,
        { autoClose: 5000 }
      );
      console.log('✅ [4] Notificación mostrada');
      
      // 4. Refrescar y cerrar modal
      console.log('🔄 [5] Llamando a onRefresh...');
      await onRefresh();
      console.log('✅ [5] onRefresh completado');
      
      console.log('🚪 [6] Cerrando modal en 1.5s...');
      setTimeout(() => {
        console.log('✅ [6] Modal cerrado');
        onClose();
      }, 1500);
      
      console.log('🎉 handleAcceptQuote COMPLETADO EXITOSAMENTE');
      
    } catch (error) {
      console.error('❌ [ERROR] Error aceptando presupuesto:', error);
      console.error('❌ Stack:', error.stack);
      toast.error(
        <div>
          <div className="font-bold">Error al aceptar presupuesto</div>
          <div className="text-sm">{error.message || 'Inténtalo de nuevo'}</div>
        </div>
      );
    }
  };

  const handleRejectQuote = async (quote) => {
    console.log('[handleRejectQuote] 🔄 Iniciando rechazo:', quote);
    
    if (!quote || !quote.id) {
      console.error('[handleRejectQuote] ❌ Quote inválido:', quote);
      toast.error('Error: Presupuesto no válido');
      return;
    }
    
    if (!confirm(`¿Rechazar el presupuesto de ${quote.supplierName}?`)) {
      console.log('[handleRejectQuote] ⏭️ Usuario canceló');
      return;
    }
    
    try {
      console.log('[handleRejectQuote] 📡 Llamando a updateQuoteResponseStatus...');
      const result = await updateQuoteResponseStatus(quote.id, 'rejected', 'Presupuesto rechazado');
      console.log('[handleRejectQuote] ✅ Presupuesto rechazado:', result);
      
      toast.success(`❌ Presupuesto de ${quote.supplierName} rechazado`);
      
      console.log('[handleRejectQuote] 🔄 Llamando a onRefresh...');
      if (onRefresh && typeof onRefresh === 'function') {
        await onRefresh();
        console.log('[handleRejectQuote] ✅ onRefresh completado');
      } else {
        console.warn('[handleRejectQuote] ⚠️ onRefresh no disponible');
      }
    } catch (error) {
      console.error('[handleRejectQuote] 💥 Error rechazando presupuesto:', error);
      toast.error(`Error al rechazar el presupuesto: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleRestoreQuote = async (quote) => {
    console.log('[handleRestoreQuote] 🔄 Iniciando restauración:', quote);
    
    if (!quote || !quote.id) {
      console.error('[handleRestoreQuote] ❌ Quote inválido:', quote);
      toast.error('Error: Presupuesto no válido');
      return;
    }
    
    if (!confirm(`¿Restaurar el presupuesto de ${quote.supplierName}?`)) {
      console.log('[handleRestoreQuote] ⏭️ Usuario canceló');
      return;
    }
    
    try {
      console.log('[handleRestoreQuote] 📡 Llamando a updateQuoteResponseStatus...');
      const result = await updateQuoteResponseStatus(quote.id, 'received', 'Presupuesto restaurado');
      console.log('[handleRestoreQuote] ✅ Presupuesto restaurado:', result);
      
      toast.success(`🔄 Presupuesto de ${quote.supplierName} restaurado`);
      
      console.log('[handleRestoreQuote] 🔄 Llamando a onRefresh...');
      if (onRefresh && typeof onRefresh === 'function') {
        await onRefresh();
        console.log('[handleRestoreQuote] ✅ onRefresh completado');
      } else {
        console.warn('[handleRestoreQuote] ⚠️ onRefresh no disponible');
      }
    } catch (error) {
      console.error('[handleRestoreQuote] 💥 Error restaurando presupuesto:', error);
      toast.error(`Error al restaurar el presupuesto: ${error.message || 'Error desconocido'}`);
    }
  };

  // Handler para buscar automáticamente 3 proveedores y añadirlos a favoritos
  const handleAutoFindProviders = async () => {
    if (!category) return;
    
    if (!confirm(`¿Buscar automáticamente 3 proveedores recomendados de ${categoryLabel} y añadirlos a favoritos?`)) {
      return;
    }

    setIsAutoFinding(true);
    try {
      // Importar dinámicamente el servicio de búsqueda
      const { searchSuppliersHybrid } = await import('../../services/suppliersService');
      
      // Buscar proveedores usando el servicio híbrido
      const searchResults = await searchSuppliersHybrid({
        query: categoryLabel || category,
        limit: 3,
        category: category,
      });

      if (!searchResults || searchResults.length === 0) {
        toast.info(`No se encontraron proveedores de ${categoryLabel}`);
        return;
      }

      // Añadir cada proveedor encontrado a favoritos
      let addedCount = 0;
      for (const supplier of searchResults.slice(0, 3)) {
        try {
          await addFavorite(supplier, `Añadido automáticamente`);
          addedCount++;
        } catch (error) {
          // Si ya existe, continuar con el siguiente
          if (error.message?.includes('existe')) {
            console.log(`Proveedor ${supplier.name} ya estaba en favoritos`);
          }
        }
      }

      if (addedCount > 0) {
        toast.success(`✅ ${addedCount} proveedor${addedCount > 1 ? 'es' : ''} añadido${addedCount > 1 ? 's' : ''} a favoritos`);
        await refreshFavorites(true);
      } else {
        toast.info('Los proveedores encontrados ya estaban en favoritos');
      }
    } catch (error) {
      console.error('[AutoFind] Error:', error);
      toast.error(`Error al buscar proveedores: ${error.message}`);
    } finally {
      setIsAutoFinding(false);
    }
  };

  // Handler para solicitar presupuestos a favoritos seleccionados
  const handleRequestQuotesForSelected = async () => {
    if (selectedFavorites.length === 0) {
      toast.warning('Selecciona al menos un proveedor favorito');
      return;
    }

    const selectedFavs = categoryFavorites.filter(fav => selectedFavorites.includes(fav.id));

    if (!confirm(`¿Enviar solicitud de presupuesto a los ${selectedFavs.length} proveedores seleccionados?\n\nSe creará una solicitud individual para cada proveedor.`)) {
      return;
    }

    setIsRequestingQuotes(true);
    try {
      const { createQuoteRequest } = await import('../../services/quoteRequestsService');
      
      let successCount = 0;
      let errorCount = 0;

      for (const fav of selectedFavs) {
        const supplier = fav.supplier || {};
        
        try {
          await createQuoteRequest({
            supplierId: supplier.id || supplier.slug,
            supplierName: supplier.name,
            supplierEmail: supplier.contact?.email,
            category: category,
            service: categoryLabel,
            message: `Solicitud de presupuesto para ${categoryLabel}`,
            urgent: false,
          });
          successCount++;
        } catch (error) {
          console.error(`Error enviando solicitud a ${supplier.name}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`✅ ${successCount} solicitud${successCount > 1 ? 'es' : ''} enviada${successCount > 1 ? 's' : ''} correctamente`);
        setSelectedFavorites([]);
        if (onRefresh) onRefresh();
      }
      
      if (errorCount > 0) {
        toast.warning(`⚠️ ${errorCount} solicitud${errorCount > 1 ? 'es' : ''} no pudo${errorCount > 1 ? 'ieron' : ''} enviarse`);
      }
    } catch (error) {
      console.error('[RequestQuotes] Error:', error);
      toast.error(`Error al enviar solicitudes: ${error.message}`);
    } finally {
      setIsRequestingQuotes(false);
    }
  };

  const handleDeleteProvider = async (provider) => {
    const supplierId = provider?.requests?.[0]?.id || null;
    const supplierEmail = provider?.email || null;

    console.log('[handleDeleteProvider] 🗑️ Iniciando eliminación:', provider);
    console.log('[handleDeleteProvider] cancel-provider payload:', { supplierId, supplierEmail });
    console.log('[handleDeleteProvider] Presupuestos a rechazar:', provider.quotes.length);
    
    if (!confirm(`¿Eliminar todas las solicitudes y presupuestos de ${provider.name}?\n\nEsta acción no se puede deshacer.`)) {
      console.log('[handleDeleteProvider] ❌ Usuario canceló');
      return;
    }

    // Ocultación optimista en UI (no depender del backend)
    setHiddenProviderIds(prev => (prev.includes(provider.id) ? prev : [...prev, provider.id]));

    // Si era el proveedor seleccionado, cambiar a otro visible inmediatamente
    if (selectedProvider === provider.name) {
      const next = visibleProvidersList.find(p => p.name !== provider.name);
      setSelectedProvider(next?.name || null);
    }

    try {
      const results = {
        cancelled: 0,
        cancelledErrors: 0,
        rejectedQuotes: 0,
        rejectedErrors: 0,
      };

      // Cancelar solicitudes del proveedor en backend (una sola llamada)
      try {
        const r = await cancelProviderQuoteRequests({ supplierId, supplierEmail });
        results.cancelled = r?.result?.cancelled || 0;
        console.log('[handleDeleteProvider] cancel-provider result:', r);
      } catch (err) {
        results.cancelledErrors++;
        console.warn('[handleDeleteProvider] ⚠️ Error cancel-provider:', err?.message || err);
      }
      
      // Rechazar todos los presupuestos del proveedor (individualmente con try-catch)
      if (provider.quotes.length > 0) {
        console.log('[handleDeleteProvider] 💰 Rechazando', provider.quotes.length, 'presupuestos...');
        for (const quote of provider.quotes) {
          try {
            console.log('[handleDeleteProvider] Rechazando quote:', quote.id);
            await updateQuoteResponseStatus(quote.id, 'rejected', 'Proveedor eliminado');
            results.rejectedQuotes++;
          } catch (err) {
            console.warn('[handleDeleteProvider] ⚠️ Error rechazando quote:', quote.id, err.message);
            results.rejectedErrors++;
          }
        }
      }
      
      console.log('[handleDeleteProvider] 📊 Resultados:', results);
      
      // Refrescar SIEMPRE, incluso si hubo errores
      onRefresh();
      
      // Mensaje según resultados
      if (results.cancelledErrors === 0 && results.rejectedErrors === 0) {
        toast.success(`🗑️ ${provider.name} eliminado completamente`);
      } else {
        toast.warning(`⚠️ ${provider.name} eliminado parcialmente (solicitudes canceladas: ${results.cancelled}, presupuestos rechazados: ${results.rejectedQuotes})`);
      }
    } catch (error) {
      console.error('[handleDeleteProvider] 💥 Error crítico:', error);
      toast.error(`Error inesperado: ${error.message}`);
      onRefresh(); // Refrescar de todas formas
    }
  };

  const allSelectedQuotes = useMemo(() => {
    return stats?.responses?.filter(q => selectedQuotesForComparison.includes(q.id)) || [];
  }, [stats, selectedQuotesForComparison]);

  return (
    <>
      <Modal open={true} onClose={onClose} size="full">
        <div className="flex flex-col h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{categoryLabel}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {visibleProvidersList.length} proveedores | {stats?.stats?.sent || 0} solicitudes | {stats?.stats?.received || 0} presupuestos
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Vista Principal: Proveedores vs Comparar vs Favoritos */}
          <div className="flex gap-4 p-4 border-b">
            <button
              onClick={() => setMainView('provider')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                mainView === 'provider'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              Proveedores Contactados
            </button>
            <button
              onClick={() => setMainView('compare')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                mainView === 'compare'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Comparar Presupuestos
              {selectedQuotesForComparison.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-white/30 text-white text-xs rounded-full font-bold">
                  {selectedQuotesForComparison.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setMainView('favorites')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                mainView === 'favorites'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Heart className="w-5 h-5" />
              Favoritos
              {categoryFavorites.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-white/30 text-white text-xs rounded-full font-bold">
                  {categoryFavorites.length}
                </span>
              )}
            </button>
          </div>

          {/* Pestañas de Proveedores (solo si mainView === 'provider') */}
          {mainView === 'provider' && (
            <div className="flex gap-2 p-4 border-b overflow-x-auto">
              {visibleProvidersList.map(provider => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedProvider === provider.name
                      ? 'bg-blue-600 text-white'
                      : `${getProviderStatusColor(provider.status)} hover:bg-gray-100`
                  }`}
                >
                  <span className="text-lg">{getProviderStatusIcon(provider.status)}</span>
                  <span className="font-medium">{provider.name}</span>
                  {provider.quotes.length > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedProvider === provider.name 
                        ? 'bg-white/20' 
                        : 'bg-white'
                    }`}>
                      {provider.quotes.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Contenido: Vista de Proveedores */}
          {mainView === 'provider' && currentProvider && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Info del proveedor */}
              <div className="px-4 py-3 bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{currentProvider.name}</h3>
                    <p className="text-sm text-gray-600">{currentProvider.email || 'Sin email'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {currentProvider.status === 'quoted' && (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Respondió {formatDate(currentProvider.quotes[0]?.receivedAt)}
                      </span>
                    )}
                    {currentProvider.status === 'pending' && (
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Pendiente
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProvider(currentProvider)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Eliminar proveedor
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sub-pestañas del proveedor */}
              <div className="flex gap-1 px-4 pt-4 border-b">
                <button
                  onClick={() => setSelectedTab('quotes')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                    selectedTab === 'quotes'
                      ? 'bg-white border-t border-x text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Presupuestos ({currentProvider.quotes.length})
                </button>
                <button
                  onClick={() => setSelectedTab('conversation')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                    selectedTab === 'conversation'
                      ? 'bg-white border-t border-x text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Conversación
                </button>
                <button
                  onClick={() => setSelectedTab('notes')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                    selectedTab === 'notes'
                      ? 'bg-white border-t border-x text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Notas
                </button>
              </div>

              {/* Contenido de las sub-pestañas del proveedor */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {selectedTab === 'quotes' && (
                  <QuotesTab
                    provider={currentProvider}
                    selectedQuotes={selectedQuotesForComparison}
                    expandedQuotes={expandedQuotes}
                    onToggleSelection={toggleQuoteSelection}
                    onToggleExpand={toggleQuoteExpand}
                    onAcceptQuote={handleAcceptQuote}
                    onRejectQuote={handleRejectQuote}
                    onRestoreQuote={handleRestoreQuote}
                    formatDate={formatDate}
                  />
                )}

                {selectedTab === 'conversation' && (
                  <ConversationTab
                    provider={currentProvider}
                    formatDate={formatDate}
                  />
                )}

                {selectedTab === 'notes' && (
                  <NotesTab
                    provider={currentProvider}
                    notes={notes[currentProvider.name] || ''}
                    onNotesChange={(value) => setNotes(prev => ({
                      ...prev,
                      [currentProvider.name]: value
                    }))}
                  />
                )}
              </div>
            </div>
          )}

          {/* Contenido: Vista de Comparación Global */}
          {mainView === 'compare' && (
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <CompareTab
                providersList={visibleProvidersList}
                selectedQuotes={selectedQuotesForComparison}
                onToggleSelection={toggleQuoteSelection}
                onAcceptQuote={handleAcceptQuote}
                onSwitchToProvider={(providerName) => {
                  setMainView('provider');
                  setSelectedProvider(providerName);
                  setSelectedTab('quotes');
                }}
              />
            </div>
          )}

          {/* Contenido: Vista de Favoritos */}
          {mainView === 'favorites' && (
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <FavoritesTab
                favorites={categoryFavorites}
                categoryLabel={categoryLabel}
                category={category}
                loading={favoritesLoading}
                onRequestQuotesForSelected={handleRequestQuotesForSelected}
                isRequestingQuotes={isRequestingQuotes}
                selectedFavorites={selectedFavorites}
                onToggleSelection={(favId) => {
                  setSelectedFavorites(prev => 
                    prev.includes(favId) 
                      ? prev.filter(id => id !== favId)
                      : [...prev, favId]
                  );
                }}
                onSelectAll={() => setSelectedFavorites(categoryFavorites.map(f => f.id))}
                onDeselectAll={() => setSelectedFavorites([])}
              />
            </div>
          )}

          {/* Botón flotante para ir a comparar (solo en vista de proveedores) */}
          {selectedQuotesForComparison.length > 0 && mainView === 'provider' && (
            <div className="fixed bottom-6 right-6 z-50">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setMainView('compare')}
                className="shadow-lg hover:shadow-xl transition-shadow"
                leftIcon={<TrendingUp className="w-5 h-5" />}
              >
                ✓ {selectedQuotesForComparison.length} seleccionados - Comparar
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal comparador */}
      {showComparator && allSelectedQuotes.length > 0 && (
        <QuoteComparatorModal
          quotes={allSelectedQuotes}
          onClose={() => setShowComparator(false)}
          onQuoteAccepted={(quote) => {
            setShowComparator(false);
            setSelectedQuotesForComparison([]);
            onRefresh();
          }}
        />
      )}
    </>
  );
};

// Tab de Presupuestos
const QuotesTab = ({ provider, selectedQuotes, expandedQuotes, onToggleSelection, onToggleExpand, onAcceptQuote, onRejectQuote, onRestoreQuote, formatDate }) => {
  const [showRejected, setShowRejected] = React.useState(false);

  if (provider.quotes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-600">No hay presupuestos recibidos aún</p>
        <p className="text-sm text-gray-500 mt-1">
          Solicitud enviada {formatDate(provider.requests[0]?.sentAt)}
        </p>
      </Card>
    );
  }

  // Separar presupuestos activos de rechazados
  const activeQuotes = provider.quotes.filter(q => q.status !== 'rejected');
  const rejectedQuotes = provider.quotes.filter(q => q.status === 'rejected');

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 mb-4">
        ✅ {activeQuotes.length} presupuesto{activeQuotes.length !== 1 ? 's' : ''} activo{activeQuotes.length !== 1 ? 's' : ''}
        {rejectedQuotes.length > 0 && (
          <span className="text-gray-400 ml-2">({rejectedQuotes.length} rechazado{rejectedQuotes.length !== 1 ? 's' : ''})</span>
        )}
      </p>

      {/* Presupuestos activos */}
      {activeQuotes.map((quote, index) => (
        <Card key={quote.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            {/* Checkbox de selección */}
            <input
              type="checkbox"
              checked={selectedQuotes.includes(quote.id)}
              onChange={() => onToggleSelection(quote.id)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />

            <div className="flex-1">
              {/* Header del presupuesto */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Opción {index + 1}
                    {quote.totalPrice && (
                      <span className="ml-2 text-2xl text-green-600">
                        {quote.totalPrice}€
                      </span>
                    )}
                  </h4>
                  {quote.confidence && (
                    <p className="text-xs text-gray-500 mt-1">
                      Confianza IA: {quote.confidence}%
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onToggleExpand(quote.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {expandedQuotes[quote.id] ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>

              {/* Preview de servicios */}
              {quote.servicesIncluded && quote.servicesIncluded.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    {quote.servicesIncluded.slice(0, expandedQuotes[quote.id] ? undefined : 3).map((service, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                        {service}
                      </span>
                    ))}
                    {!expandedQuotes[quote.id] && quote.servicesIncluded.length > 3 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        +{quote.servicesIncluded.length - 3} más
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Detalle expandido con pestañas */}
              {expandedQuotes[quote.id] && (
                <QuoteDetailTabs 
                  quote={quote} 
                  formatDate={formatDate}
                  onUpdateQuote={handleUpdateQuoteField}
                  onMarkAsValidated={handleMarkAsValidated}
                />
              )}

              {/* Acciones */}
              <div className="flex gap-2 mt-3">
                {quote.status !== 'accepted' && quote.status !== 'rejected' && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onAcceptQuote(quote)}
                    >
                      Aceptar presupuesto
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRejectQuote(quote)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      leftIcon={<XCircle className="w-4 h-4" />}
                    >
                      Rechazar
                    </Button>
                  </>
                )}
                {quote.status === 'accepted' && (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    CONTRATADO
                  </div>
                )}
                {quote.status === 'rejected' && (
                  <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                    <XCircle className="w-4 h-4" />
                    RECHAZADO
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}

      {/* Sección colapsable de rechazados */}
      {rejectedQuotes.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowRejected(!showRejected)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors w-full"
          >
            {showRejected ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <span>Presupuestos rechazados ({rejectedQuotes.length})</span>
          </button>

          {showRejected && (
            <div className="mt-3 space-y-2">
              {rejectedQuotes.map((quote, index) => (
                <Card key={quote.id} className="p-3 opacity-50 hover:opacity-70 transition-opacity bg-gray-50">
                  <div className="flex items-center gap-3">
                    {/* Versión compacta sin checkbox */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h4 className="text-sm font-medium text-gray-700">
                            Opción {provider.quotes.indexOf(quote) + 1}
                          </h4>
                          {quote.totalPrice && (
                            <span className="text-lg font-semibold text-gray-600">
                              {quote.totalPrice}€
                            </span>
                          )}
                          <div className="flex items-center gap-1 text-red-500 text-xs">
                            <XCircle className="w-3 h-3" />
                            <span>Rechazado</span>
                          </div>
                        </div>
                        
                        {/* Botón restaurar */}
                        <button
                          onClick={() => onRestoreQuote(quote)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-1"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          Restaurar
                        </button>
                      </div>

                      {/* Preview compacto de servicios */}
                      {quote.servicesIncluded && quote.servicesIncluded.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {quote.servicesIncluded.slice(0, 3).map((service, idx) => (
                            <span key={idx} className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                              {service}
                            </span>
                          ))}
                          {quote.servicesIncluded.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{quote.servicesIncluded.length - 3} más
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Tab de Conversación - SIMPLIFICADO usando datos que ya tenemos
const ConversationTab = ({ provider, formatDate }) => {
  // Crear timeline con los datos que YA tenemos
  const timeline = useMemo(() => {
    const events = [];
    
    // Solicitudes enviadas
    provider.requests.forEach(req => {
      events.push({
        type: 'sent',
        date: req.sentAt,
        title: 'Solicitud de presupuesto enviada',
        description: `Enviaste una solicitud a ${provider.name}`,
        icon: Send,
        color: 'blue',
      });
    });

    // Respuestas recibidas
    provider.quotes.forEach(quote => {
      events.push({
        type: 'received',
        date: quote.receivedAt,
        title: `Presupuesto recibido${quote.totalPrice ? ` - ${quote.totalPrice}€` : ''}`,
        description: quote.servicesIncluded?.slice(0, 3).join(', ') || 'Ver detalles en pestaña Presupuestos',
        icon: Mail,
        color: 'green',
      });
    });

    // Ordenar por fecha (más reciente primero)
    return events.sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
      return dateB - dateA;
    });
  }, [provider]);

  if (timeline.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="p-8 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-600">No hay comunicaciones registradas</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Timeline de comunicaciones con {provider.name}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {timeline.length} evento{timeline.length > 1 ? 's' : ''} registrado{timeline.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-3">
        {timeline.map((event, index) => {
          const Icon = event.icon;
          const colorClasses = {
            blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
            green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
          };
          const colors = colorClasses[event.color];

          return (
            <Card key={index} className={`p-4 border-l-4 ${colors.border}`}>
              <div className="flex gap-3">
                <div className={`p-2 rounded-full ${colors.bg} flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {formatDate(event.date)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{event.description}</p>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-0.5 ${colors.bg} ${colors.text} rounded`}>
                      {event.type === 'sent' ? 'Enviado' : 'Recibido'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200 mt-4">
        <div className="flex items-start gap-2">
          <Mail className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">💡 Información</p>
            <p className="text-xs">
              Este timeline muestra las solicitudes enviadas y presupuestos recibidos. 
              Para ver detalles completos, consulta la pestaña "Presupuestos".
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Tab de Notas
const NotesTab = ({ provider, notes, onNotesChange }) => {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 mb-4">
        Notas internas sobre {provider.name} (solo visible para ti)
      </p>

      <Card className="p-4">
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Escribe tus notas aquí..."
          className="w-full min-h-[200px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <div className="flex justify-between items-center mt-3">
          <p className="text-xs text-gray-500">
            {notes.length} caracteres
          </p>
          <Button variant="primary" size="sm">
            Guardar notas
          </Button>
        </div>
      </Card>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-900 font-medium mb-2">💡 Sugerencias:</p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Pros y contras del proveedor</li>
          <li>• Impresiones de la comunicación</li>
          <li>• Detalles importantes a considerar</li>
          <li>• Preguntas pendientes</li>
        </ul>
      </Card>
    </div>
  );
};

// Tab de Comparación
const CompareTab = ({ providersList, selectedQuotes, onToggleSelection, onAcceptQuote, onSwitchToProvider }) => {
  // Obtener todos los presupuestos de todos los proveedores
  const allQuotes = useMemo(() => {
    const quotes = [];
    providersList.forEach(provider => {
      provider.quotes.forEach(quote => {
        quotes.push({
          ...quote,
          providerName: provider.name,
          providerEmail: provider.email,
          providerId: provider.id,
        });
      });
    });
    return quotes;
  }, [providersList]);

  // Presupuestos seleccionados para comparar
  const quotesToCompare = useMemo(() => {
    return allQuotes.filter(q => selectedQuotes.includes(q.id)).slice(0, 3);
  }, [allQuotes, selectedQuotes]);

  // Calcular mejor precio
  const bestPrice = useMemo(() => {
    const prices = quotesToCompare
      .map(q => q.totalPrice)
      .filter(p => p && p > 0);
    return prices.length > 0 ? Math.min(...prices) : null;
  }, [quotesToCompare]);

  // Calcular puntuación y recomendación
  const getQuoteScore = (quote) => {
    let score = 0;
    const reasons = [];

    if (quote.totalPrice && quote.totalPrice === bestPrice) {
      score += 40;
      reasons.push('Mejor precio');
    }

    if (quote.confidence >= 90) {
      score += 20;
      reasons.push('Alta precisión IA');
    }

    if (quote.servicesIncluded && quote.servicesIncluded.length >= 5) {
      score += 20;
      reasons.push('Más servicios incluidos');
    }

    if (quote.paymentTerms && (
      quote.paymentTerms.toLowerCase().includes('30%') ||
      quote.paymentTerms.toLowerCase().includes('flexible')
    )) {
      score += 10;
      reasons.push('Condiciones de pago favorables');
    }

    if (quote.cancellationPolicy && (
      quote.cancellationPolicy.toLowerCase().includes('flexible') ||
      quote.cancellationPolicy.toLowerCase().includes('gratis')
    )) {
      score += 10;
      reasons.push('Cancelación flexible');
    }

    return { score, reasons };
  };

  const quotesWithScores = useMemo(() => {
    return quotesToCompare.map(q => ({
      ...q,
      ...getQuoteScore(q),
    }));
  }, [quotesToCompare, bestPrice]);

  const bestQuote = useMemo(() => {
    if (quotesWithScores.length === 0) return null;
    return quotesWithScores.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  }, [quotesWithScores]);

  if (selectedQuotes.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Selecciona presupuestos para comparar
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Ve a la pestaña "Presupuestos" de cada proveedor y marca los checkboxes de los presupuestos que quieras comparar
        </p>
        <Card className="max-w-md mx-auto p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-900">
            💡 <strong>Tip:</strong> Puedes comparar hasta 3 presupuestos de diferentes proveedores
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Comparación de Presupuestos
          </h3>
          <p className="text-sm text-gray-600">
            {quotesToCompare.length} presupuesto{quotesToCompare.length > 1 ? 's' : ''} seleccionado{quotesToCompare.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Lista de presupuestos disponibles */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Presupuestos disponibles para comparar:
        </p>
        <div className="flex flex-wrap gap-2">
          {allQuotes.map(quote => (
            <button
              key={quote.id}
              onClick={() => onToggleSelection(quote.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedQuotes.includes(quote.id)
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedQuotes.includes(quote.id)}
                  onChange={() => {}}
                  className="w-4 h-4"
                />
                <div className="text-left">
                  <div className="font-semibold">{quote.providerName}</div>
                  <div className="text-xs opacity-75">
                    {quote.totalPrice ? `${quote.totalPrice}€` : 'Sin precio'}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Comparación lado a lado */}
      {quotesToCompare.length > 0 && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${quotesToCompare.length}, minmax(0, 1fr))` }}>
          {quotesWithScores.map(quote => {
            const isRecommended = bestQuote?.id === quote.id;

            return (
              <Card
                key={quote.id}
                className={`p-4 ${isRecommended ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
              >
                {/* Badge recomendado */}
                {isRecommended && (
                  <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-green-100 rounded-full w-fit">
                    <Star className="w-4 h-4 text-green-600 fill-green-600" />
                    <span className="text-xs font-semibold text-green-700">
                      RECOMENDADO
                    </span>
                  </div>
                )}

                {/* Proveedor con link */}
                <button
                  onClick={() => onSwitchToProvider(quote.providerName)}
                  className="text-left w-full mb-2 hover:text-blue-600 transition-colors"
                >
                  <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    {quote.providerName}
                    <ChevronRight className="w-4 h-4" />
                  </h3>
                  {quote.providerEmail && (
                    <p className="text-xs text-gray-500">{quote.providerEmail}</p>
                  )}
                </button>

                {/* Precio */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold ${
                      quote.totalPrice === bestPrice ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {quote.totalPrice || 'N/A'}€
                    </span>
                    {quote.totalPrice === bestPrice && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <TrendingDown className="w-3 h-3" />
                        Mejor precio
                      </div>
                    )}
                  </div>
                  {quote.confidence && (
                    <p className="text-xs text-gray-500 mt-1">
                      Confianza IA: {quote.confidence}%
                    </p>
                  )}
                </div>

                {/* Puntuación */}
                <div className="mb-4 p-3 bg-white rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700">
                      Puntuación:
                    </span>
                    <span className={`text-lg font-bold ${
                      isRecommended ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {quote.score}/100
                    </span>
                  </div>
                  <div className="space-y-1">
                    {quote.reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        {reason}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Servicios incluidos */}
                {quote.servicesIncluded && quote.servicesIncluded.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Servicios incluidos:
                    </p>
                    <div className="space-y-1">
                      {quote.servicesIncluded.slice(0, 4).map((service, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{service}</span>
                        </div>
                      ))}
                      {quote.servicesIncluded.length > 4 && (
                        <p className="text-xs text-gray-500 ml-5">
                          +{quote.servicesIncluded.length - 4} más
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Condiciones */}
                <div className="space-y-2 mb-4 pt-4 border-t">
                  {quote.paymentTerms && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Pago:</p>
                      <p className="text-xs text-gray-600">{quote.paymentTerms}</p>
                    </div>
                  )}
                  {quote.cancellationPolicy && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Cancelación:</p>
                      <p className="text-xs text-gray-600">{quote.cancellationPolicy}</p>
                    </div>
                  )}
                </div>

                {/* Botón de acción */}
                <Button
                  variant={isRecommended ? 'primary' : 'outline'}
                  className="w-full"
                  onClick={() => onAcceptQuote(quote)}
                >
                  Aceptar presupuesto
                </Button>

                {/* Botón ver detalles */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => onSwitchToProvider(quote.providerName)}
                >
                  Ver detalles completos
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info adicional */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">💡 Sistema de Puntuación:</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Mejor precio:</strong> +40 puntos</li>
              <li>• <strong>Alta precisión IA (≥90%):</strong> +20 puntos</li>
              <li>• <strong>Más servicios incluidos (≥5):</strong> +20 puntos</li>
              <li>• <strong>Condiciones de pago favorables:</strong> +10 puntos</li>
              <li>• <strong>Cancelación flexible:</strong> +10 puntos</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Tab de Favoritos
const FavoritesTab = ({ favorites, categoryLabel, category, loading, onRequestQuotesForSelected, isRequestingQuotes, selectedFavorites, onToggleSelection, onSelectAll, onDeselectAll }) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando favoritos...</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No hay proveedores favoritos en {categoryLabel}
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Guarda proveedores haciendo clic en el ❤️ cuando busques proveedores o usa la búsqueda automática
        </p>
        <Card className="max-w-md mx-auto p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-900">
            💡 <strong>Tip:</strong> Los favoritos guardados aparecerán aquí filtrados por categoría
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con botones de acción */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Proveedores Favoritos - {categoryLabel}
            </h3>
            <p className="text-sm text-gray-600">
              {favorites.length} proveedor{favorites.length > 1 ? 'es' : ''} guardado{favorites.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {/* Botones de acción */}
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSelectAll}
                disabled={favorites.length === 0}
              >
                Seleccionar todos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeselectAll}
                disabled={selectedFavorites.length === 0}
              >
                Deseleccionar
              </Button>
            </div>
            <Button
              variant="primary"
              onClick={onRequestQuotesForSelected}
              disabled={isRequestingQuotes || selectedFavorites.length === 0}
              leftIcon={isRequestingQuotes ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Send className="w-4 w-4" />}
              className="flex-1"
            >
              {isRequestingQuotes ? `Enviando ${selectedFavorites.length} solicitudes...` : `📨 Solicitar presupuesto (${selectedFavorites.length} seleccionados)`}
            </Button>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            💡 Selecciona los proveedores y solicita presupuesto solo a los que te interesen.
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {favorites.map((fav) => {
          const supplier = fav.supplier || {};
          return (
            <Card key={fav.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3">
                {/* Checkbox de selección */}
                <input
                  type="checkbox"
                  checked={selectedFavorites.includes(fav.id)}
                  onChange={() => onToggleSelection(fav.id)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-red-600 fill-red-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">
                    {supplier.name || 'Proveedor sin nombre'}
                  </h4>
                  
                  {supplier.category && (
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">
                      {supplier.category}
                    </p>
                  )}

                  {supplier.contact?.email && (
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      📧 {supplier.contact.email}
                    </p>
                  )}

                  {supplier.contact?.phone && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      📞 {supplier.contact.phone}
                    </p>
                  )}

                  {supplier.location?.city && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      📍 {supplier.location.city}
                    </p>
                  )}

                  {supplier.metrics?.rating > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {supplier.metrics.rating}
                      </span>
                      {supplier.metrics.reviewCount > 0 && (
                        <span className="text-xs text-gray-500">
                          ({supplier.metrics.reviewCount} reseñas)
                        </span>
                      )}
                    </div>
                  )}

                  {fav.notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                      <p className="font-medium text-gray-900 mb-1">Notas:</p>
                      <p className="line-clamp-2">{fav.notes}</p>
                    </div>
                  )}

                  {fav.createdAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      Guardado el {new Date(fav.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {supplier.contact?.website && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(supplier.contact.website, '_blank')}
                    rightIcon={<ExternalLink className="w-3 h-3" />}
                  >
                    Web
                  </Button>
                )}
                {supplier.contact?.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(`tel:${supplier.contact.phone}`, '_blank')}
                  >
                    Llamar
                  </Button>
                )}
                {supplier.contact?.email && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(`mailto:${supplier.contact.email}`, '_blank')}
                  >
                    Email
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryQuotesModalV2;
