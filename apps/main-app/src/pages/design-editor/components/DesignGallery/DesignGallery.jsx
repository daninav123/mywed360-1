import React, { useState, useEffect } from 'react';
import { X, Download, Edit, Trash2, Copy } from 'lucide-react';
import { db, firebaseReady } from '../../../../firebaseConfig';
import { useWedding } from '../../../../context/WeddingContext';

const fsImport = () => import('firebase/firestore');

export default function DesignGallery({ isOpen, onClose, onLoadDesign }) {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { activeWedding } = useWedding();

  useEffect(() => {
    if (!isOpen || !activeWedding) return;

    const loadDesigns = async () => {
      try {
        await firebaseReady;
        const { collection, query, orderBy, getDocs } = await fsImport();

        const designsRef = collection(db, 'weddings', activeWedding, 'designs');
        const q = query(designsRef, orderBy('updatedAt', 'desc'));
        const snapshot = await getDocs(q);

        const designsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setDesigns(designsData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading designs:', error);
        setLoading(false);
      }
    };

    loadDesigns();
  }, [isOpen, activeWedding]);

  const handleDelete = async (designId) => {
    if (!confirm('¿Eliminar este diseño?')) return;

    try {
      await firebaseReady;
      const { doc, deleteDoc } = await fsImport();
      await deleteDoc(doc(db, 'weddings', activeWedding, 'designs', designId));
      setDesigns(designs.filter((d) => d.id !== designId));
    } catch (error) {
      console.error('Error deleting design:', error);
      alert('Error al eliminar el diseño');
    }
  };

  const handleDuplicate = async (design) => {
    try {
      await firebaseReady;
      const { collection, addDoc, serverTimestamp } = await fsImport();

      const designsRef = collection(db, 'weddings', activeWedding, 'designs');
      const newDesign = {
        canvas: design.canvas,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(designsRef, newDesign);
      alert('✅ Diseño duplicado');
      window.location.reload();
    } catch (error) {
      console.error('Error duplicating design:', error);
      alert('Error al duplicar el diseño');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-testid="design-gallery">
      <div className=" rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="p-6 border-b  flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-2xl font-bold">Mis Diseños</h2>
          <button onClick={onClose} className=" hover:" style={{ color: 'var(--color-muted)' }} style={{ color: 'var(--color-text)' }} data-testid="close-icon">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : designs.length === 0 ? (
            <div className="text-center py-12 " style={{ color: 'var(--color-muted)' }}>
              <p>No tienes diseños guardados aún</p>
              <p className="text-sm mt-2">Crea tu primer diseño para verlo aquí</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {designs.map((design) => (
                <div key={design.id} className="border  rounded-lg overflow-hidden hover:shadow-lg transition-shadow" style={{ borderColor: 'var(--color-border)' }} data-testid="design-card">
                  <div className="aspect-[3/4]  flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
                    <div className=" text-sm" style={{ color: 'var(--color-muted)' }}>Preview</div>
                  </div>
                  <div className="p-4">
                    <div className="text-sm  mb-3" style={{ color: 'var(--color-muted)' }}>
                      {design.updatedAt?.toDate?.()?.toLocaleDateString() || 'Sin fecha'}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onLoadDesign(design);
                          onClose();
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2  text-white rounded hover:bg-blue-700" style={{ backgroundColor: 'var(--color-primary)' }}
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDuplicate(design)}
                        className="px-3 py-2 border  rounded hover:" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-bg)' }}
                        title="Duplicar"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(design.id)}
                        className="px-3 py-2 border border-red-300  rounded hover:bg-red-50" style={{ color: 'var(--color-danger)' }}
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
