#!/usr/bin/env node

/**
 * Script para corregir las referencias restantes identificadas en la auditoría
 * Fase 2 de la migración: Correcciones específicas
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

const EXCLUDE_DIRS = [
  'node_modules', '.git', 'dist', 'build', '.next', 'coverage', 
  'logs', 'cypress/videos', 'cypress/screenshots'
];

const stats = {
  filesProcessed: 0,
  filesModified: 0,
  replacementsMade: 0,
  errors: []
};

// Patrones específicos para correcciones restantes
const SPECIFIC_REPLACEMENTS = [
  // 1. ALTA PRIORIDAD: i18n brandName
  {
    pattern: /"brandName":\s*"Lovenda"/g,
    replacement: '"brandName": "MaLoveApp"',
    description: 'i18n brandName',
    filePattern: /locales\/.*\/common\.json$/
  },
  {
    pattern: /"title":\s*"Bienvenida a Lovenda"/g,
    replacement: '"title": "Bienvenida a MaLoveApp"',
    description: 'i18n welcome title (ES)',
    filePattern: /locales\/es.*\/common\.json$/
  },
  {
    pattern: /"title":\s*"Welcome to Lovenda"/g,
    replacement: '"title": "Welcome to MaLoveApp"',
    description: 'i18n welcome title (EN)',
    filePattern: /locales\/en\/common\.json$/
  },
  
  // 2. ALTA PRIORIDAD: URLs en UI
  {
    pattern: /@mywed360</g,
    replacement: '@maloveapp<',
    description: 'Email domain in UI',
    filePattern: /EmailSetup\.jsx$/
  },
  {
    pattern: /'https:\/\/lovenda\.com\/security'/g,
    replacement: "'https://maloveapp.com/security'",
    description: 'Security URL',
    filePattern: /AdminLayout\.jsx$/
  },
  {
    pattern: /ADMIN_ALLOWED_DOMAINS = 'lovenda\.com'/g,
    replacement: "ADMIN_ALLOWED_DOMAINS = 'maloveapp.com,lovenda.com'",
    description: 'Admin allowed domains',
    filePattern: /useAuth\.jsx$/
  },
  {
    pattern: /name: mywed360-backend/g,
    replacement: 'name: maloveapp-backend',
    description: 'Backend name in render.yaml',
    filePattern: /render\.yaml$/
  },
  {
    pattern: /authDomain: "mywed360\.firebaseapp\.com"/g,
    replacement: 'authDomain: "maloveapp.firebaseapp.com"',
    description: 'Firebase auth domain',
    filePattern: /enable-auth\.html$/
  },
  
  // 3. MEDIA PRIORIDAD: localStorage keys con puntos
  {
    pattern: /'mywed360\.email\./g,
    replacement: "'maloveapp.email.",
    description: 'Email automation keys',
    filePattern: /emailAutomationService\.js$/
  },
  {
    pattern: /storageGet\('mywed360\.email\.init'\)/g,
    replacement: "storageGet('maloveapp.email.init')",
    description: 'Email init key',
    filePattern: /emailAutomationService\.js$/
  },
  {
    pattern: /const CONFIG_KEY = 'mywed360\.email\.automation\.config'/g,
    replacement: "const CONFIG_KEY = 'maloveapp.email.automation.config'",
    description: 'Config key',
    filePattern: /emailAutomationService\.js$/
  },
  {
    pattern: /const CONFIG_LAST_SYNC_KEY = 'mywed360\.email\.automation\.config\.lastSync'/g,
    replacement: "const CONFIG_LAST_SYNC_KEY = 'maloveapp.email.automation.config.lastSync'",
    description: 'Config last sync key',
    filePattern: /emailAutomationService\.js$/
  },
  {
    pattern: /const STATE_KEY = 'mywed360\.email\.automation\.state'/g,
    replacement: "const STATE_KEY = 'maloveapp.email.automation.state'",
    description: 'State key',
    filePattern: /emailAutomationService\.js$/
  },
  {
    pattern: /const CLASSIFICATION_CACHE_KEY = 'mywed360\.email\.automation\.classification'/g,
    replacement: "const CLASSIFICATION_CACHE_KEY = 'maloveapp.email.automation.classification'",
    description: 'Classification cache key',
    filePattern: /emailAutomationService\.js$/
  },
  {
    pattern: /const SCHEDULE_KEY = 'mywed360\.email\.automation\.schedule'/g,
    replacement: "const SCHEDULE_KEY = 'maloveapp.email.automation.schedule'",
    description: 'Schedule key',
    filePattern: /emailAutomationService\.js$/
  },
  
  // 4. MEDIA: User agent detection (mantener antiguos para retrocompat)
  {
    pattern: /userAgent\.includes\('lovendaapp'\) \|\|/g,
    replacement: "userAgent.includes('maloveapp') ||\n      userAgent.includes('lovendaapp') ||",
    description: 'User agent detection (add new)',
    filePattern: /App\.jsx$/
  },
  
  // 5. MEDIA: localStorage keys sin puntos en hooks
  {
    pattern: /'mywed360Guests'/g,
    replacement: "'maloveappGuests'",
    description: 'Guests localStorage key'
  },
  {
    pattern: /'mywed360Suppliers'/g,
    replacement: "'maloveappSuppliers'",
    description: 'Suppliers localStorage key'
  },
  {
    pattern: /'mywed360Movements'/g,
    replacement: "'maloveappMovements'",
    description: 'Movements localStorage key'
  },
  {
    pattern: /'mywed360Profile'/g,
    replacement: "'maloveappProfile'",
    description: 'Profile localStorage key'
  },
  {
    pattern: /'mywed360Meetings'/g,
    replacement: "'maloveappMeetings'",
    description: 'Meetings localStorage key'
  },
  {
    pattern: /'mywed360Tables'/g,
    replacement: "'maloveappTables'",
    description: 'Tables localStorage key'
  },
  {
    pattern: /'mywed360SpecialMoments'/g,
    replacement: "'maloveappSpecialMoments'",
    description: 'Special moments key'
  },
  {
    pattern: /const STORAGE_KEY = 'mywed360SpecialMoments'/g,
    replacement: "const STORAGE_KEY = 'maloveappSpecialMoments'",
    description: 'Special moments const'
  },
  {
    pattern: /const localKey = \(name\) => `mywed360User_\${name}`/g,
    replacement: "const localKey = (name) => `maloveappUser_${name}`",
    description: 'User collection key'
  },
  {
    pattern: /'lovendaLongTasks'/g,
    replacement: "'maloveappLongTasks'",
    description: 'Long tasks key'
  },
  {
    pattern: /'lovendaProviders'/g,
    replacement: "'maloveappProviders'",
    description: 'Providers key'
  },
  {
    pattern: /'lovendaNotes'/g,
    replacement: "'maloveappNotes'",
    description: 'Notes key'
  },
  {
    pattern: /'lovenda_user'/g,
    replacement: "'maloveapp_user'",
    description: 'User key in InboxContainer'
  },
  
  // 6. MEDIA: Eventos con guiones
  {
    pattern: /'mywed360-guests'/g,
    replacement: "'maloveapp-guests'",
    description: 'Guests event'
  },
  {
    pattern: /'mywed360-suppliers'/g,
    replacement: "'maloveapp-suppliers'",
    description: 'Suppliers event'
  },
  {
    pattern: /'mywed360-movements'/g,
    replacement: "'maloveapp-movements'",
    description: 'Movements event'
  },
  {
    pattern: /'mywed360-profile'/g,
    replacement: "'maloveapp-profile'",
    description: 'Profile event'
  },
  {
    pattern: /'mywed360-tasks'/g,
    replacement: "'maloveapp-tasks'",
    description: 'Tasks event'
  },
  {
    pattern: /'mywed360-user-/g,
    replacement: "'maloveapp-user-",
    description: 'User events'
  },
  {
    pattern: /`mywed360-\${wid}-\${name}`/g,
    replacement: "`maloveapp-${wid}-${name}`",
    description: 'Wedding events'
  },
  {
    pattern: /`mywed360-\${weddingId}-\${subName}`/g,
    replacement: "`maloveapp-${weddingId}-${subName}`",
    description: 'Wedding sub events'
  },
  
  // 7. BAJA: Comentarios
  {
    pattern: /\/\/ \(window\.mywed360Debug \|\| window\.lovendaDebug\)/g,
    replacement: '// (window.maloveappDebug || window.lovendaDebug)',
    description: 'Debug comment',
    filePattern: /ChatWidget\.jsx$/
  },
  {
    pattern: /window\.mywed360Debug \|\| window\.lovendaDebug/g,
    replacement: 'window.maloveappDebug || window.lovendaDebug',
    description: 'Debug check',
    filePattern: /ChatWidget\.jsx$/
  },
  {
    pattern: /\/\*\*\n \* Formulario para seleccionar el alias @mywed360\./g,
    replacement: '/**\n * Formulario para seleccionar el alias @maloveapp.',
    description: 'Form comment',
    filePattern: /EmailSetupForm\.jsx$/
  },
  {
    pattern: /Configura tu correo electrónico myWed360/g,
    replacement: 'Configura tu correo electrónico MaLoveApp',
    description: 'Setup title',
    filePattern: /EmailSetupForm\.jsx$/
  },
  {
    pattern: /Elige un nombre de usuario único para tu correo electrónico myWed360/g,
    replacement: 'Elige un nombre de usuario único para tu correo electrónico MaLoveApp',
    description: 'Setup description',
    filePattern: /EmailSetupForm\.jsx$/
  },
  {
    pattern: /subject: 'Prueba de Mailgun desde myWed360'/g,
    replacement: "subject: 'Prueba de Mailgun desde MaLoveApp'",
    description: 'Mailgun test subject',
    filePattern: /MailgunTester\.jsx$/
  },
  {
    pattern: /Este es un correo de prueba enviado desde la aplicación myWed360/g,
    replacement: 'Este es un correo de prueba enviado desde la aplicación MaLoveApp',
    description: 'Mailgun test text',
    filePattern: /MailgunTester\.jsx$/
  },
  {
    pattern: /Probador de Mailgun myWed360/g,
    replacement: 'Probador de Mailgun MaLoveApp',
    description: 'Mailgun tester title',
    filePattern: /MailgunTester\.jsx$/
  },
  {
    pattern: /Roadmap - Lovenda\/MaLoveApp/g,
    replacement: 'Roadmap - MaLoveApp',
    description: 'Roadmap title',
    filePattern: /aggregateRoadmap\.js$/
  },
  {
    pattern: /@mywed360\./g,
    replacement: '@maloveapp.',
    description: 'Email domain in comments/strings'
  },
  {
    pattern: /console\.error\('\[.*\] Error al manejar evento mywed360-/g,
    replacement: "console.error('[...] Error al manejar evento maloveapp-",
    description: 'Error messages'
  },
  {
    pattern: /'Prueba Lovenda </g,
    replacement: "'Prueba MaLoveApp <",
    description: 'Email from name',
    filePattern: /mailgun-sandbox-test\.js$/
  },
  {
    pattern: /Equipo Lovenda/g,
    replacement: 'Equipo MaLoveApp',
    description: 'Team signature'
  }
];

function shouldExcludeDir(dirPath) {
  const parts = dirPath.split(path.sep);
  return EXCLUDE_DIRS.some(exclude => parts.includes(exclude));
}

function shouldProcessFile(filePath, filePattern) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx') && 
      !filePath.endsWith
