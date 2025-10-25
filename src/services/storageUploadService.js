import i18n from '../i18n';

// Subida de adjuntos a Firebase Storage y retorno de URLs
// Retorna: [{ filename, size, url }]
export async function uploadEmailAttachments(
  files = [],
  userId = 'anonymous',
  folder = 'emailsi18n.t('common.files_fileslength_return_seguridad_basica_validar')jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'pdf',
    'txt',
    'csv',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
  ]);
  const ALLOWED_MIME_PREFIX = [
    'image/',
    'application/pdf',
    'text/plain',
    'text/csv',
    // Microsoft Office MIME types
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument',
  ];
  try {
    // Permitir ampliar por entorno
    const extraExt = (import.meta?.env?.VITE_ALLOWED_EXT || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    for (const e of extraExt) ALLOWED_EXT.add(e.replace(/^\./, ''));
  } catch {}
  let ALLOWED_MIME = new Set(ALLOWED_MIME_PREFIX);
  try {
    const extraMime = (import.meta?.env?.VITE_ALLOWED_MIME || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    for (const m of extraMime) ALLOWED_MIME.add(m);
  } catch {}

  const guessExt = (name = '') => {
    const m = String(name).toLowerCase().match(/\.([a-z0-9]+)$/);
    return m ? m[1] : '';
  };
  const isAllowedType = (file) => {
    try {
      const t = String(file?.type || '').toLowerCase();
      const ext = guessExt(file?.name || '');
      if (!ext && !t) return false;
      if (t && Array.from(ALLOWED_MIME).some((p) => t.startsWith(p))) return true;
      if (ext && ALLOWED_EXT.has(ext)) return true;
      return false;
    } catch {
      return false;
    }
  };

  try {
    const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const storage = getStorage();
    const results = [];
    const base =
      folder && typeof folder === 'string' ? folder.replace(/[^a-zA-Z0-9/_-]/g, '') : 'emails';

    for (const file of files) {
      if (!file) continue;
      const safeName = sanitizeFilename(file.name || 'adjuntoi18n.t('common.validaciones_tamano_tipo_const_size_numberfilesize')uploadEmailAttachments: rejected file', {
          name: safeName,
          size,
          validSize,
          validType,
        });
        // No subimos ficheros inválidos; omitimos de resultados
        continue;
      }

      const objectPath = `${base}/${userId}/${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}_${safeName}`;
      const r = ref(storage, objectPath);

      // Metadata de contenido si está disponible
      const metadata = {};
      if (file.type) metadata.contentType = file.type;

      await uploadBytes(r, file, metadata);
      const url = await getDownloadURL(r);
      results.push({ filename: safeName, size, url, storagePath: objectPath });
    }
    return results;
  } catch (e) {
    console.error('uploadEmailAttachments error:', e);
    // Si falla Storage, devolvemos sin URLs para que el backend use fallback
    return Array.from(files).map((f) => ({
      filename: f?.name || 'adjunto',
      size: f?.size || 0,
      storagePath: null,
    }));
  }
}

function sanitizeFilename(name) {
  return String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 200);
}
