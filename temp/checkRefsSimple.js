const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const DOCS = path.join(ROOT, 'docs');

function walk(dir, acc=[]) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc); else acc.push(full);
  }
  return acc;
}
const repoFiles = walk(ROOT, []).filter(f => !f.includes(`${path.sep}.git${path.sep}`) && !f.includes(`${path.sep}node_modules${path.sep}`));
const basenames = new Set(repoFiles.map(f => path.basename(f)));
const docFiles = walk(DOCS);
const regex = /`([^`]+\.(?:jsx|js|ts|tsx|json))`/g;
const missing = [];
for (const docFile of docFiles) {
  const text = fs.readFileSync(docFile, 'utf8');
  let match;
  while ((match = regex.exec(text)) !== null) {
    const base = path.basename(match[1]);
    if (!basenames.has(base)) missing.push({ ref: match[1], doc: path.relative(DOCS, docFile) });
  }
}
console.log(JSON.stringify(missing, null, 2));
