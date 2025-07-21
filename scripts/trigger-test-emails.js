#!/usr/bin/env node
/**
 * Trigger Test Emails for Existing Users
 * Manually sends welcome/test emails to registered personas
 */

const API_BASE = process.env.API_URL || 'http://localhost:8787';

const TEST_USERS = [
  { email: "timvvoss@icloud.com", perspective: "calm" },
  { email: "tim@synthetic.jp", perspective: "knowledge" }, 
  { email: "tim@voss-intelligence.com", perspective: "success" },
  { email: "tim@reshoringhq.com", perspective: "evidence" }
];

console.log('📧 Triggering test emails for existing registered users...');

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

async function sendWelcomeEmail(email, perspective) {
  console.log(`\n📤 Sending welcome email to ${email} (${perspective})`);
  
  // Create a manual email job by directly calling the email endpoint
  const emailData = {
    to: email,
    templateType: 'welcome',
    templateData: {
      userName: email.split('@')[0],
      userEmail: email,
      perspective: perspective,
      tier: 'trial',
      focusAreas: perspective === 'calm' ? ['wellness', 'spiritual'] : 
                  perspective === 'knowledge' ? ['evidence-based', 'career'] :
                  perspective === 'success' ? ['career', 'social'] :
                  ['evidence-based', 'wellness'],
      trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      accountUrl: `https://astropal.com/portal?token=test-token`,
      changePerspectiveUrl: `https://astropal.com/perspective?token=test-token`,
      updatePreferencesUrl: `https://astropal.com/preferences?token=test-token`,
      unsubscribeUrl: `https://astropal.com/unsubscribe?token=test-token`
    }
  };
  
  // Try to trigger via admin endpoint (if available)
  const result = await makeRequest(`${API_BASE}/admin/send-test-email`, {
    method: 'POST',
    body: JSON.stringify(emailData)
  });
  
  if (result.response?.ok) {
    console.log(`✅ Welcome email sent to ${email}`);
    return true;
  } else {
    console.log(`⚠️  Could not send via admin endpoint to ${email}`);
    return false;
  }
}

async function triggerContentAndEmails() {
  console.log('\n🚀 Step 1: Triggering Content Generation...');
  
  // Try ephemeris first
  await makeRequest(`${API_BASE}/admin/trigger-ephemeris`, { method: 'POST' });
  
  // Wait and trigger content
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const contentResult = await makeRequest(`${API_BASE}/admin/trigger-content`, { method: 'POST' });
  
  if (contentResult.response?.ok) {
    console.log('✅ Content generation triggered');
  }
  
  // Wait and trigger email queue
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const emailResult = await makeRequest(`${API_BASE}/admin/trigger-emails`, { method: 'POST' });
  
  if (emailResult.response?.ok) {
    console.log('✅ Email queue processing triggered');
  }
  
  return true;
}

async function checkEmailStatus() {
  console.log('\n📊 Checking email delivery status...');
  
  const { response, data } = await makeRequest(`${API_BASE}/admin/email-status`);
  
  if (response?.ok && data.recentEmails) {
    console.log(`✅ Found ${data.recentEmails.length} recent emails:`);
    data.recentEmails.forEach((email, i) => {
      console.log(`   ${i + 1}. ${email.templateType} - ${email.status} (${email.sentAt})`);
    });
    return data.recentEmails.length;
  } else {
    console.log('⚠️  No recent emails found');
    return 0;
  }
}

async function main() {
  console.log('=' * 60);
  console.log('📧 TRIGGER TEST EMAILS FOR EXISTING USERS');
  console.log('=' * 60);
  
  // Step 1: Try to trigger the normal email flow
  await triggerContentAndEmails();
  
  // Step 2: Check current email status
  const emailCount = await checkEmailStatus();
  
  // Step 3: If no emails found, try manual welcome emails
  if (emailCount === 0) {
    console.log('\n💌 No automatic emails found, trying manual welcome emails...');
    
    let sentCount = 0;
    for (const user of TEST_USERS) {
      if (await sendWelcomeEmail(user.email, user.perspective)) {
        sentCount++;
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    }
    
    console.log(`\n📈 Manual emails attempted: ${sentCount}/${TEST_USERS.length}`);
  }
  
  // Step 4: Final status check
  await new Promise(resolve => setTimeout(resolve, 2000));
  await checkEmailStatus();
  
  console.log('\n' + '=' * 60);
  console.log('📋 SUMMARY');
  console.log('=' * 60);
  console.log('✅ Email triggering completed');
  console.log(`📧 Test users: ${TEST_USERS.map(u => u.email).join(', ')}`);
  console.log('\n📬 Next Steps:');
  console.log('1. Check your email inboxes for messages');
  console.log('2. Look for welcome or daily cosmic pulse emails');
  console.log('3. Check backend logs for detailed email processing info');
  console.log('4. Verify email delivery in your actual email accounts');
  
  console.log('\n🎉 Email trigger process completed!');
}

if (require.main === module) {
  main().catch(error => {
    console.error(`\n💥 Email trigger failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { sendWelcomeEmail, triggerContentAndEmails, checkEmailStatus }; 