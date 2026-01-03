// Simple Push Notification subscription helper
import { post, get } from './apiClient';

export function isSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

async function getVapidKey() {
  try {
    const res = await get('/api/push/public-key');
    if (!res.ok) return null;
    const data = await res.json();
    return data.key || import.meta.env.VITE_VAPID_PUBLIC_KEY || null;
  } catch {
    return import.meta.env.VITE_VAPID_PUBLIC_KEY || null;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function getSubscription() {
  if (!isSupported()) return null;
  const reg = await navigator.serviceWorker?.ready;
  return await reg?.pushManager?.getSubscription();
}

export async function subscribe() {
  if (!isSupported()) throw new Error('Push not supported');
  const key = await getVapidKey();
  if (!key) throw new Error('VAPID key not configured');
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  });
  await post('/api/push/subscribe', sub, { auth: true });
  return sub;
}

export async function unsubscribe() {
  const sub = await getSubscription();
  if (!sub) return false;
  try {
    await post('/api/push/unsubscribe', sub, { auth: true });
  } catch {}
  return await sub.unsubscribe();
}

export async function sendTest() {
  try {
    const res = await post('/api/push/test', {}, { auth: true });
    return res.ok;
  } catch {
    return false;
  }
}
