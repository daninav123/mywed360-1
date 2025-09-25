// Simple Calendar service: opens Google Calendar event creation with provided details.
// If running outside a browser, it no-ops gracefully.

function toGCalDate(dt) {
  try {
    if (!dt) return '';
    const d = dt instanceof Date ? dt : new Date(dt);
    if (Number.isNaN(d.getTime())) return '';
    // Format: YYYYMMDDTHHMMSS (local time)
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const HH = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}${MM}${dd}T${HH}${mm}${ss}`;
  } catch {
    return '';
  }
}

export function createEvent({ title, description, start, end, location } = {}) {
  try {
    const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const params = new URLSearchParams();
    if (title) params.set('text', String(title));
    const startStr = toGCalDate(start);
    const endStr = toGCalDate(end || start);
    if (startStr) params.set('dates', `${startStr}/${endStr || startStr}`);
    if (description) params.set('details', String(description));
    if (location) params.set('location', String(location));
    const url = `${base}&${params.toString()}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener');
      return true;
    }
    return url;
  } catch {
    return false;
  }
}

export default { createEvent };

