#!/usr/bin/env node
/**
 * Seed Test Users Script for Astropal Production Database
 * Usage: node seedTestUsers.js [environment]
 * 
 * This script creates the 4 test users specified in the Backend PRD
 * for Phase 8 Beta Launch testing.
 */

const { execSync } = require('child_process');
const crypto = require('crypto');

// Test users from Backend_PRD.md Phase 8
const TEST_USERS = [
  {
    email: "timvvoss@icloud.com",
    perspective: "calm",
    focusAreas: ["wellness", "spiritual"],
    locale: "en-US",
    birthDate: "1990-06-15", // Sample date - will be updated during actual testing
    birthLocation: "San Francisco, United States",
    birthTime: "12:00",
    timezone: "America/Los_Angeles"
  },
  {
    email: "tim@synthetic.jp", 
    perspective: "knowledge",
    focusAreas: ["evidence-based", "career"],
    locale: "en-US",
    birthDate: "1985-03-22",
    birthLocation: "Tokyo, Japan",
    birthTime: "14:30",
    timezone: "Asia/Tokyo"
  },
  {
    email: "tim@voss-intelligence.com",
    perspective: "success", 
    focusAreas: ["career", "social"],
    locale: "en-US",
    birthDate: "1988-11-08",
    birthLocation: "London, United Kingdom",
    birthTime: "09:15",
    timezone: "Europe/London"
  },
  {
    email: "tim@reshoringhq.com",
    perspective: "evidence",
    focusAreas: ["evidence-based", "wellness"],
    locale: "en-US",
    birthDate: "1992-09-03",
    birthLocation: "Berlin, Germany",
    birthTime: "16:45",
    timezone: "Europe/Berlin"
  }
];

// Utility functions
function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

function generateAuthToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashAuthToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateTrialEndDate() {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7); // 7 days from now
  return trialEnd.toISOString();
}

function generateSQLInsert(user) {
  const userId = generateId();
  const authToken = generateAuthToken();
  const hashedToken = hashAuthToken(authToken);
  const trialEnd = generateTrialEndDate();
  const createdAt = new Date().toISOString();
  
  const sqlInsert = `
INSERT INTO users (
  id, email, auth_token, birth_date, birth_location, birth_time,
  timezone, locale, perspective, tier, trial_end, focus_preferences,
  last_activity, email_status, created_at
) VALUES (
  '${userId}',
  '${user.email}',
  '${hashedToken}',
  '${user.birthDate}',
  '${user.birthLocation}',
  '${user.birthTime}',
  '${user.timezone}',
  '${user.locale}',
  '${user.perspective}',
  'trial',
  '${trialEnd}',
  '${JSON.stringify(user.focusAreas)}',
  '${createdAt}',
  'active',
  '${createdAt}'
);`.trim();

  return {
    sql: sqlInsert,
    userData: {
      id: userId,
      email: user.email,
      authToken: authToken, // Store plaintext for email generation
      perspective: user.perspective,
      focusAreas: user.focusAreas,
      trialEnd: trialEnd
    }
  };
}

async function seedTestUsers(environment = 'production') {
  console.log('🌱 Seeding test users for Astropal Beta Launch...');
  console.log(`Environment: ${environment}`);
  console.log(`Test users to create: ${TEST_USERS.length}`);
  
  const userData = [];
  const sqlStatements = [];
  
  try {
    // Generate SQL for all test users
    for (const user of TEST_USERS) {
      console.log(`\n👤 Processing ${user.email}...`);
      console.log(`   Perspective: ${user.perspective}`);
      console.log(`   Focus Areas: ${user.focusAreas.join(', ')}`);
      console.log(`   Locale: ${user.locale}`);
      
      const { sql, userData: generatedUserData } = generateSQLInsert(user);
      sqlStatements.push(sql);
      userData.push(generatedUserData);
      
      console.log(`   ✅ Generated user ID: ${generatedUserData.id}`);
      console.log(`   ✅ Generated auth token: ${generatedUserData.authToken.substring(0, 16)}...`);
      console.log(`   ✅ Trial ends: ${generatedUserData.trialEnd}`);
    }
    
    // Execute SQL statements
    console.log('\n📝 Executing database insertions...');
    
    const envFlag = environment === 'production' ? '--env production' : '';
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i];
      const user = userData[i];
      
      try {
        console.log(`\n💾 Inserting ${user.email}...`);
        
        // Execute the SQL statement via wrangler
        const command = `wrangler d1 execute astropal_main ${envFlag} --command "${sql.replace(/"/g, '\\"')}"`;
        execSync(command, { stdio: 'inherit' });
        
        console.log(`   ✅ Successfully inserted ${user.email}`);
        
      } catch (insertError) {
        console.error(`   ❌ Failed to insert ${user.email}: ${insertError.message}`);
        
        // Check if it's a duplicate email error
        if (insertError.message.includes('UNIQUE constraint failed')) {
          console.log(`   ℹ️  User ${user.email} already exists - updating trial end date...`);
          
          const updateSql = `UPDATE users SET trial_end = '${user.trialEnd}', tier = 'trial' WHERE email = '${user.email}'`;
          const updateCommand = `wrangler d1 execute astropal_main ${envFlag} --command "${updateSql}"`;
          
          try {
            execSync(updateCommand, { stdio: 'inherit' });
            console.log(`   ✅ Updated existing user ${user.email}`);
          } catch (updateError) {
            console.error(`   ❌ Failed to update ${user.email}: ${updateError.message}`);
          }
        }
      }
    }
    
    // Generate summary report
    console.log('\n📊 Beta Test Users Summary');
    console.log('=' .repeat(60));
    
    userData.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Auth Token: ${user.authToken}`);
      console.log(`   Perspective: ${user.perspective}`);
      console.log(`   Focus Areas: ${user.focusAreas.join(', ')}`);
      console.log(`   Trial Ends: ${user.trialEnd}`);
      console.log(`   Portal URL: https://astropal.io/portal?token=${user.authToken}`);
      console.log('');
    });
    
    console.log('🎉 Test user seeding completed successfully!');
    console.log('\n📋 Next steps for Phase 8 Beta Launch:');
    console.log('1. Verify users can be found in the database');
    console.log('2. Test registration flow with a test email');
    console.log('3. Trigger content generation for test users');
    console.log('4. Verify email delivery to test accounts');
    console.log('5. Test perspective switching and account management');
    
    // Save auth tokens to temporary file for testing
    const authTokens = userData.map(u => ({
      email: u.email,
      authToken: u.authToken,
      portalUrl: `https://astropal.io/portal?token=${u.authToken}`
    }));
    
    require('fs').writeFileSync(
      '/tmp/astropal_test_tokens.json',
      JSON.stringify(authTokens, null, 2)
    );
    
    console.log('\n🔐 Auth tokens saved to: /tmp/astropal_test_tokens.json');
    console.log('⚠️  Keep these tokens secure - they provide full account access!');
    
  } catch (error) {
    console.error('💥 Test user seeding failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure wrangler is authenticated: wrangler auth');
    console.error('2. Verify database exists: wrangler d1 list');
    console.error('3. Check database schema: wrangler d1 execute astropal_main --command "SELECT name FROM sqlite_master WHERE type=\'table\';"');
    process.exit(1);
  }
}

// Utility function to verify seeded users
async function verifyTestUsers(environment = 'production') {
  console.log('🔍 Verifying test users in database...');
  
  const envFlag = environment === 'production' ? '--env production' : '';
  
  for (const user of TEST_USERS) {
    try {
      const query = `SELECT email, perspective, tier, trial_end FROM users WHERE email = '${user.email}'`;
      const command = `wrangler d1 execute astropal_main ${envFlag} --command "${query}"`;
      
      console.log(`\n🔎 Checking ${user.email}...`);
      execSync(command, { stdio: 'inherit' });
      
    } catch (error) {
      console.error(`❌ Failed to verify ${user.email}: ${error.message}`);
    }
  }
}

// Command line interface
const args = process.argv.slice(2);
const command = args[0];
const environment = args[1] || 'production';

switch (command) {
  case 'seed':
    seedTestUsers(environment);
    break;
  case 'verify':
    verifyTestUsers(environment);
    break;
  case 'help':
  default:
    console.log(`
🌱 Astropal Test User Seeding Script

Usage:
  node seedTestUsers.js seed [environment]     - Seed test users into database
  node seedTestUsers.js verify [environment]   - Verify test users exist
  node seedTestUsers.js help                   - Show this help

Environment: 'production' or 'development' (default: production)

Test Users:
  • timvvoss@icloud.com (calm perspective, wellness/spiritual focus)
  • tim@synthetic.jp (knowledge perspective, evidence-based/career focus)  
  • tim@voss-intelligence.com (success perspective, career/social focus)
  • tim@reshoringhq.com (evidence perspective, evidence-based/wellness focus)

Examples:
  node seedTestUsers.js seed production
  node seedTestUsers.js verify production
    `);
    break;
} 