import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useWedding } from '../../context/WeddingContext';
import { db, firebaseReady } from '../../firebaseConfig';

const fsImport = () => import('firebase/firestore');
const stImport = () => import('firebase/storage');

export default function MisDiseños() {
  const { activeWedding } = useWedding();
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
        console.error(e);
        setError('No se pudo cargar tus diseños');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeWedding]);

  const handleDelete = async (it) => {
    if (!confirm('¿Eliminar este diseño definitivamente?')) return;
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
      console.error(e);
      alert('No se pudo eliminar');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mis diseños</h1>
        <Link to="/disenos" className="text-blue-600 hover:underline">
          Volver a Diseños
        </Link>
      </div>
      {!activeWedding && (
        <div className="p-3 border rounded bg-yellow-50 text-yellow-900">
          Selecciona una boda para ver sus diseños.
        </div>
      )}
      {error && <div className="p-3 border rounded bg-red-50 text-red-700">{error}</div>}
      {loading && <div className="text-sm text-gray-600">Cargando...</div>}
      {!loading && activeWedding && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <div key={it.id} className="border rounded overflow-hidden bg-white">
              <div className="p-2 bg-gray-50 text-xs text-gray-600 flex items-center justify-between">
                <span>{it.type || 'diseño'}</span>
                <span>{it.category || 'general'}</span>
              </div>
              <div className="aspect-square w-full overflow-hidden flex items-center justify-center bg-white">
                {it.url ? (
                  <img
                    src={it.url}
                    alt={it.category || 'diseño'}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-400 text-sm">Sin vista previa</div>
                )}
              </div>
              <div className="p-2 flex gap-2">
                {it.url && (
                  <button
                    className="px-2 py-1 text-sm rounded border"
                    onClick={() =>
                      navigate(
                        `/disenos/vector-editor?svg=${encodeURIComponent(it.url)}&category=${encodeURIComponent(it.category || 'general')}`
                      )
                    }
                  >
                    Editar
                  </button>
                )}
                {it.url && (
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 text-sm rounded border"
                  >
                    Descargar
                  </a>
                )}
                <button
                  className="px-2 py-1 text-sm rounded border text-red-600"
                  onClick={() => handleDelete(it)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-sm text-gray-600">No hay diseños guardados todavía.</div>
          )}
        </div>
      )}
    </div>
  );
}
