import React, { useEffect, useMemo, useState } from 'react';

import WebGenerator from '../components/web/WebGenerator';
import WebTemplateGallery from '../components/web/WebTemplateGallery';
import WebsitePreview from '../components/web/WebsitePreview';
import { useWedding } from '../context/WeddingContext';
import { useAuth } from '../hooks/useAuth';
import {
  buildSlugSuggestions,
  checkSlugAvailability,
  loadWebsiteContext,
  publishWeddingSite,
  saveWebsiteVersion,
} from '../services/websiteService';
import {
  buildDesignerPrompt,
  detectTemplateFromText,
  getTemplateDescriptor,
  getTemplateSamplePrompt,
  listTemplateOptions,
} from '../utils/websitePromptBuilder';
import { enhanceWeddingHtml } from '../utils/websiteHtmlPostProcessor';

const TEMPLATE_OPTIONS = (() => {
  const entries = {};
  listTemplateOptions().forEach(({ key, name, description, samplePrompt }) => {
    entries[key] = { name, desc: description, prompt: samplePrompt };
  });
  return entries;
})();

const buildWeddingInfoFromProfile = (profile) => {
  const safeProfile = profile || {};
  const {
    brideInfo = {},
    groomInfo = {},
    ceremonyInfo = {},
    receptionInfo = {},
    transportationInfo = {},
    travelInfo = {},
    lodgingOptions = [],
  } = safeProfile;

  return {
    bride: brideInfo.nombre || 'Nombre de la novia',
    groom: groomInfo.nombre || 'Nombre del novio',
    date: ceremonyInfo.fecha || '',
    ceremonyTime: ceremonyInfo.hora || '',
    ceremonyLocation: ceremonyInfo.lugar || '',
    ceremonyAddress: ceremonyInfo.direccion || '',
    receptionVenue: receptionInfo.lugar || '',
    receptionAddress: receptionInfo.direccion || '',
    receptionTime: receptionInfo.hora || '',
    transportation: transportationInfo.detalles || '',
    shuttleSchedule: Array.isArray(transportationInfo.schedule)
      ? transportationInfo.schedule
      : [],
    contactPhone: safeProfile.contactPhone || '',
    contactEmail: safeProfile.contactEmail || '',
    weddingStyle: safeProfile.weddingStyle || 'Clásico',
    colorScheme: safeProfile.colorScheme || 'Blanco y dorado',
    additionalInfo: safeProfile.additionalInfo || '',
    story: safeProfile.story || '',
    lodgingOptions: Array.isArray(lodgingOptions) ? lodgingOptions : [],
    travelGuide: {
      summary: travelInfo.summary || '',
      byCar: travelInfo.byCar || '',
      byPlane: travelInfo.byPlane || '',
      byTrain: travelInfo.byTrain || '',
      tips: travelInfo.tips || '',
      airports: Array.isArray(travelInfo.airports) ? travelInfo.airports : [],
      stations: Array.isArray(travelInfo.stations) ? travelInfo.stations : [],
    },
  };
};

const buildFallbackHtml = (weddingInfo, template) => {
  const styleNote = template?.tokens?.style || 'estilo personalizado';
  const ceremony = [weddingInfo.ceremonyLocation, weddingInfo.ceremonyTime]
    .filter(Boolean)
    .join(' · ');
  const reception = [weddingInfo.receptionVenue, weddingInfo.receptionTime]
    .filter(Boolean)
    .join(' · ');
  const contact = [weddingInfo.contactEmail, weddingInfo.contactPhone].filter(Boolean).join(' · ');

  const scheduleRows = (Array.isArray(weddingInfo.shuttleSchedule)
    ? weddingInfo.shuttleSchedule
    : []
  )
    .map(
      (item) => `
        <tr>
          <td>${item.time || '—'}</td>
          <td>${item.departure || item.from || '—'}</td>
          <td>${item.destination || item.to || '—'}</td>
          <td>${item.notes || ''}</td>
        </tr>`
    )
    .join('');

  const lodgingCards = (Array.isArray(weddingInfo.lodgingOptions)
    ? weddingInfo.lodgingOptions
    : []
  )
    .map((hotel) => {
      const title = hotel.name || hotel.title || 'Hospedaje recomendado';
      const distance = hotel.distance || hotel.minutes || '';
      const type = hotel.type || hotel.category || '';
      const link = hotel.link || hotel.url;
      return `
        <div class="lovenda-card">
          <h3>${title}</h3>
          ${type ? `<p>${type}</p>` : ''}
          ${distance ? `<p><strong>Distancia:</strong> ${distance}</p>` : ''}
          ${hotel.priceRange ? `<p><strong>Precio:</strong> ${hotel.priceRange}</p>` : ''}
          ${link ? `<a class="lovenda-button-secondary" href="${link}" target="_blank" rel="noopener">Ver sitio</a>` : ''}
        </div>
      `;
    })
    .join('');

  const travel = weddingInfo.travelGuide || {};

  return `
  <main>
    <section data-enhanced="timeline">
      <div class="lovenda-section-heading"><span>Agenda del día</span></div>
      <div class="lovenda-grid lovenda-grid--two">
        <div class="lovenda-card">
          <h3>Ceremonia</h3>
          <p>${ceremony || 'Pronto más detalles'}</p>
          ${weddingInfo.ceremonyAddress ? `<small>${weddingInfo.ceremonyAddress}</small>` : ''}
        </div>
        <div class="lovenda-card">
          <h3>Recepción</h3>
          <p>${reception || 'Pronto más detalles'}</p>
          ${weddingInfo.receptionAddress ? `<small>${weddingInfo.receptionAddress}</small>` : ''}
        </div>
      </div>
    </section>

    <section data-enhanced="transport" id="transporte">
      <div class="lovenda-section-heading"><span>Transporte y autobuses</span></div>
      <div class="lovenda-card">
        <p>${weddingInfo.transportation || 'Habrá servicio de transporte para invitados. Consulta los horarios en la tabla.'}</p>
        <div class="lovenda-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Sale de</th>
                <th>Llega a</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              ${scheduleRows || `
                <tr>
                  <td colspan="4">Los horarios exactos de autobuses se publicarán aquí.</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section data-enhanced="gallery">
      <div class="lovenda-section-heading"><span>Galería</span></div>
      <div class="lovenda-gallery">
        <div class="lovenda-gallery__item"></div>
        <div class="lovenda-gallery__item"></div>
        <div class="lovenda-gallery__item"></div>
      </div>
    </section>

    <section data-enhanced="story">
      <div class="lovenda-section-heading"><span>Nuestra historia</span></div>
      <p>${weddingInfo.story || weddingInfo.additionalInfo || 'Pronto compartiremos detalles de nuestra historia.'}</p>
      <p>Inspiración visual: ${styleNote}.</p>
    </section>

    <section data-enhanced="lodging">
      <div class="lovenda-section-heading"><span>Hospedaje cercano</span></div>
      <div class="lovenda-grid lovenda-grid--two">
        ${lodgingCards || `
          <div class="lovenda-card">
            <p>Pronto añadiremos hoteles y alojamientos recomendados cercanos a la celebración.</p>
          </div>
        `}
      </div>
    </section>

    <section data-enhanced="travel-guide">
      <div class="lovenda-section-heading"><span>Cómo llegar</span></div>
      <div class="lovenda-grid lovenda-grid--two">
        <div class="lovenda-card">
          <h3>En avión</h3>
          <p>${(travel.airports || []).map((a) => `• ${a}`).join('<br/>') || 'Aeropuertos cercanos y tiempos estimados aparecerán aquí.'}</p>
          ${travel.byPlane ? `<p>${travel.byPlane}</p>` : ''}
        </div>
        <div class="lovenda-card">
          <h3>En tren / bus</h3>
          <p>${(travel.stations || []).map((s) => `• ${s}`).join('<br/>') || 'Estaciones y conexiones se publicarán pronto.'}</p>
          ${travel.byTrain ? `<p>${travel.byTrain}</p>` : ''}
        </div>
      </div>
      <div class="lovenda-card">
        <h3>En coche</h3>
        <p>${travel.byCar || 'Recibirás las indicaciones para llegar en coche tan pronto estén listas.'}</p>
        ${travel.tips ? `<p><strong>Tips:</strong> ${travel.tips}</p>` : ''}
      </div>
    </section>
    <section data-enhanced="contacto" id="contacto">
      <div class="lovenda-section-heading"><span>Contacto</span></div>
      <div class="lovenda-card">${contact || 'Escríbenos para más información.'}</div>
    </section>
  </main>
  <footer>
    Con cariño, ${weddingInfo.bride || ''} y ${weddingInfo.groom || ''}.
  </footer>
  `;
};

const ProfileSummary = ({ profile }) => {
  if (!profile) return null;

  const bride = profile?.brideInfo?.nombre?.trim();
  const groom = profile?.groomInfo?.nombre?.trim();
  const couple = [bride, groom].filter(Boolean).join(' y ');
  const ceremonyDate = profile?.ceremonyInfo?.fecha;
  const ceremony = [profile?.ceremonyInfo?.lugar, profile?.ceremonyInfo?.hora]
    .filter(Boolean)
    .join(' · ');
  const reception = [profile?.receptionInfo?.lugar, profile?.receptionInfo?.hora]
    .filter(Boolean)
    .join(' · ');
  const contact = [profile?.contactEmail, profile?.contactPhone].filter(Boolean).join(' · ');

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold mb-3">Datos del perfil aplicados</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
        {couple && (
          <div>
            <span className="text-gray-500">Pareja: </span>
            {couple}
          </div>
        )}
        {ceremonyDate && (
          <div>
            <span className="text-gray-500">Fecha: </span>
            {ceremonyDate}
          </div>
        )}
        {ceremony && (
          <div>
            <span className="text-gray-500">Ceremonia: </span>
            {ceremony}
          </div>
        )}
        {reception && (
          <div>
            <span className="text-gray-500">Recepción: </span>
            {reception}
          </div>
        )}
        {contact && (
          <div className="sm:col-span-2">
            <span className="text-gray-500">Contacto: </span>
            {contact}
          </div>
        )}
        {profile?.additionalInfo && (
          <div className="sm:col-span-2">
            <span className="text-gray-500">Info adicional: </span>
            {profile.additionalInfo}
          </div>
        )}
      </div>
    </div>
  );
};

const VersionsTable = ({ versions, templates, onView, onEdit }) => {
  if (!versions?.length) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Versiones publicadas</h2>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plantilla
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Indicaciones
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {versions.map((version) => {
              const templateKey = detectTemplateFromText(version.prompt || '');
              const templateName = templates?.[templateKey]?.name || 'Personalizada';
              const createdAt = version.createdAt?.seconds
                ? new Date(version.createdAt.seconds * 1000).toLocaleString()
                : '—';

              return (
                <tr key={version.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{createdAt}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {templateName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">
                    {version.prompt || 'Sin indicaciones'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => onView?.(version, templateKey)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit?.(version, templateKey)}
                      className="text-green-600 hover:text-green-800"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DisenoWeb = () => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid || 'dev';
  const { activeWedding } = useWedding();

  const templates = TEMPLATE_OPTIONS;

  const [prompt, setPrompt] = useState('');
  const [html, setHtml] = useState('');
  const [profile, setProfile] = useState(null);
  const [versions, setVersions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('personalizada');
  const [publishSlug, setPublishSlug] = useState('');
  const [slugSuggestions, setSlugSuggestions] = useState([]);
  const [slugStatus, setSlugStatus] = useState(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');
  const [showQR, setShowQR] = useState(false);

  const weddingInfo = useMemo(() => buildWeddingInfoFromProfile(profile), [profile]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!uid) return;
      const { profile: loadedProfile, versions: loadedVersions } = await loadWebsiteContext({
        uid,
        weddingId: activeWedding,
      });
      if (cancelled) return;
      setProfile(loadedProfile);
      setVersions(loadedVersions);
    })();

    return () => {
      cancelled = true;
    };
  }, [uid, activeWedding]);

  useEffect(() => {
    const suggestions = buildSlugSuggestions(weddingInfo);
    setSlugSuggestions(suggestions);
    if (!publishSlug && suggestions.length) setPublishSlug(suggestions[0]);
  }, [weddingInfo, publishSlug]);

  useEffect(() => {
    if (!publishSlug) {
      setSlugStatus(null);
      setCheckingSlug(false);
      return;
    }

    let cancelled = false;
    setCheckingSlug(true);

    const timer = setTimeout(async () => {
      const result = await checkSlugAvailability(publishSlug);
      if (cancelled) return;
      setSlugStatus(result.status);
      setCheckingSlug(false);
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [publishSlug]);

  const handleTemplateSelect = (templateKey) => {
    setSelectedTemplate(templateKey);
    const sample = templates[templateKey]?.prompt;
    if (sample) {
      setPrompt(sample);
    }
  };

  const generateWeb = async () => {
    setLoading(true);
    setError('');

    const templateDescriptor = getTemplateDescriptor(selectedTemplate);
    const userInstructions = prompt.trim() || getTemplateSamplePrompt(selectedTemplate);
    if (!prompt.trim()) {
      setPrompt(userInstructions);
    }

    try {
      const allowDirect =
        import.meta.env.VITE_ENABLE_DIRECT_OPENAI === 'true' || import.meta.env.DEV;
      if (!allowDirect) {
        setError('OpenAI directo deshabilitado. Usa el backend /api/ai en su lugar.');
        setLoading(false);
        return;
      }

      const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;
      if (!OPENAI_KEY) {
        const fallbackHtml = buildFallbackHtml(weddingInfo, templateDescriptor);
        const enhanced = enhanceWeddingHtml(fallbackHtml, {
          templateKey: selectedTemplate,
          weddingInfo,
        });
        setHtml(enhanced);
        setLoading(false);
        return;
      }

      const { systemMessage, userMessage } = buildDesignerPrompt({
        templateKey: selectedTemplate,
        weddingInfo,
        userPrompt: userInstructions,
      });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_KEY}`,
          'OpenAI-Project': import.meta.env.VITE_OPENAI_PROJECT_ID,
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.55,
        }),
      });

      if (response.status === 401) {
        throw new Error(
          'Clave OpenAI inválida o no autorizada (401). Comprueba VITE_OPENAI_API_KEY'
        );
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || 'Error al generar la página web');
      }

      let htmlGen = data.choices?.[0]?.message?.content || '';
      htmlGen = htmlGen.replace(/```html|```/g, '').trim();
      const enhanced = enhanceWeddingHtml(htmlGen, {
        templateKey: selectedTemplate,
        weddingInfo,
      });
      setHtml(enhanced);
    } catch (err) {
      console.error('Error en la generación de la página:', err);
      setError(`Error al generar con IA: ${err.message || 'Revisa la consola para más detalles'}`);
      alert('Ha ocurrido un error al generar la página web. Por favor, inténtalo de nuevo.');
    }

    setLoading(false);
  };

  const publishWeb = async () => {
    const trimmedHtml = html.trim();
    if (!trimmedHtml) {
      alert('Genera la web primero');
      return;
    }

    try {
      const updatedVersions = await saveWebsiteVersion({
        uid,
        weddingId: activeWedding,
        html: trimmedHtml,
        prompt,
        slug: publishSlug || null,
      });
      setVersions(updatedVersions);

      if (activeWedding) {
        const result = await publishWeddingSite({
          weddingId: activeWedding,
          html: trimmedHtml,
          slug: publishSlug || null,
        });

        if (result.ok) {
          const url = result.publicUrl || '';
          setPublicUrl(url);
          if (url) {
            alert(`¡Página publicada! URL pública: ${url}`);
          } else {
            alert('¡Página publicada!');
          }
        } else {
          console.warn('No se pudo activar la URL pública.', result.error);
          alert('Página guardada. No se pudo activar la URL pública.');
        }
      } else {
        alert('Página guardada. No hay boda activa para publicar públicamente.');
      }
    } catch (err) {
      console.error('Error al publicar la página', err);
      alert('Error al publicar');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Diseño Web de Boda</h1>

      <ProfileSummary profile={profile} />

      <WebTemplateGallery
        templates={templates}
        selectedTemplate={selectedTemplate}
        onSelect={handleTemplateSelect}
      />

      <WebGenerator
        prompt={prompt}
        onPromptChange={setPrompt}
        onGenerate={generateWeb}
        loading={loading}
        selectedTemplate={selectedTemplate}
        templates={templates}
        error={error}
      />

      <WebsitePreview
        html={html}
        onPublish={publishWeb}
        publishSlug={publishSlug}
        onSlugChange={setPublishSlug}
        slugStatus={slugStatus}
        checkingSlug={checkingSlug}
        slugSuggestions={slugSuggestions}
        onSuggestionSelect={setPublishSlug}
        publicUrl={publicUrl}
        showQR={showQR}
        onShowQR={() => setShowQR(true)}
        onHideQR={() => setShowQR(false)}
      />

      <VersionsTable
        versions={versions}
        templates={templates}
        onView={(version, templateKey) => {
          const enhanced =
            /lovenda-wedding-theme/i.test(version.html || '')
              ? version.html
              : enhanceWeddingHtml(version.html || '', {
                  templateKey,
                  weddingInfo,
                });
          setHtml(enhanced);
        }}
        onEdit={(version, templateKey) => {
          setPrompt(version.prompt || '');
          const enhanced =
            /lovenda-wedding-theme/i.test(version.html || '')
              ? version.html
              : enhanceWeddingHtml(version.html || '', {
                  templateKey,
                  weddingInfo,
                });
          setHtml(enhanced);
          setSelectedTemplate(templateKey);
        }}
      />
    </div>
  );
};

export default DisenoWeb;
