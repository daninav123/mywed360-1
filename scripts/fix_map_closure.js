const fs=require('fs');
let s=fs.readFileSync('src/hooks/useSeatingPlan.js','utf8');
s=s.replace(/const sized = sanitized\.map\(t => \{[\s\S]*?\n\s*\};/m, (m)=> m.replace(/\n\s*\};/,'\n    });'));
fs.writeFileSync('src/hooks/useSeatingPlan.js', s, 'utf8');
console.log('Fixed sanitized.map closure');
