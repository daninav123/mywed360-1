#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const files = [
  path.resolve('src/i18n/locales/en/common.json'),
  path.resolve('src/i18n/locales/es/common.json'),
  path.resolve('src/i18n/locales/fr/common.json')
];

function read(p){ let t = fs.readFileSync(p,'utf8'); if (t.charCodeAt(0)===0xFEFF) t=t.slice(1); return JSON.parse(t); }
function write(p,o){ fs.writeFileSync(p, JSON.stringify(o,null,2)+'\n', 'utf8'); }

function recodeLatin1ToUtf8(s){
  try { const buf = Buffer.from(s, 'latin1'); const s2 = buf.toString('utf8'); const score = (x)=> (x.match(/[Ã�]/g)||[]).length; return score(s2) < score(s) ? s2 : s; } catch { return s; }
}

const replacements = [
  // Generic UTF-8 artifacts
  [/Ã¢â€šÂ¬/g, '€'], [/Ã¢â‚¬Â¦/g, '…'], [/Ã¢â‚¬â€œ/g, '–'], [/Ã¢â‚¬â€/g, '—'], [/Ã¢â‚¬Âœ/g, '“'], [/Ã¢â‚¬Â/g, '”'], [/Ã¢â‚¬â„¢/g, '’'], [/Ã¢â‚¬â€™/g, '’'],
  // ES
  [/A�adir/g, 'Añadir'], [/AÃ±adir/g, 'Añadir'], [/A��adir/g, 'Añadir'],
  [/S�/g, 'Sí'], [/SÃ­/g, 'Sí'], [/S��/g, 'Sí'],
  [/M�+s/g, 'Más'], [/MÃ¡s/g, 'Más'], [/Mǭs/g, 'Más'], [/M��s/g, 'Más'],
  [/Configuraci�+n/g, 'Configuración'], [/ConfiguraciÃ³n/g, 'Configuración'], [/Configuraci��n/g, 'Configuración'],
  [/Dise�+os/g, 'Diseños'], [/DiseÃ±os/g, 'Diseños'],
  [/Cerrar Sesi�+n/g, 'Cerrar Sesión'], [/Iniciar Sesi�+n/g, 'Iniciar Sesión'],
  [/Contrase�+a/g, 'Contraseña'], [/Confirmar Contrase�+a/g, 'Confirmar Contraseña'],
  [/Correo Electr�+nico/g, 'Correo Electrónico'],
  [/Tel�+fono/g, 'Teléfono'], [/Direcci�+n/g, 'Dirección'],
  [/Ma�+ana/g, 'Mañana'], [/Pr�+xima/g, 'Próxima'], [/Pr�+ximo/g, 'Próximo'],
  [/�xito/g, 'Éxito'], [/Ã‰xito/g, 'Éxito'],
  // FR
  [/Param�+tres/g, 'Paramètres'], [/D�+connexion/g, 'Déconnexion'], [/T�+ches/g, 'Tâches'],
  [/Cr�+er/g, 'Créer'], [/R�+initialiser/g, 'Réinitialiser'],
  [/Invit�+s/g, 'Invités'], [/invit�s/g, 'invités'], [/invit�/g, 'invité'],
  [/T�l�phone/g, 'Téléphone'], [/D�sassigner/g, 'Désassigner'], [/S�lectionnez/g, 'Sélectionnez'],
  [/estim�/g, 'estimé'], [/ic�ne/g, 'icône'], [/assign�s/g, 'assignés'], [/assign�/g, 'assigné']
];

function cleanString(s){
  if (typeof s !== 'string') return s;
  let out = s;
  if (/[Ã�]/.test(out)) out = recodeLatin1ToUtf8(out);
  for (const [re, val] of replacements) out = out.replace(re, val);
  out = out.replace(/�+/g, '');
  out = out.replace(/ǭ/g, 'á');
  return out;
}

function walk(obj){
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(walk);
  const res = {};
  for (const [k,v] of Object.entries(obj)){
    const nk = cleanString(k);
    res[nk] = (typeof v === 'object') ? walk(v) : cleanString(v);
  }
  return res;
}

for (const f of files){
  if (!fs.existsSync(f)) continue;
  const json = read(f);
  const cleaned = walk(json);
  write(f, cleaned);
  console.log('Cleaned', f);
}
