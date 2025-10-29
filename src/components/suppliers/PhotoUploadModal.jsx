import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { uploadPortfolioImage } from '../../services/portfolioStorageService';

const CATEGORIES = [
  { value: 'bodas', label: 'Bodas' },
  { value: 'decoracion', label: 'Decoración' },
  { value: 'flores', label: 'Flores' },
  { value: 'ceremonia', label: 'Ceremonia' },
  { value: 'recepcion', label: 'Recepción' },
  { value: 'otros', label: 'Otros' },
];

export default function PhotoUploadModal({ onClose, onSuccess }) {
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

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar tipo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Tipo de archivo inválido. Solo JPG, PNG y WebP');
      return;
    }

    // Validar tamaño (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 5MB');
      return;
    }

    setFile(selectedFile);

    // Generar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const fakeEvent = { target: { files: [droppedFile] } };
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Selecciona una imagen');
      return;
    }

    if (!formData.category) {
      toast.error('Selecciona una categoría');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const supplierId = localStorage.getItem('supplier_id');

      // Subir imagen a Firebase Storage
      const imageUrls = await uploadPortfolioImage(file, supplierId, (progress) => {
        setUploadProgress(progress);
      });

      // Guardar en base de datos via API
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
            .map((t) => t.trim())
            .filter(Boolean),
          featured: formData.featured,
          isCover: formData.isCover,
          original: imageUrls.original,
          thumbnails: imageUrls.thumbnails,
        }),
      });

      if (!response.ok) {
        throw new Error('Error saving photo');
      }

      toast.success('Foto subida correctamente');
      onSuccess();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error(error.message || 'Error al subir la foto');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Añadir Foto</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground"
            disabled={uploading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Zona de Drop */}
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {preview ? (
              <div className="space-y-4">
                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreview(null);
                  }}
                  className="text-sm text-muted hover:text-foreground"
                >
                  Cambiar imagen
                </button>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 text-muted mx-auto mb-4" />
                <p className="text-foreground font-medium mb-2">Arrastra tu imagen aquí</p>
                <p className="text-sm text-muted mb-4">o haz click para seleccionar archivo</p>
                <p className="text-xs text-muted">Formatos: JPG, PNG, WebP · Tamaño máx: 5MB</p>
              </div>
            )}
          </div>

          {/* Formulario */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Título (opcional)
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Boda de María y Juan - Valencia"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-body focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ceremonia en la playa al atardecer..."
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-body focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Categoría *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-body focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={uploading}
                required
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
                placeholder="atardecer, playa, ceremonia"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-body focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={uploading}
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary"
                  disabled={uploading}
                />
                <span className="text-sm text-body">Marcar como destacada</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isCover}
                  onChange={(e) => setFormData({ ...formData, isCover: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary"
                  disabled={uploading}
                />
                <span className="text-sm text-body">Establecer como foto de portada</span>
              </label>
            </div>
          </div>

          {/* Progress Bar */}
          {uploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Subiendo...</span>
                <span className="text-foreground font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-body hover:bg-muted/50 transition-colors"
              disabled={uploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!file || uploading}
            >
              {uploading ? 'Subiendo...' : 'Subir Foto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
