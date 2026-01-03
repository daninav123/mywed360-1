#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EN_LOCALE_DIR = path.join(__dirname, '../../apps/main-app/src/i18n/locales/en');
const ES_LOCALE_DIR = path.join(__dirname, '../../apps/main-app/src/i18n/locales/es');

function getAllKeys(obj, prefix = '') {
  const keys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  
  return keys;
}

function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

function compareFiles(enFile, esFile) {
  const enPath = path.join(EN_LOCALE_DIR, enFile);
  const esPath = path.join(ES_LOCALE_DIR, esFile);
  
  const enData = readJsonFile(enPath);
  const esData = readJsonFile(esPath);
  
  if (!enData) {
    return { file: enFile, error: 'Could not read EN file', missing: [] };
  }
  
  if (!esData) {
    return { file: enFile, error: 'ES file does not exist', missing: getAllKeys(enData) };
  }
  
  const enKeys = new Set(getAllKeys(enData));
  const esKeys = new Set(getAllKeys(esData));
  
  const missingKeys = [];
  
  for (const key of enKeys) {
    if (!esKeys.has(key)) {
      missingKeys.push(key);
    }
  }
  
  return {
    file: enFile,
    totalEnKeys: enKeys.size,
    totalEsKeys: esKeys.size,
    missing: missingKeys.sort()
  };
}

function getValueAtPath(obj, path) {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

function main() {
  const shouldShowValues = process.argv.includes('--values');
  
  console.log('\n🔍 Comparing EN and ES locale files...\n');
  
  if (!fs.existsSync(EN_LOCALE_DIR)) {
    console.error(`Error: EN directory not found: ${EN_LOCALE_DIR}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(ES_LOCALE_DIR)) {
    console.error(`Error: ES directory not found: ${ES_LOCALE_DIR}`);
    process.exit(1);
  }
  
  const enFiles = fs.readdirSync(EN_LOCALE_DIR)
    .filter(f => f.endsWith('.json'))
    .filter(f => !f.includes('.bak') && !f.includes('.backup'));
  
  const results = [];
  let totalMissing = 0;
  
  for (const file of enFiles) {
    const result = compareFiles(file, file);
    if (result.missing.length > 0 || result.error) {
      results.push(result);
      totalMissing += result.missing.length;
    }
  }
  
  if (results.length === 0) {
    console.log('✅ No missing keys found! All EN keys have ES translations.\n');
    return;
  }
  
  console.log(`📊 Found ${totalMissing} missing Spanish translations across ${results.length} files:\n`);
  
  for (const result of results) {
    console.log(`📄 ${result.file}`);
    
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
      console.log(`   Missing: ${result.missing.length} keys\n`);
      continue;
    }
    
    console.log(`   Total EN keys: ${result.totalEnKeys}`);
    console.log(`   Total ES keys: ${result.totalEsKeys}`);
    console.log(`   Missing: ${result.missing.length} keys`);
    console.log('   ─'.repeat(30));
    
    if (shouldShowValues) {
      const enPath = path.join(EN_LOCALE_DIR, result.file);
      const enData = readJsonFile(enPath);
      
      for (const key of result.missing.slice(0, 10)) {
        const value = getValueAtPath(enData, key);
        const displayValue = typeof value === 'string' && value.length > 50 
          ? value.substring(0, 47) + '...'
          : value;
        console.log(`   ${key}: "${displayValue}"`);
      }
      
      if (result.missing.length > 10) {
        console.log(`   ... and ${result.missing.length - 10} more`);
      }
    } else {
      for (const key of result.missing.slice(0, 5)) {
        console.log(`   - ${key}`);
      }
      
      if (result.missing.length > 5) {
        console.log(`   ... and ${result.missing.length - 5} more`);
      }
    }
    
    console.log('');
  }
  
  console.log('═'.repeat(60));
  console.log(`\nTotal missing keys: ${totalMissing}`);
  
  if (!shouldShowValues) {
    console.log('\n💡 Run with --values to see the English values for missing keys:\n');
    console.log('   node scripts/i18n/findMissingSpanishKeys.cjs --values\n');
  }
  
  // Generate JSON report
  const report = {
    timestamp: new Date().toISOString(),
    totalMissing,
    files: results.map(r => ({
      file: r.file,
      error: r.error,
      totalEnKeys: r.totalEnKeys,
      totalEsKeys: r.totalEsKeys,
      missingCount: r.missing.length,
      missingKeys: r.missing
    }))
  };
  
  const reportPath = path.join(__dirname, 'missing-spanish-keys-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`📝 Detailed report saved to: ${reportPath}\n`);
}

if (require.main === module) {
  main();
}

module.exports = { getAllKeys, compareFiles };
