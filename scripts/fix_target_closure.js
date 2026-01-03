const fs=require('fs');
let s=fs.readFileSync('src/hooks/useSeatingPlan.js','utf8').replace(/\r\n/g,'\n');
const i = s.indexOf('const target = () => {');
if (i>=0){
  const j = s.indexOf('\n', i);
  const segment = s.slice(i, i+2000);
  const k = segment.indexOf('\n    });');
  if (k>0){
    const abs = i + k + 1; // position of '    });'
    s = s.slice(0, abs) + '    };' + s.slice(abs + '    });'.length);
    fs.writeFileSync('src/hooks/useSeatingPlan.js', s, 'utf8');
    console.log('Fixed target() closure.');
  } else {
    console.log('No target closure found');
  }
} else {
  console.log('No target function found');
}
