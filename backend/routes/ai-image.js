import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import logger from '../logger.js';

// Cargar variables .env por si este archivo se ejecuta aislado
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';

const router = express.Router();

/**
 * POST /api/ai-image
 * Body: { prompt: string, size?: '1024x1024' | '1792x1024' | '1024x1792', quality?: 'standard' | 'hd' }
 * Devuelve: { url }
 */
router.post('/', async (req, res) => {
  let { prompt, size = '1024x1024', quality = 'hd' } = req.body || {};
  // Validación opcional con Zod
  try {
    const mod = await import('zod').catch(() => null);
    if (mod) {
      const z = mod.z || mod.default;
      const schema = z.object({
        prompt: z.string().min(1).max(2000),
        size: z.enum(['1024x1024','1792x1024','1024x1792']).optional().default('1024x1024'),
        quality: z.enum(['standard','hd']).optional().default('hd'),
      });
      const parsed = schema.safeParse({ prompt, size, quality });
      if (!parsed.success) return res.status(400).json({ error: 'invalid-payload', details: parsed.error.issues?.map(i=>i.message).join('; ') });
      ({ prompt, size, quality } = parsed.data);
    } else {
      if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'prompt required' });
    }
  } catch {}
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY missing' });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        timeout: 15000
      }
    );

    const url = response.data?.data?.[0]?.url;
    if (!url) throw new Error('No url in OpenAI response');

    res.json({ url });
  } catch (err) {
    logger.error('ai-image proxy error', err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    res.status(status).json({ error: 'openai-failed', details: err?.message || 'unknown' });
  }
});

// ---------- PDF vectorizado ----------


// Lazy imports dentro de los handlers para evitar fallos de arranque si faltan binarios nativos (canvas, etc.)

/**
 * POST /api/ai-image/vector-pdf
 * Body: { url: string, widthMm?: number, heightMm?: number }
 * Devuelve PDF vectorial listo para imprenta.
 */
router.post('/vector-pdf', async (req, res) => {
  let { url, widthMm = 210, heightMm = 297, dpi = 300 } = req.body || {};
  // Cargar dependencias pesadas bajo demanda
  let createCanvas, loadImage, ImageTracer, PDFDocument, SVGtoPDF;
  try {
    const canvasMod = await import('canvas');
    createCanvas = canvasMod.createCanvas;
    loadImage = canvasMod.loadImage;
    const itMod = await import('imagetracerjs').catch(() => null);
    ImageTracer = itMod?.default || itMod;
    const pdfMod = await import('pdfkit');
    PDFDocument = pdfMod.default || pdfMod;
    const svg2pdfMod = await import('svg-to-pdfkit');
    SVGtoPDF = svg2pdfMod.default || svg2pdfMod;
  } catch (e) {
    logger.error('vector-pdf setup failed', e);
    return res.status(501).json({ error: 'feature-disabled', details: 'Raster/vector PDF generation not available on this environment' });
  }
  try {
    const mod = await import('zod').catch(()=>null);
    if (mod) {
      const z = mod.z || mod.default;
      const schema = z.object({
        url: z.string().url(),
        widthMm: z.number().min(10).max(2000).optional().default(210),
        heightMm: z.number().min(10).max(2000).optional().default(297),
        dpi: z.number().min(72).max(1200).optional().default(300),
      });
      const parsed = schema.safeParse({ url, widthMm, heightMm, dpi });
      if (!parsed.success) return res.status(400).json({ error: 'invalid-payload', details: parsed.error.issues?.map(i=>i.message).join('; ') });
      ({ url, widthMm, heightMm, dpi } = parsed.data);
    } else {
      if (!url) return res.status(400).json({ error: 'url required' });
    }
  } catch {}
  try {
    // 1. Descargar la imagen (puede ser PNG o JPEG)
    const imgResp = await axios.get(url, { responseType: 'arraybuffer' });
    const originalBuf = Buffer.from(imgResp.data);

    // 2. Cargar en canvas y vectorizar con ImageTracerJS
    const pxPerMm = dpi / 25.4; // 1 in = 25.4 mm, dpi = dots per inch
    const targetWidthPx = Math.round(widthMm * pxPerMm);
    const targetHeightPx = Math.round(heightMm * pxPerMm);

    // 3. Cargar la imagen con canvas
    const img = await loadImage(originalBuf);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // 4. Obtener ImageData y vectorizar
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const svgString = ImageTracer.imagedataToSVG(imageData, {
      numberofcolors: 32,
      strokewidth: 1,
      ltres: 0.1,
      qtres: 0.1
    });

    // 5. Convertir dimensiones a puntos tipográficos
    const ptPerMm = 72 / 25.4;
    const widthPt = widthMm * ptPerMm;
    const heightPt = heightMm * ptPerMm;

    // 6. Crear PDF e insertar el SVG
    const doc = new PDFDocument({ size: [widthPt, heightPt], margin: 0 });

    // Recoger los datos antes de finalizar el documento
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => {
      const pdfBuf = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=design-vector-color.pdf');
      res.send(pdfBuf);
    });

    // Dibujar el SVG y cerrar
    SVGtoPDF(doc, svgString, 0, 0, { width: widthPt, height: heightPt });
    doc.end();
  } catch (err) {
    logger.error('vector-color-pdf error', err);
    res.status(500).json({ error: 'vector-color-pdf-failed', details: err?.message || 'unknown' });
  }
});

// ---------- SVG vectorization (returns raw SVG) ----------
/**
 * POST /api/ai-image/vectorize-svg
 * Body: { url: string, options?: ImageTracerOptions }
 * Returns: { svg: string }
 */
router.post('/vectorize-svg', async (req, res) => {
  let { url, options } = req.body || {};
  // Cargar dependencias pesadas bajo demanda
  let createCanvas, loadImage, ImageTracer;
  try {
    const canvasMod = await import('canvas');
    createCanvas = canvasMod.createCanvas;
    loadImage = canvasMod.loadImage;
    const itMod = await import('imagetracerjs').catch(() => null);
    ImageTracer = itMod?.default || itMod;
  } catch (e) {
    logger.error('vectorize-svg setup failed', e);
    return res.status(501).json({ error: 'feature-disabled', details: 'SVG vectorization not available on this environment' });
  }
  try {
    const mod = await import('zod').catch(()=>null);
    if (mod){
      const z = mod.z || mod.default;
      const schema = z.object({ url: z.string().url(), options: z.record(z.any()).optional() });
      const parsed = schema.safeParse({ url, options });
      if (!parsed.success) return res.status(400).json({ error: 'invalid-payload', details: parsed.error.issues?.map(i=>i.message).join('; ') });
      ({ url, options } = parsed.data);
    } else {
      if (!url) return res.status(400).json({ error: 'url required' });
    }
  } catch {}
  try {
    const imgResp = await axios.get(url, { responseType: 'arraybuffer' });
    const buf = Buffer.from(imgResp.data);

    // Load in canvas to get ImageData for ImageTracer
    const img = await loadImage(buf);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, img.width, img.height);

    const svgString = ImageTracer.imagedataToSVG(imageData, {
      // Reasonable defaults; can be overridden by options
      numberofcolors: 32,
      strokewidth: 1,
      ltres: 0.1,
      qtres: 0.1,
      ...options,
    });

    res.json({ svg: svgString });
  } catch (err) {
    logger.error('vectorize-svg error', err);
    res.status(500).json({ error: 'vectorize-svg-failed', details: err?.message || 'unknown' });
  }
});

// ---------- SVG -> PDF (edited SVG to print-ready PDF) ----------
/**
 * POST /api/ai-image/svg-to-pdf
 * Body: { svg: string, widthMm?: number, heightMm?: number }
 * Returns: application/pdf
 */
router.post('/svg-to-pdf', async (req, res) => {
  try {
    // Cargar dependencias bajo demanda
    let PDFDocument, SVGtoPDF;
    try {
      const pdfMod = await import('pdfkit');
      PDFDocument = pdfMod.default || pdfMod;
      const svg2pdfMod = await import('svg-to-pdfkit');
      SVGtoPDF = svg2pdfMod.default || svg2pdfMod;
    } catch (e) {
      logger.error('svg-to-pdf setup failed', e);
      return res.status(501).json({ error: 'feature-disabled', details: 'SVG to PDF not available on this environment' });
    }
    let { svg, widthMm = 210, heightMm = 297 } = req.body || {};
    try {
      const mod = await import('zod').catch(()=>null);
      if (mod) {
        const z = mod.z || mod.default;
        const schema = z.object({
          svg: z.string().min(10),
          widthMm: z.number().min(10).max(2000).optional().default(210),
          heightMm: z.number().min(10).max(2000).optional().default(297),
        });
        const parsed = schema.safeParse({ svg, widthMm, heightMm });
        if (!parsed.success) return res.status(400).json({ error: 'invalid-payload', details: parsed.error.issues?.map(i=>i.message).join('; ') });
        ({ svg, widthMm, heightMm } = parsed.data);
      } else {
        if (!svg || typeof svg !== 'string') return res.status(400).json({ error: 'svg required' });
      }
    } catch {}

    const ptPerMm = 72 / 25.4;
    const widthPt = widthMm * ptPerMm;
    const heightPt = heightMm * ptPerMm;

    const doc = new PDFDocument({ size: [widthPt, heightPt], margin: 0 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => {
      const pdfBuf = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=design-edited.pdf');
      res.send(pdfBuf);
    });

    SVGtoPDF(doc, svg, 0, 0, { width: widthPt, height: heightPt });
    doc.end();
  } catch (err) {
    logger.error('svg-to-pdf error', err);
    res.status(500).json({ error: 'svg-to-pdf-failed', details: err?.message || 'unknown' });
  }
});

// ---------- Monochrome vectorization (Potrace) ----------
/**
 * POST /api/ai-image/vectorize-mono
 * Body: { url: string, threshold?: number, color?: string, background?: string }
 * Returns: { svg: string }
 */
router.post('/vectorize-mono', async (req, res) => {
  const { url, threshold = 128, color = '#000000', background = 'transparent' } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url required' });
  try {
    // Cargar potrace bajo demanda
    let potrace;
    try {
      const mod = await import('potrace');
      potrace = mod.default || mod;
    } catch (e) {
      logger.error('vectorize-mono setup failed', e);
      return res.status(501).json({ error: 'feature-disabled', details: 'Monochrome vectorization not available on this environment' });
    }
    const imgResp = await axios.get(url, { responseType: 'arraybuffer' });
    const buf = Buffer.from(imgResp.data);

    const svg = await new Promise((resolve, reject) => {
      potrace.trace(buf, { threshold, color, background }, (err, outSvg) => {
        if (err) return reject(err);
        resolve(outSvg);
      });
    });

    return res.json({ svg });
  } catch (err) {
    logger.error('vectorize-mono error', err);
    res.status(500).json({ error: 'vectorize-mono-failed', details: err?.message || 'unknown' });
  }
});

export default router;
