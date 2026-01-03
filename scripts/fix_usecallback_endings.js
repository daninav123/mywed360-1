const fs = require('fs');
let s = fs.readFileSync('src/hooks/useSeatingPlan.js','utf8').replace(/\r\n/g,'\n');
let idx = 0, fixes=0;
while (true) {
  const start = s.indexOf('useCallback(', idx);
  if (start < 0) break;
  // find arrow '=>'
  const arrow = s.indexOf('=>', start);
  if (arrow < 0) { idx = start + 12; continue; }
  // find first '{' after arrow
  let pos = s.indexOf('{', arrow);
  if (pos < 0) { idx = start + 12; continue; }
  let depth = 0;
  for (; pos < s.length; pos++) {
    const ch = s[pos];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { pos++; break; }
    }
  }
  if (depth !== 0) { console.log('Unbalanced after', start); break; }
  // pos is index right after the closing '}' of the callback body
  // Expect to see ';' directly next (wrong) or '),'
  const tail = s.slice(pos, pos+10);
  if (tail.startsWith(';')) {
    // replace with ');'
    s = s.slice(0, pos) + ');' + s.slice(pos+1);
    fixes++;
    idx = pos + 2;
  } else {
    idx = pos;
  }
}
fs.writeFileSync('src/hooks/useSeatingPlan.js', s, 'utf8');
console.log('Rewrote endings for useCallback bodies:', fixes);
