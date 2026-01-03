const fs = require('fs');
const lines = fs.readFileSync('src/hooks/useSeatingPlan.js','utf8').split(/\r?\n/);
for (let i=0;i<lines.length;i++){
  if (lines[i].trim()==='};'){
    const start = Math.max(0, i-3);
    const end = Math.min(lines.length, i+4);
    console.log('--- at', i+1, '---');
    for(let j=start;j<end;j++) console.log((j+1)+': '+lines[j]);
  }
}
