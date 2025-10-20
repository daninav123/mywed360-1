function readJson(p){ let txt = fs.readFileSync(p,'+"'utf8'"+'); if(txt.charCodeAt(0)===0xFEFF) txt=txt.slice(1); return JSON.parse(txt); }
function writeJson(p,obj){ const txt = JSON.stringify(obj,null,2)+'+"\n"+'; fs.writeFileSync(p,txt,{encoding:'+"'utf8'"+'}); }#!/usr/bin/env node
/**
 * Sync i18n locale files with EN as source of truth.
 * - Fills missing keys from EN
 * - Keeps existing translations
 * - Applies minimal curated fixes for ES accents and key labels
 * Usage: node scripts/syncLocales.js [es]
 */
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.resolve(process.cwd(), 'src/i18n/locales');
const BASE = 'en';
const TARGETS = process.argv.slice(2).length ? process.argv.slice(2) : ['es'];

function walkJsonFiles(dir){
  const out=[]; if(!fs.existsSync(dir)) return out;
  for(const e of fs.readdirSync(dir, {withFileTypes:true})){
    const p = path.join(dir, e.name);
    if(e.isDirectory()) out.push(...walkJsonFiles(p));
    else if(e.isFile() && e.name.endsWith('.json')) out.push(p);
  }
  return out;
}

function main(){
  const baseDir = path.join(LOCALES_DIR, BASE);
  const baseFiles = walkJsonFiles(baseDir);
  // also build union of filenames across locales for parity
  const unionFiles = new Set(baseFiles.map(p=>path.relative(baseDir,p)));
  for(const loc of TARGETS){
    const locDir = path.join(LOCALES_DIR, loc);
    for(const f of walkJsonFiles(locDir)){
      unionFiles.add(path.relative(locDir,f));
    }
  }
  for(const rel of unionFiles){
    const basePath = path.join(baseDir, rel);
    const hasBase = fs.existsSync(basePath);
    const baseJson = hasBase ? readJson(basePath) : {};
    for(const loc of TARGETS){
      const file = path.join(LOCALES_DIR, loc, rel);
      let current = fs.existsSync(file) ? readJson(file) : {};
      const merged = fillMissing(current, baseJson);
      applyCuratedFixes(loc, merged);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      writeJson(file, merged);
      console.log(`Synced ${loc}/${rel}`);
    }
  }
}

main();
