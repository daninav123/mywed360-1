const fs = require('fs');
let s = fs.readFileSync('src/hooks/useSeatingPlan.js','utf8').replace(/\r\n/g,'\n');
let idx = 0, fixes=0;
while (true) {
  const start = s.indexOf('useCallback(', idx);
  if (start < 0) break;
  const arrow = s.indexOf('=>', start);
  if (arrow < 0) { idx = start + 12; continue; }
  let pos = s.indexOf('{', arrow);
  if (pos < 0) { idx = start + 12; continue; }
  let depth = 0;
  for (; pos < s.length; pos++) {
    const ch = s[pos];
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { pos++; break; } }
  }
  if (depth !== 0) { break; }
  // skip whitespace
  let wsEnd = pos;
  while (wsEnd < s.length && /\s/.test(s[wsEnd])) wsEnd++;
  if (s[wsEnd] === ';') {
    s = s.slice(0, wsEnd) + ');' + s.slice(wsEnd+1);
    fixes++;
    idx = wsEnd + 2;
  } else {
    idx = wsEnd + 1;
  }
}
fs.writeFileSync('src/hooks/useSeatingPlan.js', s, 'utf8');
console.log('Rewrote endings for useCallback bodies:', fixes);
