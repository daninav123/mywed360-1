const fs = require('fs');
const path = 'src/hooks/useSeatingPlan.js';
let s = fs.readFileSync(path, 'utf8').replace(/\r\n/g,'\n');
const i = s.indexOf('const updateTableField = useCallback');
console.log('idx', i);
if (i>=0){
  const seg = s.slice(i, i+400);
  console.log(seg);
}
