import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast } from 'react-toastify';
import DOMPurify from 'dompurify';

import ExternalImage from '@/components/ExternalImage';

import PageWrapper from '../components/PageWrapper';
import PageTabs from '../components/ui/PageTabs';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useWedding } from '../context/WeddingContext';
import { uploadEmailAttachments as uploadFilesToStorage } from '../services/storageUploadService';
import { saveData, loadData } from '../services/SyncService';
import { formatDate } from '../utils/formatUtils';

const generateNoteId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const normalizeNotes = (items = []) =>
  items
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      id: item.id || generateNoteId(),
      folder: item.folder || 'General',
      text: item.text || '',
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
    }));

const DEFAULT_FOLDER = 'General';

const generatePostId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const normalizePosts = (items = []) =>
  items
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      id: item.id || generatePostId(),
      title: item.title || 'Entrada sin título',
      content: item.content || '',
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
      authorId: item.authorId || 'anon',
      authorName: item.authorName || 'Equipo',
    }));

const simpleMarkdownToHtml = (markdown = '') => {
  let html = markdown
    .replace(/\r\n/g, '\n')
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/^\s*[-*] (.*)$/gm, '<li>$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  html = html.replace(/(<li>.*?<\/li>)/gs, (match) => match);
  html = html.replace(/(<li>.*<\/li>)(\n?<li>.*<\/li>)+/gs, (match) => {
    const cleaned = match.replace(/\n?/g, '');
    return `<ul>${cleaned}</ul>`;
  });

  const paragraphs = html
    .split(/\n{2,}/)
    .map((section) => {
      const trimmed = section.trim();
      if (!trimmed) return '';
      if (/^<h[1-3]>/.test(trimmed) || /^<ul>/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .filter(Boolean)
    .join('');

  return DOMPurify.sanitize(paragraphs);
};

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
        // console.warn('[Ideas] Error cargando datos iniciales', error);
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
      id: generateNoteId(),
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
      // console.error('[Ideas] Error subiendo fotos', error);
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
          { id: 'blog', label: 'Blog interno' },
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
                  <ul ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                    {folderNotes.map((note, index) => (
                      <Draggable key={note.id} draggableId={note.id} index={index}>
                        {(dragProvided, snapshot) => (
                          <li
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={`border rounded-md p-3 bg-white shadow-sm transition ${
                              snapshot.isDragging
                                ? 'shadow-lg ring-2 ring-[var(--color-primary)]'
                                : ''
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
                                <span>Creada: {formatDate(note.createdAt, 'custom')}</span>
                                {note.updatedAt && note.updatedAt !== note.createdAt && (
                                  <span>Editada: {formatDate(note.updatedAt, 'custom')}</span>
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

      {view === 'blog' && <IdeasBlogSection />}
    </PageWrapper>
  );
}

function IdeasBlogSection() {
  const { currentUser } = useAuth();
  const { activeWedding } = useWedding();

  const useFirestore = Boolean(activeWedding);
  const docPath = useFirestore ? `weddings/${activeWedding}` : undefined;

  const [posts, setPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [draft, setDraft] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isLoadedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const storedPosts = await loadData('blogPosts', {
          firestore: useFirestore,
          docPath,
          fallbackToLocal: true,
        });
        const normalized = normalizePosts(storedPosts);
        setPosts(normalized);
        if (normalized.length) {
          setSelectedPostId(normalized[0].id);
          setDraft({ title: normalized[0].title, content: normalized[0].content });
        }
      } catch (error) {
        // console.warn('[IdeasBlogSection] Error cargando posts', error);
      } finally {
        setLoading(false);
        isLoadedRef.current = true;
      }
    })();
  }, [docPath, useFirestore]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    setIsSaving(true);
    saveData('blogPosts', posts, {
      firestore: useFirestore,
      docPath,
      mergeWithExisting: true,
      showNotification: false,
    })
      .catch(() => {
        // console.warn('[IdeasBlogSection] Error guardando posts', error)
      })
      .finally(() => setIsSaving(false));
  }, [posts, docPath, useFirestore]);

  const resetDraft = () => setDraft({ title: '', content: '' });

  const handleSelectPost = (postId) => {
    const post = posts.find((item) => item.id === postId);
    if (!post) return;
    setSelectedPostId(postId);
    setDraft({ title: post.title, content: post.content });
  };

  const handleCreatePost = () => {
    const title = draft.title.trim();
    const content = draft.content.trim();
    if (!title || !content) {
      toast.info('Completa el título y el contenido antes de guardar.');
      return;
    }
    const now = new Date().toISOString();
    const newPost = {
      id: generatePostId(),
      title,
      content,
      createdAt: now,
      updatedAt: now,
      authorId: currentUser?.uid || 'anon',
      authorName: currentUser?.displayName || currentUser?.email || 'Equipo',
    };
    setPosts((prev) => [newPost, ...prev]);
    setSelectedPostId(newPost.id);
    toast.success('Entrada creada.');
  };

  const handleUpdatePost = () => {
    if (!selectedPostId) {
      handleCreatePost();
      return;
    }
    const title = draft.title.trim();
    const content = draft.content.trim();
    if (!title || !content) {
      toast.info('Completa el título y el contenido antes de guardar.');
      return;
    }
    setPosts((prev) =>
      prev.map((post) =>
        post.id === selectedPostId
          ? {
              ...post,
              title,
              content,
              updatedAt: new Date().toISOString(),
              authorId: currentUser?.uid || post.authorId,
              authorName: currentUser?.displayName || currentUser?.email || post.authorName,
            }
          : post
      )
    );
    toast.success('Entrada actualizada.');
  };

  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
    if (selectedPostId === postId) {
      setSelectedPostId(null);
      resetDraft();
    }
    toast.info('Entrada eliminada.');
  };

  const previewHtml = useMemo(() => simpleMarkdownToHtml(draft.content), [draft.content]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900">Blog interno</h2>
        <p className="text-sm text-gray-600">
          Gestiona entradas internas para alinear al equipo. Se sincronizarán con la boda activa
          cuando esté seleccionada.
        </p>
      </header>

      {!useFirestore && (
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Selecciona una boda activa para sincronizar las entradas con tu equipo. Mientras tanto se
          guardarán sólo en este navegador.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-gray-800">Entradas</h3>
            <button
              onClick={() => {
                setSelectedPostId(null);
                resetDraft();
              }}
              className="px-3 py-1 text-sm bg-[var(--color-primary)] text-white rounded"
            >
              Nueva entrada
            </button>
          </div>
          {posts.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aún no hay entradas. Crea la primera con el editor de la derecha.
            </p>
          ) : (
            <ul className="space-y-2">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className={`border rounded-md p-3 text-sm cursor-pointer transition ${
                    post.id === selectedPostId
                      ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectPost(post.id)}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium truncate">{post.title}</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(post.updatedAt || post.createdAt, 'short')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Título</label>
              <input
                type="text"
                value={draft.title}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                placeholder="Ej. Cómo organizar la ceremonia civil perfecta"
                className="border rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Contenido</label>
              <textarea
                value={draft.content}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    content: event.target.value,
                  }))
                }
                rows={12}
                className="border rounded px-3 py-2 text-sm font-mono"
                placeholder="Escribe en formato Markdown ligero. Usa ## títulos, **negritas**, listas con - ..."
              />
            </div>
            <div className="flex justify-between items-center gap-3 flex-wrap">
              <span className="text-xs text-gray-500">
                {isSaving ? 'Guardando…' : 'Cambios guardados automáticamente'}
              </span>
              <div className="flex gap-2">
                {selectedPostId && (
                  <button
                    onClick={() => handleDeletePost(selectedPostId)}
                    className="px-3 py-2 text-sm border border-red-300 text-red-600 rounded"
                  >
                    Eliminar
                  </button>
                )}
                <button
                  onClick={handleUpdatePost}
                  className="px-3 py-2 text-sm bg-[var(--color-primary)] text-white rounded"
                >
                  {selectedPostId ? 'Guardar cambios' : 'Publicar'}
                </button>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Vista previa</h3>
            <div
              className="prose prose-sm max-w-none text-sm text-gray-700"
              dangerouslySetInnerHTML={{
                __html: previewHtml || '<p>Aquí verás la vista previa…</p>',
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
