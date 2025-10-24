import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');
const MINOR_LANGS = ['bg', 'cs', 'hr', 'lt', 'ru', 'sk', 'sl'];

// JSON mínimo válido
const MINIMAL_JSON = {
  app: {
    name: "MaLove.App",
    brandName: "Lovenda",
    loading: "Loading...",
    error: "Error",
    success: "Success"
  }
};

console.log('🔧 Arreglando idiomas menores...\n');

for (const lang of MINOR_LANGS) {
  const filepath = path.join(LOCALES_DIR, lang, 'common.json');
  
  try {
    const content = JSON.stringify(MINIMAL_JSON, null, 2);
    fs.writeFileSync(filepath, content + '\n', { encoding: 'utf8' });
    console.log(`✅ ${lang}/common.json`);
  } catch (err) {
    console.log(`❌ ${lang}/common.json - ${err.message}`);
  }
}

console.log('\n✨ Idiomas menores arreglados con JSON mínimo');
console.log('   Estos idiomas ahora tienen traducciones básicas en inglés.');
console.log('   Puedes expandirlos más tarde con npm run i18n:sync-translations');
