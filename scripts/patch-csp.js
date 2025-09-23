// Post-build CSP hardening for production bundle (dist/index.html)
// Keeps dev CSP in index.html; only modifies the built file.
// Idempotent: replaces existing meta http-equiv CSP if present.

const fs = require('fs');
const path = require('path');

const DIST_INDEX = path.resolve(__dirname, '..', 'dist', 'index.html');

function main() {
  if (!fs.existsSync(DIST_INDEX)) {
    console.warn('[patch-csp] dist/index.html not found; skipping');
    return;
  }
  let html = fs.readFileSync(DIST_INDEX, 'utf8');

  const metaRe = /<meta\s+http-equiv="Content-Security-Policy"[^>]*>/i;
  const strictMeta = '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; base-uri \'self\'; frame-ancestors \'self\'; object-src \'none\'; frame-src \'self\' https://open.spotify.com; media-src \'self\' https: data: blob:; connect-src \'self\' https: wss:; img-src \'self\' data: blob: https:; font-src \'self\' data: https:; style-src \'self\' \'unsafe-inline\' https:; script-src \'self\' https:;">';

  if (metaRe.test(html)) {
    html = html.replace(metaRe, strictMeta);
  } else {
    // Insert early in <head>
    html = html.replace(/<head>/i, `<head>\n  ${strictMeta}`);
  }

  fs.writeFileSync(DIST_INDEX, html, 'utf8');
  console.log('[patch-csp] Applied strict CSP to dist/index.html');
}

main();

