const fs = require('fs');
let s = fs.readFileSync('src/hooks/useSeatingPlan.js','utf8').replace(/\r\n/g,'\n');
const before = s;
s = s.replace(/\n[ \t]*\};\n[ \t]*\}, \[/g, '\n  }, [');
if (s !== before){ fs.writeFileSync('src/hooks/useSeatingPlan.js', s, 'utf8'); console.log('Patched all split useCallback closures'); } else { console.log('No patterns found'); }
