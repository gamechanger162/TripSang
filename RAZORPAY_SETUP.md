# Razorpay Logic Setup Guide

## Overview
Razorpay integration has been fully implemented in the TripSang codebase. This includes:
1.  **Backend Controller**: Handles Order Creation, Payment Verification, and Webhooks.
2.  **Frontend Page**: A dedicated `/payment/signup` page that checks if payment is required and processes it.
3.  **Signup Integration**: Users are automatically redirected to the payment page after registration.

## Steps to Activate

To make payments work, you simply need to configure the credentials.

### 1. Get Razorpay Keys
1.  Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/).
2.  Go to **Settings** -> **API Keys**.
3.  Generate a **Key ID** and **Key Secret**.

### 2. Configure Server Environment
Open `server/.env` and add the following lines (replace placeholders with your actual keys):

```env
RAZORPAY_KEY_ID=rzp_test_YourKeyID
RAZORPAY_KEY_SECRET=YourKeySecret
RAZORPAY_WEBHOOK_SECRET=optional_webhook_secret
```

### 3. Deploy
- **Backend**: Redeploy your backend to Render/Heroku so the new env vars take effect.
- **Frontend**: The frontend changes are already deployed.

### 4. Enable Paid Signup (Admin)
1.  Log in as Admin (`admin@tripsang.com`).
2.  Go to **Admin Dashboard**.
3.  Navigate to **Settings**.
4.  Toggle **"Enable Paid Signup"**.
5.  Set the **Signup Fee** (e.g., 499 INR).

### 5. Test
1.  Sign up a new user.
2.  You should be redirected to the Payment Page.
3.  Complete payment (use Razorpay Test Card credentials if in test mode).
4.  You will be redirected to the User Dashboard with a "Premium" badge.
