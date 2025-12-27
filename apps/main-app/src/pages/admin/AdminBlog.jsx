import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import {
  archiveAdminBlogPost,
  listAdminBlogPosts,
  publishAdminBlogPost,
  scheduleAdminBlogPost,
  updateAdminBlogPost,
  triggerAdminBlogPlanGeneration,
} from '../../services/adminBlogService';

const STATUS_LABELS = {
  draft: 'Borrador',
  scheduled: 'Programado',
  published: 'Publicado',
  archived: 'Archivado',
  failed: 'Fallido',
};

const STATUS_BADGE = {
  draft: 'bg-warning-soft text-warning',
  scheduled: 'bg-info-soft text-info',
  published: 'bg-success-soft text-success',
  archived: 'bg-[color:var(--color-border)] text-muted',
  failed: 'bg-danger-soft text-danger',
};


const emptyEditorState = {
  id: null,
  title: '',
  excerpt: '',
  markdown: '',
  tagsInput: '',
  status: 'draft',
};

function formatDate(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('es-ES', { hour12: false });
  } catch {
    return value;
  }
}

function parseTags(input) {
  if (!input) return [];
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

const AdminBlog = () => {
  const [posts, setPosts] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listStatusFilter, setListStatusFilter] = useState('published');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [editor, setEditor] = useState(emptyEditorState);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedId) || null,
    [posts, selectedId]
  );


  const loadPosts = async (status = listStatusFilter) => {
    setLoadingList(true);
    try {
      const { posts: apiPosts } = await listAdminBlogPosts({
        status,
        limit: 80,
      });
      setPosts(apiPosts || []);
    } catch (error) {
      // console.error('[AdminBlog] loadPosts failed', error);
      toast.error('No se pudieron cargar las noticias del blog.');
    } finally {
      setLoadingList(false);
    }
  };

  const handleGenerateNew = async () => {
    setGenerating(true);
    try {
      const { result } = await triggerAdminBlogPlanGeneration();
      if (result?.processed) {
        toast.success('✅ Artículo generado con IA en 6 idiomas');
      } else if (result?.reason === 'no-plan-entry') {
        toast.info('No hay temas pendientes en el plan automático.');
      } else {
        toast.success('Generación iniciada.');
      }
      await loadPosts(listStatusFilter);
    } catch (error) {
      toast.error('Error al generar el artículo.');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadPosts('published');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedPost) {
      setEditor(emptyEditorState);
      return;
    }
    setEditor({
      id: selectedPost.id,
      title: selectedPost.title || '',
      excerpt: selectedPost.excerpt || '',
      markdown: selectedPost.content?.markdown || '',
      tagsInput: (selectedPost.tags || []).join(', '),
      status: selectedPost.status || 'draft',
    });
  }, [selectedPost]);

  const updatePostInState = (updatedPost) => {
    setPosts((prev) => prev.map((post) => (post.id === updatedPost.id ? updatedPost : post)));
  };

  const handleSave = async () => {
    if (!editor.id) return;
    if (!editor.title.trim()) {
      toast.warning('El título no puede estar vacío.');
      return;
    }
    if (!editor.markdown.trim()) {
      toast.warning('El contenido no puede estar vacío.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: editor.title.trim(),
        excerpt: editor.excerpt.trim(),
        content: { markdown: editor.markdown },
        tags: parseTags(editor.tagsInput),
        status: editor.status,
      };
      if (editor.scheduledAt) {
        const iso = new Date(editor.scheduledAt);
        if (!Number.isNaN(iso.getTime())) {
          payload.scheduledAt = iso.toISOString();
        }
      } else if (selectedPost?.scheduledAt) {
        payload.scheduledAt = null;
      }
      const { post } = await updateAdminBlogPost(editor.id, payload);
      updatePostInState(post);
      toast.success('Cambios guardados.');
      loadScheduled();
    } catch (error) {
      // console.error('[AdminBlog] save failed', error);
      toast.error('No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!editor.id) return;
    setPublishing(true);
    try {
      const { post } = await publishAdminBlogPost(editor.id);
      updatePostInState(post);
      toast.success('Artículo publicado.');
      loadScheduled();
    } catch (error) {
      // console.error('[AdminBlog] publish failed', error);
      toast.error('No se pudo publicar el artículo.');
    } finally {
      setPublishing(false);
    }
  };

  const handleSchedule = async () => {
    if (!editor.id || !editor.scheduledAt) {
      toast.warning('Selecciona una fecha para programar la publicación.');
      return;
    }
    try {
      const isoDate = new Date(editor.scheduledAt);
      if (Number.isNaN(isoDate.getTime())) {
        toast.warning('La fecha de programación no es válida.');
        return;
      }
      const { post } = await scheduleAdminBlogPost(editor.id, isoDate.toISOString());
      updatePostInState(post);
      toast.success('Artículo programado.');
      loadScheduled();
    } catch (error) {
      // console.error('[AdminBlog] schedule failed', error);
      toast.error('No se pudo programar el artículo.');
    }
  };

  const handleArchive = async () => {
    if (!editor.id) return;
    try {
      const { post } = await archiveAdminBlogPost(editor.id);
      updatePostInState(post);
      toast.info('Artículo archivado.');
      loadScheduled();
    } catch (error) {
      // console.error('[AdminBlog] archive failed', error);
      toast.error('No se pudo archivar el artículo.');
    }
  };

  const filteredPosts = useMemo(() => {
    const byStatus =
      listStatusFilter === 'all' ? posts : posts.filter((post) => post.status === listStatusFilter);

    const query = searchTerm.trim().toLowerCase();
    if (!query) return byStatus;

    return byStatus.filter((post) => {
      const candidate = [
        post.title,
        post.excerpt,
        (post.tags || []).join(' '),
        post.content?.markdown,
        post.research?.summary,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return candidate.includes(query);
    });
  }, [posts, listStatusFilter, searchTerm]);

  const latestPost = useMemo(() => {
    return posts
      .filter((p) => p.status === 'scheduled' || p.status === 'published')
      .sort((a, b) => {
        const dateA = new Date(a.generatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.generatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      })[0];
  }, [posts]);

  return (
    <div className="layout-container-wide space-y-6 pb-16 pt-6">
      {/* Header + Botón Principal */}
      <section className="rounded-xl border border-soft bg-surface p-8 shadow-sm">
        <div className="text-center space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Blog Lovenda</h1>
            <p className="text-sm text-muted mt-1">
              La IA genera artículos automáticamente en 6 idiomas
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateNew}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-semibold text-[color:var(--color-on-primary)] transition hover:opacity-90 disabled:opacity-60"
          >
            <span className="text-xl">🤖</span>
            {generating ? 'Generando artículo...' : 'Generar artículo ahora'}
          </button>

          {latestPost && (
            <div className="mt-6 pt-6 border-t border-soft">
              <p className="text-xs uppercase text-muted mb-2">Último artículo generado:</p>
              <div className="text-left max-w-2xl mx-auto">
                <button
                  type="button"
                  onClick={() => setSelectedId(latestPost.id)}
                  className="w-full text-left rounded-lg border border-soft bg-surface-muted p-4 hover:bg-surface transition"
                >
                  <p className="font-semibold text-body">{latestPost.title}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                    <span>
                      Estado: <span className="font-semibold">{STATUS_LABELS[latestPost.status]}</span>
                    </span>
                    {latestPost.scheduledAt && (
                      <span>• {formatDate(latestPost.scheduledAt)}</span>
                    )}
                    {latestPost.availableLanguages && (
                      <span>• Idiomas: {latestPost.availableLanguages.length}</span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-semibold">Artículos Publicados</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative">
                <label htmlFor="admin-blog-search" className="sr-only">
                  Buscar artículos
                </label>
                <input
                  id="admin-blog-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por título, tags o contenido…"
                  className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary sm:min-w-[220px]"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-soft bg-surface max-h-[520px] overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-surface-muted text-xs uppercase text-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Título</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                  <th className="px-3 py-2 text-left">Generado</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.length === 0 && !loadingList ? (
                  <tr>
                    <td className="px-3 py-4 text-center text-muted" colSpan={3}>
                      {searchTerm
                        ? 'No hay artículos que coincidan con tu búsqueda.'
                        : 'No hay artículos con este filtro.'}
                    </td>
                  </tr>
                ) : null}
                {filteredPosts.map((post) => {
                  const isActive = post.id === selectedId;
                  return (
                    <tr
                      key={post.id}
                      className={`cursor-pointer border-b last:border-b-0 ${
                        isActive ? 'bg-primary-soft' : 'hover:bg-surface-muted'
                      }`}
                      onClick={() => setSelectedId(post.id)}
                    >
                      <td className="px-3 py-3">
                        <div className="font-medium text-body line-clamp-2">{post.title}</div>
                        <div className="text-xs text-muted">
                          Generado: {formatDate(post.generatedAt)}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[post.status] || 'bg-[color:var(--color-border)] text-muted'}`}
                        >
                          {STATUS_LABELS[post.status] || post.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-body">
                        {formatDate(post.generatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Detalle</h2>
            {selectedPost ? (
              <span className="text-xs text-muted">
                ID: <code>{selectedPost.id}</code>
                {selectedPost.coverImage?.storagePath ? (
                  <span className="ml-2 text-muted opacity-70">
                    <span className="hidden sm:inline">· Storage: </span>
                    <code>{selectedPost.coverImage?.storagePath}</code>
                  </span>
                ) : null}
              </span>
            ) : null}
          </div>

          {selectedPost ? (
            <div className="space-y-4 rounded-xl border border-soft bg-surface p-5">
              <div>
                <label className="text-xs font-semibold uppercase text-muted block mb-1">
                  Título
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm"
                  value={editor.title}
                  onChange={(event) =>
                    setEditor((prev) => ({ ...prev, title: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted block mb-1">
                  Extracto
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm"
                  value={editor.excerpt}
                  onChange={(event) =>
                    setEditor((prev) => ({ ...prev, excerpt: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted block mb-1">
                  Contenido (Markdown)
                </label>
                <textarea
                  rows={16}
                  className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm font-mono"
                  value={editor.markdown}
                  onChange={(event) =>
                    setEditor((prev) => ({ ...prev, markdown: event.target.value }))
                  }
                />
              </div>

              {selectedPost?.research?.summary ? (
                <div className="rounded-md border border-dashed border-soft bg-primary-soft p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-semibold uppercase text-primary">
                        Investigación IA
                      </h3>
                      <p className="mt-1 text-sm text-body leading-relaxed">
                        {selectedPost.research.summary}
                      </p>
                    </div>
                    <span className="text-xs text-muted">
                      {selectedPost.research.provider || 'sin proveedor'}
                    </span>
                  </div>
                  {Array.isArray(selectedPost.research.references) &&
                  selectedPost.research.references.length ? (
                    <ul className="mt-3 space-y-1 text-xs text-muted list-disc list-inside">
                      {selectedPost.research.references.slice(0, 6).map((ref) => (
                        <li key={ref.url || ref.title}>
                          <span className="font-medium text-body">{ref.title}</span>
                          {ref.url ? (
                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-2 text-primary hover:underline"
                            >
                              abrir
                            </a>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              {selectedPost?.coverImage ? (
                <div className="rounded-md border border-soft bg-surface px-3 py-2 text-xs text-muted">
                  Imagen de portada:{' '}
                  <span className="font-semibold text-body">
                    {selectedPost.coverImage.status || 'pendiente'}
                  </span>
                  {selectedPost.coverImage.url ? (
                    <a
                      href={selectedPost.coverImage.url}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 text-primary hover:underline"
                    >
                      Ver imagen
                    </a>
                  ) : null}
                </div>
              ) : null}

              {selectedPost?.byline?.name ? (
                <div className="rounded-md border border-soft bg-surface px-3 py-2 text-xs text-muted">
                  <p>
                    Autor asignado:{' '}
                    <span className="font-semibold text-body">{selectedPost.byline.name}</span>
                    {selectedPost.byline.title ? ` · ${selectedPost.byline.title}` : ''}
                  </p>
                  {selectedPost.byline.signature ? (
                    <p className="mt-1 italic text-muted">{selectedPost.byline.signature}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase text-muted block mb-1">
                    Tags (coma)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm"
                    value={editor.tagsInput}
                    onChange={(event) =>
                      setEditor((prev) => ({ ...prev, tagsInput: event.target.value }))
                    }
                  />
                  <p className="text-xs text-muted mt-1">
                    Ejemplo: tendencias, decoración, proveedores
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-muted block mb-1">
                    Estado
                  </label>
                  <select
                    className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm"
                    value={editor.status}
                    onChange={(event) =>
                      setEditor((prev) => ({ ...prev, status: event.target.value }))
                    }
                  >
                    <option value="draft">Borrador</option>
                    <option value="scheduled">Programado</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Archivado</option>
                    <option value="failed">Fallido</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-muted block mb-1">
                    Programar publicación
                  </label>
                  <input
                    type="datetime-local"
                    value={editor.scheduledAt}
                    onChange={(event) =>
                      setEditor((prev) => ({ ...prev, scheduledAt: event.target.value }))
                    }
                    className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-muted mt-1">
                    Última publicación: {formatDate(selectedPost.publishedAt)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-[color:var(--color-on-primary)] transition hover:opacity-90 disabled:opacity-60"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary-soft disabled:opacity-60"
                  onClick={handlePublish}
                  disabled={publishing}
                >
                  {publishing ? 'Publicando...' : 'Publicar ahora'}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-info px-4 py-2 text-sm font-medium text-info hover:bg-info-soft"
                  onClick={handleSchedule}
                >
                  Programar
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-danger px-4 py-2 text-sm font-medium text-danger hover:bg-danger-soft"
                  onClick={handleArchive}
                >
                  Archivar
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-soft bg-surface p-12 text-center text-sm text-muted">
              Selecciona un artículo para editarlo o genera uno nuevo desde el panel superior.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminBlog;
