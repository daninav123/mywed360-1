const fs = require('fs');
const path = 'src/hooks/useSeatingPlan.js';
let s = fs.readFileSync(path, 'utf8').replace(/\r\n/g,'\n');
const start = s.indexOf('const updateTableField = useCallback');
if (start >= 0) {
  const segment = s.slice(start, start + 1000);
  const before = segment;
  const fixed = segment.replace(/\n\s*\};\n+\s*\}, \[/, (m) => '\n  }, [');
  if (fixed !== before) {
    s = s.slice(0, start) + fixed + s.slice(start + before.length);
    fs.writeFileSync(path, s, 'utf8');
    console.log('Fixed updateTableField closure.');
  } else {
    console.log('No change for updateTableField.');
  }
} else {
  console.log('updateTableField not found');
}
