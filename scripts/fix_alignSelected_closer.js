const fs=require('fs');
let lines=fs.readFileSync('src/hooks/useSeatingPlan.js','utf8').split(/\r?\n/);
let idx=-1;
for(let i=0;i<lines.length;i++){ if(lines[i].includes('const alignSelected = useCallback')) { idx=i; break; } }
if(idx>=0){
  for(let j=idx+1;j<Math.min(lines.length, idx+300); j++){
    if(lines[j].trim()==='};'){ lines[j]='  });'; console.log('Fixed alignSelected closer at line', j+1); break; }
  }
  fs.writeFileSync('src/hooks/useSeatingPlan.js', lines.join('\n'), 'utf8');
}else{
  console.log('alignSelected not found');
}
