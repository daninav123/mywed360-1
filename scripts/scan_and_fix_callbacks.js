const fs = require('fs');
let s = fs.readFileSync('src/hooks/useSeatingPlan.js','utf8').replace(/\r\n/g,'\n');
let idx = 0, fixes=0, report=[];
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
  // pos at char after closing }
  let ws = pos; while (ws < s.length && /\s/.test(s[ws])) ws++;
  const next = s[ws];
  report.push({start, after: s.slice(ws, ws+5)});
  if (next === ';') { s = s.slice(0, ws) + ');' + s.slice(ws+1); fixes++; }
  idx = ws + 1;
}
fs.writeFileSync('src/hooks/useSeatingPlan.js', s, 'utf8');
console.log('callbacks scanned, fixes:', fixes);
//console.log(report)
