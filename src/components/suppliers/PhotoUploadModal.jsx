import React, { useMemo, useRef, useState } from 'react';
import { X, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import { uploadPortfolioImage } from '../../services/portfolioStorageService';
import useTranslations from '../../hooks/useTranslations';

const CATEGORY_KEYS = ['bodas', 'decoracion', 'flores', 'ceremonia', 'recepcion', 'otros'];
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function PhotoUploadModal({ onClose, onSuccess }) {
  const { t, format } = useTranslations();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'bodas',
    tags: '',
    featured: false,
    isCover: false,
  });

  const fileInputRef = useRef(null);

  const categoryOptions = useMemo(
    () =>
      CATEGORY_KEYS.map((value) => ({
        value,
        label: t(`common.suppliers.portfolio.lightbox.categories.${value}`),
      })),
    [t],
  );

  const resetFileSelection = () => {
    setFile(null);
    setPreview(null);
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      toast.error(t('common.suppliers.portfolio.upload.errors.invalidType'));
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error(t('common.suppliers.portfolio.upload.errors.tooLarge'));
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      const syntheticEvent = { target: { files: [droppedFile] } };
      handleFileSelect(syntheticEvent);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      toast.error(t('common.suppliers.portfolio.upload.errors.noImage'));
      return;
    }

    if (!formData.category) {
      toast.error(t('common.suppliers.portfolio.upload.errors.noCategory'));
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const supplierId = localStorage.getItem('supplier_id');

      const imageUrls = await uploadPortfolioImage(file, supplierId, (progress) => {
        setUploadProgress(progress);
      });

      const token = localStorage.getItem('supplier_token');
      const response = await fetch('/api/supplier-dashboard/portfolio', {
        method: 'POST',
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
          original: imageUrls.original,
          thumbnails: imageUrls.thumbnails,
        }),
      });

      if (!response.ok) {
        throw new Error('upload_failed');
      }

      toast.success(t('common.suppliers.portfolio.toasts.uploaded'));
      onSuccess();
      resetFileSelection();
      setFormData((prev) => ({
        ...prev,
        title: '',
        description: '',
        tags: '',
        featured: false,
        isCover: false,
      }));
    } catch (error) {
      console.error('[PhotoUploadModal] upload error', error);
      toast.error(
        error.message === 'upload_failed'
          ? t('common.suppliers.portfolio.upload.errors.uploadFailed')
          : t('common.suppliers.portfolio.upload.errors.generic'),
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            {t('common.suppliers.portfolio.upload.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground"
            aria-label={t('app.close')}
            disabled={uploading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            role="presentation"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />

            {preview ? (
              <div className="space-y-4">
                <img
                  src={preview}
                  alt={formData.title || t('common.suppliers.portfolio.lightbox.image.altFallback')}
                  className="max-h-64 mx-auto rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    resetFileSelection();
                  }}
                  className="text-sm text-muted hover:text-foreground"
                  disabled={uploading}
                >
                  {t('common.suppliers.portfolio.upload.dropzone.change')}
                </button>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 text-muted mx-auto mb-4" />
                <p className="text-foreground font-medium mb-2">
                  {t('common.suppliers.portfolio.upload.dropzone.title')}
                </p>
                <p className="text-sm text-muted mb-4">
                  {t('common.suppliers.portfolio.upload.dropzone.subtitle')}
                </p>
                <p className="text-xs text-muted">
                  {t('common.suppliers.portfolio.upload.dropzone.requirements')}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('common.suppliers.portfolio.upload.form.title.label')}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                placeholder={t('common.suppliers.portfolio.upload.form.title.placeholder')}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-body focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('common.suppliers.portfolio.upload.form.description.label')}
              </label>
              <textarea
                value={formData.description}
                onChange={(event) =>
                  setFormData({ ...formData, description: event.target.value })
                }
                placeholder={t('common.suppliers.portfolio.upload.form.description.placeholder')}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-body focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('common.suppliers.portfolio.upload.form.category.label')}
              </label>
              <select
                value={formData.category}
                onChange={(event) => setFormData({ ...formData, category: event.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-body focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={uploading}
                required
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('common.suppliers.portfolio.upload.form.tags.label')}
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(event) => setFormData({ ...formData, tags: event.target.value })}
                placeholder={t('common.suppliers.portfolio.upload.form.tags.placeholder')}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-body focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(event) =>
                    setFormData({ ...formData, featured: event.target.checked })
                  }
                  className="rounded border-border text-primary focus:ring-primary"
                  disabled={uploading}
                />
                <span className="text-sm text-body">
                  {t('common.suppliers.portfolio.upload.form.featured')}
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isCover}
                  onChange={(event) =>
                    setFormData({ ...formData, isCover: event.target.checked })
                  }
                  className="rounded border-border text-primary focus:ring-primary"
                  disabled={uploading}
                />
                <span className="text-sm text-body">
                  {t('common.suppliers.portfolio.upload.form.isCover')}
                </span>
              </label>
            </div>
          </div>

          {uploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  {t('common.suppliers.portfolio.upload.progress.uploading')}
                </span>
                <span className="text-foreground font-medium">
                  {format?.number ? format.number(uploadProgress) : uploadProgress}%
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-body hover:bg-muted/50 transition-colors"
              disabled={uploading}
            >
              {t('app.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!file || uploading}
            >
              {uploading
                ? t('common.suppliers.portfolio.upload.actions.submitting')
                : t('common.suppliers.portfolio.upload.actions.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
