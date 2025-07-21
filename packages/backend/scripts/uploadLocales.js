#!/usr/bin/env node
/**
 * Upload locale data to Cloudflare KV storage
 * Usage: node uploadLocales.js [environment]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BRAND = 'astropal';
const SUPPORTED_LOCALES = ['en-US', 'es-ES'];

async function uploadLocales(environment = 'production') {
  console.log('🌍 Uploading locale data to KV storage...');
  console.log(`Environment: ${environment}`);
  console.log(`Brand: ${BRAND}`);
  
  try {
    for (const locale of SUPPORTED_LOCALES) {
      const localeFile = path.join(__dirname, '../src/locales', `${locale}.json`);
      const kvKey = `i18n:${locale}:${BRAND}`;
      
      console.log(`\n📝 Processing ${locale}...`);
      
      // Check if locale file exists
      if (!fs.existsSync(localeFile)) {
        console.error(`❌ Locale file not found: ${localeFile}`);
        continue;
      }
      
      // Validate JSON
      try {
        const localeData = JSON.parse(fs.readFileSync(localeFile, 'utf8'));
        console.log(`✅ JSON valid for ${locale}`);
        
        // Check required fields
        const requiredPaths = [
          'email.subjects',
          'email.templates', 
          'email.buttons',
          'perspectives',
          'formats'
        ];
        
        for (const path of requiredPaths) {
          const value = path.split('.').reduce((obj, key) => obj?.[key], localeData);
          if (!value) {
            console.warn(`⚠️  Missing required path: ${path} in ${locale}`);
          }
        }
        
      } catch (parseError) {
        console.error(`❌ Invalid JSON in ${locale}: ${parseError.message}`);
        continue;
      }
      
      // Upload to KV
      console.log(`📤 Uploading ${locale} to KV key: ${kvKey}`);
      
      const envFlag = environment === 'production' ? '--env production' : '';
      const command = `wrangler kv:key put "${kvKey}" --path "${localeFile}" --binding KV_I18N ${envFlag}`;
      
      try {
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ Successfully uploaded ${locale}`);
      } catch (uploadError) {
        console.error(`❌ Failed to upload ${locale}: ${uploadError.message}`);
      }
    }
    
    console.log('\n🎉 Locale upload process completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Verify uploads with: wrangler kv:key list --binding KV_I18N');
    console.log('2. Test locale loading in your application');
    console.log('3. Deploy your workers to use the new locale data');
    
  } catch (error) {
    console.error('💥 Upload process failed:', error.message);
    process.exit(1);
  }
}

// Utility function to list current locale keys
async function listLocaleKeys(environment = 'production') {
  console.log('📋 Listing current locale keys...');
  
  const envFlag = environment === 'production' ? '--env production' : '';
  const command = `wrangler kv:key list --binding KV_I18N ${envFlag}`;
  
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to list keys:', error.message);
  }
}

// Utility function to validate locale files locally
function validateLocales() {
  console.log('🔍 Validating locale files locally...');
  
  const errors = [];
  const warnings = [];
  
  for (const locale of SUPPORTED_LOCALES) {
    const localeFile = path.join(__dirname, '../src/locales', `${locale}.json`);
    
    if (!fs.existsSync(localeFile)) {
      errors.push(`Missing locale file: ${locale}.json`);
      continue;
    }
    
    try {
      const data = JSON.parse(fs.readFileSync(localeFile, 'utf8'));
      
      // Validate structure
      const requiredSections = ['email', 'perspectives', 'formats'];
      for (const section of requiredSections) {
        if (!data[section]) {
          errors.push(`${locale}: Missing section '${section}'`);
        }
      }
      
      // Validate email subjects
      if (data.email?.subjects) {
        const requiredSubjects = [
          'welcome', 'daily_morning', 'daily_evening', 'weekly', 'monthly',
          'trial_ending', 'trial_expired', 'upgrade_confirmation', 'upgrade_reminder'
        ];
        
        for (const subject of requiredSubjects) {
          if (!data.email.subjects[subject]) {
            warnings.push(`${locale}: Missing email subject '${subject}'`);
          }
        }
      }
      
      // Validate perspectives
      if (data.perspectives) {
        const requiredPerspectives = ['calm', 'knowledge', 'success', 'evidence'];
        for (const perspective of requiredPerspectives) {
          if (!data.perspectives[perspective]) {
            errors.push(`${locale}: Missing perspective '${perspective}'`);
          }
        }
      }
      
      console.log(`✅ ${locale} validation passed`);
      
    } catch (parseError) {
      errors.push(`${locale}: Invalid JSON - ${parseError.message}`);
    }
  }
  
  // Report results
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(error => console.log(`  - ${error}`));
    return false;
  }
  
  console.log('\n✅ All locale files are valid!');
  return true;
}

// Command line interface
const args = process.argv.slice(2);
const command = args[0];
const environment = args[1] || 'production';

switch (command) {
  case 'upload':
    uploadLocales(environment);
    break;
  case 'list':
    listLocaleKeys(environment);
    break;
  case 'validate':
    validateLocales();
    break;
  case 'help':
  default:
    console.log(`
📖 Locale Management Script

Usage:
  node uploadLocales.js upload [environment]    - Upload locale files to KV
  node uploadLocales.js list [environment]      - List current locale keys
  node uploadLocales.js validate               - Validate locale files locally
  node uploadLocales.js help                   - Show this help

Environment: 'production' or 'development' (default: production)

Examples:
  node uploadLocales.js upload production
  node uploadLocales.js validate
  node uploadLocales.js list development
    `);
    break;
} 