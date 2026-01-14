# 🌐 TripSang Domain Migration Guide

Congratulations on setting up **tripsang.com**! 🎉

To make sure everything works perfectly with your new domain, please follow these steps to update your configuration.

---

## 1. ✅ Netlify Configuration (Critical)

Go to **[Netlify Dashboard](https://app.netlify.com)** → **Site Settings** → **Environment variables**.

Update the following variables:

| Variable | Old Value | **New Value** |
|----------|-----------|---------------|
| `AUTH_URL` | `https://tripsang.netlify.app` | `https://tripsang.com` |
| `NEXT_PUBLIC_APP_URL` | `https://tripsang.netlify.app` | `https://tripsang.com` |

**After updating:**
1. Go to the **Deploys** tab.
2. Click **Trigger deploy** → **Deploy site**.
3. Passwords and login links will now use the correct domain!

---

## 2. 🔑 Google Cloud Console (OAuth)

Your Google Login will break until you add the new domain.

1. Go to **[Google Cloud Console](https://console.cloud.google.com/apis/credentials)**.
2. Select your project.
3. Click on your **OAuth 2.0 Client ID** (Web client).
4. **Authorized Javascript Origins**:
   - Add: `https://tripsang.com`
   - Add: `https://www.tripsang.com`
5. **Authorized Redirect URIs**:
   - Add: `https://tripsang.com/api/auth/callback/google`
   - Add: `https://www.tripsang.com/api/auth/callback/google`
6. Click **Save**.

---

## 3. 🔥 Firebase Console (Phone Auth)

Phone verification needs to know your new domain is safe.

1. Go to **[Firebase Console](https://console.firebase.google.com)**.
2. Select your project.
3. Go to **Authentication** → **Settings** tab.
4. Click **Authorized domains**.
5. Click **Add domain**.
6. Enter: `tripsang.com`
7. Click **Add**.

---

## 4. 🚀 Backend Configuration (Render)

**I have already updated the backend code for you!** ✅

I updated `server/index.js` to explicitly allow:
- `https://tripsang.com`
- `https://www.tripsang.com`

This change was pushed to GitHub and Render will automatically redeploy your backend.

**Optional (For extra safety):**
If you have a `CLIENT_URL` environment variable set in your [Render Dashboard](https://dashboard.render.com/), update it to:
`https://tripsang.com`

---

## 5. 🧪 Final Verification Checklist

Once you've made these changes, test your live site:

- [ ] **Visit:** [https://tripsang.com](https://tripsang.com)
- [ ] **Login:** Try logging in with **Google** (tests OAuth redirect).
- [ ] **Phone Verify:** Try verifying a phone number (tests Firebase domain).
- [ ] **Search:** Run a search (tests API & CORS).
- [ ] **Dashboard:** Go to `/admin/dashboard` (tests Auth session).

**Enjoy your professional domain!** 🌍✈️
