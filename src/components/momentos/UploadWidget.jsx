import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { uploadMomentPhoto } from '@/services/momentosService';
import SceneSelector from './SceneSelector';
import { useTranslations } from '../../hooks/useTranslations';

const makeQueueId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `upload_${
  const { t } = useTranslations();
Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

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
            message = {t('common.subio_archivo_identico_evitamos_duplicados')};
          } else if (message === 'video_exceeds_limit') {
            message =
              {t('common.los_videos_mas_minutos_bloquean')};
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

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className}`}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Subir fotos o videos</h3>
            <p className="text-sm text-gray-500">
              Arrastra tus archivos o selecciónalos manualmente. Se guardarán en la escena elegida.
            </p>
          </div>
          <div className="text-right min-w-[160px]">
            <span className="text-xs uppercase tracking-wide text-gray-400 block">
              Escena activa
            </span>
            {lockedScene ? (
              <div className="mt-1 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                {scenes.find((item) => item.id === scene)?.label || scene}
              </div>
            ) : (
              <SceneSelector scenes={scenes} value={scene} onChange={setScene} />
            )}
          </div>
        </div>

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
        className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
          isDragging
            ? 'border-blue-400 bg-blue-50/50'
            : 'border-gray-200 hover:border-blue-300'
        } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
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
        <p className="text-gray-600 mb-2">
          Suelta tus fotos aquí o{' '}
          <button
            type="button"
            className="text-blue-600 font-semibold hover:underline"
            onClick={openFileDialog}
          >
            selecciónalas
          </button>
        </p>
        <p className="text-xs text-gray-400">
          Fotos y videos compatibles · Se aplican límites de tamaño según configuración ({DEFAULT_SETTINGS?.maxFileSizeMb || 25} MB).
        </p>
      </div>

      {queue.length > 0 && (
        <div className="mt-4 space-y-2">
          {queue.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-md px-3 py-2 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-sm font-medium text-gray-800 truncate">{item.fileName}</p>
                <p className="text-xs text-gray-400">
                  {readableSize(item.size)} ·{' '}
                  {item.status === 'uploading'
                    ? `Subiendo (${item.progress}%)`
                    : item.status === 'done'
                    ? 'Completado'
                    : item.status === 'error'
                    ? item.error || 'Error'
                    : 'En cola'}
                </p>
              </div>
              <div className="w-28">
                <div className="h-2 bg-gray-100 rounded">
                  <div
                    className={`h-2 rounded ${
                      item.status === 'error'
                        ? 'bg-red-400'
                        : item.status === 'done'
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(item.progress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const DEFAULT_SETTINGS = {
  maxFileSizeMb: 25,
};
