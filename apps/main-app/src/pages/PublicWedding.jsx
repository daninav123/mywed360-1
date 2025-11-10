import React from 'react';
import { useParams } from 'react-router-dom';

import ExternalImage from '@/components/ExternalImage';
import useTranslations from '../hooks/useTranslations';

export default function PublicWedding() {
  const { slug } = useParams();
  const { t } = useTranslations();
  const [state, setState] = React.useState({ loading: true, error: '', payload: null });

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/public/weddings/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || `http-${res.status}`);
        }
        const data = await res.json();
        if (!mounted) return;
        setState({ loading: false, error: '', payload: data });
      } catch (e) {
        if (!mounted) return;
        setState({ loading: false, error: e?.message || 'error', payload: null });
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [slug]);

  if (state.loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        {t('public.publicWedding.loading')}
      </div>
    );
  }
  if (state.error) {
    const message =
      state.error && state.error !== 'error'
        ? t('public.publicWedding.error', { reason: state.error })
        : t('public.publicWedding.error', { reason: 'error' });
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#b91c1c' }}>
        {message}
      </div>
    );
  }
  const { payload } = state;

  // If generated HTML is present, render it in an isolated iframe
  if (payload?.site?.html) {
    return (
      <iframe
        title={
          payload?.wedding?.name || t('public.publicWedding.defaults.iframeTitle')
        }
        sandbox="allow-scripts allow-same-origin"
        style={{ border: 'none', width: '100%', height: '100vh' }}
        srcDoc={payload.site.html}
      />
    );
  }

  // Fallback basic template from structured data
  const w = payload?.wedding || {};
  const timeline = payload?.timeline || [];
  const gallery = payload?.gallery || [];

  return (
    <div className="font-sans text-gray-800">
      <section className="min-h-[60vh] bg-gray-900 text-white flex items-center justify-center text-center px-6">
        <div>
          <h1 className="text-5xl font-bold mb-3">
            {w.name || t('public.publicWedding.defaults.title')}
          </h1>
          <p className="text-xl opacity-90">{[w.date, w.location].filter(Boolean).join(' � ')}</p>
        </div>
      </section>

      {w.story && (
        <section className="max-w-3xl mx-auto p-8">
          <h2 className="text-3xl font-semibold mb-3">
            {t('public.publicWedding.defaults.storyTitle')}
          </h2>
          <p className="whitespace-pre-line text-lg">{w.story}</p>
        </section>
      )}

      {timeline.length > 0 && (
        <section className="bg-gray-50 py-10">
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-4">
              {t('public.publicWedding.defaults.timelineTitle')}
            </h2>
            <ul className="space-y-3">
              {timeline.map((t) => (
                <li key={t.id} className="flex items-start gap-3">
                  <span className="text-sm text-gray-500 w-24">{t.time || t.hour || ''}</span>
                  <div>
                    <div className="font-medium">{t.label || t.title || ''}</div>
                    {t.desc && <div className="text-sm text-gray-600">{t.desc}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="py-10 max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-semibold mb-4">
            {t('public.publicWedding.defaults.galleryTitle')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {gallery.map((g) => (
              <ExternalImage
                key={g.id}
                src={g.url || g.src}
                alt="Foto"
                className="object-cover w-full h-40 rounded"
              />
            ))}
          </div>
        </section>
      )}

      <footer className="py-8 text-center text-sm text-gray-500">
        � {new Date().getFullYear()} {w.name || ''}
      </footer>
    </div>
  );
}
