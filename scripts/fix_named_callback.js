const fs = require('fs');
let s = fs.readFileSync('src/hooks/useSeatingPlan.js','utf8').replace(/\r\n/g,'\n');
function fixClosure(name, deps){
  const start = s.indexOf(`const ${name} = useCallback(`);
  if (start < 0) { console.log('Not found', name); return; }
  const after = s.slice(start);
  const closeIdx = after.indexOf('\n  };');
  if (closeIdx >= 0) {
    const globCloseIdx = start + closeIdx;
    s = s.slice(0, globCloseIdx) + `\n  }, [${deps}]);` + s.slice(globCloseIdx + 5);
    console.log('Fixed', name);
  } else {
    console.log('No simple close for', name);
  }
}
fixClosure('distributeSelected', 'selectedIds, selectedTable, tables, setTables, pushHistory, tab');
fs.writeFileSync('src/hooks/useSeatingPlan.js', s, 'utf8');
