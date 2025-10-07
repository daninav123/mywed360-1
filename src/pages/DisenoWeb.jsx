import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import React, { useState, useEffect } from 'react';

import { useWedding } from '../context/WeddingContext';
import { useAuth } from '../hooks/useAuth';
import { db, firebaseReady } from '../lib/firebase';
import { post as apiPost, get as apiGet } from '../services/apiClient';

export default function DisenoWeb() {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid || 'dev';
  const { activeWedding } = useWedding();
  const [prompt, setPrompt] = useState('');
  const [html, setHtml] = useState('');
  const [profile, setProfile] = useState(null);
  const [versions, setVersions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('personalizada');
  const [publishSlug, setPublishSlug] = useState('');
  const [slugSuggestions, setSlugSuggestions] = useState([]);
  const [publicUrl, setPublicUrl] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState(null); // true | false | null
  const [slugError, setSlugError] = useState('');

  // Plantillas predefinidas
  const templates = {
    personalizada: {
      name: 'Personalizada',
      desc: 'Crea una página web totalmente personalizada según tus indicaciones',
      prompt: '',
    },
    clasica: {
      name: 'Clásica',
      desc: 'Diseño elegante con tonos dorados y blancos, ideal para bodas tradicionales',
      prompt:
        'Diseño clásico con tonos dorados y blancos. Usa tipografía elegante serif y elementos decorativos clásicos. Enfoque en elegancia tradicional.',
    },
    moderna: {
      name: 'Moderna',
      desc: 'Estilo minimalista con colores neutros y diseño limpio',
      prompt:
        'Diseño moderno minimalista con colores neutros. Usa tipografía sans-serif limpia, mucho espacio en blanco y animaciones sutiles. Enfoque en elegancia contemporánea.',
    },
    rustica: {
      name: 'Rústica',
      desc: 'Inspirada en bodas campestres con elementos naturales y paleta de colores tierra',
      prompt:
        'Diseño rústico campestre con elementos de madera y naturales. Usa colores tierra, verde y detalles florales. Aspecto cálido y acogedor tipo boda en el campo.',
    },
    playa: {
      name: 'Playa',
      desc: 'Perfecta para bodas en la costa con tonos azules y turquesa',
      prompt:
        'Diseño temática de playa con tonos azules, turquesa y arena. Incluye elementos marinos sutiles, olas y textura de arena. Sensación fresca y relajada de boda costera.',
    },
  };

  // Mejora de prompts de plantillas para orientar mejor el diseno sin cambiar API
  try {
    templates.personalizada.desc = 'Crea una pagina web totalmente personalizada segun tus indicaciones';
    if (templates.clasica) {
      templates.clasica.name = 'Clasica';
      templates.clasica.desc = 'Elegante con dorados y marfil, ideal para bodas tradicionales';
      templates.clasica.prompt = [
        'Estilo clasico y elegante con dorado y marfil.',
        "Usa Google Fonts: 'Playfair Display' (titulos) y 'Inter' (texto).",
        'Paleta: primary #C5A572, secondary #FAF8F2, text #2A2A2A, bg #FFFFFF.',
        'Separadores ornamentales sutiles, bordes suaves y sombras ligeras.',
        'Hero con nombres grandes, fecha y un sutil degradado dorado.',
      ].join(' ');
    }
    if (templates.moderna) {
      templates.moderna.desc = 'Minimalista, limpia y contemporanea, con tipografias sans-serif';
      templates.moderna.prompt = [
        'Estilo moderno minimalista con mucho espacio en blanco.',
        "Usa Google Fonts: 'Poppins' (titulos) y 'Inter' (texto).",
        'Paleta: primary #6C63FF, secondary #F5E7EC, text #111111, bg #FFFFFF.',
        'Componentes con bordes redondeados, sombras suaves y microinteracciones.',
        'Anade contador regresivo si hay fecha y botones claros para RSVP.',
      ].join(' ');
    }
    if (templates.rustica) {
      templates.rustica.name = 'Rustica';
      templates.rustica.desc = 'Campestre con tonos tierra, madera y acentos verdes';
      templates.rustica.prompt = [
        'Estilo rustico/campestre con acentos de madera y naturaleza.',
        "Usa Google Fonts: 'Merriweather' (titulos) y 'Lato' (texto).",
        'Paleta: primary #8B6A3B, secondary #B9C4A7, text #2A2A2A, bg #FAF7F1.',
        'Ornamentos de hojas/ramas en SVG sutiles y texturas ligeras.',
      ].join(' ');
    }
    if (templates.playa) {
      templates.playa.desc = 'Costera, fresca y luminosa con azules y arena';
      templates.playa.prompt = [
        'Estilo costero con sensacion fresca y luminosa.',
        "Usa Google Fonts: 'Quicksand' (titulos) y 'Inter' (texto).",
        'Paleta: primary #2EC4B6, secondary #F4EBD0, text #123A49, bg #FFFFFF.',
        'Incorpora ondas en SVG, degradados de azul y botones redondeados.',
      ].join(' ');
    }
  } catch (e) {
    console.warn('No se pudo enriquecer templates', e);
  }

  // Plantilla romantica/floral adicional
  try {
    if (!templates.romantica) {
      templates.romantica = {
        name: 'Romantica',
        desc: 'Floral, romantica y elegante (mas flores y detalles)',
        prompt: [
          'Estilo romantico y floral con detalles elegantes.',
          "Usa Google Fonts: 'Great Vibes' (nombres), 'Playfair Display' (titulos) y 'Inter' (texto).",
          'Paleta sugerida: primary #C5A572, secondary #FAF7F1, text #2A2A2A, bg #FFFFFF.',
          'Incluye separadores ornamentales, esquinas florales en SVG y sombras suaves.',
        ].join(' '),
      };
    }
  } catch (e) {
    console.warn('No se pudo anadir plantilla romantica', e);
  }

  // Cargar datos de perfil (usuario + boda activa) y versiones
  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        // Asegurar Firebase listo (defensivo)
        try {
          await firebaseReady;
        } catch {}

        // 1) Cargar datos del usuario (contacto, preferencias)
        let userData = {};
        try {
          const userSnap = await getDoc(doc(db, 'users', uid));
          if (userSnap.exists()) userData = userSnap.data() || {};
        } catch (e) {
          console.warn('No se pudo cargar users/{uid}', e);
        }

        // 2) Cargar datos de la boda activa (weddingInfo guardado desde Perfil.jsx)
        let weddingInfo = {};
        if (activeWedding) {
          try {
            const wedSnap = await getDoc(doc(db, 'weddings', activeWedding));
            if (wedSnap.exists()) {
              const d = wedSnap.data() || {};
              if (d.weddingInfo) weddingInfo = d.weddingInfo || {};
            }
          } catch (e) {
            console.warn('No se pudo cargar weddings/{activeWedding}', e);
          }
        }

        // 3) Normalizar en un
        //    objeto con la forma esperada por el generador y los slugs
        const normalize = (userDoc = {}, wi = {}) => {
          // Separar nombres si vienen juntos ("Ana y Luis")
          const couple = String(wi.coupleName || '').trim();
          let brideName = '';
          let groomName = '';
          if (couple) {
            const parts = couple.split(/\s+y\s+|\s*&\s*|\s*\/\s*|\s*-\s*|,\s*/i).filter(Boolean);
            if (parts.length >= 2) {
              [brideName, groomName] = [parts[0], parts[1]];
            } else {
              brideName = couple;
              groomName = '';
            }
          }

          // Horarios: en Perfil.jsx hay un único "schedule"; lo usamos en ambos como fallback
          const schedule = wi.schedule || '';

          // Contacto del usuario
          const contactEmail = userDoc?.account?.email || userDoc?.email || '';
          const contactPhone = userDoc?.account?.whatsNumber || userDoc?.phone || '';

          // Estilo si existiera en el doc (defensivo)
          const weddingStyle = wi.weddingStyle || userDoc?.weddingStyle || 'Clásico';
          const colorScheme = wi.colorScheme || userDoc?.colorScheme || 'Blanco y dorado';
          const additionalInfo = [wi.importantInfo, wi.giftAccount].filter(Boolean).join(' | ');

          return {
            brideInfo: { nombre: brideName },
            groomInfo: { nombre: groomName },
            ceremonyInfo: {
              fecha: wi.weddingDate || '',
              hora: schedule || '',
              lugar: wi.celebrationPlace || '',
              direccion: wi.celebrationAddress || '',
            },
            receptionInfo: {
              hora: schedule || '',
              lugar: wi.banquetPlace || '',
              direccion: wi.receptionAddress || '',
            },
            transportationInfo: { detalles: wi.transportation || '' },
            rsvpInfo: { fecha: wi.rsvpDeadline || '' },
            contactEmail,
            contactPhone,
            weddingStyle,
            colorScheme,
            additionalInfo,
          };
        };

        const normalized = normalize(userData, weddingInfo);
        setProfile(normalized);

        // 4) Cargar versiones históricas (usuario + boda)
        const colSnapUser = await getDocs(collection(db, 'users', uid, 'generatedPages'));
        let items = colSnapUser.docs.map((d) => ({ id: d.id, scope: 'user', ...d.data() }));
        if (activeWedding) {
          try {
            const colSnapWed = await getDocs(
              collection(db, 'weddings', activeWedding, 'generatedPages')
            );
            items = items.concat(
              colSnapWed.docs.map((d) => ({ id: d.id, scope: 'wedding', ...d.data() }))
            );
          } catch (e) {
            console.warn('No se pudieron cargar versiones por boda', e);
          }
        }
        items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setVersions(items);
      } catch (e) {
        console.error('Error cargando datos de diseño web', e);
      }
    })();
  }, [uid, activeWedding]);

  // Construir sugerencias de slug a partir del perfil
  useEffect(() => {
    function toSlug(s) {
      return String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    function firstWord(s) {
      return (
        String(s || '')
          .trim()
          .split(/\s+/)[0] || ''
      );
    }
    function yyyymmdd(d) {
      try {
        const dt = new Date(d);
        return `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}`;
      } catch {
        return '';
      }
    }
    try {
      const bFull = profile?.brideInfo?.nombre || profile?.brideName || profile?.bride || '';
      const gFull = profile?.groomInfo?.nombre || profile?.groomName || profile?.groom || '';
      const b = firstWord(bFull);
      const g = firstWord(gFull);
      const date = profile?.ceremonyInfo?.fecha || profile?.date;
      const d = yyyymmdd(date || Date.now());
      const year = (d || '').slice(0, 4);
      const s1 = [toSlug(b), toSlug(g), d].filter(Boolean).join('-'); // novia-novio-fecha
      const s2 = [toSlug(g), toSlug(b), d].filter(Boolean).join('-'); // novio-novia-fecha
      const s3 = [toSlug(b), toSlug(g)].filter(Boolean).join('-'); // sin fecha
      const s4 = [toSlug(g), toSlug(b)].filter(Boolean).join('-'); // sin fecha invertido
      const bi = (b || '').slice(0, 1),
        gi = (g || '').slice(0, 1);
      const s5 = [toSlug(`${bi}${gi}`), d].filter(Boolean).join('-'); // iniciales+fecha
      const s6 = [toSlug(`${bi}${gi}`), year].filter(Boolean).join('-'); // iniciales+año
      const list = Array.from(new Set([s1, s2, s3, s4, s5, s6].filter(Boolean)));
      setSlugSuggestions(list);
      if (!publishSlug && list.length) setPublishSlug(list[0]);
    } catch {}
  }, [profile]);

  // Validación + disponibilidad del slug (en vivo)
  useEffect(() => {
    const reserved = new Set(['www', 'api', 'mg', 'mail', 'cdn', 'static', 'assets', 'admin']);
    const valid = (s) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(s);
    let timer;
    setSlugError('');
    setSlugAvailable(null);
    if (!publishSlug) return;
    if (!valid(publishSlug)) {
      setSlugError('Slug inválido');
      return;
    }
    if (reserved.has(publishSlug)) {
      setSlugError('Slug reservado');
      return;
    }
    setCheckingSlug(true);
    timer = setTimeout(async () => {
      try {
        const res = await apiGet(`/api/public/weddings/${encodeURIComponent(publishSlug)}`);
        if (res.status === 404) {
          // puede ser not-found (libre) o expired
          try {
            const data = await res.json();
            if (data?.error === 'expired') {
              setSlugAvailable(false); // ocupado (expirado pero utilizado)
            } else {
              setSlugAvailable(true);
            }
          } catch {
            setSlugAvailable(true);
          }
        } else if (res.status === 403 || res.ok) {
          setSlugAvailable(false);
        } else {
          setSlugAvailable(null);
        }
      } catch {
        setSlugAvailable(null);
      } finally {
        setCheckingSlug(false);
      }
    }, 400);
    return () => timer && clearTimeout(timer);
  }, [publishSlug]);

  const generateWeb = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    // Llamar a OpenAI para generar la web (solo directo si está habilitado)
    try {
      const allowDirect =
        import.meta.env.VITE_ENABLE_DIRECT_OPENAI === 'true' || import.meta.env.DEV;
      if (!allowDirect) {
        setError('OpenAI directo deshabilitado. Usa el backend /api/ai en su lugar.');
        setLoading(false);
        return;
      }
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        // Fallback: generar una web básica con los datos del perfil sin IA
        const safe = (v) => (v || '').toString();
        const b = safe(weddingInfo.bride);
        const g = safe(weddingInfo.groom);
        const names = [b, g].filter(Boolean).join(' y ');
        const palette = safe(weddingInfo.colorScheme) || 'Blanco y dorado';
        const styleTitle = safe(weddingInfo.weddingStyle) || 'Clásico';
        const ceremony = [safe(weddingInfo.ceremonyLocation), safe(weddingInfo.ceremonyTime)]
          .filter(Boolean)
          .join(' · ');
        const reception = [safe(weddingInfo.receptionVenue), safe(weddingInfo.receptionTime)]
          .filter(Boolean)
          .join(' · ');
        const date = safe(weddingInfo.date);
        const extra = safe(weddingInfo.additionalInfo);
        const contact = [safe(weddingInfo.contactEmail), safe(weddingInfo.contactPhone)]
          .filter(Boolean)
          .join(' · ');
        let demo = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${names ? `${names} · Web de boda` : 'Nuestra boda'}</title>
    <style>
      :root{ --primary:#b5812d; --text:#222; --muted:#666 }
      *{box-sizing:border-box}
      body{font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin:0; color:var(--text); background:#fff}
      header{padding:48px 16px; text-align:center; border-bottom:1px solid #eee}
      h1{margin:0; font-size: clamp(28px, 5vw, 44px)}
      h2{margin:0 0 8px; font-size: 20px}
      .subtitle{color:var(--muted); margin-top:8px}
      .container{max-width:920px; margin:0 auto; padding:24px 16px}
      .grid{display:grid; grid-template-columns: 1fr; gap:16px}
      @media(min-width:768px){ .grid{ grid-template-columns: 1fr 1fr } }
      .card{border:1px solid #eee; border-radius:12px; padding:16px}
      .pill{display:inline-block; padding:4px 10px; border-radius:999px; background:#faf5ee; color:#8a5b20; font-size:12px}
      .highlight{color: var(--primary)}
      footer{border-top:1px solid #eee; text-align:center; padding:24px; color:var(--muted); font-size:14px}
    </style>
  </head>
  <body>
    <header>
      <div class="pill">Estilo: ${styleTitle} · Paleta: ${palette}</div>
      <h1>${names || 'Nuestra boda'}</h1>
      ${date ? `<div class="subtitle">${date}</div>` : ''}
    </header>
    <main class="container">
      <section class="grid">
        <div class="card">
          <h2>La ceremonia</h2>
          <div>${ceremony || 'Pronto más detalles'}</div>
          ${weddingInfo.ceremonyAddress ? `<div class="subtitle">${safe(weddingInfo.ceremonyAddress)}</div>` : ''}
        </div>
        <div class="card">
          <h2>La recepción</h2>
          <div>${reception || 'Pronto más detalles'}</div>
          ${weddingInfo.receptionAddress ? `<div class="subtitle">${safe(weddingInfo.receptionAddress)}</div>` : ''}
        </div>
      </section>
      <section class="grid">
        <div class="card">
          <h2>Transporte y alojamiento</h2>
          <div>${safe(weddingInfo.transportation) || 'Pronto más detalles'}</div>
        </div>
        <div class="card">
          <h2>Regalos y notas</h2>
          <div>${extra || '¡Vuestra presencia es el mejor regalo!'}</div>
        </div>
      </section>
      <section class="card" style="margin-top:16px">
        <h2>Contacto</h2>
        <div>${contact || '—'}</div>
      </section>
    </main>
    <footer>
      <span class="highlight">Gracias</span> por acompañarnos en este día.
    </footer>
  </body>
</html>`;
        // Versión mejorada con más detalles florales y estilos
        const demoEnhanced = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${names ? `${names} - Web de boda` : 'Nuestra boda'}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
      :root{ --primary:#c5a572; --secondary:#faf7f1; --text:#222; --bg:#ffffff; --muted:#666 }
      *{box-sizing:border-box}
      body{margin:0; color:var(--text); background:var(--bg); font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif}
      .container{max-width:1040px; margin:0 auto; padding:24px 16px}
      .btn{display:inline-flex; align-items:center; gap:8px; padding:10px 16px; border-radius:999px; background:var(--primary); color:#fff; text-decoration:none; border:none; cursor:pointer; box-shadow:0 6px 18px rgba(0,0,0,.08)}
      .btn:hover{filter:brightness(0.95)}
      header.hero{position:relative; padding:80px 16px 56px; text-align:center; overflow:hidden; background:linear-gradient(140deg, rgba(197,165,114,0.15), rgba(255,255,255,0))}
      header.hero:before{content:""; position:absolute; inset:-120px -60px auto auto; width:360px; height:360px; background:radial-gradient(circle at 30% 30%, rgba(197,165,114,.25), transparent 60%); transform:rotate(18deg)}
      header.hero .names{font-family:"Great Vibes", cursive; font-size: clamp(40px, 8vw, 72px); margin:0; color:#1f2937}
      header.hero .subtitle{margin-top:6px; color:#6b7280}
      .pill{display:inline-block; padding:6px 12px; border-radius:999px; background:#faf5ee; color:#8a5b20; font-size:12px; border:1px solid rgba(197,165,114,.35)}
      .grid{display:grid; grid-template-columns:1fr; gap:18px}
      @media(min-width:820px){ .grid{ grid-template-columns: 1fr 1fr } }
      .card{border:1px solid #eee; border-radius:16px; padding:18px 16px; background:#fff; box-shadow:0 8px 28px rgba(0,0,0,.05)}
      h2{font-family:"Playfair Display", serif; font-weight:600; font-size: clamp(20px, 2.6vw, 28px); margin:0 0 8px}
      .section-title{display:flex; align-items:center; justify-content:center; gap:12px; margin:28px 0 18px; color:#374151}
      .sep{width:72px; height:14px; color:var(--primary)}
      .sep path{stroke:currentColor; stroke-width:1.2; fill:none}
      .gallery{display:grid; grid-template-columns:repeat(3,1fr); gap:8px}
      .gallery div{background:#f5f5f4; border-radius:12px; padding-top:70%; position:relative; overflow:hidden}
      .gallery div:after{content:"Foto"; position:absolute; inset:auto 0 8px 8px; font-size:12px; color:#666}
      footer{border-top:1px solid #eee; text-align:center; padding:28px; color:#6b7280; font-size:14px}
      .ornament{position:absolute; opacity:.18; filter:blur(.2px)}
      .ornament.top-left{top:-24px; left:-24px; transform:rotate(-12deg)}
      .ornament.bottom-right{bottom:-24px; right:-24px; transform:rotate(8deg)}
    </style>
  </head>
  <body>
    <header class="hero">
      <div class="pill">Estilo: ${styleTitle} - Paleta: ${palette}</div>
      <h1 class="names">${names || 'Nuestra boda'}</h1>
      ${date ? '<div class="subtitle">' + date + '</div>' : ''}
      <svg class="ornament top-left" width="200" height="160" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
        <g stroke="currentColor" fill="none" opacity="0.9">
          <path d="M10,120 C40,60 90,40 140,70" />
          <path d="M20,130 C50,70 100,50 150,80" />
          <circle cx="70" cy="70" r="10" />
          <circle cx="110" cy="90" r="6" />
        </g>
      </svg>
      <svg class="ornament bottom-right" width="220" height="180" viewBox="0 0 220 180" xmlns="http://www.w3.org/2000/svg">
        <g stroke="currentColor" fill="none" opacity="0.9">
          <path d="M80,20 C120,60 160,80 190,120" />
          <path d="M60,40 C100,80 140,100 170,140" />
          <circle cx="140" cy="60" r="10" />
          <circle cx="170" cy="90" r="7" />
        </g>
      </svg>
    </header>
    <main class="container">
      <section class="grid">
        <div class="card">
          <h2>La ceremonia</h2>
          <div>${ceremony || 'Pronto mas detalles'}</div>
          ${weddingInfo.ceremonyAddress ? '<div class="subtitle">' + weddingInfo.ceremonyAddress + '</div>' : ''}
        </div>
        <div class="card">
          <h2>La recepcion</h2>
          <div>${reception || 'Pronto mas detalles'}</div>
          ${weddingInfo.receptionAddress ? '<div class="subtitle">' + weddingInfo.receptionAddress + '</div>' : ''}
        </div>
      </section>
      <div class="section-title">
        <svg class="sep" viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M2,10 C20,2 40,18 50,10 C60,2 80,18 98,10" />
        </svg>
        <span style="font-family:Playfair Display,serif;font-weight:600">Nuestra historia</span>
        <svg class="sep" viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M2,10 C20,2 40,18 50,10 C60,2 80,18 98,10" />
        </svg>
      </div>
      <section class="card">
        <p>Nos conocimos, viajamos y hoy celebramos con familia y amigos. Aqui ira tu historia.</p>
      </section>
      <div class="section-title">
        <svg class="sep" viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M2,10 C20,2 40,18 50,10 C60,2 80,18 98,10" />
        </svg>
        <span style="font-family:Playfair Display,serif;font-weight:600">Galeria</span>
        <svg class="sep" viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M2,10 C20,2 40,18 50,10 C60,2 80,18 98,10" />
        </svg>
      </div>
      <section class="card">
        <div class="gallery">
          <div></div><div></div><div></div>
          <div></div><div></div><div></div>
        </div>
      </section>
      <section class="card" style="margin-top:16px">
        <h2>Contacto</h2>
        <div>${contact || ''}</div>
      </section>
    </main>
    <footer>
      <span style="color:var(--primary);font-weight:600">Gracias</span> por acompanarnos en este dia.
    </footer>
    <script>
      (function(){
        var dateStr = '${date}';
        if(!dateStr) return;
        try {
          var target = new Date(dateStr).getTime();
          var el = document.createElement("div");
          el.style.margin = "16px auto";
          el.style.textAlign = "center";
          el.style.color = "#6b7280";
          el.style.fontSize = "14px";
          document.querySelector(".container").prepend(el);
          function pad(n){ return (n<10?"0":"")+n }
          function tick(){
            var now = Date.now();
            var diff = Math.max(0, target - now);
            var d = Math.floor(diff/86400000);
            var h = Math.floor(diff%86400000/3600000);
            var m = Math.floor(diff%3600000/60000);
            el.textContent = "Faltan " + d + " dias, " + pad(h) + " h, " + pad(m) + " min";
          }
          tick(); setInterval(tick, 60000);
        } catch(e){}
      })();
    </script>
  </body>
</html>`;
        demo = demoEnhanced;
        setHtml(demo);
        return;
      }

      // Extraer datos relevantes del perfil
      const {
        brideInfo = {},
        groomInfo = {},
        ceremonyInfo = {},
        receptionInfo = {},
        transportationInfo = {},
        rsvpInfo = {},
      } = profile || {};

      // Preparar información estructurada para la IA
      const weddingInfo = {
        bride: brideInfo.nombre || 'Nombre de la novia',
        groom: groomInfo.nombre || 'Nombre del novio',
        date: ceremonyInfo.fecha || 'Fecha por determinar',
        ceremonyTime: ceremonyInfo.hora || 'Hora por determinar',
        ceremonyLocation: ceremonyInfo.lugar || 'Lugar por determinar',
        ceremonyAddress: ceremonyInfo.direccion || '',
        receptionVenue: receptionInfo.lugar || 'Lugar por determinar',
        receptionAddress: receptionInfo.direccion || '',
        receptionTime: receptionInfo.hora || 'Hora por determinar',
        transportation: transportationInfo.detalles || '',
        rsvpDeadline: rsvpInfo.fecha || '',
        contactPhone: profile?.contactPhone || '',
        contactEmail: profile?.contactEmail || '',
        weddingStyle: profile?.weddingStyle || 'Clásico',
        colorScheme: profile?.colorScheme || 'Blanco y dorado',
        additionalInfo: profile?.additionalInfo || '',
      };

      // Derivar sugerencias de tema (paleta y tipografias) a partir del perfil/plantilla
      const toLower = (s) => String(s || '').toLowerCase();
      const styleL = toLower(weddingInfo.weddingStyle);
      const schemeL = toLower(weddingInfo.colorScheme);
      const pick = (obj, keys) => keys.map((k) => obj[k]).filter(Boolean)[0];

      const colorLex = {
        dorado: '#C5A572', oro: '#C5A572', 'oro rosado': '#E5C1CD',
        marfil: '#FAF8F2', crema: '#FAF7F1', beige: '#E9DCC9', arena: '#F4EBD0',
        blanco: '#FFFFFF', negro: '#111111', gris: '#6B7280',
        azul: '#2B6CB0', 'azul marino': '#1F2937', turquesa: '#2EC4B6', cielo: '#BEE3F8',
        verde: '#2E7D32', salvia: '#B9C4A7', rosa: '#EFB8C8', lavanda: '#B497BD', violeta: '#6C63FF',
        burdeos: '#7D2E46', vino: '#7D2E46', coral: '#FF7F50', melocoton: '#FAD1AF',
      };

      const presetByTemplate = {
        clasica: { fonts: ["Playfair Display", 'Inter'], palette: { primary: '#C5A572', secondary: '#FAF8F2', text: '#2A2A2A', bg: '#FFFFFF' } },
        moderna: { fonts: ['Poppins', 'Inter'], palette: { primary: '#6C63FF', secondary: '#F5E7EC', text: '#111111', bg: '#FFFFFF' } },
        rustica: { fonts: ['Merriweather', 'Lato'], palette: { primary: '#8B6A3B', secondary: '#B9C4A7', text: '#2A2A2A', bg: '#FAF7F1' } },
        playa: { fonts: ['Quicksand', 'Inter'], palette: { primary: '#2EC4B6', secondary: '#F4EBD0', text: '#123A49', bg: '#FFFFFF' } },
        personalizada: { fonts: ['Cormorant Garamond', 'Inter'], palette: { primary: '#b5812d', secondary: '#F5F5F4', text: '#222222', bg: '#FFFFFF' } },
      };

      const colorWords = Object.keys(colorLex).filter((w) => schemeL.includes(w));
      const inferred = {
        primary: pick(colorLex, [colorWords[0]]) || undefined,
        secondary: pick(colorLex, [colorWords[1]]) || undefined,
      };
      const templateKey = selectedTemplate || 'personalizada';
      const baseTheme = presetByTemplate[templateKey] || presetByTemplate.personalizada;
      const wantsFloral = (templateKey !== 'moderna') || styleL.includes('roman') || schemeL.includes('rosa') || schemeL.includes('flor');
      const themeHints = {
        fonts: baseTheme.fonts,
        palette: {
          primary: inferred.primary || baseTheme.palette.primary,
          secondary: inferred.secondary || baseTheme.palette.secondary,
          text: baseTheme.palette.text,
          bg: baseTheme.palette.bg,
        },
        aesthetic: templateKey,
        notes: 'Usar variables CSS --primary, --secondary, --text, --bg y tamanos fluidos. Contraste AA.' + (wantsFloral ? ' Incluir motivos florales sutiles (ornamentos, marcos, separadores) y patrones SVG.' : ' Estilo limpio; adornos discretos si se usan.')
      };

      // Instrucciones detalladas para el sistema
      const sys = `Eres un experto diseñador web especializado en páginas de bodas. 
      Debes crear un sitio web completo y funcional para una boda con diseño moderno, responsive y elegante.
      El sitio debe incluir las siguientes secciones, adaptándolas según la información disponible:
      - Inicio con nombres, fecha y cuenta regresiva
      - Historia de la pareja
      - Información de ceremonia y recepción
      - Galería de fotos (con marcadores para fotos)
      - Detalles de transporte y alojamiento
      - RSVP (si aplica)
      - Regalos/Lista de bodas
      - Contacto
      
      Usa un diseño moderno, tipografía elegante y estética acorde al estilo de boda indicado.
      Debes devolver ÚNICAMENTE código HTML completo con CSS embebido en el <head> y código JavaScript si es necesario.
      NO incluyas comentarios explicativos fuera del código.`;

      // Preparar mensaje para la IA incluyendo datos estructurados
      const userMessage = `
      Crea un sitio web completo para esta boda con los siguientes datos:
      
      DATOS DE LA BODA:
      - Novia: ${weddingInfo.bride}
      - Novio: ${weddingInfo.groom}
      - Fecha: ${weddingInfo.date}
      - Ceremonia: ${weddingInfo.ceremonyTime} en ${weddingInfo.ceremonyLocation}
      - Dirección ceremonia: ${weddingInfo.ceremonyAddress}
      - Recepción: ${weddingInfo.receptionTime} en ${weddingInfo.receptionVenue}
      - Dirección recepción: ${weddingInfo.receptionAddress}
      - Transporte: ${weddingInfo.transportation}
      - Fecha límite RSVP: ${weddingInfo.rsvpDeadline}
      - Teléfono de contacto: ${weddingInfo.contactPhone}
      - Email de contacto: ${weddingInfo.contactEmail}
      - Estilo de boda: ${weddingInfo.weddingStyle}
      - Paleta de colores: ${weddingInfo.colorScheme}
      - Información adicional: ${weddingInfo.additionalInfo}
      
      REQUISITOS ESPECÍFICOS DEL USUARIO:
      ${prompt}
      `;

      // Solicitud a la API
      // Verificar que exista la clave de OpenAI
      const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;
      if (!OPENAI_KEY) {
        alert('Configura la variable de entorno VITE_OPENAI_API_KEY con tu clave de OpenAI.');
        setError('Falta clave OpenAI – define VITE_OPENAI_API_KEY en tu .env');
        setLoading(false);
        return;
      }

      console.log('DEBUG OpenAI_KEY length:', OPENAI_KEY?.length || 'undefined');
      const modelName = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o';

      // Mensaje de sistema minimo: todo el diseno viene del prompt del usuario
      const sys2 = `Devuelve unicamente un documento HTML completo (head+style+body) segun las instrucciones del usuario. No anadas texto fuera del codigo.`;

      const userMessage2 = `
      Crea un sitio web completo para esta boda con los siguientes datos.
      
      DATOS DE LA BODA:
      - Novia: ${weddingInfo.bride}
      - Novio: ${weddingInfo.groom}
      - Fecha: ${weddingInfo.date}
      - Ceremonia: ${weddingInfo.ceremonyTime} en ${weddingInfo.ceremonyLocation}
      - Direccion ceremonia: ${weddingInfo.ceremonyAddress}
      - Recepcion: ${weddingInfo.receptionTime} en ${weddingInfo.receptionVenue}
      - Direccion recepcion: ${weddingInfo.receptionAddress}
      - Transporte: ${weddingInfo.transportation}
      - Fecha limite RSVP: ${weddingInfo.rsvpDeadline}
      - Telefono de contacto: ${weddingInfo.contactPhone}
      - Email de contacto: ${weddingInfo.contactEmail}
      - Estilo de boda: ${weddingInfo.weddingStyle}
      - Paleta de colores (texto): ${weddingInfo.colorScheme}
      - Informacion adicional: ${weddingInfo.additionalInfo}
      
      REQUISITOS ESPECIFICOS DEL USUARIO (todo el diseno y estilo lo define este prompt):
      ${prompt}
      `;

      const messages = [
        { role: 'system', content: sys2 },
        { role: 'user', content: userMessage2 },
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_KEY}`,
          'OpenAI-Project': import.meta.env.VITE_OPENAI_PROJECT_ID,
        },
        body: JSON.stringify({
          model: modelName, // Modelo configurable vía VITE_OPENAI_MODEL
          messages,
          temperature: 0.7,
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
      // Quitar posibles fences ```html
      htmlGen = htmlGen.replace(/```html|```/g, '').trim();
      setHtml(htmlGen);
    } catch (err) {
      console.error('Error en la generación de la página:', err);
      setError(`Error al generar con IA: ${err.message || 'Revisa la consola para más detalles'}`);
      alert('Ha ocurrido un error al generar la página web. Por favor, inténtalo de nuevo.');
    }

    setLoading(false);
  };

  const publishWeb = async () => {
    if (!html.trim()) {
      alert('Genera la web primero');
      return;
    }
    try {
      // Guardado legacy por usuario
      await setDoc(doc(db, 'users', uid), { generatedHtml: html }, { merge: true });
      await addDoc(collection(db, 'users', uid, 'generatedPages'), {
        html,
        createdAt: serverTimestamp(),
        prompt,
        slug: publishSlug || null,
      });
      // Guardado por boda si hay activeWedding
      if (activeWedding) {
        try {
          await addDoc(collection(db, 'weddings', activeWedding, 'generatedPages'), {
            html,
            createdAt: serverTimestamp(),
            prompt,
            slug: publishSlug || null,
            author: uid,
          });
        } catch (e) {
          console.warn('No se pudo guardar versión por boda', e);
        }
      }
      // Publicación por boda (si hay boda activa)
      if (activeWedding) {
        try {
          const res = await apiPost(
            `/api/public/weddings/${encodeURIComponent(activeWedding)}/publish`,
            { html, slug: publishSlug || undefined },
            { auth: true }
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.publicPath) {
              const url = data?.publicUrl || window.location.origin + data.publicPath;
              setPublicUrl(url);
              alert(`¡Página publicada! URL pública: ${url}`);
            } else {
              alert('¡Página publicada!');
            }
          } else {
            const err = await res.json().catch(() => ({}));
            console.warn('Fallo publicando página pública de boda', err);
            alert('Página guardada. No se pudo activar la URL pública.');
          }
        } catch (e) {
          console.warn('Error publicando pública', e);
          alert('Página guardada. No se pudo activar la URL pública.');
        }
      } else {
        alert('Página guardada. No hay boda activa para publicar públicamente.');
      }
      // recargar versiones (usuario + boda)
      const colSnapUser = await getDocs(collection(db, 'users', uid, 'generatedPages'));
      let items = colSnapUser.docs.map((d) => ({ id: d.id, scope: 'user', ...d.data() }));
      if (activeWedding) {
        try {
          const colSnapWed = await getDocs(
            collection(db, 'weddings', activeWedding, 'generatedPages')
          );
          items = items.concat(
            colSnapWed.docs.map((d) => ({ id: d.id, scope: 'wedding', ...d.data() }))
          );
        } catch (e) {
          console.warn('No se pudieron recargar versiones por boda', e);
        }
      }
      items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setVersions(items);
    } catch (e) {
      console.error(e);
      alert('Error al publicar');
    }
  };

  const handleTemplateSelect = (templateKey) => {
    setSelectedTemplate(templateKey);
    if (templateKey !== 'personalizada') {
      // Si selecciona una plantilla predefinida, usar su prompt como base
      setPrompt(templates[templateKey].prompt);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Diseño Web de Boda</h1>

      {/* Resumen de datos detectados del perfil/boda */}
      {profile && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-3">Datos del perfil aplicados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
            {(() => {
              const bride = profile?.brideInfo?.nombre?.trim();
              const groom = profile?.groomInfo?.nombre?.trim();
              const couple = [bride, groom].filter(Boolean).join(' y ');
              return couple ? (
                <div>
                  <span className="text-gray-500">Pareja: </span>
                  {couple}
                </div>
              ) : null;
            })()}
            {profile?.ceremonyInfo?.fecha && (
              <div>
                <span className="text-gray-500">Fecha: </span>
                {profile.ceremonyInfo.fecha}
              </div>
            )}
            {(profile?.ceremonyInfo?.lugar || profile?.ceremonyInfo?.hora) && (
              <div>
                <span className="text-gray-500">Ceremonia: </span>
                {[profile?.ceremonyInfo?.lugar, profile?.ceremonyInfo?.hora]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            )}
            {(profile?.receptionInfo?.lugar || profile?.receptionInfo?.hora) && (
              <div>
                <span className="text-gray-500">Recepción: </span>
                {[profile?.receptionInfo?.lugar, profile?.receptionInfo?.hora]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            )}
            {(profile?.contactEmail || profile?.contactPhone) && (
              <div className="sm:col-span-2">
                <span className="text-gray-500">Contacto: </span>
                {[profile?.contactEmail, profile?.contactPhone].filter(Boolean).join(' · ')}
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
      )}

      {/* Selección de plantillas */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Selecciona un estilo para tu web</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(templates).map(([key, template]) => (
            <div
              key={key}
              onClick={() => handleTemplateSelect(key)}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedTemplate === key ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300'}`}
            >
              <h3 className="font-medium text-lg">{template.name}</h3>
              <p className="text-gray-600 text-sm mt-1">{template.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Instrucciones personalizadas */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Personaliza tu web</h2>
        <p className="text-gray-600 mb-4">
          Describe cómo quieres que sea tu página web, colores, estilos o cualquier requisito
          específico.
          {selectedTemplate !== 'personalizada' && (
            <span className="block mt-2 text-blue-600">
              Usando plantilla: <strong>{templates[selectedTemplate].name}</strong>. Puedes
              modificar el texto sugerido o añadir más detalles.
            </span>
          )}
        </p>

        <textarea
          className="w-full h-40 border rounded-lg p-4"
          placeholder="Ej: Quiero una web con estilo romántico, muchas fotos y una sección para que los invitados confirmen asistencia..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <div className="mt-4 flex flex-wrap gap-4">
          <button
            onClick={generateWeb}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Generando...</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Generar Página Web</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {html && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Vista previa de tu página web</h2>

          <div className="border rounded-lg overflow-hidden shadow-lg">
            <div className="bg-gray-100 p-2 border-b flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="flex-1 text-center text-sm text-gray-600">
                Vista previa - Tu web de boda
              </div>
            </div>
            <iframe
              title="Vista previa"
              srcDoc={html}
              sandbox="allow-same-origin allow-scripts"
              className="w-full h-[600px] border-none"
            />
          </div>

          <div className="mt-6 flex gap-4 items-center flex-wrap">
            <button
              onClick={publishWeb}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Publicar página</span>
            </button>
            <button
              onClick={() => {
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
              <span>Abrir en nueva pestaña</span>
            </button>
          </div>
        </div>
      )}

      {/* Controles de publicación pública y exportación */}
      {html && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Publicación pública</h2>
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Slug público</label>
              <input
                value={publishSlug}
                onChange={(e) => setPublishSlug(e.target.value)}
                placeholder="mi-boda-ana-luis"
                className="border rounded px-3 py-2 text-sm"
              />
              {publishSlug && (
                <span className="text-sm">
                  {checkingSlug ? (
                    'Comprobando…'
                  ) : slugError ? (
                    <span className="text-red-600">{slugError}</span>
                  ) : slugAvailable === true ? (
                    <span className="text-green-600">Disponible</span>
                  ) : slugAvailable === false ? (
                    <span className="text-red-600">Ocupado</span>
                  ) : null}
                </span>
              )}
            </div>
            {slugSuggestions.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Sugerencias:</span>
                {slugSuggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setPublishSlug(s)}
                    className={`px-2 py-1 rounded border ${publishSlug === s ? 'bg-blue-50 border-blue-400' : 'border-gray-300 hover:border-blue-300'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {/* Bloque duplicado de sugerencias eliminado para evitar redundancia */}
            <button
              disabled={Boolean(slugError) || slugAvailable === false}
              onClick={async () => {
                const url =
                  publicUrl ||
                  (publishSlug
                    ? `${window.location.origin}/p/${encodeURIComponent(publishSlug)}`
                    : '');
                if (!url) return;
                try {
                  await navigator.clipboard.writeText(url);
                  alert('Enlace copiado');
                } catch {
                  alert(url);
                }
              }}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded"
            >
              Copiar enlace
            </button>
            <button
              onClick={() => setShowQR(true)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Mostrar QR
            </button>
            <button
              onClick={() => {
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'index.html';
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 3000);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M3 3a1 1 0 011-1h2a1 1 0 110 2H5v12h10V4h-1a1 1 0 110-2h2a1 1 0 011 1v14a2 2 0 01-2 2H5a2 2 0 01-2-2V3z" />
                <path d="M7 9a1 1 0 011-1h1V4a1 1 0 112 0v4h1a1 1 0 01.707 1.707l-3 3a1 1 0 01-1.414 0l-3-3A1 1 0 017 9z" />
              </svg>
              <span>Descargar HTML</span>
            </button>
          </div>
          {showQR && (
            <div className="mt-4 p-4 border rounded inline-block">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">QR de la web pública</div>
                <button
                  onClick={() => setShowQR(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Cerrar
                </button>
              </div>
              {(() => {
                const url =
                  publicUrl ||
                  (publishSlug
                    ? `${window.location.origin}/p/${encodeURIComponent(publishSlug)}`
                    : '');
                const qr = url
                  ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`
                  : '';
                return qr ? <img src={qr} alt="QR" width={220} height={220} /> : null;
              })()}
            </div>
          )}
        </div>
      )}

      {versions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Versiones publicadas</h2>

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Fecha
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Plantilla
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Indicaciones
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {versions.map((v) => {
                  // Detectar qué plantilla se usó basado en el prompt
                  let templateUsed = 'Personalizada';
                  Object.entries(templates).forEach(([key, template]) => {
                    if (v.prompt && v.prompt.includes(template.prompt) && template.prompt) {
                      templateUsed = template.name;
                    }
                  });

                  return (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(v.createdAt?.seconds * 1000).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {templateUsed}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">
                        {v.prompt || 'Sin indicaciones'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setHtml(v.html)}
                          className="text-blue-600 hover:text-blue-800 mr-4"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => {
                            setPrompt(v.prompt || '');
                            setHtml(v.html);
                            // Detectar plantilla
                            let detectedTemplate = 'personalizada';
                            Object.entries(templates).forEach(([key, template]) => {
                              if (
                                v.prompt &&
                                v.prompt.includes(template.prompt) &&
                                template.prompt
                              ) {
                                detectedTemplate = key;
                              }
                            });
                            setSelectedTemplate(detectedTemplate);
                          }}
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
      )}
    </div>
  );
}
