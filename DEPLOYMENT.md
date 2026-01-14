# 🚀 Deployment Guide - TripSang

Complete guide for deploying TripSang to production.

## 📋 Pre-Deployment Checklist

- [ ] MongoDB Atlas cluster created and configured
- [ ] Firebase project created with Phone Auth enabled
- [ ] Razorpay account created (Test/Live keys ready)
- [ ] GitHub repository created and code pushed
- [ ] Environment variables documented

---

## 🗄️ MongoDB Atlas Setup

1. **Create Cluster**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster (Free tier works for development)
   - Choose a cloud provider and region

2. **Configure Network Access**
   - Navigate to Network Access
   - Add IP: `0.0.0.0/0` (Allow from anywhere) for Render

3. **Create Database User**
   - Go to Database Access
   - Create a user with password authentication
   - Grant "Read and write to any database" permission

4. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Format: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/`

---

## 🎨 Frontend Deployment (Netlify)

### Step 1: Prepare Repository
```bash
git add .
git commit -m "Initial TripSang setup"
git push origin main
```

### Step 2: Deploy to Netlify

1. **Go to [Netlify](https://app.netlify.com/)**
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure build settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/.next`

### Step 3: Environment Variables

Add these in Netlify Dashboard → Site settings → Environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://your-backend.onrender.com
AUTH_SECRET=your-nextauth-secret-key
AUTH_URL=https://your-site.netlify.app
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
```

### Step 4: Custom Domain (Optional)
- Go to Domain settings
- Add custom domain: `tripsang.com`
- Configure DNS records as instructed

---

## ⚙️ Backend Deployment (Render)

### Step 1: Create Web Service

1. **Go to [Render](https://render.com/)**
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `tripsang-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Instance Type**: Free (or Starter for production)

### Step 2: Environment Variables

Add these in Render Dashboard → Environment:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=tripsang
CLIENT_URL=https://your-site.netlify.app
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your-secret-key
```

### Step 3: Deploy
- Click "Create Web Service"
- Render will automatically deploy
- Note your service URL: `https://your-backend.onrender.com`

### Step 4: Update Frontend
- Go back to Netlify environment variables
- Update `NEXT_PUBLIC_API_URL` with your Render URL
- Trigger a new deploy

---

## 🔥 Firebase Setup (Phone Authentication)

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project: "TripSang"

2. **Enable Phone Authentication**
   - Go to Authentication → Sign-in methods
   - Enable "Phone" provider

3. **Get Configuration**
   - Go to Project Settings → General
   - Scroll to "Your apps" → Add web app
   - Copy Firebase config values
   - Add to your `.env.local`

4. **Configure Authorized Domains**
   - Go to Authentication → Settings → Authorized domains
   - Add your Netlify domain

---

## 💳 Razorpay Setup

1. **Create Account**
   - Sign up at [Razorpay](https://razorpay.com/)
   - Complete KYC verification

2. **Get API Keys**
   - Go to Settings → API Keys
   - Generate Key ID and Secret
   - Use Test keys for development
   - Use Live keys for production

3. **Configure Webhooks**
   - Go to Settings → Webhooks
   - Add webhook URL: `https://your-backend.onrender.com/api/razorpay/webhook`
   - Select events: payment.captured, payment.failed

---

## 🔒 Security Checklist

- [ ] All environment variables are set correctly
- [ ] JWT_SECRET is a strong, random string
- [ ] AUTH_SECRET is a strong, random string
- [ ] MongoDB user has limited permissions
- [ ] CORS is configured to only allow your domains
- [ ] Firebase authorized domains updated
- [ ] Razorpay webhook signature verification enabled

---

## 🧪 Testing Deployment

### Backend Health Check
```bash
curl https://your-backend.onrender.com/health
```

Should return:
```json
{
  "status": "OK",
  "message": "TripSang API is running",
  "timestamp": "2026-01-14T...",
  "environment": "production"
}
```

### Frontend Check
Visit `https://your-site.netlify.app` and verify:
- [ ] Page loads correctly
- [ ] No console errors
- [ ] Environment variables accessible

---

## 📊 Monitoring

### Render
- View logs in real-time
- Monitor CPU and memory usage
- Set up email alerts

### Netlify
- Check deploy logs
- Monitor function usage
- View analytics

### MongoDB Atlas
- Monitor database metrics
- Set up performance alerts
- Configure backup policies

---

## 🔄 Continuous Deployment

Both Netlify and Render support automatic deployments:
- Push to `main` branch → Auto-deploy to production
- Create `develop` branch → Set up staging environment

---

## 🆘 Troubleshooting

### Backend Issues
- **CORS errors**: Check CLIENT_URL matches exactly
- **MongoDB connection fails**: Verify connection string and IP whitelist
- **Port errors**: Render uses PORT environment variable (10000)

### Frontend Issues
- **API calls fail**: Verify NEXT_PUBLIC_API_URL is correct
- **Build fails**: Check all dependencies in package.json
- **Environment variables not working**: Must prefix with NEXT_PUBLIC_

---

## 📞 Support

For deployment issues, check:
- Netlify Status: https://www.netlifystatus.com/
- Render Status: https://status.render.com/
- MongoDB Atlas Status: https://status.mongodb.com/

---

**Ready to Deploy? Follow the steps above in order! 🚀**
