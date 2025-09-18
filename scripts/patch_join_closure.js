const fs = require('fs');
let s = fs.readFileSync('src/hooks/useSeatingPlan.js','utf8').replace(/\r\n/g,'\n');
s = s.replace(/\n\s*\};\n\s*\}, \[/, (m)=>{ return '\n  }, ['; });
fs.writeFileSync('src/hooks/useSeatingPlan.js', s, 'utf8');
console.log('Patched separated closure after updateTableField');
