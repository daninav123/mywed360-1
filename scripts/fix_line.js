const fs = require('fs');
const path = 'src/hooks/useSeatingPlan.js';
let lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
const idx = 1789; // 0-based index for line 1790
if (lines[idx] && lines[idx].trim() === '};') {
  lines.splice(idx, 1);
  fs.writeFileSync(path, lines.join('\n'), 'utf8');
  console.log('Removed line 1790');
} else {
  console.log('Did not match at 1790, found:', JSON.stringify(lines[idx] || ''));
}
