const fs = require('fs');
let s = fs.readFileSync('src/hooks/useSeatingPlan.js','utf8').replace(/\r\n/g,'\n');
let fixed = 0;
let idx = 0;
while (true) {
  const i = s.indexOf('useCallback(', idx);
  if (i < 0) break;
  // search window of next 1500 chars
  const window = s.slice(i, i + 2000);
  const a = window.indexOf('\n');
  const semiClose = window.indexOf('\n  };');
  const depClose = window.indexOf('\n  }, [');
  if (semiClose !== -1 && depClose !== -1 && semiClose < depClose) {
    const start = i + semiClose;
    const end = i + depClose + '\n  }, ['.length;
    // replace from start to depClose with just "\n  }, ["
    s = s.slice(0, start) + '\n  }, [' + s.slice(i + depClose + '\n  }, ['.length);
    fixed++;
    idx = start + 1;
  } else {
    idx = i + 12;
  }
}
fs.writeFileSync('src/hooks/useSeatingPlan.js', s, 'utf8');
console.log('Fixed useCallback windows:', fixed);
