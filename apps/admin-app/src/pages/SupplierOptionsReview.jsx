import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Users, 
  Lightbulb,
  AlertCircle,
  Filter
} from 'lucide-react';
import { toast } from 'react-toastify';

const SupplierOptionsReview = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [actionReason, setActionReason] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [suggestionsRes, statsRes] = await Promise.all([
        fetch(`/api/supplier-options/review-queue?status=${selectedStatus}`),
        fetch('/api/supplier-options/stats')
      ]);

      if (suggestionsRes.ok) {
        const data = await suggestionsRes.json();
        setSuggestions(data.suggestions);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (suggestionId) => {
    try {
      const response = await fetch(`/api/supplier-options/approve/${suggestionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: actionReason })
      });

      if (response.ok) {
        toast.success('✅ Sugerencia aprobada');
        setSelectedSuggestion(null);
        setActionReason('');
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al aprobar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al aprobar sugerencia');
    }
  };

  const handleReject = async (suggestionId) => {
    try {
      const response = await fetch(`/api/supplier-options/reject/${suggestionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: actionReason })
      });

      if (response.ok) {
        toast.success('❌ Sugerencia rechazada');
        setSelectedSuggestion(null);
        setActionReason('');
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al rechazar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al rechazar sugerencia');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Pendiente', color: 'bg-gray-100 text-gray-700' },
      validating: { label: 'Validando', color: 'bg-blue-100 text-blue-700' },
      review: { label: 'En Revisión', color: 'bg-yellow-100 text-yellow-700' },
      approved: { label: 'Aprobada', color: 'bg-green-100 text-green-700' },
      rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-700' },
      duplicate: { label: 'Duplicada', color: 'bg-purple-100 text-purple-700' }
    };

    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💡 Revisión de Opciones de Proveedores
          </h1>
          <p className="text-gray-600">
            Sistema de crowdsourcing - Gestiona sugerencias de usuarios
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Sugerencias</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Lightbulb className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">En Revisión</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.byStatus.review || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Aprobadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.byStatus.approved || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Score Promedio</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.avgScore}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pendiente</option>
                <option value="review">En Revisión</option>
                <option value="approved">Aprobadas</option>
                <option value="rejected">Rechazadas</option>
                <option value="duplicate">Duplicadas</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {suggestions.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No hay sugerencias con estado "{selectedStatus}"</p>
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <div key={suggestion.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {suggestion.optionLabel}
                        </h3>
                        {getStatusBadge(suggestion.status)}
                        {suggestion.aiValidation?.score && (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(suggestion.aiValidation.score)}`}>
                            Score: {suggestion.aiValidation.score}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <p><strong>Categoría:</strong> {suggestion.categoryName}</p>
                        {suggestion.description && (
                          <p><strong>Descripción:</strong> {suggestion.description}</p>
                        )}
                        <p><strong>Sugerido por:</strong> {suggestion.suggestedBy.userName} ({suggestion.suggestedBy.email})</p>
                        <p><strong>Fecha:</strong> {new Date(suggestion.metadata.createdAt.seconds * 1000).toLocaleString('es-ES')}</p>
                      </div>

                      {suggestion.aiValidation?.reasoning && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <p className="text-sm font-medium text-blue-900 mb-1">🤖 Análisis de IA:</p>
                          <p className="text-sm text-blue-800">{suggestion.aiValidation.reasoning}</p>
                          <div className="mt-2 flex gap-4 text-xs text-blue-700">
                            <span>Relevancia: <strong>{suggestion.aiValidation.relevance}</strong></span>
                            <span>Claridad: <strong>{suggestion.aiValidation.clarity}</strong></span>
                            {suggestion.aiValidation.duplicate && (
                              <span className="text-red-600">⚠️ Duplicado de: {suggestion.aiValidation.duplicateOf}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {(selectedStatus === 'pending' || selectedStatus === 'review') && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedSuggestion(selectedSuggestion === suggestion.id ? null : suggestion.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            {selectedSuggestion === suggestion.id ? '✖ Cancelar' : '👁️ Revisar y Decidir'}
                          </button>
                        </div>
                      )}

                      {selectedSuggestion === suggestion.id && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
                          <div className="mb-3 p-3 bg-white rounded-lg text-sm text-gray-700">
                            <p className="font-semibold mb-1">ℹ️ Sobre las decisiones:</p>
                            <p className="text-xs">• <strong>Aprobar:</strong> La opción se añade al catálogo global y estará disponible para todos los usuarios.</p>
                            <p className="text-xs">• <strong>Rechazar:</strong> La opción NO se añade al catálogo global, pero el usuario que la sugirió la mantiene en su lista personal.</p>
                          </div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Razón de la decisión (opcional):
                          </label>
                          <textarea
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
                            rows={2}
                            placeholder="Explica por qué apruebas o rechazas esta sugerencia..."
                          />
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleApprove(suggestion.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleReject(suggestion.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <XCircle className="h-4 w-4" />
                              Rechazar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {stats && stats.topContributors.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Contribuidores
            </h2>
            <div className="space-y-2">
              {stats.topContributors.map((contributor, index) => (
                <div key={contributor.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900">{contributor.userName}</p>
                      <p className="text-xs text-gray-600">{contributor.count} sugerencias totales</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {contributor.approved} aprobadas
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierOptionsReview;
