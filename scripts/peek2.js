const fs = require('fs');
let s = fs.readFileSync('src/hooks/useSeatingPlan.js','utf8').replace(/\r\n/g,'\n');
const i = s.indexOf('const updateTableField = useCallback');
const seg = s.slice(i, i+800);
console.log(seg);
