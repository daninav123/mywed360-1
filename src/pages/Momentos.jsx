import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import PageWrapper from '@/components/PageWrapper';
import PageTabs from '@/components/ui/PageTabs';
import UploadWidget from '@/components/momentos/UploadWidget';
import AlbumOverview from '@/components/momentos/AlbumOverview';
import ModerationBoard from '@/components/momentos/ModerationBoard';
import DownloadBundle from '@/components/momentos/DownloadBundle';
import LiveSlideshow from '@/components/momentos/LiveSlideshow';
import SceneManager from '@/components/momentos/SceneManager';
import {
  buildGuestShareUrl,
  createGuestToken,
  ensureMomentosAlbum,
  getDownloadLinks,
  getAlbumScenes,
  listenAlbum,
  listenGuestProgress,
  listenGuestTokens,
  listenPhotos,
  summarizeByScene,
  updateAlbumSettings,
  updatePhotoStatus,
} from '@/services/momentosService';
import { useAuth } from '@/hooks/useAuth';
import { useWedding } from '@/context/WeddingContext';

const ALBUM_ID = 'momentos';

const TABS = [
  { id: 'overview', label: 'Resumen' },
  { id: 'moderation', label: 'Moderación' },
  { id: 'slideshow', label: 'Slideshow' },
  { id: 'downloads', label: 'Descargas' },
];

const PUBLIC_BASE =
  (typeof import.meta !== 'undefined' &&
    import.meta &&
    import.meta.env &&
    (import.meta.env.VITE_PUBLIC_MOMENTOS_URL || import.meta.env.VITE_PUBLIC_BASE_URL)) ||
  '';

function resolveShareUrl(token, weddingId) {
  if (!token || !weddingId) return '';
  const base =
    PUBLIC_BASE ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://mywed360.app');
  return buildGuestShareUrl({
    baseUrl: base,
    token: token.token || token.id,
    weddingId,
  });
}

export default function Momentos() {
  const { activeWedding, weddingsReady } = useWedding();
  const { currentUser } = useAuth();

  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [guestProgress, setGuestProgress] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [shareUrl, setShareUrl] = useState('');
  const [loadingAlbum, setLoadingAlbum] = useState(false);

  useEffect(() => {
    if (!activeWedding) return undefined;
    let unsubAlbum = null;
    let unsubPhotos = null;
    let unsubTokens = null;
    let unsubGuestProgress = null;
    setLoadingAlbum(true);

    ensureMomentosAlbum(activeWedding)
      .then(() => {
        listenAlbum(
          activeWedding,
          (data) => {
            setAlbum(data);
            setLoadingAlbum(false);
          },
          ALBUM_ID
        )
          .then((unsubscribe) => {
            unsubAlbum = unsubscribe;
          })
          .catch((error) => {
            console.error('listenAlbum error', error);
          });
        listenPhotos(activeWedding, (items) => setPhotos(items), {
          albumId: ALBUM_ID,
          limit: 400,
        })
          .then((unsubscribe) => {
            unsubPhotos = unsubscribe;
          })
          .catch((error) => console.error('listenPhotos error', error));
        listenGuestTokens(
          activeWedding,
          (items) => {
            setTokens(items);
            if (items?.length) {
              setShareUrl(resolveShareUrl(items[0], activeWedding));
            }
          },
          { albumId: ALBUM_ID }
        )
          .then((unsubscribe) => {
            unsubTokens = unsubscribe;
          })
          .catch((error) => console.error('listenGuestTokens error', error));

        listenGuestProgress(
          activeWedding,
          (records) => setGuestProgress(records),
          { albumId: ALBUM_ID, limit: 100 }
        )
          .then((unsubscribe) => {
            unsubGuestProgress = unsubscribe;
          })
          .catch((error) => console.error('listenGuestProgress error', error));
      })
      .catch((error) => {
        console.error('Error inicializando Momentos', error);
        toast.error('No se pudo cargar Momentos. Revisa tu conexión o permisos.');
        setLoadingAlbum(false);
      });

    return () => {
      try {
        unsubAlbum && unsubAlbum();
        unsubPhotos && unsubPhotos();
        unsubTokens && unsubTokens();
        unsubGuestProgress && unsubGuestProgress();
      } catch {}
    };
  }, [activeWedding]);

  const pendingPhotos = useMemo(
    () => photos.filter((photo) => (photo.status || 'pending') === 'pending'),
    [photos]
  );
  const approvedPhotos = useMemo(
    () => photos.filter((photo) => photo.status === 'approved'),
    [photos]
  );
  const rejectedPhotos = useMemo(
    () => photos.filter((photo) => photo.status === 'rejected'),
    [photos]
  );

  const highlights = useMemo(() => {
    if (!approvedPhotos.length) return [];
    return [...approvedPhotos]
      .sort((a, b) => (b?.highlight?.score || 0) - (a?.highlight?.score || 0))
      .slice(0, 10);
  }, [approvedPhotos]);

  const scenes = getAlbumScenes(album);
  const sceneSummary = summarizeByScene(approvedPhotos);

  const handleCreateToken = async () => {
    if (!activeWedding) return;
    try {
      const token = await createGuestToken(activeWedding, {
        albumId: ALBUM_ID,
        createdBy: currentUser?.uid || null,
      });
      const url = resolveShareUrl(token, activeWedding);
      setShareUrl(url);
      toast.success('Nuevo enlace generado');
    } catch (error) {
      console.error('createGuestToken', error);
      toast.error('No se pudo generar el enlace, reinténtalo más tarde.');
    }
  };

  const handleApprove = async (photo) => {
    try {
      await updatePhotoStatus({
        weddingId: activeWedding,
        albumId: ALBUM_ID,
        photoId: photo.id,
        status: 'approved',
        actorId: currentUser?.uid || null,
      });
      toast.success('Foto aprobada');
    } catch (error) {
      console.error('approve photo error', error);
      toast.error('No se pudo aprobar la foto');
    }
  };

  const handleReject = async (photo) => {
    const reason =
      typeof window !== 'undefined'
        ? window.prompt('Motivo del rechazo', 'No cumple con la guía de Momentos')
        : 'Rechazado';
    if (reason === null) return;
    try {
      await updatePhotoStatus({
        weddingId: activeWedding,
        albumId: ALBUM_ID,
        photoId: photo.id,
        status: 'rejected',
        reason: reason || 'Rechazado',
        actorId: currentUser?.uid || null,
      });
      toast.info('Foto rechazada');
    } catch (error) {
      console.error('reject photo error', error);
      toast.error('No se pudo rechazar la foto');
    }
  };

  const handleReset = async (photo) => {
    try {
      await updatePhotoStatus({
        weddingId: activeWedding,
        albumId: ALBUM_ID,
        photoId: photo.id,
        status: 'pending',
        actorId: currentUser?.uid || null,
      });
      toast.success('La foto volvió a pendiente');
    } catch (error) {
      console.error('reset photo error', error);
      toast.error('No se pudo revertir el estado');
    }
  };

  const handleFetchDownloadLinks = ({ status }) =>
    getDownloadLinks(activeWedding, { albumId: ALBUM_ID, status });

  const handleScenesSave = async (nextScenes) => {
    if (!activeWedding) return;
    try {
      await updateAlbumSettings(activeWedding, { scenes: nextScenes }, ALBUM_ID);
      toast.success('Escenas actualizadas');
    } catch (error) {
      console.error('update scenes error', error);
      toast.error('No se pudieron guardar las escenas');
    }
  };

  if (!weddingsReady) {
    return (
      <PageWrapper title="Momentos">
        <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-500">
          Cargando bodas...
        </div>
      </PageWrapper>
    );
  }

  if (!activeWedding) {
    return (
      <PageWrapper title="Momentos">
        <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-500">
          Selecciona una boda para gestionar Momentos.
        </div>
      </PageWrapper>
    );
  }

  if (loadingAlbum && !album) {
    return (
      <PageWrapper title="Momentos">
        <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-500">
          Preparando tu álbum colaborativo...
        </div>
      </PageWrapper>
    );
  }

  const uploaderInfo = {
    uid: currentUser?.uid || null,
    displayName: currentUser?.displayName || currentUser?.email || 'Anfitrión',
    type: 'host',
  };

  return (
    <PageWrapper title="Momentos">
      <PageTabs value={activeTab} onChange={setActiveTab} options={TABS} className="mb-6" />

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <UploadWidget
            weddingId={activeWedding}
            albumId={ALBUM_ID}
            scenes={scenes}
            uploader={uploaderInfo}
            onUploaded={() => toast.success('Foto subida a Momentos')}
          />
          <AlbumOverview
            album={album}
            photos={approvedPhotos}
            highlights={highlights}
            tokens={tokens}
            shareUrl={shareUrl}
            guestProgress={guestProgress}
            onCreateToken={handleCreateToken}
          />
          <SceneManager scenes={scenes} onSave={handleScenesSave} />
        </div>
      )}

      {activeTab === 'moderation' && (
        <ModerationBoard
          pending={pendingPhotos}
          approved={approvedPhotos}
          rejected={rejectedPhotos}
          scenes={scenes}
          onApprove={handleApprove}
          onReject={handleReject}
          onReset={handleReset}
        />
      )}

      {activeTab === 'slideshow' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Presentación en vivo</h3>
              <p className="text-sm text-gray-500">
                Conecta una pantalla secundaria y deja que los momentos fluyan automáticamente.
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {approvedPhotos.length} fotos aprobadas ·{' '}
              {sceneSummary?.scenes
                ? Object.keys(sceneSummary.scenes).length
                : scenes.length}{' '}
              escenas cubiertas
            </div>
          </div>
          <LiveSlideshow
            photos={approvedPhotos}
            autoAdvanceSeconds={album?.settings?.slideshow?.autoAdvanceSeconds || 6}
            highlightMode
          />
        </div>
      )}

      {activeTab === 'downloads' && (
        <DownloadBundle fetchLinks={handleFetchDownloadLinks} />
      )}
    </PageWrapper>
  );
}
