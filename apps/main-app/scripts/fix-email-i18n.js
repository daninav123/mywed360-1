import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, '../src/i18n/locales/es/email.json');

// Leer archivo
const content = JSON.parse(readFileSync(filePath, 'utf8'));

// Extraer contenido correcto (quitar nivel "email" superior)
const correctedContent = content.email || content;

// Escribir de vuelta
writeFileSync(filePath, JSON.stringify(correctedContent, null, 2), 'utf8');

console.log('✅ Estructura de email.json corregida');
