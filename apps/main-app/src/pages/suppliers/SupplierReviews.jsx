import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MessageSquare, AlertTriangle, Send, ArrowLeft, Filter } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import useTranslations from '../../hooks/useTranslations';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4004';

export default function SupplierReviews() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, format } = useTranslations();

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, published
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Cargar reseñas y estadísticas
  useEffect(() => {
    loadReviews();
    loadStats();
  }, [id, filter]);

  const loadReviews = async () => {
    try {
      const token = localStorage.getItem('supplier_token');
      const response = await fetch(`${API_BASE}/api/supplier-dashboard/reviews?status=${filter}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
      }
    } catch (error) {
      // console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('supplier_token');
      const response = await fetch(`${API_BASE}/api/supplier-dashboard/reviews/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      // console.error('Error loading stats:', error);
    }
  };

  const handleRespond = async (reviewId) => {
    if (!responseText.trim()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('supplier_token');
      const response = await fetch(
        `${API_BASE}/api/supplier-dashboard/reviews/${reviewId}/respond`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ response: responseText }),
        }
      );

      if (response.ok) {
        setResponseText('');
        setRespondingTo(null);
        loadReviews();
      }
    } catch (error) {
      // console.error('Error responding to review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async (reviewId, reason) => {
    try {
      const token = localStorage.getItem('supplier_token');
      await fetch(`${API_BASE}/api/supplier-dashboard/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      loadReviews();
    } catch (error) {
      // console.error('Error reporting review:', error);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            fill={star <= rating ? '#fbbf24' : 'none'}
            stroke={star <= rating ? '#fbbf24' : '#d1d5db'}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(`/supplier/dashboard/${id}`)}
            className="flex items-center gap-2 hover:opacity-70"
            className="text-body"
          >
            <ArrowLeft size={20} />
            <span>Volver al Dashboard</span>
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-6" className="text-body">
          Mis Reseñas
        </h1>

        {/* Estadísticas */}
        {stats && (
          <div
            className="shadow-md rounded-lg p-6 mb-6"
            className="bg-surface"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold" className="text-primary">
                  {stats.averageRating}
                </div>
                <div className="flex items-center justify-center mt-2">
                  {renderStars(Math.round(stats.averageRating))}
                </div>
                <div className="text-sm mt-1" className="text-muted">
                  Valoración media
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold" className="text-body">
                  {stats.totalReviews}
                </div>
                <div className="text-sm mt-1" className="text-muted">
                  Reseñas totales
                </div>
              </div>

              <div className="text-center">
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-2 justify-center text-sm">
                      <span>{rating}★</span>
                      <div
                        className="w-24 h-2 rounded-full"
                        style={{ backgroundColor: 'var(--color-border)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: 'var(--color-primary)',
                            width: `${(stats.distribution[rating] / stats.totalReviews) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-muted">
                        {stats.distribution[rating]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex items-center gap-4 mb-6">
          <Filter size={20} className="text-body" />
          {['all', 'published', 'pending', 'under_review'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === filterOption ? 'font-semibold' : ''
              }`}
              style={{
                backgroundColor:
                  filter === filterOption ? 'var(--color-primary)' : 'var(--color-surface)',
                color: filter === filterOption ? 'white' : 'var(--color-text)',
              }}
            >
              {filterOption === 'all' && 'Todas'}
              {filterOption === 'published' && 'Publicadas'}
              {filterOption === 'pending' && 'Pendientes'}
              {filterOption === 'under_review' && 'En revisión'}
            </button>
          ))}
        </div>

        {/* Lista de reseñas */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div
              className="text-center py-12 rounded-lg"
              className="bg-surface"
            >
              <MessageSquare
                size={48}
                className="mx-auto mb-4"
                className="text-muted"
              />
              <p className="text-muted">
                No tienes reseñas {filter !== 'all' ? `${filter}` : ''} todavía
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                className="shadow-md rounded-lg p-6"
                className="bg-surface"
              >
                {/* Header de la reseña */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold" className="text-body">
                        {review.client.name}
                      </h3>
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-sm" className="text-muted">
                      {review.createdAt && format.date
                        ? format.date(review.createdAt.toDate(), { dateStyle: 'medium' })
                        : ''}
                    </p>
                  </div>

                  {!review.reported && (
                    <button
                      onClick={() => {
                        const reason = prompt('¿Por qué quieres reportar esta reseña?');
                        if (reason) handleReport(review.id, reason);
                      }}
                      className="text-sm hover:opacity-70"
                      style={{ color: 'var(--color-error)' }}
                    >
                      <AlertTriangle size={16} />
                    </button>
                  )}
                </div>

                {/* Comentario */}
                <p className="mb-4" className="text-body">
                  {review.comment}
                </p>

                {/* Respuesta del proveedor */}
                {review.supplierResponse && (
                  <div
                    className="p-4 rounded-lg mb-4"
                    style={{ backgroundColor: 'rgba(109, 40, 217, 0.05)' }}
                  >
                    <p
                      className="text-sm font-semibold mb-1"
                      className="text-primary"
                    >
                      Tu respuesta:
                    </p>
                    <p className="text-sm" className="text-body">
                      {review.supplierResponse}
                    </p>
                  </div>
                )}

                {/* Formulario de respuesta */}
                {!review.supplierResponse && respondingTo === review.id ? (
                  <div className="mt-4">
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder={t('supplier.reviews.responsePlaceholder')}
                      className="w-full p-3 border rounded-lg mb-2"
                      className="border-default"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespond(review.id)}
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg flex items-center gap-2"
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                        }}
                      >
                        <Send size={16} />
                        {submitting ? 'Enviando...' : 'Enviar respuesta'}
                      </button>
                      <button
                        onClick={() => {
                          setRespondingTo(null);
                          setResponseText('');
                        }}
                        className="px-4 py-2 rounded-lg"
                        style={{
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  !review.supplierResponse && (
                    <button
                      onClick={() => setRespondingTo(review.id)}
                      className="text-sm hover:opacity-70"
                      className="text-primary"
                    >
                      Responder
                    </button>
                  )
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
