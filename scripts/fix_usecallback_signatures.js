const fs = require('fs');
let s = fs.readFileSync('src/hooks/useSeatingPlan.js','utf8');
const before = s;
s = s.replace(/useCallback\(([^)]*?)\)\s*=>\s*\{/g, 'useCallback(($1) => {');
if (s !== before){ fs.writeFileSync('src/hooks/useSeatingPlan.js', s, 'utf8'); console.log('Fixed useCallback arrow signatures'); } else { console.log('No signature issues found'); }
