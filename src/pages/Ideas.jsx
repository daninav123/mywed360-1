import React, { useState, useRef, useEffect } from 'react';

import ExternalImage from '@/components/ExternalImage';

import PageWrapper from '../components/PageWrapper';
import SyncIndicator from '../components/SyncIndicator';
import PageTabs from '../components/ui/PageTabs';
import { useAuth } from '../hooks/useAuth';
import { uploadEmailAttachments as uploadFilesToStorage } from '../services/storageUploadService';
import { saveData, loadData } from '../services/SyncService';

export default function Ideas() {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid || 'guest';
  const useFirestore = !!currentUser;

  const [view, setView] = useState('notes');
  const [notes, setNotes] = useState([]); // {folder, text}
  const [noteText, setNoteText] = useState('');
  const [folders, setFolders] = useState(['General']);
  const [currentFolder, setCurrentFolder] = useState('General');
  const [photos, setPhotos] = useState([]); // [{ url, name, size }]
  const [loading, setLoading] = useState(true);
  const textareaRef = useRef(null);

  // Carga inicial (Firestore si autenticado, Local si no)
  useEffect(() => {
    (async () => {
      try {
        const [loadedNotes, loadedFolders, loadedPhotos] = await Promise.all([
          loadData('ideasNotes', {
            firestore: useFirestore,
            collection: 'userIdeas',
            fallbackToLocal: true,
          }),
          loadData('ideasFolders', {
            firestore: useFirestore,
            collection: 'userIdeas',
            fallbackToLocal: true,
          }),
          loadData('ideasUserPhotos', {
            firestore: useFirestore,
            collection: 'userIdeas',
            fallbackToLocal: true,
          }),
        ]);
        setNotes(Array.isArray(loadedNotes) ?loadedNotes : []);
        const f =
          Array.isArray(loadedFolders) && loadedFolders.length ?loadedFolders : ['General'];
        setFolders(f);
        setCurrentFolder(f.includes('General') ?'General' : f[0]);
        setPhotos(Array.isArray(loadedPhotos) ?loadedPhotos : []);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // Persistencia reactiva de notas y carpetas
  useEffect(() => {
    if (loading) return;
    saveData('ideasNotes', notes, {
      firestore: useFirestore,
      collection: 'userIdeas',
      showNotification: false,
    });
  }, [notes, useFirestore, loading]);
  useEffect(() => {
    if (loading) return;
    saveData('ideasFolders', folders, {
      firestore: useFirestore,
      collection: 'userIdeas',
      showNotification: false,
    });
  }, [folders, useFirestore, loading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#nueva') {
      setView('notes');
      setTimeout(() => textareaRef.current?.focus(), 0);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  return (
    <PageWrapper title="Ideas" className="max-w-5xl mx-auto">
      <SyncIndicator />
      <PageTabs
        value={view}
        onChange={setView}
        options={[
          { id: 'notes', label: 'Notas' },
          { id: 'photos', label: 'Fotos' },
        ]}
        className="mb-4"
      />
      {view === 'notes' && (
        <div>
          {/* Selector de carpetas */}
          <div className="flex items-center space-x-2 mb-4">
            {folders.map((folder) => (
              <button
                key={folder}
                onClick={() => setCurrentFolder(folder)}
                className={`px-2 py-1 rounded-full text-sm ${currentFolder === folder ?'border border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border border-soft bg-surface text-body/80 hover:bg-[var(--color-accent)]/10'}`}
              >
                {folder}
              </button>
            ))}
            <button
              onClick={() => {
                const name = prompt('Nombre de la carpeta');
                if (name && !folders.includes(name)) {
                  setFolders([...folders, name]);
                  setCurrentFolder(name);
                }
              }}
              className="px-2 py-1 rounded-full text-sm bg-[var(--color-success)] text-white"
            >
              + Nueva carpeta
            </button>
          </div>
          <textarea
            value={noteText}
            ref={textareaRef}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full border rounded p-2 mb-2"
            placeholder="Escribe tu nota..."
          />
          <button
            onClick={() => {
              if (noteText) {
                setNotes((prev) => [...prev, { folder: currentFolder, text: noteText.trim() }]);
                setNoteText('');
              }
            }}
            className="bg-[var(--color-primary)] text-white px-4 py-2 rounded"
          >
            Añadir Nota
          </button>
          <ul className="mt-4 list-disc list-inside">
            {notes
              .filter((n) => n.folder === currentFolder)
              .map((n, i) => (
                <li key={i}>{n.text}</li>
              ))}
          </ul>
        </div>
      )}

      {view === 'photos' && (
        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              if (!files.length) return;
              // Reutilizamos el uploader de adjuntos con una ruta separada lldave (userId)
              const uploaded = await uploadFilesToStorage(files, uid, 'ideas');
              const mapped = uploaded.map((u) => ({ url: u.url, name: u.filename, size: u.size }));
              const next = [...photos, ...mapped];
              setPhotos(next);
              await saveData('ideasUserPhotos', next, {
                firestore: useFirestore,
                collection: 'userIdeas',
                showNotification: false,
              });
              e.target.value = '';
            }}
          />
          <div className="mt-4 grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative">
                <ExternalImage
                  src={p.url}
                  alt={p.name || `Foto ${i}`}
                  className="w-full h-32 object-cover rounded"
                  requireHttp={false}
                />
                <div className="absolute bottom-1 left-1 right-1 text-[10px] bg-black/40 text-white px-1 py-0.5 rounded truncate">
                  {p.name || `Foto ${i + 1}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
