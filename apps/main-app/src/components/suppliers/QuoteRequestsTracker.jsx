/**
 * 📋 QuoteRequestsTracker - Ver presupuestos solicitados
 *
 * Muestra una lista de todos los presupuestos que el usuario ha solicitado
 * con su estado actual y permite hacer seguimiento.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  GitCompare,
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useWedding } from '../../context/WeddingContext';
import { useWeddingServices } from '../../hooks/useWeddingServices';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import QuoteComparator from './QuoteComparator';
import { toast } from 'react-toastify';

export default function QuoteRequestsTracker() {
  const { user } = useAuth();
  const { activeWedding } = useWedding();
  const { assignSupplier } = useWeddingServices();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, contacted, quoted
  const [showComparator, setShowComparator] = useState(false);
  const [comparingCategory, setComparingCategory] = useState(null);

  const loadQuoteRequests = useCallback(async () => {
    if (!user || !activeWedding) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const allRequests = [];

      // 1. Buscar en solicitudes de proveedores REGISTRADOS
      const suppliersSnapshot = await getDocs(collection(db, 'suppliers'));

      for (const supplierDoc of suppliersSnapshot.docs) {
        const quoteRequestsRef = collection(db, 'suppliers', supplierDoc.id, 'quote-requests');

        try {
          const q = query(
            quoteRequestsRef,
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );

          const snapshot = await getDocs(q);

          snapshot.forEach((doc) => {
            allRequests.push({
              id: doc.id,
              supplierId: supplierDoc.id,
              isRegistered: true,
              ...doc.data(),
            });
          });
        } catch (err) {
          // Puede fallar si no existe el índice, continuar con el siguiente
          // console.warn('Error en proveedor', supplierDoc.id, err);
        }
      }

      // 2. Buscar en solicitudes de proveedores de INTERNET (Google Places)
      try {
        const internetRequestsRef = collection(db, 'quote-requests-internet');
        const qInternet = query(
          internetRequestsRef,
          where('userId', '==', user.uid)
          // NOTE: orderBy removido temporalmente hasta crear índice en Firestore
          // Para crear el índice: Firestore Console > Indexes > Create
          // Collection: quote-requests-internet, Fields: userId (asc), createdAt (desc)
        );

        const internetSnapshot = await getDocs(qInternet);

        internetSnapshot.forEach((doc) => {
          allRequests.push({
            id: doc.id,
            supplierId: doc.data().supplierId,
            isRegistered: false,
            isInternetSupplier: true,
            ...doc.data(),
          });
        });
      } catch (err) {
        // Puede fallar si no existe el índice
        console.error('Error cargando solicitudes de internet:', err);
        console.error('Si ves un link para crear el índice, haz click en él');
      }

      // Ordenar por fecha (más recientes primero)
      allRequests.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setRequests(allRequests);
    } catch (error) {
      console.error('Error loading quote requests:', error);
    } finally {
      setLoading(false);
    }
  }, [user, activeWedding]);

  useEffect(() => {
    loadQuoteRequests();
  }, [loadQuoteRequests]);

  const filteredRequests = requests.filter((req) => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  // Agrupar requests por categoría para detectar si hay múltiples
  const requestsByCategory = filteredRequests.reduce((acc, req) => {
    const cat = req.supplierCategory || 'otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(req);
    return acc;
  }, {});

  // Encontrar categorías con presupuestos recibidos para comparar
  const categoriesToCompare = Object.entries(requestsByCategory)
    .filter(([cat, reqs]) => {
      const withQuotes = reqs.filter((r) => r.quotes && r.quotes.length > 0);
      return withQuotes.length >= 2; // Mínimo 2 para comparar
    })
    .map(([cat, reqs]) => ({
      category: cat,
      categoryName: reqs[0].supplierCategoryName,
      count: reqs.filter((r) => r.quotes && r.quotes.length > 0).length,
      requests: reqs.filter((r) => r.quotes && r.quotes.length > 0),
    }));

  const handleCompareCategory = (category) => {
    setComparingCategory(category);
    setShowComparator(true);
  };

  const handleSelectQuote = async (selectedQuote) => {
    try {
      // Normalizar la clave de categoría
      const categoryKey =
        selectedQuote.supplierCategory || comparingCategory?.categoryKey || 'otros';

      // Crear objeto de proveedor
      const supplierData = {
        id: selectedQuote.supplierId,
        name: selectedQuote.supplierName,
        contact: selectedQuote.supplier?.contact || {},
        category: categoryKey,
      };

      // Asignar proveedor al servicio de la boda
      await assignSupplier(
        categoryKey,
        supplierData,
        selectedQuote, // El quote completo con pricing, terms, etc.
        '', // notes vacío
        'contratado' // status
      );

      toast.success(`✅ ${selectedQuote.supplierName} ha sido contratado!`);

      // Cerrar comparador y recargar solicitudes
      setShowComparator(false);
      setComparingCategory(null);
      await loadQuoteRequests();
    } catch (error) {
      // console.error('Error al asignar proveedor:', error);
      toast.error('Error al contratar el proveedor. Inténtalo de nuevo.');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      contacted: { label: 'Contactado', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      quoted: {
        label: 'Presupuesto recibido',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
      },
      accepted: { label: 'Aceptado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}
      >
        <Icon size={14} />
        {badge.label}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin h-8 w-8 text-indigo-600" />
          <span className="ml-3 text-gray-600">Cargando presupuestos...</span>
        </div>
      </Card>
    );
  }

  // Si está mostrando el comparador
  if (showComparator && comparingCategory) {
    const quotesToCompare = comparingCategory.requests.flatMap((req) =>
      (req.quotes || []).map((quote) => ({
        ...quote,
        supplierId: req.supplierId,
        supplierName: req.supplierName,
        supplierCategory: req.supplierCategory,
        supplierCategoryName: req.supplierCategoryName,
        supplier: {
          rating: 4.5, // TODO: Obtener del proveedor real
          reviewCount: 25,
        },
      }))
    );

    return (
      <QuoteComparator
        quotes={quotesToCompare}
        request={comparingCategory.requests[0]} // Usar el primero como base
        onSelect={handleSelectQuote}
        onClose={() => setShowComparator(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con filtros */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">📋 Mis Presupuestos Solicitados</h2>
            <p className="text-sm text-gray-600">
              {requests.length} {requests.length === 1 ? 'solicitud' : 'solicitudes'} en total
            </p>
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === 'pending'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFilter('quoted')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === 'quoted'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Con presupuesto
            </button>
          </div>
        </div>
      </Card>

      {/* Sección de comparar presupuestos */}
      {categoriesToCompare.length > 0 && (
        <Card className="bg-[var(--color-primary-10)] border-2 border-[color:var(--color-primary-30)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <GitCompare className="text-primary" size={24} />
                📊 Comparar Presupuestos
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Tienes presupuestos de múltiples proveedores. ¡Compáralos para elegir el mejor!
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {categoriesToCompare.map((cat) => (
                <Button
                  key={cat.category}
                  variant="primary"
                  size="sm"
                  onClick={() => handleCompareCategory(cat)}
                  className="flex items-center gap-2"
                >
                  <GitCompare size={16} />
                  Comparar {cat.categoryName} ({cat.count})
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Lista de solicitudes */}
      {filteredRequests.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">
              {filter === 'all'
                ? 'No has solicitado ningún presupuesto aún'
                : `No hay solicitudes con estado "${filter}"`}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-gray-900">{request.supplierName}</h3>
                    {request.supplierCategoryName && (
                      <span className="text-sm text-indigo-600">
                        • {request.supplierCategoryName}
                      </span>
                    )}
                    {/* Badge de presupuestos recibidos */}
                    {request.quotes && request.quotes.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        💰 {request.quotes.length}{' '}
                        {request.quotes.length === 1 ? 'presupuesto' : 'presupuestos'}
                      </span>
                    )}
                  </div>

                  {/* Info de la boda */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                    {request.weddingInfo?.fecha && (
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(request.weddingInfo.fecha)}
                      </div>
                    )}
                    {request.weddingInfo?.ciudad && (
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        {request.weddingInfo.ciudad}
                      </div>
                    )}
                    {request.weddingInfo?.numeroInvitados && (
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        {request.weddingInfo.numeroInvitados} invitados
                      </div>
                    )}
                  </div>

                  {/* Detalles del servicio */}
                  {request.serviceDetails && Object.keys(request.serviceDetails).length > 0 && (
                    <div className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">Detalles solicitados:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {Object.entries(request.serviceDetails)
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <span key={key} className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {String(value)}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Solicitado el {formatDate(request.createdAt)}
                  </div>
                </div>

                {/* Estado */}
                <div>{getStatusBadge(request.status)}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
