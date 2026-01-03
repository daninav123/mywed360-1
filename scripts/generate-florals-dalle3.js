#!/usr/bin/env node

import 'dotenv/config';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID,
});

const FLORALS = [
  {
    name: 'rose-spray.png',
    prompt: 'Watercolor rose spray decoration, flowing floral element, pink and white roses, transparent background, wedding invitation accent, delicate artistic style',
    size: '1024x1024',
  },
  {
    name: 'peony-cluster.png',
    prompt: 'Watercolor peony cluster, corner decoration, soft pink peonies, transparent background, romantic wedding floral element, delicate artistic style',
    size: '1024x1024',
  },
  {
    name: 'olive-branch-watercolor.png',
    prompt: 'Watercolor olive branch, mediterranean style, green leaves, transparent background, elegant botanical wedding decoration, delicate artistic style',
    size: '1024x1024',
  },
  {
    name: 'wreath-greenery.png',
    prompt: 'Watercolor greenery wreath, eucalyptus and olive leaves, circular frame, transparent background, natural wedding decoration, delicate artistic style',
    size: '1024x1024',
  },
];

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function generateFloral(config, index, total) {
  const outputPath = path.join(rootDir, 'public/assets/florals', config.name);
  const dir = path.dirname(outputPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(outputPath)) {
    console.log(`   ⏭️  Ya existe: ${config.name}`);
    return { success: true, cached: true };
  }

  try {
    console.log(`   🎨 [${index}/${total}] Generando: ${config.name}`);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: config.prompt,
      n: 1,
      size: config.size,
      quality: 'standard',
      style: 'natural',
    });

    const imageUrl = response.data[0].url;
    console.log(`   ⬇️  Descargando...`);
    await downloadImage(imageUrl, outputPath);
    console.log(`   ✅ Guardada: ${config.name}`);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true, cached: false };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('\n🌸 Generando imágenes florales faltantes...\n');

  let generated = 0;
  let cached = 0;

  for (let i = 0; i < FLORALS.length; i++) {
    const result = await generateFloral(FLORALS[i], i + 1, FLORALS.length);
    if (result.success) {
      if (result.cached) cached++;
      else generated++;
    }
  }

  console.log(`\n✅ Completado: ${generated} generadas, ${cached} existentes`);
  console.log(`💰 Costo: $${(generated * 0.04).toFixed(2)}\n`);
}

main().catch(console.error);
