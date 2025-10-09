import React, { useEffect, useMemo, useState, useRef } from 'react';
import DOMPurify from 'dompurify';
import { toast } from 'react-toastify';

import PageWrapper from '../components/PageWrapper';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useWedding } from '../context/WeddingContext';
import { saveData, loadData } from '../services/SyncService';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const normalizePosts = (items = []) =>
  items
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      id: item.id || generateId(),
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

  // Agrupar <li> consecutivos en listas
  html = html.replace(/(<li>.*?<\/li>)/gs, (match) => match);
  html = html.replace(/(<li>.*<\/li>)(\n?<li>.*<\/li>)+/gs, (match) => {
    const cleaned = match.replace(/\n?/g, '');
    return `<ul>${cleaned}</ul>`;
  });

  // Convertir saltos dobles en párrafos
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

export default function Blog() {
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

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) || null,
    [posts, selectedPostId]
  );

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
        console.warn('[Blog] Error cargando posts', error);
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
      .catch((error) => console.warn('[Blog] Error guardando posts', error))
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
      id: generateId(),
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
      <PageWrapper title="Blog" className="max-w-6xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <Spinner />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Blog" className="max-w-6xl mx-auto">
      {!useFirestore && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Selecciona una boda activa para sincronizar las entradas del blog con tu equipo. Mientras
          tanto se guardarán sólo en este navegador.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-gray-800">Entradas</h2>
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
                      {new Date(post.updatedAt || post.createdAt).toLocaleDateString()}
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
                onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Ej. Cómo organizar la ceremonia civil perfecta"
                className="border rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Contenido</label>
              <textarea
                value={draft.content}
                onChange={(e) => setDraft((prev) => ({ ...prev, content: e.target.value }))}
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
              dangerouslySetInnerHTML={{ __html: previewHtml || '<p>Aquí verás la vista previa…</p>' }}
            />
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
