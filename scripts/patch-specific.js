#!/usr/bin/env node
const fs = require('fs');

const targets = [
  'src/pages/Proveedores.jsx',
  'src/hooks/useGuests.js',
  'src/hooks/useSeatingPlan.js',
  'cypress/e2e/guests/guest-copy-rsvp.cy.js',
].filter(f => fs.existsSync(f));

const pairs = [
  // Names and common UI words
  ['Prez','Prez'], ['Prez','Prez'],
  ['Gmez','Gmez'], ['Gmez','Gmez'],
  ['Diseo','Diseo'], ['Diseo','Diseo'],
  ['Fotografa','Fotografa'], ['Fotografa','Fotografa'],
  ['Msica','Msica'], ['Msica','Msica'],
  ['Vdeo','Vdeo'], ['Vdeo','Vdeo'],
  ['Gestin','Gestin'], ['Gestin','Gestin'],
  ['lgica','lgica'], ['lgica','lgica'],
  ['Garca','Garca'], ['Garca','Garca'],
  ['S','S'], ['S','S'],
  ['Martnez','Martnez'], ['Martnez','Martnez'],
  ['Llegar','Llegar'], ['Llegar','Llegar'],
  ['coleccin','coleccin'], ['coleccin','coleccin'],
  ['sincronizacin','sincronizacin'], ['sincronizacin','sincronizacin'],
  ['Aadir','Aadir'], ['Aadir','Aadir'],
  ['pequea','pequea'], ['pequea','pequea'],
  ['Tamao','Tamao'], ['Tamao','Tamao']
];

for (const f of targets) {
  let t = fs.readFileSync(f,'utf8');
  const before = t;
  // Drop BOM if present
  if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1);
  // Drop stray first replacement-char before import or comment
  if (t.startsWith('\ufeff') || t.startsWith('') || t.startsWith('import') || t.startsWith('///') || t.startsWith('')) {
    t = t.replace(/^\ufeff/,'').replace(/^/,'').replace(/^(?=(import|\/\/|\/\*|###|\s*<|\s*describe\())/,'');
  }
  for (const [a,b] of pairs) t = t.split(a).join(b);
  if (t !== before) {
    fs.writeFileSync(f,t,'utf8');
    console.log('Patched:', f);
  }
}
