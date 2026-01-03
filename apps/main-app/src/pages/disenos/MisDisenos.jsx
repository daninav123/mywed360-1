import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { useWedding } from '../../context/WeddingContext';
import useTranslations from '../../hooks/useTranslations';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004/api';

export default function MisDiseños() {
  const { activeWedding } = useWedding();
  const { t } = useTranslations();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      if (!activeWedding) return;
      setLoading(true);
      setError('');
      try {
        await firebaseReady;
        const { collection, getDocs, orderBy, query } = await fsImport();
        const col = collection(db, 'weddings', activeWedding, 'designs');
        // orderBy createdAt may be missing; list anyway
        const snap = await getDocs(col);
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setItems(arr);
      } catch (e) {
        // console.error(e);
        setError(
          t('designsLibrary.myDesigns.messages.loadError', 'No se pudo cargar tus diseños')
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeWedding, t]);

  const handleDelete = async (it) => {
    if (
      !confirm(
        t('designsLibrary.myDesigns.confirmDelete', '¿Eliminar este diseño definitivamente?')
      )
    ) {
      return;
    }
    try {
      await firebaseReady;
      const { doc, deleteDoc } = await fsImport();
      const { getStorage, ref: sRef, deleteObject } = await stImport();
      if (it.storagePath) {
        const storage = getStorage();
        await deleteObject(sRef(storage, it.storagePath)).catch(() => {});
      }
      await deleteDoc(doc(db, 'weddings', activeWedding, 'designs', it.id));
      setItems((prev) => prev.filter((x) => x.id !== it.id));
    } catch (e) {
      // console.error(e);
      alert(t('designsLibrary.myDesigns.messages.deleteError', 'No se pudo eliminar'));
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {t('designsLibrary.myDesigns.title', 'Mis diseños')}
        </h1>
        <Link placeholder={t('design.myDesigns.searchPlaceholder')} className=" hover:underline" className="text-primary">
          {t('designsLibrary.myDesigns.backLink', 'Volver a Diseños')}
        </Link>
      </div>
      {!activeWedding && (
        <div className="p-3 border rounded bg-yellow-50 text-yellow-900">
          {t(
            'common.designsLibrary.myDesigns.warning.noWedding',
            'Selecciona una boda para ver sus diseños.'
          )}
        </div>
      )}
      {error && <div className="p-3 border rounded bg-red-50 text-red-700">{error}</div>}
      {loading && (
        <div className="text-sm " className="text-secondary">
          {t('designsLibrary.myDesigns.loading', 'Cargando...')}
        </div>
      )}
      {!loading && activeWedding && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <div key={it.id} className="border rounded overflow-hidden " className="bg-surface">
              <div className="p-2  text-xs  flex items-center justify-between" className="text-secondary" className="bg-page">
                <span>
                  {it.type || t('designsLibrary.myDesigns.item.typeFallback', 'diseño')}
                </span>
                <span>
                  {it.category ||
                    t('designsLibrary.myDesigns.item.categoryFallback', 'general')}
                </span>
              </div>
              <div className="aspect-square w-full overflow-hidden flex items-center justify-center " className="bg-surface">
                {it.url ? (
                  <img
                    src={it.url}
                    alt={
                      it.category ||
                      t('designsLibrary.myDesigns.item.typeFallback', 'diseño')
                    }
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className=" text-sm" className="text-muted">
                    {t('designsLibrary.myDesigns.item.noPreview', 'Sin vista previa')}
                  </div>
                )}
              </div>
              <div className="p-2 flex gap-2">
                {it.url && (
                  <button
                    className="px-2 py-1 text-sm rounded border"
                    onClick={() =>
                      navigate(
                        `/disenos/vector-editor?svg=${encodeURIComponent(it.url)}&category=${encodeURIComponent(
                          it.category ||
                            t('designsLibrary.myDesigns.item.categoryFallback', 'general')
                        )}`
                      )
                    }
                  >
                    {t('designsLibrary.myDesigns.actions.edit', 'Editar')}
                  </button>
                )}
                {it.url && (
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 text-sm rounded border"
                  >
                    {t('designsLibrary.myDesigns.actions.download', 'Descargar')}
                  </a>
                )}
                <button
                  className="px-2 py-1 text-sm rounded border " className="text-danger"
                  onClick={() => handleDelete(it)}
                >
                  {t('designsLibrary.myDesigns.actions.delete', 'Eliminar')}
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-sm " className="text-secondary">
              {t('designsLibrary.myDesigns.noItems', 'No hay diseños guardados todavía.')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
