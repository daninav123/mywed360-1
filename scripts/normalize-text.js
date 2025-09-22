const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function countSuspects(str) {
  // Common mojibake markers from UTF-8 mis-decoding (widened)
  const re = /(Ã|Â|â|�|ǟ)/g;
  const m = str.match(re);
  return m ? m.length : 0;
}

function fixContent(original) {
  let s = original;
  const before = countSuspects(s);
  if (before > 0) {
    try {
      const restored = Buffer.from(s, 'latin1').toString('utf8');
      if (countSuspects(restored) <= before) s = restored;
    } catch {}
  }
  return s;
}

function walk(dir, exts) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p, exts));
    else if (exts.includes(path.extname(entry.name))) out.push(p);
  }
  return out;
}

const inputDirs = process.argv.slice(2);
const targetDirs = inputDirs.length ? inputDirs : ['src'];
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.html', '.md'];
let changedCount = 0;
for (const relDir of targetDirs) {
  const dir = path.join(ROOT, relDir);
  if (!fs.existsSync(dir)) continue;
  const files = walk(dir, EXTENSIONS);
  for (const f of files) {
    const orig = fs.readFileSync(f, 'utf8');
    const fixed = fixContent(orig);
    if (fixed !== orig) {
      fs.writeFileSync(f, fixed, { encoding: 'utf8' });
      changedCount++;
      console.log('normalized:', path.relative(ROOT, f));
    }
  }
}
console.log('done:', changedCount);

