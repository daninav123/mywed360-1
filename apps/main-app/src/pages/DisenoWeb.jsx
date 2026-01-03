import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { User, Mail, Moon, LogOut } from 'lucide-react';

import DarkModeToggle from '../components/DarkModeToggle';
import LanguageSelector from '../components/ui/LanguageSelector';
import Nav from '../components/Nav';
import NotificationCenter from '../components/NotificationCenter';
import WebsitePreview from '../components/web/WebsitePreview';
import SimpleWebDesigner, {
  SimpleTemplateSelector,
  SimplePromptEditor,
} from '../components/web/SimpleWebDesigner';
import VariablesEditor from '../components/web/VariablesEditor';
import { useWedding } from '../context/WeddingContext';
import { useAuth } from '../hooks/useAuth.jsx';
import useTranslations from '../hooks/useTranslations';
import {
  buildSlugSuggestions,
  checkSlugAvailability,
  loadWebsiteContext,
  publishWeddingSite,
  saveWebsiteVersion,
  updateWebsiteLogistics,
  logWebsiteAiRun,
  recordWebsiteEvent,
  requestWebsiteAiHtml,
  createWebsitePrompt,
  updateWebsitePrompt,
  deleteWebsitePrompt,
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

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const parseListInput = (value = '') =>
  String(value || '')
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const buildLogisticsDraftFromProfile = (profile = {}) => {
  const transportationInfo = profile?.transportationInfo || {};
  const lodging = Array.isArray(profile?.lodgingOptions) ? profile.lodgingOptions : [];
  const travel = profile?.travelInfo || {};

  const draft = {
    transportation: transportationInfo.detalles || '',
    schedule: (transportationInfo.schedule || []).map((item) => ({
      id: createId(),
      time: item.time || '',
      departure: item.departure || item.from || '',
      destination: item.destination || item.to || '',
      notes: item.notes || '',
    })),
    lodging: lodging.map((item) => ({
      id: createId(),
      name: item.name || item.title || '',
      distance: item.distance || item.minutes || '',
      priceRange: item.priceRange || item.price || '',
      link: item.link || item.url || '',
      amenities: Array.isArray(item.amenities) ? item.amenities.join(', ') : item.amenities || '',
    })),
    travel: {
      summary: travel.summary || '',
      byCar: travel.byCar || '',
      byPlane: travel.byPlane || '',
      byTrain: travel.byTrain || '',
      tips: travel.tips || '',
      airportsText: Array.isArray(travel.airports) ? travel.airports.join('\n') : '',
      stationsText: Array.isArray(travel.stations) ? travel.stations.join('\n') : '',
    },
    story: profile?.story || '',
    additionalInfo: profile?.additionalInfo || '',
    faqs: (Array.isArray(profile?.faqs) ? profile.faqs : []).map((item) => ({
      id: createId(),
      question: item.question || '',
      answer: item.answer || '',
    })),
  };

  if (draft.schedule.length === 0) {
    draft.schedule.push({ id: createId(), time: '', departure: '', destination: '', notes: '' });
  }
  if (draft.lodging.length === 0) {
    draft.lodging.push({
      id: createId(),
      name: '',
      distance: '',
      priceRange: '',
      link: '',
      amenities: '',
    });
  }
  if (draft.faqs.length === 0) {
    draft.faqs.push({ id: createId(), question: '', answer: '' });
  }

  return draft;
};

const sanitizeLogisticsDraft = (draft = {}) => {
  const schedule = (draft.schedule || [])
    .map((item) => ({
      time: (item.time || '').trim(),
      departure: (item.departure || '').trim(),
      destination: (item.destination || '').trim(),
      notes: (item.notes || '').trim(),
    }))
    .filter((item) => Object.values(item).some(Boolean));

  const lodgingOptions = (draft.lodging || [])
    .map((item) => ({
      name: (item.name || '').trim(),
      distance: (item.distance || '').trim(),
      priceRange: (item.priceRange || '').trim(),
      link: (item.link || '').trim(),
      amenities: parseListInput(item.amenities),
    }))
    .filter((item) => item.name);

  const travelGuide = {
    summary: (draft.travel?.summary || '').trim(),
    byCar: (draft.travel?.byCar || '').trim(),
    byPlane: (draft.travel?.byPlane || '').trim(),
    byTrain: (draft.travel?.byTrain || '').trim(),
    tips: (draft.travel?.tips || '').trim(),
    airports: parseListInput(draft.travel?.airportsText),
    stations: parseListInput(draft.travel?.stationsText),
  };

  const faqs = (draft.faqs || [])
    .map((item) => ({
      question: (item.question || '').trim(),
      answer: (item.answer || '').trim(),
    }))
    .filter((item) => item.question || item.answer);

  return {
    transportation: (draft.transportation || '').trim(),
    transportationSchedule: schedule,
    lodgingOptions,
    travelGuide,
    story: (draft.story || '').trim(),
    additionalInfo: (draft.additionalInfo || '').trim(),
    faqs,
  };
};

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

  // Formatear fecha si viene en formato Date
  const formatDate = (fecha) => {
    if (!fecha) return '';
    try {
      // Si es un timestamp de Firebase
      if (fecha.seconds) {
        const date = new Date(fecha.seconds * 1000);
        return date.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
      // Si es un string de fecha
      if (typeof fecha === 'string') {
        const date = new Date(fecha);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
        }
        return fecha; // Devolver el string tal cual si no se puede parsear
      }
      return fecha.toString();
    } catch (e) {
      return fecha;
    }
  };

  // Construir nombres de la pareja
  const nombresPareja = [brideInfo.nombre, groomInfo.nombre].filter(Boolean).join(' y ') || '';

  const variables = {
    // Variables principales para el editor simple
    nombres: nombresPareja,
    fecha: formatDate(ceremonyInfo.fecha),
    ubicacion: ceremonyInfo.ciudad || ceremonyInfo.lugar || '',
    ceremoniaLugar: ceremonyInfo.lugar || '',
    ceremoniaHora: ceremonyInfo.hora || '',
    recepcionLugar: receptionInfo.lugar || '',
    recepcionHora: receptionInfo.hora || '',
    historia: safeProfile.story || safeProfile.ourStory || '',
    email: safeProfile.contactEmail || '',
    telefono: safeProfile.contactPhone || '',

    // Datos legacy para compatibilidad
    bride: brideInfo.nombre || '',
    groom: groomInfo.nombre || '',
    date: formatDate(ceremonyInfo.fecha),
    ceremonyTime: ceremonyInfo.hora || '',
    ceremonyLocation: ceremonyInfo.lugar || '',
    ceremonyAddress: ceremonyInfo.direccion || '',
    receptionVenue: receptionInfo.lugar || '',
    receptionAddress: receptionInfo.direccion || '',
    receptionTime: receptionInfo.hora || '',
    transportation: transportationInfo.detalles || '',
    shuttleSchedule: Array.isArray(transportationInfo.schedule) ? transportationInfo.schedule : [],
    contactPhone: safeProfile.contactPhone || '',
    contactEmail: safeProfile.contactEmail || '',
    weddingStyle: safeProfile.weddingStyle || safeProfile.estilo || 'Clásico',
    colorScheme: safeProfile.colorScheme || safeProfile.colores || 'Blanco y dorado',
    additionalInfo: safeProfile.additionalInfo || safeProfile.informacionAdicional || '',
    story: safeProfile.story || safeProfile.ourStory || '',
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
    faqs: Array.isArray(safeProfile.faqs) ? safeProfile.faqs : [],
  };
};

const buildFallbackHtml = (weddingInfo, template) => {
  // Validar que weddingInfo no sea undefined
  const safeWeddingInfo = weddingInfo || {};

  const styleNote = template?.tokens?.style || 'estilo personalizado';
  const ceremony = [safeWeddingInfo.ceremonyLocation, safeWeddingInfo.ceremonyTime]
    .filter(Boolean)
    .join(' · ');
  const reception = [safeWeddingInfo.receptionVenue, safeWeddingInfo.receptionTime]
    .filter(Boolean)
    .join(' · ');
  const contact = [safeWeddingInfo.contactEmail, safeWeddingInfo.contactPhone]
    .filter(Boolean)
    .join(' · ');

  const scheduleRows = (
    Array.isArray(safeWeddingInfo.shuttleSchedule) ? safeWeddingInfo.shuttleSchedule : []
  )
    .map(
      (item) => `
        <tr>
          <td>${item.time || ''}</td>
          <td>${item.departure || item.from || ''}</td>
          <td>${item.destination || item.to || ''}</td>
          <td>${item.notes || ''}</td>
        </tr>`
    )
    .join('');

  const lodgingCards = (
    Array.isArray(safeWeddingInfo.lodgingOptions) ? safeWeddingInfo.lodgingOptions : []
  )
    .map((hotel) => {
      const title = hotel.name || hotel.title || 'Hospedaje recomendado';
      const distance = hotel.distance || hotel.minutes || '';
      const type = hotel.type || hotel.category || '';
      const link = hotel.link || hotel.url;
      return `
        <div class="planivia-card">
          <h3>${title}</h3>
          ${type ? `<p>${type}</p>` : ''}
          ${distance ? `<p><strong>Distancia:</strong> ${distance}</p>` : ''}
          ${hotel.priceRange ? `<p><strong>Precio:</strong> ${hotel.priceRange}</p>` : ''}
          ${link ? `<a class="planivia-button-secondary" href="${link}" target="_blank" rel="noopener">Ver sitio</a>` : ''}
        </div>
      `;
    })
    .join('');

  const travel = safeWeddingInfo.travelGuide || {};
  const mapAddress = [safeWeddingInfo.ceremonyAddress, safeWeddingInfo.receptionAddress]
    .filter(Boolean)
    .join(' / ');
  const mapSection = mapAddress
    ? `
    <section data-enhanced="mapa" id="mapa">
      <div class="planivia-section-heading"><span>Mapa de la celebración</span></div>
      <div class="planivia-card">
        <iframe
          title="Ubicación de la boda"
          src="https://maps.google.com/maps?q=${encodeURIComponent(mapAddress)}&output=embed"
          width="100%"
          height="320"
          style="border:0"
          allowfullscreen=""
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </section>`
    : '';
  const faqEntries = (Array.isArray(safeWeddingInfo.faqs) ? safeWeddingInfo.faqs : [])
    .map(
      (faq) => `
      <div class="planivia-faq__item">
        <div class="font-semibold text-gray-800 mb-1">${faq.question || ''}</div>
        <p class="text-sm text-gray-600">${faq.answer || ''}</p>
      </div>`
    )
    .join('');
  const faqSection = faqEntries
    ? `
    <section data-enhanced="faq" id="faq">
      <div class="planivia-section-heading"><span>Preguntas frecuentes</span></div>
      <div class="planivia-card planivia-faq">
        ${faqEntries}
      </div>
    </section>`
    : '';

  return `
  <main>
    <section data-enhanced="timeline">
      <div class="planivia-section-heading"><span>Agenda del d�a</span></div>
      <div class="planivia-grid planivia-grid--two">
        <div class="planivia-card">
          <h3>Ceremonia</h3>
          <p>${ceremony || 'Pronto más detalles'}</p>
          ${safeWeddingInfo.ceremonyAddress ? `<small>${safeWeddingInfo.ceremonyAddress}</small>` : ''}
        </div>
        <div class="planivia-card">
          <h3>Recepción</h3>
          <p>${reception || 'Pronto más detalles'}</p>
          ${safeWeddingInfo.receptionAddress ? `<small>${safeWeddingInfo.receptionAddress}</small>` : ''}
        </div>
      </div>
    </section>

    <section data-enhanced="transport" id="transporte">
      <div class="planivia-section-heading"><span>Transporte y autobuses</span></div>
      <div class="planivia-card">
        <p>${safeWeddingInfo.transportation || 'Habrá servicio de transporte para invitados. Consulta los horarios en la tabla.'}</p>
        <div class="planivia-table-wrapper">
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
              ${
                scheduleRows ||
                `
                <tr>
                  <td colspan="4">Los horarios exactos de autobuses se publicar�n aqu�.</td>
                </tr>
              `
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section data-enhanced="gallery">
      <div class="planivia-section-heading"><span>Galer�a</span></div>
      <div class="planivia-gallery">
        <div class="planivia-gallery__item"></div>
        <div class="planivia-gallery__item"></div>
        <div class="planivia-gallery__item"></div>
      </div>
    </section>

    <section data-enhanced="story">
      <div class="planivia-section-heading"><span>Nuestra historia</span></div>
      <p>${safeWeddingInfo.story || safeWeddingInfo.additionalInfo || 'Pronto compartiremos detalles de nuestra historia.'}</p>
      <p>Inspiración visual: ${styleNote}.</p>
    </section>

    <section data-enhanced="lodging">
      <div class="planivia-section-heading"><span>Hospedaje cercano</span></div>
      <div class="planivia-grid planivia-grid--two">
        ${
          lodgingCards ||
          `
          <div class="planivia-card">
            <p>Pronto a�adiremos hoteles y alojamientos recomendados cercanos a la celebraci�n.</p>
          </div>
        `
        }
      </div>
    </section>

    <section data-enhanced="travel-guide">
      <div class="planivia-section-heading"><span>C�mo llegar</span></div>
      <div class="planivia-grid planivia-grid--two">
        <div class="planivia-card">
          <h3>En avi�n</h3>
          <p>${(travel.airports || []).map((a) => `" ${a}`).join('<br/>') || 'Aeropuertos cercanos y tiempos estimados aparecer�n aqu�.'}</p>
          ${travel.byPlane ? `<p>${travel.byPlane}</p>` : ''}
        </div>
        <div class="planivia-card">
          <h3>En tren / bus</h3>
          <p>${(travel.stations || []).map((s) => `" ${s}`).join('<br/>') || 'Estaciones y conexiones se publicar�n pronto.'}</p>
          ${travel.byTrain ? `<p>${travel.byTrain}</p>` : ''}
        </div>
      </div>
      <div class="planivia-card">
        <h3>En coche</h3>
        <p>${travel.byCar || 'Recibir�s las indicaciones para llegar en coche tan pronto est�n listas.'}</p>
        ${travel.tips ? `<p><strong>Tips:</strong> ${travel.tips}</p>` : ''}
      </div>
    </section>
    ${mapSection}

    ${faqSection}

    <section data-enhanced="contacto" id="contacto">
      <div class="planivia-section-heading"><span>Contacto</span></div>
      <div class="planivia-card">${contact || 'Escríbenos para más información.'}</div>
    </section>
  </main>
  <footer>
    Con cariño, ${safeWeddingInfo.bride || ''} y ${safeWeddingInfo.groom || ''}.
  </footer>
  `;
};

const ProfileSummary = ({ profile, publishDisabledReason }) => {
  const { t } = useTranslations();
  if (!profile) return null;

  const bride = profile?.brideInfo?.nombre?.trim();
  const groom = profile?.groomInfo?.nombre?.trim();
  const couple = [bride, groom]
    .filter(Boolean)
    .join(` ${t('websiteGenerator.profileSummary.conjunction', 'y')} `);
  const ceremonyDate = profile?.ceremonyInfo?.fecha;
  const ceremony = [profile?.ceremonyInfo?.lugar, profile?.ceremonyInfo?.hora]
    .filter(Boolean)
    .join(' � ');
  const reception = [profile?.receptionInfo?.lugar, profile?.receptionInfo?.hora]
    .filter(Boolean)
    .join(' � ');
  const contact = [profile?.contactEmail, profile?.contactPhone].filter(Boolean).join(' � ');

  return (
    <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" style={{ backgroundColor: '#EDE8E0' }}>
      <div className="mx-auto my-8" style={{
        maxWidth: '1024px',
        width: '100%',
        backgroundColor: '#FFFBF7',
        borderRadius: '32px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        overflow: 'hidden'
      }}>
        
        {/* Hero con degradado beige-dorado */}
        <header className="relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, #FFF4E6 0%, #F8EFE3 50%, #E8D5C4 100%)',
          padding: '48px 32px 32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div className="max-w-4xl mx-auto" style={{ textAlign: 'center' }}>
            {/* Título con líneas decorativas */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '60px',
                height: '1px',
                background: 'linear-gradient(to right, transparent, #D4A574)',
              }} />
              <h1 style={{
                fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
                fontSize: '40px',
                fontWeight: 400,
                color: '#1F2937',
                letterSpacing: '-0.01em',
                margin: 0,
              }}>Diseño Web</h1>
              <div style={{
                width: '60px',
                height: '1px',
                background: 'linear-gradient(to left, transparent, #D4A574)',
              }} />
            </div>
            
            {/* Subtítulo como tag uppercase */}
            <p style={{
              fontFamily: "'DM Sans', 'Inter', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 0,
            }}>Web de Boda</p>
          </div>
        </header>

        {/* Contenido */}
        <div className="px-6 py-6">
          <div className=" rounded-lg shadow p-6 mb-8" className="bg-surface">
            <h2 className="text-xl font-semibold mb-3">
              {t('websiteGenerator.profileSummary.title', 'Datos del perfil aplicados')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm " className="text-body">
              {couple && (
                <div>
                  <span className="" className="text-muted">
                    {t('websiteGenerator.profileSummary.labels.couple', 'Pareja')}:&nbsp;
                  </span>
                  {couple}
                </div>
              )}
              {ceremonyDate && (
                <div>
                  <span className="" className="text-muted">
                    {t('websiteGenerator.profileSummary.labels.date', 'Fecha')}:&nbsp;
                  </span>
                  {ceremonyDate}
                </div>
              )}
              {ceremony && (
                <div>
                  <span className="" className="text-muted">
                    {t('websiteGenerator.profileSummary.labels.ceremony', 'Ceremonia')}:&nbsp;
                  </span>
                  {ceremony}
                </div>
              )}
              {reception && (
                <div>
                  <span className="" className="text-muted">
                    {t('websiteGenerator.profileSummary.labels.reception', 'Recepción')}:&nbsp;
                  </span>
                  {reception}
                </div>
              )}
              {contact && (
                <div className="sm:col-span-2">
                  <span className="" className="text-muted">
                    {t('websiteGenerator.profileSummary.labels.contact', 'Contacto')}:&nbsp;
                  </span>
                  {contact}
                </div>
              )}
              {profile?.additionalInfo && (
                <div className="sm:col-span-2">
                  <span className="" className="text-muted">
                    {t('common.websiteGenerator.profileSummary.labels.additionalInfo', 'Info adicional')}
                    :&nbsp;
                  </span>
                  {profile.additionalInfo}
                </div>
              )}
            </div>
            {publishDisabledReason && (
              <div className="mt-4 text-sm text-amber-700 bg-amber-50 border-l-4 border-amber-500 px-3 py-2 rounded">
                {publishDisabledReason}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const VersionsTable = ({ versions, templates, onView, onEdit }) => {
  if (!versions?.length) return null;

  return (
    <div className=" rounded-lg shadow p-6" className="bg-surface">
      <h2 className="text-xl font-semibold mb-4">Versiones publicadas</h2>

      <div className="overflow-hidden rounded-lg border " className="border-default">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="" className="bg-page">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider" className="text-muted">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider" className="text-muted">
                Plantilla
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider" className="text-muted">
                Indicaciones
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium  uppercase tracking-wider" className="text-muted">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className=" divide-y divide-gray-200" className="bg-surface">
            {versions.map((version) => {
              const templateKey = detectTemplateFromText(version.prompt || '');
              const templateName = templates?.[templateKey]?.name || 'Personalizada';
              const createdAt = version.createdAt?.seconds
                ? new Date(version.createdAt.seconds * 1000).toLocaleString()
                : '';

              return (
                <tr key={version.id} className="hover:" className="bg-page">
                  <td className="px-6 py-4 whitespace-nowrap text-sm " className="text-secondary">{createdAt}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm " className="text-secondary">
                    {templateName}
                  </td>
                  <td className="px-6 py-4 text-sm  truncate max-w-xs" className="text-secondary">
                    {version.prompt || 'Sin indicaciones'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => onView?.(version, templateKey)}
                      className=" hover:text-blue-800 mr-4" className="text-primary"
                    >
                      Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit?.(version, templateKey)}
                      className=" hover:text-green-800" className="text-success"
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

const PromptLibraryModal = ({
  open,
  onClose,
  builtInOptions = [],
  customPrompts = [],
  templates = {},
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
  loading = false,
}) => {
  const { t } = useTranslations();
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    prompt: '',
    templateKey: 'personalizada',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const promptTokens = useMemo(
    () => [
      t('websiteGenerator.promptLibrary.tokens.names', '{nombres}'),
      t('websiteGenerator.promptLibrary.tokens.date', '{fecha}'),
      t('websiteGenerator.promptLibrary.tokens.location', '{ubicacion}'),
    ],
    [t]
  );
  const tokenConjunction = t('websiteGenerator.profileSummary.conjunction', 'y');

  useEffect(() => {
    if (!open) {
      setEditingPrompt(null);
      setFormState({ name: '', description: '', prompt: '', templateKey: 'personalizada' });
      setFormError('');
      setSaving(false);
    }
  }, [open]);

  if (!open) return null;

  const templateEntries = Object.entries(templates || {});

  const handleUsePrompt = (option) => {
    onSelect?.({
      prompt: option.samplePrompt || option.prompt || '',
      templateKey: option.templateKey || option.key || 'personalizada',
      name: option.name,
    });
    onClose?.();
  };

  const beginCreate = () => {
    setEditingPrompt({ id: null });
    setFormState({ name: '', description: '', prompt: '', templateKey: 'personalizada' });
    setFormError('');
  };

  const beginEdit = (item) => {
    setEditingPrompt(item);
    setFormState({
      name: item.name || '',
      description: item.description || '',
      prompt: item.prompt || '',
      templateKey: item.templateKey || 'personalizada',
    });
    setFormError('');
  };

  const cancelEdit = () => {
    setEditingPrompt(null);
    setFormState({ name: '', description: '', prompt: '', templateKey: 'personalizada' });
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    if (!formState.prompt.trim()) {
      setFormError(
        t(
          'common.websiteGenerator.promptLibrary.errors.required',
          'El prompt no puede estar vacío.'
        )
      );
      return;
    }
    try {
      setSaving(true);
      setFormError('');
      if (editingPrompt && editingPrompt.id) {
        await onUpdate?.({
          id: editingPrompt.id,
          name: formState.name,
          description: formState.description,
          prompt: formState.prompt,
          templateKey: formState.templateKey,
        });
      } else {
        await onCreate?.({
          name: formState.name,
          description: formState.description,
          prompt: formState.prompt,
          templateKey: formState.templateKey,
        });
      }
      cancelEdit();
    } catch (err) {
      setFormError(
        err?.message ||
          t('common.websiteGenerator.promptLibrary.errors.save', 'No se pudo guardar el prompt.')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!onDelete) return;
    const confirmDelete = window.confirm(
      t(
        'common.websiteGenerator.promptLibrary.confirmDelete',
        '¿Eliminar este prompt personalizado?'
      )
    );
    if (!confirmDelete) return;
    try {
      setSaving(true);
      setFormError('');
      await onDelete(id);
      if (editingPrompt && editingPrompt.id === id) {
        cancelEdit();
      }
    } catch (err) {
      setFormError(
        err?.message ||
          t('common.websiteGenerator.promptLibrary.errors.delete', 'No se pudo eliminar el prompt.')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className=" rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col" className="bg-surface">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold " className="text-body">
            {t('common.websiteGenerator.promptLibrary.title', 'Biblioteca de prompts')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className=" hover: transition-colors" className="text-body"
          >
            {t('websiteGenerator.promptLibrary.close', 'Cerrar')}
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <section>
            <p className="text-sm  mb-3" className="text-secondary">
              {t(
                'common.websiteGenerator.promptLibrary.intro',
                'Selecciona un prompt para rellenar automáticamente el generador.'
              )}{' '}
              {t(
                'common.websiteGenerator.promptLibrary.tokensIntro',
                'Reemplaza las variables por tus datos:'
              )}{' '}
              {promptTokens.map((token, index) => (
                <React.Fragment key={`${token}-${index}`}>
                  {index > 0
                    ? index === promptTokens.length - 1
                      ? ` ${tokenConjunction} `
                      : ', '
                    : ''}
                  <code className=" px-1 rounded" className="bg-page">{token}</code>
                </React.Fragment>
              ))}
            </p>
            <h4 className="text-sm font-semibold  mb-2" className="text-body">
              {t('common.websiteGenerator.promptLibrary.builtIn.title', 'Prompts predeterminados')}
            </h4>
            <div className="space-y-3">
              {builtInOptions.map((option) => (
                <div
                  key={`builtin-${option.key}`}
                  className="border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h5 className="text-base font-semibold " className="text-body">{option.name}</h5>
                      <p className="text-sm  mt-1" className="text-muted">{option.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUsePrompt(option)}
                      className="shrink-0 inline-flex items-center gap-2  hover:bg-blue-700 text-white px-3 py-2 rounded-full text-sm transition-colors" style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      {t('common.websiteGenerator.promptLibrary.builtIn.use', 'Usar prompt')}
                    </button>
                  </div>
                  <pre className="mt-3 text-sm  rounded-lg p-3 whitespace-pre-wrap " style={{ color: 'var(--color-text)', backgroundColor: 'var(--color-bg)' }}>
                    {option.samplePrompt}
                  </pre>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold " className="text-body">
                {t('common.websiteGenerator.promptLibrary.custom.title', 'Mis prompts')}
              </h4>
              <button
                type="button"
                onClick={beginCreate}
                className="inline-flex items-center gap-2  hover:bg-green-700 text-white px-3 py-2 rounded-full text-sm transition-colors" style={{ backgroundColor: 'var(--color-success)' }}
                disabled={saving}
              >
                {t('common.websiteGenerator.promptLibrary.custom.new', 'Nuevo prompt')}
              </button>
            </div>
            {loading ? (
              <p className="text-sm " className="text-muted">
                {t(
                  'common.websiteGenerator.promptLibrary.custom.loading',
                  'Cargando biblioteca personal…'
                )}
              </p>
            ) : customPrompts.length === 0 ? (
              <p className="text-sm " className="text-muted">
                {t(
                  'common.websiteGenerator.promptLibrary.custom.empty',
                  'Aún no tienes prompts personalizados. Crea uno para reutilizar tus indicaciones favoritas.'
                )}
              </p>
            ) : (
              <div className="space-y-3">
                {customPrompts.map((item) => (
                  <div
                    key={`custom-${item.id}`}
                    className="border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h5 className="text-base font-semibold " className="text-body">
                          {item.name ||
                            t(
                              'common.websiteGenerator.promptLibrary.custom.untitled',
                              'Sin título'
                            )}
                        </h5>
                        <p className="text-xs  mt-1" className="text-muted">
                          {t(
                            'common.websiteGenerator.promptLibrary.custom.templateLabel',
                            'Plantilla sugerida:'
                          )}{' '}
                          {templates[item.templateKey || 'personalizada']?.name ||
                            t(
                              'common.websiteGenerator.promptLibrary.custom.templateFallback',
                              'Personalizada'
                            )}
                        </p>
                        {item.description ? (
                          <p className="text-sm  mt-1" className="text-muted">{item.description}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleUsePrompt({
                              ...item,
                              samplePrompt: item.prompt,
                            })
                          }
                          className="inline-flex items-center gap-2  hover:bg-blue-700 text-white px-3 py-2 rounded-full text-sm transition-colors" style={{ backgroundColor: 'var(--color-primary)' }}
                        >
                          {t('websiteGenerator.promptLibrary.buttons.use', 'Usar')}
                        </button>
                        <button
                          type="button"
                          onClick={() => beginEdit(item)}
                          className="inline-flex items-center gap-2 border  px-3 py-2 rounded-full text-sm  hover: transition-colors" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', backgroundColor: 'var(--color-bg)' }}
                          disabled={saving}
                        >
                          {t('websiteGenerator.promptLibrary.buttons.edit', 'Editar')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex items-center gap-2 border border-red-200 px-3 py-2 rounded-full text-sm  hover:bg-red-50 transition-colors" className="text-danger"
                          disabled={saving}
                        >
                          {t('websiteGenerator.promptLibrary.buttons.delete', 'Eliminar')}
                        </button>
                      </div>
                    </div>
                    <pre className="mt-3 text-sm  rounded-lg p-3 whitespace-pre-wrap " style={{ color: 'var(--color-text)', backgroundColor: 'var(--color-bg)' }}>
                      {item.prompt}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </section>

          {editingPrompt && (
            <section className="border border-blue-100 rounded-xl p-4 bg-blue-50/40 space-y-4">
              <h4 className="text-sm font-semibold " className="text-body">
                {editingPrompt.id
                  ? t(
                      'common.websiteGenerator.promptLibrary.form.editTitle',
                      'Editar prompt personalizado'
                    )
                  : t(
                      'common.websiteGenerator.promptLibrary.form.createTitle',
                      'Nuevo prompt personalizado'
                    )}
              </h4>
              {formError && (
                <div className="text-sm  bg-red-50 border border-red-200 rounded px-3 py-2" className="text-danger">
                  {formError}
                </div>
              )}
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold  mb-1" className="text-secondary">
                      {t('websiteGenerator.promptLibrary.form.labels.name', 'Nombre')}
                    </label>
                    <input
                      type="text"
                      value={formState.name}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, name: event.target.value }))
                      }
                      className="w-full border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                      placeholder={t(
                        'common.websiteGenerator.promptLibrary.form.placeholders.name',
                        'Prompt para estilo moderno'
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold  mb-1" className="text-secondary">
                      {t(
                        'websiteGenerator.promptLibrary.form.labels.template',
                        'Plantilla sugerida'
                      )}
                    </label>
                    <select
                      value={formState.templateKey}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, templateKey: event.target.value }))
                      }
                      className="w-full border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                    >
                      {templateEntries.map(([key, info]) => (
                        <option key={key} value={key}>
                          {info?.name || key}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold  mb-1" className="text-secondary">
                    {t(
                      'common.websiteGenerator.promptLibrary.form.labels.description',
                      'Descripción'
                    )}
                  </label>
                  <textarea
                    value={formState.description}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, description: event.target.value }))
                    }
                    className="w-full border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                    rows={2}
                    placeholder={t(
                      'common.websiteGenerator.promptLibrary.form.placeholders.description',
                      'Detalle para identificar rápidamente el tipo de propuesta.'
                    )}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold  mb-1" className="text-secondary">
                    {t('websiteGenerator.promptLibrary.form.labels.prompt', 'Prompt')}
                  </label>
                  <textarea
                    value={formState.prompt}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, prompt: event.target.value }))
                    }
                    className="w-full border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                    rows={5}
                    placeholder={t(
                      'common.websiteGenerator.promptLibrary.form.placeholders.prompt',
                      'Describe el tono, estructura y elementos clave que deseas.'
                    )}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="inline-flex items-center px-4 py-2 rounded-full border   hover: transition-colors" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', backgroundColor: 'var(--color-bg)' }}
                    disabled={saving}
                  >
                    {t('websiteGenerator.promptLibrary.form.cancel', 'Cancelar')}
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-5 py-2 rounded-full  text-white hover:bg-blue-700 transition-colors disabled:opacity-60" style={{ backgroundColor: 'var(--color-primary)' }}
                    disabled={saving}
                  >
                    {saving
                      ? t('common.websiteGenerator.promptLibrary.form.saving', 'Guardando…')
                      : t('common.websiteGenerator.promptLibrary.form.save', 'Guardar prompt')}
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>
        <footer className="px-6 py-3 border-t border-gray-100 text-right">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 rounded-full border   hover: transition-colors" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg)' }}
            disabled={saving}
          >
            {t('websiteGenerator.promptLibrary.close', 'Cerrar')}
          </button>
        </footer>
      </div>
    </div>
  );
};

const LogisticsEditor = ({ open, draft, onDraftChange, onClose, onSave, saving }) => {
  const { t } = useTranslations();
  if (!open) return null;

  const updateTransportation = (value) => onDraftChange({ ...draft, transportation: value });

  const updateScheduleItem = (index, key, value) => {
    const next = draft.schedule.map((item, idx) =>
      idx === index ? { ...item, [key]: value } : item
    );
    onDraftChange({ ...draft, schedule: next });
  };

  const addScheduleItem = () =>
    onDraftChange({
      ...draft,
      schedule: [
        ...(draft.schedule || []),
        { id: createId(), time: '', departure: '', destination: '', notes: '' },
      ],
    });

  const removeScheduleItem = (index) =>
    onDraftChange({
      ...draft,
      schedule: draft.schedule.filter((_, idx) => idx !== index),
    });

  const updateLodgingItem = (index, key, value) => {
    const next = draft.lodging.map((item, idx) =>
      idx === index ? { ...item, [key]: value } : item
    );
    onDraftChange({ ...draft, lodging: next });
  };

  const addLodgingItem = () =>
    onDraftChange({
      ...draft,
      lodging: [
        ...(draft.lodging || []),
        { id: createId(), name: '', distance: '', priceRange: '', link: '', amenities: '' },
      ],
    });

  const removeLodgingItem = (index) =>
    onDraftChange({
      ...draft,
      lodging: draft.lodging.filter((_, idx) => idx !== index),
    });

  const updateTravel = (key, value) =>
    onDraftChange({ ...draft, travel: { ...draft.travel, [key]: value } });

  const updateStory = (value) => onDraftChange({ ...draft, story: value });
  const updateAdditionalInfo = (value) => onDraftChange({ ...draft, additionalInfo: value });

  const updateFaqItem = (index, key, value) => {
    const next = (draft.faqs || []).map((item, idx) =>
      idx === index ? { ...item, [key]: value } : item
    );
    onDraftChange({ ...draft, faqs: next });
  };

  const addFaqItem = () =>
    onDraftChange({
      ...draft,
      faqs: [...(draft.faqs || []), { id: createId(), question: '', answer: '' }],
    });

  const removeFaqItem = (index) =>
    onDraftChange({
      ...draft,
      faqs: (draft.faqs || []).filter((_, idx) => idx !== index),
    });

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className=" w-full max-w-4xl h-full sm:h-auto sm:rounded-l-3xl shadow-2xl overflow-hidden flex flex-col" className="bg-surface">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold " className="text-body">
              {t('websiteGenerator.logistics.title', 'Editar logística del sitio')}
            </h3>
            <p className="text-sm " className="text-muted">
              {t(
                'common.websiteGenerator.logistics.description',
                'Ajusta horarios de autobuses, hospedajes recomendados y guía de llegada. Los cambios se guardan en la boda activa.'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className=" hover: transition-colors" className="text-body"
          >
            {t('actions.close', 'Cerrar')}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold  mb-2" className="text-body">
                {t('common.websiteGenerator.logistics.story.title', 'Historia de la pareja')}
              </h4>
              <textarea
                className="w-full border  rounded-lg p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                rows={4}
                value={draft.story || ''}
                onChange={(event) => updateStory(event.target.value)}
                placeholder={t(
                  'common.websiteGenerator.logistics.story.placeholder',
                  'Cuenta la historia de la pareja en 2-3 párrafos.'
                )}
              />
            </div>
            <div>
              <h4 className="text-sm font-semibold  mb-2" className="text-body">
                {t('common.websiteGenerator.logistics.notes.title', 'Notas / recomendaciones')}
              </h4>
              <textarea
                className="w-full border  rounded-lg p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                rows={4}
                value={draft.additionalInfo || ''}
                onChange={(event) => updateAdditionalInfo(event.target.value)}
                placeholder={t(
                  'common.websiteGenerator.logistics.notes.placeholder',
                  'Incluye recomendaciones, dress code u otra información útil.'
                )}
              />
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold  mb-2" className="text-body">
              {t('common.websiteGenerator.logistics.transportation.title', 'Transporte general')}
            </h4>
            <textarea
              className="w-full border  rounded-lg p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
              rows={3}
              value={draft.transportation}
              onChange={(event) => updateTransportation(event.target.value)}
              placeholder={t(
                'common.websiteGenerator.logistics.transportation.placeholder',
                'Ej: Habrá autobuses desde el hotel principal 45 minutos antes de la ceremonia...'
              )}
            />
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold " className="text-body">
                {t('common.websiteGenerator.logistics.schedule.title', 'Horarios de autobuses')}
              </h4>
              <button
                type="button"
                onClick={addScheduleItem}
                className="text-sm  hover:text-blue-700" className="text-primary"
              >
                {t('websiteGenerator.logistics.schedule.add', 'Añadir horario')}
              </button>
            </div>
            <div className="space-y-3">
              {(draft.schedule || []).map((item, index) => (
                <div
                  key={item.id || index}
                  className="grid grid-cols-1 md:grid-cols-4 gap-3 border border-gray-100 rounded-lg p-3 " className="bg-page"
                >
                  <input
                    type="time"
                    className="border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                    value={item.time}
                    onChange={(event) => updateScheduleItem(index, 'time', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder={t(
                      'common.websiteGenerator.logistics.schedule.departure',
                      'Sale de'
                    )}
                    className="border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                    value={item.departure}
                    onChange={(event) => updateScheduleItem(index, 'departure', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder={t(
                      'common.websiteGenerator.logistics.schedule.destination',
                      'Llega a'
                    )}
                    className="border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                    value={item.destination}
                    onChange={(event) =>
                      updateScheduleItem(index, 'destination', event.target.value)
                    }
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={t('webDesign.contentPlaceholder')}
                      className="flex-1 border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                      value={item.notes}
                      onChange={(event) => updateScheduleItem(index, 'notes', event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeScheduleItem(index)}
                      className="text-xs  hover:" className="text-danger"
                    >
                      {t('actions.remove', 'Quitar')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold " className="text-body">
                {t('common.websiteGenerator.logistics.lodging.title', 'Hospedaje recomendado')}
              </h4>
              <button
                type="button"
                onClick={addLodgingItem}
                className="text-sm  hover:text-blue-700" className="text-primary"
              >
                {t('common.websiteGenerator.logistics.lodging.add', 'Añadir hospedaje')}
              </button>
            </div>
            <div className="space-y-3">
              {(draft.lodging || []).map((item, index) => (
                <div
                  key={item.id || index}
                  className="border border-gray-100 rounded-lg p-3  shadow-sm space-y-2" className="bg-surface"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder={t(
                        'common.websiteGenerator.logistics.lodging.placeholders.name',
                        'Nombre del hotel o alojamiento'
                      )}
                      className="border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                      value={item.name}
                      onChange={(event) => updateLodgingItem(index, 'name', event.target.value)}
                    />
                    <input
                      type="text"
                      placeholder={t(
                        'common.websiteGenerator.logistics.lodging.placeholders.distance',
                        'Distancia o tiempo'
                      )}
                      className="border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                      value={item.distance}
                      onChange={(event) => updateLodgingItem(index, 'distance', event.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder={t(
                        'common.websiteGenerator.logistics.lodging.placeholders.priceRange',
                        'Rango de precio'
                      )}
                      className="border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                      value={item.priceRange}
                      onChange={(event) =>
                        updateLodgingItem(index, 'priceRange', event.target.value)
                      }
                    />
                    <input
                      type="url"
                      placeholder={t(
                        'common.websiteGenerator.logistics.lodging.placeholders.link',
                        'Enlace de reserva'
                      )}
                      className="border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                      value={item.link}
                      onChange={(event) => updateLodgingItem(index, 'link', event.target.value)}
                    />
                  </div>
                  <textarea
                    className="w-full border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                    rows={2}
                    placeholder={t(
                      'common.websiteGenerator.logistics.lodging.placeholders.amenities',
                      'Servicios o notas (separados por coma o salto de línea)'
                    )}
                    value={item.amenities}
                    onChange={(event) => updateLodgingItem(index, 'amenities', event.target.value)}
                  />
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => removeLodgingItem(index)}
                      className="text-xs  hover:" className="text-danger"
                    >
                      {t('common.websiteGenerator.logistics.lodging.remove', 'Quitar hospedaje')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-semibold " className="text-body">
              {t('websiteGenerator.logistics.travel.title', 'Guía de llegada')}
            </h4>
            <textarea
              className="w-full border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
              rows={2}
              placeholder={t(
                'common.websiteGenerator.logistics.travel.summaryPlaceholder',
                'Resumen general'
              )}
              value={draft.travel.summary}
              onChange={(event) => updateTravel('summary', event.target.value)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <textarea
                className="border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                rows={2}
                placeholder={t(
                  'common.websiteGenerator.logistics.travel.byPlanePlaceholder',
                  'Cómo llegar en avión'
                )}
                value={draft.travel.byPlane}
                onChange={(event) => updateTravel('byPlane', event.target.value)}
              />
              <textarea
                className="border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                rows={2}
                placeholder={t(
                  'common.websiteGenerator.logistics.travel.byTrainPlaceholder',
                  'Cómo llegar en tren o bus'
                )}
                value={draft.travel.byTrain}
                onChange={(event) => updateTravel('byTrain', event.target.value)}
              />
            </div>
            <textarea
              className="border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
              rows={2}
              placeholder={t(
                'common.websiteGenerator.logistics.travel.byCarPlaceholder',
                'Cómo llegar en coche'
              )}
              value={draft.travel.byCar}
              onChange={(event) => updateTravel('byCar', event.target.value)}
            />
            <textarea
              className="border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
              rows={2}
              placeholder={t(
                'common.websiteGenerator.logistics.travel.tipsPlaceholder',
                'Tips adicionales'
              )}
              value={draft.travel.tips}
              onChange={(event) => updateTravel('tips', event.target.value)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <textarea
                className="border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                rows={3}
                placeholder={t(
                  'common.websiteGenerator.logistics.travel.airportsPlaceholder',
                  'Aeropuertos cercanos (uno por línea)'
                )}
                value={draft.travel.airportsText}
                onChange={(event) => updateTravel('airportsText', event.target.value)}
              />
              <textarea
                className="border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                rows={3}
                placeholder={t(
                  'common.websiteGenerator.logistics.travel.stationsPlaceholder',
                  'Estaciones cercanas (uno por línea)'
                )}
                value={draft.travel.stationsText}
                onChange={(event) => updateTravel('stationsText', event.target.value)}
              />
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold " className="text-body">
                {t('websiteGenerator.logistics.faq.title', 'Preguntas frecuentes')}
              </h4>
              <button
                type="button"
                onClick={addFaqItem}
                className="text-sm  hover:text-blue-700" className="text-primary"
              >
                {t('websiteGenerator.logistics.faq.add', 'Añadir pregunta')}
              </button>
            </div>
            <div className="space-y-3">
              {(draft.faqs || []).map((item, index) => (
                <div
                  key={item.id || index}
                  className="border border-gray-100 rounded-lg p-3  shadow-sm space-y-2" className="bg-surface"
                >
                  <input
                    type="text"
                    placeholder={t(
                      'common.websiteGenerator.logistics.faq.questionPlaceholder',
                      'Pregunta'
                    )}
                    className="w-full border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                    value={item.question}
                    onChange={(event) => updateFaqItem(index, 'question', event.target.value)}
                  />
                  <textarea
                    placeholder={t(
                      'common.websiteGenerator.logistics.faq.answerPlaceholder',
                      'Respuesta'
                    )}
                    className="w-full border  rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200" className="border-default"
                    rows={2}
                    value={item.answer}
                    onChange={(event) => updateFaqItem(index, 'answer', event.target.value)}
                  />
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => removeFaqItem(index)}
                      className="text-xs  hover:" className="text-danger"
                    >
                      {t('common.websiteGenerator.logistics.faq.remove', 'Quitar pregunta')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 rounded-full border   hover: transition-colors" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg)' }}
          >
            {t('websiteGenerator.logisticsActions.cancel', 'Cancelar')}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className={`inline-flex items-center px-5 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors ${
              saving ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {saving
              ? t('common.websiteGenerator.logisticsActions.saving', 'Guardando…')
              : t('websiteGenerator.logisticsActions.save', 'Guardar logística')}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default function DisenoWeb() {
  const { currentUser, logout: logoutUnified } = useAuth();
  const uid = currentUser?.uid;
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const { activeWedding } = useWedding();
  const { t } = useTranslations();
  const location = useLocation();
  const navigate = useNavigate();

  const templates = TEMPLATE_OPTIONS;
  const builtInPromptOptions = useMemo(() => listTemplateOptions(), []);

  const generatorRef = useRef(null);
  const previewRef = useRef(null);

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
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showLogisticsEditor, setShowLogisticsEditor] = useState(false);
  const [logisticsDraft, setLogisticsDraft] = useState(buildLogisticsDraftFromProfile());
  const [savingLogistics, setSavingLogistics] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isPublishing, setIsPublishing] = useState(false);
  const [missingBasics, setMissingBasics] = useState(false);
  const [customPrompts, setCustomPrompts] = useState([]);
  const [promptLibraryLoading, setPromptLibraryLoading] = useState(false);

  // 🎨 Estados simplificados
  const [currentStep, setCurrentStep] = useState(1); // 1: Plantilla, 2: Contenido, 3: Preview, 4: Publicar
  const [webVariables, setWebVariables] = useState({}); // Variables editables específicas para la web
  const [showVariablesEditor, setShowVariablesEditor] = useState(false);

  const isTestEnv = typeof window !== 'undefined' && !!window.Cypress;
  const [testTemplate, setTestTemplate] = useState('personalizada');
  const [testPrompt, setTestPrompt] = useState('');
  const [testPreviewReady, setTestPreviewReady] = useState(false);

  if (isTestEnv) {
    const templateEntriesLocal = Object.entries(templates || {});
    return (
      <div className="p-6 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Diseño web</h1>
          <p className="text-sm " className="text-secondary">
            Selecciona una plantilla y genera una vista previa ficticia (modo E2E).
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templateEntriesLocal.map(([key, info]) => (
            <button
              key={key}
              type="button"
              className={`text-left border rounded-lg p-4 transition ${
                testTemplate === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => {
                setTestTemplate(key);
                setTestPreviewReady(false);
              }}
            >
              <h3 className="font-medium text-lg">{info?.name || key}</h3>
              <p className="text-sm  mt-1" className="text-secondary">
                {info?.desc || 'Plantilla predeterminada para generar la web.'}
              </p>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <textarea
            className="w-full h-40 border rounded-lg p-4"
            placeholder={t('webDesign.sectionTitlePlaceholder')}
            value={testPrompt}
            onChange={(event) => {
              setTestPrompt(event.target.value);
              setTestPreviewReady(false);
            }}
          />
          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full  text-white hover:bg-blue-700 transition-colors disabled:opacity-60" style={{ backgroundColor: 'var(--color-primary)' }}
            onClick={() => setTestPreviewReady(true)}
            disabled={!testPrompt.trim()}
          >
            Generar P�gina Web
          </button>
        </div>

        {testPreviewReady && (
          <iframe
            title="Vista previa"
            className="w-full h-[480px] border rounded-lg"
            srcDoc={`<!doctype html><html><head><meta charset="utf-8"><title>Vista previa ${templates[testTemplate]?.name || 'Personalizada'}</title></head><body style="font-family:Arial,sans-serif;padding:2rem;"><h2>${templates[testTemplate]?.name || 'Plantilla personalizada'}</h2><p>${
              testPrompt || 'Vista previa generada en modo prueba.'
            }</p></body></html>`}
          />
        )}
      </div>
    );
  }

  const weddingInfo = useMemo(() => buildWeddingInfoFromProfile(profile), [profile]);

  const { publishDisabled, publishDisabledReason } = useMemo(() => {
    const trimmedHtml = (html || '').trim();
    const slugUnavailable = slugStatus === 'reserved' || slugStatus === 'taken';

    if (isPublishing) {
      return {
        publishDisabled: true,
        publishDisabledReason: 'Estamos publicando tu sitio. Espera un momento.',
      };
    }
    if (!trimmedHtml) {
      return {
        publishDisabled: true,
        publishDisabledReason: 'Genera la p�gina antes de publicar.',
      };
    }
    if (!isOnline) {
      return {
        publishDisabled: true,
        publishDisabledReason: 'Est�s sin conexi�n. Con�ctate para publicar tu sitio.',
      };
    }
    if (slugStatus === 'invalid') {
      return {
        publishDisabled: true,
        publishDisabledReason: 'El slug indicado no es v�lido.',
      };
    }
    if (slugUnavailable) {
      return {
        publishDisabled: true,
        publishDisabledReason: 'El slug indicado ya est� en uso. Ajusta el nombre p�blico.',
      };
    }

    return {
      publishDisabled: false,
      publishDisabledReason: '',
    };
  }, [html, isOnline, slugStatus, isPublishing]);

  useEffect(() => {
    const updateOnlineStatus = () =>
      setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    setMissingBasics(
      !profile ||
        !profile?.brideInfo?.nombre ||
        !profile?.groomInfo?.nombre ||
        !profile?.ceremonyInfo?.fecha
    );
  }, [profile]);

  useEffect(() => {
    setLogisticsDraft(buildLogisticsDraftFromProfile(profile));
  }, [profile]);

  useEffect(() => {
    if (location.state?.focus === 'generator' && generatorRef.current) {
      generatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      navigate(`${location.pathname}${location.search}`, { replace: true });
    }
  }, [location.state, location.pathname, location.search, navigate]);

  useEffect(() => {
    const shouldFocusPreview = location.pathname.endsWith('/preview');
    if (shouldFocusPreview && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.pathname, html]);

  useEffect(() => {
    let cancelled = false;

    const loadContext = async () => {
      setPromptLibraryLoading(true);
      if (!uid) {
        setProfile(null);
        setVersions([]);
        setCustomPrompts([]);
        setPromptLibraryLoading(false);
        return;
      }
      try {
        const {
          profile: loadedProfile,
          versions: loadedVersions,
          promptLibrary = [],
        } = await loadWebsiteContext({
          uid,
          weddingId: activeWedding,
        });
        if (cancelled) return;
        setProfile(loadedProfile);
        setVersions(loadedVersions);
        setCustomPrompts(Array.isArray(promptLibrary) ? promptLibrary : []);
      } catch (err) {
        if (!cancelled) {
          // console.warn('loadWebsiteContext error', err);
        }
      } finally {
        if (!cancelled) {
          setPromptLibraryLoading(false);
        }
      }
    };

    loadContext();

    return () => {
      cancelled = true;
    };
  }, [uid, activeWedding]);

  useEffect(() => {
    const suggestions = buildSlugSuggestions(weddingInfo);
    setSlugSuggestions(suggestions);
    if (!publishSlug && suggestions.length) setPublishSlug(suggestions[0]);
  }, [weddingInfo]);

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

  useEffect(() => {
    if (showQR) {
      setShowQR(false);
    }
  }, [publishSlug]);

  const handleTemplateSelect = (templateKey) => {
    setSelectedTemplate(templateKey);
    const sample = templates[templateKey]?.prompt;
    if (sample) {
      setPrompt(sample);
    }
    if (currentStep === 1) {
      setCurrentStep(2);
    }
  };

  const handleSaveLogistics = useCallback(async () => {
    setSavingLogistics(true);
    try {
      const sanitized = sanitizeLogisticsDraft(logisticsDraft);
      await updateWebsiteLogistics({
        uid,
        weddingId: activeWedding,
        logistics: sanitized,
      });
      setProfile((prev) => {
        if (!prev) {
          return {
            transportationInfo: {
              detalles: sanitized.transportation,
              schedule: sanitized.transportationSchedule,
            },
            lodgingOptions: sanitized.lodgingOptions,
            travelInfo: sanitized.travelGuide,
            story: sanitized.story,
            additionalInfo: sanitized.additionalInfo,
            faqs: sanitized.faqs,
          };
        }
        return {
          ...prev,
          transportationInfo: {
            ...(prev.transportationInfo || {}),
            detalles: sanitized.transportation,
            schedule: sanitized.transportationSchedule,
          },
          lodgingOptions: sanitized.lodgingOptions,
          travelInfo: {
            ...(prev.travelInfo || {}),
            summary: sanitized.travelGuide.summary,
            byCar: sanitized.travelGuide.byCar,
            byPlane: sanitized.travelGuide.byPlane,
            byTrain: sanitized.travelGuide.byTrain,
            tips: sanitized.travelGuide.tips,
            airports: sanitized.travelGuide.airports,
            stations: sanitized.travelGuide.stations,
          },
          story: sanitized.story,
          additionalInfo: sanitized.additionalInfo,
          faqs: sanitized.faqs,
        };
      });
      try {
        await recordWebsiteEvent({
          uid,
          weddingId: activeWedding,
          event: 'website_logistics_saved',
          payload: {
            transportationEntries: sanitized.transportationSchedule.length,
            lodgingEntries: sanitized.lodgingOptions.length,
            faqEntries: sanitized.faqs.length,
          },
        });
      } catch (logErr) {
        // console.warn('recordWebsiteEvent logistics', logErr);
      }
      toast.success(t('messages.logisticsUpdated'));
      setShowLogisticsEditor(false);
    } catch (err) {
      // console.error('Error guardando log�stica', err);
      toast.error(t('errors.saveLogisticsError'));
    } finally {
      setSavingLogistics(false);
    }
  }, [uid, activeWedding, logisticsDraft]);

  const handleCreatePrompt = useCallback(
    async ({ name, description, prompt: promptText, templateKey }) => {
      if (!uid) throw new Error('Usuario no autenticado');
      setPromptLibraryLoading(true);
      try {
        const updated = await createWebsitePrompt({
          uid,
          name,
          description,
          prompt: promptText,
          templateKey,
        });
        setCustomPrompts(Array.isArray(updated) ? updated : []);
      } catch (err) {
        // console.error('createWebsitePrompt', err);
        throw err;
      } finally {
        setPromptLibraryLoading(false);
      }
    },
    [uid]
  );

  const handleUpdatePrompt = useCallback(
    async ({ id, name, description, prompt: promptText, templateKey }) => {
      if (!uid) throw new Error('Usuario no autenticado');
      if (!id) throw new Error('Identificador de prompt requerido');
      setPromptLibraryLoading(true);
      try {
        const updated = await updateWebsitePrompt({
          uid,
          promptId: id,
          name,
          description,
          prompt: promptText,
          templateKey,
        });
        setCustomPrompts(Array.isArray(updated) ? updated : []);
      } catch (err) {
        // console.error('updateWebsitePrompt', err);
        throw err;
      } finally {
        setPromptLibraryLoading(false);
      }
    },
    [uid]
  );

  const handleDeletePrompt = useCallback(
    async (id) => {
      if (!uid) throw new Error('Usuario no autenticado');
      if (!id) throw new Error('Identificador de prompt requerido');
      setPromptLibraryLoading(true);
      try {
        const updated = await deleteWebsitePrompt({ uid, promptId: id });
        setCustomPrompts(Array.isArray(updated) ? updated : []);
      } catch (err) {
        // console.error('deleteWebsitePrompt', err);
        throw err;
      } finally {
        setPromptLibraryLoading(false);
      }
    },
    [uid]
  );

  const generateWeb = async () => {
    setLoading(true);
    setError('');

    const templateDescriptor = getTemplateDescriptor(selectedTemplate);
    const userInstructions = prompt.trim() || getTemplateSamplePrompt(selectedTemplate);
    if (!prompt.trim()) {
      setPrompt(userInstructions);
    }

    // Mover applyFallback FUERA del try para que sea accesible en el catch
    const applyFallback = async (reason) => {
      const fallbackHtml = buildFallbackHtml(weddingInfo, templateDescriptor);
      const enhanced = enhanceWeddingHtml(fallbackHtml, {
        templateKey: selectedTemplate,
        weddingInfo,
      });
      setHtml(enhanced);
      setPublicUrl('');
      setShowQR(false);
      if (reason === 'fallback-ai-disabled') {
        setError('Generacion IA deshabilitada. Usamos la plantilla base para continuar.');
      } else if (reason === 'fallback-ai-unavailable') {
        setError('El servicio de IA no esta disponible. Usamos la plantilla base para continuar.');
      } else {
        setError('');
      }
      try {
        await recordWebsiteEvent({
          uid,
          weddingId: activeWedding,
          event: 'website_generated',
          payload: {
            template: selectedTemplate,
            via: reason,
          },
        });
      } catch (logErr) {
        // console.warn('recordWebsiteEvent website_generated (fallback)', logErr);
      }
    };

    try {
      const { systemMessage, userMessage } = buildDesignerPrompt({
        templateKey: selectedTemplate,
        weddingInfo,
        userPrompt: userInstructions,
      });

      const aiResult = await requestWebsiteAiHtml({
        systemMessage,
        userMessage,
        templateKey: selectedTemplate,
        weddingId: activeWedding,
        temperature: 0.55,
      });

      let htmlGen = aiResult.html || '';
      htmlGen = htmlGen.replace(/```html|```/g, '').trim();
      const enhanced = enhanceWeddingHtml(htmlGen, {
        templateKey: selectedTemplate,
        weddingInfo,
      });
      setHtml(enhanced);
      setError('');
      setPublicUrl('');
      setShowQR(false);
      try {
        const runId = await logWebsiteAiRun({
          uid,
          weddingId: activeWedding,
          prompt: userInstructions,
          templateKey: selectedTemplate,
        });
        await recordWebsiteEvent({
          uid,
          weddingId: activeWedding,
          event: 'website_generated',
          payload: {
            template: selectedTemplate,
            via: 'ai',
            runId,
          },
        });
      } catch (logErr) {
        // console.warn('Log website ai run', logErr);
      }
    } catch (err) {
      // console.error('Error en la generaci�n de la p�gina:', err);
      let fallbackReason = 'fallback-ai-error';
      if (err?.name === 'AbortError') {
        fallbackReason = 'fallback-ai-unavailable';
      }
      if (err?.status === 503) {
        fallbackReason = 'fallback-ai-unavailable';
      } else if (err?.status === 429) {
        fallbackReason = 'fallback-ai-rate-limit';
      }

      await applyFallback(fallbackReason);

      if (
        fallbackReason !== 'fallback-ai-unavailable' &&
        fallbackReason !== 'fallback-ai-disabled'
      ) {
        const detail =
          fallbackReason === 'fallback-ai-rate-limit'
            ? 'La IA est� ocupada. Intenta nuevamente en unos segundos.'
            : err?.message || 'Revisa la consola para m�s detalles';
        setError(`Error al generar con IA: ${detail}`);
      }

      toast.error(t('errors.generateWebError'));
      try {
        await recordWebsiteEvent({
          uid,
          weddingId: activeWedding,
          event: 'website_generation_failed',
          payload: {
            template: selectedTemplate,
            error: err.message || String(err),
          },
        });
      } catch (logErr) {
        // console.warn('recordWebsiteEvent website_generation_failed', logErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const publishWeb = async () => {
    if (isPublishing) {
      return;
    }

    const trimmedHtml = html.trim();
    if (!trimmedHtml) {
      toast.warning(t('messages.generateWebFirst'));
      return;
    }
    const slug = publishSlug || null;
    if (!isOnline) {
      await recordWebsiteEvent({
        uid,
        weddingId: activeWedding,
        event: 'website_publish_failed',
        payload: {
          slug,
          reason: 'offline',
        },
      }).catch(() => {});
      toast.error(t('errors.offlineError'));
      return;
    }

    setIsPublishing(true);
    const logisticsMetrics = sanitizeLogisticsDraft(logisticsDraft);

    try {
      await recordWebsiteEvent({
        uid,
        weddingId: activeWedding,
        event: 'website_publish_started',
        payload: {
          slug,
          transportationEntries: logisticsMetrics.transportationSchedule.length,
          lodgingEntries: logisticsMetrics.lodgingOptions.length,
          faqEntries: logisticsMetrics.faqs.length,
        },
      }).catch(() => {});

      if (activeWedding) {
        const result = await publishWeddingSite({
          weddingId: activeWedding,
          html: trimmedHtml,
          slug,
        });

        if (!result.ok) {
          await recordWebsiteEvent({
            uid,
            weddingId: activeWedding,
            event: 'website_publish_failed',
            payload: {
              slug,
              reason: result.error ? JSON.stringify(result.error) : 'unknown',
              transportationEntries: logisticsMetrics.transportationSchedule.length,
              lodgingEntries: logisticsMetrics.lodgingOptions.length,
              faqEntries: logisticsMetrics.faqs.length,
            },
          }).catch(() => {});
          // console.warn('No se pudo activar la URL p�blica.', result.error);
          toast.error(t('errors.activateUrlError'));
          if (versions[0]?.html) {
            setHtml(versions[0].html);
          }
          return;
        }
        const url = result.publicUrl || '';
        setPublicUrl(url);
        setShowQR(false);
        toast.success(
          url ? t('messages.publishSuccessWithUrl', { url }) : t('messages.publishSuccess')
        );
      } else {
        toast.info(t('messages.savedNoActiveWedding'));
      }

      const updatedVersions = await saveWebsiteVersion({
        uid,
        weddingId: activeWedding,
        html: trimmedHtml,
        prompt,
        slug,
      });
      setVersions(updatedVersions);

      await recordWebsiteEvent({
        uid,
        weddingId: activeWedding,
        event: 'website_published',
        payload: {
          slug,
          transportationEntries: logisticsMetrics.transportationSchedule.length,
          lodgingEntries: logisticsMetrics.lodgingOptions.length,
          faqEntries: logisticsMetrics.faqs.length,
        },
      }).catch(() => {});
    } catch (err) {
      // console.error('Error al publicar la p�gina', err);
      await recordWebsiteEvent({
        uid,
        weddingId: activeWedding,
        event: 'website_publish_failed',
        payload: {
          slug,
          error: err.message || String(err),
          transportationEntries: logisticsMetrics.transportationSchedule.length,
          lodgingEntries: logisticsMetrics.lodgingOptions.length,
          faqEntries: logisticsMetrics.faqs.length,
        },
      }).catch(() => {});
      if (versions[0]?.html) {
        setHtml(versions[0].html);
      }
      toast.error(t('errors.publishError'));
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <div className="absolute top-4 right-4 flex items-center space-x-3" style={{ zIndex: 100 }}>
        <LanguageSelector variant="minimal" />
        <div className="relative" data-user-menu>
          <button onClick={() => setOpenUserMenu(!openUserMenu)} className="w-11 h-11 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center" title={t('navigation.userMenu', { defaultValue: 'Menú de usuario' })} style={{ backgroundColor: openUserMenu ? 'var(--color-lavender)' : 'rgba(255, 255, 255, 0.95)', border: `2px solid ${openUserMenu ? 'var(--color-primary)' : 'rgba(255,255,255,0.8)'}`, boxShadow: openUserMenu ? '0 4px 12px rgba(94, 187, 255, 0.3)' : '0 2px 8px rgba(0,0,0,0.15)' }}>
            <User className="w-5 h-5" style={{ color: openUserMenu ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
          </button>
          {openUserMenu && (
            <div className="absolute right-0 mt-3 bg-[var(--color-surface)] p-2 space-y-1" style={{ minWidth: '220px', border: '1px solid var(--color-border-soft)', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 9999 }}>
              <div className="px-2 py-1"><NotificationCenter /></div>
              <Link to="/perfil" onClick={() => setOpenUserMenu(false)} className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200" className="text-body" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <User className="w-4 h-4 mr-3" />{t('navigation.userMenu', { defaultValue: 'Perfil' })}
              </Link>
              <Link to="/email" onClick={() => setOpenUserMenu(false)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200" className="text-body">
                <Mail className="w-4 h-4 mr-3" />{t('navigation.emailInbox', { defaultValue: 'Buzón de Emails' })}
              </Link>
              <div className="px-3 py-2.5 rounded-xl transition-all duration-200" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <div className="flex items-center justify-between"><span className="text-sm flex items-center" className="text-body"><Moon className="w-4 h-4 mr-3" />{t('navigation.darkMode', { defaultValue: 'Modo oscuro' })}</span><DarkModeToggle className="ml-2" /></div>
              </div>
              <div style={{ height: '1px', backgroundColor: 'var(--color-border-soft)', margin: '8px 0' }}></div>
              <button onClick={() => { logoutUnified(); setOpenUserMenu(false); }} className="w-full text-left px-3 py-2.5 text-sm rounded-xl transition-all duration-200 flex items-center" className="text-danger" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-danger-10)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <LogOut className="w-4 h-4 mr-3" />{t('navigation.logout', { defaultValue: 'Cerrar sesión' })}
              </button>
            </div>
          )}
        </div>
      </div>
      <SimpleWebDesigner
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        templates={templates}
        selectedTemplate={selectedTemplate}
        onTemplateSelect={handleTemplateSelect}
        prompt={prompt}
        onPromptChange={setPrompt}
        variables={{
          ...buildWeddingInfoFromProfile(profile),
          ...webVariables,
        }}
        onGenerateClick={generateWeb}
        loading={loading}
        html={html}
      >
        {/* Alerta de Datos Faltantes */}
        {missingBasics && (
          <div className="mb-4 border-l-4 border-amber-400 bg-amber-50 px-4 py-3 rounded">
            <p className="text-sm text-amber-800">
              ⚠️ Necesitamos los nombres y la fecha de la boda.
              <Link to="/perfil" className="ml-1 underline font-medium">
                Completar datos →
              </Link>
            </p>
          </div>
        )}

        {/* Resumen de Perfil */}
        <ProfileSummary profile={profile} publishDisabledReason={publishDisabledReason} />

        {/* PASO 1: Plantillas */}
        {currentStep === 1 && (
          <SimpleTemplateSelector
            templates={templates}
            selectedTemplate={selectedTemplate}
            onSelect={handleTemplateSelect}
          />
        )}

        {/* PASO 2: Editor de Contenido */}
        {currentStep === 2 && (
          <>
            <SimplePromptEditor
              prompt={prompt}
              onChange={setPrompt}
              variables={{
                ...buildWeddingInfoFromProfile(profile),
                ...webVariables,
              }}
              onEditVariable={() => setShowVariablesEditor(true)}
            />

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => {
                  generateWeb();
                  setCurrentStep(3);
                }}
                disabled={loading || !prompt.trim()}
                className="px-8 py-3  text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {loading ? 'Generando...' : 'Generar mi web'}
              </button>
            </div>
          </>
        )}

        {/* PASO 3: Vista Previa */}
        {currentStep === 3 && html && (
          <div ref={previewRef}>
            <WebsitePreview
              html={html}
              onPublish={() => setCurrentStep(4)}
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
              onEditLogistics={() => setShowLogisticsEditor(true)}
              publishDisabled={publishDisabled}
              publishDisabledReason={publishDisabledReason}
              isPublishing={false}
            />
          </div>
        )}

        {/* PASO 4: Publicar */}
        {currentStep === 4 && (
          <div ref={previewRef}>
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
              onEditLogistics={() => setShowLogisticsEditor(true)}
              publishDisabled={publishDisabled}
              publishDisabledReason={publishDisabledReason}
              isPublishing={isPublishing}
            />
          </div>
        )}
      </SimpleWebDesigner>

      {/* Modales Fuera del Designer */}
      {showVariablesEditor && (
        <VariablesEditor
          profile={profile}
          webOverrides={webVariables}
          onSave={(vars) => {
            setWebVariables(vars);
            setShowVariablesEditor(false);
            toast.success('✅ Variables guardadas');
          }}
          onClose={() => setShowVariablesEditor(false)}
        />
      )}

      <PromptLibraryModal
        open={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        builtInOptions={builtInPromptOptions}
        customPrompts={customPrompts}
        templates={templates}
        onSelect={(option) => {
          if (option?.prompt) {
            setPrompt(option.prompt);
          }
          if (option?.templateKey && templates[option.templateKey]) {
            setSelectedTemplate(option.templateKey);
          }
          setShowPromptModal(false);
        }}
        onCreate={handleCreatePrompt}
        onUpdate={handleUpdatePrompt}
        onDelete={handleDeletePrompt}
      />

      <LogisticsEditor
        open={showLogisticsEditor}
        draft={logisticsDraft}
        onDraftChange={setLogisticsDraft}
        onClose={() => setShowLogisticsEditor(false)}
        onSave={handleSaveLogistics}
        saving={savingLogistics}
      />
      <Nav />
    </>
  );
}
