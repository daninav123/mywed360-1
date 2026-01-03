import admin from 'firebase-admin';

// Dynamic imports to avoid hard dependency if not used
async function tryImport(module) {
  try { return await import(module); } catch { return null; }
}

function textFromBuffer(buf, encoding = 'utf8') {
  try { return buf.toString(encoding); } catch { return ''; }
}

function stripHtml(html) {
  try { return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); } catch { return String(html || ''); }
}

async function extractPdf(buf) {
  const mod = await tryImport('pdf-parse');
  if (!mod) return '';
  const pdfParse = (mod.default || mod);
  try {
    const res = await pdfParse(buf);
    return String(res.text || '').trim();
  } catch { return ''; }
}

async function extractDocx(buf) {
  const mod = await tryImport('mammoth');
  if (!mod) return '';
  const mammoth = (mod.default || mod);
  try {
    const res = await mammoth.extractRawText({ buffer: buf });
    return String(res.value || '').trim();
  } catch { return ''; }
}

async function extractXlsx(buf) {
  const mod = await tryImport('exceljs');
  if (!mod) return '';
  const ExcelJS = (mod.default || mod);
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buf);
    const sheets = workbook.worksheets || [];
    let out = [];
    for (const ws of sheets.slice(0, 3)) { // up to 3 sheets
      if (!ws) continue;
      out.push(`# ${ws.name}`);
      let rowCount = 0;
      ws.eachRow((row, rowNumber) => {
        if (rowCount >= 50) return; // limit rows
        const rowData = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          rowData.push(cell.value == null ? '' : String(cell.value));
        });
        out.push(rowData.join(' \t '));
        rowCount++;
      });
    }
    return out.join('\n');
  } catch { return ''; }
}

async function extractImageOcr(buf) {
  const ocrEnabled = (process.env.EMAIL_ANALYSIS_ENABLE_OCR
    ? process.env.EMAIL_ANALYSIS_ENABLE_OCR !== 'false'
    : true); // por defecto ACTIVADO
  if (!ocrEnabled) return '';
  // Try tesseract.js only if installed
  const mod = await tryImport('tesseract.js');
  if (!mod) return '';
  const tesseract = (mod.default || mod);
  try {
    const { createWorker } = tesseract;
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(buf);
    await worker.terminate();
    return String(text || '').trim();
  } catch { return ''; }
}

export async function extractTextFromAttachment({ buffer, contentType = '', filename = '' }) {
  try {
    const mime = String(contentType || '').toLowerCase();
    if (!buffer) return '';
    if (mime.includes('pdf')) return await extractPdf(buffer);
    if (mime.includes('word') || mime.includes('officedocument.wordprocessingml.document') || filename.toLowerCase().endsWith('.docx')) return await extractDocx(buffer);
    if (mime.includes('spreadsheet') || mime.includes('excel') || filename.toLowerCase().endsWith('.xlsx')) return await extractXlsx(buffer);
    if (mime.startsWith('text/')) {
      const raw = textFromBuffer(buffer);
      return mime.includes('html') ? stripHtml(raw) : raw;
    }
    if (mime.includes('csv')) return textFromBuffer(buffer);
    if (mime.startsWith('image/')) return await extractImageOcr(buffer);
    // Fallback: attempt utf8 text
    const maybe = textFromBuffer(buffer);
    return maybe && /[\w\s]{10,}/.test(maybe) ? maybe : '';
  } catch {
    return '';
  }
}

/**
 * Read attachments from Storage for a given mail and extract text.
 * Returns an array [{ filename, mime, text }]
 */
export async function extractTextForMail(mailId) {
  try {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || null;
    if (!bucketName) return [];
    const bucket = admin.storage().bucket(bucketName);
    const firestore = admin.firestore();
    const snap = await firestore.collection('mails').doc(mailId).collection('attachments').get();
    if (snap.empty) return [];
    const out = [];
    for (const d of snap.docs) {
      const a = d.data() || {};
      const storagePath = a.storagePath || a.gcsPath || null;
      if (!storagePath) continue;
      try {
        const file = bucket.file(storagePath);
        const [buf] = await file.download();
        const text = await extractTextFromAttachment({ buffer: buf, contentType: a.contentType || '', filename: a.filename || '' });
        if (text && text.trim()) {
          out.push({ filename: a.filename || a.name || d.id, mime: a.contentType || '', text });
        }
      } catch { /* ignore */ }
    }
    return out;
  } catch {
    return [];
  }
}

export default {
  extractTextFromAttachment,
  extractTextForMail,
};
