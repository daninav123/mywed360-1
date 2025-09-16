const fs = require('fs');
const path = require('path');

function countWeird(s){
  const re = /[ÂÃâ�ǟǭǸ]/g; // common mojibake markers
  const m = s.match(re); return m ? m.length : 0;
}

function fixLatin1(content){
  const before = countWeird(content);
  const restored = Buffer.from(content, 'latin1').toString('utf8');
  const after = countWeird(restored);
  return after <= before ? restored : content;
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node scripts/fix-latin1.js <file> [more files...]');
  process.exit(1);
}

for (const rel of files) {
  const file = path.resolve(process.cwd(), rel);
  if (!fs.existsSync(file)) { console.warn('skip (not found):', rel); continue; }
  const original = fs.readFileSync(file, 'utf8');
  const fixed = fixLatin1(original);
  if (fixed !== original) {
    fs.writeFileSync(file, fixed, { encoding: 'utf8' });
    console.log('fixed:', rel);
  } else {
    console.log('nochange:', rel);
  }
}

