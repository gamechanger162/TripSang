# TripSang Razorpay Setup Guide

Follow these steps to configure the monthly subscription system with a 30-day free trial.

## Step 1: Create a Razorpay Account
1. Go to [https://razorpay.com/](https://razorpay.com/) and sign up.
2. Log in to your Dashboard.
3. Ensure you are in **Test Mode** (toggle switch at the top) for development.

## Step 2: Get API Keys
1. In the Dashboard left menu, go to **Settings** (gear icon) -> **API Keys**.
2. Click **Generate Test Key**.
3. You will see a `Key ID` (starts with `rzp_test_...`) and a `Key Secret`.
4. **Copy these immediately**. You won't be able to see the secret again.

## Step 3: Create a Subscription Plan
1. In the Dashboard left menu, go to **Subscriptions**. (If you don't see it, look under "Payment Products").
2. Click on **Plans**.
3. Click **+ Create New Plan**.
4. Fill in the details:
   - **Plan Name**: TripSang Monthly Premium
   - **Plan Description**: Monthly membership with verified badge and unlimited trips.
   - **Billing Frequency**: 
     - **Period**: Monthly
     - **Interval**: 1
   - **Billing Amount**: 99 (or your desired amount in INR)
   - **Notes**: (Optional)
5. Click **Create Plan**.
6. Once created, you will see a **Plan ID** in the list (e.g., `plan_LNxxxxxxxxx`). **Copy this ID**.

## Step 4: Configure Environment Variables
You need to update your server `.env` file with these values.

Open `server/.env` and update/add the following lines:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_key_id_from_step_2
RAZORPAY_KEY_SECRET=your_key_secret_from_step_2
RAZORPAY_PLAN_ID=your_plan_id_from_step_3
```

## Step 5: Webhooks (Optional for local dev, Required for Prod)
To automatically handle failed payments or subscription cancellations:
1. Go to **Settings** -> **Webhooks**.
2. Add a new webhook.
3. **Webhook URL**: Your server URL + `/api/payments/webhook` (e.g., `https://api.tripsang.com/api/payments/webhook`).
4. **Secret**: Create a strong password (e.g., `tripsang_webhook_secret_123`).
5. **Active Events**: Check `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `payment.failed`.
6. Add `RAZORPAY_WEBHOOK_SECRET` to your `.env` file.

---
**Status**: The code changes for the subscription logic are already applied. Once you update the `.env` file, restart the server and the payment page will work!
