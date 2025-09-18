const fs = require('fs');
const path = 'src/hooks/useSeatingPlan.js';
let txt = fs.readFileSync(path, 'utf8');
// Normalize Windows newlines to \n for processing
let s = txt.replace(/\r\n/g, '\n');
let changed = false;
// Pattern: end of function body followed by stray closure and separate deps line
// Replace sequences like "\n  };\n\n  }, [deps]);" with "\n  }, [deps]);"
s = s.replace(/\n([ \t]*)\};\n\n\1\}, \[(.*?)\]\);/g, (m, indent, deps) => { changed = true; return `\n${indent}}, [${deps}]);`; });
// Also if only one newline between
s = s.replace(/\n([ \t]*)\};\n\1\}, \[(.*?)\]\);/g, (m, indent, deps) => { changed = true; return `\n${indent}}, [${deps}]);`; });
if (changed) {
  fs.writeFileSync(path, s, 'utf8');
  console.log('Fixed separated useCallback dependency arrays');
} else {
  console.log('No separated useCallback dependency arrays found');
}
