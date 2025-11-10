import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, Flag, MessageSquare } from 'lucide-react';
import { toast } from 'react-toastify';

export default function SupplierReviews({ supplierId }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddReview, setShowAddReview] = useState(false);

  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: '',
    weddingDate: '',
    serviceType: '',
  });

  useEffect(() => {
    loadReviews();
  }, [supplierId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/suppliers/${supplierId}/reviews?limit=20`);

      if (!response.ok) throw new Error('Error loading reviews');

      const data = await response.json();
      setReviews(data.reviews || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Error al cargar las reseñas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (newReview.comment.trim().length < 10) {
      toast.error('El comentario debe tener al menos 10 caracteres');
      return;
    }

    try {
      const response = await fetch(`/api/suppliers/${supplierId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Reemplazar con auth real
          'x-user-id': 'user123',
          'x-user-name': 'Usuario Demo',
        },
        body: JSON.stringify(newReview),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.error === 'already_reviewed') {
          toast.error('Ya has dejado una reseña para este proveedor');
          return;
        }
        throw new Error('Error creating review');
      }

      toast.success('Reseña enviada. Será revisada antes de publicarse.');
      setShowAddReview(false);
      setNewReview({ rating: 5, comment: '', weddingDate: '', serviceType: '' });
      loadReviews();
    } catch (error) {
      console.error('Error creating review:', error);
      toast.error('Error al enviar la reseña');
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      await fetch(`/api/suppliers/${supplierId}/reviews/${reviewId}/helpful`, {
        method: 'POST',
      });

      // Actualizar localmente
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, helpful: (r.helpful || 0) + 1 } : r))
      );
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con Estadísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reseñas ({stats?.total || 0})</h2>
          {stats && stats.total > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(stats.averageRating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold">{stats.averageRating.toFixed(1)}</span>
              <span className="text-muted">de 5</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowAddReview(!showAddReview)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          {showAddReview ? 'Cancelar' : 'Escribir Reseña'}
        </button>
      </div>

      {/* Formulario Nueva Reseña */}
      {showAddReview && (
        <form
          onSubmit={handleSubmitReview}
          className="bg-surface border border-border rounded-lg p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Puntuación</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReview({ ...newReview, rating: star })}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= newReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Tu opinión *</label>
            <textarea
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              placeholder="Cuéntanos tu experiencia..."
              rows={4}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-body focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              required
              minLength={10}
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Publicar Reseña
          </button>
        </form>
      )}

      {/* Lista de Reseñas */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-surface border border-border rounded-lg">
          <MessageSquare className="h-12 w-12 text-muted mx-auto mb-4" />
          <p className="text-muted">No hay reseñas todavía</p>
          <p className="text-sm text-muted mt-2">Sé el primero en dejar una reseña</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-surface border border-border rounded-lg p-6">
              {/* Header de la reseña */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{review.userName}</span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-muted">
                    {review.createdAt &&
                      new Date(review.createdAt.seconds * 1000).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>

              {/* Comentario */}
              <p className="text-body whitespace-pre-wrap mb-4">{review.comment}</p>

              {/* Respuesta del Proveedor */}
              {review.supplierResponse && (
                <div className="mt-4 pl-4 border-l-2 border-primary bg-primary/5 p-4 rounded-r-lg">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Respuesta del proveedor:
                  </p>
                  <p className="text-sm text-body">{review.supplierResponse}</p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => handleMarkHelpful(review.id)}
                  className="flex items-center gap-1 text-sm text-muted hover:text-primary transition-colors"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Útil ({review.helpful || 0})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
