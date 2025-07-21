# Stripe Webhook Testing Guide

## Prerequisites
- Stripe CLI installed locally
- Stripe test API keys configured
- Backend worker running locally or deployed
- Test webhook endpoints created in Stripe Dashboard

## 1. Install Stripe CLI

### macOS
```bash
brew install stripe/stripe-cli/stripe
```

### Other platforms
Download from: https://github.com/stripe/stripe-cli/releases

## 2. Login to Stripe CLI

```bash
# Login with your Stripe account
stripe login

# Verify login
stripe config --list
```

## 3. Local Development Webhook Testing

### Option A: Test with Local Worker
```bash
# Start the backend worker locally (separate terminal)
cd packages/backend
npm run dev

# In another terminal, forward webhooks to local worker
stripe listen --forward-to localhost:8787/stripe/webhook/subscription --events customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.payment_succeeded,invoice.payment_failed

# For payment webhooks (separate endpoint)
stripe listen --forward-to localhost:8787/stripe/webhook/payment --events checkout.session.completed,payment_intent.succeeded,payment_intent.payment_failed
```

### Option B: Test with Deployed Worker
```bash
# Forward webhooks to deployed worker
stripe listen --forward-to https://api.astropal.io/stripe/webhook/subscription --events customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.payment_succeeded,invoice.payment_failed

# For payment webhooks
stripe listen --forward-to https://api.astropal.io/stripe/webhook/payment --events checkout.session.completed,payment_intent.succeeded,payment_intent.payment_failed
```

## 4. Test Event Triggers

### Test Subscription Events

```bash
# Create a test customer
stripe customers create --email="test@example.com" --name="Test User"

# Create a test subscription (replace with your price ID)
stripe subscriptions create --customer=cus_test123 --items[0][price]=price_1234567890

# Update subscription
stripe subscriptions update sub_1234567890 --metadata[test]=true

# Cancel subscription
stripe subscriptions cancel sub_1234567890
```

### Test Payment Events

```bash
# Create a successful payment intent
stripe payment_intents create --amount=2000 --currency=usd --payment_method_types[]=card --confirm --payment_method=pm_card_visa

# Create a failed payment intent
stripe payment_intents create --amount=2000 --currency=usd --payment_method_types[]=card --confirm --payment_method=pm_card_chargeDeclined
```

### Test Checkout Session

```bash
# Create a checkout session (replace with your price ID)
stripe checkout sessions create \
  --success_url="https://astropal.io/success" \
  --cancel_url="https://astropal.io/cancel" \
  --line_items[0][price]=price_1234567890 \
  --line_items[0][quantity]=1 \
  --mode=subscription
```

## 5. Monitor Webhook Logs

### Worker Logs (Local)
```bash
# In worker terminal, watch for incoming webhooks
# Logs will show webhook processing

# For deployed worker
cd packages/backend
wrangler tail
```

### Stripe CLI Logs
```bash
# View detailed webhook events
stripe logs tail

# Filter by specific events
stripe logs tail --filter-events="customer.subscription.*"
```

## 6. Test Webhook Endpoints Directly

### Test Subscription Webhook
```bash
curl -X POST http://localhost:8787/stripe/webhook/subscription \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=test,v1=test" \
  -d '{
    "id": "evt_test",
    "object": "event",
    "type": "customer.subscription.created",
    "data": {
      "object": {
        "id": "sub_test",
        "customer": "cus_test",
        "status": "active"
      }
    }
  }'
```

### Test Payment Webhook
```bash
curl -X POST http://localhost:8787/stripe/webhook/payment \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=test,v1=test" \
  -d '{
    "id": "evt_test",
    "object": "event",
    "type": "invoice.payment_succeeded",
    "data": {
      "object": {
        "id": "in_test",
        "customer": "cus_test",
        "amount_paid": 799
      }
    }
  }'
```

## 7. Webhook Endpoint Configuration

### Local Testing URLs
```
Subscription Webhook: http://localhost:8787/stripe/webhook/subscription
Payment Webhook: http://localhost:8787/stripe/webhook/payment
```

### Production URLs
```
Subscription Webhook: https://api.astropal.io/stripe/webhook/subscription
Payment Webhook: https://api.astropal.io/stripe/webhook/payment
```

## 8. Webhook Verification

### Update Webhook Secrets
```bash
# Set the webhook endpoint secret from Stripe CLI output
cd packages/backend

# For subscription webhooks
wrangler secret put STRIPE_WEBHOOK_SECRET_SUBSCRIPTION
# Paste the whsec_... key from stripe listen output

# For payment webhooks  
wrangler secret put STRIPE_WEBHOOK_SECRET_PAYMENT
# Paste the whsec_... key from stripe listen output
```

## 9. Expected Webhook Events

### Subscription Lifecycle
1. `customer.subscription.created` - New subscription started
2. `invoice.payment_succeeded` - Successful recurring payment
3. `invoice.payment_failed` - Failed payment (trigger recovery)
4. `customer.subscription.updated` - Plan changes
5. `customer.subscription.deleted` - Subscription canceled

### Payment Events
1. `checkout.session.completed` - Successful checkout
2. `payment_intent.succeeded` - Payment processed
3. `payment_intent.payment_failed` - Payment failed

## 10. Testing Scenarios

### Test Complete User Journey
```bash
# 1. User registers (manual or via API)
curl -X POST http://localhost:8787/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "birthDate": "1990-01-01",
    "birthLocation": "New York, NY",
    "perspective": "calm",
    "focusAreas": ["wellness"]
  }'

# 2. Create Stripe customer and subscription
stripe customers create --email="test@example.com"
stripe subscriptions create --customer=cus_xxx --items[0][price]=price_basic

# 3. Trigger webhook events and verify database updates
# 4. Test payment failure and recovery
# 5. Test subscription cancellation
```

### Verify Database Updates
```sql
-- Check user tier updates
SELECT id, email, tier, subscription_status FROM users WHERE email = 'test@example.com';

-- Check email logs
SELECT * FROM email_logs WHERE user_id = 'user_id_here' ORDER BY sent_at DESC;

-- Check webhook processing logs  
SELECT * FROM email_engagement WHERE action_type = 'webhook_processed';
```

## 11. Common Issues & Debugging

### Webhook Not Received
- Check Stripe CLI is running and forwarding
- Verify endpoint URLs are correct
- Check firewall/network settings for local testing

### Signature Verification Failed
- Ensure webhook secret is correctly set
- Check timestamp tolerance (default 5 minutes)
- Verify raw request body is used for signature

### Database Errors
- Check D1 database connection
- Verify user exists before processing subscription events
- Check for duplicate event processing

### Logging Commands
```bash
# View all webhook attempts
stripe events list --limit=10

# Get specific event details
stripe events retrieve evt_xxxxxx

# Check webhook endpoint status
stripe webhook_endpoints list
```

## 12. Production Webhook Setup

### Create Webhook Endpoints in Stripe Dashboard
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://api.astropal.io/stripe/webhook/subscription`
3. Select events: `customer.subscription.*`, `invoice.payment_*`
4. Add endpoint: `https://api.astropal.io/stripe/webhook/payment`
5. Select events: `checkout.session.completed`, `payment_intent.*`

### Production Testing
```bash
# Test production webhooks
stripe trigger customer.subscription.created --endpoint=https://api.astropal.io/stripe/webhook/subscription

stripe trigger invoice.payment_succeeded --endpoint=https://api.astropal.io/stripe/webhook/subscription
```

This comprehensive testing ensures your webhook integration works correctly before going live! 