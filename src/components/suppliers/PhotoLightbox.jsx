import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Edit, Trash2, Eye, Heart, Star } from 'lucide-react';
import { toast } from 'react-toastify';

const CATEGORIES = [
  { value: 'bodas', label: 'Bodas' },
  { value: 'decoracion', label: 'Decoración' },
  { value: 'flores', label: 'Flores' },
  { value: 'ceremonia', label: 'Ceremonia' },
  { value: 'recepcion', label: 'Recepción' },
  { value: 'otros', label: 'Otros' },
];

export default function PhotoLightbox({ photo, onClose, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: photo.title || '',
    description: photo.description || '',
    category: photo.category || 'bodas',
    tags: (photo.tags || []).join(', '),
    featured: photo.featured || false,
    isCover: photo.isCover || false,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('supplier_token');
      const response = await fetch(`/api/supplier-dashboard/portfolio/${photo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          tags: formData.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          featured: formData.featured,
          isCover: formData.isCover,
        }),
      });

      if (!response.ok) throw new Error('Error updating photo');

      toast.success('Foto actualizada');
      setEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating photo:', error);
      toast.error('Error al actualizar la foto');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: photo.title || '',
      description: photo.description || '',
      category: photo.category || 'bodas',
      tags: (photo.tags || []).join(', '),
      featured: photo.featured || false,
      isCover: photo.isCover || false,
    });
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
      {/* Header con botones */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={() => setEditing(!editing)}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          title={editing ? 'Cancelar edición' : 'Editar foto'}
        >
          <Edit className="h-5 w-5" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors"
          title="Eliminar foto"
        >
          <Trash2 className="h-5 w-5" />
        </button>
        <button
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Imagen - 2/3 del espacio */}
          <div className="lg:col-span-2 flex items-center justify-center">
            <img
              src={photo.original}
              alt={photo.title || 'Foto'}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Sidebar - Información y Edición */}
          <div className="lg:col-span-1 bg-surface rounded-lg p-6 space-y-6">
            {/* Estadísticas */}
            {!editing && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted">
                  <Eye className="h-4 w-4" />
                  <span>{photo.views || 0}</span>
                </div>
                <div className="flex items-center gap-1 text-muted">
                  <Heart className="h-4 w-4" />
                  <span>{photo.likes || 0}</span>
                </div>
                {photo.featured && (
                  <div className="flex items-center gap-1 text-primary">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-xs">Destacada</span>
                  </div>
                )}
              </div>
            )}

            {/* Modo Vista */}
            {!editing ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {photo.title || 'Sin título'}
                  </h2>
                  {photo.description && (
                    <p className="text-body whitespace-pre-wrap">{photo.description}</p>
                  )}
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-foreground">Categoría:</span>
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm capitalize">
                      {photo.category}
                    </span>
                  </div>

                  {photo.tags && photo.tags.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-foreground block mb-2">Tags:</span>
                      <div className="flex flex-wrap gap-2">
                        {photo.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-muted text-body rounded-md text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {photo.uploadedAt && (
                  <div className="text-xs text-muted">
                    Subida: {new Date(photo.uploadedAt.seconds * 1000).toLocaleDateString('es-ES')}
                  </div>
                )}
              </div>
            ) : (
              /* Modo Edición */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Título</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Título de la foto"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-body focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción de la foto"
                    rows={4}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-body focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-body focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={saving}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tags (separados por comas)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="tag1, tag2, tag3"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-body focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary"
                      disabled={saving}
                    />
                    <span className="text-sm text-body">Marcar como destacada</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isCover}
                      onChange={(e) => setFormData({ ...formData, isCover: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary"
                      disabled={saving}
                    />
                    <span className="text-sm text-body">Establecer como portada</span>
                  </label>
                </div>

                {/* Botones de Acción */}
                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 border border-border rounded-lg text-body hover:bg-muted/50 transition-colors"
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
