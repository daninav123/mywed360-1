import { onCLS, onFID, onLCP, onFCP, onINP, onTTFB } from 'web-vitals';
import { post } from '@/services/apiClient';

function report(metric) {
  try {
    post('/api/web-vitals', { metrics: metric, context: { path: window.location.pathname } });
  } catch {}
}

export function initWebVitals() {
  try {
    onCLS(report);
    onFID(report);
    onLCP(report);
    onFCP(report);
    onINP?.(report);
    onTTFB(report);
  } catch {}
}

if (typeof window !== 'undefined') {
  // delay to avoid interfering with initial render
  setTimeout(() => initWebVitals(), 0);
}

