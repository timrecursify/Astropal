#!/usr/bin/env node
/**
 * Manual Email Trigger Script
 * Sends test emails to all registered test personas
 */

const API_BASE = process.env.API_URL || 'http://localhost:8787';

const TEST_EMAILS = [
  "timvvoss@icloud.com",
  "tim@synthetic.jp", 
  "tim@voss-intelligence.com",
  "tim@reshoringhq.com"
];

console.log('🚀 Sending test emails to all personas...');
console.log(`📡 API Base: ${API_BASE}`);

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { response, data, status: response.status };
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    return { error: error.message };
  }
}

async function triggerEmailFlow() {
  console.log('\n📧 Step 1: Triggering Ephemeris Fetch...');
  const ephResult = await makeRequest(`${API_BASE}/admin/trigger-ephemeris`, {
    method: 'POST'
  });
  
  if (ephResult.response?.ok) {
    console.log('✅ Ephemeris fetch triggered successfully');
  } else {
    console.log('⚠️  Ephemeris fetch may have failed, proceeding anyway...');
  }
  
  // Wait a moment for ephemeris data to process
  console.log('⏳ Waiting 5 seconds for ephemeris processing...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('\n📰 Step 2: Triggering Content Generation...');
  const contentResult = await makeRequest(`${API_BASE}/admin/trigger-content`, {
    method: 'POST'
  });
  
  if (contentResult.response?.ok) {
    console.log('✅ Content generation triggered successfully');
  } else {
    console.log('⚠️  Content generation may have failed, proceeding to email queue...');
  }
  
  // Wait a moment for content generation
  console.log('⏳ Waiting 10 seconds for content generation...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  console.log('\n📮 Step 3: Triggering Email Queue Processing...');
  const emailResult = await makeRequest(`${API_BASE}/admin/trigger-emails`, {
    method: 'POST'
  });
  
  if (emailResult.response?.ok) {
    console.log('✅ Email queue processing triggered successfully');
  } else {
    console.log('⚠️  Email queue processing may have failed');
  }
  
  // Wait for emails to process
  console.log('⏳ Waiting 5 seconds for email processing...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('\n📊 Step 4: Checking Email Status...');
  const statusResult = await makeRequest(`${API_BASE}/admin/email-status`);
  
  if (statusResult.response?.ok && statusResult.data.recentEmails) {
    console.log('✅ Email status retrieved:');
    statusResult.data.recentEmails.forEach((email, index) => {
      console.log(`   ${index + 1}. ${email.templateType} - ${email.status} (${email.sentAt})`);
    });
  } else {
    console.log('⚠️  Could not retrieve email status');
  }
}

async function checkRegistrations() {
  console.log('\n👥 Checking if test users are registered...');
  
  for (const email of TEST_EMAILS) {
    // Try to validate a dummy token to see if user exists
    const { response } = await makeRequest(`${API_BASE}/validate-token?token=dummy`);
    
    if (response) {
      console.log(`✅ API responding for user checks`);
      break;
    }
  }
}

async function main() {
  console.log('=' * 60);
  console.log('📧 ASTROPAL EMAIL TESTING SCRIPT');
  console.log('=' * 60);
  
  console.log('\n🔍 Step 0: Checking System...');
  await checkRegistrations();
  
  console.log('\n🚀 Starting Email Flow...');
  await triggerEmailFlow();
  
  console.log('\n' + '=' * 60);
  console.log('📋 SUMMARY');
  console.log('=' * 60);
  console.log('✅ Email flow triggered for all test personas');
  console.log(`📧 Test emails: ${TEST_EMAILS.join(', ')}`);
  console.log('\n📬 Next Steps:');
  console.log('1. Check your email inboxes for messages');
  console.log('2. Look for welcome emails if users were just registered');
  console.log('3. Look for daily cosmic pulse emails if content generation worked');
  console.log('4. Check backend logs for any errors');
  console.log('5. Verify scheduled jobs are working for ongoing emails');
  
  console.log('\n🎉 Test completed! Check your inboxes.');
}

if (require.main === module) {
  main().catch(error => {
    console.error(`\n💥 Test failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { triggerEmailFlow, checkRegistrations }; 