const fs=require('fs');
const p='src/hooks/useSeatingPlan.js';
let lines=fs.readFileSync(p,'utf8').split(/\r?\n/);
let removed=0;
lines = lines.filter(line => {
  if (/^\s*\}, \[.*\]\);\s*$/.test(line)) { removed++; return false; }
  return true;
});
fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('Removed misplaced dependency array lines:', removed);
