import React, { useMemo, useState } from 'react';

const resolveImage = (photo) =>
  photo?.urls?.thumb || photo?.urls?.optimized || photo?.urls?.original || '';

const PhotoCard = ({ photo, onApprove, onReject, onReset }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
    <div className="aspect-video bg-gray-100">
      {resolveImage(photo) ? (
        <img
          src={resolveImage(photo)}
          alt={photo.scene || 'Foto'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
          Sin preview
        </div>
      )}
    </div>
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-500">
        <span>{photo.scene || 'otros'}</span>
        <span>{photo.uploaderType === 'guest' ? 'Invitado' : 'Equipo'}</span>
      </div>
      {photo.guestName && (
        <p className="text-sm text-gray-600">Por: {photo.guestName}</p>
      )}
      <div className="flex items-center gap-2">
        {typeof photo.reactions?.heart === 'number' && (
          <span className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded-full">
            ❤️ {photo.reactions.heart}
          </span>
        )}
        {typeof photo.reactions?.wow === 'number' && (
          <span className="text-xs bg-purple-50 text-purple-500 px-2 py-1 rounded-full">
            🤩 {photo.reactions.wow}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        {onReject && (
          <button
            type="button"
            onClick={() => onReject(photo)}
            className="flex-1 px-3 py-2 text-xs font-medium border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition"
          >
            Rechazar
          </button>
        )}
        {onReset && (
          <button
            type="button"
            onClick={() => onReset(photo)}
            className="px-3 py-2 text-xs font-medium border border-gray-200 text-gray-600 rounded-md hover:bg-gray-100 transition"
          >
            Reset
          </button>
        )}
        {onApprove && (
          <button
            type="button"
            onClick={() => onApprove(photo)}
            className="flex-1 px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Aprobar
          </button>
        )}
      </div>
    </div>
  </div>
);

export default function ModerationBoard({
  pending = [],
  approved = [],
  rejected = [],
  scenes = [],
  onApprove,
  onReject,
  onReset,
}) {
  const [activeScene, setActiveScene] = useState('all');

  const pendingFiltered = useMemo(() => {
    if (activeScene === 'all') return pending;
    return pending.filter((photo) => (photo.scene || 'otros') === activeScene);
  }, [activeScene, pending]);

  const sceneOptions = useMemo(() => {
    const base = new Map([['all', 'Todas']]);
    scenes.forEach((scene) => base.set(scene.id, scene.label || scene.id));
    return Array.from(base.entries());
  }, [scenes]);

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Pendientes por revisar</h3>
            <p className="text-sm text-gray-500">
              Revisa y decide qué fotos aparecen en la galería compartida.
            </p>
          </div>
          <select
            value={activeScene}
            onChange={(event) => setActiveScene(event.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700"
          >
            {sceneOptions.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {pendingFiltered.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingFiltered.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onApprove={onApprove}
                onReject={onReject}
              />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-gray-200 rounded-md p-6 text-center text-sm text-gray-500">
            No hay fotos pendientes en esta escena.
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Aprobadas recientes</h3>
          <p className="text-sm text-gray-500">
            Estas fotos ya están visibles para invitados y en el slideshow.
          </p>
        </div>
        {approved.length ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {approved.slice(0, 12).map((photo) => (
              <div key={photo.id} className="border border-gray-200 rounded-md overflow-hidden">
                <img
                  src={resolveImage(photo)}
                  alt={photo.scene || 'Foto aprobada'}
                  className="w-full h-32 object-cover"
                />
                <div className="p-2 text-xs text-gray-600 flex items-center justify-between">
                  <span>{photo.scene || 'Otros'}</span>
                  <span className="text-green-600 font-medium">OK</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Todavía no hay fotos aprobadas.</p>
        )}
      </section>

      {!!rejected.length && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Rechazadas</h3>
            <p className="text-xs text-gray-500">
              Conservamos un registro para evitar duplicados o abusos.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {rejected.slice(0, 20).map((photo) => (
              <button
                type="button"
                key={photo.id}
                onClick={() => onReset?.(photo)}
                className="w-24 h-24 border border-gray-200 rounded-md overflow-hidden hover:ring-2 hover:ring-red-300 transition"
              >
                <img
                  src={resolveImage(photo)}
                  alt="Rechazada"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
