import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Camera, Sparkles, ChevronRight, UploadCloud, X } from 'lucide-react';

import UploadWidget from '@/components/momentos/UploadWidget';
import {
  getAlbumScenes,
  getGalleryUploadState,
  listenAlbum,
  validateGuestToken,
} from '@/services/momentosService';
import { firebaseReady } from '@/firebaseConfig';

const ALBUM_ID = 'momentos';

const formatDate = (value) => {
  if (!value) return '';
  const date =
    value instanceof Date
      ? value
      : value?.toDate?.()
      ? value.toDate()
      : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
  });
};

export default function MomentosPublic() {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || '';
  const weddingId = searchParams.get('w') || '';

  const [status, setStatus] = useState('loading');
  const [album, setAlbum] = useState(null);
  const [tokenDoc, setTokenDoc] = useState(null);
  const [selectedScene, setSelectedScene] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [startedUpload, setStartedUpload] = useState(false);
  const [recentUploads, setRecentUploads] = useState([]);

  const storageKey = useMemo(() => {
    if (!tokenDoc?.id) return null;
    return `momentos-public-${tokenDoc.id}`;
  }, [tokenDoc?.id]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const stored = JSON.parse(raw);
      if (stored?.guestName) setGuestName(stored.guestName);
      if (stored?.guestEmail) setGuestEmail(stored.guestEmail);
      if (stored?.acceptedTerms) setAcceptedTerms(Boolean(stored.acceptedTerms));
    } catch (error) {
      console.warn('[MomentosPublic] no se pudo leer preferencias almacenadas', error);
    }
  }, [storageKey]);

  const persistGuestPrefs = useCallback(
    (next = {}) => {
      if (!storageKey) return;
      try {
        const payload = {
          guestName: next.guestName ?? guestName,
          guestEmail: next.guestEmail ?? guestEmail,
          acceptedTerms:
            typeof next.acceptedTerms === 'boolean' ? next.acceptedTerms : acceptedTerms,
        };
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch (error) {
        console.warn('[MomentosPublic] no se pudo guardar preferencias', error);
      }
    },
    [acceptedTerms, guestEmail, guestName, storageKey]
  );

  useEffect(() => {
    let unsubscribeAlbum = null;
    const initialize = async () => {
      try {
        if (!tokenParam || !weddingId) {
          throw new Error('El enlace está incompleto. Solicita un nuevo QR al anfitrión.');
        }
        await firebaseReady;
        const tokenData = await validateGuestToken(weddingId, tokenParam, { albumId: ALBUM_ID });
        setTokenDoc(tokenData);
        setStatus('ready');

        unsubscribeAlbum = await listenAlbum(
          weddingId,
          (data) => setAlbum(data),
          ALBUM_ID
        );
      } catch (error) {
        console.error('[MomentosPublic] token validation error', error);
        setStatus('error');
      }
    };

    void initialize();

    return () => {
      try {
        unsubscribeAlbum && unsubscribeAlbum();
      } catch {}
    };
  }, [tokenParam, weddingId]);

  const scenes = useMemo(() => {
    const base = getAlbumScenes(album);
    if (tokenDoc?.sceneTargets?.length) {
      const allowed = tokenDoc.sceneTargets.map((scene) => scene.toLowerCase());
      const filtered = base.filter((scene) => allowed.includes(scene.id.toLowerCase()));
      return filtered.length ? filtered : base;
    }
    return base;
  }, [album, tokenDoc]);

  const uploadState = useMemo(() => getGalleryUploadState(album), [album]);
  const uploadsClosed = uploadState ? !uploadState.isWindowOpen : false;

  const guestId = useMemo(() => {
    const slug = (guestName || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${tokenDoc?.id || 'token'}-${slug || 'invitado'}`;
  }, [guestName, tokenDoc?.id]);

  const uploader = useMemo(
    () => ({
      type: 'guest',
      uid: guestId,
      guestId,
      displayName: guestName || 'Invitado',
      tokenId: tokenDoc?.id || null,
      source: 'guest-public',
    }),
    [guestId, guestName, tokenDoc?.id]
  );

  const remainingUploads = useMemo(() => {
    if (!tokenDoc?.maxUsages) return null;
    return Math.max(tokenDoc.maxUsages - (tokenDoc.usedCount || 0), 0);
  }, [tokenDoc?.maxUsages, tokenDoc?.usedCount]);

  const resolveSceneLabel = useCallback(
    (sceneId) => scenes.find((scene) => scene.id === sceneId)?.label || sceneId,
    [scenes]
  );

  const metadataBuilder = useCallback(
    () => ({
      guestEmail: guestEmail || null,
      originView: 'public-cards',
    }),
    [guestEmail]
  );

  const handleSceneSelect = (scene) => {
    if (uploadsClosed) {
      toast.warn('La galería ya no acepta nuevas fotos.');
      return;
    }
    setSelectedScene(scene);
    if (acceptedTerms && guestEmail && guestName) {
      setStartedUpload(true);
    } else {
      setStartedUpload(false);
    }
  };

  const handleStart = (event) => {
    event?.preventDefault();
    if (!guestName.trim()) {
      toast.warn('Indica tu nombre para personalizar tus aportaciones');
      return;
    }
    if (!acceptedTerms) {
      toast.warn('Debes aceptar la política de privacidad');
      return;
    }
    persistGuestPrefs({ guestName: guestName.trim(), guestEmail, acceptedTerms: true });
    setStartedUpload(true);
  };

  const handleUploaded = ({ file, scene }) => {
    setRecentUploads((prev) => [
      {
        name: file.name,
        size: file.size,
        scene: resolveSceneLabel(scene),
        at: new Date().toISOString(),
      },
      ...prev.slice(0, 4),
    ]);
    toast.success('¡Gracias! Tu archivo se ha enviado correctamente.');
  };

  const handleCloseOverlay = () => {
    setSelectedScene(null);
    setStartedUpload(false);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <div className="animate-spin h-10 w-10 border-2 border-slate-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-slate-400">Preparando la galería…</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white px-6">
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl px-6 py-8 max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold text-white">No pudimos abrir la galería</h1>
          <p className="text-sm text-slate-300">
            Este enlace ya no es válido o ha sido revocado. Contacta con la pareja anfitriona para solicitar uno nuevo.
          </p>
        </div>
      </div>
    );
  }

  const remainingDays = uploadState?.remainingDays ?? null;
  const cleanupDays = uploadState?.cleanupDaysRemaining ?? null;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="px-6 pt-10 pb-6 bg-gradient-to-b from-slate-900 to-slate-950">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-300 font-semibold">
          Galería de recuerdos
        </p>
        <h1 className="text-3xl font-bold mt-3">
          {album?.settings?.publicTitle || 'Comparte tus mejores momentos'}
        </h1>
        <p className="text-sm text-slate-300 mt-3 max-w-sm">
          Elige un momento para tus recuerdos y súbelos directamente desde tu móvil.
        </p>
        {uploadState?.closesAt && uploadState.isWindowOpen && remainingDays !== null && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-400/40 px-4 py-2 text-xs font-medium text-blue-200">
            <Sparkles size={14} />
            Disponible hasta {formatDate(uploadState.closesAt)} · {remainingDays === 0 ? 'Último día' : `${remainingDays} días restantes`}
          </div>
        )}
        {uploadsClosed && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-400/40 px-4 py-2 text-xs font-medium text-amber-200">
            La subida de archivos ha finalizado para esta galería.
          </div>
        )}
      </header>

      <main className="flex-1 bg-white text-slate-900 rounded-t-[32px] -mt-4 relative z-10">
        <div className="px-5 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Momentos destacados</h2>
            <span className="text-xs text-slate-400">
              {scenes.length} momentos disponibles
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {scenes.map((scene) => (
              <button
                key={scene.id}
                type="button"
                onClick={() => handleSceneSelect(scene)}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    {scene.emoji ? (
                      <span className="text-xl" aria-hidden="true">{scene.emoji}</span>
                    ) : (
                      <Camera size={22} />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{scene.label || scene.id}</p>
                    <p className="text-xs text-slate-500">
                      Sube instantáneamente tus fotos o videos de este momento.
                    </p>
                  </div>
                </div>
                <ChevronRight className="text-slate-400" size={20} />
              </button>
            ))}

            {!scenes.length && (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                Los anfitriones aún no han configurado momentos específicos. Vuelve más tarde para compartir tus recuerdos.
              </div>
            )}
          </div>

          {!!recentUploads.length && (
            <section className="bg-slate-900 text-white rounded-2xl px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <UploadCloud size={18} />
                Últimas aportaciones
              </div>
              <div className="mt-3 space-y-2">
                {recentUploads.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="flex items-center justify-between text-xs text-slate-200 border border-white/10 rounded-xl px-3 py-2 bg-white/5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.scene} · {Math.round(item.size / 1024)} KB
                      </p>
                    </div>
                    <span className="text-[11px] text-green-300">En revisión</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {cleanupDays !== null && cleanupDays >= 0 && (
            <p className="text-xs text-slate-400 text-center">
              La galería permanecerá disponible aproximadamente {cleanupDays === 0 ? 'un día más' : `${cleanupDays} días más`} antes de archivarse automáticamente.
            </p>
          )}
        </div>
      </main>

      {selectedScene && (
        <div className="fixed inset-0 z-40 flex flex-col bg-black/60">
          <div className="mt-auto bg-white rounded-t-3xl px-5 py-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Momento seleccionado</p>
                <h3 className="text-lg font-semibold text-slate-800">
                  {selectedScene.label || selectedScene.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseOverlay}
                className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-700 hover:border-slate-300"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {!startedUpload ? (
              <form onSubmit={handleStart} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Tu nombre</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    placeholder="Ej. Laura G."
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Correo electrónico (opcional)</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(event) => setGuestEmail(event.target.value)}
                    placeholder="Te avisaremos cuando destaquen tus recuerdos"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <label className="flex items-start gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={() => setAcceptedTerms((prev) => !prev)}
                    className="mt-1"
                    required
                  />
                  <span>
                    Confirmo que tengo permiso para compartir estas imágenes y acepto que la pareja anfitriona las utilice en la galería.
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
                >
                  Empezar a subir recuerdos
                </button>
              </form>
            ) : (
              <div className="mt-4">
                <UploadWidget
                  key={selectedScene.id}
                  weddingId={weddingId}
                  albumId={ALBUM_ID}
                  scenes={scenes}
                  uploader={uploader}
                  metadataBuilder={metadataBuilder}
                  onUploaded={handleUploaded}
                  initialScene={selectedScene.id}
                  lockedScene
                />
                {remainingUploads !== null && (
                  <p className="mt-3 text-xs text-slate-500 text-center">
                    Puedes subir {remainingUploads === 0 ? '0 archivos adicionales' : `${remainingUploads} archivos adicionales`} con este enlace.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
