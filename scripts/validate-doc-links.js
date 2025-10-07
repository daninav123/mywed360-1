#!/usr/bin/env node
/**
 * Validate Markdown links under docs/.
 * - Checks that local file links exist (relative or docs-root relative)
 * - Skips external links (http/https/mailto/tel/data)
 * - Ignores pure anchors (#...)
 * Exits 1 if any broken link is found; prints a summary.
 */
const fs = require('fs');
const path = require('path');

const DOCS_ROOT = path.resolve(process.cwd(), 'docs');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.isFile() && /\.md$/i.test(entry.name)) out.push(p);
  }
  return out;
}

function isExternal(href) {
  return /^(https?:\/\/|mailto:|tel:|data:)/i.test(href);
}

function validateFileLink(fromFile, href) {
  // Remove anchor if present
  const [filePart] = href.split('#');
  if (!filePart || filePart.trim() === '') return true; // anchors validated later (skipped)

  // Resolve relative to current file
  let target;
  if (filePart.startsWith('/')) {
    // Treat as repo-root absolute: try from docs root first
    target = path.resolve(DOCS_ROOT, '.' + filePart);
  } else {
    target = path.resolve(path.dirname(fromFile), filePart);
  }

  // If no extension, try .md
  const candidates = [target];
  if (!path.extname(target)) candidates.push(target + '.md');

  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return true;
    } catch {}
  }
  return false;
}

function main() {
  if (!fs.existsSync(DOCS_ROOT)) {
    console.error('docs/ folder not found');
    process.exit(2);
  }
  const files = walk(DOCS_ROOT);
  const linkRe = /\[[^\]]*\]\(([^)]+)\)/g; // capture href
  const broken = [];

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    let m;
    while ((m = linkRe.exec(text)) !== null) {
      const hrefRaw = m[1].trim();
      if (!hrefRaw) continue;
      if (isExternal(hrefRaw)) continue;
      if (hrefRaw.startsWith('#')) continue; // in-file anchor

      const ok = validateFileLink(file, hrefRaw);
      if (!ok) broken.push({ file, href: hrefRaw });
    }
  }

  if (broken.length) {
    console.error('Broken documentation links found:');
    for (const b of broken) {
      console.error(` - ${path.relative(process.cwd(), b.file)} -> ${b.href}`);
    }
    process.exit(1);
  }
  console.log(`OK: ${files.length} files scanned, no broken links.`);
}

main();

