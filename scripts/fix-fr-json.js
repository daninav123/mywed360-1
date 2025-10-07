#!/usr/bin/env node
const fs = require('fs');
const f = 'src/i18n/locales/fr/common.json';
if (!fs.existsSync(f)) process.exit(0);
let t = fs.readFileSync(f,'utf8');
const pairs = [
  ['organis numriquement','organis numriquement'],
  ['Succs','Succs'],
  ['Prcdent','Prcdent'],
  ['Paramtres','Paramtres'],
  ['Dconnexion','Dconnexion'],
  ['Crer','Crer'],
  ['Crez','Crez'],
  ['russie','russie'],
  ['Tches','Tches'],
  ['Invits','Invits'],
  ['Invit','Invit'],
  ['Marie','Marie'],
  ['Mari','Mari'],
  ['Crmonie','Crmonie'],
  ['Rception','Rception'],
  ['Dtails','Dtails'],
  ['Vidaste','Vidaste'],
  ['Dpenses','Dpenses'],
  ['Mthode','Mthode'],
  ['Aperu','Aperu'],
  ['Rpartition','Rpartition'],
  ['Bote','Bote'],
  ['Envoys','Envoys'],
  ['Rdiger','Rdiger'],
  ['Rpondre','Rpondre'],
  ['Transfrer','Transfrer'],
  ['Tlphone','Tlphone'],
  ['Dsassigner','Dsassigner'],
  ['oubli','oubli'],
  ['Rinitialiser','Rinitialiser'],
  ['dj','dj'],
  ['Crez','Crez'],
  ['prsence','prsence'],
  ['spciales','spciales'],
  ['Confirm','Confirm'],
  ['Refus','Refus'],
  ['caractres','caractres'],
];
for (const [a,b] of pairs){ t = t.split(a).join(b) }
fs.writeFileSync(f,t,'utf8');
console.log('Patched FR accents in', f);

