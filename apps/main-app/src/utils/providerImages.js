const SERVICE_IMAGE_MAP = {
  fotografia: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=60',
  fotografo: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=60',
  video: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=60',
  videografia: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=60',
  catering: 'https://images.unsplash.com/photo-1530023367847-a683933f4177?auto=format&fit=crop&w=800&q=60',
  flores: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=60',
  florista: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=60',
  decoracion: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=60',
  weddingplanner: 'https://images.unsplash.com/photo-1520854221050-0f4caff449fb?auto=format&fit=crop&w=800&q=60',
  planner: 'https://images.unsplash.com/photo-1520854221050-0f4caff449fb?auto=format&fit=crop&w=800&q=60',
  musica: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=60',
  dj: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=60',
  pastel: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=60',
  tarta: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=60',
  maquillaje: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=60',
  peluqueria: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=60',
  invitaciones: 'https://images.unsplash.com/photo-1530103043960-ef38714abb15?auto=format&fit=crop&w=800&q=60',
  iluminacion: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=60',
  mobiliario: 'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?auto=format&fit=crop&w=800&q=60',
  transporte: 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=800&q=60',
  viajes: 'https://images.unsplash.com/photo-1496619684348-0c258b6e7278?auto=format&fit=crop&w=800&q=60',
  joyeria: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=800&q=60',
  default: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=60',
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
