import React, { useMemo, useState } from 'react';
import { Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

const formatDateTime = (value) => {
  if (!value) return '';
  const date =
    value instanceof Date
      ? value
      : value?.toDate?.()
      ? value.toDate()
      : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  rejected: 'bg-rose-100 text-rose-700 border border-rose-200',
};

export default function MediaGallery({ photos = [], scenes = [] }) {
  const [sceneFilter, setSceneFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const sceneOptions = useMemo(
    () => [
      { id: 'all', label: 'Todas las escenas' },
      ...scenes.map((scene) => ({ id: scene.id, label: scene.label || scene.id })),
    ],
    [scenes]
  );

  const filteredPhotos = useMemo(() => {
    return photos
      .filter((photo) => {
        const matchesScene =
          sceneFilter === 'all' || (photo.scene || '').toLowerCase() === sceneFilter.toLowerCase();
        const matchesStatus = statusFilter === 'all' || (photo.status || 'pending') === statusFilter;
        return matchesScene && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() || a.createdAt?.getTime?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || b.createdAt?.getTime?.() || 0;
        return dateB - dateA;
      });
  }, [photos, sceneFilter, statusFilter]);

  const resolveSceneLabel = (sceneId) => {
    if (!sceneId) return 'Otros';
    const scene = scenes.find((item) => item.id === sceneId);
    return scene?.label || sceneId;
  };

  return (
    <section className="border border-slate-200 rounded-2xl bg-white shadow-sm">
      <header className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Galería del evento</h3>
          <p className="text-sm text-slate-500">
            Visualiza y filtra todas las fotos y vídeos aportados por los invitados.
          </p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <select
            value={sceneFilter}
            onChange={(event) => setSceneFilter(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sceneOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Rechazados</option>
          </select>
        </div>
      </header>

      {filteredPhotos.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          No hay archivos que coincidan con el filtro seleccionado.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 px-5 py-5 sm:grid-cols-3 lg:grid-cols-4">
          {filteredPhotos.map((photo) => {
            const type = String(photo.upload?.contentTypeStored || photo.upload?.contentTypeOriginal || '').toLowerCase();
            const isVideo = type.startsWith('video/');
            const thumbUrl = photo.urls?.thumb || photo.urls?.optimized || photo.urls?.original || '';
            const status = (photo.status || 'pending').toLowerCase();
            const statusClass = statusStyles[status] || 'bg-slate-100 text-slate-600 border border-slate-200';

            return (
              <a
                key={photo.id}
                href={photo.urls?.optimized || photo.urls?.original || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm transition hover:-translate-y-0.5"
              >
                <div className="relative aspect-square bg-slate-100">
                  {isVideo ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white">
                      <VideoIcon size={32} />
                    </div>
                  ) : (
                    <img
                      src={thumbUrl}
                      alt={photo.label || 'Foto del evento'}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass}`}>
                    {status === 'pending' && 'Pendiente'}
                    {status === 'approved' && 'Aprobado'}
                    {status === 'rejected' && 'Rechazado'}
                  </span>
                </div>
                <div className="px-4 py-3 space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{formatDateTime(photo.createdAt)}</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      {isVideo ? <VideoIcon size={14} /> : <ImageIcon size={14} />}
                      {Math.round((photo.upload?.sizeStored || photo.upload?.sizeOriginal || 0) / 1024)} KB
                    </span>
                  </div>
                  <p className="font-medium truncate text-slate-900">
                    {photo.upload?.filename || photo.upload?.storedFilename || 'Archivo sin nombre'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {resolveSceneLabel(photo.scene)}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
