# 🚀 Netlify Deployment Guide - TripSang Frontend

Complete step-by-step guide to deploy the Next.js frontend to Netlify.

---

## 📋 Prerequisites

- ✅ GitHub account (with TripSang repo)
- ✅ Netlify account (free tier works)
- ✅ Backend deployed on Render: `https://tripsang.onrender.com`
- ✅ All environment variables ready

---

## 🌐 Method 1: Deploy via Netlify Dashboard (Recommended)

### Step 1: Create Netlify Account

1. Go to **https://netlify.com**
2. Click **"Sign Up"** (top right)
3. Choose **"Sign up with GitHub"**
4. Authorize Netlify to access your GitHub repos

---

### Step 2: Import TripSang Repository

1. Once logged in, click **"Add new site"** → **"Import an existing project"**

2. Choose **"Deploy with GitHub"**

3. **Authorize Netlify** if prompted

4. **Select Repository:**
   - Search for: `gamechanger162/TripSang`
   - Click on it

5. **Configure Build Settings:**

**Owner:** Your account  
**Branch to deploy:** `main`  
**Base directory:** `client`  
**Build command:** `npm run build`  
**Publish directory:** `client/.next`  

6. Click **"Show advanced"** → **"Add environment variable"**

---

### Step 3: Add Environment Variables

Click **"New variable"** for each of these:

#### **Required Variables:**

```
AUTH_SECRET=<your-generated-secret>
AUTH_URL=https://your-site-name.netlify.app

NEXT_PUBLIC_API_URL=https://tripsang.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://tripsang.onrender.com

NEXT_PUBLIC_APP_NAME=TripSang
NEXT_PUBLIC_APP_URL=https://your-site-name.netlify.app
```

#### **Google OAuth (if configured):**

```
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
```

#### **Firebase (if configured):**

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

#### **Razorpay (if configured):**

```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

**Note:** You'll need to update `AUTH_URL` and `NEXT_PUBLIC_APP_URL` after deployment with your actual Netlify URL.

---

### Step 4: Deploy!

1. Click **"Deploy site"**

2. **Wait for build** (2-5 minutes)
   - You'll see build logs
   - Green checkmark = Success!

3. **Get your URL:**
   - You'll see: `https://random-name-123456.netlify.app`
   - This is your live site!

---

### Step 5: Update Environment Variables

**Important:** Update these two variables with your actual Netlify URL:

1. Go to **Site settings** → **Environment variables**

2. Edit these variables:
   ```
   AUTH_URL=https://your-actual-site.netlify.app
   NEXT_PUBLIC_APP_URL=https://your-actual-site.netlify.app
   ```

3. Click **"Save"**

4. Go to **Deploys** → **Trigger deploy** → **"Deploy site"**

---

### Step 6: Configure Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**

2. Click **"Add custom domain"**

3. **If you own tripsang.com:**
   - Enter: `tripsang.com`
   - Follow DNS configuration steps
   - Add these records to your domain provider:
     ```
     Type: A
     Name: @
     Value: 75.2.60.5
     
     Type: CNAME
     Name: www
     Value: your-site.netlify.app
     ```

4. **Free Netlify Subdomain:**
   - Click **"Options"** → **"Edit site name"**
   - Change to: `tripsang`
   - Your URL becomes: `https://tripsang.netlify.app`

---

## 🔧 Method 2: Deploy via Netlify CLI

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Login to Netlify

```bash
netlify login
```

This opens your browser to authenticate.

### Step 3: Initialize Site

```bash
cd client
netlify init
```

Follow the prompts:
- **Create & configure new site**
- Choose your team
- Site name: `tripsang`
- Build command: `npm run build`
- Publish directory: `.next`

### Step 4: Set Environment Variables

```bash
netlify env:set AUTH_SECRET "your-secret-here"
netlify env:set NEXT_PUBLIC_API_URL "https://tripsang.onrender.com"
netlify env:set NEXT_PUBLIC_SOCKET_URL "https://tripsang.onrender.com"
# ... add all other variables
```

### Step 5: Deploy

```bash
# Build first
npm run build

# Deploy to production
netlify deploy --prod
```

---

## 🔄 Update Google OAuth Redirect URIs

After deployment, update your Google OAuth settings:

1. **Go to Google Cloud Console:** https://console.cloud.google.com

2. **APIs & Services** → **Credentials**

3. Find your **OAuth 2.0 Client ID**

4. **Add Authorized redirect URIs:**
   ```
   https://your-site.netlify.app/api/auth/callback/google
   https://tripsang.netlify.app/api/auth/callback/google
   ```

5. **Save**

---

## 🔥 Update Firebase Authorized Domains

1. **Go to Firebase Console:** https://console.firebase.google.com

2. **Authentication** → **Settings** → **Authorized domains**

3. **Add domain:**
   ```
   your-site.netlify.app
   tripsang.netlify.app
   ```

4. **Save**

---

## 📝 Environment Variables Checklist

Mark each as you add them to Netlify:

### **Required (Must Have):**
- [ ] `AUTH_SECRET` - Generate with: `openssl rand -base64 32`
- [ ] `AUTH_URL` - Your Netlify URL
- [ ] `NEXT_PUBLIC_API_URL` - Backend URL (Render)
- [ ] `NEXT_PUBLIC_SOCKET_URL` - Backend URL (Render)
- [ ] `NEXT_PUBLIC_APP_NAME` - "TripSang"
- [ ] `NEXT_PUBLIC_APP_URL` - Your Netlify URL

### **Google OAuth (If Using):**
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`

### **Firebase (If Using):**
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`

### **Razorpay (If Using):**
- [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID`

---

## 🐛 Troubleshooting

### Issue: Build fails with "Module not found"

**Fix:**
```bash
cd client
npm install
```
Then redeploy.

### Issue: "Auth URL mismatch"

**Fix:** Make sure `AUTH_URL` matches your actual Netlify URL exactly.

### Issue: API calls fail (CORS error)

**Fix:** Update backend CORS settings to allow your Netlify domain:

In `server/index.js`:
```javascript
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://your-site.netlify.app',
  'https://tripsang.netlify.app',
];
```

### Issue: Environment variables not working

**Fix:**
1. Go to Netlify dashboard
2. Site settings → Environment variables
3. Verify all variables are set
4. Trigger new deploy

### Issue: 404 on page refresh

**Fix:** The `netlify.toml` file should handle this. If not:
1. Add `_redirects` file in `client/public/`:
   ```
   /*    /index.html   200
   ```

---

## ✅ Post-Deployment Checklist

After successful deployment:

- [ ] Site is accessible at Netlify URL
- [ ] Homepage loads correctly
- [ ] Can navigate between pages
- [ ] API calls work (check Network tab)
- [ ] Login/signup works
- [ ] Google OAuth works (if configured)
- [ ] Phone verification works (if configured)
- [ ] Trip creation works
- [ ] Chat works (Socket.io)
- [ ] Google Ads show (if enabled)
- [ ] Admin dashboard accessible (for admin users)

---

## 🔒 Security Best Practices

1. **Never commit `.env` files**
2. **Use Netlify's environment variables** (encrypted)
3. **Rotate secrets** regularly
4. **Enable HTTPS** (automatic on Netlify)
5. **Set up custom domain** for professional look
6. **Enable password protection** for staging sites

---

## 📊 Monitoring

**Netlify Analytics:**
1. Go to your site dashboard
2. Click "Analytics"
3. View traffic, performance, logs

**Build Logs:**
- Deploys → Click on a deploy → View logs
- Check for errors or warnings

---

## 🔄 Continuous Deployment

**Auto-Deploy on Git Push:**

Netlify automatically deploys when you push to GitHub!

```bash
git add .
git commit -m "Update homepage"
git push origin main
```

Netlify detects the push and rebuilds. ✅

---

## 🎉 Your Site is Live!

**Frontend:** `https://your-site.netlify.app`  
**Backend:** `https://tripsang.onrender.com`

**Share your URL and start getting users!** 🌍

---

## 📚 Helpful Links

- **Netlify Dashboard:** https://app.netlify.com
- **Netlify Docs:** https://docs.netlify.com
- **Next.js on Netlify:** https://docs.netlify.com/frameworks/next-js/
- **Custom Domains:** https://docs.netlify.com/domains-https/custom-domains/

---

**Need help?** Check Netlify support or the build logs for detailed error messages.

**Happy deploying! 🚀**
