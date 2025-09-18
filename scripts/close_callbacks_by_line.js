const fs = require('fs');
const p='src/hooks/useSeatingPlan.js';
let lines = fs.readFileSync(p,'utf8').split(/\r?\n/);
// gather indices of lines containing 'useCallback('
let starts=[];
for(let i=0;i<lines.length;i++){
  if (lines[i].includes('useCallback(')) starts.push(i);
}
let fixes=0;
for (const si of starts){
  for (let j=si+1;j<Math.min(lines.length, si+200); j++){
    if (lines[j].trim()==='};') { lines[j]='  });'; fixes++; break; }
    if (lines[j].includes('});') || lines[j].includes('}, [')) break;
  }
}
fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('Replaced callback closers:', fixes);
