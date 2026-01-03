/*
 Generates PWA icons from public/maloveapp-logo.png into standard sizes.
 Requires `sharp` (already in dev dependencies).
*/
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function ensureDir(p) {
  await fs.promises.mkdir(p, { recursive: true });
}

async function generate() {
  const src = path.resolve('public', 'maloveapp-logo.png');
  const outDir = path.resolve('public');

  if (!fs.existsSync(src)) {
    console.error('Source logo not found at public/maloveapp-logo.png');
    process.exit(1);
  }

  await ensureDir(outDir);

  const targets = [
    { file: 'icon-192.png', size: 192 },
    { file: 'icon-512.png', size: 512 },
    { file: 'badge-72.png', size: 72 }
  ];

  for (const t of targets) {
    const out = path.join(outDir, t.file);
    await sharp(src)
      .resize(t.size, t.size, { fit: 'cover' })
      .png({ quality: 90 })
      .toFile(out);
    console.log('Generated', out);
  }
}

generate().catch((e) => {
  console.error(e);
  process.exit(1);
});
