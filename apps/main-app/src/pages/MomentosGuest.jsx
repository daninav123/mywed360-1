import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import UploadWidget from '@/components/momentos/UploadWidget';
import {
  getAlbumScenes,
  getGalleryUploadState,
  listenAlbum,
  validateGuestToken,
} from '@/services/momentosService';
import { firebaseReady } from '@/firebaseConfig';
import useTranslations from '@/hooks/useTranslations';
import { formatDate } from '../utils/formatUtils';
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

const formatDateLocal = (dateLike) => {
  if (!dateLike) return '';
  const date =
    dateLike instanceof Date ? dateLike : new Date(dateLike?.toDate ? dateLike.toDate() : dateLike);
  if (Number.isNaN(date.getTime())) return '';
  return formatDate(date, 'custom');
};

export default function MomentosGuest() {
  const { t } = useTranslations();
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
  const defaultErrorMessage = t('public.moments.guest.errors.invalidLink');

  useEffect(() => {
    let unsubscribeAlbum = null;
    const initialize = async () => {
      try {
        if (!tokenParam || !weddingId) {
          throw new Error(t('public.moments.guest.errors.incompleteLink'));
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
        // console.error('Validación de token de la galería de recuerdos', error);
        setErrorMessage(error?.message || t('public.moments.guest.errors.invalidLink'));
        setStatus('error');
      }
    };

    void initialize();

    return () => {
      try {
        unsubscribeAlbum && unsubscribeAlbum();
      } catch {}
    };
  }, [tokenParam, weddingId, t]);

  useEffect(() => {
    if (!uploadState) return;
    if (uploadState.isWindowOpen) return;
    if (status === 'error') return;
    setStatus('closed');
    const closesAtLabel = uploadState?.closesAt ? formatDate(uploadState.closesAt) : null;
    setErrorMessage(
      t('public.moments.guest.closedDescription', {
        date: closesAtLabel ? ` ${closesAtLabel}` : '',
      })
    );
  }, [status, t, uploadState]);

  const scenes = useMemo(() => {
    const base = getAlbumScenes(album);
    const fallback = [{ id: 'otros', label: t('public.moments.guest.scenes.other') }];
    if (tokenDoc?.sceneTargets?.length) {
      const allowed = tokenDoc.sceneTargets.map((scene) => scene.toLowerCase());
      const filtered = base.filter((scene) => allowed.includes(scene.id.toLowerCase()));
      const effective = filtered.length ? filtered : base;
      return effective.length ? effective : fallback;
    }
    return base.length ? base : fallback;
  }, [album, t, tokenDoc]);

  const guestId = useMemo(() => {
    const nameSlug = slugifyGuest(guestName);
    return `${tokenDoc?.id || 'token'}-${nameSlug}`;
  }, [guestName, tokenDoc?.id]);

  const uploader = useMemo(
    () => ({
      type: 'guest',
      uid: guestId,
      guestId,
      displayName: guestName || t('public.moments.guest.uploadStates.guestFallback'),
      tokenId: tokenDoc?.id || null,
      source: 'guest-portal',
    }),
    [guestId, guestName, t, tokenDoc?.id]
  );

  const handleStart = (event) => {
    event.preventDefault();
    if (!guestName.trim()) {
      toast.warn(t('public.moments.guest.form.errors.missingName'));
      return;
    }
    if (!acceptedTerms) {
      toast.warn(t('public.moments.guest.form.errors.missingTerms'));
      return;
    }
    if (uploadsClosed) {
      toast.warn(t('public.moments.guest.form.errors.uploadsClosed'));
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
      toast.success(t('public.moments.guest.toasts.firstUpload'));
    } else if (nextCount === 3) {
      toast.success(t('public.moments.guest.toasts.thirdUpload'));
    } else if (nextCount === 5) {
      toast.success(t('public.moments.guest.toasts.fifthUpload'));
    } else {
      toast.success(t('public.moments.guest.toasts.default'));
    }
  };

  const metadataBuilder = () => ({
    guestEmail: guestEmail || null,
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className=" border border-slate-200 rounded-xl shadow-sm px-6 py-8 space-y-3 text-center" style={{ backgroundColor: 'var(--color-surface)' }}>
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-slate-600">{t('public.moments.guest.loading')}</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className=" border border-red-100 rounded-xl shadow-sm px-6 py-8 max-w-md text-center space-y-3" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h1 className="text-xl font-semibold " style={{ color: 'var(--color-danger)' }}>
            {t('public.moments.guest.errorTitle')}
          </h1>
          <p className="text-sm text-slate-600">
            {t('public.moments.guest.errorDescription', {
              message: errorMessage || defaultErrorMessage,
            })}
          </p>
          <p className="text-xs text-slate-400">{t('public.moments.guest.errorHint')}</p>
        </div>
      </div>
    );
  }

  if (status === 'closed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className=" border border-amber-100 rounded-xl shadow-sm px-6 py-8 max-w-md text-center space-y-3" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h1 className="text-xl font-semibold text-amber-600">
            {t('public.moments.guest.closedTitle')}
          </h1>
          <p className="text-sm text-slate-600">
            {errorMessage ||
              t('public.moments.guest.closedDescription', {
                date: uploadState?.closesAt
                  ? ` ${formatDateLocal(uploadState.closesAt)}`
                  : '',
              })}
          </p>
          <p className="text-xs text-slate-400">
            {t('public.moments.guest.closedHint')}
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
          className=" border border-slate-200 rounded-2xl shadow-md px-8 py-10 w-full max-w-lg space-y-6" style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <header className="space-y-2 text-center">
            <p className="text-sm uppercase tracking-wide text-blue-500 font-semibold">
              {t('public.moments.guest.form.badge')}
            </p>
            <h1 className="text-2xl font-semibold text-slate-800">
              {t('public.moments.guest.form.title')}
            </h1>
            <p className="text-sm text-slate-500">
              {t('public.moments.guest.form.description')}
            </p>
            {uploadState?.closesAt && (
              <p className="text-xs text-slate-400">
                {t('public.moments.guest.form.deadline', {
                  date: formatDate(uploadState.closesAt),
                })}
              </p>
            )}
            {uploadState?.isWindowOpen && remainingDays !== null && remainingDays >= 0 && (
              <p className="text-xs text-slate-400">
                {t('public.moments.guest.form.remainingDays', { count: remainingDays })}
              </p>
            )}
            {uploadState?.compressionActive && (
              <p className="text-xs text-slate-400">
                {t('public.moments.guest.form.compressionNotice')}
              </p>
            )}
          </header>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                {t('public.moments.guest.form.nameLabel')}
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder={t('public.moments.guest.form.namePlaceholder')}
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                {t('public.moments.guest.form.emailLabel')}
              </label>
              <input
                type="email"
                value={guestEmail}
                onChange={(event) => setGuestEmail(event.target.value)}
                placeholder={t('public.moments.guest.form.emailPlaceholder')}
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
                {t('public.moments.guest.form.termsLabel')}
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full  hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-md transition" style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {t('public.moments.guest.form.submit')}
          </button>
          <p className="text-xs text-slate-400 text-center">
            {t('public.moments.guest.form.tip')}
          </p>
        </form>
      </div>
    );
  }

  const remainingUploads =
    tokenDoc?.maxUsages && tokenDoc.maxUsages > 0
      ? Math.max(tokenDoc.maxUsages - (tokenDoc.usedCount || 0) - uploadedCount, 0)
      : null;
  const guestDisplayName =
    guestName || t('public.moments.guest.uploadStates.guestFallback');
  const remainingUploadsText =
    remainingUploads === null
      ? t('public.moments.guest.uploadStates.remainingUploadsUnlimited')
      : remainingUploads === 1
        ? t('public.moments.guest.uploadStates.remainingUploadsOne')
        : t('public.moments.guest.uploadStates.remainingUploads', {
            count: remainingUploads,
          });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className=" border border-slate-200 rounded-2xl shadow-sm px-6 py-5 space-y-2" style={{ backgroundColor: 'var(--color-surface)' }}>
          <p className="text-xs uppercase tracking-wide text-blue-500 font-semibold">
            {t('public.moments.guest.uploadStates.badge')}
          </p>
          <h1 className="text-xl font-semibold text-slate-800">
            {t('public.moments.guest.uploadStates.greeting', { name: guestDisplayName })}
          </h1>
          <p className="text-sm text-slate-600">
            {remainingUploadsText}{' '}
            {t('public.moments.guest.uploadStates.reviewHint')}
          </p>
          {uploadState?.isWindowOpen && remainingDays !== null && remainingDays >= 0 && (
            <p className="text-xs text-slate-400">
              {t('public.moments.guest.uploadStates.remainingDays', {
                count: remainingDays,
              })}
            </p>
          )}
          {uploadState?.closesAt && (
            <p className="text-xs text-slate-400">
              {t('public.moments.guest.uploadStates.deadline', {
                date: formatDate(uploadState.closesAt),
              })}
            </p>
          )}
          {uploadState?.compressionActive && (
            <p className="text-xs text-slate-400">
              {t('public.moments.guest.uploadStates.compressionNotice')}
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

        <section className=" border border-slate-200 rounded-xl shadow-sm px-6 py-5 space-y-3" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h2 className="text-lg font-semibold text-slate-800">
            {t('public.moments.guest.uploadStates.progressTitle')}
          </h2>
          <p className="text-sm text-slate-500">
            {t('public.moments.guest.uploadStates.progressDescription', {
              count: uploadedCount,
            })}
          </p>
          {recentUploads.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
                {t('public.moments.guest.uploadStates.recentUploadsTitle')}
              </p>
              {recentUploads.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="flex items-center justify-between text-sm border border-slate-100 rounded-md px-3 py-2 bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-700 truncate">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {t('public.moments.guest.uploadStates.uploadStatus', {
                        scene: item.scene,
                        size: Math.round(item.size / 1024),
                      })}
                    </p>
                  </div>
                  <span className="text-xs  font-semibold" style={{ color: 'var(--color-success)' }}>
                    {t('public.moments.guest.uploadStates.uploadReview')}
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400">
            {t('public.moments.guest.uploadStates.uploadsEmpty')}
          </p>
        </section>
      </div>
    </div>
  );
}
