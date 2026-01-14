# 🔧 Razorpay Setup Guide for TripSang

Complete step-by-step guide to set up Razorpay payments.

---

## 📋 What You'll Need

1. Razorpay account (free)
2. API Keys (Test & Live)
3. 5 minutes of your time

---

## 🚀 Step 1: Create Razorpay Account

### 1.1 Sign Up
1. Go to **https://razorpay.com**
2. Click **"Sign Up"** (top right)
3. Choose **"Get Started Free"**
4. Fill in details:
   - Email
   - Phone number
   - Create password
5. Verify email/phone
6. Complete business details (can skip for testing)

### 1.2 Access Dashboard
- After signup, you'll land on: **https://dashboard.razorpay.com**
- You'll see **Test Mode** badge at the top

---

## 🔑 Step 2: Get API Keys

### 2.1 Navigate to API Keys
1. In Razorpay Dashboard, click **"Settings"** (⚙️ gear icon)
2. Click **"API Keys"** in left sidebar
3. You'll see **Test Keys** section

### 2.2 Generate Test Keys (Development)
1. If not already generated, click **"Generate Test Key"**
2. You'll see two keys:
   ```
   Key ID:     rzp_test_xxxxxxxxxxxxx
   Key Secret: [Click to reveal]
   ```
3. **Copy both keys immediately!**

**Example Test Keys:**
```
Key ID:     rzp_test_1234567890abcd
Key Secret: Ab1Cd2Ef3Gh4Ij5Kl6Mn7Op8Qr9St0
```

**⚠️ Important:**
- Test keys start with `rzp_test_`
- Live keys start with `rzp_live_`
- **Never share your Key Secret publicly!**
- Keep them safe - they give access to your account

---

## 📝 Step 3: Add Keys to Your Project

### 3.1 Local Development (.env file)

**Open:** `server/.env`

**Replace these lines:**
```env
RAZORPAY_KEY_ID=rzp_test_paste_your_key_id_here
RAZORPAY_KEY_SECRET=paste_your_key_secret_here
```

**With your actual keys:**
```env
RAZORPAY_KEY_ID=rzp_test_1234567890abcd
RAZORPAY_KEY_SECRET=Ab1Cd2Ef3Gh4Ij5Kl6Mn7Op8Qr9St0
```

**Full .env example:**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://tripsang:password@cluster.mongodb.net/
DB_NAME=tripsang

# Client Configuration
CLIENT_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=30d

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_1234567890abcd
RAZORPAY_KEY_SECRET=Ab1Cd2Ef3Gh4Ij5Kl6Mn7Op8Qr9St0
RAZORPAY_WEBHOOK_SECRET=will_add_later
```

**Save the file!**

---

### 3.2 Production (Render Dashboard)

1. **Go to Render:** https://dashboard.render.com
2. **Select your service:** `tripsang-api`
3. **Click "Environment"** tab
4. **Add/Update these variables:**

Click **"Add Environment Variable"** and add:

```
Key: RAZORPAY_KEY_ID
Value: rzp_test_1234567890abcd
```

```
Key: RAZORPAY_KEY_SECRET
Value: Ab1Cd2Ef3Gh4Ij5Kl6Mn7Op8Qr9St0
```

```
Key: RAZORPAY_WEBHOOK_SECRET
Value: (leave empty for now, add after Step 4)
```

5. **Click "Save Changes"**
6. **Render will auto-redeploy** (takes 2-3 minutes)

---

## 🔔 Step 4: Set Up Webhooks (Optional but Recommended)

Webhooks automatically notify your backend when payments succeed/fail.

### 4.1 Create Webhook

1. **Razorpay Dashboard** → **Settings** → **Webhooks**
2. Click **"Create New Webhook"**
3. Fill in details:

**Webhook URL:**
```
https://tripsang.onrender.com/api/payments/webhook
```

**Events to Subscribe:**
- ✅ `payment.captured`
- ✅ `payment.failed`
- ✅ `payment.authorized`

4. **Click "Create Webhook"**

### 4.2 Get Webhook Secret

1. After creating, you'll see **"Webhook Secret"**
2. Click to reveal and **copy** it
3. It looks like: `whsec_xxxxxxxxxxxxxxxxxxxxx`

### 4.3 Add Webhook Secret

**Local (.env):**
```env
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

**Render (Environment tab):**
```
Key: RAZORPAY_WEBHOOK_SECRET
Value: whsec_xxxxxxxxxxxxxxxxxxxxx
```

**Save and redeploy!**

---

## 🧪 Step 5: Test Your Setup

### 5.1 Test Locally

```bash
# Start your server
cd server
npm run dev
```

**The server should start without errors!** ✅

### 5.2 Test Create Order Endpoint

```bash
# Login first to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Copy the token from response
TOKEN="your_token_here"

# Try creating payment order
curl -X POST http://localhost:5000/api/payments/create-order \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (if paid signup disabled):**
```json
{
  "success": true,
  "skipped": true,
  "message": "Signup fee is currently disabled. No payment required."
}
```

### 5.3 Enable Paid Signup

```bash
# Make yourself admin first (see DEPLOYMENT guide)
# Then enable paid signup via admin API

curl -X PUT http://localhost:5000/api/admin/config \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enablePaidSignup": true,
    "signupFee": 99
  }'
```

### 5.4 Test Payment Order Creation

```bash
curl -X POST http://localhost:5000/api/payments/create-order \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (if enabled):**
```json
{
  "success": true,
  "skipped": false,
  "order": {
    "id": "order_xxxxx",
    "amount": 99,
    "currency": "INR",
    "paymentId": "..."
  },
  "razorpayKeyId": "rzp_test_1234567890abcd"
}
```

**✅ If you see this, Razorpay is working!**

---

## 💳 Step 6: Test Payment Flow (Frontend Integration)

**Add Razorpay to Frontend:**

### 6.1 Update Client .env.local

```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_1234567890abcd
```

### 6.2 Frontend Integration Example

```typescript
// Load Razorpay script
const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Handle payment
const handlePayment = async () => {
  // Create order
  const { order, razorpayKeyId } = await fetch('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  
  // Load Razorpay
  await loadRazorpay();
  
  // Open payment modal
  const options = {
    key: razorpayKeyId,
    amount: order.amount * 100,
    currency: order.currency,
    order_id: order.id,
    name: 'TripSang',
    description: 'Signup Fee',
    handler: async (response) => {
      // Verify payment
      await fetch('/api/payments/verify-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(response)
      });
      alert('Payment successful!');
    }
  };
  
  const razorpay = new window.Razorpay(options);
  razorpay.open();
};
```

---

## 🧪 Test Cards (Test Mode Only)

Use these cards to test payments in **Test Mode**:

**Success:**
```
Card Number: 4111 1111 1111 1111
CVV: Any 3 digits (e.g., 123)
Expiry: Any future date
```

**Failure:**
```
Card Number: 4000 0000 0000 0002
CVV: Any 3 digits
Expiry: Any future date
```

**More test cards:** https://razorpay.com/docs/payments/payments/test-card-details/

---

## 🔄 Switch to Live Mode (Production)

### When Ready for Real Payments:

1. **Complete KYC** in Razorpay Dashboard
   - Settings → Account & Settings
   - Upload required documents
   - Wait for approval (1-2 days)

2. **Generate Live Keys**
   - Settings → API Keys
   - Switch to "Live Mode"
   - Generate Live Keys
   - They start with `rzp_live_`

3. **Update Production Keys**
   - In Render: Update environment variables
   - Replace `rzp_test_` with `rzp_live_`

4. **Update Webhook URL**
   - Create new webhook for Live Mode
   - Use same URL but in Live Mode section

**⚠️ Important:**
- Test thoroughly in Test Mode first!
- Never mix Test and Live keys
- Keep Live keys super secure

---

## 📊 Where to Find Things in Razorpay

| What You Need | Where to Find It |
|---------------|------------------|
| **API Keys** | Settings → API Keys |
| **Webhooks** | Settings → Webhooks |
| **Test Payments** | Transactions → Test Mode |
| **Live Payments** | Transactions → Live Mode |
| **Test Cards** | Docs → Test Card Details |
| **Payment Logs** | Transactions → Payments |

---

## ✅ Checklist

- [ ] Created Razorpay account
- [ ] Generated Test API Keys
- [ ] Added keys to `server/.env`
- [ ] Added keys to Render environment variables
- [ ] Tested `/create-order` endpoint
- [ ] Set up webhooks
- [ ] Added webhook secret
- [ ] Tested with test card
- [ ] Ready for frontend integration!

---

## 🆘 Troubleshooting

### Issue: "Authentication failed"
**Fix:** Check if keys are correct, no extra spaces

### Issue: "Order creation failed"
**Fix:** 
- Verify RAZORPAY_KEY_ID starts with `rzp_test_`
- Check RAZORPAY_KEY_SECRET is set
- Restart server after updating .env

### Issue: "Webhook not receiving events"
**Fix:**
- Verify webhook URL is correct
- Check HTTPS (required for webhooks)
- Verify webhook secret is added

### Issue: "Payment verification failed"
**Fix:**
- Check RAZORPAY_KEY_SECRET is correct
- Ensure signature verification logic is working

---

## 📚 Helpful Links

- **Razorpay Dashboard:** https://dashboard.razorpay.com
- **API Docs:** https://razorpay.com/docs/api/
- **Test Cards:** https://razorpay.com/docs/payments/payments/test-card-details/
- **Webhooks Guide:** https://razorpay.com/docs/webhooks/
- **Integration Checklist:** https://razorpay.com/docs/payments/payment-gateway/

---

## 🎉 You're All Set!

Your Razorpay integration is ready for:
- ✅ Signup fee payments
- ✅ Guide commissions (future)
- ✅ Trip bookings (future)
- ✅ Any custom payments

**Questions?** Check the payment API documentation in `server/PAYMENT_API_DOCUMENTATION.md`

---

**Happy integrating! 💳**
