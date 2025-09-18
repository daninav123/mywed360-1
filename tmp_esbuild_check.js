const fs = require('fs');
const esbuild = require('esbuild');
try {
  const code = fs.readFileSync('src/hooks/useSeatingPlan.js', 'utf8');
  const out = esbuild.transformSync(code, { loader: 'jsx' });
  console.log('OK');
} catch (e) {
  console.error('ERR', e.message);
  if (e.errors) {
    for (const er of e.errors) {
      console.error(er.location);
      console.error(er.text);
    }
  }
}
