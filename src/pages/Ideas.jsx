import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast } from 'react-toastify';

import ExternalImage from '@/components/ExternalImage';

import PageWrapper from '../components/PageWrapper';
import PageTabs from '../components/ui/PageTabs';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import { uploadEmailAttachments as uploadFilesToStorage } from '../services/storageUploadService';
import { saveData, loadData } from '../services/SyncService';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const normalizeNotes = (items = []) =>
  items
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      id: item.id || generateId(),
      folder: item.folder || 'General',
      text: item.text || '',
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
    }));

const DEFAULT_FOLDER = 'General';

export default function Ideas() {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid || 'guest';
  const useFirestore = !!currentUser;

  const [view, setView] = useState('notes');
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [folders, setFolders] = useState([DEFAULT_FOLDER]);
  const [currentFolder, setCurrentFolder] = useState(DEFAULT_FOLDER);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const textareaRef = useRef(null);
  const isLoadedRef = useRef(false);

  // Carga inicial
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

        const normalizedNotes = normalizeNotes(loadedNotes);
        setNotes(normalizedNotes);

        const normalizedFolders =
          Array.isArray(loadedFolders) && loadedFolders.length
            ? Array.from(new Set([DEFAULT_FOLDER, ...loadedFolders]))
            : [DEFAULT_FOLDER];
        setFolders(normalizedFolders);
        setCurrentFolder(
          normalizedFolders.includes(DEFAULT_FOLDER) ? DEFAULT_FOLDER : normalizedFolders[0]
        );

        setPhotos(Array.isArray(loadedPhotos) ? loadedPhotos : []);
      } catch (error) {
        console.warn('[Ideas] Error cargando datos iniciales', error);
      } finally {
        setLoading(false);
        isLoadedRef.current = true;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // Persistencia reactiva de notas
  useEffect(() => {
    if (loading || !isLoadedRef.current) return;
    saveData('ideasNotes', notes, {
      firestore: useFirestore,
      collection: 'userIdeas',
      showNotification: false,
    });
  }, [notes, useFirestore, loading]);

  // Persistencia de carpetas
  useEffect(() => {
    if (loading || !isLoadedRef.current) return;
    saveData('ideasFolders', folders, {
      firestore: useFirestore,
      collection: 'userIdeas',
      showNotification: false,
    });
  }, [folders, useFirestore, loading]);

  // Persistencia de fotos
  useEffect(() => {
    if (loading || !isLoadedRef.current) return;
    saveData('ideasUserPhotos', photos, {
      firestore: useFirestore,
      collection: 'userIdeas',
      showNotification: false,
    });
  }, [photos, useFirestore, loading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#nueva') {
      setView('notes');
      setTimeout(() => textareaRef.current?.focus(), 0);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const folderNotes = useMemo(
    () => notes.filter((note) => note.folder === currentFolder),
    [notes, currentFolder]
  );

  const handleAddNote = () => {
    const trimmed = noteText.trim();
    if (!trimmed) {
      toast.info('Escribe una nota antes de añadirla.');
      return;
    }
    const now = new Date().toISOString();
    const nextNote = {
      id: generateId(),
      folder: currentFolder,
      text: trimmed,
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [...prev, nextNote]);
    setNoteText('');
    toast.success('Nota añadida.');
  };

  const handleDeleteNote = (id) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
    if (editingNoteId === id) {
      setEditingNoteId(null);
      setEditingValue('');
    }
    toast.info('Nota eliminada.');
  };

  const handleStartEditing = (note) => {
    setEditingNoteId(note.id);
    setEditingValue(note.text);
    setTimeout(() => {
      const editor = document.getElementById(`note-editor-${note.id}`);
      editor?.focus();
    }, 0);
  };

  const handleSaveEdit = (id) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? { ...note, text: editingValue.trim(), updatedAt: new Date().toISOString() }
          : note
      )
    );
    setEditingNoteId(null);
    setEditingValue('');
    toast.success('Nota actualizada.');
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingValue('');
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.index === destination.index) return;

    const reorderedFolderNotes = Array.from(folderNotes);
    const [moved] = reorderedFolderNotes.splice(source.index, 1);
    reorderedFolderNotes.splice(destination.index, 0, moved);

    // reconstruir arreglo completo respetando otras carpetas
    const reorderedAll = [];
    let folderPointer = 0;
    notes.forEach((note) => {
      if (note.folder === currentFolder) {
        reorderedAll.push(reorderedFolderNotes[folderPointer++]);
      } else {
        reorderedAll.push(note);
      }
    });
    setNotes(reorderedAll);
  };

  const handleUploadPhotos = async (files) => {
    if (!files.length) return;
    const uploadingToast = toast.loading('Subiendo fotos...');
    try {
      const uploaded = await uploadFilesToStorage(files, uid, 'ideas');
      const mapped = uploaded.map((file) => ({
        url: file.url,
        name: file.filename,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      }));
      setPhotos((prev) => [...prev, ...mapped]);
      toast.update(uploadingToast, {
        render: 'Fotos añadidas correctamente.',
        type: 'success',
        isLoading: false,
        autoClose: 2000,
      });
    } catch (error) {
      console.error('[Ideas] Error subiendo fotos', error);
      toast.update(uploadingToast, {
        render: 'No se pudieron subir las fotos.',
        type: 'error',
        isLoading: false,
        autoClose: 2500,
      });
    }
  };

  const handleDeletePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  if (loading) {
    return (
      <PageWrapper title="Ideas" className="max-w-5xl mx-auto">
        <div className="flex justify-center items-center py-10">
          <Spinner />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Ideas" className="max-w-5xl mx-auto">
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
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {folders.map((folder) => (
              <button
                key={folder}
                onClick={() => {
                  setCurrentFolder(folder);
                  setEditingNoteId(null);
                  setEditingValue('');
                }}
                className={`px-2 py-1 rounded-full text-sm transition ${
                  currentFolder === folder
                    ? 'border border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border border-soft bg-surface text-body/80 hover:bg-[var(--color-accent)]/10'
                }`}
              >
                {folder}
              </button>
            ))}
            <button
              onClick={() => {
                const name = prompt('Nombre de la carpeta');
                if (name) {
                  const trimmed = name.trim();
                  if (trimmed && !folders.includes(trimmed)) {
                    setFolders((prev) => [...prev, trimmed]);
                    setCurrentFolder(trimmed);
                    toast.success('Carpeta creada.');
                  } else if (folders.includes(trimmed)) {
                    toast.info('La carpeta ya existe.');
                  }
                }
              }}
              className="px-2 py-1 rounded-full text-sm bg-[var(--color-success)] text-white"
            >
              + Nueva carpeta
            </button>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <textarea
              value={noteText}
              ref={textareaRef}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Escribe tu nota..."
              rows={3}
            />
            <div className="flex justify-end">
              <button
                onClick={handleAddNote}
                className="bg-[var(--color-primary)] text-white px-4 py-2 rounded"
              >
                Añadir nota
              </button>
            </div>
          </div>

          {folderNotes.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aún no hay notas en <strong>{currentFolder}</strong>. Añade la primera utilizando el
              cuadro superior.
            </p>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="ideas-notes">
                {(provided) => (
                  <ul
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2"
                  >
                    {folderNotes.map((note, index) => (
                      <Draggable key={note.id} draggableId={note.id} index={index}>
                        {(dragProvided, snapshot) => (
                          <li
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={`border rounded-md p-3 bg-white shadow-sm transition ${
                              snapshot.isDragging ? 'shadow-lg ring-2 ring-[var(--color-primary)]' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              {editingNoteId === note.id ? (
                                <textarea
                                  id={`note-editor-${note.id}`}
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  rows={3}
                                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                              ) : (
                                <p className="text-sm whitespace-pre-wrap break-words flex-1">
                                  {note.text}
                                </p>
                              )}
                              <div className="flex flex-col gap-2 text-xs text-gray-500 items-end">
                                <span>
                                  Creada:{' '}
                                  {new Date(note.createdAt).toLocaleDateString(undefined, {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })}
                                </span>
                                {note.updatedAt && note.updatedAt !== note.createdAt && (
                                  <span>
                                    Editada:{' '}
                                    {new Date(note.updatedAt).toLocaleDateString(undefined, {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                    })}
                                  </span>
                                )}
                                <div className="flex gap-2">
                                  {editingNoteId === note.id ? (
                                    <>
                                      <button
                                        onClick={() => handleSaveEdit(note.id)}
                                        className="px-2 py-1 bg-[var(--color-primary)] text-white rounded"
                                      >
                                        Guardar
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        className="px-2 py-1 border border-gray-300 rounded"
                                      >
                                        Cancelar
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleStartEditing(note)}
                                        className="px-2 py-1 border border-gray-300 rounded"
                                      >
                                        Editar
                                      </button>
                                      <button
                                        onClick={() => handleDeleteNote(note.id)}
                                        className="px-2 py-1 border border-red-300 text-red-600 rounded"
                                      >
                                        Eliminar
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      )}

      {view === 'photos' && (
        <div className="space-y-4">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={async (event) => {
              const files = Array.from(event.target.files || []);
              if (!files.length) return;
              await handleUploadPhotos(files);
              event.target.value = '';
            }}
          />
          {photos.length === 0 ? (
            <p className="text-sm text-gray-500">
              Añade imágenes de referencia para tus ideas. Se almacenarán en la nube y estarán
              disponibles sin conexión.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div key={`${photo.url}-${index}`} className="relative group">
                  <ExternalImage
                    src={photo.url}
                    alt={photo.name || `Foto ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg"
                    requireHttp={false}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                    {photo.name || `Foto ${index + 1}`}
                  </div>
                  <button
                    onClick={() => handleDeletePhoto(index)}
                    className="absolute top-1 right-1 bg-white/90 text-xs px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
}
