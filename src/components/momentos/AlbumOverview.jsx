import React, { useMemo } from 'react';
import { toast } from 'react-toastify';

import HighlightRail from './HighlightRail';
import { getAlbumScenes } from '@/services/momentosService';

const StatCard = ({ label, value, accent = 'primary' }) => {
  const accentClass =
    accent === 'success'
      ? 'text-green-600 bg-green-50'
      : accent === 'warning'
      ? 'text-yellow-600 bg-yellow-50'
      : accent === 'danger'
      ? 'text-red-600 bg-red-50'
      : 'text-blue-600 bg-blue-50';
  return (
    <div className={`p-4 rounded-lg border border-gray-200 bg-white shadow-sm`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${accentClass}`}>{value}</p>
    </div>
  );
};

const CoverageBar = ({ label, value, total }) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{label}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const badgeLabels = {
  primerMomento: 'Primer momento',
  momentoEntusiasta: 'Colaborador entusiasta',
  momentoEstrella: 'Momento estrella',
};

export default function AlbumOverview({
  album,
  photos = [],
  highlights = [],
  tokens = [],
  shareUrl = '',
  guestProgress = [],
  onCreateToken,
  onCopyShareUrl,
}) {
  const counters = album?.counters || {};
  const scenes = getAlbumScenes(album);

  const sceneCoverage = useMemo(() => {
    const total = photos.length;
    const base = scenes.reduce((acc, scene) => ({ ...acc, [scene.id]: 0 }), {});
    const counts = photos.reduce((acc, photo) => {
      const sceneId = photo.scene || 'otros';
      acc[sceneId] = (acc[sceneId] || 0) + 1;
      return acc;
    }, base);
    return { total, counts };
  }, [photos, scenes]);

  const lastToken = tokens?.length ? tokens[0] : null;

  const leaderboard = useMemo(() => {
    if (!Array.isArray(guestProgress)) return [];
    return [...guestProgress]
      .sort((a, b) => (b?.totalUploads || 0) - (a?.totalUploads || 0))
      .slice(0, 5);
  }, [guestProgress]);

  const handleCopy = () => {
    if (!shareUrl) return;
    try {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Enlace copiado al portapapeles');
      onCopyShareUrl?.();
    } catch (error) {
      toast.error('No se pudo copiar el enlace');
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Fotos totales" value={counters.totalPhotos || photos.length} />
        <StatCard
          label="Pendientes"
          value={counters.pendingPhotos || 0}
          accent="warning"
        />
        <StatCard
          label="Aprobadas"
          value={counters.approvedPhotos || 0}
          accent="success"
        />
        <StatCard
          label="Rechazadas"
          value={counters.rejectedPhotos || 0}
          accent={counters.rejectedPhotos ? 'danger' : 'primary'}
        />
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Cobertura por escena</h3>
          <span className="text-sm text-gray-500">
            {sceneCoverage.total} fotos repartidas
          </span>
        </div>
        <div className="space-y-3">
          {scenes.map((scene) => (
            <CoverageBar
              key={scene.id}
              label={scene.label}
              value={sceneCoverage.counts[scene.id] || 0}
              total={sceneCoverage.total || 1}
            />
          ))}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Top colaboradores</h3>
          <p className="text-sm text-gray-500">
            Reconoce a quienes más aportan al álbum compartido.
          </p>
        </div>
        {leaderboard.length ? (
          <div className="space-y-3">
            {leaderboard.map((guest, index) => (
              <div
                key={guest.id || index}
                className="flex items-center justify-between border border-gray-100 rounded-md px-3 py-2 bg-gray-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-semibold text-blue-600">{index + 1}º</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {guest.displayName || 'Invitado anónimo'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {Array.isArray(guest.badges) && guest.badges.length
                        ? guest.badges
                            .map((badge) => badgeLabels[badge] || badge)
                            .join(' • ')
                        : 'Sin medallas todavía'}
                    </p>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700">
                  {guest.totalUploads || 0} fotos
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-gray-200 rounded-md p-6 text-center text-sm text-gray-500">
            Aún no hay suficientes aportaciones para mostrar un ranking. Comparte el QR y motiva a tus invitados.
          </div>
        )}
      </section>

      {!!highlights.length && (
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Highlights sugeridos</h3>
            <p className="text-sm text-gray-500">
              Basado en escenas, calidad y reacciones tempranas
            </p>
          </div>
          <HighlightRail photos={highlights} />
        </section>
      )}

      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Compartir con invitados</h3>
            <p className="text-sm text-gray-500">
              Genera un enlace con QR para que los invitados suban fotos desde sus móviles.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateToken}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium shadow hover:bg-blue-700 transition"
          >
            Generar nuevo enlace
          </button>
        </div>

        {shareUrl ? (
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-gray-50"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-100"
            >
              Copiar enlace
            </button>
          </div>
        ) : null}

        {!!tokens.length && (
          <div className="border border-gray-100 rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase tracking-wide text-xs">
                <tr>
                  <th className="text-left px-3 py-2">Token</th>
                  <th className="text-left px-3 py-2">Usos</th>
                  <th className="text-left px-3 py-2">Expira</th>
                  <th className="text-left px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <tr key={token.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-mono text-xs text-gray-700">
                      {token.token?.slice(0, 12) || token.id}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {token.usedCount || 0}/{token.maxUsages || '∞'}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {token.expiresAt?.toDate
                        ? token.expiresAt.toDate().toLocaleString()
                        : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          token.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {token.status || 'activo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {lastToken && (
              <p className="text-xs text-gray-400 px-3 py-2">
                Último token generado: {lastToken.id} ·{' '}
                {lastToken.createdAt?.toDate
                  ? lastToken.createdAt.toDate().toLocaleString()
                  : '—'}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
