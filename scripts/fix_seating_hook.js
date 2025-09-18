const fs = require('fs');
const path = 'src/hooks/useSeatingPlan.js';
let txt = fs.readFileSync(path, 'utf8');
const key = "table-update-field";
const ki = txt.indexOf(key);
if (ki !== -1) {
  const after = txt.slice(ki);
  const pat = /\r?\n\s*\};\r?\n/;
  const m = pat.exec(after);
  if (m) {
    const start = ki + m.index;
    const end = start + m[0].length;
    txt = txt.slice(0, start) + '\n' + txt.slice(end);
    fs.writeFileSync(path, txt, 'utf8');
    console.log('Removed stray closure after anchor');
    process.exit(0);
  }
}
console.log('No change');
