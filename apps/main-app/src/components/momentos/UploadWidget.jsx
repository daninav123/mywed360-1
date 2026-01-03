import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Upload, CheckCircle, XCircle, Loader, Image, Film } from 'lucide-react';

import { uploadMomentPhoto } from '@/services/momentosService';
import SceneSelector from './SceneSelector';

const makeQueueId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

const readableSize = (bytes = 0) => {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const readVideoDuration = async (file) =>
  new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      const cleanup = () => {
        try {
          video.removeAttribute('src');
          video.load();
        } catch {}
        try {
          URL.revokeObjectURL(url);
        } catch {}
      };
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const duration = Number.isFinite(video.duration) ? Number(video.duration) : null;
        cleanup();
        resolve(duration);
      };
      video.onerror = () => {
        cleanup();
        resolve(null);
      };
      video.src = url;
    } catch {
      resolve(null);
    }
  });

const readImageDimensions = async (file) =>
  new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || img.width || null;
        const height = img.naturalHeight || img.height || null;
        URL.revokeObjectURL(url);
        resolve({ width, height });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ width: null, height: null });
      };
      img.src = url;
    } catch {
      resolve({ width: null, height: null });
    }
  });

const extractUploadMetadata = async (file) => {
  const metadata = {};
  const type = String(file.type || '').toLowerCase();
  if (type.startsWith('video/')) {
    const duration = await readVideoDuration(file);
    if (Number.isFinite(duration)) {
      metadata.videoDurationSeconds = Math.round(duration);
    }
  } else if (type.startsWith('image/')) {
    const dims = await readImageDimensions(file);
    if (dims?.width) metadata.width = dims.width;
    if (dims?.height) metadata.height = dims.height;
  }
  return metadata;
};

/**
 * UploadWidget
 * Permite subir imágenes a la galería de recuerdos con selección de escena y progreso por archivo.
 */
export default function UploadWidget({
  weddingId,
  albumId,
  scenes = [],
  uploader = {},
  onUploaded = () => {},
  metadataBuilder = null,
  disabled = false,
  className = '',
  initialScene = null,
  lockedScene = false,
}) {
  const defaultScene =
    scenes.length && scenes[0]?.id ? scenes[0].id : 'otros';
  const resolvedInitialScene = useMemo(() => {
    if (!initialScene) return defaultScene;
    const match = scenes.find((item) => item.id === initialScene);
    return match ? match.id : defaultScene;
  }, [defaultScene, initialScene, scenes]);

  const [scene, setScene] = useState(resolvedInitialScene);
  useEffect(() => {
    setScene(resolvedInitialScene);
  }, [resolvedInitialScene]);
  const [queue, setQueue] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const isBusy = useMemo(() => queue.some((item) => item.status === 'uploading'), [queue]);

  const updateQueueItem = useCallback((id, patch) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const handleFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || []).filter((file) => {
        const type = String(file.type || '').toLowerCase();
        if (type.startsWith('image/')) return true;
        if (type.startsWith('video/')) return true;
        const name = String(file.name || '').toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.heic', '.webp', '.mp4', '.mov', '.m4v', '.heif']
          .some((ext) => name.endsWith(ext));
      });
      if (!files.length) {
        toast.warn('Selecciona fotos o videos compatibles para subir');
        return;
      }

      const newEntries = files.map((file) => ({
        id: makeQueueId(),
        fileName: file.name,
        size: file.size,
        progress: 0,
        status: 'pending',
      }));

      setQueue((prev) => [...newEntries, ...prev]);

      for (let idx = 0; idx < files.length; idx += 1) {
        const file = files[idx];
        const entry = newEntries[idx];
        updateQueueItem(entry.id, { status: 'uploading', progress: 1 });

        try {
          const metadataExtra =
            typeof metadataBuilder === 'function'
              ? metadataBuilder(file, { scene })
              : {};
          const intrinsicMeta = await extractUploadMetadata(file);
          const uploadMetadata = {
            scene,
            uploaderId: uploader?.uid || uploader?.id || null,
            uploaderType: uploader?.type || 'host',
            guestName: uploader?.displayName || uploader?.name || null,
            guestDisplayName: uploader?.displayName || uploader?.name || null,
            guestId: uploader?.guestId || null,
            tokenId: uploader?.tokenId || null,
            source: uploader?.source || 'web',
            ...intrinsicMeta,
            ...metadataExtra,
          };
          await uploadMomentPhoto({
            weddingId,
            albumId,
            file,
            metadata: uploadMetadata,
            onProgress: (progress) => updateQueueItem(entry.id, { progress }),
          });
          updateQueueItem(entry.id, { status: 'done', progress: 100 });
          onUploaded?.({ file, scene });
        } catch (error) {
          let message = error?.message;
          if (message === 'duplicate_photo') {
            message = 'Ya se subió un archivo idéntico. Evitamos duplicados automáticamente.';
          } else if (message === 'video_exceeds_limit') {
            message =
              'Los vídeos de más de 2 minutos se bloquean cuando la galería supera el límite de almacenamiento.';
          } else if (!message || message === 'undefined') {
            message =
              error?.code === 'storage/canceled'
                ? 'Subida cancelada'
                : 'No se pudo subir el archivo';
          }
          updateQueueItem(entry.id, { status: 'error', error: message });
          toast.error(message);
        }
      }
    },
    [
      albumId,
      metadataBuilder,
      onUploaded,
      scene,
      updateQueueItem,
      uploader?.displayName,
      uploader?.guestId,
      uploader?.id,
      uploader?.name,
      uploader?.tokenId,
      uploader?.type,
      uploader?.uid,
      uploader?.source,
      weddingId,
    ]
  );

  const onInputChange = useCallback(
    (event) => {
      handleFiles(event.target.files || []);
      event.target.value = '';
    },
    [handleFiles]
  );

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (disabled) return;
      setIsDragging(false);
      if (event.dataTransfer?.files?.length) {
        handleFiles(event.dataTransfer.files);
      }
    },
    [disabled, handleFiles]
  );

  const openFileDialog = useCallback(() => {
    if (disabled || isBusy) return;
    if (inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled, isBusy]);

  const completedCount = useMemo(() => queue.filter(q => q.status === 'done').length, [queue]);
  const errorCount = useMemo(() => queue.filter(q => q.status === 'error').length, [queue]);
  const uploadingCount = useMemo(() => queue.filter(q => q.status === 'uploading').length, [queue]);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Subir recuerdos</h3>
              <p className="text-sm text-gray-600">
                Fotos y videos del evento
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {queue.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                {uploadingCount > 0 && (
                  <span className="flex items-center gap-1 text-blue-600 font-medium">
                    <Loader className="w-4 h-4 animate-spin" />
                    {uploadingCount}
                  </span>
                )}
                {completedCount > 0 && (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    {completedCount}
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="flex items-center gap-1 text-red-600 font-medium">
                    <XCircle className="w-4 h-4" />
                    {errorCount}
                  </span>
                )}
              </div>
            )}
            <div className="text-right min-w-[140px]">
              <span className="text-xs uppercase tracking-wide text-gray-500 block mb-1">
                Escena
              </span>
              {lockedScene ? (
                <div className="inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-sm font-medium text-blue-700 shadow-sm">
                  {scenes.find((item) => item.id === scene)?.label || scene}
                </div>
              ) : (
                <SceneSelector scenes={scenes} value={scene} onChange={setScene} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">

        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={onDrop}
          role="presentation"
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            isDragging
              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 scale-[1.02] shadow-lg'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          } ${disabled ? 'opacity-60 pointer-events-none' : 'cursor-pointer'}`}
          onClick={openFileDialog}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={onInputChange}
            disabled={disabled}
          />
          <div className={`transition-transform duration-300 ${isDragging ? 'scale-110' : 'scale-100'}`}>
            <div className="flex justify-center gap-2 mb-4">
              <div className={`p-3 rounded-full transition-all duration-300 ${
                isDragging ? 'bg-blue-500' : 'bg-blue-100'
              }`}>
                <Image className={`w-6 h-6 ${
                  isDragging ? 'text-white' : 'text-blue-600'
                }`} />
              </div>
              <div className={`p-3 rounded-full transition-all duration-300 ${
                isDragging ? 'bg-purple-500' : 'bg-purple-100'
              }`}>
                <Film className={`w-6 h-6 ${
                  isDragging ? 'text-white' : 'text-purple-600'
                }`} />
              </div>
            </div>
            <p className="text-gray-700 font-medium mb-2">
              {isDragging ? (
                <span className="text-blue-600">¡Suelta aquí tus archivos!</span>
              ) : (
                <>
                  Arrastra fotos o videos, o{' '}
                  <span className="text-blue-600 hover:text-blue-700 underline">
                    haz clic para seleccionar
                  </span>
                </>
              )}
            </p>
            <p className="text-xs text-gray-500">
              JPG, PNG, MP4, MOV • Máx. {DEFAULT_SETTINGS?.maxFileSizeMb || 25} MB por archivo
            </p>
            {!isDragging && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                <span className="px-2 py-1 bg-gray-100 rounded">📸 Fotos</span>
                <span className="px-2 py-1 bg-gray-100 rounded">🎥 Videos</span>
                <span className="px-2 py-1 bg-gray-100 rounded">📱 Múltiples archivos</span>
              </div>
            )}
          </div>
        </div>

        {queue.length > 0 && (
          <div className="mt-6 space-y-2 max-h-[400px] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-sm font-semibold text-gray-700">Cola de subida</h4>
              {completedCount === queue.length && queue.length > 0 && (
                <button
                  onClick={() => setQueue([])}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Limpiar completados
                </button>
              )}
            </div>
            {queue.map((item, index) => (
              <div
                key={item.id}
                className={`border rounded-lg px-4 py-3 transition-all duration-300 ${
                  item.status === 'error'
                    ? 'border-red-200 bg-red-50'
                    : item.status === 'done'
                    ? 'border-green-200 bg-green-50'
                    : 'border-blue-200 bg-blue-50'
                }`}
                style={{
                  animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {item.status === 'uploading' && (
                      <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                    )}
                    {item.status === 'done' && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {item.status === 'error' && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    {item.status === 'pending' && (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.fileName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-600">
                        {readableSize(item.size)}
                      </p>
                      <span className="text-gray-400">•</span>
                      <p className={`text-xs font-medium ${
                        item.status === 'error'
                          ? 'text-red-600'
                          : item.status === 'done'
                          ? 'text-green-600'
                          : 'text-blue-600'
                      }`}>
                        {item.status === 'uploading'
                          ? `${item.progress}%`
                          : item.status === 'done'
                          ? '✓ Completado'
                          : item.status === 'error'
                          ? item.error || 'Error'
                          : 'En cola'}
                      </p>
                    </div>
                  </div>
                </div>
                {item.status === 'uploading' && (
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                      style={{ width: `${Math.min(item.progress, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

const DEFAULT_SETTINGS = {
  maxFileSizeMb: 25,
};
