const fs=require('fs');
const p='src/hooks/useSeatingPlan.js';
const lines=fs.readFileSync(p,'utf8').split(/\r?\n/);
if(lines[1825-1].trim()==='};'){
  lines[1825-1]='  });';
  fs.writeFileSync(p, lines.join('\n'), 'utf8');
  console.log('Replaced line 1825 with "));"');
}else{
  console.log('Line 1825 was:', JSON.stringify(lines[1825-1]));
}
