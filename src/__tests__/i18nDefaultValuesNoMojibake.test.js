import fs from 'fs';
import path from 'path';

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (p.endsWith('.js') || p.endsWith('.jsx')) acc.push(p);
  }
  return acc;
}

describe('defaultValue strings are free of mojibake (finance components)', () => {
  const roots = [
    path.resolve(__dirname, '../components/finance'),
    path.resolve(__dirname, '../pages'),
  ];
  const files = roots
    .flatMap((r) => (fs.existsSync(r) ? walk(r) : []))
    .filter((p) => /components[\\/]finance|pages[\\/]Finance\.jsx$/.test(p));

  const badFragments = [
    '\uFFFD', // replacement char
    'Ã',
    'Â',
    'ǭ',
    'ǧ',
    'Ǹ',
    '�',
  ];

  it('no suspicious fragments appear inside defaultValue strings', () => {
    const defaultValueRe = /defaultValue\s*:\s*(["'`])([\s\S]*?)\1/gm;
    for (const f of files) {
      const txt = fs.readFileSync(f, 'utf8');
      let m;
      while ((m = defaultValueRe.exec(txt))) {
        const val = m[2];
        for (const frag of badFragments) {
          expect({ file: f, value: val, has: val.includes(frag) }).toEqual({
            file: f,
            value: val,
            has: false,
          });
        }
      }
    }
  });
});
