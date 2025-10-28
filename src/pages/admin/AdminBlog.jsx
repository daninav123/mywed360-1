import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import {
  archiveAdminBlogPost,
  generateAdminBlogPost,
  listAdminBlogPosts,
  publishAdminBlogPost,
  scheduleAdminBlogPost,
  updateAdminBlogPost,
  listAdminBlogPlan,
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
  draft: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-sky-100 text-sky-700',
  published: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-600',
  failed: 'bg-rose-100 text-rose-700',
};

const PLAN_STATUS_LABELS = {
  planned: 'Pendiente',
  generating: 'Generando',
  scheduled: 'Programado',
  failed: 'Fallido',
};

const PLAN_STATUS_BADGE = {
  planned: 'bg-gray-100 text-gray-700',
  generating: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-rose-100 text-rose-700',
};

const defaultGenerateForm = {
  topic: '',
  language: 'es',
  tone: 'inspirador',
  length: 'medio',
  keywords: '',
  includeTips: true,
  includeCTA: true,
};

const emptyEditorState = {
  id: null,
  title: '',
  excerpt: '',
  markdown: '',
  tagsInput: '',
  status: 'draft',
  scheduledAt: '',
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
  const [listStatusFilter, setListStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [editor, setEditor] = useState(emptyEditorState);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateForm, setGenerateForm] = useState(defaultGenerateForm);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [planEntries, setPlanEntries] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [triggeringPlan, setTriggeringPlan] = useState(false);

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedId) || null,
    [posts, selectedId]
  );

  const loadScheduled = useCallback(async () => {
    setLoadingScheduled(true);
    try {
      const { posts: scheduled } = await listAdminBlogPosts({
        status: 'scheduled',
        limit: 50,
      });
      setScheduledPosts(scheduled || []);
    } catch (error) {
      console.error('[AdminBlog] loadScheduled failed', error);
      toast.error('No se pudieron cargar las noticias programadas.');
    } finally {
      setLoadingScheduled(false);
    }
  }, []);

  const loadPlan = useCallback(async () => {
    setLoadingPlan(true);
    try {
      const { entries } = await listAdminBlogPlan({
        limit: 90,
      });
      setPlanEntries(entries || []);
    } catch (error) {
      console.error('[AdminBlog] loadPlan failed', error);
      toast.error('No se pudo cargar el plan editorial.');
    } finally {
      setLoadingPlan(false);
    }
  }, []);

  const loadPosts = async (status = listStatusFilter) => {
    setLoadingList(true);
    try {
      const { posts: apiPosts } = await listAdminBlogPosts({
        status,
        limit: 80,
      });
      setPosts(apiPosts || []);
    } catch (error) {
      console.error('[AdminBlog] loadPosts failed', error);
      toast.error('No se pudieron cargar las noticias del blog.');
    } finally {
      setLoadingList(false);
    }
  };

  const handleTriggerAutomation = async () => {
    setTriggeringPlan(true);
    try {
      const { result } = await triggerAdminBlogPlanGeneration();
      if (result?.processed) {
        toast.success('Se generó un artículo del plan editorial.');
      } else if (result?.reason === 'no-plan-entry') {
        toast.info('No hay entradas pendientes en el plan para generar.');
      } else {
        toast.success('Se ejecutó la automatización del plan editorial.');
      }
      await Promise.all([loadPlan(), loadScheduled(), loadPosts(listStatusFilter)]);
    } catch (error) {
      console.error('[AdminBlog] trigger automation failed', error);
      toast.error('No se pudo ejecutar la automatización del plan.');
    } finally {
      setTriggeringPlan(false);
    }
  };

  useEffect(() => {
    loadPosts('all');
    loadScheduled();
    loadPlan();
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
      scheduledAt: selectedPost.scheduledAt ? selectedPost.scheduledAt.slice(0, 16) : '',
    });
  }, [selectedPost]);

  const handleGenerateChange = (field, value) => {
    setGenerateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!generateForm.topic.trim()) {
      toast.warning('Introduce un tema para generar el artículo.');
      return;
    }
    setGenerating(true);
    try {
      const payload = {
        ...generateForm,
        keywords: parseTags(generateForm.keywords),
      };
      const { post } = await generateAdminBlogPost(payload);
      toast.success('Artículo generado correctamente.');
      setPosts((prev) => [post, ...prev]);
      setSelectedId(post.id);
      setListStatusFilter('all');
      setGenerateForm(defaultGenerateForm);
      loadScheduled();
    } catch (error) {
      console.error('[AdminBlog] generate failed', error);
      toast.error('No se pudo generar el artículo. Revisa el log de servidor.');
    } finally {
      setGenerating(false);
    }
  };

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
      console.error('[AdminBlog] save failed', error);
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
      console.error('[AdminBlog] publish failed', error);
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
      console.error('[AdminBlog] schedule failed', error);
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
      console.error('[AdminBlog] archive failed', error);
      toast.error('No se pudo archivar el artículo.');
    }
  };

  const filteredPosts = useMemo(() => {
    if (listStatusFilter === 'all') return posts;
    return posts.filter((post) => post.status === listStatusFilter);
  }, [posts, listStatusFilter]);

  return (
    <div className="px-6 py-6 space-y-8">
      <section className="rounded-lg border border-soft bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">Blog Lovenda · Generación IA</h1>
            <p className="text-sm text-muted">
              Genera y publica artículos diarios con control editorial humano.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadPosts(listStatusFilter)}
            className="px-3 py-2 text-sm border rounded-md border-soft hover:bg-gray-50"
          >
            {loadingList ? 'Actualizando...' : 'Actualizar lista'}
          </button>
        </div>

        <form className="grid gap-4 md:grid-cols-6" onSubmit={handleGenerate}>
          <div className="md:col-span-3">
            <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">
              Tema o enfoque *
            </label>
            <input
              type="text"
              value={generateForm.topic}
              onChange={(event) => handleGenerateChange('topic', event.target.value)}
              placeholder="Ej: Tendencias de decoración para bodas 2025"
              className="w-full rounded-md border border-soft px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">
              Idioma
            </label>
            <select
              value={generateForm.language}
              onChange={(event) => handleGenerateChange('language', event.target.value)}
              className="w-full rounded-md border border-soft px-3 py-2 text-sm"
            >
              <option value="es">Español</option>
              <option value="en">Inglés</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">
              Longitud
            </label>
            <select
              value={generateForm.length}
              onChange={(event) => handleGenerateChange('length', event.target.value)}
              className="w-full rounded-md border border-soft px-3 py-2 text-sm"
            >
              <option value="corto">Corto (≈600 palabras)</option>
              <option value="medio">Medio (≈800 palabras)</option>
              <option value="largo">Largo (≈1100 palabras)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Tono</label>
            <input
              type="text"
              value={generateForm.tone}
              onChange={(event) => handleGenerateChange('tone', event.target.value)}
              placeholder="inspirador, práctico, elegante…"
              className="w-full rounded-md border border-soft px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">
              Palabras clave (separadas por coma)
            </label>
            <input
              type="text"
              value={generateForm.keywords}
              onChange={(event) => handleGenerateChange('keywords', event.target.value)}
              placeholder="decoración, boda civil, flores"
              className="w-full rounded-md border border-soft px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-4 md:col-span-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={generateForm.includeTips}
                onChange={(event) => handleGenerateChange('includeTips', event.target.checked)}
              />
              Incluir sección de consejos
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={generateForm.includeCTA}
                onChange={(event) => handleGenerateChange('includeCTA', event.target.checked)}
              />
              Añadir CTA final
            </label>
            <button
              type="submit"
              className="ml-auto inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-[color:var(--color-on-primary,#ffffff)] bg-[color:var(--color-primary,#6366f1)] hover:bg-[color:var(--color-primary-dark,#4f46e5)] disabled:opacity-60"
              disabled={generating}
            >
              {generating ? 'Generando...' : 'Generar borrador'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-soft bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Noticias programadas</h2>
            <p className="text-sm text-gray-600">Artículos con publicación pendiente.</p>
          </div>
          <button
            type="button"
            onClick={loadScheduled}
            className="px-3 py-2 text-sm border rounded-md border-soft hover:bg-gray-50"
          >
            {loadingScheduled ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
        {loadingScheduled ? (
          <p className="text-sm text-gray-500">Cargando noticias programadas...</p>
        ) : scheduledPosts.length === 0 ? (
          <p className="text-sm text-gray-500">No hay publicaciones programadas actualmente.</p>
        ) : (
          <ul className="space-y-2">
            {scheduledPosts
              .slice()
              .sort((a, b) => {
                const dateA = new Date(a.scheduledAt).getTime();
                const dateB = new Date(b.scheduledAt).getTime();
                return dateA - dateB;
              })
              .map((post) => (
                <li
                  key={post.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-soft bg-gray-50 px-4 py-3 hover:bg-gray-100 transition cursor-pointer"
                  onClick={() => setSelectedId(post.id)}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{post.title}</p>
                    <p className="text-xs text-gray-500">
                      {post.scheduledAt
                        ? `Programado para ${formatDate(post.scheduledAt)}`
                        : 'Sin fecha programada'}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                    {(post.language || 'es').toUpperCase()}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-soft bg-white p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Plan editorial</h2>
            <p className="text-sm text-gray-600">
              Próximas entradas generadas automáticamente. Revisa estado y fecha prevista.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadPlan}
              className="px-3 py-2 text-sm border rounded-md border-soft hover:bg-gray-50"
            >
              {loadingPlan ? 'Actualizando...' : 'Actualizar'}
            </button>
            <button
              type="button"
              onClick={handleTriggerAutomation}
              disabled={triggeringPlan}
              className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-white bg-[color:var(--color-primary,#6366f1)] hover:bg-[color:var(--color-primary-dark,#4f46e5)] disabled:opacity-60"
            >
              {triggeringPlan ? 'Generando...' : 'Generar siguiente artículo ahora'}
            </button>
          </div>
        </div>
        {loadingPlan ? (
          <p className="text-sm text-gray-500">Cargando plan editorial...</p>
        ) : planEntries.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no hay días planificados.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-soft">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Fecha</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                  <th className="px-3 py-2 text-left">Tema</th>
                  <th className="px-3 py-2 text-left">Post</th>
                </tr>
              </thead>
              <tbody>
                {planEntries.map((entry) => {
                  const status = entry.status || 'planned';
                  const badgeClass = PLAN_STATUS_BADGE[status] || 'bg-gray-100 text-gray-700';
                  const statusLabel = PLAN_STATUS_LABELS[status] || status;
                  return (
                    <tr key={entry.planDate} className="border-b last:border-b-0">
                      <td className="px-3 py-3 text-sm text-gray-800">
                        {formatDate(entry.date || entry.planDate)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}
                        >
                          {statusLabel}
                        </span>
                        {entry.error ? (
                          <p className="mt-1 text-xs text-rose-600">{entry.error}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700">
                        <p className="font-medium text-gray-900">{entry.topic}</p>
                        {entry.angle ? (
                          <p className="text-xs text-gray-500">{entry.angle}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600">
                        {entry.postId ? (
                          <button
                            type="button"
                            className="text-indigo-600 hover:underline"
                            onClick={() => setSelectedId(entry.postId)}
                          >
                            Ver post
                          </button>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Artículos</h2>
            <select
              value={listStatusFilter}
              onChange={(event) => {
                const status = event.target.value;
                setListStatusFilter(status);
                loadPosts(status);
              }}
              className="rounded-md border border-soft px-2 py-1 text-sm"
            >
              <option value="all">Todos los estados</option>
              <option value="draft">Borradores</option>
              <option value="scheduled">Programados</option>
              <option value="published">Publicados</option>
              <option value="archived">Archivados</option>
              <option value="failed">Fallidos</option>
            </select>
          </div>

          <div className="rounded-lg border border-soft bg-white max-h-[520px] overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Título</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                  <th className="px-3 py-2 text-left">Publicado</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.length === 0 && !loadingList ? (
                  <tr>
                    <td className="px-3 py-4 text-center text-gray-500" colSpan={3}>
                      No hay artículos con este filtro.
                    </td>
                  </tr>
                ) : null}
                {filteredPosts.map((post) => {
                  const isActive = post.id === selectedId;
                  return (
                    <tr
                      key={post.id}
                      className={`cursor-pointer border-b last:border-b-0 ${
                        isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedId(post.id)}
                    >
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-900 line-clamp-2">{post.title}</div>
                        <div className="text-xs text-gray-500">
                          Generado: {formatDate(post.generatedAt)}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[post.status] || 'bg-gray-100 text-gray-600'}`}
                        >
                          {STATUS_LABELS[post.status] || post.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700">
                        {formatDate(post.publishedAt)}
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
              <span className="text-xs text-gray-500">
                ID: <code>{selectedPost.id}</code>
                {selectedPost.coverImage?.storagePath ? (
                  <span className="ml-2 text-gray-400">
                    <span className="hidden sm:inline">· Storage: </span>
                    <code>{selectedPost.coverImage?.storagePath}</code>
                  </span>
                ) : null}
              </span>
            ) : null}
          </div>

          {selectedPost ? (
            <div className="space-y-4 rounded-lg border border-soft bg-white p-5">
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500 block mb-1">
                  Título
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-soft px-3 py-2 text-sm"
                  value={editor.title}
                  onChange={(event) =>
                    setEditor((prev) => ({ ...prev, title: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-500 block mb-1">
                  Extracto
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-soft px-3 py-2 text-sm"
                  value={editor.excerpt}
                  onChange={(event) =>
                    setEditor((prev) => ({ ...prev, excerpt: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-500 block mb-1">
                  Contenido (Markdown)
                </label>
                <textarea
                  rows={16}
                  className="w-full rounded-md border border-soft px-3 py-2 text-sm font-mono"
                  value={editor.markdown}
                  onChange={(event) =>
                    setEditor((prev) => ({ ...prev, markdown: event.target.value }))
                  }
                />
              </div>

              {selectedPost?.research?.summary ? (
                <div className="rounded-md border border-dashed border-soft bg-indigo-50/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-semibold uppercase text-indigo-600">
                        Investigación IA
                      </h3>
                      <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                        {selectedPost.research.summary}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {selectedPost.research.provider || 'sin proveedor'}
                    </span>
                  </div>
                  {Array.isArray(selectedPost.research.references) &&
                  selectedPost.research.references.length ? (
                    <ul className="mt-3 space-y-1 text-xs text-gray-600 list-disc list-inside">
                      {selectedPost.research.references.slice(0, 6).map((ref) => (
                        <li key={ref.url || ref.title}>
                          <span className="font-medium text-gray-700">{ref.title}</span>
                          {ref.url ? (
                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-2 text-indigo-600 hover:underline"
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
                <div className="rounded-md border border-soft bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  Imagen de portada:{' '}
                  <span className="font-semibold text-gray-800">
                    {selectedPost.coverImage.status || 'pendiente'}
                  </span>
                  {selectedPost.coverImage.url ? (
                    <a
                      href={selectedPost.coverImage.url}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 text-indigo-600 hover:underline"
                    >
                      Ver imagen
                    </a>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase text-gray-500 block mb-1">
                    Tags (coma)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-soft px-3 py-2 text-sm"
                    value={editor.tagsInput}
                    onChange={(event) =>
                      setEditor((prev) => ({ ...prev, tagsInput: event.target.value }))
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ejemplo: tendencias, decoración, proveedores
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-gray-500 block mb-1">
                    Estado
                  </label>
                  <select
                    className="w-full rounded-md border border-soft px-3 py-2 text-sm"
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
                  <label className="text-xs font-semibold uppercase text-gray-500 block mb-1">
                    Programar publicación
                  </label>
                  <input
                    type="datetime-local"
                    value={editor.scheduledAt}
                    onChange={(event) =>
                      setEditor((prev) => ({ ...prev, scheduledAt: event.target.value }))
                    }
                    className="w-full rounded-md border border-soft px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Última publicación: {formatDate(selectedPost.publishedAt)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-[color:var(--color-on-primary,#ffffff)] bg-[color:var(--color-primary,#6366f1)] hover:bg-[color:var(--color-primary-dark,#4f46e5)] disabled:opacity-60"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium border-[color:var(--color-primary,#6366f1)] text-[color:var(--color-primary,#6366f1)] hover:bg-indigo-50 disabled:opacity-60"
                  onClick={handlePublish}
                  disabled={publishing}
                >
                  {publishing ? 'Publicando...' : 'Publicar ahora'}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-sky-400 px-4 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50"
                  onClick={handleSchedule}
                >
                  Programar
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-rose-300 px-4 py-2 text-sm font-medium text-rose-500 hover:bg-rose-50"
                  onClick={handleArchive}
                >
                  Archivar
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-soft bg-white p-12 text-center text-sm text-gray-500">
              Selecciona un artículo para editarlo o genera uno nuevo desde el panel superior.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminBlog;
