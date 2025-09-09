// Contacts Import Service - stubs para importación desde Google/Apple y CSV
// En esta fase: soporte CSV/VCF básicos y almacenamiento en Firestore por boda

import admin from 'firebase-admin';

const weddingCol = (weddingId) => admin.firestore().collection('weddings').doc(String(weddingId));

export async function importCSV(weddingId, csvText, mapping = {}) {
  if (!weddingId) throw new Error('weddingId requerido');
  if (!csvText) throw new Error('csvText requerido');
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { imported: 0 };
  const header = lines[0].split(',').map(h => h.trim());
  const idx = (name) => header.indexOf(name);

  let count = 0;
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    const guest = {
      name: row[idx(mapping.name || 'name')] || '',
      email: row[idx(mapping.email || 'email')] || '',
      phone: row[idx(mapping.phone || 'phone')] || '',
      group: row[idx(mapping.group || 'group')] || '',
      dietary: row[idx(mapping.dietary || 'dietary')] || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await weddingCol(weddingId).collection('guests').add(guest);
    count++;
  }
  return { imported: count };
}

export async function importVCF(weddingId, vcfText) {
  if (!weddingId) throw new Error('weddingId requerido');
  if (!vcfText) throw new Error('vcfText requerido');
  // Parser mínimo de VCF (vCard) para N, FN, EMAIL, TEL
  const cards = vcfText.split(/END:VCARD/i).map(s => s.trim()).filter(Boolean);
  let imported = 0;
  for (const c of cards) {
    const get = (key) => {
      const m = c.match(new RegExp(`${key}[:;]([^\n\r]+)`, 'i'));
      return m ? m[1].trim() : '';
    };
    const fn = get('FN') || get('N');
    const email = get('EMAIL');
    const tel = get('TEL');
    if (!fn && !email && !tel) continue;
    await weddingCol(weddingId).collection('guests').add({
      name: fn,
      email,
      phone: tel,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    imported++;
  }
  return { imported };
}

export async function health() {
  try {
    await admin.firestore().collection('health').limit(1).get();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message };
  }
}
