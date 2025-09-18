const fs = require('fs');
const p = 'src/pages/More.jsx';
const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
function setLine(n, text){ if(n>=1 && n<=lines.length){ lines[n-1] = text; } }
setLine(20, "  const pfDisenos = () => prefetchModule('DisenosLayout', () => import('./disenos/DisenosLayout'));");
// Update call site in extras menu
setLine(39, "    pfDisenos();");
fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('Patched More.jsx prefetch Disenos');
