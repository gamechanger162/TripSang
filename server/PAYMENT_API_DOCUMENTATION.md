# 💳 Payment API Documentation - Razorpay Integration

Complete guide for TripSang payment endpoints using Razorpay.

---

## 📋 Payment Routes

**Base Path:** `/api/payments`

### 1. Create Signup Order
**POST `/api/payments/create-order`**

Creates a Razorpay order for signup fee. **Automatically checks GlobalConfig!**

**Access:** Private (requires authentication)

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** None required

**Response (Paid Signup Disabled):**
```json
{
  "success": true,
  "skipped": true,
  "message": "Signup fee is currently disabled. No payment required."
}
```

**Response (Paid Signup Enabled):**
```json
{
  "success": true,
  "skipped": false,
  "order": {
    "id": "order_xyz123",
    "amount": 99,
    "currency": "INR",
    "paymentId": "payment_db_id"
  },
  "razorpayKeyId": "rzp_test_xxxxx"
}
```

**Logic Flow:**
1. ✅ Check `GlobalConfig.enablePaidSignup`
2. ✅ If disabled → Return `{ skipped: true }`
3. ✅ If enabled → Check `signupFee` amount
4. ✅ If fee > 0 → Create Razorpay order
5. ✅ Save payment record with status 'pending'
6. ✅ Return order details to frontend

---

### 2. Verify Payment
**POST `/api/payments/verify-payment`**

Verifies Razorpay payment signature after successful payment.

**Access:** Private

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "razorpay_order_id": "order_xyz123",
  "razorpay_payment_id": "pay_abc456",
  "razorpay_signature": "signature_string"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Payment verified successfully.",
  "payment": {
    "id": "payment_db_id",
    "amount": 99,
    "status": "success",
    "type": "signup_fee"
  }
}
```

**Response (Failed):**
```json
{
  "success": false,
  "message": "Payment verification failed. Signature mismatch."
}
```

**What Happens:**
1. ✅ Finds payment record by order_id
2. ✅ Verifies Razorpay signature using HMAC SHA256
3. ✅ Updates payment status to 'success'
4. ✅ Awards 'Premium' badge to user
5. ✅ Returns verified payment details

---

### 3. Get My Payments
**GET `/api/payments/my-payments`**

Get current user's payment history.

**Access:** Private

**Query Parameters:**
- `type` (optional) - Filter by type: 'signup_fee', 'guide_commission', etc.
- `status` (optional) - Filter by status: 'pending', 'success', 'failed'
- `page` (default: 1) - Page number
- `limit` (default: 20) - Results per page

**Example:** `/api/payments/my-payments?type=signup_fee&page=1`

**Response:**
```json
{
  "success": true,
  "payments": [
    {
      "_id": "payment_id",
      "transactionId": "order_xyz123",
      "amount": 99,
      "currency": "INR",
      "status": "success",
      "type": "signup_fee",
      "createdAt": "2026-01-14T...",
      "completedAt": "2026-01-14T..."
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalPayments": 1,
    "paymentsPerPage": 20
  }
}
```

---

### 4. Razorpay Webhook
**POST `/api/payments/webhook`**

Handles Razorpay webhook events for automated payment updates.

**Access:** Public (verified by signature)

**Headers:**
```
x-razorpay-signature: <webhook_signature>
```

**Supported Events:**
- `payment.captured` - Payment successfully captured
- `payment.failed` - Payment failed

**Response:**
```json
{
  "success": true
}
```

**Setup in Razorpay Dashboard:**
1. Go to Settings → Webhooks
2. Add webhook URL: `https://your-backend.onrender.com/api/payments/webhook`
3. Select events: `payment.captured`, `payment.failed`
4. Copy webhook secret and add to `RAZORPAY_WEBHOOK_SECRET` env var

---

### 5. Admin: Get All Payments
**GET `/api/payments/admin/all`**

Get all platform payments (Admin only).

**Access:** Private (Admin)

**Query Parameters:**
- `type` - Filter by payment type
- `status` - Filter by status
- `userId` - Filter by user ID
- `startDate` - Filter from date
- `endDate` - Filter to date
- `page` - Page number
- `limit` - Results per page

**Example:** `/api/payments/admin/all?status=success&page=1`

**Response:**
```json
{
  "success": true,
  "payments": [
    {
      "_id": "payment_id",
      "userId": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "amount": 99,
      "status": "success",
      "type": "signup_fee",
      "createdAt": "2026-01-14T..."
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalPayments": 95
  },
  "revenue": {
    "total": 9405,
    "successfulPayments": 95
  }
}
```

---

## 🔧 Environment Variables

Add to `server/.env`:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

Get these from [Razorpay Dashboard](https://dashboard.razorpay.com/):
- API Keys → Use **Test Mode** for development
- Webhooks → Create webhook and copy secret

---

## 💻 Frontend Integration Example

### Step 1: Create Order

```typescript
import { paymentAPI } from '@/lib/api';

const handlePayment = async () => {
  try {
    // Create order
    const { order, skipped, razorpayKeyId } = await paymentAPI.createOrder();
    
    // Check if payment is required
    if (skipped) {
      console.log('No payment required!');
      return;
    }
    
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
    
    script.onload = () => {
      // Initialize Razorpay
      const options = {
        key: razorpayKeyId,
        amount: order.amount * 100, // Amount in paise
        currency: order.currency,
        name: 'TripSang',
        description: 'Signup Fee',
        order_id: order.id,
        handler: async (response) => {
          // Payment successful, verify on backend
          const verified = await paymentAPI.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          
          if (verified.success) {
            alert('Payment successful!');
          }
        },
        prefill: {
          name: user.name,
          email: user.email
        }
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    };
    
  } catch (error) {
    console.error('Payment error:', error);
  }
};
```

### Step 2: Add to API Client

Update `client/src/lib/api.ts`:

```typescript
export const paymentAPI = {
  createOrder: async () => {
    return fetchWithAuth('/api/payments/create-order', {
      method: 'POST'
    });
  },
  
  verifyPayment: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    return fetchWithAuth('/api/payments/verify-payment', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  getMyPayments: async (filters?: any) => {
    const params = new URLSearchParams(filters);
    return fetchWithAuth(`/api/payments/my-payments?${params}`);
  }
};
```

---

## 🧪 Testing

### Test Create Order (Signup Disabled)

```bash
# Login first to get token
TOKEN="your_jwt_token"

curl -X POST https://tripsang.onrender.com/api/payments/create-order \
  -H "Authorization: Bearer $TOKEN"
```

Expected if disabled:
```json
{ "success": true, "skipped": true }
```

### Enable Paid Signup (Admin)

```bash
curl -X PUT https://tripsang.onrender.com/api/admin/config \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enablePaidSignup": true,
    "signupFee": 99
  }'
```

### Test Create Order (Enabled)

```bash
curl -X POST https://tripsang.onrender.com/api/payments/create-order \
  -H "Authorization: Bearer $TOKEN"
```

Should return Razorpay order details!

---

## 🔐 Security Features

- ✅ Signature verification for all payments
- ✅ Webhook signature validation
- ✅ HTTPS required in production
- ✅ Payment records saved before order creation
- ✅ Double-payment prevention
- ✅ Admin-only access to all payments

---

## 📊 Payment Flow Diagram

```
User → Create Order
         ↓
    Check GlobalConfig
         ↓
    Is enablePaidSignup?
    /              \
  NO               YES
   ↓                ↓
{ skipped }   Create Razorpay Order
                    ↓
              Return to Frontend
                    ↓
              Show Razorpay UI
                    ↓
            User Makes Payment
                    ↓
           Razorpay Captures
                    ↓
        Webhook → Update DB (Auto)
                    ↓
      Frontend Verifies Signature
                    ↓
          Payment Complete! 🎉
```

---

**Payment system is production-ready!** 🚀
