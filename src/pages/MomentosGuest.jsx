import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import UploadWidget from '@/components/momentos/UploadWidget';
import {
  getAlbumScenes,
  getGalleryUploadState,
  listenAlbum,
  validateGuestToken,
} from '@/services/momentosService';
import { firebaseReady } from '@/firebaseConfig';

const ALBUM_ID = 'momentos';

const slugifyGuest = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'invitado';

const formatDate = (dateLike) => {
  if (!dateLike) return '';
  const date =
    dateLike instanceof Date ? dateLike : new Date(dateLike?.toDate ? dateLike.toDate() : dateLike);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function MomentosGuest() {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || '';
  const weddingId = searchParams.get('w') || '';

  const [status, setStatus] = useState('loading');
  const [tokenDoc, setTokenDoc] = useState(null);
  const [album, setAlbum] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [recentUploads, setRecentUploads] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const uploadState = useMemo(() => (album ? getGalleryUploadState(album) : null), [album]);
  const uploadsClosed = uploadState ? !uploadState.isWindowOpen : false;
  const remainingDays =
    typeof uploadState?.remainingDays === 'number' ? uploadState.remainingDays : null;

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
        setStatus('welcome');

        unsubscribeAlbum = await listenAlbum(
          weddingId,
          (data) => setAlbum(data),
          ALBUM_ID
        );
      } catch (error) {
        console.error('Validación de token de la galería de recuerdos', error);
        setErrorMessage(error?.message || 'Este enlace ya no es válido.');
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

  useEffect(() => {
    if (!uploadState) return;
    if (uploadState.isWindowOpen) return;
    if (status === 'error') return;
    setStatus('closed');
    setErrorMessage(
      `La galería dejó de aceptar fotos el ${formatDate(uploadState.closesAt)}.`
    );
  }, [uploadState, status]);

  const scenes = useMemo(() => {
    const base = getAlbumScenes(album);
    if (tokenDoc?.sceneTargets?.length) {
      const allowed = tokenDoc.sceneTargets.map((scene) => scene.toLowerCase());
      const filtered = base.filter((scene) => allowed.includes(scene.id.toLowerCase()));
      const effective = filtered.length ? filtered : base;
      return effective.length ? effective : [{ id: 'otros', label: 'Otros' }];
    }
    return base.length ? base : [{ id: 'otros', label: 'Otros' }];
  }, [album, tokenDoc]);

  const guestId = useMemo(() => {
    const nameSlug = slugifyGuest(guestName);
    return `${tokenDoc?.id || 'token'}-${nameSlug}`;
  }, [guestName, tokenDoc?.id]);

  const uploader = useMemo(
    () => ({
      type: 'guest',
      uid: guestId,
      guestId,
      displayName: guestName || 'Invitado',
      tokenId: tokenDoc?.id || null,
      source: 'guest-portal',
    }),
    [guestId, guestName, tokenDoc?.id]
  );

  const handleStart = (event) => {
    event.preventDefault();
    if (!guestName.trim()) {
      toast.warn('Indica tu nombre para personalizar tus aportaciones');
      return;
    }
    if (!acceptedTerms) {
      toast.warn('Debes aceptar la política de privacidad');
      return;
    }
    if (uploadsClosed) {
      toast.warn('Esta galería ya no acepta nuevas fotos.');
      setStatus('closed');
      return;
    }
    setStatus('upload');
  };

  const handleUploaded = ({ file, scene }) => {
    const nextCount = uploadedCount + 1;
    setUploadedCount(nextCount);
    setRecentUploads((prev) => [
      { name: file.name, size: file.size, scene, createdAt: new Date().toISOString() },
      ...prev.slice(0, 4),
    ]);
    if (nextCount === 1) {
      toast.success('🏅 ¡Logro desbloqueado! Primer recuerdo compartido ✨');
    } else if (nextCount === 3) {
      toast.success('🎉 ¡Eres un colaborador entusiasta! Sigue compartiendo recuerdos.');
    } else if (nextCount === 5) {
      toast.success('🌟 ¡Recuerdos Estrella! Tus fotos darán vida al slideshow.');
    } else {
      toast.success('Foto enviada correctamente');
    }
  };

  const metadataBuilder = () => ({
    guestEmail: guestEmail || null,
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-6 py-8 space-y-3 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-slate-600">Preparando tu espacio para compartir recuerdos…</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white border border-red-100 rounded-xl shadow-sm px-6 py-8 max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold text-red-600">No pudimos abrir la galería de recuerdos</h1>
          <p className="text-sm text-slate-600">{errorMessage}</p>
          <p className="text-xs text-slate-400">
            Si crees que es un error, ponte en contacto con la pareja anfitriona para solicitar un nuevo enlace.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'closed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white border border-amber-100 rounded-xl shadow-sm px-6 py-8 max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold text-amber-600">La galería está cerrada</h1>
          <p className="text-sm text-slate-600">
            {errorMessage ||
              `El periodo para subir fotos terminó${uploadState?.closesAt ? ` el ${formatDate(uploadState.closesAt)}` : ''}.`}
          </p>
          <p className="text-xs text-slate-400">
            Si todavía tienes recuerdos que compartir, avisa a la pareja anfitriona para que reabra el enlace.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <form
          onSubmit={handleStart}
          className="bg-white border border-slate-200 rounded-2xl shadow-md px-8 py-10 w-full max-w-lg space-y-6"
        >
          <header className="space-y-2 text-center">
            <p className="text-sm uppercase tracking-wide text-blue-500 font-semibold">
              Recuerdos compartidos
            </p>
            <h1 className="text-2xl font-semibold text-slate-800">
              ¡Gracias por capturar recuerdos!
            </h1>
            <p className="text-sm text-slate-500">
              Sube tus fotos favoritas del evento. El anfitrión podrá revisarlas y mostrarlas en el slideshow en vivo.
            </p>
            {uploadState?.closesAt && (
              <p className="text-xs text-slate-400">
                La galería admite nuevas fotos hasta {formatDate(uploadState.closesAt)}.
              </p>
            )}
            {uploadState?.isWindowOpen && remainingDays !== null && remainingDays >= 0 && (
              <p className="text-xs text-slate-400">
                Te quedan {remainingDays === 1 ? '1 día' : `${remainingDays} días`} para compartir recuerdos.
              </p>
            )}
            {uploadState?.compressionActive && (
              <p className="text-xs text-slate-400">
                Las fotos se optimizarán automáticamente para no ocupar tanto espacio.
              </p>
            )}
          </header>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Tu nombre
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Ej. Laura G."
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Correo electrónico (opcional)
              </label>
              <input
                type="email"
                value={guestEmail}
                onChange={(event) => setGuestEmail(event.target.value)}
                placeholder="Te avisaremos cuando tus fotos estén destacadas"
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <label className="flex items-start gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={() => setAcceptedTerms((prev) => !prev)}
                className="mt-1"
                required
              />
              <span>
                Acepto compartir mis fotos con la pareja anfitriona y confirmo que tengo permiso para hacerlo.
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-md transition"
          >
            Comenzar a subir fotos
          </button>
          <p className="text-xs text-slate-400 text-center">
            Tip: las fotos se agrupan por escena (ceremonia, banquete, fiesta…) para ayudar al anfitrión.
          </p>
        </form>
      </div>
    );
  }

  const remainingUploads =
    tokenDoc?.maxUsages && tokenDoc.maxUsages > 0
      ? Math.max(tokenDoc.maxUsages - (tokenDoc.usedCount || 0) - uploadedCount, 0)
      : null;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="bg-white border border-slate-200 rounded-2xl shadow-sm px-6 py-5 space-y-2">
          <p className="text-xs uppercase tracking-wide text-blue-500 font-semibold">
            Recuerdos colaborativos
          </p>
          <h1 className="text-xl font-semibold text-slate-800">
            Hola, {guestName || 'Invitado'} 👋
          </h1>
          <p className="text-sm text-slate-600">
            Sube hasta {remainingUploads !== null ? `${remainingUploads} fotos adicionales` : 'todas las fotos que quieras'}.
            El anfitrión revisará y las compartirá con el grupo.
          </p>
          {uploadState?.isWindowOpen && remainingDays !== null && remainingDays >= 0 && (
            <p className="text-xs text-slate-400">
              Aún tienes {remainingDays === 1 ? '1 día' : `${remainingDays} días`} para enviar tus mejores fotos.
            </p>
          )}
          {uploadState?.closesAt && (
            <p className="text-xs text-slate-400">
              Disponible hasta {formatDate(uploadState.closesAt)}.
            </p>
          )}
          {uploadState?.compressionActive && (
            <p className="text-xs text-slate-400">
              Las fotos nuevas se optimizan automáticamente para ahorrar espacio.
            </p>
          )}
        </header>

        <UploadWidget
          weddingId={weddingId}
          albumId={ALBUM_ID}
          scenes={scenes}
          uploader={uploader}
          metadataBuilder={metadataBuilder}
          onUploaded={handleUploaded}
          disabled={uploadsClosed}
        />

        <section className="bg-white border border-slate-200 rounded-xl shadow-sm px-6 py-5 space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">Tus progresos</h2>
          <p className="text-sm text-slate-500">
            Has compartido <strong>{uploadedCount}</strong> {uploadedCount === 1 ? 'foto' : 'fotos'}.
            ¡Gracias por sumar a los recuerdos!
          </p>
          {recentUploads.length > 0 && (
            <div className="space-y-2">
              {recentUploads.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="flex items-center justify-between text-sm border border-slate-100 rounded-md px-3 py-2 bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-700 truncate">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      Escena: {item.scene} · {Math.round(item.size / 1024)} KB
                    </p>
                  </div>
                  <span className="text-xs text-green-600 font-semibold">En revisión</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400">
            Las fotos aprobadas aparecerán en el slideshow del evento y en la galería final. El anfitrión avisará cuando estén listas.
          </p>
        </section>
      </div>
    </div>
  );
}
