import React from 'react';

import { getBackendBase } from '@/utils/backendBase.js';

/**
 * ExternalImage: renderiza una imagen externa con fallback a proxy y ocultación si falla.
 * Props:
 *  - src (string): URL original
 *  - alt, className, style, ...rest
 *  - requireHttp (bool): si true, solo acepta http(s); si no, renderiza src tal cual
 *  - hideOnFail (bool): si true, no renderiza nada si falla incluso con proxy
 */
export default function ExternalImage({
  src,
  alt = '',
  className = '',
  style,
  requireHttp = true,
  hideOnFail = true,
  requireCover = false,
  minWidth = 600,
  minHeight = 300,
  extraBlockHosts = [],
  extraBlockPatterns = [],
  ...rest
}) {
  const base = getBackendBase();
  const isHttp = typeof src === 'string' && /^https?:\/\//i.test(src);
  const allow = requireHttp ? isHttp : !!src;
  const [useProxy, setUseProxy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  // Pre-filtro de URLs tipo logo/icon (evitar logos genéricos)
  let host = '';
  let path = '';
  try {
    const u = new URL(src);
    host = u.hostname.replace(/^www\./, '').toLowerCase();
    path = (u.pathname || '').toLowerCase();
  } catch {}
  const blockHosts = new Set(['news.google.com', 'gstatic.com', 'ssl.gstatic.com', 'googleusercontent.com', ...extraBlockHosts]);
  const patterns = ['logo', 'favicon', 'sprite', 'placeholder', 'default', 'brand', 'apple-touch-icon', 'android-chrome', ...extraBlockPatterns];
  const isSvg = /\.svg(\?|$)/i.test(String(src || ''));
  if (!allow) return null;
  if (requireCover) {
    if (isSvg) return null;
    if (host && blockHosts.has(host)) return null;
    if (path && patterns.some((p) => path.includes(p))) return null;
  }
  if (hideOnFail && failed) return null;
  const imgSrc = useProxy && base && isHttp ? `${base}/api/image-proxy?u=${encodeURIComponent(src)}` : src;
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      onError={() => {
        if (!useProxy && base && isHttp) setUseProxy(true);
        else if (hideOnFail) setFailed(true);
      }}
      onLoad={(e) => {
        if (!requireCover) return;
        try {
          const w = e.currentTarget.naturalWidth || 0;
          const h = e.currentTarget.naturalHeight || 0;
          if (w < minWidth || h < minHeight) {
            if (hideOnFail) setFailed(true);
          }
        } catch {}
      }}
      {...rest}
    />
  );
}
