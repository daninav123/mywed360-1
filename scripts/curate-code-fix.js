#!/usr/bin/env node
// Curated fixes for mojibake in selected code files (ES + FR text)
const fs = require('fs');

const files = [
  'src/pages/Proveedores.jsx',
  'src/hooks/useGuests.js',
  'src/hooks/useSeatingPlan.js',
  'scripts/normalize-docs.js',
  'src/i18n/locales/fr/common.json',
  'cypress/e2e/guests/guest-copy-rsvp.cy.js',
].filter(f => fs.existsSync(f));

const map = new Map([
  // Generic Spanish
  ['Gestin', 'Gestin'], ['gestin', 'gestin'], ['lgica', 'lgica'],
  ['Informacin', 'Informacin'], ['informacin', 'informacin'],
  ['Descripcin', 'Descripcin'], ['descripcin', 'descripcin'],
  ['Funcin', 'Funcin'], ['funcin', 'funcin'],
  ['Ubicacin', 'Ubicacin'], ['ubicacin', 'ubicacin'],
  ['sincronizacin', 'sincronizacin'], ['Configuracin', 'Configuracin'],
  ['Seleccin', 'Seleccin'], ['Animacin', 'Animacin'], ['Decoracin', 'Decoracin'],
  ['Peluquera', 'Peluquera'], ['Joyera', 'Joyera'], ['categora', 'categora'],
  ['ttulo', 'ttulo'], ['Lmite', 'Lmite'], ['mnimos', 'mnimos'],
  ['crtico', 'crtico'], ['especfico', 'especfico'], ['especficos', 'especficos'],
  ['especfica', 'especfica'], ['despus', 'despus'], ['parmetro', 'parmetro'],
  ['pestaas', 'pestaas'], ['Pestaas', 'Pestaas'], ['pestaa', 'pestaa'],
  ['tambin', 'tambin'], ['bsqueda', 'bsqueda'], ['ms', 'ms'],
  ['Msica', 'Msica'], ['Msica', 'Msica'], ['Vdeo', 'Vdeo'], ['Vdeo', 'Vdeo'],
  ['Fotografa', 'Fotografa'], ['Fotografa', 'Fotografa'], ['Diseo', 'Diseo'],
  ['Espaa', 'Espaa'], ['Telfono', 'Telfono'], ['nmero', 'nmero'],
  ['aqu', 'aqu'], ['buzn', 'buzn'], ['Direccin', 'Direccin'],
  ['Acompaantes', 'Acompaantes'], ['Dietticas', 'Dietticas'],
  ['Garca', 'Garca'], ['Martnez', 'Martnez'], ['S', 'S'], ['Llegar', 'Llegar'],
  ['Hola', 'Hola'], ['encantara', 'encantara'], ['Puedes', 'Puedes'], ['Se abrir', 'Se abrir'],
  ['Aadir', 'Aadir'], ['aadir', 'aadir'], ['aade', 'aade'], ['pequea', 'pequea'],
  ['otoo', 'otoo'], ['Pas', 'Pas'], ['Regin', 'Regin'],

  // Names in sample data
  ['Prez', 'Prez'], ['Gmez', 'Gmez'], ['Diseo', 'Diseo'],

  // French accents commonly broken
  ['Succs', 'Succs'], ['Prcdent', 'Prcdent'], ['Paramtres', 'Paramtres'],
  ['Dconnexion', 'Dconnexion'], ['Crer', 'Crer'], ['Crez', 'Crez'],
  ['russie', 'russie'], ['Tches', 'Tches'], ['Invits', 'Invits'],
  ['Marie', 'Marie'], ['Mari', 'Mari'], ['Crmonie', 'Crmonie'],
  ['Rception', 'Rception'], ['Dtails', 'Dtails'], ['Vidaste', 'Vidaste'],
  ['Dpenses', 'Dpenses'], ['Mthode', 'Mthode'], ['Aperu', 'Aperu'],
  ['Rpartition', 'Rpartition'], ['Bote', 'Bote'], ['Envoys', 'Envoys'],
  ['Rdiger', 'Rdiger'], ['Rpondre', 'Rpondre'], ['Transfrer', 'Transfrer'],
  ['Tlphone', 'Tlphone'], ['Dsassigner', 'Dsassigner'],
]);

let changedFiles = 0;

for (const f of files) {
  const inText = fs.readFileSync(f, 'utf8');
  let outText = inText;
  for (const [bad, good] of map.entries()) {
    outText = outText.split(bad).join(good);
  }
  if (outText !== inText) {
    fs.writeFileSync(f, outText, 'utf8');
    changedFiles++;
    console.log('Fixed:', f);
  }
}

console.log(JSON.stringify({ changedFiles }, null, 2));

