const fs = require('fs');
const s = fs.readFileSync('src/hooks/useSeatingPlan.js','utf8');
const lines = s.split(/\r?\n/);
function prevText(idx, chars){
  let pos = 0; for(let i=0;i<idx;i++){ pos += lines[i].length + 1; }
  const start = Math.max(0, pos - chars);
  return s.slice(start, pos+lines[idx].length);
}
let candidates = [];
for (let i=0;i<lines.length;i++){
  if (lines[i].trim()==='};'){
    const ctx = prevText(i, 500);
    if (ctx.includes('useCallback(') && !ctx.includes('], ')){
      candidates.push(i+1);
    }
  }
}
console.log('Problematic }; lines:', candidates);
