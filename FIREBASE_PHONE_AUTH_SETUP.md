# Firebase Phone Authentication Setup Guide

## Issue
Phone verification is failing to send OTP during sign up.

## Solution
The code has been updated with:
1. **Visible reCAPTCHA** (instead of invisible) - more reliable
2. **Better error handling** with specific error messages
3. **Proper cleanup** of reCAPTCHA on component unmount

## Required Firebase Configuration

To make phone authentication work, you need to configure Firebase properly:

### Step 1: Enable Phone Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Phone** and **Enable** it
5. Save changes

### Step 2: Add Authorized Domains
Phone authentication only works on authorized domains:

1. In Firebase Console, go to **Authentication** → **Settings** → **Authorized domains**
2. Add these domains:
   ```
   tripsang.com
   www.tripsang.com
   tripsang.netlify.app
   localhost (should already be there for testing)
   ```

### Step 3: Verify Firebase Config in Client
Check that `client/.env.local` has all Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Important:** Make sure to also add these to **Netlify Environment Variables** for production.

### Step 4: Test Phone Verification

1. Go to `https://tripsang.com/auth/signup`
2. Enter your name
3. Enter phone number with country code (e.g., `+919876543210`)
4. Click **Verify**
5. You should see a visible reCAPTCHA checkbox
6. Solve the reCAPTCHA
7. OTP will be sent to your phone
8. Enter the 6-digit OTP and click **Confirm**

## Common Issues & Solutions

### Error: "Captcha verification failed"
- **Cause:** reCAPTCHA is not properly initialized
- **Solution:** Refresh the page and try again

### Error: "Too many requests"
- **Cause:** Firebase has rate limits
- **Solution:** Wait a few minutes and try again

### Error: "Invalid phone number format"
- **Cause:** Missing country code or wrong format
- **Solution:** Always include `+` and country code (e.g., `+91` for India)

### reCAPTCHA not showing
- **Cause:** Domain not authorized or Firebase config missing
- **Solution:** Check Steps 2 and 3 above

### OTP not received
- **Cause:** Phone number might be incorrect or carrier issues
- **Solution:** 
  - Double-check phone number
  - Try with a different phone number
  - Check if SMS quota is exhausted in Firebase Console

## Testing with Test Phone Numbers (Development)

For testing without using real phone numbers:

1. In Firebase Console → **Authentication** → **Sign-in method** → **Phone**
2. Scroll to **Phone numbers for testing**
3. Add test numbers:
   ```
   Phone: +919999999999
   Code: 123456
   ```
4. Use these in development to test the flow without sending real SMS

## Deployment Notes

After fixing and deploying:
1. Clear browser cache
2. Test on incognito/private window first
3. Verify reCAPTCHA appears correctly
4. Confirm OTP is received

---

**Status:** The code is now updated with a more reliable implementation. Once Firebase is properly configured, phone verification should work smoothly.
