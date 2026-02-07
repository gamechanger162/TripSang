# How to Change Firebase Account for Phone Authentication

## Overview
This guide will help you switch from your current Firebase account (`tripsang-e255f`) to a new Firebase account for phone authentication.

---

## Part 1: Create New Firebase Project

### Step 1: Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Sign in with your **NEW Google account** (the one you want to use)

### Step 2: Create New Project
1. Click **"Create a project"** or **"Add project"**
2. Enter project name (e.g., `TripSang-New` or `tripsang-production`)
3. Click **Continue**
4. (Optional) Enable Google Analytics
5. Click **Continue**, select or create Analytics account
6. Click **Create project**
7. Wait for project to be created, then click **Continue**

---

## Part 2: Configure Firebase Project

### Step 3: Enable Phone Authentication
1. In Firebase Console sidebar, click **Build** → **Authentication**
2. Click **Get started** (if first time)
3. Go to **Sign-in method** tab
4. Click on **Phone**
5. Toggle **Enable**
6. Click **Save**

### Step 4: Add Authorized Domains
1. Still in **Authentication**, go to **Settings** tab
2. Scroll to **Authorized domains** section
3. Click **Add domain** and add:
   ```
   tripsang.com
   www.tripsang.com
   tripsang.netlify.app
   your-custom-domain.com (if any)
   ```
   Note: `localhost` is already there by default for testing

### Step 5: (Optional) Add Test Phone Numbers
For development/testing without sending real SMS:
1. In **Authentication** → **Sign-in method** → **Phone**
2. Scroll down to **Phone numbers for testing**
3. Click **Add phone number**
4. Add test numbers (e.g., `+919999999999` with code `123456`)

---

## Part 3: Get New Firebase Credentials

### Step 6: Register Web App
1. In Firebase Console, click the **gear icon** ⚙️ (Project settings) at top
2. Scroll to **Your apps** section
3. Click the **Web icon** `</>` (Add app)
4. Enter app nickname: `TripSang Web`
5. (Optional) Check **"Also set up Firebase Hosting"** if needed
6. Click **Register app**

### Step 7: Copy Firebase Config
You'll see a code snippet like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-new-project.firebaseapp.com",
  projectId: "your-new-project",
  storageBucket: "your-new-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

**Copy these 6 values** - you'll need them in the next step.

---

## Part 4: Update TripSang Codebase

### Step 8: Update `.env.local` File

**Location:** `c:\Users\nanda\Downloads\TripSang\client\.env.local`

**Replace these lines (12-17):**
```env
# OLD VALUES (remove these)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCTUCEhd1bakjOTEp310U9g-mLrgzk8dPY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tripsang-e255f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tripsang-e255f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tripsang-e255f.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=496984224370
NEXT_PUBLIC_FIREBASE_APP_ID=1:496984224370:web:fc44c71ee12216d41ac8eb
```

**With NEW values from Step 7:**
```env
# NEW VALUES (from your new Firebase project)
NEXT_PUBLIC_FIREBASE_API_KEY=your-new-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-new-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-new-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-new-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-new-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-new-app-id
```

### Step 9: Update `.env.example` (Optional but recommended)
**Location:** `c:\Users\nanda\Downloads\TripSang\client\.env.example`

Update the Firebase section to reflect the new project structure (keep as placeholders):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

---

## Part 5: Update Production Environment

### Step 10: Update Netlify Environment Variables

If you're deploying on Netlify:

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Select your **TripSang** site
3. Go to **Site settings** → **Environment variables**
4. Update/Add these variables with **NEW** values:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-new-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-new-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-new-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-new-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-new-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-new-app-id
   ```
5. Click **Save**

### Step 11: Redeploy

After updating environment variables in Netlify:
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait for deployment to complete

---

## Part 6: Testing

### Step 12: Test Locally

```bash
# Stop your dev server if running
# Then restart
cd c:\Users\nanda\Downloads\TripSang\client
npm run dev
```

1. Go to `http://localhost:3000/auth/signup`
2. Enter name and phone number with country code (e.g., `+919876543210`)
3. Click **Verify**
4. Solve reCAPTCHA
5. Check if OTP is received on your phone
6. Enter OTP and complete signup

### Step 13: Test Production

1. Visit your production URL (e.g., `https://tripsang.com/auth/signup`)
2. Repeat the same test as Step 12
3. Clear browser cache if needed: **Ctrl+Shift+Delete** or use incognito mode

---

## Summary of Changes

### Files Modified:
1. ✅ `client/.env.local` - Updated 6 Firebase environment variables
2. ✅ (Optional) `client/.env.example` - Updated placeholders 
3. ✅ Netlify environment variables - Updated 6 Firebase variables

### No Code Changes Required!
The `client/src/lib/firebase.ts` file reads from environment variables, so **NO code changes needed**.

---

## Troubleshooting

### ❌ Error: "Firebase: Error (auth/invalid-api-key)"
- **Cause:** Wrong API key
- **Solution:** Double-check API key in `.env.local` and Netlify

### ❌ Error: "Firebase: Error (auth/unauthorized-domain)"
- **Cause:** Domain not in authorized domains
- **Solution:** Add domain in Firebase Console → Authentication → Settings → Authorized domains

### ❌ reCAPTCHA not showing
- **Cause:** Wrong auth domain or domain not authorized
- **Solution:** Check `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` and authorized domains

### ❌ OTP not received
- **Cause:** SMS quota exhausted or phone number issue
- **Solution:** 
  - Check Firebase Console → Authentication → Usage
  - Verify phone number format includes country code
  - Use test phone numbers for development

---

## Rollback (If Needed)

If something goes wrong, you can rollback by:

1. Restore old values in `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCTUCEhd1bakjOTEp310U9g-mLrgzk8dPY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tripsang-e255f.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tripsang-e255f
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tripsang-e255f.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=496984224370
   NEXT_PUBLIC_FIREBASE_APP_ID=1:496984224370:web:fc44c71ee12216d41ac8eb
   ```

2. Restore old values in Netlify environment variables
3. Redeploy

---

## Important Notes

> [!CAUTION]
> - **Do NOT commit `.env.local` to git!** It contains sensitive credentials
> - Keep your Firebase API keys secure
> - The `.env.local` file is already in `.gitignore`

> [!WARNING]
> - Changing Firebase accounts will **NOT** affect existing users
> - Phone auth data is stored in your backend (MongoDB), not Firebase
> - Firebase is only used for **sending OTP**, not storing user data

> [!TIP]
> - Set up **billing** in new Firebase project if needed (for high SMS volume)
> - Monitor usage in Firebase Console → Authentication → Usage
> - Consider setting up **Firebase Blaze plan** if free tier is insufficient

---

## Need Help?

If you encounter issues:
1. Check [Firebase Phone Auth Setup Guide](./FIREBASE_PHONE_AUTH_SETUP.md)
2. Verify all environment variables are correct
3. Check Firebase Console for error logs
4. Test with test phone numbers first before real numbers
