import fs from 'fs';
import path from 'path';

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (name.endsWith('.json')) acc.push(p);
  }
  return acc;
}

describe('i18n locales are free of mojibake', () => {
  const root = path.resolve(__dirname, '../i18n/locales');
  const files = walk(root);

  const badFragments = [
    'Ã', // common UTF-8 double-decoding marker
    '',
    'â€', // quotes/ellipsis broken
    '€', // euro broken
    '??', // placeholder pairs
  ];

  it('all locale JSON files have no broken fragments', () => {
    for (const f of files) {
      const txt = fs.readFileSync(f, 'utf8');
      // replacement char should not be present
      expect(txt.includes('\uFFFD')).toBe(false);
      for (const frag of badFragments) {
        expect({ file: f, has: txt.includes(frag) }).toEqual({ file: f, has: false });
      }
    }
  });
});

