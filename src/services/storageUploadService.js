// Subida de adjuntos a Firebase Storage y retorno de URLs
// Retorna: [{ filename, size, url }]
export async function uploadEmailAttachments(files = [], userId = 'anonymous', folder = 'emails') {
  if (!files || files.length === 0) return [];
  try {
    const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const storage = getStorage();
    const results = [];
    for (const file of files) {
      if (!file) continue;
      const safeName = sanitizeFilename(file.name || 'adjunto');
      const base =
        folder && typeof folder === 'string' ? folder.replace(/[^a-zA-Z0-9/_-]/g, '') : 'emails';
      const objectPath = `${base}/${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}_${safeName}`;
      const r = ref(storage, objectPath);
      const snap = await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      results.push({ filename: safeName, size: file.size || 0, url });
    }
    return results;
  } catch (e) {
    console.error('uploadEmailAttachments error:', e);
    // Si falla Storage, devolvemos sin URLs para que el backend use fallback
    return Array.from(files).map((f) => ({ filename: f?.name || 'adjunto', size: f?.size || 0 }));
  }
}

function sanitizeFilename(name) {
  return String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 200);
}
