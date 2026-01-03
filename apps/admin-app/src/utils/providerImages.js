const SERVICE_IMAGE_MAP = {
  fotografia: '/assets/services/fotografia.webp',
  fotografo: '/assets/services/fotografia.webp',
  video: '/assets/services/video.webp',
  videografia: '/assets/services/video.webp',
  catering: '/assets/services/catering.webp',
  flores: '/assets/services/flores.webp',
  florista: '/assets/services/flores.webp',
  decoracion: '/assets/services/decoracion.webp',
  weddingplanner: '/assets/services/planner.webp',
  planner: '/assets/services/planner.webp',
  musica: '/assets/services/musica.webp',
  dj: '/assets/services/musica.webp',
  pastel: '/assets/services/pastel.webp',
  tarta: '/assets/services/pastel.webp',
  maquillaje: '/assets/services/maquillaje.webp',
  peluqueria: '/assets/services/peluqueria.webp',
  invitaciones: '/assets/services/invitaciones.webp',
  iluminacion: '/assets/services/iluminacion.webp',
  mobiliario: '/assets/services/mobiliario.webp',
  transporte: '/assets/services/transporte.webp',
  viajes: '/assets/services/viajes.webp',
  joyeria: '/assets/services/joyeria.webp',
  default: '/assets/services/default.webp',
};

const normalizeText = (value) =>
  value
    ? String(value)
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    : '';

export const getServicePlaceholderImage = (service) => {
  if (!service) return SERVICE_IMAGE_MAP.default;
  const normalized = normalizeText(service);
  const match = Object.keys(SERVICE_IMAGE_MAP).find((key) => {
    const cleanKey = normalizeText(key);
    return normalized.includes(cleanKey) || cleanKey.includes(normalized);
  });
  return SERVICE_IMAGE_MAP[match] || SERVICE_IMAGE_MAP.default;
};

export const selectProviderImage = (image, service) => {
  if (typeof image === 'string') {
    const trimmed = image.trim();
    if (trimmed) {
      try {
        const url = new URL(trimmed);
        const protocol = url.protocol.toLowerCase();
        const hostname = url.hostname.toLowerCase();
        if (!protocol.startsWith('http')) return getServicePlaceholderImage(service);
        if (!hostname || !hostname.includes('.')) return getServicePlaceholderImage(service);
        if (/^localhost$|^127\.0\.0\.1$|^0\.0\.0\.0$/.test(hostname)) {
          return getServicePlaceholderImage(service);
        }
        const trustedImageHosts = [
          /images\.unsplash\.com$/i,
          /cdn\d*\.bodas\.net$/i,
          /images\.weddingwire\./i,
          /images\.zankyou\./i,
          /zankyou-static\./i,
          /lh\d+\.googleusercontent\.com$/i,
          /res\.cloudinary\.com$/i,
          /wp\.weddingwire\./i,
          /media\.theknot\./i,
        ];
        if (trustedImageHosts.some((pattern) => pattern.test(hostname))) {
          return trimmed;
        }
      } catch {
        /* ignore invalid URL */
      }
    }
  }
  return getServicePlaceholderImage(service);
};

export const PROVIDER_DEFAULT_IMAGE = SERVICE_IMAGE_MAP.default;

export default getServicePlaceholderImage;
