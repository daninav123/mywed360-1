#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../../apps/main-app/src');
const EN_LOCALE_DIR = path.join(__dirname, '../../apps/main-app/src/i18n/locales/en');
const ES_LOCALE_DIR = path.join(__dirname, '../../apps/main-app/src/i18n/locales/es');

// Load all translation keys from locale files
function loadAllKeys(localeDir) {
  const allKeys = new Set();
  
  function processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      const namespace = path.basename(filePath, '.json');
      
      function extractKeys(obj, prefix = '') {
        for (const [key, value] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            extractKeys(value, fullKey);
          } else {
            // Add both with and without namespace
            allKeys.add(`${namespace}:${fullKey}`);
            allKeys.add(fullKey);
          }
        }
      }
      
      extractKeys(data);
    } catch (error) {
      console.error(`Error loading ${filePath}:`, error.message);
    }
  }
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.endsWith('.json')) {
        processFile(fullPath);
      }
    }
  }
  
  scanDirectory(localeDir);
  return allKeys;
}

// Extract translation keys from source code
function extractUsedKeys(srcDir) {
  const usedKeys = new Map(); // key -> [file paths]
  
  // Regex patterns to match t() calls
  const patterns = [
    /t\s*\(\s*['"]([^'"]+)['"]/g,           // t('key') or t("key")
    /t\s*\(\s*`([^`]+)`/g,                   // t(`key`)
    /\{t\s*\(\s*['"]([^'"]+)['"]/g,         // {t('key')}
  ];
  
  function processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(SRC_DIR, filePath);
      
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const key = match[1];
          // Skip if key contains variables
          if (key.includes('${') || key.includes('{{')) continue;
          
          if (!usedKeys.has(key)) {
            usedKeys.set(key, []);
          }
          usedKeys.get(key).push(relativePath);
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  function scanDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        // Skip node_modules and other non-source directories
        if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build') {
          continue;
        }
        
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (item.endsWith('.jsx') || item.endsWith('.js') || item.endsWith('.tsx') || item.endsWith('.ts')) {
          processFile(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }
  
  scanDirectory(srcDir);
  return usedKeys;
}

function main() {
  console.log('🔍 Analyzing i18n keys in the project...\n');
  
  console.log('📚 Loading translation keys from locale files...');
  const enKeys = loadAllKeys(EN_LOCALE_DIR);
  const esKeys = loadAllKeys(ES_LOCALE_DIR);
  console.log(`   ✅ Loaded ${enKeys.size} keys from EN locale`);
  console.log(`   ✅ Loaded ${esKeys.size} keys from ES locale\n`);
  
  console.log('🔎 Scanning source code for translation usage...');
  const usedKeys = extractUsedKeys(SRC_DIR);
  console.log(`   ✅ Found ${usedKeys.size} unique translation keys in use\n`);
  
  // Find missing keys
  const missingInEN = [];
  const missingInES = [];
  const missingInBoth = [];
  
  for (const [key, files] of usedKeys.entries()) {
    const hasEN = enKeys.has(key) || enKeys.has(`common:${key}`);
    const hasES = esKeys.has(key) || esKeys.has(`common:${key}`);
    
    if (!hasEN && !hasES) {
      missingInBoth.push({ key, files });
    } else if (!hasEN) {
      missingInEN.push({ key, files });
    } else if (!hasES) {
      missingInES.push({ key, files });
    }
  }
  
  // Generate report
  console.log('📊 ANALYSIS RESULTS\n');
  console.log('═'.repeat(80));
  
  if (missingInBoth.length > 0) {
    console.log(`\n❌ Missing in BOTH EN and ES (${missingInBoth.length} keys):\n`);
    for (const { key, files } of missingInBoth.slice(0, 20)) {
      console.log(`   ${key}`);
      console.log(`      Used in: ${files.slice(0, 3).join(', ')}${files.length > 3 ? ` (+${files.length - 3} more)` : ''}`);
    }
    if (missingInBoth.length > 20) {
      console.log(`   ... and ${missingInBoth.length - 20} more keys`);
    }
  }
  
  if (missingInEN.length > 0) {
    console.log(`\n⚠️  Missing in EN only (${missingInEN.length} keys):\n`);
    for (const { key, files } of missingInEN.slice(0, 10)) {
      console.log(`   ${key}`);
      console.log(`      Used in: ${files.slice(0, 2).join(', ')}${files.length > 2 ? ` (+${files.length - 2} more)` : ''}`);
    }
    if (missingInEN.length > 10) {
      console.log(`   ... and ${missingInEN.length - 10} more keys`);
    }
  }
  
  if (missingInES.length > 0) {
    console.log(`\n⚠️  Missing in ES only (${missingInES.length} keys):\n`);
    for (const { key, files } of missingInES.slice(0, 10)) {
      console.log(`   ${key}`);
      console.log(`      Used in: ${files.slice(0, 2).join(', ')}${files.length > 2 ? ` (+${files.length - 2} more)` : ''}`);
    }
    if (missingInES.length > 10) {
      console.log(`   ... and ${missingInES.length - 10} more keys`);
    }
  }
  
  if (missingInBoth.length === 0 && missingInEN.length === 0 && missingInES.length === 0) {
    console.log('\n✅ No missing keys found! All translation keys are properly defined.\n');
  } else {
    console.log('\n═'.repeat(80));
    console.log(`\nSummary:`);
    console.log(`  - Missing in both: ${missingInBoth.length}`);
    console.log(`  - Missing in EN: ${missingInEN.length}`);
    console.log(`  - Missing in ES: ${missingInES.length}`);
    console.log(`  - Total issues: ${missingInBoth.length + missingInEN.length + missingInES.length}\n`);
  }
  
  // Save detailed report to file
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalUsedKeys: usedKeys.size,
      missingInBoth: missingInBoth.length,
      missingInEN: missingInEN.length,
      missingInES: missingInES.length,
    },
    missingInBoth,
    missingInEN,
    missingInES,
  };
  
  const reportPath = path.join(__dirname, 'missing-keys-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`📝 Detailed report saved to: ${reportPath}\n`);
}

if (require.main === module) {
  main();
}

module.exports = { loadAllKeys, extractUsedKeys };
