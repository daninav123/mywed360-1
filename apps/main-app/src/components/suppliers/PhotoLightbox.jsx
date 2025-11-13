import React, { useMemo, useState } from 'react';
import { X, Edit, Trash2, Eye, Heart, Star } from 'lucide-react';
import { toast } from 'react-toastify';
import useTranslations from '../../hooks/useTranslations';

const CATEGORY_OPTIONS = [
  { value: 'bodas', labelKey: 'common.suppliers.portfolio.lightbox.categories.bodas' },
  { value: 'decoracion', labelKey: 'common.suppliers.portfolio.lightbox.categories.decoracion' },
  { value: 'flores', labelKey: 'common.suppliers.portfolio.lightbox.categories.flores' },
  { value: 'ceremonia', labelKey: 'common.suppliers.portfolio.lightbox.categories.ceremonia' },
  { value: 'recepcion', labelKey: 'common.suppliers.portfolio.lightbox.categories.recepcion' },
  { value: 'otros', labelKey: 'common.suppliers.portfolio.lightbox.categories.otros' },
];

export default function PhotoLightbox({ photo, onClose, onUpdate, onDelete }) {
  const { t, format } = useTranslations();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: photo.title || '',
    description: photo.description || '',
    category: photo.category || 'bodas',
    tags: (photo.tags || []).join(', '),
    featured: Boolean(photo.featured),
    isCover: Boolean(photo.isCover),
  });

  const categoryOptions = useMemo(
    () =>
      CATEGORY_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t]
  );

  const categoryLabel = useMemo(() => {
    const option = categoryOptions.find((cat) => cat.value === photo.category);
    if (option) return option.label;
    return photo.category || t('suppliers.portfolio.lightbox.categories.unknown');
  }, [categoryOptions, photo.category, t]);

  const uploadedAt = useMemo(() => {
    if (!photo.uploadedAt) return null;
    const raw =
      photo.uploadedAt instanceof Date
        ? photo.uploadedAt
        : new Date(
            typeof photo.uploadedAt === 'number'
              ? photo.uploadedAt
              : photo.uploadedAt.seconds * 1000
          );
    if (Number.isNaN(raw.getTime())) return null;
    if (format?.dateShort) return format.dateShort(raw);
    return raw.toLocaleDateString();
  }, [photo.uploadedAt, format]);

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
            .map((tag) => tag.trim())
            .filter(Boolean),
          featured: formData.featured,
          isCover: formData.isCover,
        }),
      });

      if (!response.ok) throw new Error('update_failed');

      toast.success(t('suppliers.portfolio.lightbox.toasts.updated'));
      setEditing(false);
      onUpdate?.();
    } catch (error) {
      // console.error('[PhotoLightbox] update error', error);
      toast.error(
        error.message === 'update_failed'
          ? t('suppliers.portfolio.lightbox.toasts.updateError')
          : t('suppliers.portfolio.lightbox.toasts.genericError')
      );
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
      featured: Boolean(photo.featured),
      isCover: Boolean(photo.isCover),
    });
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={() => setEditing((prev) => !prev)}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          title={
            editing
              ? t('suppliers.portfolio.lightbox.tooltips.cancelEdit')
              : t('suppliers.portfolio.lightbox.tooltips.editPhoto')
          }
        >
          <Edit className="h-5 w-5" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors"
          title={t('suppliers.portfolio.lightbox.tooltips.deletePhoto')}
        >
          <Trash2 className="h-5 w-5" />
        </button>
        <button
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          title={t('app.close')}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex items-center justify-center">
            <img
              src={photo.original}
              alt={photo.title || t('suppliers.portfolio.lightbox.image.altFallback')}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
            />
          </div>

          <div className="lg:col-span-1 bg-surface rounded-lg p-6 space-y-6">
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
                    <span className="text-xs">
                      {t('suppliers.portfolio.lightbox.tags.featured')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {!editing ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {photo.title || t('suppliers.portfolio.lightbox.view.noTitle')}
                  </h2>
                  {photo.description && (
                    <p className="text-body whitespace-pre-wrap">{photo.description}</p>
                  )}
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {t('suppliers.portfolio.lightbox.view.categoryLabel')}
                    </span>
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm capitalize">
                      {categoryLabel}
                    </span>
                  </div>

                  {Array.isArray(photo.tags) && photo.tags.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-foreground block mb-2">
                        {t('suppliers.portfolio.lightbox.view.tagsLabel')}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {photo.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-muted text-body rounded-md text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {uploadedAt && (
                  <div className="text-xs text-muted">
                    {t('suppliers.portfolio.lightbox.meta.uploadedAt', {
                      value: uploadedAt,
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('suppliers.portfolio.lightbox.form.title.label')}
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t('suppliers.portfolio.lightbox.form.title.placeholder')}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-body focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('suppliers.portfolio.lightbox.form.description.label')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t(
                      'common.suppliers.portfolio.lightbox.form.description.placeholder'
                    )}
                    rows={4}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-body focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('suppliers.portfolio.lightbox.form.category.label')}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-body focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={saving}
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('suppliers.portfolio.lightbox.form.tags.label')}
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder={t('suppliers.portfolio.lightbox.form.tags.placeholder')}
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
                    <span className="text-sm text-body">
                      {t('suppliers.portfolio.lightbox.form.featured')}
                    </span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isCover}
                      onChange={(e) => setFormData({ ...formData, isCover: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary"
                      disabled={saving}
                    />
                    <span className="text-sm text-body">
                      {t('suppliers.portfolio.lightbox.form.isCover')}
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 border border-border rounded-lg text-body hover:bg-muted/50 transition-colors"
                    disabled={saving}
                  >
                    {t('app.cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving
                      ? t('suppliers.portfolio.lightbox.form.save.loading')
                      : t('app.save')}
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
