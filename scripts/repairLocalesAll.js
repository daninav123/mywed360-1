#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve('src/i18n/locales');

function load(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function save(p,o){ fs.writeFileSync(p, JSON.stringify(o,null,2)+'\n','utf8'); }

function walk(v, fn){
  if (Array.isArray(v)) return v.map(x=>walk(x,fn));
  if (v && typeof v === 'object') { const out={}; for (const [k,val] of Object.entries(v)) out[k]=walk(val,fn); return out; }
  if (typeof v === 'string') return fn(v);
  return v;
}

function cleanArrows(s){ return s.replace(/ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢|Ã¢â€ â€™/g,'›'); }

function fixEs(s){
  let t = s;
  const reps = [
    [/Ã‰xito|�xito/g,'Éxito'],
    [/�¿/g,'' ],
    [/�¡/g,'¡'],
    [/�/g,'' ],
    [/Â€/g,'€'], [/â‚¬/g,'€'],
    [/altima|�altima/gi,'Última'],
    [/sincronizaci(Ã³|��)n/gi,'sincronización'],
    [/conexi(Ã³|��)n/gi,'conexión'],
    [/categor(Ã­a|��a)s?/gi,(m)=> m.toLowerCase().includes('s')?'categorías':'categoría'],
    [/Transacci(Ã³|��)n/gi,'Transacción'],
    [/Descripci(Ã³|��)n/gi,'Descripción'],
    [/d(Ã­|��)as/gi,'días'],
    [/Pa(Ã­|��)s/gi,'País'],
    [/Espa(Ã±|��)a/gi,'España'],
  ];
  for (const [re,to] of reps) t = t.replace(re,to);
  return t;
}

function fixFr(s){
  return s.replace(/T\u00e2ches|TÃ¢ches/g,'Tâches').replace(/Ãƒâ‚¬/g,'À');
}

for (const lng of fs.readdirSync(ROOT)){
  const dir = path.join(ROOT,lng);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir)){
    if (!f.endsWith('.json')) continue;
    const p = path.join(dir,f);
    let j = load(p);
    j = walk(j, (s)=> cleanArrows(lng==='en'?s:s));
    if (lng==='es') j = walk(j, fixEs);
    if (lng==='fr') j = walk(j, fixFr);
    save(p,j);
    console.log('fixed', p);
  }
}
