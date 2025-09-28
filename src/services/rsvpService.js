import { post } from './apiClient';

export async function generateRsvpLink({ weddingId, guestId }) {
  if (!weddingId || !guestId) throw new Error('weddingId and guestId are required');
  const res = await post('/api/rsvp/generate-link', { weddingId, guestId }, { auth: true });
  if (!res.ok) throw new Error(`status ${res.status}`);
  return res.json();
}

