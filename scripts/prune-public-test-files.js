// Remove dev/test-only HTMLs from dist after build
const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '..', 'dist');

const targets = [
  'email-direct-test.html',
  'email-direct.html',
  'email-test.html',
  'enable-auth.html',
  // mailgun reports/tests
  'mailgun-diagnostico.html',
  'mailgun-simple-test.html',
  'mailgun-test.html',
];

function rmIfExists(p) {
  try {
    if (fs.existsSync(p)) {
      fs.rmSync(p, { force: true });
      console.log('[prune-public] removed', path.basename(p));
    }
  } catch (e) {
    console.warn('[prune-public] failed to remove', p, e?.message);
  }
}

function main() {
  if (!fs.existsSync(DIST)) {
    console.warn('[prune-public] dist not found; skipping');
    return;
  }
  // Remove exact files
  for (const name of targets) {
    rmIfExists(path.join(DIST, name));
  }
  // Remove mailgun-report-*.html
  try {
    const files = fs.readdirSync(DIST);
    for (const f of files) {
      if (/^mailgun-report-.*\.html$/i.test(f)) {
        rmIfExists(path.join(DIST, f));
      }
    }
  } catch (e) {
    console.warn('[prune-public] scan failed', e?.message);
  }
}

main();

