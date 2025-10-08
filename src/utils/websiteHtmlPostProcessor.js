import { TEMPLATE_LIBRARY } from './websitePromptBuilder';

const getTemplate = (templateKey = 'personalizada') =>
  TEMPLATE_LIBRARY[templateKey] || TEMPLATE_LIBRARY.personalizada;

const coupleLabel = (weddingInfo = {}) => {
  const names = [weddingInfo.bride, weddingInfo.groom].filter(Boolean);
  if (!names.length) return 'Nuestra boda';
  if (names.length === 1) return `Celebración de ${names[0]}`;
  return `${names[0]} & ${names[1]}`;
};

const renderScheduleRows = (schedule = []) => {
  if (!Array.isArray(schedule) || schedule.length === 0) {
    return `<tr><td colspan="4">Los horarios exactos de autobuses se publicarán aquí.</td></tr>`;
  }
  return schedule
    .map((item) => {
      const time = item.time || item.hour || '—';
      const from = item.departure || item.from || '—';
      const to = item.destination || item.to || '—';
      const notes = item.notes || item.details || '';
      return `<tr><td>${time}</td><td>${from}</td><td>${to}</td><td>${notes}</td></tr>`;
    })
    .join('');
};

const renderLodgingCards = (lodging = []) => {
  if (!Array.isArray(lodging) || lodging.length === 0) {
    return `
      <div class="lovenda-card">
        <p>Pronto añadiremos hoteles y alojamientos recomendados cercanos a la celebración.</p>
      </div>
    `;
  }
  return lodging
    .map((hotel) => {
      const title = hotel.name || hotel.title || 'Hospedaje recomendado';
      const type = hotel.type || hotel.category || '';
      const distance = hotel.distance || hotel.minutes || '';
      const price = hotel.priceRange || hotel.price || '';
      const link = hotel.link || hotel.url || '';
      const amenities = Array.isArray(hotel.amenities) ? hotel.amenities.join(', ') : hotel.amenities || '';

      return `
        <div class="lovenda-card">
          <h3>${title}</h3>
          ${type ? `<p>${type}</p>` : ''}
          ${distance ? `<p><strong>Distancia:</strong> ${distance}</p>` : ''}
          ${price ? `<p><strong>Precio:</strong> ${price}</p>` : ''}
          ${amenities ? `<p><strong>Servicios:</strong> ${amenities}</p>` : ''}
          ${link ? `<a class="lovenda-button-secondary" href="${link}" target="_blank" rel="noopener">Ver sitio</a>` : ''}
        </div>
      `;
    })
    .join('');
};

const renderTravelCards = (travelGuide = {}) => {
  const airports = Array.isArray(travelGuide.airports) ? travelGuide.airports : [];
  const stations = Array.isArray(travelGuide.stations) ? travelGuide.stations : [];
  return {
    air: `${airports.length ? airports.map((a) => `• ${a}`).join('<br/>') : 'Aeropuertos cercanos y tiempos estimados aparecerán aquí.'}${travelGuide.byPlane ? `<p>${travelGuide.byPlane}</p>` : ''}`,
    rail: `${stations.length ? stations.map((s) => `• ${s}`).join('<br/>') : 'Estaciones y conexiones se publicarán pronto.'}${travelGuide.byTrain ? `<p>${travelGuide.byTrain}</p>` : ''}`,
    road: `${travelGuide.byCar || 'Recibirás las indicaciones para llegar en coche tan pronto estén listas.'}${travelGuide.tips ? `<p><strong>Tips:</strong> ${travelGuide.tips}</p>` : ''}`,
  };
};

const ensureShell = (html, weddingInfo) => {
  if (!html) return '';
  let output = html.trim();
  const title = `${coupleLabel(weddingInfo)} · Sitio de boda`;

  if (!/<!doctype html/i.test(output)) {
    output = `<!doctype html>\n${output}`;
  }

  if (!/<html[\s>]/i.test(output)) {
    const bodyContent = output.replace(/<!doctype html>/i, '').trim();
    return [
      '<!doctype html>',
      '<html lang="es">',
      '<head>',
      '<meta charset="utf-8" />',
      '<meta name="viewport" content="width=device-width, initial-scale=1" />',
      `<title>${title}</title>`,
      '</head>',
      '<body>',
      bodyContent,
      '</body>',
      '</html>',
    ].join('\n');
  }

  if (!/<head[\s>]/i.test(output)) {
    output = output.replace(/<html[^>]*>/i, '$&\n<head>\n</head>');
  }

  if (!/<body[\s>]/i.test(output)) {
    output = output.replace(/<\/head>/i, '</head>\n<body>\n') + '\n</body>';
  }

  if (!/<meta[^>]+charset=/i.test(output)) {
    output = output.replace(/<head([^>]*)>/i, `<head$1>\n<meta charset="utf-8" />`);
  }

  if (!/<meta[^>]+viewport=/i.test(output)) {
    output = output.replace(
      /<head([^>]*)>/i,
      `<head$1>\n<meta name="viewport" content="width=device-width, initial-scale=1" />`
    );
  }

  if (!/<title>/i.test(output)) {
    output = output.replace(/<head([^>]*)>/i, `<head$1>\n<title>${title}</title>`);
  }

  return output;
};

const insertIntoHead = (html, snippet) => {
  if (html.includes(snippet)) return html;
  return html.replace(/<\/head>/i, `${snippet}\n</head>`);
};

const buildStyleBlock = (template) => {
  const { palette, fonts } = template.tokens;

  const baseStyles = `
  :root {
    --color-primary: ${palette.primary};
    --color-secondary: ${palette.secondary};
    --color-accent: ${palette.accent};
    --color-text: ${palette.text};
    --color-muted: ${palette.muted};
    --color-surface: ${palette.surface};
    --color-surface-alt: ${palette.surfaceAlt};
    --color-background: ${palette.background};
    --font-heading: ${fonts.heading};
    --font-body: ${fonts.body};
    --font-accent: ${fonts.accent};
    --radius-card: 20px;
    --shadow-soft: 0 24px 48px rgba(17, 24, 39, 0.08);
    --transition-base: all 220ms ease-in-out;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: var(--font-body);
    color: var(--color-text);
    background: var(--color-background);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  h1, h2, h3, h4 {
    font-family: var(--font-heading);
    letter-spacing: -0.02em;
    color: var(--color-text);
    margin-top: 0;
  }

  a, button {
    cursor: pointer;
    transition: var(--transition-base);
  }

  main {
    max-width: 1120px;
    margin: 0 auto;
    padding: 32px 16px 120px;
  }

  section {
    margin: 0 auto 32px;
    padding: 32px clamp(20px, 4vw, 48px);
    background: var(--color-surface);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-soft);
  }

  .lovenda-table-wrapper {
    overflow-x: auto;
    margin-top: 16px;
  }

  .lovenda-hero {
    position: relative;
    padding: clamp(48px, 10vw, 96px) 24px clamp(40px, 8vw, 80px);
    text-align: center;
    background: linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0.25));
    overflow: hidden;
  }

  .lovenda-hero__badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 999px;
    background: rgba(255,255,255,0.6);
    border: 1px solid rgba(255,255,255,0.9);
    color: var(--color-muted);
    font-size: 0.85rem;
  }

  .lovenda-hero__names {
    font-family: var(--font-accent);
    font-size: clamp(48px, 10vw, 96px);
    margin: clamp(12px, 4vw, 32px) 0 12px;
    color: var(--color-text);
    text-shadow: 0 16px 32px rgba(0,0,0,0.08);
  }

  .lovenda-hero__cta {
    margin-top: clamp(24px, 4vw, 40px);
    display: inline-flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .lovenda-button-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: 999px;
    background: var(--color-primary);
    color: #fff;
    font-weight: 600;
    text-decoration: none;
    border: none;
    box-shadow: 0 16px 32px rgba(0,0,0,0.12);
  }

  .lovenda-button-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.14);
  }

  .lovenda-button-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 999px;
    border: 1px solid rgba(0,0,0,0.08);
    background: rgba(255,255,255,0.8);
    color: var(--color-text);
    text-decoration: none;
  }

  .lovenda-grid {
    display: grid;
    gap: clamp(16px, 3vw, 32px);
  }

  @media (min-width: 768px) {
    .lovenda-grid--two {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .lovenda-card {
    background: var(--color-surface);
    border-radius: clamp(18px, 4vw, 26px);
    border: 1px solid rgba(0,0,0,0.05);
    padding: clamp(20px, 3vw, 32px);
    box-shadow: var(--shadow-soft);
  }

  .lovenda-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: clamp(12px, 3vw, 28px);
  }

  .lovenda-gallery__item {
    position: relative;
    border-radius: 24px;
    overflow: hidden;
    background: var(--color-surface-alt);
    min-height: 220px;
    box-shadow: var(--shadow-soft);
  }

  .lovenda-gallery__item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .lovenda-section-heading {
    font-size: clamp(26px, 4vw, 36px);
    margin-bottom: clamp(16px, 3vw, 28px);
    position: relative;
  }

  .lovenda-section-heading span {
    display: inline-block;
    padding-bottom: 12px;
    border-bottom: 2px solid rgba(0,0,0,0.1);
  }

  footer {
    text-align: center;
    padding: 48px 16px 64px;
    color: var(--color-muted);
    font-size: 0.95rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  table th, table td {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(0,0,0,0.08);
    text-align: left;
  }

  table thead tr {
    background: var(--color-surface-alt);
  }

  table th {
    font-weight: 600;
    color: var(--color-muted);
  }


  .lovenda-timeline {
    display: grid;
    gap: 18px;
  }

  .lovenda-timeline__item {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px 24px;
    align-items: center;
  }

  .lovenda-timeline__time {
    font-weight: 600;
    color: var(--color-primary);
    min-width: 80px;
  }

  .lovenda-faq {
    display: grid;
    gap: 16px;
  }

  .lovenda-faq__item {
    padding: 16px 20px;
    border-radius: 16px;
    background: var(--color-surface-alt);
  }
  `;

  return `<style id="lovenda-wedding-theme">${baseStyles}</style>`;
};

const injectFonts = (html, template) => {
  const { fontImports = [] } = template.tokens;
  if (!fontImports.length) return html;

  let output = html;
  fontImports.forEach((fontHref) => {
    const linkTag = `<link rel="stylesheet" href="${fontHref}">`;
    if (!output.includes(fontHref)) {
      output = output.replace(/<\/head>/i, `${linkTag}\n</head>`);
    }
  });
  return output;
};

const ensureSection = (html, marker, contentBuilder) => {
  if (new RegExp(marker, 'i').test(html)) return html;

  const content = contentBuilder();
  if (!content) return html;
  if (/<\/main>/i.test(html)) {
    return html.replace(/<\/main>/i, `${content}\n</main>`);
  }
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${content}\n</body>`);
  }

  return `${html}\n${content}`;
};

const buildFallbackSections = (weddingInfo, template) => ({
  story: () => {
    if (!weddingInfo?.additionalInfo && !weddingInfo?.story) return '';
    return `
    <section data-enhanced="story">
      <div class="lovenda-section-heading"><span>Nuestra historia</span></div>
      <p>${weddingInfo.story || weddingInfo.additionalInfo}</p>
    </section>
    `;
  },
  transport: () => `
    <section data-enhanced="transport" id="transporte">
      <div class="lovenda-section-heading"><span>Transporte y autobuses</span></div>
      <div class="lovenda-card">
        <p>${weddingInfo?.transportation || 'Habrá servicio de transporte para invitados. Consulta los horarios en la tabla.'}</p>
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
              ${renderScheduleRows(weddingInfo?.shuttleSchedule)}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
  gallery: () => `
    <section data-enhanced="gallery">
      <div class="lovenda-section-heading"><span>Galería</span></div>
      <div class="lovenda-gallery">
        <div class="lovenda-gallery__item"></div>
        <div class="lovenda-gallery__item"></div>
        <div class="lovenda-gallery__item"></div>
      </div>
    </section>
  `,
  lodging: () => `
    <section data-enhanced="lodging">
      <div class="lovenda-section-heading"><span>Hospedaje cercano</span></div>
      <div class="lovenda-grid lovenda-grid--two">
        ${renderLodgingCards(weddingInfo?.lodgingOptions)}
      </div>
    </section>
  `,
  travel: () => {
    const travelBlocks = renderTravelCards(weddingInfo?.travelGuide || {});
    return `
    <section data-enhanced="travel-guide">
      <div class="lovenda-section-heading"><span>Cómo llegar</span></div>
      <div class="lovenda-grid lovenda-grid--two">
        <div class="lovenda-card">
          <h3>En avión</h3>
          <p>${travelBlocks.air}</p>
        </div>
        <div class="lovenda-card">
          <h3>En tren / bus</h3>
          <p>${travelBlocks.rail}</p>
        </div>
      </div>
      <div class="lovenda-card">
        <h3>En coche</h3>
        <p>${travelBlocks.road}</p>
      </div>
    </section>
    `;
  },
  contact: () => {
    const contact = [weddingInfo?.contactEmail, weddingInfo?.contactPhone].filter(Boolean).join(' · ');
    if (!contact) return '';
    return `
    <section data-enhanced="contacto" id="contacto">
      <div class="lovenda-section-heading"><span>Contacto</span></div>
      <div class="lovenda-card">${contact}</div>
    </section>
    `;
  },
  timeline: () => {
    if (!weddingInfo?.ceremonyTime && !weddingInfo?.receptionTime) return '';
    return `
    <section data-enhanced="timeline">
      <div class="lovenda-section-heading"><span>Agenda del día</span></div>
      <div class="lovenda-timeline">
        ${weddingInfo?.ceremonyTime ? `
        <div class="lovenda-timeline__item">
          <div class="lovenda-timeline__time">${weddingInfo.ceremonyTime}</div>
          <div>
            <strong>Ceremonia</strong>
            <div>${weddingInfo.ceremonyLocation || 'Por confirmar'}</div>
          </div>
        </div>` : ''}
        ${weddingInfo?.receptionTime ? `
        <div class="lovenda-timeline__item">
          <div class="lovenda-timeline__time">${weddingInfo.receptionTime}</div>
          <div>
            <strong>Recepción</strong>
            <div>${weddingInfo.receptionVenue || 'Por confirmar'}</div>
          </div>
        </div>` : ''}
      </div>
    </section>
    `;
  },
});

const ensureHero = (html, weddingInfo, template) => {
  if (/lovenda-hero/i.test(html) || /data-enhanced="hero"/i.test(html)) return html;
  const dateText = weddingInfo?.date ? `<div class="lovenda-hero__badge">${weddingInfo.date}</div>` : '';
  const location =
    weddingInfo?.ceremonyLocation || weddingInfo?.receptionVenue
      ? `<p>${[weddingInfo.ceremonyLocation, weddingInfo.receptionVenue].filter(Boolean).join(' · ')}</p>`
      : '';
  const hero = `
  <section class="lovenda-hero" data-enhanced="hero">
    ${dateText}
    <div class="lovenda-hero__names">${coupleLabel(weddingInfo)}</div>
    ${location}
    <div class="lovenda-hero__cta">
      <a class="lovenda-button-primary" href="#transporte">Ver transporte</a>
      <a class="lovenda-button-secondary" href="#contacto">Contactar a la pareja</a>
    </div>
  </section>
  `;

  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/<body([^>]*)>/i, `<body$1>\n${hero}`);
  }
  return `${hero}\n${html}`;
};

const ensureCountdownScript = (html, weddingInfo) => {
  if (!weddingInfo?.date) return html;
  if (/lovendaCountdown/i.test(html)) return html;

  const script = `
  <script id="lovendaCountdown">
    (function(){
      var target = new Date('${weddingInfo.date}').getTime();
      if (!target || isNaN(target)) return;
      var badge = document.querySelector('.lovenda-hero__badge');
      if (!badge) return;
      function pad(n){ return (n<10 ? '0' : '') + n; }
      function tick(){
        var diff = target - Date.now();
        if (diff <= 0) {
          badge.textContent = '¡Llegó el gran día!';
          return;
        }
        var days = Math.floor(diff / 86400000);
        var hours = Math.floor((diff % 86400000) / 3600000);
        var minutes = Math.floor((diff % 3600000) / 60000);
        badge.textContent = 'Faltan ' + days + ' días · ' + pad(hours) + 'h ' + pad(minutes) + 'm';
      }
      tick();
      setInterval(tick, 60000);
    })();
  </script>
  `;

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${script}\n</body>`);
  }
  return `${html}\n${script}`;
};

export const enhanceWeddingHtml = (html, { templateKey = 'personalizada', weddingInfo = {} } = {}) => {
  if (!html) return html;
  const template = getTemplate(templateKey);

  let output = ensureShell(html, weddingInfo);
  output = injectFonts(output, template);

  if (!/id="lovenda-wedding-theme"/i.test(output)) {
    output = insertIntoHead(output, buildStyleBlock(template));
  }

  const fallbackSections = buildFallbackSections(weddingInfo, template);
  output = ensureHero(output, weddingInfo, template);
  output = ensureSection(output, 'data-enhanced="story"', fallbackSections.story);
  output = ensureSection(output, 'data-enhanced="transport"', fallbackSections.transport);
  output = ensureSection(output, 'data-enhanced="gallery"', fallbackSections.gallery);
  output = ensureSection(output, 'data-enhanced="lodging"', fallbackSections.lodging);
  output = ensureSection(output, 'data-enhanced="travel-guide"', fallbackSections.travel);
  output = ensureSection(output, 'data-enhanced="timeline"', fallbackSections.timeline);
  output = ensureSection(output, 'data-enhanced="contacto"', fallbackSections.contact);

  output = ensureCountdownScript(output, weddingInfo);

  return output;
};
