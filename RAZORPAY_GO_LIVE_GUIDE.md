# 🚀 Razorpay Go-Live Guide for TripSang

Ready to accept real payments? Follow this step-by-step checklist to switch your TripSang integration from **Test Mode** to **Live Mode**.

## 🛑 Important Prerequisites
1. **Complete KYC:** Ensure your account KYC is approved by Razorpay.
2. **Website Details:** Razorpay will verify your website has:
   - "About Us", "Contact Us" pages.
   - "Terms & Conditions", "Privacy Policy", "Refund Policy".
   - Pricing details visible.

---

## Step 1: Switch Dashboard to Live Mode
1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. In the top-right corner, switch the toggle from **Test Mode** to **Live Mode**.

---

## Step 2: Generate Live API Keys
1. Go to **Settings** -> **API Keys**.
2. Click **Generate Live Key**.
3. **Copy these immediately!** You will see:
   - `Key ID` (starts with `rzp_live_...`)
   - `Key Secret`
4. Store them securely; you won't be able to see the Secret again.

---

## Step 3: Re-Create Subscription Plan (Critical!)
**⚠️ Plans created in Test Mode do NOT exist in Live Mode.**
1. In the Razorpay Live Dashboard, go to **Attributes** -> **Plan** (under Subscriptions).
2. Create a new Plan exactly like your test one:
   - **Name:** "TripSang Monthly Premium"
   - **Amount:** ₹99 (or your price)
   - **Period:** Monthly
   - **Billing Frequency:** 1
3. Once created, copy the **Plan ID** (e.g., `plan_Live12345678`).

---

## Step 4: Configure Webhooks for Live
1. Go to **Settings** -> **Webhooks**.
2. Click **Add New Webhook**.
3. **Webhook URL:** `https://tripsang.onrender.com/api/payments/webhook`
   *(Confirmed from your Render Dashboard)*
4. **Secret:** Create a strong secret (e.g., `TripSangLiveSecret2024`).
5. **Active Events:** Select the following:
   - `subscription.charged`
   - `subscription.cancelled`
   - `subscription.halted`
   - `subscription.completed`
   - `payment.captured`
   - `payment.failed`
6. Click **Create Webhook**.

---

## Step 5: Update Environment Variables
You need to update these variables in your **Production Deployment** (Render, Vercel, Netlify) and your local `.env` if testing locally.

| Variable Name | New Live Value Format | Where to Update |
|--------------|----------------------|-----------------|
| `RAZORPAY_KEY_ID` | `rzp_live_SA2AQkFl57VUmk` | Server (Render) |
| `RAZORPAY_KEY_SECRET` | `fiZ8iHnOXqzQZkZU6lse2e1O` | Server (Render) |
| `RAZORPAY_PLAN_ID` | `plan_SA2CdjYFcm3TsC` | Server (Render) |
| `RAZORPAY_WEBHOOK_SECRET` | `NandanKumar159357` | Server (Render) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_live_SA2AQkFl57VUmk` | Client (Vercel/Netlify) |

> **Note:** `RAZORPAY_KEY_ID` is usually needed on the server, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` is needed on the Client. They should be the SAME live key ID.

---

## Step 6: Verify & Deploy
1. **Update Production Settings:** Go to your hosting dashboard (e.g., Render for Backend, Netlify/Vercel for Frontend) and update the Environment Variables.
2. **Re-deploy:** Trigger a new deployment so the apps pick up the new variables.

## Step 7: Final Test (Real Money)
1. Open your live website.
2. Sign up as a new user (or use a non-subscribed account).
3. Choose "Buy 1 Month Premium".
4. **Pay ₹1 (or full amount):** Since this is live, money will be deducted. You can verify the flow works.
5. Check if:
   - You get redirected to Dashboard.
   - The "Premium" badge appears.
   - You receive the "Subscription Created" email/SMS from Razorpay.

---

## ✅ Checklist
- [ ] KYC Approved
- [ ] Live Keys Generated (`rzp_live_...`)
- [ ] Live Plan Created (`plan_...`)
- [ ] Live Webhook Configured
- [ ] Env Vars Updated (Server & Client)
- [ ] Re-deployed
- [ ] Real Transaction Tested

**Congratulations! You are now live.** 🚀
