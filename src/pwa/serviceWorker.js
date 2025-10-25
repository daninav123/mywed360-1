/**
 * Service Worker para PWA - MaLoveApp
 * Proporciona funcionalidad offline y caché inteligente
 */

import { precacheAndRoute } from 'workbox-precaching';
// Inyección de precache (vite-plugin-pwa injectManifest)
// self.__WB_MANIFEST será reemplazado en build con la lista de assets
precacheAndRoute(self.__WB_MANIFEST || []);

const CACHE_NAME = 'maloveapp-v1.0.0';
const STATIC_CACHE = 'maloveapp-static-v1';
const DYNAMIC_CACHE = 'maloveapp-dynamic-v1';
const API_CACHE = 'maloveapp-api-v1';
// Share Target storage
const SHARE_DB_NAME = 'maloveapp-share-target';
const SHARE_STORE = 'shares';
const SHARE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

// Recursos estáticos para cachear inmediatamente
const STATIC_ASSETS = [
  '/',
  // Manifest servido desde public
  '/app.webmanifest',
  // PWA fallback
  '/offline.html',
  // Iconos usados por notificaciones e instalación
  '/icon-192.png',
  '/icon-512.png',
  '/badge-72.png',
  '/logo-app.png',
];

// Rutas de API que se pueden cachear
const CACHEABLE_API_ROUTES = ['/api/mail', '/api/tasks', '/api/finance', '/api/proveedores'];

/**
 * Instalar Service Worker y cachear recursos estáticos
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  console.log(`[SW] Cache base version ${CACHE_NAME}`);

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Cacheando recursos estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Service Worker instalado correctamente');
        // Ejecutar limpieza de compartidos antiguos en instalación
        try {
          cleanupOldShares();
        } catch (e) {}
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error instalando Service Worker:', error);
      })
  );
});

/**
 * Activar Service Worker y limpiar cachés antiguos
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== API_CACHE
            ) {
              console.log('[SW] Eliminando caché antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activado');
        return self.clients.claim();
      })
  );
});

/**
 * Interceptar peticiones y aplicar estrategias de caché
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Web Share Target (POST con archivos)
  if (url.pathname === '/email/compose' && request.method === 'POST') {
    event.respondWith(handleShareTargetRequest(event));
    return;
  }

  // Ignorar peticiones que no sean GET
  if (request.method !== 'GET') {
    return;
  }

  // Estrategia según el tipo de recurso
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  } else if (isAPIRequest(url)) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
  } else if (isImageRequest(url)) {
    event.respondWith(staleWhileRevalidateStrategy(request, DYNAMIC_CACHE));
  } else {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  try {
    let data = {};
    try {
      data = event.data
        ? event.data.json
          ? event.data.json()
          : JSON.parse(event.data.text())
        : {};
    } catch {
      data = { title: 'MaLoveApp', body: event.data?.text() };
    }
    const title = data.title || 'MaLoveApp';
    const options = {
      body: data.body || 'Tienes una nueva notificación',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: { url: data.url || '/' },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch {}
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// ----- Web Share Target helpers -----
async function handleShareTargetRequest(event) {
  try {
    const formData = await event.request.formData();
    const files = formData.getAll('files') || [];
    const title = formData.get('title') || formData.get('subject') || '';
    const text = formData.get('text') || formData.get('body') || '';
    const url = formData.get('url') || '';

    const shareId =
      self.crypto && self.crypto.randomUUID ? self.crypto.randomUUID() : String(Date.now());
    await saveSharedFiles(shareId, files);

    const qs = new URLSearchParams();
    qs.set('shareId', shareId);
    if (title) qs.set('subject', title);
    const bodyCombined = [text, url].filter(Boolean).join('\n');
    if (bodyCombined) qs.set('body', bodyCombined);

    const redirectUrl = `/email/compose?${qs.toString()}`;
    return Response.redirect(redirectUrl, 303);
  } catch (err) {
    console.error('[SW] Error manejando share_target:', err);
    return new Response('Error al compartir', { status: 500 });
  }
}

function openShareDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SHARE_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SHARE_STORE)) {
        db.createObjectStore(SHARE_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveSharedFiles(shareId, files) {
  const db = await openShareDB();
  const tx = db.transaction(SHARE_STORE, 'readwrite');
  const store = tx.objectStore(SHARE_STORE);
  const payload = {
    id: shareId,
    createdAt: Date.now(),
    files: await Promise.all(
      (files || []).map(async (f) => ({
        name: f.name || 'archivo',
        type: f.type || 'application/octet-stream',
        lastModified: f.lastModified || Date.now(),
        size: f.size || 0,
        blob: f,
      }))
    ),
  };
  store.put(payload);
  await new Promise((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error);
  });
  db.close();
}

async function cleanupOldShares() {
  try {
    const db = await openShareDB();
    const tx = db.transaction(SHARE_STORE, 'readwrite');
    const store = tx.objectStore(SHARE_STORE);
    const threshold = Date.now() - SHARE_TTL_MS;
    let removed = 0;
    await new Promise((resolve, reject) => {
      const req = store.openCursor();
      req.onsuccess = (ev) => {
        const cursor = ev.target.result;
        if (cursor) {
          const val = cursor.value;
          if (!val?.createdAt || val.createdAt < threshold) {
            cursor.delete();
            removed++;
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => reject(req.error);
    });
    await new Promise((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
      tx.onabort = () => rej(tx.error);
    });
    db.close();
    return removed;
  } catch (e) {
    console.warn('[SW] cleanupOldShares error', e);
    return 0;
  }
}

/**
 * Estrategia Cache First - Ideal para recursos estáticos
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());

    return networkResponse;
  } catch (error) {
    console.error('[SW] Error en cache-first:', error);
    return getOfflineFallback(request);
  }
}

/**
 * Estrategia Network First - Ideal para contenido dinámico
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Red no disponible, buscando en caché:', request.url);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    return getOfflineFallback(request);
  }
}

/**
 * Estrategia Stale While Revalidate - Ideal para imágenes
 */
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(cacheName);
        cache.then((c) => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

/**
 * Obtener respuesta offline según el tipo de recurso
 */
async function getOfflineFallback(request) {
  const url = new URL(request.url);

  if (request.destination === 'document') {
    return caches.match('/offline.html');
  }

  if (isImageRequest(url)) {
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="#f3f4f6"/><text x="100" y="75" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="14">Imagen no disponible</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }

  if (isAPIRequest(url)) {
    return new Response(
      JSON.stringify({
        error: 'Sin conexión',
        message: 'Esta función requiere conexión a internet',
        offline: true,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response('Recurso no disponible offline', { status: 503 });
}

/**
 * Verificar si es un recurso estático
 */
function isStaticAsset(url) {
  return (
    url.pathname.includes('/static/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff')
  );
}

/**
 * Verificar si es una petición a la API
 */
function isAPIRequest(url) {
  return (
    url.pathname.startsWith('/api/') ||
    CACHEABLE_API_ROUTES.some((route) => url.pathname.startsWith(route))
  );
}

/**
 * Verificar si es una petición de imagen
 */
function isImageRequest(url) {
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i);
}

/**
 * Manejar mensajes del cliente
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_CACHE_STATS':
      getCacheStats().then((stats) => {
        event.ports[0].postMessage({ type: 'CACHE_STATS', payload: stats });
      });
      break;

    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
    case 'CLEANUP_SHARES':
      cleanupOldShares().then((removed) => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ type: 'SHARES_CLEANED', removed });
        }
      });
      break;

    case 'SYNC_DATA':
      // Implementar sincronización en background
      handleBackgroundSync(payload);
      break;
  }
});

/**
 * Obtener estadísticas del caché
 */
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = keys.length;
  }

  return stats;
}

/**
 * Limpiar todos los cachés
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(cacheNames.map((name) => caches.delete(name)));
}

/**
 * Manejar sincronización en background
 */
function handleBackgroundSync(data) {
  // Implementar lógica de sincronización cuando vuelva la conexión
  console.log('[SW] Sincronización en background:', data);
}

/**
 * Manejar notificaciones push
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: data.tag || 'default',
    data: data.data || {},
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

/**
 * Manejar clicks en notificaciones
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // Si no, abrir nueva ventana
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

console.log('[SW] Service Worker cargado correctamente');

